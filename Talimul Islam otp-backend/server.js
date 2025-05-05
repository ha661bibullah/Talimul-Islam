// server.js - সার্ভার সেটআপ
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// .env ফাইল থেকে কনফিগারেশন লোড করুন
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// মিডলওয়্যার
app.use(cors({
    origin: '*', // প্রোডাকশনে আপনার ফ্রন্টএন্ড URL দিন
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// স্ট্যাটিক ফাইল সার্ভ করার জন্য (যদি ফ্রন্টএন্ড এবং ব্যাকএন্ড একই সার্ভারে হয়)
app.use(express.static(path.join(__dirname, 'public')));

// ইমেইল ট্রান্সপোর্টার সেটআপ
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// সার্ভার পিংটেস্ট এন্ডপয়েন্ট
app.get('/ping', (req, res) => {
    console.log('Ping request received');
    res.json({ status: 'success', message: 'Server is running!' });
});

// OTP স্টোরেজ (প্রোডাকশনে কখনও মেমোরিতে রাখবেন না, ডাটাবেস ব্যবহার করুন)
const otpStorage = {};

// OTP জেনারেট করার ফাংশন
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// রুট: হোম পেইজ
app.get('/', (req, res) => {
    res.send('OTP ইমেইল API চালু আছে!');
});

// রুট: OTP পাঠানোর জন্য
app.post('/api/send-otp', async (req, res) => {
    try {
        console.log('OTP send request received:', req.body);
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'ইমেইল প্রদান করা হয়নি!' });
        }

        // OTP জেনারেট করুন
        const otp = generateOTP();
        console.log(`Generated OTP for ${email}: ${otp}`);
        
        // OTP স্টোর করুন (5 মিনিটের জন্য বৈধ)
        otpStorage[email] = {
            otp,
            createdAt: Date.now(),
            attempts: 0
        };

        // ইমেইল কনফিগারেশন
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'আপনার অ্যাকাউন্ট নিশ্চিতকরণ কোড',
            html: `
                <div style="font-family: 'Hind Siliguri', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #6A35F2; text-align: center;">নিশ্চিতকরণ কোড</h2>
                    <p style="font-size: 16px;">প্রিয় ব্যবহারকারী,</p>
                    <p style="font-size: 16px;">আপনার অ্যাকাউন্ট নিশ্চিত করার জন্য নিচের কোডটি ব্যবহার করুন:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 30px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${otp}</div>
                    </div>
                    <p style="font-size: 16px;">এই কোডটি <strong>২ মিনিট</strong> পর্যন্ত বৈধ থাকবে।</p>
                    <p style="font-size: 14px; color: #777; margin-top: 30px;">আপনি যদি এই অনুরোধটি না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
                </div>
            `
        };

        console.log('Attempting to send email with the following config:', {
            to: email,
            from: process.env.EMAIL_USER,
            subject: mailOptions.subject
        });

        // ইমেইল পাঠান
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);

        res.json({ success: true, message: 'OTP সফলভাবে পাঠানো হয়েছে!' });
    } catch (error) {
        console.error('OTP পাঠানোর সময় ত্রুটি:', error);
        res.status(500).json({ 
            success: false, 
            message: 'OTP পাঠাতে ব্যর্থ হয়েছে।',
            error: error.message
        });
    }
});

// রুট: OTP যাচাই করার জন্য
app.post('/api/verify-otp', (req, res) => {
    try {
        console.log('OTP verification request received:', req.body);
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'ইমেইল বা OTP প্রদান করা হয়নি!' });
        }

        // OTP স্টোরেজ থেকে ডেটা পাওয়া
        const otpData = otpStorage[email];
        console.log(`OTP data for ${email}:`, otpData);
        
        if (!otpData) {
            return res.status(400).json({ success: false, message: 'OTP মেয়াদ শেষ হয়েছে বা বৈধ নয়!' });
        }

        // চেক করুন OTP মেয়াদ শেষ হয়েছে কিনা (2 মিনিট = 120000 মিলিসেকেন্ড)
        const now = Date.now();
        if (now - otpData.createdAt > 120000) {
            delete otpStorage[email];
            return res.status(400).json({ success: false, message: 'OTP মেয়াদ শেষ হয়েছে!' });
        }
        
        // প্রচেষ্টার সংখ্যা বাড়ান
        otpData.attempts += 1;
        
        // সর্বাধিক 3টি প্রচেষ্টা
        if (otpData.attempts > 3) {
            delete otpStorage[email];
            return res.status(400).json({ success: false, message: 'অনেকবার ভুল চেষ্টা করা হয়েছে। আবার OTP পাঠান।' });
        }
        
        // OTP মিলে যায় কিনা
        if (otp !== otpData.otp) {
            return res.status(400).json({ 
                success: false, 
                message: `ভুল OTP! আবার চেষ্টা করুন। (${3 - otpData.attempts} চেষ্টা বাকি আছে)`
            });
        }
        
        // OTP সঠিক, স্টোরেজ থেকে মুছে ফেলুন
        delete otpStorage[email];
        console.log(`OTP verified successfully for ${email}`);
        
        res.json({ success: true, message: 'OTP সফলভাবে যাচাই করা হয়েছে!' });
    } catch (error) {
        console.error('OTP যাচাই করার সময় ত্রুটি:', error);
        res.status(500).json({ 
            success: false, 
            message: 'OTP যাচাই করতে ব্যর্থ হয়েছে।',
            error: error.message
        });
    }
});

// কিছু বেসিক এরর হ্যান্ডলিং যোগ করুন
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'এই URL টি খুঁজে পাওয়া যায়নি!' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'সার্ভারে একটি ত্রুটি দেখা দিয়েছে!' });
});

// সার্ভার শুরু করুন
app.listen(PORT, () => {
    console.log(`সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
    console.log('Environment variables loaded:', {
        PORT: PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set'
    });
});
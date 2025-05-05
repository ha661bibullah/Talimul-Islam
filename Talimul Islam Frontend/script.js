// User database using localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentEmail = '';
let otpTimer;

// API URL - আপনার সার্ভার URL এখানে সেট করুন
const API_URL = 'https://talimul-islam.onrender.com';

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Toggle between forms
function toggleForm(formType) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('emailCheckSection').style.display = 'none';
    document.getElementById('otpVerificationSection').style.display = 'none';
    document.getElementById('signupSection').style.display = 'none';
    
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('emailCheckForm').style.display = 'none';
    document.getElementById('otpVerificationForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    
    if (formType === 'login') {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('loginForm').style.display = 'block';
    } else if (formType === 'emailCheck') {
        document.getElementById('emailCheckSection').style.display = 'block';
        document.getElementById('emailCheckForm').style.display = 'block';
    } else if (formType === 'otpVerification') {
        document.getElementById('otpVerificationSection').style.display = 'block';
        document.getElementById('otpVerificationForm').style.display = 'block';
    } else if (formType === 'signup') {
        document.getElementById('signupSection').style.display = 'block';
        document.getElementById('signupForm').style.display = 'block';
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = 'লুকান';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = 'দেখুন';
    }
}

// Start OTP timer
function startOTPTimer() {
    let totalSeconds = 120; // 2 minutes
    
    clearInterval(otpTimer);
    document.getElementById('resendOtp').disabled = true;
    
    // Update timer display immediately
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    document.getElementById('timer').textContent = 
        (minutes < 10 ? '0' + minutes : minutes) + ':' + 
        (seconds < 10 ? '0' + seconds : seconds);
    
    otpTimer = setInterval(function() {
        totalSeconds--;
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        document.getElementById('timer').textContent = 
            (minutes < 10 ? '0' + minutes : minutes) + ':' + 
            (seconds < 10 ? '0' + seconds : seconds);
        
        if (totalSeconds <= 0) {
            clearInterval(otpTimer);
            document.getElementById('resendOtp').disabled = false;
        }
    }, 1000);
}

// Open modal
function openModal() {
    document.getElementById('successModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    toggleForm('login');
}

// Show loading spinner
function showLoading() {
    // আপনি চাইলে একটি লোডিং স্পিনার যোগ করতে পারেন
    document.body.style.cursor = 'wait';
}

// Hide loading spinner
function hideLoading() {
    document.body.style.cursor = 'default';
}

// Show error with specified message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show-error');
}

// Hide error
function hideError(elementId) {
    document.getElementById(elementId).classList.remove('show-error');
}

// When the page loads
window.onload = function() {
    // Set up OTP input fields for automatic focus
    const otpInputs = document.querySelectorAll('.otp-digit');
    
    for (let i = 0; i < otpInputs.length; i++) {
        otpInputs[i].addEventListener('input', function() {
            if (this.value.length === 1) {
                if (i < otpInputs.length - 1) {
                    otpInputs[i + 1].focus();
                }
            }
        });
        
        otpInputs[i].addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value.length === 0) {
                if (i > 0) {
                    otpInputs[i - 1].focus();
                }
            }
        });
    }
};

// Handle Email Check form submission
document.getElementById('emailCheckForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show-error');
    });
    
    const email = document.getElementById('checkEmail').value;
    let isValid = true;
    
    // Email validation
    if (!email || !validateEmail(email)) {
        document.getElementById('checkEmailError').classList.add('show-error');
        isValid = false;
    }
    
    if (isValid) {
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            document.getElementById('checkEmailError').textContent = 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট আছে';
            document.getElementById('checkEmailError').classList.add('show-error');
            return;
        }
        
        // Store the email for later use
        currentEmail = email;
        document.getElementById('userEmail').textContent = email;
        
        try {
            showLoading();
            
            // API কল - সার্ভারে OTP পাঠানোর অনুরোধ
            const response = await fetch(`${API_URL}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'OTP পাঠাতে ত্রুটি হয়েছে');
            }
            
            // Clear OTP input fields
            document.querySelectorAll('.otp-digit').forEach(input => {
                input.value = '';
            });
            
            // Start timer
            startOTPTimer();
            
            // Show OTP verification form
            toggleForm('otpVerification');
            
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'OTP পাঠাতে ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।');
        } finally {
            hideLoading();
        }
    }
});

// Handle Resend OTP button
document.getElementById('resendOtp').addEventListener('click', async function() {
    if (this.disabled) return;
    
    try {
        showLoading();
        this.disabled = true;
        
        // API কল - পুনরায় OTP পাঠানোর অনুরোধ
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentEmail }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'OTP পাঠাতে ত্রুটি হয়েছে');
        }
        
        // Clear OTP input fields
        document.querySelectorAll('.otp-digit').forEach(input => {
            input.value = '';
        });
        
        // Restart timer
        startOTPTimer();
        
        // Show message
        alert('নতুন অটিপি পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল চেক করুন।');
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'OTP পাঠাতে ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।');
        this.disabled = false;
    } finally {
        hideLoading();
    }
});

// Handle OTP Verification form submission
document.getElementById('otpVerificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Reset error messages
    document.getElementById('otpError').classList.remove('show-error');
    
    // Get entered OTP
    const enteredOTP = 
        document.getElementById('otp1').value +
        document.getElementById('otp2').value +
        document.getElementById('otp3').value +
        document.getElementById('otp4').value;
    
    // Validate OTP
    if (enteredOTP.length !== 4) {
        document.getElementById('otpError').textContent = 'অনুগ্রহ করে সম্পূর্ণ অটিপি দিন';
        document.getElementById('otpError').classList.add('show-error');
        return;
    }
    
    try {
        showLoading();
        
        // API কল - OTP যাচাই করার অনুরোধ
        const response = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: currentEmail,
                otp: enteredOTP
            }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Show error message
            document.getElementById('otpError').textContent = data.message;
            document.getElementById('otpError').classList.add('show-error');
            return;
        }
        
        // OTP is valid, proceed to final registration step
        clearInterval(otpTimer);
        toggleForm('signup');
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('otpError').textContent = error.message || 'OTP যাচাই করতে ত্রুটি হয়েছে।';
        document.getElementById('otpError').classList.add('show-error');
    } finally {
        hideLoading();
    }
});

// Handle Registration form submission
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show-error');
    });
    
    const name = document.getElementById('signupName').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    let isValid = true;
    
    // Name validation
    if (!name.trim()) {
        document.getElementById('signupNameError').classList.add('show-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        document.getElementById('signupPasswordError').classList.add('show-error');
        isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        document.getElementById('signupConfirmPasswordError').classList.add('show-error');
        isValid = false;
    }
    
    if (isValid) {
        // Add new user
        users.push({
            name: name,
            email: currentEmail,
            password: password,
            registeredAt: new Date().toISOString()
        });
        
        // Save to localStorage
        saveUsers();
        
        console.log('User registered:', users[users.length - 1]); // For demo purposes
        
        // Show success modal
        openModal();
        
        // Clear form fields
        document.getElementById('signupForm').reset();
    }
});

// Handle Login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show-error');
    });
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    let isValid = true;
    
    // Email validation
    if (!email || !validateEmail(email)) {
        document.getElementById('loginEmailError').classList.add('show-error');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        document.getElementById('loginPasswordError').classList.add('show-error');
        isValid = false;
    }
    
    if (isValid) {
        // Check if user exists
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            alert('সফলভাবে লগইন করা হয়েছে! স্বাগতম ' + user.name);
        } else {
            alert('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
    }
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize the page
toggleForm('login');
// User database using localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentEmail = '';
let otpTimer;

// API URL - আপনার সার্ভার URL এখানে সেট করুন
const API_URL = 'https://talimul-islam.onrender.com/send-otp';

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

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// When the page loads
window.onload = function() {
    // Initialize the page
    toggleForm('login');
    
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
    
    // Set up event listeners for password toggle buttons
    const passwordToggleButtons = document.querySelectorAll('.toggle-password');
    passwordToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const inputId = this.getAttribute('data-target');
            const toggleId = this.id;
            togglePasswordVisibility(inputId, toggleId);
        });
    });
    
    // Set up navigation buttons
    const goToEmailCheck = document.getElementById('goToEmailCheck');
    if (goToEmailCheck) {
        goToEmailCheck.addEventListener('click', function() {
            toggleForm('emailCheck');
        });
    }
    
    const goToLogin = document.getElementById('goToLogin');
    if (goToLogin) {
        goToLogin.addEventListener('click', function() {
            toggleForm('login');
        });
    }
    
    // Set up modal close button
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
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
        showError('checkEmailError', 'অনুগ্রহ করে একটি বৈধ ইমেইল লিখুন');
        isValid = false;
    }
    
    if (isValid) {
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            showError('checkEmailError', 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট আছে');
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
    hideError('otpError');
    
    // Get entered OTP
    const enteredOTP = 
        document.getElementById('otp1').value +
        document.getElementById('otp2').value +
        document.getElementById('otp3').value +
        document.getElementById('otp4').value;
    
    // Validate OTP
    if (enteredOTP.length !== 4) {
        showError('otpError', 'অনুগ্রহ করে সম্পূর্ণ অটিপি দিন');
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
            showError('otpError', data.message || 'অবৈধ OTP');
            return;
        }
        
        // OTP is valid, proceed to final registration step
        clearInterval(otpTimer);
        toggleForm('signup');
        
    } catch (error) {
        console.error('Error:', error);
        showError('otpError', error.message || 'OTP যাচাই করতে ত্রুটি হয়েছে।');
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
    
    const name = document.getElementById('signupName').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    let isValid = true;
    
    // Validation
    if (!name) {
        showError('signupNameError', 'নাম আবশ্যক');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showError('signupPasswordError', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('signupConfirmPasswordError', 'পাসওয়ার্ড মিলছে না');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Add new user
    const newUser = {
        name: name,
        email: currentEmail,
        password: password,
        registeredAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Save to localStorage
    saveUsers();
    
    console.log('User registered:', newUser); // For demo purposes
    
    // Show success modal
    openModal();
    
    // Clear form fields
    document.getElementById('signupForm').reset();
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
        showError('loginEmailError', 'অনুগ্রহ করে একটি বৈধ ইমেইল লিখুন');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showError('loginPasswordError', 'পাসওয়ার্ড আবশ্যক');
        isValid = false;
    }
    
    if (isValid) {
        // Check if user exists
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            alert('সফলভাবে লগইন করা হয়েছে! স্বাগতম ' + user.name);
            // এখানে লগইন সফল হওয়ার পর যেখানে রিডাইরেক্ট করতে চান সেখানে নিয়ে যেতে পারেন
            // window.location.href = "dashboard.html";
        } else {
            alert('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
    }
});




fetch('https://talimul-islam.onrender.com/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  .then(res => {
    if (!res.ok) throw new Error('Server Error: ' + res.status);
    return res.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
  
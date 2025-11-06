const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.MAIL_FROM || 'no-reply@campool.app';
const NODE_ENV = process.env.NODE_ENV || 'development';

let transporter;

function getTransporter() {
    if (!transporter) {
        console.log('🔧 SMTP Configuration:');
        console.log(`   Host: ${SMTP_HOST}`);
        console.log(`   Port: ${SMTP_PORT}`);
        console.log(`   User: ${SMTP_USER}`);
        console.log(`   Pass: ${SMTP_PASS ? '***' + SMTP_PASS.slice(-4) : 'NOT SET'}`);
        console.log(`   From: ${FROM_EMAIL}`);
        
        // If no SMTP configuration, use a test transporter for development
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
            console.log('⚠️  No SMTP configuration found. Using development mode (OTPs will be logged to console).');
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'ethereal.user@ethereal.email',
                    pass: 'ethereal.pass'
                }
            });
        } else {
            console.log('✅ SMTP configuration found. Creating transporter...');
            transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: SMTP_PORT === 465,
                auth: { user: SMTP_USER, pass: SMTP_PASS },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    }
    return transporter;
}

async function sendOtpEmail(to, otp) {
    console.log(`\n📧 Attempting to send OTP email to: ${to}`);
    
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
            <h2>Verify your student email</h2>
            <p>Your verification code is:</p>
            <div style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</div>
            <p>This code expires in 2 minutes. If you did not request this, you can ignore this email.</p>
        </div>
    `;

    // In development mode without proper SMTP, just log the OTP
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('\n📧 ===== OTP EMAIL (NO SMTP CONFIGURED) =====');
        console.log(`📧 To: ${to}`);
        console.log(`📧 Subject: Your Campool verification code`);
        console.log(`📧 OTP Code: ${otp}`);
        console.log(`📧 Expires in: 2 minutes`);
        console.log('📧 ===========================================\n');
        return Promise.resolve();
    }

    try {
        // Skip verification to save time - just send directly
        // Add aggressive timeout to prevent hanging
        const sendEmailWithTimeout = Promise.race([
            (async () => {
                // Skip verify() to save time - just send directly
                console.log('📤 Sending email directly (skipping verification)...');
                const info = await getTransporter().sendMail({
                    from: FROM_EMAIL,
                    to,
                    subject: 'Your Campool verification code',
                    html,
                    // Add connection timeout
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                });
                
                console.log('✅ OTP email sent successfully!');
                console.log(`📧 Message ID: ${info.messageId}`);
            })(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SMTP operation timed out after 8 seconds')), 8000)
            )
        ]);
        
        await sendEmailWithTimeout;
        
    } catch (error) {
        console.error('❌ Failed to send OTP email:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code || 'N/A'}`);
        
        // Fallback to console logging - this is critical for development
        console.log('\n📧 ===== OTP EMAIL (FALLBACK MODE) =====');
        console.log(`📧 To: ${to}`);
        console.log(`📧 Subject: Your Campool verification code`);
        console.log(`📧 OTP Code: ${otp}`);
        console.log(`📧 Expires in: 2 minutes`);
        console.log('📧 ===========================================\n');
        
        // Don't re-throw - email failure should not affect the API response
        // The OTP is already saved and valid
    }
}

module.exports = { sendOtpEmail };
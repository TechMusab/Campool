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
        return;
    }

    try {
        console.log('🔍 Verifying SMTP connection...');
        await getTransporter().verify();
        console.log('✅ SMTP connection verified successfully');
        
        console.log('📤 Sending email...');
        const info = await getTransporter().sendMail({
            from: FROM_EMAIL,
            to,
            subject: 'Your Campool verification code',
            html,
        });
        
        console.log('✅ OTP email sent successfully!');
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📧 Response: ${info.response}`);
        
    } catch (error) {
        console.error('❌ Failed to send OTP email:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Command: ${error.command}`);
        
        // Fallback to console logging in case of SMTP errors
        console.log('\n📧 ===== OTP EMAIL (FALLBACK MODE) =====');
        console.log(`📧 To: ${to}`);
        console.log(`📧 Subject: Your Campool verification code`);
        console.log(`📧 OTP Code: ${otp}`);
        console.log(`📧 Expires in: 2 minutes`);
        console.log('📧 ===========================================\n');
        
        // Re-throw the error so the calling function knows it failed
        throw error;
    }
}

module.exports = { sendOtpEmail };
// worker/src/services/email.js

/**
 * Email service - supports SendGrid and Resend
 * Set EMAIL_PROVIDER env var to 'sendgrid' or 'resend'
 */

export async function sendBookingEmails(env, bookingData) {
  try {
    // Send customer confirmation
    await sendEmail(env, {
      to: bookingData.email,
      subject: `Booking Confirmation - ${bookingData.serviceName}`,
      html: getCustomerConfirmationTemplate(bookingData),
      text: getCustomerConfirmationText(bookingData)
    });

    // Send admin notification
    await sendEmail(env, {
      to: env.ADMIN_EMAIL || 'admin@yourdomain.com',
      subject: `New Booking: ${bookingData.serviceName}`,
      html: getAdminNotificationTemplate(bookingData),
      text: getAdminNotificationText(bookingData)
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw - email failure shouldn't break booking
    return false;
  }
}

async function sendEmail(env, { to, subject, html, text }) {
  const provider = env.EMAIL_PROVIDER || 'sendgrid';

  if (provider === 'sendgrid') {
    return sendViaSendGrid(env, { to, subject, html, text });
  } else if (provider === 'resend') {
    return sendViaResend(env, { to, subject, html, text });
  } else {
    throw new Error(`Unsupported email provider: ${provider}`);
  }
}

async function sendViaSendGrid(env, { to, subject, html, text }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: env.FROM_EMAIL || 'noreply@yourdomain.com',
        name: env.FROM_NAME || 'One-Hour Services'
      },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid error: ${response.status}`);
  }

  return true;
}

async function sendViaResend(env, { to, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend error: ${error.message}`);
  }

  return true;
}

// Email Templates

function getCustomerConfirmationTemplate(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
    .booking-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: 600; color: #64748b; }
    .value { color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed!</h1>
      <p>Thank you for choosing our services</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.firstName},</p>
      
      <p>Your booking request has been received and confirmed. We're excited to work with you!</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <div class="detail-row">
          <span class="label">Booking ID:</span>
          <span class="value">${data.bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service:</span>
          <span class="value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Price Range:</span>
          <span class="value">$${data.servicePrice}</span>
        </div>
        <div class="detail-row">
          <span class="label">Preferred Date:</span>
          <span class="value">${new Date(data.preferredDate).toLocaleDateString()}</span>
        </div>
        ${data.preferredTime ? `
        <div class="detail-row">
          <span class="label">Preferred Time:</span>
          <span class="value">${data.preferredTime}</span>
        </div>
        ` : ''}
      </div>
      
      <h3>What's Next?</h3>
      <ol>
        <li>We'll review your request within 24 hours</li>
        <li>You'll receive a confirmation email with next steps</li>
        <li>We'll schedule your service at your preferred time</li>
        <li>Your project will be completed within 60 minutes!</li>
      </ol>
      
      <p>If you have any questions, feel free to reply to this email.</p>
      
      <p>Best regards,<br>The One-Hour Services Team</p>
    </div>
    
    <div class="footer">
      <p>Booking ID: ${data.bookingId}</p>
      <p>&copy; 2024 One-Hour Services. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getCustomerConfirmationText(data) {
  return `
Booking Confirmed!

Hi ${data.firstName},

Your booking request has been received and confirmed. We're excited to work with you!

Booking Details:
- Booking ID: ${data.bookingId}
- Service: ${data.serviceName}
- Price Range: $${data.servicePrice}
- Preferred Date: ${new Date(data.preferredDate).toLocaleDateString()}
${data.preferredTime ? `- Preferred Time: ${data.preferredTime}` : ''}

What's Next?
1. We'll review your request within 24 hours
2. You'll receive a confirmation email with next steps
3. We'll schedule your service at your preferred time
4. Your project will be completed within 60 minutes!

If you have any questions, feel free to reply to this email.

Best regards,
The One-Hour Services Team

Booking ID: ${data.bookingId}
  `;
}

function getAdminNotificationTemplate(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f172a; color: white; padding: 20px; }
    .content { background: white; padding: 20px; border: 1px solid #e2e8f0; }
    .booking-details { background: #f8fafc; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .detail { margin: 8px 0; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Booking Received</h2>
    </div>
    
    <div class="content">
      <div class="booking-details">
        <h3>Booking Information</h3>
        <div class="detail"><span class="label">Booking ID:</span> ${data.bookingId}</div>
        <div class="detail"><span class="label">Service:</span> ${data.serviceName}</div>
        <div class="detail"><span class="label">Price:</span> $${data.servicePrice}</div>
        <div class="detail"><span class="label">Date:</span> ${new Date(data.preferredDate).toLocaleDateString()}</div>
        ${data.preferredTime ? `<div class="detail"><span class="label">Time:</span> ${data.preferredTime}</div>` : ''}
      </div>
      
      <div class="booking-details">
        <h3>Customer Information</h3>
        <div class="detail"><span class="label">Name:</span> ${data.firstName} ${data.lastName}</div>
        <div class="detail"><span class="label">Email:</span> ${data.email}</div>
        <div class="detail"><span class="label">Phone:</span> ${data.phone}</div>
        ${data.businessName ? `<div class="detail"><span class="label">Business:</span> ${data.businessName}</div>` : ''}
      </div>
      
      ${data.message ? `
      <div class="booking-details">
        <h3>Customer Message</h3>
        <p>${data.message}</p>
      </div>
      ` : ''}
      
      <p><strong>Action Required:</strong> Please review and confirm this booking within 24 hours.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getAdminNotificationText(data) {
  return `
New Booking Received

Booking ID: ${data.bookingId}
Service: ${data.serviceName}
Price: $${data.servicePrice}
Date: ${new Date(data.preferredDate).toLocaleDateString()}
${data.preferredTime ? `Time: ${data.preferredTime}` : ''}

Customer Information:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
${data.businessName ? `Business: ${data.businessName}` : ''}

${data.message ? `Message: ${data.message}` : ''}

Action Required: Please review and confirm this booking within 24 hours.
  `;
}

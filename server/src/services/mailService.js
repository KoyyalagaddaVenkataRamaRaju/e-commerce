import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  })
}

function requireMailConfig() {
  const missing = []
  if (!env.smtpHost) missing.push('SMTP_HOST')
  if (!env.smtpUser) missing.push('SMTP_USER')
  if (!env.smtpPass) missing.push('SMTP_PASS')

  if (missing.length > 0) {
    const error = new Error(`Email is not configured. Missing: ${missing.join(', ')}`)
    error.statusCode = 503
    error.code = 'MAIL_CONFIG_MISSING'
    error.publicMessage = `Email service is not configured. Missing: ${missing.join(', ')}`
    throw error
  }
}

export function getMailConfigStatus() {
  const missing = []
  if (!env.smtpHost) missing.push('SMTP_HOST')
  if (!env.smtpUser) missing.push('SMTP_USER')
  if (!env.smtpPass) missing.push('SMTP_PASS')

  return {
    configured: missing.length === 0,
    missing,
    host: env.smtpHost || null,
    port: env.smtpPort,
    userConfigured: Boolean(env.smtpUser),
    fromConfigured: Boolean(env.mailFrom),
  }
}

export async function sendMail({ to, subject, html }) {
  requireMailConfig()

  try {
    return await createTransporter().sendMail({
      from: env.mailFrom,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email send failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    })

    const mailError = new Error('Email service could not send the message. Check SMTP credentials on Render.')
    mailError.statusCode = 502
    mailError.code = 'MAIL_SEND_FAILED'
    mailError.publicMessage = mailError.message
    throw mailError
  }
}

export async function sendOtpEmail(email, code, purpose = 'verification') {
  return sendMail({
    to: email,
    subject: `Your Varma Hardware ${purpose} OTP`,
    html: `
      <h2>Varma Hardware OTP</h2>
      <p>Your one-time password is <strong>${code}</strong>.</p>
      <p>This code expires in 10 minutes.</p>
    `,
  })
}

export function orderConfirmationTemplate(order) {
  const itemRows = order.items
    .map((item) => `<li>${item.name} x ${item.quantity} - Rs. ${item.price * item.quantity}</li>`)
    .join('')

  return `
    <h2>Order confirmed</h2>
    <p>Thank you for ordering from Varma Hardware Enterprises.</p>
    <p><strong>Order:</strong> ${order._id}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><strong>Payment:</strong> ${order.payment?.method?.toUpperCase() || 'COD'}</p>
    <p><strong>Total:</strong> Rs. ${order.total}</p>
    <p><strong>Delivery:</strong> ${order.shippingAddress?.line1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}</p>
    <ul>${itemRows}</ul>
  `
}

export function orderReceiptTemplate(order) {
  const itemRows = order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.name}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity} ${item.unit}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. ${item.price.toLocaleString('en-IN')}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs. ${lineTotal.toLocaleString('en-IN')}</td>
        </tr>
      `
    })
    .join('')

  const address = order.shippingAddress || {}
  const paidAt = order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#172033;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#113f3a;color:#ffffff;padding:22px;">
          <h1 style="margin:0;font-size:24px;">Varma Hardware Enterprises</h1>
          <p style="margin:8px 0 0;color:#d1fae5;">Bill receipt for delivered order</p>
        </div>
        <div style="padding:22px;">
          <h2 style="margin:0 0 12px;">Thank you for your purchase.</h2>
          <p style="margin:0 0 18px;color:#475569;">Your order has been delivered. Please keep this receipt for your records.</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            <tr>
              <td style="padding:8px 0;color:#64748b;">Order ID</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;">${order._id}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;">Delivered on</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;">${paidAt}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;">Payment</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;">${order.payment?.method?.toUpperCase() || 'COD'} - ${order.payment?.status || 'paid'}</td>
            </tr>
          </table>

          <div style="margin-bottom:18px;">
            <strong>Bill to</strong>
            <p style="margin:6px 0 0;color:#475569;line-height:1.6;">
              ${address.fullName || ''}<br />
              ${address.phone || ''}<br />
              ${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px;text-align:left;">Item</th>
                <th style="padding:10px;text-align:center;">Qty</th>
                <th style="padding:10px;text-align:right;">Rate</th>
                <th style="padding:10px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;margin-top:18px;">
            <tr>
              <td style="padding:7px 0;color:#64748b;">Subtotal</td>
              <td style="padding:7px 0;text-align:right;">Rs. ${order.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#64748b;">Tax</td>
              <td style="padding:7px 0;text-align:right;">Rs. ${order.tax.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#64748b;">Delivery fee</td>
              <td style="padding:7px 0;text-align:right;">Rs. ${order.deliveryFee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #e5e7eb;font-size:18px;font-weight:800;">Total paid</td>
              <td style="padding:12px 0;border-top:1px solid #e5e7eb;text-align:right;font-size:18px;font-weight:800;">Rs. ${order.total.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `
}

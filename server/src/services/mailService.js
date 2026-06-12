import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

function createTransporter(options = {}) {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: options.port ?? env.smtpPort,
    secure: options.secure ?? env.smtpSecure,
    requireTLS: options.requireTLS ?? env.smtpRequireTls,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
}

function isGmailSmtp() {
  return env.smtpHost?.toLowerCase() === 'smtp.gmail.com'
}

function isConnectionTimeout(error) {
  return error.code === 'ETIMEDOUT' || error.code === 'ESOCKET'
}

function gmailSslFallback() {
  if (!isGmailSmtp() || env.smtpPort === 465) return null
  return { port: 465, secure: true, requireTLS: false }
}

function emailAddress(value) {
  return value?.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() || value?.trim().toLowerCase()
}

function maskEmail(value) {
  const email = emailAddress(value)
  if (!email) return null

  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function getSmtpFailureMessage(error) {
  const response = error.response || error.message || ''

  if (error.code === 'EAUTH' || response.includes('535')) {
    return 'Gmail rejected the SMTP login. Regenerate the Gmail app password, enter it without spaces or quotes, and confirm 2-Step Verification is enabled.'
  }

  if (response.includes('Username and Password not accepted')) {
    return 'Gmail says the username or app password is not accepted.'
  }

  if (response.includes('Invalid login')) {
    return 'The SMTP provider rejected the login credentials.'
  }

  if (error.code === 'EENVELOPE' || response.includes('From')) {
    return 'The sender address was rejected. For Gmail, MAIL_FROM must use the same Gmail address as SMTP_USER or a verified Gmail alias.'
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
    return 'The SMTP connection timed out from Render. For Gmail on Render, use SMTP_PORT=465, SMTP_SECURE=true, and SMTP_REQUIRE_TLS=false.'
  }

  return 'SMTP rejected the request. Check Render logs for the provider response.'
}

function requireMailConfig() {
  const missing = []
  if (!env.smtpHost) missing.push('SMTP_HOST or EMAIL_HOST')
  if (!env.smtpUser) missing.push('SMTP_USER or EMAIL_USER')
  if (!env.smtpPass) missing.push('SMTP_PASS or EMAIL_PASS')

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
  if (!env.smtpHost) missing.push('SMTP_HOST or EMAIL_HOST')
  if (!env.smtpUser) missing.push('SMTP_USER or EMAIL_USER')
  if (!env.smtpPass) missing.push('SMTP_PASS or EMAIL_PASS')

  return {
    configured: missing.length === 0,
    missing,
    host: env.smtpHost || null,
    port: env.smtpPort,
    secure: env.smtpSecure,
    requireTLS: env.smtpRequireTls,
    user: maskEmail(env.smtpUser),
    from: maskEmail(env.mailFrom),
    fromMatchesUser: emailAddress(env.mailFrom) === emailAddress(env.smtpUser),
    userConfigured: Boolean(env.smtpUser),
    passConfigured: Boolean(env.smtpPass),
    fromConfigured: Boolean(env.mailFrom),
  }
}

export async function verifyMailConnection() {
  requireMailConfig()

  try {
    await createTransporter().verify()
    return { ok: true, transport: { port: env.smtpPort, secure: env.smtpSecure, requireTLS: env.smtpRequireTls } }
  } catch (error) {
    const fallback = isConnectionTimeout(error) ? gmailSslFallback() : null
    if (fallback) {
      try {
        await createTransporter(fallback).verify()
        return { ok: true, transport: fallback, fallback: true }
      } catch (fallbackError) {
        console.error('Email verify fallback failed:', {
          code: fallbackError.code,
          command: fallbackError.command,
          response: fallbackError.response,
          message: fallbackError.message,
        })
      }
    }

    console.error('Email verify failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    })

    const hint = getSmtpFailureMessage(error)
    const mailError = new Error(`Email service login failed. ${hint}`)
    mailError.statusCode = 502
    mailError.code = 'MAIL_VERIFY_FAILED'
    mailError.publicMessage = mailError.message
    mailError.details = {
      smtpCode: error.code,
      smtpCommand: error.command,
      hint,
    }
    throw mailError
  }
}

export async function sendMail({ to, subject, html }) {
  requireMailConfig()
  const message = {
    from: env.mailFrom,
    to,
    subject,
    text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    html,
  }

  try {
    return await createTransporter().sendMail(message)
  } catch (error) {
    const fallback = isConnectionTimeout(error) ? gmailSslFallback() : null
    if (fallback) {
      try {
        return await createTransporter(fallback).sendMail(message)
      } catch (fallbackError) {
        console.error('Email send fallback failed:', {
          code: fallbackError.code,
          command: fallbackError.command,
          response: fallbackError.response,
          message: fallbackError.message,
        })
      }
    }

    console.error('Email send failed:', {
      code: error.code,
      command: error.command,
      response: error.response,
      message: error.message,
    })

    const hint = getSmtpFailureMessage(error)
    const mailError = new Error(`Email service could not send the message. ${hint}`)
    mailError.statusCode = 502
    mailError.code = 'MAIL_SEND_FAILED'
    mailError.publicMessage = mailError.message
    mailError.details = {
      smtpCode: error.code,
      smtpCommand: error.command,
      hint,
    }
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

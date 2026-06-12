function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return undefined
}

function booleanEnv(...names) {
  const value = firstEnv(...names)
  if (!value) return undefined
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const smtpUser = firstEnv('SMTP_USER', 'EMAIL_USER', 'MAIL_USER', 'GMAIL_USER')
const smtpPort = Number(firstEnv('SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT') || 587)

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: firstEnv('CLIENT_URL') || 'http://localhost:5173',
  mongoUri: firstEnv('MONGO_URI'),
  jwtSecret: firstEnv('JWT_SECRET'),
  razorpayKeyId: firstEnv('RAZORPAY_KEY_ID'),
  razorpayKeySecret: firstEnv('RAZORPAY_KEY_SECRET'),
  smtpHost: firstEnv('SMTP_HOST', 'EMAIL_HOST', 'MAIL_HOST'),
  smtpPort,
  smtpSecure: booleanEnv('SMTP_SECURE', 'EMAIL_SECURE', 'MAIL_SECURE') ?? smtpPort === 465,
  smtpRequireTls: booleanEnv('SMTP_REQUIRE_TLS', 'EMAIL_REQUIRE_TLS', 'MAIL_REQUIRE_TLS') ?? smtpPort === 587,
  smtpUser,
  smtpPass: firstEnv('SMTP_PASS', 'EMAIL_PASS', 'MAIL_PASS', 'GMAIL_APP_PASSWORD'),
  mailFrom: firstEnv('MAIL_FROM', 'SMTP_FROM', 'EMAIL_FROM') || (smtpUser ? `Varma Hardware <${smtpUser}>` : undefined),
  adminName: firstEnv('ADMIN_NAME') || 'Store Admin',
  adminEmail: firstEnv('ADMIN_EMAIL') || 'admin@varmahardware.local',
  adminPhone: firstEnv('ADMIN_PHONE') || '9999999999',
  adminPassword: firstEnv('ADMIN_PASSWORD') || 'Admin@12345',
}

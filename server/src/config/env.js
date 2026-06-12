function firstEnv(...names) {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name])
    if (value) return value
  }
  return undefined
}

function cleanEnvValue(value) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

function booleanEnv(...names) {
  const value = firstEnv(...names)
  if (!value) return undefined
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function emailAddress(value) {
  return value?.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() || value?.trim().toLowerCase()
}

function normalizeSmtpPass(host, password) {
  if (!password) return undefined

  if (host?.toLowerCase() === 'smtp.gmail.com') {
    return password.replace(/\s+/g, '')
  }

  return password
}

function normalizeMailFrom({ host, user, value }) {
  if (!user) return undefined

  const fallback = `Varma Hardware <${user}>`
  if (!value) return fallback

  if (host?.toLowerCase() === 'smtp.gmail.com' && emailAddress(value) !== user.toLowerCase()) {
    return fallback
  }

  return value
}

const smtpHost = firstEnv('SMTP_HOST', 'EMAIL_HOST', 'MAIL_HOST')
const smtpUser = firstEnv('SMTP_USER', 'EMAIL_USER', 'MAIL_USER', 'GMAIL_USER')
const smtpPort = Number(firstEnv('SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT') || 587)
const smtpPass = normalizeSmtpPass(smtpHost, firstEnv('SMTP_PASS', 'EMAIL_PASS', 'MAIL_PASS', 'GMAIL_APP_PASSWORD'))
const mailFrom = normalizeMailFrom({
  host: smtpHost,
  user: smtpUser,
  value: firstEnv('MAIL_FROM', 'SMTP_FROM', 'EMAIL_FROM'),
})

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: firstEnv('CLIENT_URL') || 'http://localhost:5173',
  mongoUri: firstEnv('MONGO_URI'),
  jwtSecret: firstEnv('JWT_SECRET'),
  razorpayKeyId: firstEnv('RAZORPAY_KEY_ID'),
  razorpayKeySecret: firstEnv('RAZORPAY_KEY_SECRET'),
  smtpHost,
  smtpPort,
  smtpSecure: booleanEnv('SMTP_SECURE', 'EMAIL_SECURE', 'MAIL_SECURE') ?? smtpPort === 465,
  smtpRequireTls: booleanEnv('SMTP_REQUIRE_TLS', 'EMAIL_REQUIRE_TLS', 'MAIL_REQUIRE_TLS') ?? smtpPort === 587,
  smtpUser,
  smtpPass,
  mailFrom,
  adminName: firstEnv('ADMIN_NAME') || 'Store Admin',
  adminEmail: firstEnv('ADMIN_EMAIL') || 'admin@varmahardware.local',
  adminPhone: firstEnv('ADMIN_PHONE') || '9999999999',
  adminPassword: firstEnv('ADMIN_PASSWORD') || 'Admin@12345',
}

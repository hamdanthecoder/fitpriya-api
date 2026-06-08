const express = require('express')
const admin = require('firebase-admin')
require('../middleware/auth')
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService')

const router = express.Router()

async function verifyFirebaseTokenAllowUnverified(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(header.split(' ')[1])
    req.uid = decoded.uid
    req.email = decoded.email ?? ''
    req.emailVerified = decoded.email_verified === true
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

router.post('/send-verification-email', verifyFirebaseTokenAllowUnverified, async (req, res) => {
  try {
    if (!req.email) {
      return res.status(400).json({ success: false, message: 'No email found for this account' })
    }

    if (req.emailVerified) {
      return res.json({ success: true, alreadyVerified: true })
    }

    const link = await admin.auth().generateEmailVerificationLink(req.email, {
      url: process.env.EMAIL_VERIFICATION_CONTINUE_URL || 'https://fitpriya.online/email-verified',
      handleCodeInApp: false,
    })

    const result = await sendVerificationEmail({ to: req.email, link })
    if (!result.configured) {
      return res.status(503).json({
        success: false,
        code: 'email-provider-not-configured',
        message: 'Custom email provider is not configured',
      })
    }

    return res.json({ success: true, provider: result.provider })
  } catch (err) {
    console.error('[Auth] custom verification email failed:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Could not send verification email',
    })
  }
})

router.post('/send-password-reset-email', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' })
  }

  try {
    await admin.auth().getUserByEmail(email)
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.json({ success: true })
    }
    console.error('[Auth] reset email user lookup failed:', err.message)
    return res.status(500).json({ success: false, message: 'Could not send reset email' })
  }

  try {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: process.env.EMAIL_RESET_CONTINUE_URL || 'https://fitpriya.online/password-reset',
      handleCodeInApp: false,
    })

    const result = await sendPasswordResetEmail({ to: email, link })
    if (!result.configured) {
      return res.status(503).json({
        success: false,
        code: 'email-provider-not-configured',
        message: 'Custom email provider is not configured',
      })
    }

    return res.json({ success: true, provider: result.provider })
  } catch (err) {
    console.error('[Auth] custom password reset email failed:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Could not send reset email',
    })
  }
})

module.exports = router

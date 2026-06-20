const { getFirebaseAuth } = require('../utils/firebaseAdmin')

module.exports = async function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }
  const token = header.split(' ')[1]
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token)
    const provider = decoded.firebase?.sign_in_provider
    if (provider === 'password' && decoded.email_verified === false) {
      return res.status(403).json({
        success: false,
        code: 'email-not-verified',
        message: 'Please verify your email before continuing',
      })
    }
    req.uid = decoded.uid
    req.email = decoded.email ?? ''
    req.emailVerified = decoded.email_verified === true
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

const admin = require('firebase-admin')

// Initialize Firebase Admin once
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  let serviceAccount = null
  if (raw) {
    // Accept both plain JSON and base64-encoded JSON (base64 is easier to paste into Render)
    try {
      serviceAccount = JSON.parse(raw)
    } catch {
      try {
        serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
      } catch {}
    }
  }
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  } else {
    admin.initializeApp()
  }
}

module.exports = async function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }
  const token = header.split(' ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.uid = decoded.uid
    req.email = decoded.email ?? ''
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

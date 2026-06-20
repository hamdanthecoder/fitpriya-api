const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

function parseServiceAccount(raw) {
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    } catch {
      return null
    }
  }
}

function ensureFirebaseAdmin() {
  if (getApps().length) return

  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) })
    return
  }

  initializeApp()
}

function getFirebaseAuth() {
  ensureFirebaseAdmin()
  return getAuth()
}

module.exports = {
  ensureFirebaseAdmin,
  getFirebaseAuth,
}

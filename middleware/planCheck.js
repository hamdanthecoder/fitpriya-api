const User = require('../models/User')

/**
 * Middleware: requires user to have an active 'pro' plan.
 * Must be used AFTER verifyToken (needs req.uid).
 */
module.exports = async function requirePro(req, res, next) {
  try {
    const user = await User.findOne({ uid: req.uid }).lean()

    if (!user) {
      return res.status(403).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    if (user.plan !== 'pro') {
      return res.status(403).json({
        success: false,
        message: 'Pro plan required to access this feature',
        code: 'PLAN_REQUIRED',
      })
    }

    // Check expiry
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      // Auto-downgrade expired plan
      await User.findOneAndUpdate({ uid: req.uid }, { $set: { plan: 'free', planExpiresAt: null } })
      return res.status(403).json({
        success: false,
        message: 'Your Pro plan has expired. Please renew.',
        code: 'PLAN_EXPIRED',
      })
    }

    req.userPlan = 'pro'
    req.userProfile = user
    next()
  } catch (err) {
    res.status(500).json({ success: false, message: 'Plan check failed' })
  }
}

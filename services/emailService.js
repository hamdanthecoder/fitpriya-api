const DEFAULT_FROM = 'FitPriya <noreply@fitpriya.online>'

function verificationHtml({ link }) {
  return `
    <div style="margin:0;padding:0;background:#f3fbf7;font-family:Arial,Helvetica,sans-serif;color:#17231f;">
      <div style="max-width:560px;margin:0 auto;padding:32px 18px;">
        <div style="background:#ffffff;border:1px solid #dce8e3;border-radius:18px;padding:30px;">
          <div style="font-size:24px;font-weight:800;color:#1D9E75;margin-bottom:14px;">FitPriya</div>
          <h1 style="font-size:24px;line-height:32px;margin:0 0 14px;color:#17231f;">Verify your email</h1>
          <p style="font-size:15px;line-height:24px;margin:0 0 18px;color:#60736b;">
            Welcome to FitPriya. Please verify your email address to finish setting up your account.
          </p>
          <a href="${link}" style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;font-weight:800;border-radius:12px;padding:14px 22px;margin:8px 0 20px;">
            Verify Email
          </a>
          <p style="font-size:13px;line-height:21px;margin:0 0 12px;color:#60736b;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="word-break:break-all;font-size:12px;line-height:18px;margin:0 0 20px;color:#087A5B;">${link}</p>
          <p style="font-size:13px;line-height:21px;margin:0;color:#7a8b84;">
            If you did not create a FitPriya account, you can safely ignore this email.
          </p>
        </div>
        <p style="text-align:center;font-size:12px;line-height:18px;color:#7a8b84;margin:18px 0 0;">
          FitPriya Team<br/>xbrostudioind@gmail.com
        </p>
      </div>
    </div>
  `
}

function verificationText({ link }) {
  return [
    'Welcome to FitPriya.',
    '',
    'Please verify your email address to finish setting up your account.',
    '',
    `Verify email: ${link}`,
    '',
    'If you did not create a FitPriya account, you can safely ignore this email.',
    '',
    'FitPriya Team',
    'xbrostudioind@gmail.com',
  ].join('\n')
}

function passwordResetHtml({ link }) {
  return `
    <div style="margin:0;padding:0;background:#f3fbf7;font-family:Arial,Helvetica,sans-serif;color:#17231f;">
      <div style="max-width:560px;margin:0 auto;padding:32px 18px;">
        <div style="background:#ffffff;border:1px solid #dce8e3;border-radius:18px;padding:30px;">
          <div style="font-size:24px;font-weight:800;color:#1D9E75;margin-bottom:14px;">FitPriya</div>
          <h1 style="font-size:24px;line-height:32px;margin:0 0 14px;color:#17231f;">Reset your password</h1>
          <p style="font-size:15px;line-height:24px;margin:0 0 18px;color:#60736b;">
            We received a request to reset your FitPriya password. Use the button below to create a new password.
          </p>
          <a href="${link}" style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;font-weight:800;border-radius:12px;padding:14px 22px;margin:8px 0 20px;">
            Reset Password
          </a>
          <p style="font-size:13px;line-height:21px;margin:0 0 12px;color:#60736b;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="word-break:break-all;font-size:12px;line-height:18px;margin:0 0 20px;color:#087A5B;">${link}</p>
          <p style="font-size:13px;line-height:21px;margin:0;color:#7a8b84;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
        <p style="text-align:center;font-size:12px;line-height:18px;color:#7a8b84;margin:18px 0 0;">
          FitPriya Team<br/>xbrostudioind@gmail.com
        </p>
      </div>
    </div>
  `
}

function passwordResetText({ link }) {
  return [
    'Reset your FitPriya password.',
    '',
    'We received a request to reset your FitPriya password. Use the link below to create a new password.',
    '',
    `Reset password: ${link}`,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    'FitPriya Team',
    'xbrostudioind@gmail.com',
  ].join('\n')
}

async function sendWithResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { configured: false, provider: 'resend' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject,
      html,
      text,
      reply_to: process.env.EMAIL_REPLY_TO || 'xbrostudioind@gmail.com',
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.message || body?.error || 'Email provider failed')
    err.status = res.status
    err.code = body?.name || body?.code || body?.error || 'email-provider-failed'
    throw err
  }

  return { configured: true, provider: 'resend', id: body.id }
}

async function sendVerificationEmail({ to, link }) {
  const subject = process.env.EMAIL_VERIFY_SUBJECT || 'Verify your FitPriya account'
  const html = verificationHtml({ link })
  const text = verificationText({ link })
  return sendWithResend({ to, subject, html, text })
}

async function sendPasswordResetEmail({ to, link }) {
  const subject = process.env.EMAIL_RESET_SUBJECT || 'Reset your FitPriya password'
  const html = passwordResetHtml({ link })
  const text = passwordResetText({ link })
  return sendWithResend({ to, subject, html, text })
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
}

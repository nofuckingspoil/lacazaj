// Brevo — service d'envoi d'emails transactionnels
// API REST directe (pas besoin du SDK)

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SENDER = { name: 'La Caza J — Jayjay', email: 'lacazaj@proton.me' }

interface EmailPayload {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
}

async function sendEmail(payload: EmailPayload) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ sender: SENDER, ...payload }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo error:', err)
    throw new Error(`Brevo: ${res.status} ${err}`)
  }
  return res.json()
}

// ── Helpers visuels ──────────────────────────────────────────────

function emailWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>La Caza J</title>
</head>
<body style="margin:0;padding:0;background:#ede5d4;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ede5d4;padding:32px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#FAF3E7;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(43,32,23,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:#C45C39;padding:24px 32px;text-align:center;">
          <div style="font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">la</div>
          <div style="font-family:Georgia,serif;font-size:28px;color:#fff;letter-spacing:0.5px;">La Caza J</div>
        </td>
      </tr>

      <!-- Content -->
      <tr><td style="padding:32px;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F1E5D1;padding:20px 32px;text-align:center;border-top:1px solid rgba(43,32,23,0.10);">
          <p style="margin:0;font-size:12px;color:#9C8E7C;">La Caza J · Saint-André-des-Eaux (44)</p>
          <p style="margin:6px 0 0;font-size:12px;color:#9C8E7C;">
            <a href="https://instagram.com/la_caza_j" style="color:#C45C39;text-decoration:none;">@la_caza_j</a>
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#9C8E7C;">
            Vous pouvez <a href="{{unsubscribe_url}}" style="color:#9C8E7C;">vous désabonner</a> des emails de rappel.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function pickupCard(pickupDate: string, slotLabel: string, address: string) {
  return `
  <div style="background:#E6EBDA;border-radius:12px;padding:18px 20px;margin:20px 0;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#4A6232;margin-bottom:6px;">Votre retrait</div>
    <div style="font-family:Georgia,serif;font-size:22px;color:#4A6232;margin-bottom:8px;">${pickupDate} · ${slotLabel}</div>
    <div style="font-size:13px;color:#5E7A41;">📍 ${address}</div>
  </div>`
}

// ── Email 1 — Confirmation de commande ───────────────────────────

interface ConfirmationData {
  toEmail: string
  toName: string
  ref: string
  pickupDate: string
  slotLabel: string
  address: string
  lines: { name: string; qty: number; subtotalCents: number }[]
  totalCents: number
}

export async function sendConfirmationEmail(data: ConfirmationData) {
  const eur = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

  const linesHtml = data.lines.map(l => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(43,32,23,0.08);font-size:14px;">${l.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(43,32,23,0.08);font-size:14px;color:#6E6051;text-align:center;">${l.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(43,32,23,0.08);font-size:14px;font-weight:700;text-align:right;">${eur(l.subtotalCents)}</td>
    </tr>`).join('')

  const content = `
    <h1 style="font-family:Georgia,serif;font-size:28px;color:#2B2017;margin:0 0 6px;">Merci ${data.toName ? `, ${data.toName.split(' ')[0]}` : ''} !</h1>
    <p style="font-size:15px;color:#6E6051;margin:0 0 4px;">Votre commande <strong style="color:#2B2017;">${data.ref}</strong> est confirmée.</p>
    <p style="font-size:15px;color:#6E6051;margin:0 0 20px;">Jayjay s'occupe du reste 🎉</p>

    ${pickupCard(data.pickupDate, data.slotLabel, data.address)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <th style="text-align:left;font-size:11px;color:#9C8E7C;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:8px;">Produit</th>
        <th style="text-align:center;font-size:11px;color:#9C8E7C;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:8px;">Qté</th>
        <th style="text-align:right;font-size:11px;color:#9C8E7C;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:8px;">Montant</th>
      </tr>
      ${linesHtml}
      <tr>
        <td colspan="2" style="padding-top:12px;font-size:16px;font-weight:800;">Total payé</td>
        <td style="padding-top:12px;font-size:18px;font-weight:800;text-align:right;color:#A2462A;">${eur(data.totalCents)}</td>
      </tr>
    </table>

    <div style="background:#F6E9CE;border-radius:10px;padding:14px 16px;font-size:13px;color:#6E6051;margin-top:20px;">
      ℹ️ Vous recevrez un rappel la veille de votre retrait avec les instructions de réchauffage.
    </div>`

  return sendEmail({
    to: [{ email: data.toEmail, name: data.toName }],
    subject: `✅ Commande confirmée — La Caza J (${data.ref})`,
    htmlContent: emailWrapper(content),
  })
}

// ── Email 2 — Rappel la veille ───────────────────────────────────

interface ReminderData {
  toEmail: string
  toName: string
  ref: string
  pickupDate: string
  slotLabel: string
  address: string
  lines: { name: string; qty: number }[]
}

export async function sendReminderEmail(data: ReminderData) {
  const content = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2B2017;margin:0 0 6px;">À demain !</h1>
    <p style="font-size:15px;color:#6E6051;margin:0 0 20px;">
      C'est demain que vous retirez votre commande <strong style="color:#2B2017;">${data.ref}</strong> chez Jayjay.
    </p>

    ${pickupCard(data.pickupDate, data.slotLabel, data.address)}

    <div style="margin:20px 0;">
      <div style="font-size:13px;color:#6E6051;margin-bottom:10px;">Votre commande :</div>
      ${data.lines.map(l => `<div style="font-size:14px;font-weight:600;color:#2B2017;margin:4px 0;">• ${l.qty} ${l.name}</div>`).join('')}
    </div>

    <div style="background:#F1E5D1;border-radius:12px;padding:20px;margin-top:24px;">
      <div style="font-family:Georgia,serif;font-size:17px;color:#2B2017;margin-bottom:12px;">🔥 Comment réchauffer vos nems ?</div>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#6E6051;line-height:1.8;">
        <li><strong>Four (recommandé)</strong> : 10 min à 180°C pour une pâte bien croustillante.</li>
        <li><strong>Poêle</strong> : 3 min à feu vif avec un filet d'huile, en retournant à mi-cuisson.</li>
        <li><strong>Air fryer</strong> : 8 min à 180°C, résultat parfait garanti.</li>
        <li><em>Évitez le micro-ondes</em> : la pâte deviendrait molle.</li>
      </ul>
    </div>`

  return sendEmail({
    to: [{ email: data.toEmail, name: data.toName }],
    subject: `📅 Rappel : votre retrait La Caza J demain — ${data.slotLabel}`,
    htmlContent: emailWrapper(content),
  })
}

// ── Email 3 — Demande d'avis ─────────────────────────────────────

interface ReviewData {
  toEmail: string
  toName: string
  ref: string
}

export async function sendReviewEmail(data: ReviewData) {
  const content = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#2B2017;margin:0 0 6px;">Comment c'était ?</h1>
    <p style="font-size:15px;color:#6E6051;margin:0 0 20px;">
      On espère que vous vous êtes régalé${data.toName ? `, ${data.toName.split(' ')[0]}` : ''} !
      Votre retrait <strong style="color:#2B2017;">${data.ref}</strong> est maintenant terminé.
    </p>

    <div style="background:#F6E2D5;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <div style="font-family:Georgia,serif;font-size:18px;color:#A2462A;margin-bottom:16px;">
        Vos retours comptent énormément pour Jayjay 🙏
      </div>
      <a href="https://www.instagram.com/la_caza_j/"
         style="display:inline-block;background:#C45C39;color:#fff;text-decoration:none;
                padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
        Laisser un avis sur Instagram
      </a>
    </div>

    <p style="font-size:14px;color:#9C8E7C;text-align:center;margin:20px 0 0;">
      Un problème avec votre commande ? Appelez Jayjay directement.<br/>
      Elle sera ravie d'arranger ça.
    </p>`

  return sendEmail({
    to: [{ email: data.toEmail, name: data.toName }],
    subject: `💬 Comment étaient vos nems ? (commande ${data.ref})`,
    htmlContent: emailWrapper(content),
  })
}

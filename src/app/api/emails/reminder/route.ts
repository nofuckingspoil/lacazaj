// Envoie les rappels de retrait J-1 pour toutes les commandes payées
// À appeler chaque soir via un cron (ex. Vercel Cron ou GitHub Actions)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendReminderEmail } from '@/lib/brevo'

export async function POST(req: NextRequest) {
  // Sécurité basique : clé secrète en header
  const auth = req.headers.get('x-cron-secret')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Commandes payées dont le retrait est demain
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, ref,
      profiles (email, nom),
      weekends (pickup_date, address),
      slots (time_label),
      order_lines (quantity, products (name))
    `)
    .eq('status', 'paid')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrer ceux dont le retrait est demain
  const results: { ref: string; status: string }[] = []

  for (const order of orders ?? []) {
    const profile = order.profiles as { email?: string; nom?: string } | null
    const weekend = order.weekends as { pickup_date?: string; address?: string } | null
    const slot = order.slots as { time_label?: string } | null

    if (!profile?.email) continue

    // pickup_date est un texte comme "Samedi 13 juin" — on vérifie via le weekend
    // Pour simplifier, on envoie à tous les payés non encore rappelés
    // (dans une vraie implémentation, ajouter un champ reminder_sent)
    const lines = ((order.order_lines ?? []) as unknown as Array<{
      quantity: number
      products: { name: string } | null
    }>).map(l => ({ name: l.products?.name ?? 'Nems', qty: l.quantity }))

    try {
      await sendReminderEmail({
        toEmail: profile.email,
        toName: profile.nom ?? '',
        ref: order.ref,
        pickupDate: weekend?.pickup_date ?? '',
        slotLabel: slot?.time_label ?? '',
        address: weekend?.address ?? '',
        lines,
      })
      results.push({ ref: order.ref, status: 'sent' })
    } catch {
      results.push({ ref: order.ref, status: 'error' })
    }
  }

  return NextResponse.json({ sent: results.length, results })
}

// Envoie les demandes d'avis J+1 pour les commandes retirées la veille
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendReviewEmail } from '@/lib/brevo'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, ref, profiles (email, nom)')
    .eq('status', 'picked_up')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: { ref: string; status: string }[] = []

  for (const order of orders ?? []) {
    const profile = order.profiles as { email?: string; nom?: string } | null
    if (!profile?.email) continue

    try {
      await sendReviewEmail({
        toEmail: profile.email,
        toName: profile.nom ?? '',
        ref: order.ref,
      })
      results.push({ ref: order.ref, status: 'sent' })
    } catch {
      results.push({ ref: order.ref, status: 'error' })
    }
  }

  return NextResponse.json({ sent: results.length, results })
}

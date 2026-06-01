import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendConfirmationEmail } from '@/lib/brevo'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId

    if (!orderId) {
      return NextResponse.json({ received: true })
    }

    // 1. Marquer la commande comme payée
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent as string ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // 2. Récupérer les infos pour l'email de confirmation
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        ref, total_nems, amount_cents, profile_id,
        weekends (label, pickup_date, address),
        slots (time_label),
        profiles (email, nom),
        order_lines (quantity, unit_price_cents, products (name))
      `)
      .eq('id', orderId)
      .single()

    if (order && order.profiles) {
      const profile = order.profiles as unknown as { email: string; nom?: string }
      const weekend = order.weekends as unknown as { pickup_date: string; address: string } | null
      const slot = order.slots as unknown as { time_label: string } | null
      const lines = ((order.order_lines ?? []) as unknown as Array<{
        quantity: number
        unit_price_cents: number
        products: { name: string } | null
      }>).map(l => ({
        name: l.products?.name ?? 'Nems',
        qty: l.quantity,
        subtotalCents: l.quantity * l.unit_price_cents,
      }))

      try {
        await sendConfirmationEmail({
          toEmail: profile.email,
          toName: profile.nom ?? '',
          ref: order.ref,
          pickupDate: weekend?.pickup_date ?? '',
          slotLabel: slot?.time_label ?? '',
          address: weekend?.address ?? '',
          lines,
          totalCents: order.amount_cents,
        })
        console.log('Email de confirmation envoyé à', profile.email)
      } catch (err) {
        // Ne pas bloquer le webhook si l'email échoue
        console.error('Erreur envoi email confirmation:', err)
      }
    }
  }

  return NextResponse.json({ received: true })
}

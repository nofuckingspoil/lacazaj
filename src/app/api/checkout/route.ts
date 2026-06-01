import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { orderId, items, customerEmail } = await req.json()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: items.map((item: { name: string; quantity: number; unit_amount: number }) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: item.unit_amount,
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?checkout_success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    metadata: { orderId },
  })

  return NextResponse.json({ url: session.url })
}

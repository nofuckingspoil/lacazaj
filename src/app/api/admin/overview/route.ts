import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthed } from '@/lib/admin-auth'

interface OrderRow {
  ref: string
  weekend_id: string
  slot: { time_label: string | null; time_key: string | null } | null
  profile: { nom: string | null; telephone: string | null } | null
  lines: { product_id: string; quantity: number }[] | null
}

// GET — vue d'ensemble pour l'admin : week-ends + commandes (clients, créneaux, quantités)
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { data: weekends, error: wErr } = await supabaseAdmin
      .from('weekends')
      .select('id, label, pickup_date, pickup_date_long, deadline, stock_total, stock_left, address, status')
      .order('deadline', { ascending: true })
    if (wErr) throw wErr

    const { data: rows, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('ref, weekend_id, slot:slots(time_label, time_key), profile:profiles(nom, telephone), lines:order_lines(product_id, quantity)')
      .in('status', ['paid', 'picked_up'])
    if (oErr) throw oErr

    const orders = ((rows ?? []) as unknown as OrderRow[]).map((o) => {
      const q: Record<string, number> = { porc: 0, poulet: 0, crevette: 0 }
      for (const l of o.lines ?? []) q[l.product_id] = (q[l.product_id] ?? 0) + l.quantity
      return {
        ref: o.ref,
        weekendId: o.weekend_id,
        client: o.profile?.nom || 'Client',
        tel: o.profile?.telephone || '',
        slot: o.slot?.time_label || '—',
        slotKey: o.slot?.time_key || '',
        porc: q.porc, poulet: q.poulet, crevette: q.crevette,
      }
    })

    return NextResponse.json({ weekends: weekends ?? [], orders })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lecture impossible' },
      { status: 500 },
    )
  }
}

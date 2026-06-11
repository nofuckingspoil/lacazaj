import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAuthed } from '@/lib/admin-auth'

// Génère les créneaux de 30 min entre 18h et 21h (même logique que data.ts buildSlots)
function generateSlots(weekendId: string) {
  const slots: {
    weekend_id: string
    time_label: string
    time_key: string
    orders_count: number
    max_orders: number
  }[] = []
  for (let h = 18; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m > 0) break
      slots.push({
        weekend_id: weekendId,
        time_label: `${h}h${m === 0 ? '00' : m}`,
        time_key: `${h}:${m}`,
        orders_count: 0,
        max_orders: 8,
      })
    }
  }
  return slots
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// Convertit une date + heure "murale" de Paris en instant UTC (gère l'heure d'été/hiver)
function parisWallToUTC(dateStr: string, timeStr: string): string {
  const [Y, M, D] = dateStr.split('-').map(Number)
  const [h, m] = timeStr.split(':').map(Number)
  const utcGuess = Date.UTC(Y, M - 1, D, h, m, 0)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const p = dtf.formatToParts(new Date(utcGuess)).reduce((a, x) => {
    a[x.type] = x.value; return a
  }, {} as Record<string, string>)
  const asTz = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, 0)
  const offset = asTz - utcGuess
  return new Date(utcGuess - offset).toISOString()
}

// Libellés FR à partir d'une date "yyyy-mm-dd" (midi local pour éviter tout décalage)
function frenchPickup(pickupDate: string) {
  const d = new Date(`${pickupDate}T12:00:00`)
  const label = cap(new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d))
  const monthDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d)
  return { pickup_date: label, pickup_date_long: `${label} ${d.getFullYear()}`, monthDay }
}

interface WeekendBody {
  id?: string
  label?: string
  pickupDate?: string   // yyyy-mm-dd
  deadline?: string     // yyyy-mm-dd
  deadlineTime?: string // HH:mm (heure de Paris)
  stockTotal?: number
  address?: string
}

// GET — liste tous les week-ends (tous statuts) pour l'admin
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('weekends')
      .select('id, label, pickup_date, pickup_date_long, deadline, stock_total, stock_left, address, status')
      .order('deadline', { ascending: true })
    if (error) throw error
    return NextResponse.json({ weekends: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 500 })
  }
}

// POST — crée un week-end + génère ses créneaux
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const body = await req.json() as WeekendBody
    const { pickupDate, deadline, address } = body
    const stockTotal = Number(body.stockTotal)

    if (!pickupDate || !deadline || !address || !stockTotal || stockTotal <= 0) {
      return NextResponse.json({ error: 'Champs manquants ou invalides' }, { status: 400 })
    }

    const time = body.deadlineTime && /^\d{2}:\d{2}$/.test(body.deadlineTime) ? body.deadlineTime : '23:59'
    const { pickup_date, pickup_date_long, monthDay } = frenchPickup(pickupDate)
    const label = body.label?.trim() || `Week-end du ${monthDay}`
    const deadlineISO = parisWallToUTC(deadline, time)
    const id = `wk-${Date.now().toString(36)}`

    const { error: wkError } = await supabaseAdmin.from('weekends').insert({
      id,
      label,
      pickup_date,
      pickup_date_long,
      deadline: deadlineISO,
      stock_total: stockTotal,
      stock_left: stockTotal,
      address,
      status: 'open',
    })
    if (wkError) throw wkError

    const { error: slotError } = await supabaseAdmin.from('slots').insert(generateSlots(id))
    if (slotError) throw slotError

    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Création impossible' },
      { status: 500 },
    )
  }
}

// PUT — modifie un week-end existant
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const body = await req.json() as WeekendBody
    const { id, pickupDate, deadline, address } = body
    const stockTotal = Number(body.stockTotal)

    if (!id || !pickupDate || !deadline || !address || !stockTotal || stockTotal <= 0) {
      return NextResponse.json({ error: 'Champs manquants ou invalides' }, { status: 400 })
    }

    // On préserve le nombre de nems déjà vendus
    const { data: existing } = await supabaseAdmin
      .from('weekends')
      .select('stock_total, stock_left')
      .eq('id', id)
      .single()
    const sold = existing ? existing.stock_total - existing.stock_left : 0
    const stockLeft = Math.max(0, stockTotal - sold)

    const time = body.deadlineTime && /^\d{2}:\d{2}$/.test(body.deadlineTime) ? body.deadlineTime : '23:59'
    const { pickup_date, pickup_date_long, monthDay } = frenchPickup(pickupDate)
    const label = body.label?.trim() || `Week-end du ${monthDay}`
    const deadlineISO = parisWallToUTC(deadline, time)

    const { error } = await supabaseAdmin.from('weekends').update({
      label,
      pickup_date,
      pickup_date_long,
      deadline: deadlineISO,
      stock_total: stockTotal,
      stock_left: stockLeft,
      address,
    }).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Modification impossible' },
      { status: 500 },
    )
  }
}

// PATCH — change le statut d'un week-end (ouvrir / fermer / archiver)
export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { id, status } = await req.json() as { id?: string; status?: string }
    const allowed = ['open', 'full', 'closed', 'archived']
    if (!id || !status || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('weekends').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }
}

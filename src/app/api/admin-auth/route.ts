import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { ADMIN_COOKIE, isAuthed } from '@/lib/admin-auth'

// GET — l'admin est-il déjà connecté ?
export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: isAuthed(req) })
}

// POST — connexion : vérifie le mot de passe et pose le cookie de session
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' })) as { password?: string }
  const pw = process.env.ADMIN_PASSWORD

  if (!pw) {
    return NextResponse.json({ error: 'Admin non configuré (mot de passe manquant côté serveur).' }, { status: 500 })
  }
  if (!password || password !== pw) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, createHash('sha256').update(pw).digest('hex'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  })
  return res
}

// DELETE — déconnexion : efface le cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}

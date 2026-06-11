import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

// Cookie qui prouve que l'admin s'est connecté (HttpOnly, posé côté serveur)
export const ADMIN_COOKIE = 'lacazaj_admin'

// Jeton attendu = empreinte du mot de passe admin (jamais le mot de passe en clair)
export function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return createHash('sha256').update(pw).digest('hex')
}

// Vérifie que la requête porte un cookie de session admin valide
export function isAuthed(req: NextRequest): boolean {
  const expected = expectedToken()
  if (!expected) return false
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  return !!token && token === expected
}

import { randomUUID } from 'node:crypto'
import {
  getCookie,
  getRequest,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import {
  DomainError,
  execute,
  expirePurchases,
  seedState,
  visibleState,
} from './domain'
import type { Command, DemoState, Persona } from './domain'

interface Room {
  actor: Persona
  state: DemoState
  expires: number
  requests: Map<string, string>
}
// Isolated, bounded demo storage. Restart intentionally resets sessions; not a production database.
const rooms = new Map<string, Room>()
const COOKIE = 'b2b_portfolio_demo'
const TTL = 24 * 60 * 60 * 1000
function enabled() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.B2B_DEMO_ENABLED !== 'true'
  )
    throw new Error('Demo tidak diaktifkan pada server ini.')
  setResponseHeader('Cache-Control', 'no-store')
}
function sameOrigin() {
  const request = getRequest()
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new Error('Asal permintaan tidak sesuai.')
}
function findRoom() {
  enabled()
  const token = getCookie(COOKIE)
  const room = token ? rooms.get(token) : undefined
  if (!room || room.expires <= Date.now()) {
    if (token) rooms.delete(token)
    return null
  }
  return room
}
function requireRoom() {
  const room = findRoom()
  if (!room) throw new Error('Sesi demo berakhir. Mulai demo kembali.')
  return room
}
function snapshot(room: Room) {
  return { actor: room.actor, state: visibleState(room.state, room.actor) }
}
export function readDemo() {
  const room = findRoom()
  if (!room) return null
  room.state = expirePurchases(room.state, Date.now())
  return snapshot(room)
}
export function enterDemo(actor: Persona, reset: boolean) {
  enabled()
  sameOrigin()
  const priorToken = getCookie(COOKIE)
  const prior = findRoom()
  for (const [key, value] of rooms)
    if (value.expires <= Date.now()) rooms.delete(key)
  if (!prior && rooms.size >= 1000)
    throw new Error('Demo sedang penuh. Silakan coba kembali.')
  const room: Room =
    !reset && prior
      ? prior
      : {
          actor,
          state: seedState(),
          expires: Date.now() + TTL,
          requests: new Map(),
        }
  room.actor = actor
  // Rotate the opaque cookie when switching a demo persona.
  const token = randomUUID()
  if (priorToken) rooms.delete(priorToken)
  rooms.set(token, room)
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: new URL(getRequest().url).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: TTL / 1000,
  })
  return snapshot(room)
}
export function mutateDemo(requestId: string, command: Command) {
  sameOrigin()
  const room = requireRoom()
  const fingerprint = JSON.stringify([room.actor, command])
  const previous = room.requests.get(requestId)
  if (previous && previous !== fingerprint)
    throw new Error('ID permintaan sudah dipakai untuk tindakan berbeda.')
  if (previous) return { ...snapshot(room), error: null }
  try {
    room.state = execute(room.state, room.actor, command)
    room.requests.set(requestId, fingerprint)
    if (room.requests.size > 500)
      room.requests.delete(room.requests.keys().next().value!)
    return { ...snapshot(room), error: null }
  } catch (error) {
    if (!(error instanceof DomainError)) throw error
    return {
      ...snapshot(room),
      error: { code: error.code, message: error.message },
    }
  }
}

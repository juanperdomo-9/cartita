// Link de la canción: solo canciones de YouTube o Spotify. El backend lo vuelve a validar.

export interface Cancion {
  tipo: 'youtube' | 'spotify'
  id: string
}

export function leerCancion(link: string): Cancion | { error: string } | null {
  const s = String(link || '').trim()
  if (!s) return null
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s)
  } catch {
    return { error: 'Ese link no parece de YouTube ni de Spotify.' }
  }
  const h = u.hostname.toLowerCase().replace(/^(www|m)\./, '')
  let id: string | null = null
  if (h === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
  else if (h === 'youtube.com' || h === 'music.youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v')
    else {
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/?#]+)/)
      if (m) id = m[2]
    }
  }
  if (id && /^[\w-]{11}$/.test(id)) return { tipo: 'youtube', id }
  if (h === 'open.spotify.com') {
    const m = u.pathname.match(/\/track\/([A-Za-z0-9]{22})/)
    if (m) return { tipo: 'spotify', id: m[1] }
    if (/\/(album|playlist|artist|show|episode)\//.test(u.pathname))
      return { error: 'Ese link es de un álbum o una lista. Pegá el link de una canción.' }
  }
  return { error: 'Ese link no parece de una canción de YouTube o Spotify.' }
}

export const urlCancion = (c: Cancion) =>
  c.tipo === 'youtube' ? 'https://www.youtube.com/watch?v=' + c.id : 'https://open.spotify.com/track/' + c.id

// YouTube: https://developers.google.com/youtube/player_parameters (autoplay, playsinline).
// Spotify: https://developer.spotify.com/documentation/embeds (sin sesión suena un fragmento).
export const embedCancion = (c: Cancion) =>
  c.tipo === 'youtube'
    ? 'https://www.youtube-nocookie.com/embed/' + c.id + '?autoplay=1&playsinline=1&rel=0'
    : 'https://open.spotify.com/embed/track/' + c.id + '?theme=0'

export const nombreServicio = (c: Cancion) => (c.tipo === 'youtube' ? 'YouTube' : 'Spotify')

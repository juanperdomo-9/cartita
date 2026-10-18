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
    return { error: 'Ese link no parece de YouTube.' }
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
  // Spotify sin sesión suena solo 30 segundos y no deja bajarle el volumen: solo YouTube.
  if (h === 'open.spotify.com' || h === 'spotify.link') return { error: 'Por ahora solo usamos canciones de YouTube. Buscá el tema ahí y pegá ese link.' }
  return { error: 'Ese link no parece de una canción de YouTube.' }
}

export const urlCancion = (c: Cancion) =>
  c.tipo === 'youtube' ? 'https://www.youtube.com/watch?v=' + c.id : 'https://open.spotify.com/track/' + c.id

// YouTube: https://developers.google.com/youtube/player_parameters
//   autoplay, playsinline; loop=1 necesita playlist=ID para repetir un solo video;
//   enablejsapi=1 + origin permiten bajar el volumen y silenciar con postMessage.
// Spotify: https://developer.spotify.com/documentation/embeds
//   Sin sesión de Spotify en ese navegador suena solo un fragmento de 30 segundos.
export const embedCancion = (c: Cancion) =>
  c.tipo === 'youtube'
    ? 'https://www.youtube-nocookie.com/embed/' +
      c.id +
      '?autoplay=1&playsinline=1&rel=0&loop=1&playlist=' +
      c.id +
      '&enablejsapi=1&origin=' +
      encodeURIComponent(location.origin)
    : 'https://open.spotify.com/embed/track/' + c.id + '?theme=0'

export const nombreServicio = (c: Cancion) => (c.tipo === 'youtube' ? 'YouTube' : 'Spotify')

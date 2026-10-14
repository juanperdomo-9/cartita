// Esqueleto de la escena de la carta, copiado del prototipo (líneas 1108-1204).
// El motor lo completa; los ids se buscan siempre dentro de la escena.
export const ESQUELETO = `
<button class="cerrar" id="cerrar" type="button" aria-label="Volver a editar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
<button class="mute" id="mute" type="button" aria-label="Silenciar la música" aria-pressed="false">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path id="ondas" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>
</button>

<section class="pantalla aviso" id="p-aviso">
  <h2 class="titulo lg" id="aviso-titulo">Abriendo tu carta…</h2>
  <p class="suave" id="aviso-texto"></p>
  <a class="btn" href="/" id="aviso-btn" hidden>Hacer una carta</a>
</section>

<section class="pantalla p-espera" id="p-espera">
  <span class="candado"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>
  <div class="encabezado"><p class="eyebrow">Paciencia</p><h2 class="titulo">Todavía <em>no.</em></h2><p class="suave" id="espera-txt"></p></div>
  <div class="cuenta-regresiva" id="cuenta" aria-live="off"></div>
  <p class="suave">No espíes 👀</p>
  <button class="btn rosa" id="ya-abrir" type="button" hidden>¡Ya la podés abrir!</button>
  <button class="btn vidrio" id="saltar-espera" type="button" hidden>Saltar (solo en la vista previa)</button>
</section>

<section class="pantalla p-sobre" id="p-sobre">
  <div class="estilo-switch" id="estilo-switch" hidden><button type="button" data-estilo="papel">Papel</button><button type="button" data-estilo="bordo">Bordó</button></div>
  <div class="encabezado">
    <p class="eyebrow" id="s-eyebrow"></p>
    <h1 class="titulo" id="s-titulo"></h1>
    <p class="de" id="s-de"></p>
  </div>
  <button class="sobre" id="sobre" type="button" aria-label="Abrir la carta">
    <span class="fondo-sobre"></span>
    <span class="hoja" id="s-hoja"></span>
    <svg class="frente" viewBox="0 0 300 200" aria-hidden="true">
      <path d="M0 6Q0 0 6 0L150 112 6 200Q0 200 0 194Z" fill="#ead8bb"/>
      <path d="M300 6Q300 0 294 0L150 112 294 200Q300 200 300 194Z" fill="#e6d2b2"/>
      <path d="M0 194L150 94 300 194Q300 200 294 200H6Q0 200 0 194Z" fill="#f1e3cc"/>
      <path d="M0 194L150 94 300 194" fill="none" stroke="#000" stroke-opacity=".06" stroke-width="1.5"/>
      <text x="150" y="182" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="18" fill="#8c6a54" id="s-remite"></text>
    </svg>
    <svg class="tapa" viewBox="0 0 300 200" aria-hidden="true"><path d="M0 0H300L163 110Q150 120 137 110Z" fill="#e1c9a4"/></svg>
    <span class="lacre"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg></span>
  </button>
  <p class="toca"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>Tocá el sobre · con sonido</p>
</section>

<section class="pantalla p-historia" id="p-historia">
  <div class="barras" id="barras" aria-hidden="true"></div>
  <div id="slides" aria-live="polite"></div>
  <button class="sr" id="anterior" type="button">Anterior</button>
  <button class="sr" id="siguiente" type="button">Siguiente</button>
</section>

<section class="pantalla p-regalo" id="p-regalo">
  <div class="encabezado">
    <p class="eyebrow">Último paso</p>
    <h2 class="titulo">Raspá tu <em>regalo</em></h2>
    <p class="suave">Con el dedo, como una raspadita.</p>
  </div>
  <div class="sombra-ticket">
    <div class="ticket">
      <small>Vale por</small>
      <b id="r-titulo"></b>
      <p class="mano" id="r-detalle"></p>
      <canvas id="raspa" aria-label="Raspadita: pasá el dedo para descubrir el regalo"></canvas>
    </div>
  </div>
  <button class="btn vidrio" id="saltear" type="button">Descubrir sin raspar</button>
</section>

<section class="pantalla p-final" id="p-final">
  <svg class="ramo" id="ramo" viewBox="0 0 300 330" aria-hidden="true"></svg>
  <h1 class="titulo" id="fin-titulo"></h1>
  <p class="firma-final" id="fin-firma"></p>
  <div class="acciones">
    <button class="btn rosa" id="abrazo" type="button"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg><span id="abrazo-txt"></span></button>
  </div>
  <div class="acciones">
    <button class="btn vidrio chico" id="contestar" type="button"></button>
    <button class="btn vidrio chico" id="compartir" type="button">Para tu estado</button>
    <button class="btn vidrio chico icono" id="otra-vez" type="button" aria-label="Ver de nuevo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
  </div>
  <p class="abrazos-txt" id="abrazos" aria-live="polite"></p>
  <p class="pie" id="pie" hidden>¿Te gustó? <a href="/" id="pie-link">Hacé una carta como esta</a></p>
</section>

<div class="velo" id="velo"></div>
<div class="panel" id="panel-contestar" role="dialog" aria-modal="true" aria-labelledby="pc-titulo">
  <h3 id="pc-titulo"></h3>
  <textarea id="pc-texto" maxlength="400" placeholder="Escribí lo que quieras…" aria-label="Tu respuesta"></textarea>
  <p class="ok-txt" id="pc-ok" aria-live="polite"></p>
  <div class="fila"><button class="btn vidrio" type="button" data-cerrar>Cerrar</button><button class="btn rosa" type="button" id="pc-enviar">Mandar</button></div>
</div>
<div class="panel" id="panel-compartir" role="dialog" aria-modal="true" aria-labelledby="pe-titulo">
  <h3 id="pe-titulo">Para tu <em>estado</em></h3>
  <p class="suave" style="font-size:14px">Guardá la imagen y subila a tu estado de WhatsApp o a tus historias. Si no se descarga, mantené apretada la imagen y elegí “Guardar”.</p>
  <img id="pe-img" alt="Imagen de la carta para compartir">
  <p class="ok-txt" id="pe-ok" aria-live="polite"></p>
  <div class="fila"><button class="btn vidrio" type="button" data-cerrar>Cerrar</button><button class="btn rosa" type="button" id="pe-guardar">Guardar imagen</button></div>
</div>
`

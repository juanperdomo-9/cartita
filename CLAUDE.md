# CLAUDE.md: Cartita, cartas digitales que se abren como un regalo

Este archivo es la guía del proyecto. Leelo completo antes de proponer o escribir código.

## Qué estamos construyendo

Una web donde cualquiera arma una carta digital para su mamá (Día de la Madre) y se la manda por WhatsApp. La carta se abre en el celular como una historia de Instagram: sobre que se abre, carta escrita a mano, fotos, audios de la familia, su canción, raspadita con un regalo y un ramo de flores al final. Quien la armó ve después cuándo la abrió, cuántos abrazos le mandó y qué le contestó.

**El diseño y el comportamiento ya están resueltos en el prototipo** (`prototipo/cartita-prototipo.html`). Es la referencia visual y funcional: abrilo en el navegador, recorré la portada, el armado (botón "Crear mi carta gratis") y el ejemplo ("Ver un ejemplo"). La versión real tiene que verse y sentirse igual. Lo que cambia es todo lo de atrás: guardado, links, seguridad y archivos (ver "Qué cambia respecto del prototipo").

La interfaz es en español de Argentina, con voseo ("Armá", "Tocá el sobre"). Mobile first: casi todo el mundo la arma y la abre desde el celular.

## Etapas del negocio

- **Etapa 1 (ahora): gratis.** La usan amigos y conocidos. Nadie paga ni crea cuenta.
- **Etapa 2: paga.** Se cobra con Mercado Pago. El modelo de datos y el backend quedan preparados desde la etapa 1 (campos `plan` y `estado`, interruptor `PAGOS_ACTIVOS`), pero el cobro no se programa hasta que lo pida.
- **Etapa 3: más ocasiones activas** (Día del Padre, cumpleaños, aniversario…). La estructura por ocasión se arma desde la Fase 1 (ver "Ocasiones"), así sumar una es solo configuración y portada.

## Ocasiones

Cartita no es solo para el Día de la Madre: es para cualquier ocasión. La web se organiza así:

- **Inicio (`/`)**: presenta Cartita y muestra todas las ocasiones para elegir: Día de la Madre, Día del Padre, cumpleaños, aniversario, San Valentín, Navidad, egresos, "porque sí", etc. Cada una es una tarjeta que lleva a su portada. Las que todavía no están listas aparecen como "Próximamente". Misma estética hecha a mano que la portada del prototipo.
- **Portada de cada ocasión** (`/dia-de-la-madre`, `/dia-del-padre`, `/cumpleanos`…): la portada del prototipo es la de **Día de la Madre**. Quien elige esa ocasión ve exactamente esa portada. Cada ocasión tiene la suya con la misma estructura (sobre, objetos sobre la mesa, cuaderno, acuse de recibo, posdatas), cambiando textos, fecha y detalles.
- **Armado** (`/{ocasion}/crear`): el mismo paso a paso, adaptado a la ocasión (textos, sugerencias y qué pasos aparecen; por ejemplo, "días que sos mi mamá" solo va en Día de la Madre).
- **La carta** guarda su `ocasion` y la usa para sus textos y detalles (el título del sobre, la fecha de apertura sugerida). Los links de la carta (`/c/…`, `/s/…`, `/e/…`) no cambian según la ocasión.

Todo lo que cambia por ocasión vive en una configuración por ocasión (frontend `src/ocasiones/` y backend `app/ocasiones.py`): nombre, ruta, fecha (si tiene; Día de la Madre: domingo 18 de octubre de 2026), textos de la portada, sugerencias de cada paso, pasos visibles, frases de la carta y si está activa. **Sumar una ocasión nueva tiene que ser agregar su configuración y su portada, sin tocar el motor de la carta.**

En la Fase 1 solo está activa Día de la Madre, pero el Inicio con todas las ocasiones y la estructura por ocasión se arman desde el principio.

## Reglas para trabajar en este repo

- **Una fase a la vez.** Hacé solo la fase que te pida. No adelantes funciones de fases siguientes.
- **Primero el plan, después el código.** Antes de cada tarea grande, proponé un plan corto (archivos a crear o tocar, decisiones) y esperá el OK.
- **Respetá el prototipo.** Textos, colores, tipografías, animaciones y orden de las pantallas salen de `prototipo/cartita-prototipo.html`. Si algo del prototipo no se puede hacer igual, avisá antes de cambiarlo.
- **Preguntá antes de sumar dependencias** que no estén en la sección Stack.
- **Todo cambio de base de datos va por migración de Alembic.** Nada de cambios a mano.
- **Nunca confiar en el frontend** para nada que importe: límites, permisos, fechas de apertura y (en la etapa 2) precios se validan en el backend.
- Al terminar una tarea: corré los tests y el linter, y contá qué cambió y qué falta probar.
- Si algo de este archivo parece equivocado o desactualizado (por ejemplo, un detalle de la API de Supabase, YouTube, Spotify o Mercado Pago), avisá y verificá contra la documentación oficial antes de seguir.

## Stack

**Backend (`backend/`)**
- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy 2.x + psycopg 3, migraciones con Alembic
- Pydantic v2 + pydantic-settings (configuración por variables de entorno)
- httpx (para hablar con Supabase Storage por su API)
- Tests: pytest. Linter y formato: ruff. Paquetes: uv

**Frontend (`frontend/`)**
- React + Vite + TypeScript
- React Router, TanStack Query
- Linter: oxlint (`npm run lint`)
- CSS por componente, con todos los colores y medidas como variables en `src/styles/tokens.css` (copiadas del prototipo). Sin Tailwind: el diseño ya está hecho y se porta tal cual.
- Tipografías de Google Fonts. En la carta: Instrument Serif (títulos), Caveat (letra a mano) y DM Sans (texto). En la portada: Young Serif (títulos), Kalam (anotaciones en birome) y Courier Prime (sellos y el ticket)
- Dos modos: la portada y el armado siguen el modo claro u oscuro del celular (claro = papel, oscuro = bordó) y tienen un botón para cambiarlo. La carta tiene su propio estilo (`papel` o `bordo`), que elige quien la arma; en la vista previa se puede alternar
- La portada tiene estética de papel y escritorio (fondo claro, birome azul, cuaderno, sobre, sellos). Es a propósito: tiene que sentirse hecha a mano, no como una plantilla. No la conviertas en una landing genérica

**Infraestructura**
- Base de datos: Postgres en **Supabase**. Proyecto propio (no compartido con otros productos).
  - Supabase se usa como base de datos y como almacenamiento de archivos (Storage). No se usa Supabase Auth: en la etapa 1 no hay cuentas.
  - El frontend nunca habla directo con la base ni con Storage con permisos de escritura: todo pasa por el backend, que entrega links firmados.
  - La app se conecta por el pooler en modo transacción. Ese modo no admite prepared statements, así que en psycopg va `prepare_threshold=None`.
  - Los tests automáticos usan un Postgres local descartable (Supabase CLI o Docker), nunca el proyecto real.
- Storage: un bucket **privado** `cartas`. Las fotos y los audios se suben y se leen con links firmados que genera el backend.
- Deploy: Render, **un solo web service** (Docker): FastAPI sirve la API y la web compilada; las rutas que no son `/api` devuelven `index.html`.

## Estructura del repo

```
/
├── CLAUDE.md
├── prototipo/
│   └── cartita-prototipo.html   # referencia visual y funcional (no se despliega)
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py          # settings desde variables de entorno
│   │   ├── db.py              # engine y sesión
│   │   ├── models/            # SQLAlchemy
│   │   ├── schemas/           # Pydantic
│   │   ├── routers/           # cartas, publica, familia, seguimiento (y pagos en la etapa 2)
│   │   ├── services/          # tokens, storage, limites, archivos
│   │   └── ocasiones.py       # textos y límites por ocasión (por ahora solo dia_madre)
│   ├── alembic/
│   └── tests/
└── frontend/
    └── src/
        ├── pages/             # Inicio (todas las ocasiones), Portada de cada ocasión, Armar, Carta, Familia, Seguimiento, Ejemplo
        ├── ocasiones/         # configuración de cada ocasión (textos, fecha, sugerencias, pasos, activa)
        ├── carta/             # pantallas de la carta (sobre, historia, raspadita, final)
        ├── armar/             # pasos del armado
        ├── components/
        ├── api/
        └── styles/            # tokens.css y estilos base
```

## Variables de entorno

Nunca subir secretos al repo. Mantener un `.env.example` actualizado.

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Conexión a Postgres (pooler de Supabase) |
| `SUPABASE_URL` | URL del proyecto, para Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio. **Solo en el backend**, nunca en el frontend |
| `STORAGE_BUCKET` | Nombre del bucket (`cartas`) |
| `TOKEN_PEPPER` | Secreto que se mezcla al guardar el hash de los tokens |
| `APP_BASE_URL` | URL pública del backend (en Render se toma de `RENDER_EXTERNAL_URL`) |
| `FRONTEND_URL` | URL pública del frontend (para armar los links y para CORS) |
| `VITE_API_URL` | Opcional, solo desarrollo. En producción la web y la API comparten URL |
| `VITE_SITIO_URL` | Solo desarrollo. En producción el backend completa la URL de la imagen de WhatsApp |
| `ENTORNO` | `produccion` en Render (exige `TOKEN_PEPPER` y `SUPABASE_URL`) |
| `PAGOS_ACTIVOS` | `false` en la etapa 1 |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` | Solo etapa 2 |

## Links y seguridad

Cada carta tiene **tres links**, todos imposibles de adivinar:

| Link | Quién lo usa | Qué permite |
| --- | --- | --- |
| `/c/{slug}` | Ella | Ver la carta, mandar abrazos y contestar |
| `/s/{token_familia}` | La familia | Sumar un mensaje con foto o audio. No ve la carta |
| `/e/{token_admin}` | Quien la armó | Ver el seguimiento, ver la carta sin que cuente como abierta, ocultar mensajes de la familia |

- `slug`: 10 caracteres aleatorios (letras y números). `token_familia` y `token_admin`: `secrets.token_urlsafe(24)`.
- En la base se guarda el slug tal cual, pero de los tokens solo el hash (SHA-256 con `TOKEN_PEPPER`). Se comparan en tiempo constante.
- Quien la arma guarda su `token_admin` en el navegador (localStorage) para ver "Tus cartas" en la portada. Si lo pierde, pierde el seguimiento: avisalo en pantalla cuando se crea.
- **Antes de `abre_desde`, la API no devuelve el contenido de la carta**: solo para quién es, de quién y desde cuándo se abre. La cuenta regresiva no puede depender del navegador.
- Todas las páginas llevan `<meta name="robots" content="noindex">` y la API responde con `X-Robots-Tag: noindex`.
- La vista previa de WhatsApp (Open Graph) del link de ella no spoilea: quien la arma elige una frase fija y neutra ("Abrilo con sonido 🔊", "Para vos", "Mirá esto 👀", "Cuando tengas un ratito") y va con una imagen abstracta. Nunca muestra nombres, fotos, textos de la carta ni que es un regalo. La lista vive en `backend/app/vista_previa.py` y `frontend/src/lib/vistaPrevia.ts`. El resto de las páginas usa la vista previa de la marca.
- Límites por IP para crear cartas, sumar mensajes y registrar eventos (por ejemplo, 20 cartas por hora y 30 mensajes por hora). Si hace falta una librería para esto, preguntá antes.
- Archivos: el backend valida tipo y tamaño antes de firmar la subida y revisa los primeros bytes del archivo al confirmarla.
  - Fotos: JPG, PNG o WEBP, hasta 1,5 MB. El frontend las achica a 1600 px antes de subirlas, como el prototipo.
  - Audios: hasta 3 MB y 90 segundos (mp3, m4a/mp4, ogg, webm o wav).

## Modelo de datos

Claves primarias `uuid` con `gen_random_uuid()`. Fechas con hora en `timestamptz`. Dinero (etapa 2) en `numeric(12,2)` y `Decimal`: **nunca float**.

| Tabla | Campos principales |
| --- | --- |
| `cartas` | `id`, `slug` (único), `token_familia_hash`, `token_admin_hash`, `ocasion` (`dia_madre`), `estado` (`borrador`, `publicada`, `pendiente_pago`), `plan` (`gratis`, `premium`), `para` (20), `de` (50), `desde` (date), `titulo` (70), `subtitulo` (60), `carta` (700), `lugar` (40), `recuerdo` (90), `polas` (jsonb: 3 textos de 20), `antes_txt` (16), `ahora_txt` (16), `gracias` (jsonb: hasta 6 de 60), `cancion_tipo` (`youtube`, `spotify` o null), `cancion_id`, `cancion_nombre` (50), `regalo_titulo` (36), `regalo_detalle` (50), `estilo` (`papel` o `bordo`, por defecto `papel`), `vista_previa` (`sonido`, `para_vos`, `mira`, `ratito`), `abre_desde` (null = apenas le llegue), `creada_a`, `actualizada_a` |
| `archivos` | `id`, `carta_id`, `mensaje_id` (null salvo los de la familia), `tipo` (`foto`, `audio`), `rol` (`principal`, `p0`, `p1`, `p2`, `antes`, `ahora`, `pila`, `audio_autor`, `familia`), `orden`, `ruta`, `mime`, `bytes`, `ancho`, `alto`, `duracion_seg`, `quien` (30, para audios), `confirmado` (bool), `creado_a` |
| `mensajes_familia` | `id`, `carta_id`, `nombre` (40), `texto` (300), `visible` (bool, por defecto true), `creado_a` |
| `lecturas` | `carta_id` (pk), `visto_a`, `abierta_a`, `abrazos` (int), `respuesta` (400), `respuesta_a` |
| `pagos` (etapa 2) | `id`, `carta_id`, `mp_payment_id` (**único**), `monto`, `estado`, `detalle` (jsonb), `creado_a` |

Límites por carta (validados en el backend): 1 foto de recuerdo, 3 polaroids, 6 fotos en la pila, 2 de antes y ahora, 4 audios del autor, 30 mensajes de la familia.

## Flujos

**Armar y publicar**
1. El armado guarda el borrador en el navegador (localStorage) mientras se completa, como el prototipo. Las fotos y audios quedan en memoria hasta crear la carta.
2. Al tocar "Crear mi link": `POST /api/cartas` con los textos. Devuelve `id`, `slug`, `token_familia` y `token_admin` (estos dos, una sola vez).
3. Por cada archivo: `POST /api/cartas/{id}/archivos` (con `token_admin`). El backend valida y devuelve un link firmado de subida a Storage. El frontend sube directo a Storage y después confirma con `POST /api/archivos/{id}/confirmar`.
4. `POST /api/cartas/{id}/publicar`: pasa a `publicada`. En la etapa 2, si el plan es pago, pasa a `pendiente_pago`.
5. La pantalla final muestra los tres links como el prototipo: familia, ella (con mensaje para WhatsApp) y seguimiento.

**Ella abre la carta** (`/c/{slug}`)
1. `GET /api/c/{slug}`. Si todavía no es `abre_desde`, devuelve solo lo necesario para la cuenta regresiva.
2. Si ya se puede abrir, devuelve los textos, los links firmados de fotos y audios (que duren unas horas) y los mensajes visibles de la familia.
3. Eventos con `POST /api/c/{slug}/eventos`: `visto` (al entrar), `abierta` (al tocar el sobre), `abrazos` (suma, con límite) y `respuesta`. `visto_a` y `abierta_a` se guardan solo la primera vez.
4. Para que ver la carta desde el seguimiento no cuente como abierta, esa vista usa `GET /api/e/{token_admin}/carta`, que no registra eventos.

**La familia suma su mensaje** (`/s/{token_familia}`): nombre, texto y opcionalmente una foto y un audio. Se puede sumar aunque ella ya la haya abierto; aparece la próxima vez que la abra.

**Seguimiento** (`/e/{token_admin}`): estado de lectura, abrazos, respuesta, nombres de la familia que escribió, botón para ocultar un mensaje, "Ver la carta" y "Copiar link para la familia".

## La carta (frontend)

Orden de las pantallas, cada una aparece solo si tiene contenido (igual que el prototipo):
1. Cuenta regresiva (si entra antes de `abre_desde`)
2. Sobre ("Tocá el sobre · con sonido")
3. Historia, con barras arriba, tocar a la izquierda o la derecha y mantener apretado para pausar:
   1. Apertura
   2. Canción
   3. Carta escrita a mano (no avanza sola)
   4. Recuerdo: vertical a pantalla completa; horizontal, entera con fondo desenfocado
   5. Contador de días
   6. Antes y ahora
   7. Polaroids
   8. Pila de fotos
   9. Audios
   10. Un mensaje de la familia por pantalla
   11. Gracias por…
   12. Cierre
4. Raspadita
5. Final: ramo, abrazos, "Contestale", imagen para el estado y "Ver de nuevo"

Detalles que vienen del prototipo y hay que mantener:
- Si la firman varios ("Sofi, Juan y Tomi"), los textos pasan a plural (`voces()` en el prototipo).
- Si el título no tiene cursiva marcada, la última palabra sale en cursiva (`marcar()`).
- La música de cajita se sintetiza con Web Audio. Suena al tocar el sobre si no eligieron canción.
- Las ilustraciones de muestra (`MUESTRAS` en el prototipo) se usan solo en el ejemplo.
- Respetar `prefers-reduced-motion`.
- Nada se corta en ninguna pantalla: la escena se mide con el alto disponible y los tamaños de letra usan unidades de contenedor (`cqw`, `cqh`). Probar en 360×600, 390×844 y escritorio.

## Qué cambia respecto del prototipo

| En el prototipo | En la versión real |
| --- | --- |
| Guarda en la base de datos del artefacto, con fotos y audios en base64 | Postgres + Supabase Storage con links firmados |
| Links con `#c-id`, `#s-id`, `#e-id` | Rutas `/c/{slug}`, `/s/{token}`, `/e/{token}` con tokens separados |
| Cualquiera con el id ve el seguimiento | Solo con `token_admin` |
| La cuenta regresiva la controla el navegador | La controla el backend: no entrega el contenido antes de tiempo |
| La canción suena como cajita de música (`EMBEBER = false`) | Reproductor real de YouTube o Spotify dentro de la carta (`EMBEBER = true`). Verificá en la documentación oficial cómo se insertan y qué permiten en celulares |
| Los audios solo se suben como archivo | Además se graban desde el celular con `MediaRecorder` |
| La imagen para el estado se descarga | En el celular se comparte directo con `navigator.share` (con archivos) y, si no se puede, se descarga |
| "Tus cartas" usa el id | Usa el `token_admin` guardado en el navegador |

**Probar sí o sí:** un audio grabado en Android tiene que escucharse en iPhone y al revés. Si algún formato no se reproduce, proponé cómo resolverlo (por ejemplo, convertir en el backend) antes de hacerlo.

## Etapa 2: cobro con Mercado Pago (no programar hasta que lo pida)

- Cartita cobra en **su propia cuenta** de Mercado Pago (no es marketplace).
- Con `PAGOS_ACTIVOS=true`, publicar una carta con plan pago crea una preferencia de Checkout Pro y la carta queda `pendiente_pago`. Pasa a `publicada` **solo** cuando llega un webhook válido con el pago aprobado y el monto correcto.
- El precio se calcula siempre en el backend. Se guarda cada pago en `pagos`, con `mp_payment_id` único para que un webhook repetido no confirme dos veces.
- Webhook: validar la firma `x-signature` antes de todo y consultar el pago a la API. Verificá el formato exacto en la documentación oficial.
- Prever cupones para amigos (cartas gratis aunque los pagos estén activos).
- Las funciones por plan van en una sola tabla de configuración del backend (`FUNCIONES_POR_PLAN`), así se puede decidir después qué es gratis y qué es premium sin tocar el resto del código. En la etapa 1, todo está habilitado para todos.

## Tests mínimos

- Crear una carta devuelve slug y tokens, y en la base solo quedan los hashes de los tokens.
- Con un token equivocado no se puede ver el seguimiento, subir archivos ni ocultar mensajes.
- Antes de `abre_desde`, `GET /api/c/{slug}` no devuelve textos, fotos ni audios.
- Ver la carta desde el seguimiento no registra `visto` ni `abierta`.
- `visto_a` y `abierta_a` se guardan solo la primera vez; los abrazos suman.
- Se rechazan archivos de más tamaño, de otro tipo o que superan el límite por carta.
- Un mensaje de la familia oculto no aparece en la carta.
- Los límites de texto se cortan o rechazan en el backend aunque el frontend mande de más.
- El link de canción solo acepta canciones de YouTube o Spotify (no álbumes ni listas) y se guarda como `tipo` + `id`.
- Etapa 2: webhook con firma inválida responde 401, webhook repetido confirma una sola vez y un monto distinto no publica la carta.

## Fases

**Fase 0: base del proyecto**
- [x] Estructura de carpetas, uv, Vite, ruff, pytest, `.env.example`
- [ ] Proyecto de Supabase, conexión por el pooler, Alembic, bucket privado `cartas`
- [ ] Deploy inicial en Render (un solo servicio: `Dockerfile` + `render.yaml`)

**Fase 1: Cartita gratis para amigos**
- [x] Modelo de datos y migraciones
- [x] API: crear carta, subir y confirmar archivos, publicar
- [x] Configuración por ocasión (frontend y backend), con Día de la Madre como primera
- [x] Inicio con todas las ocasiones (solo Día de la Madre activa, el resto "Próximamente")
- [x] Portada de Día de la Madre en `/dia-de-la-madre` (porting del prototipo)
- [x] Armado paso a paso (porting del prototipo, con borrador en el navegador)
- [x] La carta completa (porting del prototipo) con cuenta regresiva del lado del backend
- [x] Canción con reproductor real
- [x] Link de la familia
- [x] Seguimiento: lecturas, abrazos, respuesta, ocultar mensajes
- [x] Grabar audio desde el celular e imagen para el estado con `navigator.share`
- [x] Límites por IP, `noindex` y vista previa genérica para WhatsApp
- [ ] Prueba completa en iPhone y Android reales

**Fase 2: cobro** (ver "Etapa 2")

**Fase 3: más ocasiones** (activar Día del Padre, cumpleaños, aniversario, etc. sumando su configuración y su portada)

## Decisiones abiertas

Preguntá antes de asumir cualquiera de estas:
- Dominio definitivo (Cartita es nombre provisorio)
- Cuánto tiempo se guardan las cartas y si quien la armó puede borrarla
- Si quien la armó puede editar la carta después de crearla
- Si se pide un email opcional a quien la arma para avisarle cuando ella la abra (necesita proveedor de email)
- Plan de Supabase: el gratuito tiene límite de almacenamiento y se pausa por inactividad. Cada carta completa pesa unos 5 a 10 MB. Verificá los límites actuales
- Etapa 2: precio, qué funciones son premium y si se paga antes o después de armar

## Documentación de referencia

- Supabase, conexión y pooler: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase, prepared statements con el pooler: https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL
- Supabase Storage, subidas con links firmados: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- YouTube, reproductor insertado: https://developers.google.com/youtube/player_parameters
- Spotify, reproductor insertado: https://developer.spotify.com/documentation/embeds
- MDN, MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- MDN, Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- Mercado Pago, Checkout Pro (etapa 2): https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
- Mercado Pago, webhooks (etapa 2): https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

# Cartita

Cartas digitales que se abren como un regalo. La guía completa del proyecto está en [CLAUDE.md](CLAUDE.md) y la referencia visual en [prototipo/cartita-prototipo.html](prototipo/cartita-prototipo.html).

- `backend/`: FastAPI + SQLAlchemy + Alembic (Python 3.12, uv)
- `frontend/`: React + Vite + TypeScript (React Router, TanStack Query)
- `render.yaml`: deploy en Render (web service + static site)

## Desarrollo local

Hace falta Docker (para el Postgres local), uv y Node.

```bash
docker compose up -d
cd backend && uv sync && uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
cd frontend && npm install && npm run dev -- --host
```

- Frontend: http://localhost:5173 · Backend: http://localhost:8000 (`/health` y `/api/docs`).
- Sin `SUPABASE_URL`, las fotos y los audios se guardan en `backend/.almacen` con links firmados igual que en Storage.
- Para probar desde el celular en la misma red wifi: abrí `http://IP-de-la-compu:5173` y poné `APP_BASE_URL=http://IP-de-la-compu:8000` en `backend/.env`. Grabar audio y compartir la imagen piden HTTPS: desde el celular se prueban recién con la versión publicada.

### Tests, linter y build

```bash
cd backend && uv run ruff check . && uv run ruff format --check . && uv run pytest
```

```bash
cd frontend && npm run lint && npm run build
```

### Migraciones

Todo cambio de base va por Alembic (nunca a mano):

```bash
cd backend && uv run alembic revision --autogenerate -m "descripcion" && uv run alembic upgrade head
```

Los tests que necesiten base usan un Postgres local descartable (Supabase CLI con `supabase start`, o Docker), nunca el proyecto real.

## Lo que tenés que hacer vos (una sola vez)

### 1. Supabase

1. Creá un proyecto nuevo en https://supabase.com (aparte de otros productos). Elegí la región São Paulo (`sa-east-1`), que es la más cercana.
2. Guardá la contraseña de la base en un lugar seguro.
3. **Connect → Connection string → Transaction pooler** (puerto `6543`): esa es la `DATABASE_URL`. Reemplazá `[YOUR-PASSWORD]` por la contraseña. El backend ya desactiva los prepared statements (`prepare_threshold=None`), que ese modo no admite.
4. **Project Settings → API**: copiá la URL del proyecto (`SUPABASE_URL`) y la clave `service_role` (`SUPABASE_SERVICE_ROLE_KEY`). Esa clave da acceso total: va solo en el backend.
5. **Storage → New bucket**: nombre `cartas`, **sin** marcar "Public bucket" (tiene que quedar privado). No hace falta crear policies: el backend usa la clave de servicio y entrega links firmados.
6. Revisá los límites del plan gratuito (almacenamiento y pausa por inactividad), que están entre las decisiones abiertas de CLAUDE.md.

### 2. Render

1. En https://render.com: **New → Blueprint**, conectá el repo `juanperdomo-9/cartita`. Render lee `render.yaml` y crea `cartita-backend` y `cartita-frontend`.
2. Te va a pedir las variables marcadas `sync: false`:
   - `cartita-backend`:
     - `DATABASE_URL`: la del paso 3 de Supabase
     - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: las del paso 4
     - `APP_BASE_URL`: la URL del backend (por ejemplo `https://cartita-backend.onrender.com`)
     - `FRONTEND_URL`: la URL del frontend (por ejemplo `https://cartita-frontend.onrender.com`). Se usa para CORS: si no coincide exacto, el frontend no puede hablar con el backend.
   - `cartita-frontend`:
     - `VITE_API_URL`: la URL del backend
   - `TOKEN_PEPPER` lo genera Render solo, y `STORAGE_BUCKET=cartas` y `PAGOS_ACTIVOS=false` ya vienen puestas. **No cambies `TOKEN_PEPPER` una vez que haya cartas**, porque dejarían de funcionar sus links de familia y de seguimiento.
3. Las URLs exactas recién las sabés cuando Render crea los servicios: si cambian, actualizá `APP_BASE_URL`, `FRONTEND_URL` y `VITE_API_URL`, y redeployá el frontend (Vite mete `VITE_API_URL` en el build).
4. Comprobá que `https://<backend>/health` responde `{"estado":"ok"}` y que el frontend dice "backend: ok".

Notas del plan free de Render: el backend se duerme después de 15 minutos sin tráfico y tarda alrededor de un minuto en despertar. Además no tiene pre-deploy, por eso las migraciones corren en el build (`alembic upgrade head`).

## Antes de pasarle el link a tus amigos: prueba en celulares reales

Con la versión publicada (HTTPS), en un iPhone y en un Android:

1. Armar una carta completa desde el celular: fotos verticales y horizontales, 2 audios (uno grabado y uno subido), canción de YouTube y de Spotify.
2. Abrir el link de ella desde WhatsApp (no copiado): que la vista previa diga "Tenés una carta 💌" sin nombres ni fotos.
3. Recorrer la carta: sobre con sonido, historia (tocar izquierda/derecha, mantener apretado para pausar), antes y ahora con el dedo, raspadita, abrazos, "Contestale" e imagen para el estado (que se comparta directo).
4. **Audios cruzados:** un audio grabado en Android tiene que escucharse en iPhone, y al revés.
5. Probar con fecha de apertura en 5 minutos: antes no se ve nada, y al llegar a cero aparece "¡Ya la podés abrir!".
6. Sumar un mensaje desde el link de la familia (con foto y audio) y ver que aparece en la carta y en el seguimiento; ocultarlo y ver que desaparece.
7. Ver la carta desde el seguimiento y confirmar que no cuenta como abierta.
8. Probar en pantalla chica (iPhone SE) y con el modo oscuro del celular.

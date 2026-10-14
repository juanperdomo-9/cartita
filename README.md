# Cartita

Cartas digitales que se abren como un regalo. La guía completa del proyecto está en [CLAUDE.md](CLAUDE.md) y la referencia visual en [prototipo/cartita-prototipo.html](prototipo/cartita-prototipo.html).

- `backend/`: FastAPI + SQLAlchemy + Alembic (Python 3.12, uv)
- `frontend/`: React + Vite + TypeScript (React Router, TanStack Query)
- `render.yaml`: deploy en Render (web service + static site)

## Desarrollo local

Copiá `.env.example` a `backend/.env` (y la parte `VITE_*` a `frontend/.env.local`).

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

El backend queda en http://localhost:8000 (`/health` y `/api/docs`) y el frontend en http://localhost:5173.

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

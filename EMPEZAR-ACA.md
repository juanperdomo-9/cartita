# Cómo pasarle Cartita a Claude Code

## Qué hay en esta carpeta

- `CLAUDE.md`: la guía del proyecto. Claude Code la lee sola cada vez que abrís el proyecto.
- `prototipo/cartita-prototipo.html`: la versión que armamos, con la portada, el armado, la carta y el seguimiento. Abrila con doble clic para verla en el navegador. Ahí no se puede guardar, pero el ejemplo y la vista previa andan.
- Este archivo, con los mensajes para ir pegando.

## Antes de arrancar

1. Creá una carpeta `cartita` y copiá adentro `CLAUDE.md` y la carpeta `prototipo`.
2. Inicializá git (`git init`) y creá el repo en GitHub.
3. Creá un proyecto nuevo en Supabase, aparte del de Hay Cancha.
4. Abrí Claude Code en la carpeta `cartita`.

## Mensaje 1: Fase 0

```
Leé CLAUDE.md completo y abrí prototipo/cartita-prototipo.html para ver cómo tiene que verse y comportarse todo (portada, armado, carta, familia y seguimiento).

Arrancamos por la Fase 0: estructura del repo, backend con FastAPI y uv, frontend con Vite y TypeScript, ruff, pytest, .env.example, conexión a Supabase por el pooler, Alembic, bucket privado "cartas" y deploy inicial en Render.

Antes de escribir código, proponeme un plan corto y esperá mi OK. Si algo del CLAUDE.md te parece mal o desactualizado, decímelo primero.
```

## Mensajes siguientes: Fase 1, de a una tarea

Pegá uno por vez y esperá a que termine, pruebe y te cuente qué cambió.

```
Fase 1, tarea 1: modelo de datos y migraciones (cartas, archivos, mensajes_familia, lecturas) con los tests de tokens y límites. Plan primero.
```

```
Fase 1, tarea 2: API para crear la carta, subir y confirmar archivos con links firmados de Storage, y publicar. Con tests. Plan primero.
```

```
Fase 1, tarea 3: configuración por ocasión, Inicio con todas las ocasiones (solo Día de la Madre activa) y la portada de Día de la Madre en /dia-de-la-madre. Portá esa portada del prototipo lo más fiel posible: fondo de papel, el sobre abierto, los objetos de "Lo que va adentro", la hoja de cuaderno, el acuse de recibo, las posdatas y el cierre. Que no pierda lo hecho a mano. Plan primero.
```

```
Fase 1, tarea 4: armado paso a paso, igual al prototipo (11 pasos más la revisión, borrador en el navegador, sugerencias, validaciones) conectado a la API. Plan primero.
```

```
Fase 1, tarea 5: la carta completa, igual al prototipo, con la cuenta regresiva controlada por el backend y el reproductor real de YouTube o Spotify. Plan primero.
```

```
Fase 1, tarea 6: link de la familia y seguimiento (lecturas, abrazos, respuesta, ocultar mensajes, ver la carta sin que cuente). Plan primero.
```

```
Fase 1, tarea 7: grabar audio desde el celular, imagen para el estado con navigator.share, límites por IP, noindex y vista previa genérica para WhatsApp. Plan primero.
```

```
Fase 1, cierre: armemos una lista de pruebas para hacer en un iPhone y un Android reales antes de pasarle el link a mis amigos.
```

## Cuando quieras cobrar (Etapa 2)

```
Pasamos a la Etapa 2: cobro con Mercado Pago según la sección "Etapa 2" del CLAUDE.md. Antes de nada, preguntame las decisiones abiertas (precio, qué es premium, cupones) y proponé un plan.
```

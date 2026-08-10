# Mantenimiento en tiempo real (tablero de semáforos)

Mini aplicación **independiente** para vigilar si Orión está funcionando:

- **Netlify** → PWA / Parpadeómetro  
- **Render** → API  
- **Neon** → base de datos  
- **Clima** → Open‑Meteo (datos ambientales)

No forma parte del flujo clínico del paciente. Es solo para ti o para quien tenga el código.

## Dónde está en el proyecto

| Ruta | Qué es |
|------|--------|
| `status/` | Mini app (HTML/JS/CSS) |
| `status/config.js` | Código PIN y URLs a vigilar |
| `docs/mantenimiento-tiempo-real.md` | Esta guía |
| `backend/src/routes/health.js` | `/api/health` y `/api/health/deep` |

## Enlace

Producción:

[https://habertronic-orion.netlify.app/status/](https://habertronic-orion.netlify.app/status/)

Local (con `npm run dev`):

[http://localhost:5173/status/](http://localhost:5173/status/)

## Código de acceso

La contraseña actual está en `status/config.js` → `STATUS_ACCESS_PIN` (ahora **6666**).

Dentro del tablero verás:

- el **enlace** + botón **Copiar enlace**
- la **contraseña** + botón **Copiar contraseña**

Así puedes mandar el link a alguien y, aparte, la contraseña: solo entrará quien la conozca.

**Cámbiala** en `config.js` cuando quieras rotarla. No la pongas en la pantalla de inicio de Orión.

Tras entrar, la sesión queda en el navegador (`sessionStorage`) hasta que pulses **Cerrar sesión** o cierres la pestaña.

## Cómo leer los semáforos

| Color | Significado |
|-------|-------------|
| Verde | Servicio OK y con latencia razonable |
| Amarillo | Responde, pero lento o con aviso |
| Rojo | No responde o falla crítica (p. ej. Neon caído) |
| Gris | Aún no comprobado / depende de otro servicio |

El tablero se refresca solo cada **20 segundos**. También puedes pulsar **Actualizar ahora**.

## Qué comprueba por detrás

1. **Netlify:** intenta cargar la web de Orión.  
2. **Render:** `GET /api/health`.  
3. **Neon + Clima:** `GET /api/health/deep` (la API hace `SELECT 1` a Neon y un ping a Open‑Meteo).

Si Render está dormido (plan gratuito), la primera comprobación puede salir roja o amarilla unos segundos y luego ponerse verde.

## Si algo está rojo

1. **Netlify rojo** → revisar deploy en [app.netlify.com](https://app.netlify.com) (sitio `habertronic-orion`).  
2. **Render rojo** → revisar servicio en [dashboard.render.com](https://dashboard.render.com) y logs.  
3. **Neon rojo** (API verde) → revisar proyecto en [console.neon.tech](https://console.neon.tech) y la variable `DATABASE_URL` en Render.  
4. **Clima rojo** → Open‑Meteo o red; el resto de Orión puede seguir usable.

## Privacidad

La página lleva `noindex`. El PIN no es seguridad bancaria: es una barrera simple para que el link no sea público en la home. No compartas el PIN en chats abiertos si puedes evitarlo.

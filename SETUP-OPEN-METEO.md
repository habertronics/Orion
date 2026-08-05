# Open-Meteo — dónde poner la API key

## 1. En tu PC (desarrollo)

Abre el archivo:

`c:\Users\docto\Documents\pwa lubos\backend\.env`

Agrega (o edita) estas líneas:

```
OPEN_METEO_API_KEY=pega-aqui-la-clave-del-correo
OPEN_METEO_BASE_URL=https://customer-api.open-meteo.com
```

Guarda el archivo y reinicia la API (`npm run dev` en `backend`).

## 2. En Render (producción)

1. [dashboard.render.com](https://dashboard.render.com) → servicio **Orion**
2. **Environment**
3. **Add Environment Variable**:
   - `OPEN_METEO_API_KEY` = tu clave
   - `OPEN_METEO_BASE_URL` = `https://customer-api.open-meteo.com`
4. Save (Render redespliega)

## 3. No hagas esto

- No subas la key a GitHub
- No la pegues en el chat si puedes evitarlo
- No la pongas en el frontend (Netlify): solo en el backend

## Prueba rápida

Con la API local corriendo y la key en `.env`, en el interrogatorio acepta ubicación: debería quedar verde y mostrar temp/humedad/UV.

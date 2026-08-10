# Orión DB · Registros

Mini app independiente para ver médicos e intervenciones (estilo hoja de cálculo).

## Enlace

https://habertronic-orion.netlify.app/db/

Contraseña por defecto: la de `db/config.js` (`DB_ACCESS_PIN`), misma que `ADMIN_DASHBOARD_PIN` en Render (por defecto `6666`).

## Vistas

1. **Médicos** — altas + conteos por protocolo  
2. **Intervenciones** — cada envío/caso  
3. **Médico + intervención** — cabecera del médico + primera intervención; abajo el resto  

## Carpeta

`db/` en el repo. API: `GET /api/admin/workbook` (header `X-Admin-Pin`).

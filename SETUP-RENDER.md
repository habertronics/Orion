# Publicar API Orión en Render

## 1. Subir el código a GitHub

En PowerShell (carpeta del proyecto):

```powershell
cd "c:\Users\docto\Documents\pwa lubos"
git init
git add .
git commit -m "Habertronic Orion PWA and API"
```

Luego en [github.com/new](https://github.com/new):
- Nombre: `habertronic-orion`
- Privado recomendado
- **Create repository** (sin README)

Conectá el remoto (reemplazá `TU-USUARIO`):

```powershell
git remote add origin https://github.com/TU-USUARIO/habertronic-orion.git
git branch -M main
git push -u origin main
```

## 2. Crear Web Service en Render

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Conectá el repo `habertronic-orion`
3. Configuración:

| Campo | Valor |
|-------|--------|
| **Name** | `habertronic-orion-api` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance** | Pro (tu plan) |

## 3. Variables de entorno (Environment)

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Connection string **Pooled** de Neon ORION |
| `JWT_SECRET` | La misma de tu `backend/.env` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |

(Cuando tengas Netlify, agregá la URL de la PWA a `CORS_ORIGINS`.)

## 4. Deploy

**Create Web Service** → esperá **Live**.

URL típica:
`https://habertronic-orion-api.onrender.com`

Prueba:
`https://habertronic-orion-api.onrender.com/api/health`

Debe responder: `{"status":"ok","service":"habertronic-orion-api"}`

## 5. Avisame la URL

Con eso actualizo la PWA para apuntar a Render en producción.

# Neon nuevo para Habertronic Orión

## 1. Crear proyecto en Neon

1. Entra a [console.neon.tech](https://console.neon.tech) (org **HABERTRONIC**).
2. **Projects** → **New Project**.
3. Nombre sugerido: `habertronic-orion` (proyecto **nuevo**, no reutilices Hola Mundo).
4. Crea el proyecto.

## 2. Copiar connection string

1. En el dashboard del proyecto → **Connection string**.
2. Elige **Pooled connection**.
3. Copia la URL `postgresql://...`

## 3. Configurar backend local

```powershell
cd "c:\Users\docto\Documents\pwa lubos\backend"
copy .env.example .env
```

Abre `backend/.env` y pega:

- `DATABASE_URL` = la connection string de Neon
- `JWT_SECRET` = una frase larga aleatoria

## 4. Instalar e inicializar tablas

```powershell
cd "c:\Users\docto\Documents\pwa lubos\backend"
npm install
npm run db:init
npm run dev
```

Deberías ver: `API Orión en http://localhost:3001`

Prueba: [http://localhost:3001/api/health](http://localhost:3001/api/health)

## 5. Tablas creadas

- `researchers` — correo + contraseña (hash)
- `researcher_login_events` — intentos de login

Cuando Neon esté listo, avísame y conectamos la PWA / subimos la API a Render.

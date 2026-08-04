# Publicar PWA Orión en Netlify

## 1. Asegurar que GitHub esté al día

```powershell
cd "c:\Users\docto\Documents\pwa lubos"
git add .
git commit -m "Add Netlify config and Render API URL"
git push
```

## 2. Crear sitio en Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Conectá **GitHub** → repo **habertronics/Orion**
3. Configuración:

| Campo | Valor |
|--------|--------|
| Branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |

4. **Site name** sugerido: `habertronic-orion`  
   → URL: `https://habertronic-orion.netlify.app`

5. Deploy

## 3. CORS en Render

En Render → Orion → **Environment** → editá `CORS_ORIGINS`:

```
http://localhost:5173,http://127.0.0.1:5173,https://habertronic-orion.netlify.app
```

Guardá (redeploy automático).

## 4. Probar

1. Abrí la URL de Netlify en el celular
2. Bienvenida → Ingresar como investigador → Darme de alta / Login
3. En Neon → tabla `researchers` deberías ver el nuevo usuario

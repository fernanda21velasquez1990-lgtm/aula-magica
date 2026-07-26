# Aula Mágica

Plataforma escolar para maestras de primaria, construida con Next.js, Google Sheets y Google Apps Script.

## Desarrollo local

1. Copia `.env.example` como `.env.local` y coloca la URL `/exec` de Apps Script.
2. Ejecuta:

```bash
npm install
npm run dev
```

3. Abre `http://localhost:3000`.

## Producción

El repositorio se conecta a Vercel. Cada `git push` a `main` genera una nueva implementación.

Configura en Vercel la variable:

- `NEXT_PUBLIC_APPS_SCRIPT_URL`

No subas `.env.local` a GitHub.

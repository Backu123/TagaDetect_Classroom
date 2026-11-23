# 💻 TagaDetect Frontend (React 19 + Vite + Tailwind CSS)

This directory contains the modern Single Page Application (SPA) frontend for **TagaDetect**, built with React 19, Tailwind CSS v4, and Vite.

---

## ⚡ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Backend / Auth**: [@supabase/supabase-js](https://supabase.com/docs/reference/javascript)
- **Icons**: Optimized inline SVG & asset icons

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Environment
Create a `.env` file in this directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to **http://localhost:5173**.

> **Note on API Proxy**: The Vite dev server automatically proxies any request starting with `/api` to `http://localhost:8080` (where `server.py` runs the ML model).

---

## 📦 Production Build

To build the static production assets:
```bash
npm run build
```
Output files will be generated in `frontend/dist/`.

To test the production build locally:
```bash
npm run preview
```

---

## 🌐 Deploying to Vercel / Netlify

1. In Vercel or Netlify, set **Root Directory** to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables.

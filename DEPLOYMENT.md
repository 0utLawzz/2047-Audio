# 2047 AUDIO — Production Deployment Guide

This guide details zero-configuration deployment of **2047 AUDIO** to Vercel, Netlify, Docker, and Cloud Run.

---

## 1. Quick Deploy to Vercel (Recommended)

### Method A: Vercel CLI (Instant)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy preview build
vercel

# 3. Deploy directly to production domain
vercel --prod
```

### Method B: GitHub / GitLab Push
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Add New Project** and import the repository.
3. Vercel automatically detects the Vite preset:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Node.js Version**: `20.x` or `22.x`
4. Click **Deploy**.

### Cross-Origin Isolation for FFmpeg WASM
The included `vercel.json` ensures full multi-threading and SharedArrayBuffer support:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
      ]
    }
  ]
}
```

---

## 2. Deploy to Netlify
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "credentialless"
```

---

## 3. Production Docker Deployment
```dockerfile
# Multi-stage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Local Testing
```bash
# Start development server
npm run dev

# Run linter and typecheck
npm run lint

# Test production build bundle
npm run build && npm run preview
```

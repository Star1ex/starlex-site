# Starlex — Production Deploy

Same model as the critiqal project: **Cloudflare Tunnel → system nginx → app**,
backend in Docker (image from GHCR), frontend served as static files.
CI connects to the server over **Tailscale** and does `scp` + `ssh`.

```
push to main
  ├─ build backend image  → ghcr.io/<owner>/starlex-backend:prod
  ├─ build frontend (pnpm) → static dist artifact
  └─ deploy (Tailscale):
        backend  → scp compose + `docker compose pull && up -d`   (127.0.0.1:8083)
        frontend → scp dist → /opt/starlex/prod/frontend          (nginx serves it)
```

Ports (avoid clashing with critiqal: 8082 / 3000 / 3002):
- **backend** published on `127.0.0.1:8083` only
- postgres: internal to the compose network (not published)

---

## 1. GitHub Secrets (repo: Star1ex/starlex-site → Settings → Secrets → Actions)

Reuse the same server-access secrets as the critiqal repo (secrets are
per-repo, so add them again here):

| Secret | Value |
|--------|-------|
| `TAILSCALE_AUTHKEY` | Tailscale auth key (same as critiqal) |
| `DEPLOY_HOST` | server Tailscale IP/host |
| `DEPLOY_USER` | `honney` (or your deploy user) |
| `DEPLOY_SSH_KEY` | private SSH key for that user |
| `DEPLOY_PORT` | SSH port |
| `VITE_SENTRY_DSN` | frontend Sentry DSN (build-time) |

`GITHUB_TOKEN` is provided automatically (used to push/pull the GHCR image).

> If the GHCR package is private, on the server run once:
> `echo <PAT_with_read:packages> | docker login ghcr.io -u <user> --password-stdin`
> The workflow also logs in each run using `GITHUB_TOKEN`.

---

## 2. One-time server bootstrap (as the deploy user)

```bash
# Directories
sudo mkdir -p /opt/starlex/prod/backend /opt/starlex/prod/frontend
sudo chown -R "$USER":www-data /opt/starlex/prod
sudo chmod -R 750 /opt/starlex/prod   # www-data (nginx) needs read on frontend/

# Backend env (copy template, fill real values)
#   scp deploy/.env.prod.example  user@server:/opt/starlex/prod/backend/.env
nano /opt/starlex/prod/backend/.env
#   - set DB_PASSWORD + matching DATABASE_URL
#   - JWT_SECRET=$(openssl rand -hex 32)
#   - OAuth client IDs/secrets, SMTP creds
```

## 3. nginx

```bash
sudo cp deploy/nginx/starlex-prod.conf /etc/nginx/sites-available/starlex-prod
sudo ln -s /etc/nginx/sites-available/starlex-prod /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Reuses the `api_prod`, `frontend`, `conn_limit` rate-limit zones already declared
in `/etc/nginx/nginx.conf`. No SSL here — Cloudflare terminates TLS at the edge.

## 4. Cloudflare Tunnel

Add the Starlex hostnames to the existing tunnel (see
`deploy/cloudflared-ingress.snippet.yml`):

```bash
sudo nano /etc/cloudflared/config.yml          # add starlex.cc / www.starlex.cc
cloudflared tunnel route dns 7b51396c-254b-4a44-96b9-13d6763a38f2 starlex.cc
cloudflared tunnel route dns 7b51396c-254b-4a44-96b9-13d6763a38f2 www.starlex.cc
sudo systemctl restart cloudflared
```
The `starlex.cc` zone must live in the Cloudflare account that owns the tunnel.

## 5. First deploy

Merge `dev` → `main` (or push to `main`). The workflow builds and deploys.
First run touches both backend and frontend, so the whole stack comes up.

Manual smoke test on the server:
```bash
curl -s http://127.0.0.1:8083/api/health        # -> healthy
curl -s -H 'Host: starlex.cc' http://127.0.0.1/ # -> index.html
docker compose -f /opt/starlex/prod/backend/docker-compose.prod.yml ps
```

---

## OAuth / external config reminders
- Google & GitHub OAuth apps: redirect URIs →
  `https://starlex.cc/api/auth/google/callback` and `.../github/callback`
- DNS for `starlex.cc` lives in Cloudflare (proxied), pointing at the tunnel.

## Rollback
Backend images are tagged `prod-<sha>`. To roll back:
```bash
cd /opt/starlex/prod/backend
BACKEND_IMAGE=ghcr.io/<owner>/starlex-backend:prod-<good-sha> \
  docker compose -f docker-compose.prod.yml up -d
```

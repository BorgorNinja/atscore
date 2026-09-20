# VPS Deployment Guide (for an agent)

Target: run ATScore in production on a self-managed VPS, behind TLS, with
Postgres and a process manager. Execute steps in order — later steps assume
earlier ones succeeded. Where a step includes a verification command, run it
and confirm the expected output before moving on.

Assumptions: Ubuntu/Debian VPS, SSH access, sudo privileges, a domain name
already pointed at the VPS's IP (an A record). Substitute your actual domain
everywhere `example.com` appears.

---

## 1. System prerequisites

```bash
node -v   # need >= 18.18 (Next.js 15 requirement)
npm -v
git --version
```

If Node is missing or too old, install Node 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install Postgres, nginx, certbot, and pm2:

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib nginx
sudo npm install -g pm2
sudo apt-get install -y certbot python3-certbot-nginx
```

Verify Postgres is running:

```bash
sudo systemctl status postgresql --no-pager
```

---

## 2. Create the database

```bash
sudo -u postgres psql -c "CREATE DATABASE atscore;"
sudo -u postgres psql -c "CREATE USER atscore_app WITH ENCRYPTED PASSWORD 'CHANGE_ME_STRONG_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE atscore TO atscore_app;"
```

Replace `CHANGE_ME_STRONG_PASSWORD` with a generated secret
(`openssl rand -base64 24`) and keep it — it goes in `.env` in step 5.

---

## 3. Clone and install

```bash
cd /opt
sudo git clone https://github.com/BorgorNinja/atscore.git
sudo chown -R $USER:$USER atscore
cd atscore
npm install
```

If this fails at the `postinstall` (`prisma generate`) step with a fetch
error against `binaries.prisma.sh`, the VPS's outbound network is blocking
that host — allow it (it's how Prisma downloads its query engine binary).
This is a known failure mode; see Troubleshooting below.

---

## 4. Switch Prisma to Postgres

The repo ships with `provider = "sqlite"` for local dev. Switch it:

```bash
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
grep provider prisma/schema.prisma   # confirm it now says "postgresql"
```

---

## 5. Configure environment

```bash
cp .env.example .env
```

Edit `.env` to:

```bash
DATABASE_URL="postgresql://atscore_app:CHANGE_ME_STRONG_PASSWORD@localhost:5432/atscore"
NEXTAUTH_URL="https://example.com"
NEXTAUTH_SECRET="<output of: openssl rand -base64 32>"
OPENAI_API_KEY=""   # optional — leave blank to skip AI-assisted suggestions
```

`NEXTAUTH_URL` must exactly match the public HTTPS domain — a mismatch
silently breaks login redirects.

---

## 6. Generate client, run migrations, build

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

`migrate deploy` (not `migrate dev`) — `dev` is interactive and expects a
disposable dev database; `deploy` applies existing migrations
non-interactively, which is what a first production setup and every
subsequent deploy should use.

Verify the build succeeded and a `.next/` directory exists:

```bash
ls .next/BUILD_ID
```

---

## 7. Run it under pm2

```bash
pm2 start npm --name atscore -- start
pm2 save
pm2 startup   # run the printed command to enable pm2 on boot
```

Verify it's listening locally:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
# expect: 200
```

---

## 8. Reverse proxy + TLS

Create `/etc/nginx/sites-available/atscore`:

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it and issue a certificate:

```bash
sudo ln -s /etc/nginx/sites-available/atscore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.com
```

Certbot rewrites the server block to redirect port 80 → 443 and add the
cert/key paths automatically.

---

## 9. Firewall

Allow only what's needed publicly; keep 3000 internal-only:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Confirm port 3000 is not separately opened — it should only be reachable via
nginx's proxy on localhost.

---

## 10. End-to-end verification

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://example.com
# expect: 200
```

Then manually, from a browser:
1. Visit `https://example.com` — landing page loads.
2. `/register` — create an account.
3. `/scan` — upload a `.pdf`/`.docx`/`.txt` resume + paste a job description
   — confirm a score and keyword breakdown render.
4. `/dashboard` — confirm the scan appears in history.

---

## Updating after a new commit

```bash
cd /opt/atscore
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart atscore
```

---

## Troubleshooting

- **`prisma generate` fails fetching from `binaries.prisma.sh`** — the VPS's
  firewall/proxy is blocking that host. Allow outbound HTTPS to it, or run
  `npm install` once on a machine with open internet and copy the resulting
  `node_modules/.prisma` and `node_modules/@prisma` directories over.
- **`pm2 start` succeeds but `curl localhost:3000` hangs/refuses** — check
  `pm2 logs atscore` for the actual startup error; a missing/invalid
  `DATABASE_URL` is the most common cause.
- **Login redirects to the wrong domain or fails silently** — `NEXTAUTH_URL`
  doesn't match the domain being visited (including `http` vs `https`).
- **`migrate deploy` errors "no migration found"** — the repo's
  `prisma/migrations/` folder is empty because no migration has been created
  yet. Run `npx prisma migrate dev --name init` once, locally or on a scratch
  DB, commit the generated `prisma/migrations/` folder, then `migrate deploy`
  on the VPS.
- **502 from nginx** — the Node process isn't running or crashed; check
  `pm2 status` and `pm2 logs atscore`.

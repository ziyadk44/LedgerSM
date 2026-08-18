# Shariq Marbles — Supplier Payment Ledger

A private, online ledger for tracking payments you make to your marble &
granite suppliers — who you owe, how much, and what you've already paid
against each bill (cash or online/cheque), with sorting, filtering, and PDF
statements.

Built with Next.js (App Router) + a serverless Postgres database (Neon), so
it can be deployed for free and reached from your phone, shop computer, or
anywhere with internet.

---

## 1. What you'll need (both free)

1. A **Neon** account — free serverless Postgres database. https://neon.tech
2. A **Vercel** account — free hosting for the app itself. https://vercel.com
   (Vercel also offers Neon as a built-in integration, so you can do both
   from one dashboard if you prefer — see step 2b.)

You do **not** need to know SQL or write any code. The app creates its own
database tables automatically the first time it runs.

---

## 2. Set up the database

### Option A — Create a Neon project directly (simplest)

1. Go to https://neon.tech and sign up (free).
2. Create a new project — any name, e.g. `shariq-marbles`.
3. On the project dashboard, find **Connection string** (sometimes under
   "Connect" or "Quickstart"). Copy the full string — it looks like:
   ```
   postgres://user:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this tab open — you'll paste this into Vercel in step 4.

### Option B — Provision Neon from inside Vercel

1. Create a new project on Vercel (see step 3 first), then in the project's
   **Storage** tab, choose **Neon** → **Create**. Vercel will automatically
   add the connection string to your project's environment variables for
   you (skip pasting it manually in step 4).

---

## 3. Push this code to GitHub

Vercel deploys from a Git repository.

1. Create a new, empty repository on GitHub (e.g. `shariq-marbles-ledger`).
2. In this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Shariq Marbles supplier ledger"
   git branch -M main
   git remote add origin https://github.com/<your-username>/shariq-marbles-ledger.git
   git push -u origin main
   ```

---

## 4. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo you just pushed.
2. Before clicking Deploy, open **Environment Variables** and add three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The Neon connection string from step 2 (skip if you used Option B) |
   | `APP_PIN` | The PIN you want to unlock the ledger with — 4 to 6 digits, e.g. `4821` |
   | `SESSION_SECRET` | Any long random string — see "Generating a SESSION_SECRET" below |

3. Click **Deploy**. After a minute or two you'll get a URL like
   `https://shariq-marbles-ledger.vercel.app` — open it, enter your PIN, and
   you're in. Add it to your phone's home screen for quick access.

### Generating a SESSION_SECRET

Any long, random, hard-to-guess string works. If you have a terminal handy:
```bash
openssl rand -hex 32
```
Or just mash your keyboard for 40+ random characters. It's only used to
sign your login cookie — you never need to type it yourself.

### Changing your PIN later

Edit the `APP_PIN` value in your Vercel project's **Settings → Environment
Variables**, then redeploy (Vercel will prompt you, or push any small commit).

---

## 5. Local development (optional)

If you want to run the app on your own computer before/instead of deploying:

```bash
npm install
cp .env.example .env.local
# then fill in DATABASE_URL, APP_PIN, SESSION_SECRET in .env.local
npm run dev
```
Open http://localhost:3000.

---

## How the data is organized

- **Suppliers** — the stone traders/firms you buy from.
- **Bills** — each purchase invoice from a supplier (date + total amount owed).
- **Payments** — each installment you pay against a bill (date, amount,
  cash or online/cheque, optional reference note like a cheque number).

Balances (per bill, per supplier, and overall) are calculated automatically
from bills minus payments — nothing to total by hand.

## PDF statements

From the **All Payments** tab you can export either:
- **By date range** — pick a month or any range, optionally filtered to one
  supplier, or
- **Selected entries** — tick specific rows and export just those.

Both produce a proper PDF with a running total, generated entirely in your
browser (no extra setup needed).

## A note on security

The PIN is a privacy screen to keep casual eyes out — it is not
enterprise-grade encryption. Treat your Vercel account and GitHub repo (which
holds your environment variables and, if you ever hand this project to
someone else, admin access to your data) with the same care you'd give any
other business login.

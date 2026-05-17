# Plombare

Secrétaire IA WhatsApp pour plombiers indépendants.

## Stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Supabase (Postgres + Auth + RLS)
- Anthropic Claude (Sonnet 4.6) — qualification & réponses
- Twilio WhatsApp Business API — entrée/sortie messages
- Vercel — hosting

## Démarrage (3 étapes)

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer les services externes

**Supabase :**
1. Crée un projet sur https://supabase.com
2. SQL Editor → colle/exécute `supabase/schema.sql`
3. Authentication → Providers → active "Email" (magic link suffit)
4. Récupère `URL` + `anon key` + `service_role key` (Project Settings → API)

**Anthropic :**
1. Crée une clé sur https://console.anthropic.com
2. Récupère `ANTHROPIC_API_KEY`

**Twilio :**
1. Compte Twilio + WhatsApp Sender (sandbox au début, business approuvé ensuite)
2. Récupère `Account SID` + `Auth Token`

### 3. Variables d'env

```bash
cp .env.local.example .env.local
# remplis les valeurs
```

### 4. Lancer

```bash
npm run dev
```

## Onboarding d'un nouvel artisan (V1 = manuel)

1. Dans Supabase Studio → Authentication → Users → "Add user" (email du plombier)
2. Copie son UUID
3. SQL Editor :
   ```sql
   insert into artisans (user_id, name, twilio_number, notify_number)
   values ('<uuid>', 'Nom', 'whatsapp:+33...', 'whatsapp:+33...');
   ```
4. Le plombier reçoit un magic link via `/login`

## Webhook Twilio

À pointer sur `https://<app>.vercel.app/api/webhook/twilio` après déploiement.

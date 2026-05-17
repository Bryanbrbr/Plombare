# 🚀 Déploiement Plombare — de zéro à production

Suivre dans l'ordre. Compte ~45 min total si tu pars de zéro sur les services.

---

## 1. Supabase (10 min)

### 1.1 Créer le projet
1. Va sur https://supabase.com → **New project**
2. Région : **Europe West (Paris)** (latence minimale pour la France)
3. Mot de passe DB : génère et sauvegarde (tu en auras besoin si tu fais un dump)
4. Attends que le projet soit prêt (~2 min)

### 1.2 Exécuter le schéma
1. **SQL Editor** (icône `</>` dans la sidebar) → **New query**
2. Colle le contenu de [`supabase/schema.sql`](supabase/schema.sql)
3. **Run** → tu dois voir "Success"

### 1.3 Configurer l'auth
1. **Authentication → Providers → Email** : laisse activé
2. **Authentication → URL Configuration** :
   - **Site URL** : `https://<ton-app>.vercel.app` (tu la mettras après le déploiement Vercel)
   - **Redirect URLs** : ajoute `https://<ton-app>.vercel.app/api/auth/callback` et `http://localhost:3000/api/auth/callback`

### 1.4 Récupérer les clés
**Project Settings → API** :
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **jamais côté client**

---

## 2. Anthropic (2 min)

1. Va sur https://console.anthropic.com → **Settings → API Keys → Create Key**
2. Copie la clé → `ANTHROPIC_API_KEY`
3. Mets ~10 € de crédit pour démarrer (Settings → Billing) — suffit pour des centaines de conversations test

---

## 3. Twilio WhatsApp Sandbox (10 min)

> Le **sandbox** marche sans approbation Meta. Limite : tu dois faire opt-in chaque numéro test avant qu'il puisse écrire. Parfait pour le MVP. Pour un vrai numéro business, fais la demande WhatsApp Business Profile plus tard.

### 3.1 Compte & sandbox
1. Crée un compte sur https://console.twilio.com (utilise les 15 € de crédit offerts)
2. **Messaging → Try it out → Send a WhatsApp message**
3. Note le **numéro Twilio sandbox** (typiquement `+1 415 523 8886`) — c'est ton `twilio_number`
4. Note le **code de jointure** affiché (ex: `join purple-elephant`)

### 3.2 Récupérer credentials
**Account Dashboard** (en haut) :
- `Account SID` → `TWILIO_ACCOUNT_SID`
- `Auth Token` → `TWILIO_AUTH_TOKEN`

### 3.3 Opt-in du numéro test
Depuis ton WhatsApp perso, envoie `join purple-elephant` (avec TON code) au numéro sandbox.
→ Tu reçois "You are now connected to the sandbox".
→ Tu pourras désormais envoyer des messages au sandbox depuis ce numéro.

---

## 4. Déploiement Vercel (5 min)

### 4.1 Push sur GitHub
```bash
cd C:\Users\bryan\Desktop\Plombare
git init
git add .
git commit -m "Initial commit"
git remote add origin <ton-repo-github>
git push -u origin main
```

### 4.2 Importer dans Vercel
1. https://vercel.com → **Add New → Project**
2. Importe le repo GitHub
3. Framework : **Next.js** (auto-détecté)
4. **Environment Variables** — colle TOUTES celles-ci :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ANTHROPIC_API_KEY=...
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   NEXT_PUBLIC_APP_URL=https://<ton-app>.vercel.app
   ```
   ⚠️ **`NEXT_PUBLIC_APP_URL` doit matcher l'URL Vercel finale.** Si tu changes de domaine, mets à jour cette var et redéploie.
5. **Deploy** → ~2 min

### 4.3 Mettre à jour les Redirect URLs Supabase
Retourne sur Supabase → **Authentication → URL Configuration** et remplace `<ton-app>` par ton vrai sous-domaine Vercel.

---

## 5. Pointer le webhook Twilio (2 min)

1. https://console.twilio.com → **Messaging → Try it out → Send a WhatsApp message → Sandbox settings**
2. **When a message comes in** : `https://<ton-app>.vercel.app/api/webhook/twilio` — méthode **POST**
3. **Save**

> Pour la production avec un vrai numéro WhatsApp Business : tu configureras le même webhook dans le **Messaging Service** rattaché au numéro.

---

## 6. Créer ton premier artisan (3 min)

### 6.1 Créer l'utilisateur Supabase
1. Supabase → **Authentication → Users → Add user → Send invitation**
2. Email du plombier → il reçoit un magic link
3. Copie son **UUID** (apparaît dans la liste après création)

### 6.2 Insérer l'artisan
SQL Editor :
```sql
insert into artisans (user_id, name, twilio_number, notify_number)
values (
  '<UUID-collé-ici>',
  'Jean Dupont Plomberie',
  'whatsapp:+14155238886',          -- numéro sandbox Twilio
  'whatsapp:+33699999999'           -- numéro perso du plombier (déjà opt-in sandbox !)
);
```

> ⚠️ Pour le sandbox, le `notify_number` doit AUSSI avoir fait le `join purple-elephant` sinon Twilio refusera de lui envoyer des notifs.

### 6.3 Connexion
Le plombier va sur `https://<ton-app>.vercel.app/login`, entre son email, clique le magic link → dashboard.

---

## ✅ Checklist E2E (10 min)

Test depuis un 3e numéro WhatsApp (pas le plombier, pas toi-admin). Ce numéro doit avoir fait `join <code>` au sandbox.

### Test 1 — Premier message simple
1. Envoie depuis WhatsApp : `"Bonjour, j'ai un robinet qui goutte dans ma cuisine"`
2. **Attendu** :
   - Réponse IA en 3-6s
   - Ligne dans `conversations` (Supabase) avec `problem_type` ≈ "robinet", `urgency` 2-3
   - 2 lignes dans `messages` (client + ai)
   - Conv visible sur `/dashboard` avec le bon badge

### Test 2 — Urgence + notif artisan
1. Envoie : `"FUITE D'EAU ÉNORME sous mon évier, ça inonde la cuisine, je sais pas couper l'arrivée"`
2. **Attendu** :
   - Réponse IA empathique
   - `urgency` = 5, `needs_appointment` = true
   - **Le numéro `notify_number` reçoit un message Twilio** "🔔 URGENT — urgence 5/5 …" avec lien vers la conv

### Test 3 — Photo
1. Envoie une photo (n'importe quelle photo) avec un texte court
2. **Attendu** :
   - `media_url` peuplé dans `messages`
   - L'IA mentionne la photo dans sa réponse (ex: "je vois bien sur la photo…")

### Test 4 — Pause/Reprendre
1. Envoie : `"je veux parler à un humain"`
2. **Attendu** :
   - Conv passe en `status = 'paused'`
   - Client reçoit "Bien noté, je préviens …"
   - Artisan reçoit "⏸️ Pause demandée…"
3. Renvoie un autre message depuis le client : `"toujours là ?"`
4. **Attendu** : message enregistré dans `messages` MAIS pas de réponse IA (silence radio)
5. Depuis le `notify_number` artisan, envoie `reprendre` au numéro sandbox
6. **Attendu** : conv repasse `status = 'open'`, artisan reçoit "✅ IA réactivée"
7. Client renvoie un message → IA répond à nouveau

### Test 5 — Dashboard
1. Va sur `/dashboard` → liste des 4 conversations triées par récence
2. Clique sur une conv → détail complet avec tous les messages
3. Vérifie que tu ne vois **QUE** les convs de l'artisan connecté (crée un 2e artisan + 2e user pour valider RLS)

### Test 6 — Sécurité webhook (prod)
1. Depuis ton terminal :
   ```bash
   curl -X POST https://<ton-app>.vercel.app/api/webhook/twilio -d "Body=test"
   ```
2. **Attendu** : `403 forbidden` (signature manquante)

---

## 🛟 Debug rapide

| Symptôme | Vérif |
|---|---|
| Webhook Twilio → 500 | Vercel **Functions logs** (Deployments → ta deploy → Functions) |
| Pas de réponse client | Twilio **Monitor → Logs → Errors** + Vercel logs |
| Magic link redirige vers `?error=auth` | Redirect URL Supabase pas alignée avec `NEXT_PUBLIC_APP_URL` |
| Dashboard vide alors qu'il y a des convs | RLS : l'artisan connecté n'est pas lié au bon `user_id` |
| `403 forbidden` sur webhook légitime | `NEXT_PUBLIC_APP_URL` ne correspond pas à l'URL réelle (signature Twilio calculée sur la mauvaise URL) |

---

## 📊 Coûts approximatifs (50 plombiers, 20 msgs/j chacun = 1000 msgs/j)

| Service | ~Coût mensuel |
|---|---|
| Vercel Hobby (free) | 0 € (bascule Pro à 20 $/mo si trafic) |
| Supabase Free | 0 € (limite 500 MB, OK pour MVP) |
| Anthropic Sonnet 4.6 | ~15-30 € (1000 msgs/j × ~2k tokens × 30j) |
| Twilio WhatsApp | ~30-60 € (sandbox = gratuit ; prod ~0.005 €/msg sortant) |
| **Total MVP** | **~50 €/mois pour 50 clients** |

Avec 10 plombiers à 49 €/mois → 490 € MRR → 440 € marge brute.

-- ============================================================
-- PLOMBARE — Schéma Supabase
-- À exécuter dans SQL Editor (Supabase Studio) une seule fois.
-- ============================================================

-- ── ARTISANS (1 ligne = 1 plombier qui paie) ────────────────
create table if not exists artisans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text not null,
  twilio_number text unique not null,        -- ex: "whatsapp:+33612345678"
  notify_number text not null,               -- son perso pour recevoir les notifs urgentes
  created_at timestamptz default now()
);

create index if not exists artisans_twilio_number_idx on artisans(twilio_number);

-- ── CONVERSATIONS (1 ligne = 1 client × 1 artisan) ──────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid references artisans(id) on delete cascade not null,
  client_number text not null,               -- "whatsapp:+33699999999"
  client_name text,                          -- éventuellement extrait par l'IA
  problem_type text,                         -- "fuite", "bouché", "chauffe-eau"...
  urgency int check (urgency between 1 and 5),
  needs_appointment boolean default false,
  status text default 'open',                -- 'open' | 'paused' | 'closed'
  summary text,                              -- résumé IA pour l'artisan
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(artisan_id, client_number)
);

create index if not exists conversations_artisan_recent_idx
  on conversations(artisan_id, last_message_at desc);

-- ── MESSAGES (tous les messages des deux sens) ──────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('client', 'ai', 'artisan')),
  body text,
  media_url text,                            -- URL Twilio (publique signée) ou Supabase Storage
  created_at timestamptz default now()
);

create index if not exists messages_conv_time_idx
  on messages(conversation_id, created_at);

-- ============================================================
-- RLS — chaque artisan ne voit QUE ses propres données
-- Le webhook utilise la service_role key et bypass RLS (voulu).
-- ============================================================
alter table artisans enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "artisan reads own profile" on artisans;
create policy "artisan reads own profile"
  on artisans for select
  using (auth.uid() = user_id);

drop policy if exists "artisan reads own conversations" on conversations;
create policy "artisan reads own conversations"
  on conversations for select
  using (
    artisan_id in (select id from artisans where user_id = auth.uid())
  );

drop policy if exists "artisan reads own messages" on messages;
create policy "artisan reads own messages"
  on messages for select
  using (
    conversation_id in (
      select c.id
      from conversations c
      join artisans a on a.id = c.artisan_id
      where a.user_id = auth.uid()
    )
  );

-- ============================================================
-- SEED EXAMPLE (à adapter manuellement pour chaque nouvel artisan)
-- ============================================================
-- 1) Créer le user dans Authentication → Users (Supabase Studio)
-- 2) Récupérer son UUID, puis :
--
-- insert into artisans (user_id, name, twilio_number, notify_number)
-- values (
--   '00000000-0000-0000-0000-000000000000',  -- user_id
--   'Jean Dupont Plomberie',
--   'whatsapp:+33612345678',                 -- numéro Twilio du business
--   'whatsapp:+33699999999'                  -- son perso pour notifs urgentes
-- );

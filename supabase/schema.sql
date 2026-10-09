-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.orders (
  id                text primary key,                 -- e.g. TB-K7M2Q9XA
  event_id          text not null,
  event_city        text not null,
  event_venue       text not null,
  event_date        text not null,
  event_time        text not null,
  ticket_label      text not null,
  qty               int  not null check (qty between 1 and 6),
  amount_cents      int  not null check (amount_cents > 0),
  customer_name     text not null,
  customer_email    text not null,
  status            text not null default 'Pending Verification'
                    check (status in ('Pending Verification','Approved','Rejected')),
  token_image_path  text not null,                    -- FRONT image path inside the PRIVATE bucket
  token_back_image_path text,                         -- BACK image path
  access_token_hash text not null,                    -- sha256 of the customer's status token
  admin_note        text,                             -- optional rejection reason shown to the customer
  created_at        timestamptz not null default now(),
  decided_at        timestamptz
);

-- Lock the table down: only the server (service role key) can touch it. No public policies.
alter table public.orders enable row level security;

-- PRIVATE storage bucket for token images (public = false). No storage policies are created,
-- so nothing is reachable from the browser; the server streams images to signed-in admins only.
insert into storage.buckets (id, name, public)
values ('token-images', 'token-images', false)
on conflict (id) do update set public = false;

-- Already ran an older version of this file? Run just this line instead:
-- alter table public.orders add column if not exists token_back_image_path text;

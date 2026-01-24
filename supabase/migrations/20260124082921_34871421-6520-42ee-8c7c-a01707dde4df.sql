-- Table for idempotent payment intents
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  provider text not null default 'cardstream',
  pupil_id uuid,
  instructor_id uuid,
  amount_pence integer not null check (amount_pence > 0),
  currency_code text not null default '826',
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  transaction_unique text,
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_intents_pupil_idx on public.payment_intents(pupil_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_payment_intents_updated on public.payment_intents;
create trigger trg_payment_intents_updated
before update on public.payment_intents
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.payment_intents enable row level security;

-- Allow service role full access (edge functions use service role)
create policy "Service role full access" on public.payment_intents
  for all using (true) with check (true);
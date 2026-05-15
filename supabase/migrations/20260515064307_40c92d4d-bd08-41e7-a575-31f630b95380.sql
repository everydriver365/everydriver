create table if not exists public.booking_test_swap_optins (
  id uuid primary key default gen_random_uuid(),
  pupil_id uuid not null references public.pupils(id) on delete cascade,
  instructor_id uuid not null references public.instructors(id) on delete cascade,
  test_date text,
  test_time text,
  test_centre text,
  preference text not null check (preference in ('earlier','later','any')),
  consent_given boolean not null,
  consent_timestamp timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_test_swap_optins_pupil_idx on public.booking_test_swap_optins(pupil_id);
create index if not exists booking_test_swap_optins_instructor_idx on public.booking_test_swap_optins(instructor_id);

alter table public.booking_test_swap_optins enable row level security;

-- Anyone (including anon checkout flow) can insert: booking creation happens before pupil auth exists
-- Validity is enforced by FK + check constraints
create policy "Public can insert swap opt-ins"
  on public.booking_test_swap_optins
  for insert
  to anon, authenticated
  with check (true);

-- Instructors can view opt-ins for their own pupils
create policy "Instructors view own pupil swap opt-ins"
  on public.booking_test_swap_optins
  for select
  to authenticated
  using (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Admins full access
create policy "Admins full access booking swap opt-ins"
  on public.booking_test_swap_optins
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

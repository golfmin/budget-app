create table if not exists public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_email text,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  payer text not null default 'husband' check (payer in ('husband', 'wife')),
  payment_method text not null default 'card' check (payment_method in ('cash', 'card')),
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.budget_entries
  add column if not exists payer text not null default 'husband';

alter table public.budget_entries
  add column if not exists payment_method text not null default 'card';

alter table public.budget_entries
  alter column payer set default 'husband';

alter table public.budget_entries
  alter column payment_method set default 'card';

update public.budget_entries
  set payer = 'husband'
  where payer is null;

update public.budget_entries
  set payment_method = 'card'
  where payment_method is null;

alter table public.budget_entries
  alter column payer set not null;

alter table public.budget_entries
  alter column payment_method set not null;

do $$
begin
  alter table public.budget_entries
    add constraint budget_entries_payer_check check (payer in ('husband', 'wife'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.budget_entries
    add constraint budget_entries_payment_method_check check (payment_method in ('cash', 'card'));
exception
  when duplicate_object then null;
end $$;

create index if not exists budget_entries_household_created_idx
  on public.budget_entries (household_code, created_at desc);

alter table public.budget_entries enable row level security;

drop policy if exists "Household members can read entries" on public.budget_entries;
create policy "Household members can read entries"
  on public.budget_entries
  for select
  using (
    household_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'household_code', '')
  );

drop policy if exists "Household members can add entries" on public.budget_entries;
create policy "Household members can add entries"
  on public.budget_entries
  for insert
  with check (
    user_id = auth.uid()
    and household_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'household_code', '')
  );

drop policy if exists "Household members can update entries" on public.budget_entries;
create policy "Household members can update entries"
  on public.budget_entries
  for update
  using (
    household_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'household_code', '')
  )
  with check (
    household_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'household_code', '')
  );

drop policy if exists "Household members can delete entries" on public.budget_entries;
create policy "Household members can delete entries"
  on public.budget_entries
  for delete
  using (
    household_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'household_code', '')
  );

do $$
begin
  alter publication supabase_realtime add table public.budget_entries;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

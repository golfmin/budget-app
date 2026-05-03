create table if not exists public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_email text,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

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

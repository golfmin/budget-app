alter table public.budget_entries
  add column if not exists payer text;

alter table public.budget_entries
  add column if not exists payment_method text;

update public.budget_entries
  set payer = 'husband'
  where payer is null;

update public.budget_entries
  set payment_method = 'card'
  where payment_method is null;

alter table public.budget_entries
  alter column payer set default 'husband';

alter table public.budget_entries
  alter column payment_method set default 'card';

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

notify pgrst, 'reload schema';

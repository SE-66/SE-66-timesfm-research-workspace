-- App-owned research metadata only. Raw CSV uploads remain inside the external
-- Hugging Face Space and are intentionally not copied into this table.

create table if not exists public.research_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 120),
  scenario text not null check (scenario in ('B0', 'C1', 'C2', 'C3', 'C4', 'C5')),
  dataset_label text not null default '' check (char_length(dataset_label) <= 120),
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now()
);

alter table public.research_entries enable row level security;

revoke all on table public.research_entries from anon;
revoke all on table public.research_entries from authenticated;
grant select, insert, delete on table public.research_entries to authenticated;

create policy "research_entries_select_own"
on public.research_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "research_entries_insert_own"
on public.research_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "research_entries_delete_own"
on public.research_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists research_entries_user_created_idx
on public.research_entries (user_id, created_at desc);

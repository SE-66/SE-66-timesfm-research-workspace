-- Mirrors the live hardening migration applied after project creation.
-- Supabase may grant broader table privileges through default privileges; keep
-- the browser role limited to operations the research-log UI actually uses.

revoke all on table public.research_entries from anon;
revoke all on table public.research_entries from authenticated;
grant select, insert, delete on table public.research_entries to authenticated;

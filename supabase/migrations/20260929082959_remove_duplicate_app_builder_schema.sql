-- Remove an intermediate duplicate schema revision so the live database matches
-- the canonical app-builder model used by the application. All affected tables
-- were empty when this migration was applied.

drop policy if exists builder_projects_owner_all on public.builder_projects;
drop policy if exists oss_candidates_owner_all on public.oss_candidates;
drop policy if exists builder_artifacts_owner_all on public.builder_artifacts;

drop index if exists public.builder_projects_user_updated_idx;
drop index if exists public.oss_candidates_project_stars_idx;
drop index if exists public.builder_artifacts_project_created_idx;

drop table if exists public.oss_decisions;
drop table if exists public.builder_runs;

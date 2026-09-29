-- Open-source-first app builder control plane.
-- The previous research_entries table is intentionally left untouched to preserve
-- migration history; the new application does not use it.

create table if not exists public.builder_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  brief text not null check (char_length(brief) between 10 and 12000),
  stack_preferences text not null default '' check (char_length(stack_preferences) <= 2000),
  deployment_target text not null default 'cloudflare' check (char_length(deployment_target) <= 120),
  status text not null default 'draft' check (status in ('draft','researching','ready','generating','artifact_ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.build_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.builder_projects(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  status text not null default 'queued' check (status in ('queued','researching','reviewing','generating','artifact_ready','failed')),
  stage text not null default 'inspect' check (stage in ('inspect','research','license','understand','integrate','build','test','verify','artifact_ready','failed')),
  model text not null default '',
  error_message text not null default '' check (char_length(error_message) <= 4000),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.oss_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.builder_projects(id) on delete cascade,
  run_id uuid not null references public.build_runs(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  repository_full_name text not null check (char_length(repository_full_name) between 3 and 240),
  repository_url text not null check (char_length(repository_url) <= 500),
  description text not null default '' check (char_length(description) <= 2000),
  license_spdx text not null default 'UNKNOWN' check (char_length(license_spdx) <= 80),
  stars integer not null default 0 check (stars >= 0),
  primary_language text not null default '' check (char_length(primary_language) <= 80),
  pushed_at timestamptz,
  archived boolean not null default false,
  maintenance_state text not null default 'unknown' check (maintenance_state in ('active','stale','archived','unknown')),
  license_state text not null default 'review' check (license_state in ('permissive','reciprocal','restricted','unknown','review')),
  notes text not null default '' check (char_length(notes) <= 4000),
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, repository_full_name)
);

create table if not exists public.integration_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.builder_projects(id) on delete cascade,
  run_id uuid not null references public.build_runs(id) on delete cascade,
  candidate_id uuid references public.oss_candidates(id) on delete set null,
  user_id uuid not null default auth.uid(),
  decision text not null check (decision in ('reuse','reference','reject','custom')),
  integration_method text not null check (integration_method in ('dependency','api','component','adapter','fork','reference','custom')),
  rationale text not null check (char_length(rationale) between 3 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.builder_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.builder_projects(id) on delete cascade,
  run_id uuid not null references public.build_runs(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('source_bundle','build_spec','open_source_components','verification_plan')),
  filename text not null check (char_length(filename) between 1 and 240),
  content jsonb not null,
  verification_state text not null default 'unverified' check (verification_state in ('unverified','verified','failed')),
  created_at timestamptz not null default now()
);

alter table public.builder_projects enable row level security;
alter table public.build_runs enable row level security;
alter table public.oss_candidates enable row level security;
alter table public.integration_decisions enable row level security;
alter table public.builder_artifacts enable row level security;

revoke all on table public.builder_projects from anon;
revoke all on table public.build_runs from anon;
revoke all on table public.oss_candidates from anon;
revoke all on table public.integration_decisions from anon;
revoke all on table public.builder_artifacts from anon;

revoke all on table public.builder_projects from authenticated;
revoke all on table public.build_runs from authenticated;
revoke all on table public.oss_candidates from authenticated;
revoke all on table public.integration_decisions from authenticated;
revoke all on table public.builder_artifacts from authenticated;

grant select, insert, update, delete on table public.builder_projects to authenticated;
grant select, insert, update, delete on table public.build_runs to authenticated;
grant select, insert, update, delete on table public.oss_candidates to authenticated;
grant select, insert, update, delete on table public.integration_decisions to authenticated;
grant select, insert, update, delete on table public.builder_artifacts to authenticated;

create policy "builder_projects_select_own" on public.builder_projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "builder_projects_insert_own" on public.builder_projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "builder_projects_update_own" on public.builder_projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "builder_projects_delete_own" on public.builder_projects for delete to authenticated using ((select auth.uid()) = user_id);

create policy "build_runs_select_own" on public.build_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy "build_runs_insert_own" on public.build_runs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "build_runs_update_own" on public.build_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "build_runs_delete_own" on public.build_runs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "oss_candidates_select_own" on public.oss_candidates for select to authenticated using ((select auth.uid()) = user_id);
create policy "oss_candidates_insert_own" on public.oss_candidates for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "oss_candidates_update_own" on public.oss_candidates for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "oss_candidates_delete_own" on public.oss_candidates for delete to authenticated using ((select auth.uid()) = user_id);

create policy "integration_decisions_select_own" on public.integration_decisions for select to authenticated using ((select auth.uid()) = user_id);
create policy "integration_decisions_insert_own" on public.integration_decisions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "integration_decisions_update_own" on public.integration_decisions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "integration_decisions_delete_own" on public.integration_decisions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "builder_artifacts_select_own" on public.builder_artifacts for select to authenticated using ((select auth.uid()) = user_id);
create policy "builder_artifacts_insert_own" on public.builder_artifacts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "builder_artifacts_update_own" on public.builder_artifacts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "builder_artifacts_delete_own" on public.builder_artifacts for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists builder_projects_user_created_idx on public.builder_projects(user_id, created_at desc);
create index if not exists build_runs_project_created_idx on public.build_runs(project_id, started_at desc);
create index if not exists build_runs_user_created_idx on public.build_runs(user_id, started_at desc);
create index if not exists oss_candidates_run_idx on public.oss_candidates(run_id);
create index if not exists oss_candidates_user_idx on public.oss_candidates(user_id);
create index if not exists integration_decisions_run_idx on public.integration_decisions(run_id);
create index if not exists integration_decisions_user_idx on public.integration_decisions(user_id);
create index if not exists builder_artifacts_run_idx on public.builder_artifacts(run_id);
create index if not exists builder_artifacts_user_idx on public.builder_artifacts(user_id);

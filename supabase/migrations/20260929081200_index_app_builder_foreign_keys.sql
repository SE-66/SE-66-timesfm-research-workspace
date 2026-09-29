create index if not exists oss_candidates_project_idx
on public.oss_candidates(project_id);

create index if not exists integration_decisions_project_idx
on public.integration_decisions(project_id);

create index if not exists integration_decisions_candidate_idx
on public.integration_decisions(candidate_id)
where candidate_id is not null;

create index if not exists builder_artifacts_project_idx
on public.builder_artifacts(project_id);

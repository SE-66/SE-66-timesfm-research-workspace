-- The original forecasting prototype is retired. The table was empty when this
-- cleanup migration was applied, and the Open Source App Builder does not use it.

drop table if exists public.research_entries;

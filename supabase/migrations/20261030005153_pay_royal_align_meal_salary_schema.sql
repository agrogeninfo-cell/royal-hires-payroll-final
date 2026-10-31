
alter table public.meals add column if not exists labour_code text;
alter table public.meals alter column id set default gen_random_uuid();
update public.meals m set labour_code=e.labour_code
from public.employees e where m.employee_id=e.id and m.labour_code is null;
create unique index if not exists meals_labour_code_meal_date_uidx on public.meals(labour_code, meal_date) where labour_code is not null;
alter table public.settlements add column if not exists labour_code text;
alter table public.settlements add column if not exists period text;
update public.settlements s set labour_code=e.labour_code
from public.employees e where s.employee_id=e.id and s.labour_code is null;
create index if not exists settlements_labour_code_idx on public.settlements(labour_code);

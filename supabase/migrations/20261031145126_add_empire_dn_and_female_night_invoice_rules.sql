update public.app_records
set payload = payload || jsonb_build_object(
  'femaleNightAllowance', 100,
  'mandatoryOtHoursPerShift', 3,
  'sundayPoyaOtHoursPerShift', 12,
  'shifts', coalesce(payload->'shifts', '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('id','empire-day-night','name','D+N','startTime','08:00','endTime','08:00','standardHours',16)
  )
), updated_at = now()
where collection_name = 'factory_configs' and record_id = 'fac-empire-teas';

update public.app_records
set payload = payload || jsonb_build_object('femaleNightAllowance', 0), updated_at = now()
where collection_name = 'factory_configs' and record_id = 'fac-millennium-teas';

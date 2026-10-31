update public.app_records
set payload = payload || jsonb_build_object(
  'mandatoryOtHoursPerShift', 3,
  'sundayPoyaOtHoursPerShift', 12,
  'overtimeEnabled', true,
  'factoryOvertimeRateHourly', 225,
  'sundayPoyaOvertimeRateHourly', 300,
  'attendanceBonus', 5500
), updated_at = now()
where collection_name = 'factory_configs' and record_id = 'fac-empire-teas';

update public.app_records
set payload = payload || jsonb_build_object(
  'mandatoryOtHoursPerShift', 0,
  'sundayPoyaOtHoursPerShift', 0,
  'sundayPoyaOvertimeRateHourly', 225,
  'attendanceBonus', 0
), updated_at = now()
where collection_name = 'factory_configs' and record_id = 'fac-millennium-teas';

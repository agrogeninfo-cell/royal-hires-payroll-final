update public.app_records
set payload = payload || jsonb_build_object(
  'overtimeEnabled', true,
  'employeeOvertimeRateHourly', 0,
  'factoryOvertimeRateHourly', 225,
  'sundayPoyaOvertimeRateHourly', 300,
  'attendanceBonus', 5500,
  'attendanceBonusDays', 21,
  'lateDeductionPerHour', 150
), updated_at = now()
where collection_name = 'factory_configs'
  and record_id = 'fac-empire-teas';

update public.app_records
set payload = payload || jsonb_build_object(
  'overtimeEnabled', true,
  'employeeOvertimeRateHourly', 180,
  'factoryOvertimeRateHourly', 225,
  'sundayPoyaOvertimeRateHourly', 225,
  'attendanceBonus', 0,
  'attendanceBonusDays', 21,
  'lateDeductionPerHour', 150
), updated_at = now()
where collection_name = 'factory_configs'
  and record_id = 'fac-millennium-teas';

-- Explicitly lock Millennium Teas to its approved worker and billing rates.
-- Attendance bonus is not applicable to Millennium (Empire remains invoice-only bonus).
update public.app_records
set payload = payload || jsonb_build_object(
  'wageMaleRate', 2500,
  'wageFemaleRate', 2100,
  'billingMethod', 'SEPARATE_MALE_FEMALE_RATES',
  'maleRate', 3000,
  'femaleRate', 2500,
  'attendanceBonus', 0,
  'attendanceBonusDays', 21,
  'lateDeductionPerHour', 150
), updated_at = now()
where collection_name = 'factory_configs'
  and record_id = 'fac-millennium-teas';

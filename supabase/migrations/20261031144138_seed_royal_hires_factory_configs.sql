
with company as (
  select id from public.companies where name = 'Royal Hires Private Limited'
),
admin_user as (
  select user_id from public.profiles
  where role = 'admin' and is_active = true and approval_status = 'approved'
  order by created_at limit 1
),
factory_map as (
  select id, legacy_id from public.factories
  where company_id = (select id from company)
),
payloads as (
  select 'fac-empire-teas'::text as record_id, 'fac-empire-teas'::text as legacy_id,
    jsonb_build_object(
      'id','fac-empire-teas','code','FAC-EMPIRE-TEAS','name','Empire Teas',
      'address','','contactPerson','Factory contact to be configured','contactPhone','',
      'active',true,'invoicePeriod','weekly',
      'shifts',jsonb_build_array(
        jsonb_build_object('id','empire-day','name','Day Shift','startTime','08:00','endTime','17:00','standardHours',8),
        jsonb_build_object('id','empire-night','name','Night Shift','startTime','20:30','endTime','08:00','standardHours',8)
      ),
      'overtimeEnabled',false,'employeeOvertimeRateHourly',0,'factoryOvertimeRateHourly',0,
      'billingMethod','SAME_RATE_FOR_ALL','sameRate',1525,
      'wageSameRate',2000,'wageMaleRate',2000,'wageFemaleRate',2000,
      'weekdayWage',2000,'saturdayWage',2000,'sundayPoyaWage',2300,
      'attendanceBonus',5500,'attendanceBonusDays',21,'lateDeductionPerHour',150,
      'billingEffectiveFrom','2026-01-01','specialBillingDates',jsonb_build_array(),
      'breakfastRate',130,'lunchRate',250,'dinnerRate',250,'supervisorIds',jsonb_build_array(),
      'createdAt',now(),'updatedAt',now(),'cloudSyncReady',true,'cloudSyncConfirmed',true
    ) as payload
  union all
  select 'fac-millennium-teas','fac-millennium-teas',
    jsonb_build_object(
      'id','fac-millennium-teas','code','FAC-MILLENNIUM-TEAS','name','Millennium Teas',
      'address','','contactPerson','Factory contact to be configured','contactPhone','',
      'active',true,'invoicePeriod','monthly',
      'shifts',jsonb_build_array(
        jsonb_build_object('id','millennium-day','name','Day Shift','startTime','07:00','endTime','19:00','standardHours',12),
        jsonb_build_object('id','millennium-night','name','Night Shift','startTime','20:30','endTime','08:00','standardHours',11.5)
      ),
      'overtimeEnabled',true,'employeeOvertimeRateHourly',180,'factoryOvertimeRateHourly',225,
      'billingMethod','SEPARATE_MALE_FEMALE_RATES','maleRate',3000,'femaleRate',2500,
      'wageSameRate',0,'wageMaleRate',2500,'wageFemaleRate',2100,
      'attendanceBonus',5500,'attendanceBonusDays',21,'lateDeductionPerHour',150,
      'billingEffectiveFrom','2026-01-01','specialBillingDates',jsonb_build_array(),
      'breakfastRate',130,'lunchRate',250,'dinnerRate',250,'supervisorIds',jsonb_build_array(),
      'createdAt',now(),'updatedAt',now(),'cloudSyncReady',true,'cloudSyncConfirmed',true
    )
)
insert into public.app_records(company_id, collection_name, record_id, factory_id, payload, updated_by, updated_at)
select (select id from company), 'factory_configs', p.record_id, f.id, p.payload, (select user_id from admin_user), now()
from payloads p join factory_map f on f.legacy_id = p.legacy_id
on conflict (company_id, collection_name, record_id) do update
set factory_id = excluded.factory_id, payload = excluded.payload,
    updated_by = excluded.updated_by, updated_at = excluded.updated_at;


with seed(full_name, phone) as (
  values
    ('Life Nursing Care - Caregiver','+8801886283555'),
    ('AGED CARE CENTRE','+8809638700400'),
    ('HealthCare At Home Bangladesh','+8801619848555'),
    ('HealYou (Homecare)','+8801914888111'),
    ('Nursing Home Care BD','+8801719661366'),
    ('Priyojon Senior Care Center','+8801994888999'),
    ('Caregiver Service BD','+8801830560131'),
    ('Al-Bokhari Caregiving Services Ltd.','+8801778654544'),
    ('Trust Nursing Home Care','+8801629861913'),
    ('The Best Homecare Service','+8801714177837'),
    ('Nursing Agency BD','+8801707372002'),
    ('Caregivers Agency BD','+8801404002228'),
    ('Imran Home Care Pvt. Ltd.','+8801719661366'),
    ('ISRAT CARE GIVERS','+8801716021021'),
    ('Patient Care Home Service BD','+8801919941450'),
    ('MyHealth','+8801805002600'),
    ('Dhaka Home Care Agency','+8801766149264'),
    ('Fedelta Home Health Care','+8801707937437'),
    ('Clara Care Services Ltd','+8801938881110'),
    ('Doctors Home Care Limited - Uttara','+8801754839059'),
    ('Nursing Home Care Dhaka','+8801518499461'),
    ('Home and Community Care Limited (HCCL)','+8809610900000'),
    ('Doctors Care - Nursing Services & Home Care Services in Dhaka','+8801716606849'),
    ('Caregiver Agency Dhaka','+8801350840672'),
    ('All Samadhan','+8801711897016')
)
insert into public.caregiver_private_contacts (caregiver_id, phone, email, updated_at)
select c.id, s.phone, null, now()
from seed s
join public.caregivers c
  on lower(trim(c.full_name)) = lower(trim(s.full_name))
where c.provider_type = 'Organization'
on conflict (caregiver_id) do update
set phone = excluded.phone,
    updated_at = now();

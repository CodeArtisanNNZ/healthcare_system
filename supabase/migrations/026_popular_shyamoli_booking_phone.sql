-- Use the verified Popular Diagnostic Centre Shyamoli booking line when a doctor's
-- own contact number is not stored. This is the chamber/appointment line, not a
-- personal mobile number.
insert into public.doctor_private_contacts (doctor_id, phone, updated_at)
select d.id, '09666 787806', now()
from public.doctors d
where lower(coalesce(d.chamber_name,'')) like '%popular diagnostic centre ltd. (shyamoli branch)%'
   or (
     lower(coalesce(d.location,'')) like '%shyamoli%'
     and coalesce(d.source_url,'') like '%populardiagnostic.com%'
   )
on conflict (doctor_id) do update
set phone = coalesce(
      nullif(btrim(public.doctor_private_contacts.phone), ''),
      excluded.phone
    ),
    updated_at = now();

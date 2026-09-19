begin;

alter table public.caregiver_private_contacts
  add column if not exists internal_notes text;

update public.caregiver_private_contacts cpc
set internal_notes = coalesce(cpc.internal_notes, c.internal_notes),
    updated_at = now()
from public.caregivers c
where cpc.caregiver_id = c.id
  and c.internal_notes is not null;

alter table public.caregivers
  drop column if exists internal_notes;

commit;

begin;

alter table public.caregiver_private_contacts
  add column if not exists internal_notes text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'caregivers'
      and column_name = 'internal_notes'
  ) then
    execute $move$
      update public.caregiver_private_contacts cpc
      set internal_notes = coalesce(cpc.internal_notes, c.internal_notes),
          updated_at = now()
      from public.caregivers c
      where cpc.caregiver_id = c.id
        and c.internal_notes is not null
    $move$;

    alter table public.caregivers
      drop column internal_notes;
  end if;
end $$;

commit;

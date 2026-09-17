begin;

-- Keep the original text for display, but compare a conservative canonical form
-- for common Banglish spellings.  This is intentionally limited to medical
-- words that frequently vary by vowels/transliteration; it does not perform
-- arbitrary autocorrection.
create or replace function public.normalize_symptom_phrase(value text)
returns text
language plpgsql
immutable
security invoker
set search_path = public, extensions
as $$
declare
  normalized text := lower(trim(coalesce(value, '')));
begin
  normalized := regexp_replace(normalized, '[[:punct:]]+', ' ', 'g');
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');

  -- Common Banglish transliteration variants.
  normalized := regexp_replace(normalized, '\m(byatha|batha|beetha|bhetha)\M', 'betha', 'g');
  normalized := regexp_replace(normalized, '\m(mathay|matay|mata)\M', 'matha', 'g');
  normalized := regexp_replace(normalized, '\m(jwar)\M', 'jor', 'g');
  normalized := regexp_replace(normalized, '\m(kasi)\M', 'kashi', 'g');
  normalized := regexp_replace(normalized, '\m(vomi)\M', 'bomi', 'g');
  normalized := regexp_replace(normalized, '\m(cokh)\M', 'chokh', 'g');
  normalized := regexp_replace(normalized, '\m(gura)\M', 'ghura', 'g');
  normalized := regexp_replace(normalized, '\m(koshto)\M', 'kosto', 'g');
  normalized := regexp_replace(normalized, '\m(sas)\M', 'shash', 'g');

  return trim(regexp_replace(normalized, '\s+', ' ', 'g'));
end;
$$;

revoke all on function public.normalize_symptom_phrase(text) from public;
grant execute on function public.normalize_symptom_phrase(text) to authenticated;

-- Every ordinary headache spelling must start with primary care, not neurology.
-- Prefer the Medicine Specialist category because it has active, verified
-- doctors in the directory; General Physician remains the fallback.
with generalist as (
  select id
  from public.specialties
  where lower(name) in ('general physician', 'medicine specialist', 'general medicine')
  order by case lower(name)
    when 'medicine specialist' then 1
    when 'general physician' then 2
    else 3
  end
  limit 1
)
update public.symptom_rules r
set specialty_id = g.id,
    priority = 48,
    emergency_notice = null,
    patient_guidance = 'A mild, occasional headache often improves with water, rest, regular food and less screen strain. If it persists, recurs, or worries you, start with a General Physician or Medicine doctor. This is not a diagnosis.'
from generalist g
where public.normalize_symptom_phrase(r.keyword) = 'matha betha'
   or lower(trim(r.keyword)) in ('headache', 'normal headache', 'mild headache', 'মাথা ব্যথা', 'মাথাব্যথা');

create or replace function public.resolve_doctor_triage_multi(query_text text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  q text := lower(trim(coalesce(query_text, '')));
  nq text := public.normalize_symptom_phrase(query_text);
  result jsonb;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(q) = 0 then
    return jsonb_build_object(
      'urgent', false,
      'emergency_notice', null,
      'patient_guidance', null,
      'primary_specialty_id', null,
      'primary_specialty_name', null,
      'suggestions', '[]'::jsonb
    );
  end if;
  if length(q) > 500 then raise exception 'Search too long'; end if;

  with candidates as (
    select
      r.id,
      r.keyword,
      r.specialty_id,
      s.name as specialty_name,
      r.priority,
      r.emergency_notice,
      r.patient_guidance,
      lower(trim(r.keyword)) as raw_keyword,
      public.normalize_symptom_phrase(r.keyword) as normalized_keyword
    from public.symptom_rules r
    join public.specialties s on s.id = r.specialty_id
  ), match_context as (
    select exists(
      select 1
      from candidates
      where q = raw_keyword or nq = normalized_keyword
    ) as has_exact_match
  ), matched as (
    select c.*,
      case
        when q = c.raw_keyword then 1.15
        when nq = c.normalized_keyword then 1.12
        when position(c.raw_keyword in q) > 0 then
          1.0 + least(.10, length(c.raw_keyword)::numeric / greatest(length(q), 1)::numeric * .10)
        when position(c.normalized_keyword in nq) > 0 then
          1.0 + least(.08, length(c.normalized_keyword)::numeric / greatest(length(nq), 1)::numeric * .08)
        when length(c.normalized_keyword) >= 5
          and word_similarity(c.normalized_keyword, nq) >= .68
          and similarity(c.normalized_keyword, nq) >= .50
          then ((word_similarity(c.normalized_keyword, nq) + similarity(c.normalized_keyword, nq)) / 2) * .92
        when length(c.raw_keyword) >= 5
          and word_similarity(c.raw_keyword, q) >= .68
          and similarity(c.raw_keyword, q) >= .50
          then ((word_similarity(c.raw_keyword, q) + similarity(c.raw_keyword, q)) / 2) * .88
        else 0
      end as strength
    from candidates c
    cross join match_context mc
    where (
      mc.has_exact_match
      and (q = c.raw_keyword or nq = c.normalized_keyword)
    ) or (
      not mc.has_exact_match
      and (
        position(c.raw_keyword in q) > 0
        or position(c.normalized_keyword in nq) > 0
        or (
          length(c.normalized_keyword) >= 5
          and word_similarity(c.normalized_keyword, nq) >= .68
          and similarity(c.normalized_keyword, nq) >= .50
        )
        or (
          length(c.raw_keyword) >= 5
          and word_similarity(c.raw_keyword, q) >= .68
          and similarity(c.raw_keyword, q) >= .50
        )
      )
    )
  ), useful as (
    select * from matched where strength > 0
  ), scored as (
    select
      specialty_id,
      specialty_name,
      sum(strength * (1 + least(priority, 140)::numeric / 220)) as score,
      max(priority) as top_priority,
      count(*) as matched_count,
      jsonb_agg(
        jsonb_build_object('phrase', keyword, 'strength', round(strength::numeric, 3))
        order by strength desc, priority desc, length(keyword) desc
      ) as matched_symptoms
    from useful
    group by specialty_id, specialty_name
  ), top_specialties as (
    select * from scored
    order by score desc, top_priority desc, matched_count desc, specialty_name
    limit 3
  ), primary_row as (
    select * from top_specialties
    order by score desc, top_priority desc, matched_count desc, specialty_name
    limit 1
  ), emergency_row as (
    select emergency_notice
    from useful
    where emergency_notice is not null and trim(emergency_notice) <> ''
    order by priority desc, strength desc
    limit 1
  ), guidance_row as (
    select patient_guidance
    from useful
    where patient_guidance is not null and trim(patient_guidance) <> ''
    order by strength desc, priority desc
    limit 1
  )
  select jsonb_build_object(
    'urgent', exists(select 1 from emergency_row),
    'emergency_notice', (select emergency_notice from emergency_row),
    'patient_guidance', (select patient_guidance from guidance_row),
    'primary_specialty_id', (select specialty_id from primary_row),
    'primary_specialty_name', (select specialty_name from primary_row),
    'suggestions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'specialty_id', t.specialty_id,
          'specialty_name', t.specialty_name,
          'score', round(t.score::numeric, 3),
          'matched_count', t.matched_count,
          'matched_symptoms', t.matched_symptoms
        )
        order by t.score desc, t.top_priority desc, t.matched_count desc, t.specialty_name
      )
      from top_specialties t
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

revoke all on function public.resolve_doctor_triage_multi(text) from public;
grant execute on function public.resolve_doctor_triage_multi(text) to authenticated;

commit;

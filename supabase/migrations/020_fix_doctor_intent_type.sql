-- Keep symptom/specialty intent matching type-stable across exact and fuzzy branches.
CREATE OR REPLACE FUNCTION public.resolve_doctor_intent(query_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  q_norm text := lower(trim(regexp_replace(coalesce(query_text,''), '[[:punct:]]+', ' ', 'g')));
  matched record;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text)>160 then raise exception 'Search too long'; end if;
  if q_norm='' then
    return jsonb_build_object(
      'specialty_id',null,'specialty_name',null,'matched_phrase',null,
      'emergency_notice',null,'confidence',0
    );
  end if;

  select
    s.id as specialty_id,
    s.name as specialty_name,
    s.name as matched_phrase,
    null::text as emergency_notice,
    1.0::numeric as confidence,
    10000::numeric as priority
  into matched
  from public.specialties s
  where lower(s.name)=q_norm
     or lower(s.name) like '%'||q_norm||'%'
     or q_norm like '%'||lower(s.name)||'%'
  order by case when lower(s.name)=q_norm then 0 else 1 end,length(s.name)
  limit 1;

  if matched.specialty_id is null then
    select
      r.specialty_id,
      s.name as specialty_name,
      r.keyword as matched_phrase,
      r.emergency_notice,
      (
        case
          when lower(trim(r.keyword))=q_norm then 1.0
          when q_norm like '%'||lower(trim(r.keyword))||'%' then 0.98
          when lower(trim(r.keyword)) like '%'||q_norm||'%' and length(q_norm)>=5 then 0.90
          else greatest(
            extensions.similarity(lower(r.keyword),q_norm)::numeric,
            extensions.word_similarity(lower(r.keyword),q_norm)::numeric
          )
        end
      )::numeric as confidence,
      r.priority::numeric as priority
    into matched
    from public.symptom_rules r
    join public.specialties s on s.id=r.specialty_id
    where lower(trim(r.keyword))=q_norm
       or q_norm like '%'||lower(trim(r.keyword))||'%'
       or (length(q_norm)>=5 and lower(trim(r.keyword)) like '%'||q_norm||'%')
       or (
         length(q_norm)>=5
         and extensions.similarity(lower(r.keyword),q_norm)>=0.72
         and extensions.word_similarity(lower(r.keyword),q_norm)>=0.72
       )
    order by
      case
        when lower(trim(r.keyword))=q_norm then 0
        when q_norm like '%'||lower(trim(r.keyword))||'%' then 1
        when lower(trim(r.keyword)) like '%'||q_norm||'%' then 2
        else 3
      end,
      length(r.keyword) desc,
      r.priority desc,
      greatest(
        extensions.similarity(lower(r.keyword),q_norm),
        extensions.word_similarity(lower(r.keyword),q_norm)
      ) desc
    limit 1;
  end if;

  return jsonb_build_object(
    'specialty_id',matched.specialty_id,
    'specialty_name',matched.specialty_name,
    'matched_phrase',matched.matched_phrase,
    'emergency_notice',matched.emergency_notice,
    'confidence',coalesce(matched.confidence,0)
  );
end;
$function$


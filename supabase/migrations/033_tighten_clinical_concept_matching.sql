-- Tighten concept matching so weak trigram similarities do not become clinical evidence.

begin;

drop function if exists public.match_symptom_concepts(text);

create function public.match_symptom_concepts(query_text text)
returns table(
  concept_id uuid,
  code text,
  canonical_name text,
  canonical_bn text,
  matched_alias text,
  score numeric,
  normalized_query text,
  default_specialty_id uuid,
  default_specialty_name text
)
language sql
stable
security invoker
set search_path=public,extensions
as $$
  with q as (
    select public.normalize_symptom_phrase(query_text) as nq
  ),
  candidates as (
    select
      c.id concept_id,
      c.code,
      c.canonical_name,
      c.canonical_bn,
      a.normalized_alias matched_alias,
      c.default_specialty_id,
      s.name default_specialty_name,
      q.nq normalized_query,
      case
        when position(a.normalized_alias in q.nq)>0 then
          1.0
          + least(0.25, length(a.normalized_alias)::numeric / greatest(length(q.nq),1)::numeric * 0.25)
        when (
          select count(*)
          from unnest(string_to_array(a.normalized_alias,' ')) t
          where length(t)>=2 and t = any(string_to_array(q.nq,' '))
        )::numeric
        / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric >= 0.66
        then
          0.72
          + 0.20 * (
            (
              select count(*)
              from unnest(string_to_array(a.normalized_alias,' ')) t
              where length(t)>=2 and t = any(string_to_array(q.nq,' '))
            )::numeric
            / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric
          )
        when length(a.normalized_alias)>=4
          and greatest(
            word_similarity(a.normalized_alias,q.nq),
            similarity(a.normalized_alias,q.nq)
          ) >= 0.58
        then greatest(
          word_similarity(a.normalized_alias,q.nq),
          similarity(a.normalized_alias,q.nq)
        )::numeric * 0.78
        else 0::numeric
      end + c.routing_priority::numeric/5000 as score
    from q
    join public.symptom_aliases a on (
      position(a.normalized_alias in q.nq)>0
      or (
        (
          select count(*)
          from unnest(string_to_array(a.normalized_alias,' ')) t
          where length(t)>=2 and t = any(string_to_array(q.nq,' '))
        )::numeric
        / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric >= 0.66
      )
      or (
        length(a.normalized_alias)>=4
        and greatest(
          word_similarity(a.normalized_alias,q.nq),
          similarity(a.normalized_alias,q.nq)
        ) >= 0.58
      )
    )
    join public.symptom_concepts c on c.id=a.concept_id and c.active
    left join public.specialties s on s.id=c.default_specialty_id
  ),
  ranked as (
    select *,
      row_number() over(
        partition by concept_id
        order by score desc,length(matched_alias) desc
      ) rn
    from candidates
    where score>0
  )
  select
    concept_id,code,canonical_name,canonical_bn,matched_alias,
    score::numeric,normalized_query,default_specialty_id,default_specialty_name
  from ranked
  where rn=1 and score>=0.58
  order by score desc
  limit 8;
$$;

revoke all on function public.match_symptom_concepts(text) from public;
grant execute on function public.match_symptom_concepts(text) to authenticated;

commit;

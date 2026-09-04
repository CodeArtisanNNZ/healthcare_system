-- Reconstructed from the supplied PHP source; no MySQL data export was included.
-- Run once in a NEW Supabase project's SQL Editor, as the postgres owner.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', email text not null,
 role text not null default 'patient' check(role in ('patient','doctor','admin')),
 status text not null default 'Active' check(status in ('Active','Inactive')),
 phone text, address text, date_of_birth date, gender text, blood_group text, avatar_path text,
 created_at timestamptz not null default now()
);
create function public.handle_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,email,phone,address)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),300),coalesce(new.email,''),left(new.raw_user_meta_data->>'phone',300),left(new.raw_user_meta_data->>'address',4000));
 return new;
end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_auth_user();
create function public.sync_auth_email() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.profiles set email=coalesce(new.email,'') where id=new.id;return new;end;$$;
create trigger on_auth_email_updated after update of email on auth.users for each row execute function public.sync_auth_email();
create function public.is_active() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and status='Active');$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin' and status='Active');$$;
revoke all on function public.handle_auth_user(), public.sync_auth_email() from public;
revoke all on function public.is_active(),public.is_admin() from public;
grant execute on function public.is_active(),public.is_admin() to anon,authenticated;
alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy profile_update on public.profiles for update to authenticated using((id=(select auth.uid()) and public.is_active()) or public.is_admin()) with check((id=(select auth.uid()) and public.is_active()) or public.is_admin());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
-- Roles, account status and email CANNOT be changed using the public API key.
grant update(full_name,phone,address,date_of_birth,gender,blood_group,avatar_path) on public.profiles to authenticated;
create table public.specialties(id uuid primary key default gen_random_uuid(),name text not null unique check(length(trim(name))>0),created_at timestamptz not null default now());
create table public.symptom_rules(id uuid primary key default gen_random_uuid(),keyword text not null check(length(trim(keyword))>0),specialty_id uuid not null references public.specialties(id) on delete restrict,priority numeric not null default 0 check(priority>=0),emergency_notice text,created_at timestamptz not null default now());
create table public.doctors (
 id uuid primary key default gen_random_uuid(),user_id uuid unique references public.profiles(id) on delete set null,
 full_name text not null,registration_no text,specialty_id uuid not null references public.specialties(id) on delete restrict,
 specialization text,qualification text,experience numeric check(experience>=0),location text,
 consultation_fee numeric(12,2) check(consultation_fee>=0),available_time text,phone text,email text,image_path text,
 status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now()
);
create table public.hospitals(id uuid primary key default gen_random_uuid(),name text not null,address text,location text,phone text,email text,emergency_phone text,departments text,description text,image_path text,status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now());
create table public.caregivers(id uuid primary key default gen_random_uuid(),full_name text not null,gender text,experience numeric check(experience>=0),qualification text,services text,location text,fee_per_day numeric(12,2) check(fee_per_day>=0),phone text,email text,availability text,image_path text,status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now());
create table public.ambulances(id uuid primary key default gen_random_uuid(),service_name text not null,driver_name text,driver_phone text,ambulance_type text,vehicle_number text,location text,address text,city text,hospital_name text,availability text,rate numeric(12,2) check(rate>=0),image_path text,status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now());
create table public.lab_tests(id uuid primary key default gen_random_uuid(),test_name text not null,laboratory_name text,category text,description text,price numeric(12,2) check(price>=0),location text,address text,contact text,image_path text,status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now());
create table public.medicines(id uuid primary key default gen_random_uuid(),name text not null,generic text,strength text,status text not null default 'Active' check(status in ('Active','Inactive')),created_at timestamptz not null default now());
create table public.medicine_offers(id uuid primary key default gen_random_uuid(),medicine_id uuid not null references public.medicines(id) on delete cascade,seller text not null,price numeric(12,2) not null check(price>=0),url text not null check(url like 'https://%'),checked_on date not null,created_at timestamptz not null default now());
create table public.health_records(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,kind text not null check(kind in ('prescription','report')),file_name text not null,path text not null unique,description text,created_at timestamptz not null default now(),check(split_part(path,'/',1)=user_id::text));
create index records_owner_date on public.health_records(user_id,created_at desc);
create index doctor_specialty on public.doctors(specialty_id);
create index symptom_specialty on public.symptom_rules(specialty_id);
create index offer_medicine on public.medicine_offers(medicine_id);
alter table public.health_records enable row level security;
revoke all on public.health_records from anon,authenticated;
grant select,insert,delete on public.health_records to authenticated;
create policy records_owner_read on public.health_records for select to authenticated using(user_id=(select auth.uid()) and public.is_active());
create policy records_owner_insert on public.health_records for insert to authenticated with check(user_id=(select auth.uid()) and public.is_active());
create policy records_owner_delete on public.health_records for delete to authenticated using(user_id=(select auth.uid()) and public.is_active());

alter table public.specialties enable row level security;
revoke all on public.specialties from anon,authenticated;
grant select on public.specialties to anon,authenticated;
grant insert,update,delete on public.specialties to authenticated;
create policy directory_read on public.specialties for select to anon,authenticated using(true);
create policy admin_insert on public.specialties for insert to authenticated with check(public.is_admin());
create policy admin_update on public.specialties for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.specialties for delete to authenticated using(public.is_admin());

alter table public.symptom_rules enable row level security;
revoke all on public.symptom_rules from anon,authenticated;
grant select on public.symptom_rules to anon,authenticated;
grant insert,update,delete on public.symptom_rules to authenticated;
create policy directory_read on public.symptom_rules for select to anon,authenticated using(true);
create policy admin_insert on public.symptom_rules for insert to authenticated with check(public.is_admin());
create policy admin_update on public.symptom_rules for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.symptom_rules for delete to authenticated using(public.is_admin());

alter table public.doctors enable row level security;
revoke all on public.doctors from anon,authenticated;
grant select on public.doctors to anon,authenticated;
grant insert,update,delete on public.doctors to authenticated;
create policy directory_read on public.doctors for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.doctors for insert to authenticated with check(public.is_admin());
create policy admin_update on public.doctors for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.doctors for delete to authenticated using(public.is_admin());

alter table public.hospitals enable row level security;
revoke all on public.hospitals from anon,authenticated;
grant select on public.hospitals to anon,authenticated;
grant insert,update,delete on public.hospitals to authenticated;
create policy directory_read on public.hospitals for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.hospitals for insert to authenticated with check(public.is_admin());
create policy admin_update on public.hospitals for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.hospitals for delete to authenticated using(public.is_admin());

alter table public.caregivers enable row level security;
revoke all on public.caregivers from anon,authenticated;
grant select on public.caregivers to anon,authenticated;
grant insert,update,delete on public.caregivers to authenticated;
create policy directory_read on public.caregivers for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.caregivers for insert to authenticated with check(public.is_admin());
create policy admin_update on public.caregivers for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.caregivers for delete to authenticated using(public.is_admin());

alter table public.ambulances enable row level security;
revoke all on public.ambulances from anon,authenticated;
grant select on public.ambulances to anon,authenticated;
grant insert,update,delete on public.ambulances to authenticated;
create policy directory_read on public.ambulances for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.ambulances for insert to authenticated with check(public.is_admin());
create policy admin_update on public.ambulances for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.ambulances for delete to authenticated using(public.is_admin());

alter table public.lab_tests enable row level security;
revoke all on public.lab_tests from anon,authenticated;
grant select on public.lab_tests to anon,authenticated;
grant insert,update,delete on public.lab_tests to authenticated;
create policy directory_read on public.lab_tests for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.lab_tests for insert to authenticated with check(public.is_admin());
create policy admin_update on public.lab_tests for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.lab_tests for delete to authenticated using(public.is_admin());

alter table public.medicines enable row level security;
revoke all on public.medicines from anon,authenticated;
grant select on public.medicines to anon,authenticated;
grant insert,update,delete on public.medicines to authenticated;
create policy directory_read on public.medicines for select to anon,authenticated using(status='Active' or public.is_admin());
create policy admin_insert on public.medicines for insert to authenticated with check(public.is_admin());
create policy admin_update on public.medicines for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.medicines for delete to authenticated using(public.is_admin());

alter table public.medicine_offers enable row level security;
revoke all on public.medicine_offers from anon,authenticated;
grant select on public.medicine_offers to anon,authenticated;
grant insert,update,delete on public.medicine_offers to authenticated;
create policy directory_read on public.medicine_offers for select to anon,authenticated using(exists(select 1 from public.medicines m where m.id=medicine_id and m.status='Active') or public.is_admin());
create policy admin_insert on public.medicine_offers for insert to authenticated with check(public.is_admin());
create policy admin_update on public.medicine_offers for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy admin_delete on public.medicine_offers for delete to authenticated using(public.is_admin());

-- Security INVOKER preserves RLS. Table names are allowlisted; values are bound.
create function public.search_directory(entity text,q text default '',page_number integer default 1)
returns setof jsonb language plpgsql stable security invoker set search_path='' as $$
declare extra text := ''; ordering text := 't.created_at desc,t.id';begin
 if not entity=any(array['doctors','hospitals','caregivers','ambulances','lab_tests','medicines','medicine_offers','specialties','symptom_rules']) then raise exception 'Unknown directory';end if;
 if length(q)>160 then raise exception 'Search too long';end if;
 if entity='doctors' and length(trim(q))>0 then
 extra := ' or t.specialty_id in (select s.id from public.specialties s where lower(s.name) like $1 or exists(select 1 from public.symptom_rules r where r.specialty_id=s.id and (lower(r.keyword) like $1 or position(lower(r.keyword) in lower($3))>0)))';
 ordering := '(select coalesce(max(r.priority),0) from public.symptom_rules r where r.specialty_id=t.specialty_id and (lower(r.keyword) like $1 or position(lower(r.keyword) in lower($3))>0)) desc, t.experience desc nulls last,t.full_name,t.id';
 end if;
 return query execute format('select to_jsonb(t) from public.%I t where (lower(to_jsonb(t)::text) like $1 %s) order by %s limit 24 offset $2',entity,extra,ordering)
 using '%'||lower(q)||'%', (greatest(1,least(page_number,10000))-1)*24, q;
end;$$;
revoke all on function public.search_directory(text,text,integer) from public;
grant execute on function public.search_directory(text,text,integer) to anon,authenticated;

-- Private bucket for prescriptions/reports. Avatars are private too.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('health-records','health-records',false,3145728,array['image/jpeg','image/png','application/pdf']),
 ('avatars','avatars',false,3145728,array['image/jpeg','image/png']),
 ('directory-images','directory-images',true,3145728,array['image/jpeg','image/png']);
create policy private_files_read on storage.objects for select to authenticated using(bucket_id in ('health-records','avatars') and (storage.foldername(name))[1]=(select auth.uid())::text and public.is_active());
create policy private_files_insert on storage.objects for insert to authenticated with check(bucket_id in ('health-records','avatars') and (storage.foldername(name))[1]=(select auth.uid())::text and public.is_active());
create policy private_files_delete on storage.objects for delete to authenticated using(bucket_id in ('health-records','avatars') and (storage.foldername(name))[1]=(select auth.uid())::text and public.is_active());
create policy directory_images_insert on storage.objects for insert to authenticated with check(bucket_id='directory-images' and public.is_admin() and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy directory_images_delete on storage.objects for delete to authenticated using(bucket_id='directory-images' and public.is_admin());
create policy directory_images_read on storage.objects for select to anon,authenticated using(bucket_id='directory-images');

-- Persistent per-account live-search rate limiting, shared across Vercel instances.
create table public.search_limits(user_id uuid primary key references public.profiles(id) on delete cascade,window_start timestamptz not null,request_count integer not null);
alter table public.search_limits enable row level security;
revoke all on public.search_limits from anon,authenticated;
create function public.consume_search_quota() returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;begin
 if auth.uid() is null or not public.is_active() then return false;end if;
 insert into public.search_limits as lim(user_id,window_start,request_count) values(auth.uid(),now(),1)
 on conflict(user_id) do update set
 request_count=case when lim.window_start<now()-interval '1 minute' then 1 else lim.request_count+1 end,
 window_start=case when lim.window_start<now()-interval '1 minute' then now() else lim.window_start end
 returning request_count into n;
 return n<=5;
end;$$;
revoke all on function public.consume_search_quota() from public;
grant execute on function public.consume_search_quota() to authenticated;
grant all on public.profiles,public.specialties,public.symptom_rules,public.doctors,public.hospitals,public.caregivers,public.ambulances,public.lab_tests,public.medicines,public.medicine_offers,public.health_records,public.search_limits to service_role;
commit;

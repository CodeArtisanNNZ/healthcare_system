import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
const specialty = "44444444-4444-4444-8444-444444444444";
test("schema, role boundaries, patient isolation, storage policies and search quotas", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
 create role anon; create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,update,delete on storage.objects to authenticated;
 grant select on storage.objects to anon;
 `);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
 ('${alice}','alice@example.invalid','{"full_name":"Alice","role":"admin"}'),
 ('${bob}','bob@example.invalid','{"full_name":"Bob"}'),
 ('${admin}','admin@example.invalid','{"full_name":"Admin"}');
 update public.profiles set role='admin' where id='${admin}';
 insert into public.specialties(id,name) values('${specialty}','Test specialty');
 insert into public.doctors(full_name,specialty_id,status) values('Active doctor','${specialty}','Active'),('Inactive doctor','${specialty}','Inactive');
 insert into public.symptom_rules(keyword,specialty_id,priority,emergency_notice) values('test symptom','${specialty}',5,'Example notice');
 insert into public.health_records(user_id,kind,file_name,path) values('${alice}','report','a.pdf','${alice}/a.pdf'),('${bob}','report','b.pdf','${bob}/b.pdf');
 insert into storage.objects(bucket_id,name) values('health-records','${alice}/a.pdf'),('health-records','${bob}/b.pdf');
 `);
    async function asUser(id: string, role = "authenticated") {
      await db.exec(
        `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);`,
      );
    }
    await asUser(alice);
    assert.equal(
      (await db.query<{ role: string }>("select role from public.profiles"))
        .rows[0].role,
      "patient",
      "signup metadata cannot grant admin",
    );
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      1,
      "cannot read another profile",
    );
    await assert.rejects(
      db.exec("update public.profiles set role='admin'"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("update public.profiles set status='Inactive'"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("update public.profiles set email='forged@example.invalid'"),
      /permission denied/,
    );
    await db.exec(
      "update public.profiles set full_name='Changed' where id=auth.uid()",
    );
    assert.equal(
      (await db.query("select * from public.health_records")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        `insert into public.health_records(user_id,kind,file_name,path) values('${bob}','report','x.pdf','${bob}/x.pdf')`,
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(
        `insert into storage.objects(bucket_id,name) values('health-records','${bob}/x.pdf')`,
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.exec(
        `insert into public.doctors(full_name,specialty_id) values('Unauthorized','${specialty}')`,
      ),
      /row-level security/,
    );
    await db.exec(`delete from public.health_records where user_id='${bob}'`);
    await asUser(bob);
    assert.equal(
      (await db.query("select * from public.health_records")).rows.length,
      1,
      "cross-user delete has no effect",
    );
    await asUser("", "anon");
    assert.equal(
      (await db.query("select * from public.doctors")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "select * from public.search_directory('doctors','test symptom',1)",
        )
      ).rows.length,
      1,
      "symptom routing finds active doctors",
    );
    await assert.rejects(
      db.query("select * from public.search_directory('profiles','',1)"),
      /Unknown directory/,
    );
    await assert.rejects(
      db.query("select * from public.health_records"),
      /permission denied/,
    );
    await asUser(admin);
    assert.equal(
      (await db.query("select * from public.doctors")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select * from public.health_records")).rows.length,
      0,
      "admin has no blanket access to private records",
    );
    await db.exec(`insert into public.hospitals(name) values('Test hospital')`);
    await asUser(alice);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await db.query<{ ok: boolean }>(
            "select public.consume_search_quota() as ok",
          )
        ).rows[0].ok,
        true,
      );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.consume_search_quota() as ok",
        )
      ).rows[0].ok,
      false,
    );
    await db.exec(
      `reset role;update public.profiles set status='Inactive' where id='${alice}';`,
    );
    await asUser(alice);
    assert.equal(
      (await db.query("select * from public.health_records")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select public.consume_search_quota() as ok",
        )
      ).rows[0].ok,
      false,
    );
  } finally {
    await db.close();
  }
});

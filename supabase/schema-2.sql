-- =========================================================================
--  আদ দাওয়াহ — দ্বিতীয় ধাপের ডাটাবেস (পিডিএফ বিক্রি)
--
--  কীভাবে চালাবেন:
--  Supabase → SQL Editor → New query → এই পুরো ফাইলটি পেস্ট করুন → Run।
--  আগের schema.sql একবার চালানো থাকতে হবে।
-- =========================================================================


-- -------------------------------------------------------------------------
-- ১. প্রশাসকের তালিকা
--    কারা অর্ডার অনুমোদন করতে পারবেন। নিচে নিজের ইমেইল বসিয়ে নিতে হবে।
-- -------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- প্রশাসক কে, তা যাচাইয়ের ফাংশন
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "প্রশাসক নিজের সারি দেখেন" on public.admins;
create policy "প্রশাসক নিজের সারি দেখেন" on public.admins
  for select using (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- ২. পিডিএফ ক্রয়
-- -------------------------------------------------------------------------
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  issue_id    text not null,
  issue_label text,
  amount      integer,
  method      text,
  trxid       text,
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected')),
  note        text,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);

create index if not exists purchases_user_idx   on public.purchases (user_id);
create index if not exists purchases_status_idx on public.purchases (status);

alter table public.purchases enable row level security;

-- পাঠক কেবল নিজের নামে, কেবল "অপেক্ষমাণ" অবস্থায় অর্ডার দিতে পারেন
drop policy if exists "নিজের অর্ডার দেওয়া" on public.purchases;
create policy "নিজের অর্ডার দেওয়া" on public.purchases
  for insert
  with check (auth.uid() = user_id and status = 'pending');

-- পাঠক নিজের অর্ডার দেখেন; প্রশাসক সব দেখেন
drop policy if exists "অর্ডার দেখা" on public.purchases;
create policy "অর্ডার দেখা" on public.purchases
  for select
  using (auth.uid() = user_id or public.is_admin());

-- কেবল প্রশাসক অবস্থা বদলাতে পারেন
drop policy if exists "প্রশাসক অনুমোদন করেন" on public.purchases;
create policy "প্রশাসক অনুমোদন করেন" on public.purchases
  for update
  using (public.is_admin())
  with check (public.is_admin());


-- -------------------------------------------------------------------------
-- ৩. পিডিএফ রাখার সুরক্ষিত জায়গা
--    public = false, অর্থাৎ সরাসরি লিংক দিয়ে কেউ নামাতে পারবে না।
--    ফাইলের নাম হতে হবে ঠিক সংখ্যার আইডি অনুযায়ী — যেমন y1n1.pdf
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('issues', 'issues', false)
on conflict (id) do nothing;

-- অনুমোদিত ক্রেতা তাঁর কেনা সংখ্যার ফাইলটিই কেবল পড়তে পারবেন
drop policy if exists "কেনা সংখ্যার পিডিএফ" on storage.objects;
create policy "কেনা সংখ্যার পিডিএফ" on storage.objects
  for select
  using (
    bucket_id = 'issues'
    and (
      public.is_admin()
      or exists (
        select 1 from public.purchases p
        where p.user_id = auth.uid()
          and p.status  = 'approved'
          and p.issue_id = regexp_replace(storage.objects.name, '\.pdf$', '')
      )
    )
  );

-- প্রশাসক ফাইল আপলোড ও বদলাতে পারবেন
drop policy if exists "প্রশাসক পিডিএফ আপলোড" on storage.objects;
create policy "প্রশাসক পিডিএফ আপলোড" on storage.objects
  for insert with check (bucket_id = 'issues' and public.is_admin());

drop policy if exists "প্রশাসক পিডিএফ বদলান" on storage.objects;
create policy "প্রশাসক পিডিএফ বদলান" on storage.objects
  for update using (bucket_id = 'issues' and public.is_admin());


-- =========================================================================
--  ⚠️  শেষ ধাপ — নিজেকে প্রশাসক বানান
--
--  নিচের লাইনটির ইমেইল বদলে আপনার নিজের ইমেইল বসান
--  (যে ইমেইলে সাইটে অ্যাকাউন্ট খুলেছেন), তারপর লাইনটির শুরুর
--  দুটি হাইফেন মুছে দিয়ে আলাদাভাবে Run করুন।
-- =========================================================================

-- insert into public.admins (user_id)
-- select id from auth.users where email = 'raiyanrafique99@gmail.com'
-- on conflict do nothing;

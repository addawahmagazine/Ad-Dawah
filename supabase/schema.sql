-- =========================================================================
--  আদ দাওয়াহ — Supabase ডাটাবেস কাঠামো
--
--  কীভাবে চালাবেন:
--  Supabase → আপনার প্রজেক্ট → বাঁ পাশে SQL Editor → New query →
--  এই পুরো ফাইলটি কপি করে পেস্ট করুন → Run চাপুন।
--  একবারই চালাতে হবে। দ্বিতীয়বার চালালেও ক্ষতি নেই।
-- =========================================================================


-- -------------------------------------------------------------------------
-- ১. বুকমার্ক — পাঠক কোন লেখা সংরক্ষণ করেছেন
-- -------------------------------------------------------------------------
create table if not exists public.bookmarks (
  user_id    uuid not null references auth.users on delete cascade,
  article_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.bookmarks enable row level security;

drop policy if exists "নিজের বুকমার্ক" on public.bookmarks;
create policy "নিজের বুকমার্ক" on public.bookmarks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- ২. পাঠকের প্রশ্ন
--    লগইন না করেও প্রশ্ন পাঠানো যায়; তখন user_id ফাঁকা থাকে।
--    লগইন করা পাঠক কেবল নিজের প্রশ্নগুলো দেখতে পান।
-- -------------------------------------------------------------------------
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete set null,
  name       text,
  email      text,
  topic      text,
  body       text not null,
  answer     text,
  answered   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

drop policy if exists "যে কেউ প্রশ্ন পাঠাতে পারেন" on public.questions;
create policy "যে কেউ প্রশ্ন পাঠাতে পারেন" on public.questions
  for insert with check (true);

drop policy if exists "নিজের প্রশ্ন দেখা" on public.questions;
create policy "নিজের প্রশ্ন দেখা" on public.questions
  for select using (auth.uid() = user_id);


-- -------------------------------------------------------------------------
-- ৩. লেখা কতবার পড়া হয়েছে
-- -------------------------------------------------------------------------
create table if not exists public.article_stats (
  article_id text primary key,
  views      bigint not null default 0
);

alter table public.article_stats enable row level security;

drop policy if exists "পঠিত সংখ্যা সবাই দেখতে পারেন" on public.article_stats;
create policy "পঠিত সংখ্যা সবাই দেখতে পারেন" on public.article_stats
  for select using (true);

-- গণনা বাড়ানোর ফাংশন। সরাসরি টেবিলে লেখার অনুমতি না দিয়ে
-- কেবল এই ফাংশনটি চালানোর অনুমতি দেওয়া হয়েছে, যাতে কেউ ইচ্ছেমতো
-- সংখ্যা বসিয়ে দিতে না পারে।
create or replace function public.bump_view(aid text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.article_stats (article_id, views)
  values (aid, 1)
  on conflict (article_id)
  do update set views = public.article_stats.views + 1;
end;
$$;

grant execute on function public.bump_view(text) to anon, authenticated;


-- -------------------------------------------------------------------------
-- ৪. ভিজিটর গণনা
--    প্রতিবার পাতা খুললে একটি সারি যোগ হয়।
-- -------------------------------------------------------------------------
create table if not exists public.visits (
  id         bigserial primary key,
  day        date not null default ((now() at time zone 'Asia/Dhaka')::date),
  created_at timestamptz not null default now()
);

create index if not exists visits_day_idx on public.visits (day);

alter table public.visits enable row level security;

drop policy if exists "ভিজিট লিপিবদ্ধ" on public.visits;
create policy "ভিজিট লিপিবদ্ধ" on public.visits
  for insert with check (true);

drop policy if exists "ভিজিট গণনা পড়া" on public.visits;
create policy "ভিজিট গণনা পড়া" on public.visits
  for select using (true);


-- -------------------------------------------------------------------------
-- ৫. পুরোনো ভিজিট সারি পরিষ্কার (ঐচ্ছিক)
--    টেবিল অতিরিক্ত বড় হয়ে গেলে মাঝেমধ্যে এটি চালাতে পারেন।
--    ৯০ দিনের পুরোনো সারি মুছে যাবে; দৈনিক হিসাব রাখতে চাইলে
--    আগে নিচের সারাংশটি কোথাও টুকে রাখুন।
-- -------------------------------------------------------------------------
-- select day, count(*) from public.visits group by day order by day;
-- delete from public.visits where day < current_date - 90;

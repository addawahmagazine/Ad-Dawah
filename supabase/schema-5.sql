-- =========================================================================
--  আদ দাওয়াহ — schema-5.sql
--  পাঠকের পাঠানো প্রশ্নের উত্তর সাইট থেকেই দেওয়া ও প্রকাশ করা
--
--  চালানোর নিয়ম: Supabase → SQL Editor → New query → পুরোটা পেস্ট → Run
--  একাধিকবার চালালেও কোনো ক্ষতি নেই।
-- =========================================================================

-- ১. প্রশ্নের টেবিলে নতুন ঘর
alter table public.questions add column if not exists published       boolean not null default false;  -- সাইটে প্রকাশ হবে কি না
alter table public.questions add column if not exists public_question text;                            -- প্রকাশের জন্য গুছিয়ে লেখা প্রশ্ন (ঐচ্ছিক)
alter table public.questions add column if not exists answered_at     timestamptz;

-- ২. প্রশাসকেরা সব প্রশ্ন দেখতে ও উত্তর দিতে পারবেন
--    (পাঠক আগের মতোই শুধু নিজের প্রশ্ন দেখবেন)
drop policy if exists "প্রশাসক সব প্রশ্ন দেখেন" on public.questions;
create policy "প্রশাসক সব প্রশ্ন দেখেন" on public.questions
  for select using (public.is_admin());

drop policy if exists "প্রশাসক উত্তর দেন" on public.questions;
create policy "প্রশাসক উত্তর দেন" on public.questions
  for update using (public.is_admin()) with check (public.is_admin());

-- ৩. সবার জন্য প্রকাশিত উত্তরের তালিকা
--    শুধু প্রশ্ন, উত্তর, বিষয় ও তারিখ বাইরে যায় — প্রশ্নকারীর নাম বা ইমেইল কখনো নয়।
create or replace function public.published_answers()
returns table (id uuid, question text, answer text, topic text, answered_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select q.id,
         coalesce(nullif(trim(q.public_question), ''), q.body) as question,
         q.answer,
         q.topic,
         coalesce(q.answered_at, q.created_at) as answered_at
  from public.questions q
  where q.published and q.answered and coalesce(trim(q.answer), '') <> ''
  order by coalesce(q.answered_at, q.created_at) desc
  limit 300;
$$;

grant execute on function public.published_answers() to anon, authenticated;

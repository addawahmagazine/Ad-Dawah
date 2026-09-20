/* =========================================================================
   আদ দাওয়াহ — supabase/schema-3.sql

   লগইনের সময় "অ্যাকাউন্ট নেই" আর "পাসওয়ার্ড ভুল" — এই দুটো আলাদা করে
   বলার জন্য একটি ছোট ফাংশন। Supabase নিজে থেকে দুটোর জন্যই একই বার্তা
   দেয়, তাই এটি দরকার।

   Supabase ড্যাশবোর্ড → SQL Editor → এই ফাইলের সবটুকু পেস্ট করে Run।
   ========================================================================= */

create or replace function public.account_exists(addr text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(addr))
  );
$$;

revoke all on function public.account_exists(text) from public;
grant execute on function public.account_exists(text) to anon, authenticated;

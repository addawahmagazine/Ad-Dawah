/* =========================================================================
   আদ দাওয়াহ — supabase/schema-4.sql
   টেলিগ্রামে নোটিফিকেশন

   যা যা খবর আসবে:
     • কেউ নতুন অ্যাকাউন্ট খুললে
     • কেউ পিডিএফ কেনার রিকোয়েস্ট পাঠালে
     • কেউ প্রশ্ন পাঠালে

   -------------------------------------------------------------------------
   চালানোর আগে যা করতে হবে
   -------------------------------------------------------------------------
   ধাপ ১ — বট বানান
     টেলিগ্রামে @BotFather খুঁজে বের করুন → /newbot লিখুন →
     নাম ও ইউজারনেম দিন। শেষে একটা টোকেন দেবে, দেখতে এরকম:
     8123456789:AAF_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     এটি কপি করে রাখুন।

   ধাপ ২ — কোথায় খবর যাবে ঠিক করুন
     (ক) নিজে একা পেতে চাইলে: বটটিকে টেলিগ্রামে খুঁজে Start চাপুন,
          তারপর যেকোনো একটা বার্তা পাঠান।
     (খ) টিমের সবাই পেতে চাইলে: একটা গ্রুপ বানিয়ে বটটিকে যোগ করুন,
          গ্রুপে যেকোনো একটা বার্তা পাঠান।

   ধাপ ৩ — আইডি বের করুন
     ব্রাউজারে এই ঠিকানায় যান (TOKEN-এর জায়গায় আপনার টোকেন বসিয়ে):
     https://api.telegram.org/botTOKEN/getUpdates
     ভেতরে "chat":{"id": ...} লেখা পাবেন। ঐ সংখ্যাটিই আপনার আইডি।
     গ্রুপের আইডি সাধারণত মাইনাস দিয়ে শুরু হয়, যেমন -1001234567890

   ধাপ ৪ — নিচের ফাইলটি Supabase → SQL Editor-এ পেস্ট করুন।
     প্রথমে ৬৬ ও ৬৭ নম্বর লাইনে আপনার টোকেন ও আইডি বসান, তারপর Run।
   ========================================================================= */


-- -------------------------------------------------------------------------
-- ১. বাইরের ঠিকানায় বার্তা পাঠানোর সুবিধা চালু করা
-- -------------------------------------------------------------------------
create extension if not exists pg_net;


-- -------------------------------------------------------------------------
-- ২. টোকেন ও আইডি রাখার জায়গা
--    RLS চালু, কোনো নীতি নেই — অর্থাৎ সাইট থেকে কেউ এটি পড়তে পারবে না।
-- -------------------------------------------------------------------------
create table if not exists public.notify_config (
  id        smallint primary key default 1 check (id = 1),
  bot_token text not null,
  chat_id   text not null
);

alter table public.notify_config enable row level security;


-- ⬇⬇⬇  এখানে আপনার নিজের টোকেন ও আইডি বসান  ⬇⬇⬇
insert into public.notify_config (id, bot_token, chat_id)
values (
  1,
  'এখানে-বটের-টোকেন',
  'এখানে-চ্যাট-আইডি'
)
on conflict (id) do update
  set bot_token = excluded.bot_token,
      chat_id   = excluded.chat_id;


-- -------------------------------------------------------------------------
-- ৩. বার্তা পাঠানোর ফাংশন
--    কোনো কারণে পাঠাতে না পারলেও মূল কাজ (সাইন আপ, অর্ডার) আটকাবে না।
-- -------------------------------------------------------------------------
create or replace function public.tg_send(msg text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cfg public.notify_config%rowtype;
begin
  select * into cfg from public.notify_config where id = 1;
  if not found or cfg.bot_token is null or cfg.bot_token = '' then
    return;
  end if;

  perform net.http_post(
    url     := 'https://api.telegram.org/bot' || cfg.bot_token || '/sendMessage',
    body    := jsonb_build_object(
                 'chat_id', cfg.chat_id,
                 'text', msg,
                 'parse_mode', 'HTML',
                 'disable_web_page_preview', true
               ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
exception when others then
  -- খবর না গেলেও পাঠকের কাজ যেন থেমে না যায়
  return;
end;
$$;


-- -------------------------------------------------------------------------
-- ৪. নতুন অ্যাকাউন্ট খুললে
-- -------------------------------------------------------------------------
create or replace function public.tg_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.tg_send(
    '🆕 <b>নতুন পাঠক</b>' || E'\n' ||
    'ইমেইল: ' || coalesce(new.email, '—') || E'\n' ||
    'নাম: '   || coalesce(new.raw_user_meta_data ->> 'name', '—') || E'\n' ||
    'মোবাইল: ' || coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), '—')
  );
  return new;
end;
$$;

drop trigger if exists tg_signup on auth.users;
create trigger tg_signup
  after insert on auth.users
  for each row execute function public.tg_on_signup();


-- -------------------------------------------------------------------------
-- ৫. পিডিএফ কেনার রিকোয়েস্ট এলে
-- -------------------------------------------------------------------------
create or replace function public.tg_on_purchase()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  who text;
begin
  select email into who from auth.users where id = new.user_id;

  perform public.tg_send(
    '💳 <b>পিডিএফ কেনার রিকোয়েস্ট</b>' || E'\n' ||
    'সংখ্যা: ' || coalesce(new.issue_label, new.issue_id) || E'\n' ||
    'টাকা: '   || coalesce(new.amount::text, '—') || E'\n' ||
    'মাধ্যম: ' || coalesce(new.method, '—') || E'\n' ||
    'ট্রানজেকশন: ' || coalesce(new.trxid, '—') || E'\n' ||
    'পাঠক: '   || coalesce(who, '—') || E'\n\n' ||
    'অনুমোদন দিতে সাইটে লগইন করে অ্যাকাউন্ট পাতায় যান।'
  );
  return new;
end;
$$;

drop trigger if exists tg_purchase on public.purchases;
create trigger tg_purchase
  after insert on public.purchases
  for each row execute function public.tg_on_purchase();


-- -------------------------------------------------------------------------
-- ৬. নতুন প্রশ্ন এলে
-- -------------------------------------------------------------------------
create or replace function public.tg_on_question()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.tg_send(
    '❓ <b>নতুন প্রশ্ন</b>' || E'\n' ||
    'বিষয়: ' || coalesce(new.topic, '—') || E'\n' ||
    'পাঠক: ' || coalesce(new.name, '—') ||
      case when new.email is not null then ' (' || new.email || ')' else '' end || E'\n\n' ||
    left(new.body, 700) ||
      case when length(new.body) > 700 then '…' else '' end
  );
  return new;
end;
$$;

drop trigger if exists tg_question on public.questions;
create trigger tg_question
  after insert on public.questions
  for each row execute function public.tg_on_question();


-- =========================================================================
-- পরীক্ষা করে দেখুন — নিচের লাইনটি আলাদাভাবে Run করলে
-- টেলিগ্রামে একটি বার্তা আসার কথা।
-- =========================================================================

-- select public.tg_send('✅ আদ দাওয়াহ — নোটিফিকেশন চালু হয়েছে।');


/* -------------------------------------------------------------------------
   বন্ধ করতে চাইলে (দরকার হলে)

   drop trigger if exists tg_signup   on auth.users;
   drop trigger if exists tg_purchase on public.purchases;
   drop trigger if exists tg_question on public.questions;

   টোকেন বদলাতে চাইলে শুধু উপরের insert অংশটি আবার Run করুন।
   ------------------------------------------------------------------------- */

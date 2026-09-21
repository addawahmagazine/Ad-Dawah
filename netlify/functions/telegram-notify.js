/* =========================================================================
   আদ দাওয়াহ — Netlify ফর্ম থেকে টেলিগ্রামে খবর

   কাজ করে যেভাবে:
     কেউ সাইটের কোনো ফর্ম পাঠালে Netlify এই ঠিকানায় খবর পাঠায়,
     আর এই ফাইলটি সেটিকে সাজিয়ে টেলিগ্রাম গ্রুপে পৌঁছে দেয়।

   টোকেন ও চ্যাট আইডি এই ফাইলে লেখা নেই — Netlify-র
   Environment variables-এ রাখা থাকবে। রিপোজিটরি সবার জন্য খোলা,
   তাই এখানে লিখলে টোকেন ফাঁস হয়ে যেত।

   সেটআপের নিয়ম নিচে, ফাইলের একদম শেষে।
   ========================================================================= */

const FORM_NAMES = {
  lekha:     '✍️ নতুন লেখা এসেছে',
  subscribe: '📧 নতুন সাবস্ক্রাইবার',
  order:     '📦 নতুন বই অর্ডার',
  onuvuti:   '💬 পাঠকের অনুভূতি',
  jiggasha:  '❓ নতুন প্রশ্ন',
};

/* ঘরের ইংরেজি নামগুলো বাংলায় দেখাই */
const FIELD_NAMES = {
  nam: 'নাম',            name: 'নাম',          email: 'ইমেইল',
  mobile: 'মোবাইল',      phone: 'মোবাইল',      jogajog: 'যোগাযোগ',
  porichoy: 'পরিচয়',     porichiti: 'পরিচিতি', bibhag: 'বিভাগ',
  shironam: 'শিরোনাম',   lekha: 'লেখা',        onuvuti: 'যা বলেছেন',
  onumoti: 'প্রকাশের অনুমতি', thikana: 'ঠিকানা', songkha: 'সংখ্যা',
  poriman: 'পরিমাণ',     payment: 'পেমেন্ট',   trxid: 'ট্রানজেকশন',
  note: 'মন্তব্য',        topic: 'বিষয়',
};

const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clip = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

function buildMessage(formName, data) {
  const head = FORM_NAMES[formName] || `📨 নতুন বার্তা (${formName})`;
  const lines = [`<b>${head}</b>`, ''];

  for (const [key, raw] of Object.entries(data || {})) {
    if (!raw || key === 'form-name' || key === 'bot-field') continue;
    const value = String(raw).trim();
    if (!value) continue;
    const label = FIELD_NAMES[key] || key;
    // লম্বা লেখা আলাদা লাইনে, ছোটগুলো পাশাপাশি
    lines.push(value.length > 60
      ? `<b>${label}:</b>\n${escapeHtml(clip(value, 900))}`
      : `<b>${label}:</b> ${escapeHtml(value)}`);
  }

  if (lines.length === 2) lines.push('(কোনো তথ্য পাওয়া যায়নি)');
  lines.push('', 'পুরোটা দেখতে: Netlify → Forms');
  return lines.join('\n');
}

exports.handler = async (event) => {
  const token  = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  const secret = process.env.TG_HOOK_SECRET;

  // গোপন চাবি মিলিয়ে দেখি — নইলে যে কেউ এই ঠিকানায় বার্তা পাঠাতে পারত
  const key = (event.queryStringParameters || {}).key;
  if (secret && key !== secret) {
    return { statusCode: 401, body: 'অনুমতি নেই' };
  }
  if (!token || !chatId) {
    return { statusCode: 500, body: 'TG_BOT_TOKEN বা TG_CHAT_ID বসানো হয়নি' };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { /* খালি রেখে দিই */ }

  // Netlify কখনো সরাসরি, কখনো payload-এর ভেতরে পাঠায় — দুটোই সামলাই
  const sub      = body.payload || body;
  const formName = sub.form_name || sub.formName || 'unknown';
  const data     = sub.data || sub.human_fields || {};

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(formName, data),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    // টেলিগ্রাম না নিলেও Netlify-কে ঠিক আছে বলি, নইলে সে বারবার চেষ্টা করবে
    if (!res.ok) console.error('টেলিগ্রাম:', res.status, await res.text());
  } catch (err) {
    console.error('পাঠানো গেল না:', err);
  }

  return { statusCode: 200, body: 'ok' };
};

/* -------------------------------------------------------------------------
   সেটআপ (একবারই করতে হবে)

   ধাপ ১ — Netlify → Project configuration → Environment variables
           তিনটি যোগ করুন:

             TG_BOT_TOKEN    = আপনার বটের টোকেন
             TG_CHAT_ID      = -5360433598
             TG_HOOK_SECRET  = নিজের বানানো যেকোনো গোপন শব্দ
                               (যেমন: addawah-2026-xyz)

   ধাপ ২ — এই ফাইলসহ সাইটটি ডিপ্লয় করুন।

   ধাপ ৩ — Netlify → Forms → Submission notifications → Add notification
           → Outgoing webhook

             Event    : New form submission
             Form     : Any form
             URL      : https://addawahmagazine.netlify.app/.netlify/functions/telegram-notify?key=গোপন-শব্দ

           (গোপন-শব্দের জায়গায় TG_HOOK_SECRET-এ যা দিয়েছেন সেটাই বসান)

   ধাপ ৪ — সাইটে গিয়ে একটা ফর্ম পাঠিয়ে দেখুন।

   ইমেইলের নোটিফিকেশন আগের মতোই থাকবে, এটি তার অতিরিক্ত।
   ------------------------------------------------------------------------- */

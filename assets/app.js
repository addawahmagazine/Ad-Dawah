/* =========================================================================
   আদ দাওয়াহ — assets/app.js

   এই ফাইলে কোনো লেখা নেই। সব কনটেন্ট আসে content/ ফোল্ডারের JSON
   ফাইল থেকে, যেগুলো /admin প্যানেল থেকে সম্পাদনা করা যায়।
   ========================================================================= */

/* ---------- বাংলা সংখ্যা ---------- */
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const bn = v => String(v).replace(/[0-9]/g, d => BN_DIGITS[+d]);

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const HIJRI_MONTHS = ['মুহাররম','সফর','রবিউল আউয়াল','রবিউস সানি','জুমাদাল ঊলা','জুমাদাল উখরা','রজব','শা\u200Cবান','রমাদান','শাওয়াল','যিলক্বদ','যিলহজ্জ'];

/* ---------- কনটেন্ট ---------- */
let CATS = [], ISSUES = [], AUTHORS = [], ARTICLES = [];
let INFOGRAPHICS = [], INFOGRAPHS = [], MEDIA = [], QA_RECENT = [], SITE = {}, PAYMENTS = [];
let FEEDBACK = [], FEEDBACK_INTRO = '';
let ABOUT = {}, QUOTES = {}, ADS = [], OUTLETS = [], OUTLET_INTRO = '';

/* খুঁজে না পেলে ফাঁকা ফেরত দিই — আগে তালিকার প্রথমটি বসে যেত,
   ফলে মুছে ফেলা লেখক/বিভাগের লেখা অন্য কারো নামে দেখাত। */
const catById    = id => CATS.find(c => c.id === id)    || { id:'', name:'', color:'#0F5132' };
const issueById  = id => ISSUES.find(i => i.id === id)  || { id:'', label:'', greg:'', hijri:'' };
const issueOf    = a => ISSUES.find(i => i.id === a.issue) || null;   // না থাকলে null
const isWeb      = a => a.kind === 'web' || !a.issue;
const authorById = id => AUTHORS.find(a => a.id === id) || { id:'', name:'' };

/* লেখকের নাম: তালিকার লেখক হলে তালিকা থেকে, নইলে "অতিথি লেখকের নাম" ঘর থেকে */
const guestOf    = a => String(a?.guest || '').trim();

/* সংক্ষিপ্তসার না দিলে মূল লেখার প্রথম অনুচ্ছেদ থেকে কয়েক লাইন নিয়ে নিই */
const excerptOf = a => {
  const x = String(a?.excerpt || '').trim();
  if (x) return x;
  const first = (a?.body || []).find(b => b.type === 'para' && String(b.text || '').trim());
  const t = String(first?.text || '').trim();
  return t.length > 180 ? t.slice(0, 180).replace(/\s+\S*$/, '') + '…' : t;
};
const authorName = a => guestOf(a) || (a?.author ? authorById(a.author).name : '');
/* সব লেখায় ব্যবহৃত অতিথি লেখকদের নাম, একবার করে */
const guestNames = () => [...new Set(ARTICLES.map(guestOf).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'bn'));
/* ফিল্টারে অতিথি লেখকের মান হয় guest:নাম */
const matchesAuthor = (a, sel) => {
  if (sel === 'all') return true;
  if (sel.startsWith('guest:')) return guestOf(a) === sel.slice(6);
  return !guestOf(a) && a.author === sel;
};

/* =========================================================================
   কনটেন্ট লোড
   ========================================================================= */
const REQUIRED = ['site','categories','authors','issues','articles','media'];
const OPTIONAL = ['about','quotes','ads','outlets','feedback'];

async function getJSON(name, bust){
  const res = await fetch(`content/${name}.json${bust}`, { cache:'no-store' });
  if (!res.ok) throw new Error(`content/${name}.json — ${res.status}`);
  return res.json();
}

async function loadContent(){
  const bust = `?v=${Date.now()}`;
  const req = await Promise.all(REQUIRED.map(n => getJSON(n, bust)));
  const [site, cats, auths, issues, arts, media] = req;

  SITE         = site || {};
  PAYMENTS     = SITE.payments || [];
  CATS         = cats.categories || [];
  AUTHORS      = auths.authors   || [];
  ISSUES       = issues.issues   || [];
  ARTICLES     = arts.articles   || [];
  INFOGRAPHICS = media.infographics || [];   // দাওয়াহ কার্ড
  INFOGRAPHS   = media.infographs || [];     // ইনফোগ্রাফিক্স
  MEDIA        = media.media || [];
  QA_RECENT    = media.qa || [];

  // ঐচ্ছিক ফাইল — না থাকলেও সাইট চলবে
  const opt = await Promise.all(OPTIONAL.map(n => getJSON(n, bust).catch(() => null)));
  const [about, quotes, ads, outlets, feedback] = opt;
  ABOUT        = about || {};
  QUOTES       = quotes || { enabled:false, quotes:[] };
  ADS          = (ads && ads.ads) || [];
  OUTLETS      = (outlets && outlets.outlets) || [];
  OUTLET_INTRO = (outlets && outlets.intro) || '';
  FEEDBACK       = (feedback && feedback.items) || [];
  FEEDBACK_INTRO = (feedback && feedback.intro) || '';
}

function loadFailed(err){
  document.body.insertAdjacentHTML('afterbegin', `
    <div style="background:#B45309;color:#fff;padding:16px 20px;font-size:15.5px;line-height:1.8">
      <strong>কনটেন্ট লোড করা যায়নি।</strong>
      ফাইলটি সরাসরি ডাবল-ক্লিক করে খুললে ব্রাউজার <code>content/</code> ফোল্ডার পড়তে দেয় না।
      ফোল্ডারে <code>npx serve</code> বা <code>python3 -m http.server</code> চালিয়ে দেখুন —
      নেটলিফাইতে এই সমস্যা হবে না।
      <br><small style="opacity:.85">${err.message}</small>
    </div>`);
}

/* =========================================================================
   ছোট সহায়ক
   ========================================================================= */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let toastTimer;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

/* তারিখ — Decap "DD/MM/YYYY" বা ISO দুটোই বোঝে */
function parseDate(v){
  if (!v) return null;
  const m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
function bnDate(v){
  const d = parseDate(v);
  return d ? `${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${bn(d.getFullYear())}` : '';
}

/* =========================================================================
   কভার ও থাম্বনেইল
   ========================================================================= */
function coverSVG(issue){
  if (issue.cover){
    return `<img src="${esc(issue.cover)}" alt="${esc(issue.label)} প্রচ্ছদ" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }
  const bg = issue.bg || '#064E3B';
  const accent = issue.accent || '#D97706';
  const ink = '#F8FAF8';
  const uid = String(issue.id || 'x').replace(/[^a-z0-9-]/gi, '');
  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(issue.label)} প্রচ্ছদ">
    <defs>
      <pattern id="p-${uid}" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 7l8 8-8 8-8-8z" fill="${accent}" opacity=".14"/>
      </pattern>
      <linearGradient id="g-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#04140E"/>
      </linearGradient>
    </defs>
    <rect width="300" height="400" fill="url(#g-${uid})"/>
    <rect width="300" height="400" fill="url(#p-${uid})"/>
    <rect x="12" y="12" width="276" height="376" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
    <rect x="18" y="18" width="264" height="364" fill="none" stroke="${accent}" stroke-width=".5" opacity=".45"/>
    <g transform="translate(150 88)">
      <circle r="30" fill="none" stroke="${accent}" stroke-width="1.4"/>
      <circle r="24" fill="none" stroke="${accent}" stroke-width=".6" stroke-dasharray="2 3"/>
      <path fill-rule="evenodd" d="M0-20c-6 0-10.8 4.8-10.8 10.8V17h21.6V-9.2C10.8-15.2 6-20 0-20zm0 5c3.2 0 5.8 2.6 5.8 5.8V12h-11.6V-9.2C-5.8-12.4-3.2-15 0-15z" fill="${accent}"/>
    </g>
    <text x="150" y="172" text-anchor="middle" fill="${ink}" font-family="SolaimanLipi, sans-serif" font-size="40" font-weight="700">আদ দাওয়াহ</text>
    <line x1="80" y1="192" x2="220" y2="192" stroke="${accent}" stroke-width="1"/>
    <text x="150" y="216" text-anchor="middle" fill="${ink}" opacity=".85" font-family="SolaimanLipi, sans-serif" font-size="12.5">ত্রৈমাসিক ইসলামী পত্রিকা</text>
    <text x="150" y="300" text-anchor="middle" fill="${accent}" font-family="SolaimanLipi, sans-serif" font-size="19" font-weight="600">${esc(issue.label)}</text>
    <text x="150" y="326" text-anchor="middle" fill="${ink}" opacity=".8" font-family="SolaimanLipi, sans-serif" font-size="13">${esc(issue.hijri)} ॥ ${esc(issue.greg)}</text>
    <text x="150" y="364" text-anchor="middle" fill="${ink}" opacity=".55" font-family="SolaimanLipi, sans-serif" font-size="11.5">কুরআন ও সুন্নাহর আলোকে</text>
  </svg>`;
}

/* ছবি না দিলে বিভাগের রঙে জ্যামিতিক থাম্বনেইল */
function thumbSVG(a){
  const c = catById(a.cat);
  const uid = String(a.id || 'x').replace(/[^a-z0-9-]/gi, '');
  return `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(a.title)}">
    <defs>
      <linearGradient id="tg-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c.color}"/><stop offset="1" stop-color="#06231A"/>
      </linearGradient>
      <pattern id="tp-${uid}" width="44" height="44" patternUnits="userSpaceOnUse">
        <path d="M22 9l13 13-13 13-13-13z" fill="#F8FAF8" opacity=".08"/>
      </pattern>
    </defs>
    <rect width="640" height="360" fill="url(#tg-${uid})"/>
    <rect width="640" height="360" fill="url(#tp-${uid})"/>
    <g transform="translate(320 170)" opacity=".9">
      <circle r="52" fill="none" stroke="#F8FAF8" stroke-width="1.4" opacity=".5"/>
      <circle r="42" fill="none" stroke="#F8FAF8" stroke-width=".7" stroke-dasharray="3 4" opacity=".5"/>
      <path fill-rule="evenodd" d="M0-32c-9.4 0-17 7.6-17 17V28h34V-15c0-9.4-7.6-17-17-17zm0 8c5 0 9 4 9 9V20h-18V-15c0-5 4-9 9-9z" fill="#F8FAF8" opacity=".8"/>
    </g>
  </svg>`;
}

/* =========================================================================
   শেয়ার
   ========================================================================= */
const SHARE_ICONS = {
  whatsapp:'M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.5.3 0 .1 0 .5-.2 1.1z',
  facebook:'M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z',
  telegram:'M21.6 4.3 2.9 11.5c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.4c.3.8 1.3 1 1.9.4l2.5-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3.2-15c.2-.9-.7-1.7-1.9-1.6zM9.3 14.3l8.6-5.3-6.9 6.4-.3 3.3-1.4-4.4z',
  copy:'M9 3h9a2 2 0 0 1 2 2v9h-2V5H9V3zM5 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v10h9V9H5z'
};
const shareIcon = k => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SHARE_ICONS[k]}"/></svg>`;

function shareURL(kind, url, title){
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  if (kind === 'whatsapp') return `https://wa.me/?text=${t}%20${u}`;
  if (kind === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  if (kind === 'telegram') return `https://t.me/share/url?url=${u}&text=${t}`;
  return url;
}

function doShare(kind, article){
  if (!article) return;
  const url = `${location.origin}${location.pathname}#/lekha/${article.id}`;
  if (kind === 'copy'){
    navigator.clipboard?.writeText(url).then(() => toast('লিংক কপি হয়েছে')).catch(() => toast('লিংক: ' + url));
    return;
  }
  window.open(shareURL(kind, url, article.title), '_blank', 'noopener,width=680,height=620');
}

/* =========================================================================
   তারিখ ও সাইট সেটিংস
   ========================================================================= */
function renderDates(){
  const now = new Date();
  $('#gregDate').textContent = `${bn(now.getDate())} ${BN_MONTHS[now.getMonth()]} ${bn(now.getFullYear())}`;
  let hijri;
  try{
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',
      { day:'numeric', month:'numeric', year:'numeric' }).formatToParts(now);
    const get = t => parts.find(p => p.type === t)?.value;
    const m = HIJRI_MONTHS[Math.max(0, Math.min(11, +get('month') - 1))];
    hijri = `${bn(get('day'))} ${m} ${bn(String(get('year')).replace(/\D/g,''))} হিজরি`;
  }catch(e){ hijri = ''; }
  $('#hijriDate').textContent = hijri;
  $('#yearNow').textContent = bn(now.getFullYear());
}

function applySite(){
  // লিংক থাকলে বসাই, না থাকলে আইকনটি লুকিয়ে রাখি
  const set = (sel, href) => {
    const el = $(sel); if (!el) return;
    if (href) el.href = href; else el.hidden = true;
  };
  set('#lnkFacebook', SITE.facebook);
  set('#lnkYoutube',  SITE.youtube);
  set('#lnkTelegram', SITE.telegram);
  set('#lnkWhatsapp', SITE.whatsapp);
  set('#fsFacebook',  SITE.facebook);
  set('#fsYoutube',   SITE.youtube);
  set('#fsTelegram',  SITE.telegram);
  set('#fsWhatsapp',  SITE.whatsapp);

  if (SITE.email){ const e = $('#ctEmail'); e.href = 'mailto:' + SITE.email; e.textContent = SITE.email; }
  if (SITE.phone){ const p = $('#ctPhone'); p.href = 'tel:' + SITE.phone.replace(/[^\d+]/g,''); p.textContent = bn(SITE.phone); }
  if (SITE.address) $('#ctAddress').innerHTML = esc(SITE.address).replace(/\n/g,'<br>');

  const s = SITE.price_single ?? 120;
  $('#orderNote').textContent =
    [SITE.order_note, `এক সংখ্যা ৳${bn(s)} — কুরিয়ার খরচসহ।`].filter(Boolean).join(' ');
  if (SITE.donate_note) $('#donateNote').textContent = SITE.donate_note;
}

/* =========================================================================
   আমাদের সম্পর্কে ও ফর্মের লেখা
   ========================================================================= */
function renderAbout(){
  if (ABOUT.heading) $('#aboutHeading').textContent = ABOUT.heading;
  if (ABOUT.paragraphs?.length)
    $('#aboutBody').innerHTML = ABOUT.paragraphs.map(p => `<p>${rich(p.text)}</p>`).join('');
  if (ABOUT.board_title) $('#aboutBoardTitle').textContent = ABOUT.board_title;
  if (ABOUT.board?.length)
    $('#aboutBoard').innerHTML = ABOUT.board.map(b =>
      `<dt>${esc(b.role)}</dt><dd>${esc(b.name)}</dd>`).join('');

  $('#qaIntroText').textContent = ABOUT.qa_intro || '';
  $('#qaPointsList').innerHTML = (ABOUT.qa_points || []).map(p => `<li>${esc(p.text)}</li>`).join('');

  if (ABOUT.submit_title) $('#submitTitle').textContent = ABOUT.submit_title;
  $('#submitIntro').textContent = ABOUT.submit_intro || '';
  $('#submitCatSelect').innerHTML =
    CATS.map(c => `<option>${esc(c.name)}</option>`).join('') + `<option>নিশ্চিত নই</option>`;
}

/* =========================================================================
   হিরো ও প্রি-অর্ডার
   ========================================================================= */
function renderHero(){
  const published = ISSUES.filter(i => i.published);
  const issue = published[published.length - 1] || ISSUES[0];
  if (!issue) return;
  const inIssue = ARTICLES.filter(a => a.issue === issue.id);
  const lead = inIssue.find(a => a.lead) || inIssue[0] || ARTICLES[0];
  if (!lead) return;

  $('#heroIssueLabel').textContent = `${issue.label} ॥ ${issue.hijri} ॥ ${issue.greg}`;
  $('#heroTitle').textContent = lead.title;
  $('#heroExcerpt').textContent = excerptOf(lead);
  $('#heroBy').textContent = [authorName(lead), lead.read ? `পড়তে ${bn(lead.read)} মিনিট` : '']
    .filter(Boolean).join(' • ');
  $('#heroCover').innerHTML = coverSVG(issue);
  $('#heroCoverCap').textContent = `${issue.label}${issue.pages ? ` • ${bn(issue.pages)} পৃষ্ঠা` : ''}`;

  $('#heroMeta').innerHTML = `
    <div><dt>এই সংখ্যায়</dt><dd>${bn(inIssue.length)}টি লেখা</dd></div>
    <div><dt>বিভাগ</dt><dd>${bn(CATS.length)}টি</dd></div>
    <div><dt>পৃষ্ঠা</dt><dd>${bn(issue.pages || 0)}</dd></div>
    <div><dt>মূল্য</dt><dd>৳${bn(SITE.price_single ?? 120)}</dd></div>`;

  $('#heroRead').onclick = () => openArticle(lead.id);
  $('#heroPdf').onclick  = () => openPdf(issue.id);
}

function renderPreorder(){
  const up = ISSUES.find(i => !i.published && i.preorder);
  const box = $('#preorder');
  if (!up){ box.hidden = true; return; }
  box.hidden = false;
  $('#preCover').innerHTML = coverSVG(up);
  $('#preLabel').textContent = up.label;
  $('#preDate').textContent = `${up.hijri || ''} ॥ ${up.greg || ''}`;
  $('#preNote').textContent = up.preorder_note || 'প্রকাশের আগেই বুকিং দিয়ে রাখুন — ছাপা শেষ হওয়ার সঙ্গে সঙ্গে কুরিয়ারে পাঠানো হবে।';
  $('#preBtn').onclick = () => openOrder(up);
}

/* =========================================================================
   বিজ্ঞাপন
   ========================================================================= */
function adHTML(ad){
  const inner = ad.image
    ? `<img src="${esc(ad.image)}" alt="${esc(ad.title)}" loading="lazy">`
    : `<div class="adcard__fallback">${esc(ad.title)}</div>`;
  const tag = `<span class="adcard__lbl">বিজ্ঞাপন</span>`;
  return ad.link
    ? `<a class="adcard" href="${esc(ad.link)}" target="_blank" rel="noopener sponsored">${inner}${tag}</a>`
    : `<div class="adcard">${inner}${tag}</div>`;
}

function renderAds(){
  const fill = (sel, pos) => {
    const list = ADS.filter(a => a.active && (a.position || 'top') === pos);
    const el = $(sel);
    el.innerHTML = list.map(adHTML).join('');
    el.hidden = list.length === 0;
  };
  fill('#adTop', 'top');
  fill('#adBottom', 'bottom');
  $('#adBottom').classList.add('adslot--bottom');
}

/* =========================================================================
   লেখার গ্রিড
   ========================================================================= */
const issueBadge = a => {
  const i = issueOf(a);
  return i
    ? `<span class="card__issue">${esc(i.label)}</span>`
    : `<span class="card__issue card__issue--web">কেবল ওয়েবে</span>`;
};

const viewBadge = id => {
  const n = window.AD?.enabled ? window.AD.views(id) : 0;
  return n > 0 ? `<span class="card__views">${bn(n)} বার পঠিত</span>` : '';
};
const state = { cat:'all', issue:'all', author:'all', q:'', sort:'latest' };

function articleCard(a){
  const c = catById(a.cat);
  const thumb = a.thumb
    ? `<img src="${esc(a.thumb)}" alt="${esc(a.title)}" loading="lazy">`
    : thumbSVG(a);
  const d = bnDate(a.date);
  return `<article class="card card--thumbed" data-open="${a.id}" tabindex="0" role="button" aria-label="${esc(a.title)}">
    <div class="card__thumb">${thumb}
      ${c.name ? `<span class="card__tag" style="background:${c.color}">${esc(c.name)}</span>` : ''}
      ${issueBadge(a)}
      ${viewBadge(a.id)}
    </div>
    <div class="card__in">
      <h3 class="card__h">${esc(a.title)}</h3>
      <p class="card__x">${esc(excerptOf(a))}</p>
      <button class="card__more" data-open="${a.id}" tabindex="-1">আরো পড়ুন
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </button>
      <div class="card__foot">
        <span class="card__by">${[esc(authorName(a)), d || (a.read ? bn(a.read) + ' মিনিট' : '')].filter(Boolean).join(' • ')}</span>
        <span class="card__share">
          <button class="shr" data-share="whatsapp" data-id="${a.id}" aria-label="হোয়াটসঅ্যাপে শেয়ার">${shareIcon('whatsapp')}</button>
          <button class="shr" data-share="facebook" data-id="${a.id}" aria-label="ফেসবুকে শেয়ার">${shareIcon('facebook')}</button>
          <button class="shr" data-share="telegram" data-id="${a.id}" aria-label="টেলিগ্রামে শেয়ার">${shareIcon('telegram')}</button>
          <button class="shr" data-share="copy" data-id="${a.id}" aria-label="লিংক কপি">${shareIcon('copy')}</button>
        </span>
      </div>
    </div>
  </article>`;
}

function matches(a){
  if (state.cat !== 'all' && a.cat !== state.cat) return false;
  if (state.issue === '__web'){ if (!isWeb(a)) return false; }
  else if (state.issue !== 'all' && a.issue !== state.issue) return false;
  if (!matchesAuthor(a, state.author)) return false;
  if (state.q){
    const hay = [a.title, excerptOf(a), authorName(a), catById(a.cat).name].join(' ').toLowerCase();
    if (!hay.includes(state.q.toLowerCase())) return false;
  }
  return true;
}

function sortArticles(list){
  const out = [...list];
  if (state.sort === 'popular'){
    out.sort((x, y) => (window.AD?.views(y.id) || 0) - (window.AD?.views(x.id) || 0));
  } else if (state.sort === 'az'){
    out.sort((x, y) => x.title.localeCompare(y.title, 'bn'));
  } else {
    const t = a => { const d = parseDate(a.date); return d ? d.getTime() : null; };
    out.sort((x, y) => {
      const a = t(x), b = t(y);
      if (a === null && b === null) return 0;
      if (a === null) return 1;   // তারিখহীন লেখা শেষে
      if (b === null) return -1;
      return state.sort === 'oldest' ? a - b : b - a;
    });
  }
  return out;
}

function renderArticles(){
  const list = sortArticles(ARTICLES.filter(matches));
  $('#articleGrid').innerHTML = list.map(articleCard).join('');
  $('#articleEmpty').hidden = list.length > 0;
}

function renderFilters(){
  $('#catChips').innerHTML =
    `<button class="chip is-on" data-cat="all">সবগুলো</button>` +
    CATS.map(c => `<button class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join('');

  $('#issueFilter').innerHTML =
    `<option value="all">সব লেখা</option>` +
    ISSUES.map(i => `<option value="${i.id}">${esc(i.label)}</option>`).join('') +
    `<option value="__web">কেবল ওয়েবসাইটে</option>`;

  const gs = guestNames();
  $('#authorFilter').innerHTML =
    `<option value="all">সব লেখক</option>` +
    AUTHORS.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('') +
    (gs.length ? `<optgroup label="অতিথি লেখক">` +
      gs.map(g => `<option value="guest:${esc(g)}">${esc(g)}</option>`).join('') + `</optgroup>` : '');

  $('#catChips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = b.dataset.cat;
    $$('#catChips .chip').forEach(c => c.classList.toggle('is-on', c === b));
    renderArticles();
  });
  $('#issueFilter').onchange  = e => { state.issue  = e.target.value; renderArticles(); };
  $('#authorFilter').onchange = e => { state.author = e.target.value; renderArticles(); };
  $('#sortFilter').onchange   = e => { state.sort   = e.target.value; renderArticles(); };
  if (window.AD?.enabled && !$('#sortFilter').querySelector('[value="popular"]')){
    $('#sortFilter').insertAdjacentHTML('afterbegin', '<option value="popular">সবচেয়ে বেশি পঠিত</option>');
  }
}

/* =========================================================================
   বিভাগ, সংখ্যা, লেখক, মিডিয়া, এজেন্ট
   ========================================================================= */
function renderNavIssues(){
  // মেনুতে শুধু সর্বশেষ ৩টি প্রকাশিত সংখ্যা, বাকিগুলো "সব সংখ্যা দেখুন"-এ
  const pub = ISSUES.filter(i => i.published).reverse().slice(0, 3);
  const rows = pub.map(i =>
    `<li><a href="#archive" data-navpdf="${i.id}">${esc(i.label)}<span>${esc(i.greg)}</span></a></li>`).join('');
  $('#navIssues').innerHTML =
    (rows || '<li><span class="nav__sub-empty">এখনও কোনো সংখ্যা প্রকাশিত হয়নি</span></li>') +
    `<li class="nav__sub-all"><a href="#archive">সব সংখ্যা দেখুন →</a></li>`;
}

function renderCats(){
  $('#navCats').innerHTML = CATS.map(c => `<li><a href="#articles" data-jumpcat="${c.id}">${esc(c.name)}</a></li>`).join('');
  $('#catGrid').innerHTML = CATS.map(c => {
    const n = ARTICLES.filter(a => a.cat === c.id).length;
    return `<div class="catbox">
      <div class="catbox__ic" style="background:${c.color}1F;color:${c.color}">
        <svg viewBox="0 0 24 24"><path d="${c.icon || 'M12 3l7 4v5c0 4.4-3 8.3-7 9-4-.7-7-4.6-7-9V7l7-4z'}"/></svg>
      </div>
      <h3>${esc(c.name)}</h3>
      ${c.desc ? `<p>${esc(c.desc)}</p>` : ''}
      <button data-jumpcat="${c.id}">${bn(n)}টি লেখা দেখুন</button>
    </div>`;
  }).join('');
}

const isPaid = i => Number(i.pdf_price) > 0;

function pdfButton(i){
  if (!isPaid(i)) return `<button class="btn btn--line" data-issuepdf="${i.id}">পিডিএফ</button>`;
  const st = (window.AD?.enabled && AD.user) ? AD.issueStatus(i.id) : null;
  if (st === 'approved') return `<button class="btn btn--green" data-download="${i.id}">পিডিএফ নামান</button>`;
  if (st === 'pending')  return `<button class="btn btn--line" disabled>যাচাই চলছে…</button>`;
  return `<button class="btn btn--line" data-issuepdf="${i.id}">পিডিএফ ৳${bn(i.pdf_price)}</button>`;
}

async function downloadIssue(issueId){
  try{
    toast('লিংক তৈরি হচ্ছে…');
    const url = await AD.pdfLink(issueId);
    window.open(url, '_blank', 'noopener');
  }catch(err){
    console.error(err);
    toast('ফাইলটি পাওয়া গেল না। সম্পাদককে জানান।');
  }
}

function openBuy(issueId){
  const i = issueById(issueId);
  if (!AD.user){ openAuth('login'); return; }
  const hint = PAYMENTS.map(p => `<strong>${esc(p.title)} ${esc(p.number)}</strong>`).join(' ॥ ');
  openModal(`
    <h2 class="art__h" id="modalTitle">${esc(i.label)} — পিডিএফ</h2>
    <p class="art__meta">${esc(i.hijri)} ॥ ${esc(i.greg)} • মূল্য ৳${bn(i.pdf_price)}</p>
    <div class="payhint">
      প্রথমে <strong>৳${bn(i.pdf_price)}</strong> সেন্ড মানি করুন — ${hint}।
      তারপর নিচের ঘরে ট্রানজেকশন আইডিটি লিখে পাঠান।
      সম্পাদক মিলিয়ে দেখে অনুমোদন দিলেই পিডিএফটি আপনার অ্যাকাউন্টে যুক্ত হয়ে যাবে — এরপর যতবার খুশি নামাতে পারবেন।
    </div>
    <form class="ordform" id="buyForm">
      <div class="row">
        <label class="fld"><span>যে মাধ্যমে পাঠিয়েছেন</span>
          <select name="method">${PAYMENTS.map(p => `<option>${esc(p.title)}</option>`).join('')}</select>
        </label>
        <label class="fld"><span>ট্রানজেকশন আইডি</span>
          <input name="trxid" required placeholder="যেমন: 9F2K7QX1">
        </label>
      </div>
      <button class="btn btn--green btn--lg" type="submit">পাঠান</button>
      <p class="form__note" id="buyNote" role="status"></p>
    </form>`);

  const form = $('#buyForm'), note = $('#buyNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    note.textContent = 'পাঠানো হচ্ছে…';
    try{
      await AD.buyIssue({
        issue_id: i.id, issue_label: i.label,
        amount: Number(i.pdf_price), method: f.method, trxid: f.trxid.trim()
      });
      closeModal();
      toast('পাঠানো হয়েছে। যাচাইয়ের পর জানানো হবে, ইনশাআল্লাহ।');
      renderIssues();
    }catch(err){
      console.error(err);
      note.textContent = 'পাঠানো গেল না। আবার চেষ্টা করুন।';
      note.style.color = 'var(--accent)';
    }
  });
}

function renderIssues(){
  $('#issueGrid').innerHTML = [...ISSUES].reverse().map(i => {
    const n = ARTICLES.filter(a => a.issue === i.id).length;
    const btns = i.published
      ? `<button class="btn btn--line" data-issueread="${i.id}">লেখা দেখুন</button>
         ${pdfButton(i)}`
      : (i.preorder
          ? `<button class="btn btn--line" data-preorder="${i.id}">প্রি-অর্ডার</button>`
          : `<button class="btn btn--line" disabled>${esc(i.tagline || 'প্রস্তুত হচ্ছে')}</button>`);
    return `<article class="issue">
      <div class="cover">${coverSVG(i)}</div>
      <h3 class="issue__h">${esc(i.label)}</h3>
      <p class="issue__d">${esc(i.hijri)} ॥ ${esc(i.greg)}${i.published ? ` • ${bn(n)}টি লেখা` : ''}</p>
      <div class="issue__btns">${btns}</div>
    </article>`;
  }).join('');
}

const AUTHORS_SHOWN = 6;      // শুরুতে এতজন দেখাবে, বাকিরা বোতামে
let authorsExpanded = false;

function renderAuthors(){
  const countOf = id => ARTICLES.filter(x => !guestOf(x) && x.author === id).length;
  // "নিয়মিত লেখক" টিক না থাকলে নিচের ছোট তালিকায়। পুরনো লেখকদের টিক নেই, তাই তাঁদের নিয়মিত ধরা হয়।
  const isReg = a => a.featured !== false;

  const regs   = AUTHORS.filter(isReg);

  // মেনুর তালিকা — কয়েকজনের নাম, তারপর "সব লেখক দেখুন"
  const navSub = $('#navAuthors');
  if (navSub) navSub.innerHTML =
    regs.slice(0, 6).map(a =>
      `<li><a href="#articles" data-authfilter="${esc(a.id)}">${esc(a.name)}</a></li>`).join('') +
    `<li><a href="#authors" data-authors-all>সব লেখক দেখুন</a></li>`;

  const hidden = Math.max(0, regs.length - AUTHORS_SHOWN);
  const shown  = authorsExpanded ? regs : regs.slice(0, AUTHORS_SHOWN);

  $('#authorGrid').innerHTML = shown.map(a => {
    const av = a.photo
      ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">`
      : esc(String(a.name).trim().slice(0,1));
    return `<div class="auth">
      <div class="auth__av" aria-hidden="true">${av}</div>
      <h3 class="auth__n">${esc(a.name)}</h3>
      ${a.role ? `<p class="auth__r">${esc(a.role)}</p>` : ''}
      <p class="auth__c">${a.bio ? esc(a.bio) + '<br>' : ''}${bn(countOf(a.id))}টি লেখা</p>
    </div>`;
  }).join('');

  // বাকিদের জন্য বোতাম
  const more = $('#authorsMore');
  more.hidden = !hidden;
  if (hidden) more.innerHTML =
    `<button class="btn btn--ghost" data-authors-toggle>${
      authorsExpanded ? 'কম দেখুন' : `আরও ${bn(hidden)} জন লেখক দেখুন`}</button>`;

  // অতিথি ও অনিয়মিত লেখক — কেবল নাম, ক্লিক করলে তাঁর লেখাগুলো দেখাবে
  const others = AUTHORS.filter(a => !isReg(a))
    .map(a => ({ label: a.name, val: a.id, n: countOf(a.id) }))
    .concat(guestNames().map(g => ({
      label: g, val: 'guest:' + g,
      n: ARTICLES.filter(x => guestOf(x) === g).length
    })));

  $('#guestList').innerHTML = others.map(o =>
    `<button class="guests__i" data-authfilter="${esc(o.val)}">${esc(o.label)}<span>${bn(o.n)}</span></button>`
  ).join('');
  $('#guestAuthors').hidden = !others.length;
}

/* নমুনা (ডেমো) আইটেম — CMS-এ "নমুনা" টিক দেওয়া থাকলে */
const DEMO_MSG = 'এটি নমুনা হিসেবে দেওয়া, তাই খোলা যাবে না। শিগগিরই আসল কনটেন্ট যুক্ত হবে, ইনশাআল্লাহ।';
const isDemo = x => x && x.demo === true;

function setDemoNote(sel, list, what){
  const el = $(sel);
  if (!el) return;
  el.hidden = !list.some(isDemo);
  el.textContent = `এই অংশে এখনো আসল ${what} যুক্ত হয়নি। নিচেরগুলো নমুনা হিসেবে দেওয়া, তাই খোলা বা শেয়ার করা যাবে না। শিগগিরই আসল ${what} যুক্ত করা হবে, ইনশাআল্লাহ।`;
}

function renderInfoList(list, key, label, emptyMsg){
  if (!list.length) return `<p class="media__empty">${emptyMsg}</p>`;
  return list.map((g, i) => {
    const demo = isDemo(g);
    const linked = !demo && g.article && ARTICLES.some(a => a.id === g.article);
    const art = g.image
      ? `<div class="info__art info__art--img"><img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy"></div>`
      : `<div class="info__art" style="background:linear-gradient(155deg,${g.from || '#064E3B'},${g.to || '#0F5132'})">
           <p>${esc(g.title)}${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</p></div>`;
    const attrs = linked
      ? ` data-open="${g.article}" tabindex="0" role="button" aria-label="${esc(g.title)}"`
      : demo ? ` data-demo tabindex="0" role="button" aria-label="${esc(g.title)} (নমুনা)"` : '';
    const share = demo ? '' : `<span class="card__share">
          <button class="shr" data-infoshare="whatsapp" data-list="${key}" data-i="${i}" aria-label="হোয়াটসঅ্যাপে শেয়ার">${shareIcon('whatsapp')}</button>
          <button class="shr" data-infoshare="facebook" data-list="${key}" data-i="${i}" aria-label="ফেসবুকে শেয়ার">${shareIcon('facebook')}</button>
          <button class="shr" data-infoshare="copy" data-list="${key}" data-i="${i}" aria-label="লেখা কপি">${shareIcon('copy')}</button>
        </span>`;
    return `<article class="info${linked ? ' info--linked' : ''}${demo ? ' info--demo' : ''}"${attrs}>
      ${demo ? '<span class="demo-tag">নমুনা</span>' : ''}
      ${art}
      <div class="info__bar">
        <span>${linked ? 'বিস্তারিত পড়ুন →' : `${label} ${bn(i+1)}`}</span>
        ${share}
      </div>
    </article>`;
  }).join('');
}

function renderMediaEtc(){
  $('#infoGrid').innerHTML = renderInfoList(INFOGRAPHICS, 'card', 'দাওয়াহ কার্ড',
    'এই অংশে এখনো কোনো দাওয়াহ কার্ড যুক্ত হয়নি। শিগগিরই যোগ করা হবে, ইনশাআল্লাহ।');
  $('#infographGrid').innerHTML = renderInfoList(INFOGRAPHS, 'graph', 'ইনফোগ্রাফিক',
    'এই অংশে এখনো কোনো ইনফোগ্রাফিক যুক্ত হয়নি। শিগগিরই যোগ করা হবে, ইনশাআল্লাহ।');
  setDemoNote('#cardDemoNote', INFOGRAPHICS, 'দাওয়াহ কার্ড');
  setDemoNote('#graphDemoNote', INFOGRAPHS, 'ইনফোগ্রাফিক');
  setDemoNote('#mediaDemoNote', MEDIA, 'অডিও ও ভিডিও');

  $('#mediaList').innerHTML = !MEDIA.length
    ? '<li class="media__empty">এই অংশে এখনো কোনো অডিও বা ভিডিও যুক্ত হয়নি। শিগগিরই যোগ করা হবে, ইনশাআল্লাহ।</li>'
    : MEDIA.map(m => {
    const demo = isDemo(m);
    const icon = '<svg viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z"/></svg>';
    const play = demo
      ? `<button class="mitem__play" data-demo aria-label="চালান (নমুনা)">${icon}</button>`
      : m.link
        ? `<a class="mitem__play" href="${esc(m.link)}" target="_blank" rel="noopener" aria-label="চালান">${icon}</a>`
        : `<button class="mitem__play" aria-label="চালান">${icon}</button>`;
    return `<li class="mitem${demo ? ' mitem--demo' : ''}">${play}
      <div><p class="mitem__t">${esc(m.title)}${demo ? '<span class="demo-tag">নমুনা</span>' : ''}</p>${m.meta ? `<p class="mitem__m">${esc(m.meta)}</p>` : ''}</div>
      ${m.length ? `<span class="mitem__len">${esc(m.length)}</span>` : ''}
    </li>`;
  }).join('');

  $('#qaRecent').innerHTML = QA_RECENT.map(x =>
    `<div class="qaitem"><p class="q">${esc(x.q)}</p><p class="a">${esc(x.a)}</p></div>`).join('');

  $('#donateCards').innerHTML = PAYMENTS.map(p => `
    <div class="dcard">
      <span class="dcard__n" style="background:${p.color}">${esc(p.name)}</span>
      <div><p class="dcard__t">${esc(p.title)}</p><p class="dcard__v">${esc(p.number)}</p></div>
      <button class="dcard__copy" data-copy="${esc(p.number)}">নম্বর কপি</button>
    </div>`).join('');
}

/* ---- পাঠকের অনুভূতি ---- */
function renderFeedback(){
  const sec = $('#feedback'); if (!sec) return;
  // মতামত না থাকলেও সেকশনটি থাকবে — পাঠক যেন নিজের কথা পাঠাতে পারেন
  $('#fbGrid').hidden = !FEEDBACK.length;
  if (!FEEDBACK.length){ $('#fbIntro').textContent = ''; return; }

  $('#fbIntro').textContent = FEEDBACK_INTRO;
  $('#fbGrid').innerHTML = FEEDBACK.map(f => `
    <figure class="fb">
      <blockquote class="fb__q">${esc(f.text)}</blockquote>
      <figcaption class="fb__who">
        <span class="fb__av" aria-hidden="true">${esc(String(f.name || '').trim().slice(0,1))}</span>
        <span>
          <p class="fb__n">${esc(f.name)}</p>
          ${f.meta ? `<p class="fb__m">${esc(f.meta)}</p>` : ''}
        </span>
      </figcaption>
    </figure>`).join('');
}

/* ---- এজেন্ট ও মাকতাবা ---- */
const ostate = { kind:'all', district:'all' };

function renderOutletFilters(){
  $('#outletIntro').textContent = OUTLET_INTRO;
  const kinds = [...new Set(OUTLETS.map(o => o.kind).filter(Boolean))];
  $('#outletKind').innerHTML =
    `<button class="chip is-on" data-okind="all">সবগুলো</button>` +
    kinds.map(k => `<button class="chip" data-okind="${esc(k)}">${esc(k)}</button>`).join('');

  const districts = [...new Set(OUTLETS.map(o => o.district).filter(Boolean))].sort((a,b) => a.localeCompare(b,'bn'));
  $('#outletDistrict').innerHTML =
    `<option value="all">সব জেলা</option>` +
    districts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');

  $('#outletKind').addEventListener('click', e => {
    const b = e.target.closest('[data-okind]'); if (!b) return;
    ostate.kind = b.dataset.okind;
    $$('#outletKind .chip').forEach(c => c.classList.toggle('is-on', c === b));
    renderOutlets();
  });
  $('#outletDistrict').onchange = e => { ostate.district = e.target.value; renderOutlets(); };
}

function renderOutlets(){
  const list = OUTLETS.filter(o =>
    (ostate.kind === 'all' || o.kind === ostate.kind) &&
    (ostate.district === 'all' || o.district === ostate.district));

  $('#outletGrid').innerHTML = list.map(o => {
    const geo = [o.thana, o.district, o.division].filter(Boolean).join(', ');
    const tel = String(o.phone || '').replace(/[^\d+]/g,'');
    const btns = [
      o.phone ? `<a href="tel:${tel}"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>ফোন</a>` : '',
      o.phone ? `<a href="https://wa.me/88${tel.replace(/^\+?88/,'')}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="${SHARE_ICONS.whatsapp}" fill="currentColor" stroke="none"/></svg>হোয়াটসঅ্যাপ</a>` : '',
      o.map ? `<a href="${esc(o.map)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>ম্যাপ</a>` : ''
    ].filter(Boolean).join('');

    return `<article class="outlet">
      <div class="outlet__top">
        <h3 class="outlet__n">${esc(o.name)}</h3>
        <span class="outlet__kind">${esc(o.kind || '')}</span>
      </div>
      <p class="outlet__a">${esc(o.address)}</p>
      ${geo ? `<p class="outlet__geo">${esc(geo)}</p>` : ''}
      ${o.phone ? `<p class="outlet__a">${bn(o.phone)}</p>` : ''}
      ${btns ? `<div class="outlet__btns">${btns}</div>` : ''}
    </article>`;
  }).join('');

  $('#outletEmpty').hidden = list.length > 0;
}

/* =========================================================================
   মোডাল
   ========================================================================= */
let lastFocus = null;
function openModal(html){
  lastFocus = document.activeElement;
  $('#modalBody').innerHTML = html;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#modal').querySelector('.modal__box').scrollTop = 0;
  $('#modal').querySelector('.modal__x').focus();
}
function closeModal(){
  $('#modal').hidden = true;
  document.body.style.overflow = '';
  lastFocus?.focus?.();
  // লেখা বন্ধ করলে ঠিকানা থেকে লেখার লিংকটি সরিয়ে দিই,
  // নইলে রিফ্রেশ করলে আবার সেই লেখাটিই খুলে যায়।
  if (location.hash.startsWith('#/lekha/'))
    history.replaceState(null, '', location.pathname + location.search);
}

/* লেখার ভেতরে সাজসজ্জা — CMS-এর বোল্ড/ইটালিক/লিংক বোতামগুলো যা লিখে দেয়।
   আগে esc() দিয়ে সব নিরাপদ করে নেওয়া হয়, তাই কেউ HTML ঢুকিয়ে দিতে পারবে না। */
function rich(txt){
  let h = esc(String(txt || ''));
  h = h.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // চিহ্নের গা ঘেঁষে লেখা থাকলে তবেই সাজসজ্জা ধরা হয় —
  // নইলে "২ * ৩ = ৬" জাতীয় লেখা ভুল করে ইটালিক হয়ে যেত
  h = h.replace(/\*\*\*(?!\s)([^\n]*?[^\s*])\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*(?!\s)([^\n]*?[^\s*])\*\*/g,       '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*(?!\s)([^*\n]*?[^\s*])\*(?!\*)/g, '$1<em>$2</em>');
  h = h.replace(/__(?!\s)([^_\n]*[^\s_])__/g, '<u>$1</u>');
  h = h.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
  return h;
}

/* লেখার ভাষা চেনা — অক্ষর গুনে।
   'ar' / 'bn', আর যে লাইনে বাংলা-আরবি কোনো অক্ষরই নেই (সংখ্যা, চিহ্ন) তার জন্য null */
const AR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const BN_RE = /[\u0980-\u09FF]/g;
function langOf(txt){
  const t = String(txt || '');
  const ar = (t.match(AR_RE) || []).length, bn = (t.match(BN_RE) || []).length;
  if (!ar && !bn) return null;
  return ar >= bn * 2 ? 'ar' : 'bn';
}
const isArabic = t => langOf(t) === 'ar';

/* একটা ঘরের লেখাকে ভাষা অনুযায়ী টুকরো করি।
   ফাঁকা লাইনে নতুন অনুচ্ছেদ; একই অনুচ্ছেদে আয়াত আর অনুবাদ পরপর থাকলে সেগুলোও আলাদা হয়,
   যাতে আয়াত ডানে আর অনুবাদ বাঁয়ে বসে। */
function segments(text){
  const out = [];
  for (const block of String(text || '').split(/\n\s*\n/)){
    let cur = null;
    for (const line of block.split('\n')){
      if (!line.trim()) continue;
      const lg = langOf(line) || (cur && cur.lang) || 'bn';
      if (cur && cur.lang === lg) cur.lines.push(line);
      else { cur = { lang: lg, lines: [line] }; out.push(cur); }
    }
  }
  return out.map(sg => ({ ar: sg.lang === 'ar', text: sg.lines.join('\n') }));
}

/* শ্রেণি ও ভাষা-চিহ্ন */
function blockAttrs(b, ar){
  const cls = [];
  if (b.size && b.size !== 'normal') cls.push('para--' + b.size);
  if (b.align && b.align !== 'auto') cls.push('al-' + b.align);
  if (ar) cls.push('ar');
  return (cls.length ? ` class="${esc(cls.join(' '))}"` : '') + (ar ? ' lang="ar" dir="rtl"' : '');
}
/* টুকরোগুলোকে <p> বানাই */
const parasHTML = (text, b = {}) =>
  segments(text).map(sg => `<p${blockAttrs(b, sg.ar)}>${rich(sg.text)}</p>`).join('');

function bodyHTML(blocks){
  return (blocks || []).map(b => {
    if (b.type === 'heading') return `<h3${blockAttrs(b, isArabic(b.text))}>${esc(b.text)}</h3>`;
    if (b.type === 'quote'){
      const segs = segments(b.text);
      const allAr = segs.length && segs.every(sg => sg.ar);
      return `<blockquote${allAr ? ' class="ar" lang="ar" dir="rtl"' : ''}>${parasHTML(b.text)}${b.source ? `<footer dir="ltr">${esc(b.source)}</footer>` : ''}</blockquote>`;
    }
    if (b.type === 'image')   return `<figure class="art__fig"><img src="${esc(b.src)}" alt="${esc(b.caption || '')}" loading="lazy">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    if (b.type === 'refute')  return `<div class="refute">
        <div class="refute__claim"><span class="refute__lbl">দাবি</span>${parasHTML(b.claim)}</div>
        <div class="refute__answer"><span class="refute__lbl">জবাব</span>${parasHTML(b.answer)}</div>
      </div>`;
    return parasHTML(b.text, b);
  }).join('');
}

function openArticle(id){
  const a = ARTICLES.find(x => x.id === id); if (!a) return;
  const c = catById(a.cat), i = issueOf(a);
  const d = bnDate(a.date);
  const source = i
    ? `${esc(i.label)}${a.page ? ` • পৃষ্ঠা ${bn(a.page)}` : ''} ॥ ${esc(i.greg)}`
    : 'কেবল ওয়েবসাইটে প্রকাশিত';
  const hero = a.thumb ? `<figure class="art__hero"><img src="${esc(a.thumb)}" alt="${esc(a.title)}"></figure>` : '';
  openModal(`
    ${hero}
    ${c.name ? `<p class="art__cat" style="color:${c.color}">${esc(c.name)}</p>` : ''}
    <h2 class="art__h" id="modalTitle">${esc(a.title)}</h2>
    <div class="art__meta">
      <span>${esc(authorName(a))}</span>
      <span>${source}</span>
      ${d ? `<span>${d}</span>` : ''}
      ${a.read ? `<span>পড়তে ${bn(a.read)} মিনিট</span>` : ''}
    </div>
    <div class="art__body">${bodyHTML(a.body)}</div>
    <div class="art__share">
      ${window.AD?.enabled ? `<button class="sbtn sbtn--mark${window.AD.isBookmarked(a.id) ? ' is-on' : ''}" data-bookmark="${a.id}">${bookmarkIcon(a.id)}<span>${window.AD.isBookmarked(a.id) ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}</span></button>` : ''}
      <span>শেয়ার করুন</span>
      <button class="sbtn" data-share="whatsapp" data-id="${a.id}">${shareIcon('whatsapp')} হোয়াটসঅ্যাপ</button>
      <button class="sbtn" data-share="facebook" data-id="${a.id}">${shareIcon('facebook')} ফেসবুক</button>
      <button class="sbtn" data-share="telegram" data-id="${a.id}">${shareIcon('telegram')} টেলিগ্রাম</button>
      <button class="sbtn" data-share="copy" data-id="${a.id}">${shareIcon('copy')} লিংক কপি</button>
    </div>`);
  history.replaceState(null, '', `#/lekha/${a.id}`);
  window.AD?.bumpView?.(a.id);
}

const BOOKMARK_ON  = 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z';
const BOOKMARK_OFF = 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1zm1 2v14.3l5-2.9 5 2.9V5H7z';
function bookmarkIcon(id){
  const on = window.AD?.isBookmarked(id);
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${on ? BOOKMARK_ON : BOOKMARK_OFF}"/></svg>`;
}

/* ---- পিডিএফ প্রিভিউ — প্রচ্ছদ, প্রিভিউ পৃষ্ঠা (থাকলে), সূচিপত্র ---- */
function issuePages(issue){
  const pages = [{ kind:'cover' }];
  (issue.preview || []).forEach(p => {
    const src = typeof p === 'string' ? p : (p && p.img);
    if (src) pages.push({ kind:'img', src });
  });
  if (pages.length === 1 && ARTICLES.some(a => a.issue === issue.id)) pages.push({ kind:'toc' });
  return pages;
}

function pagePlate(issue, page){
  if (page.kind === 'cover') return coverSVG(issue);
  if (page.kind === 'img')
    return `<img src="${esc(page.src)}" alt="পত্রিকার পৃষ্ঠা" style="width:100%;height:100%;object-fit:cover;display:block">`;

  const accent = issue.accent || '#D97706';
  const arts = ARTICLES.filter(a => a.issue === issue.id);
  const rows = arts.slice(0, 9).map((a, k) =>
    `<text x="34" y="${104 + k*29}" fill="#1F2937" font-family="SolaimanLipi, sans-serif" font-size="12.5">${bn(k+1)}. ${esc(a.title.slice(0, 42))}…</text>`).join('');
  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="সূচিপত্র">
    <rect width="300" height="400" fill="#F8FAF8"/>
    <rect x="0" y="0" width="300" height="6" fill="${accent}"/>
    <text x="34" y="62" fill="#064E3B" font-family="SolaimanLipi, sans-serif" font-size="24" font-weight="700">সূচিপত্র</text>
    <line x1="34" y1="76" x2="266" y2="76" stroke="#DFE8E2"/>
    ${rows}
  </svg>`;
}

function openPdf(issueId){
  const issue = issueById(issueId);
  const pages = issuePages(issue);
  let page = 0; const total = pages.length;
  const sample = issue.pdf
    ? `<a class="btn btn--ghost" href="${esc(issue.pdf)}" download>
         <svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/></svg>
         শর্ট পিডিএফ নামান</a>`
    : '';

  let dl;
  if (isPaid(issue)){
    const st = (window.AD?.enabled && AD.user) ? AD.issueStatus(issue.id) : null;
    if (st === 'approved'){
      dl = `<div class="pdfv__acts">
              ${sample}
              <button class="btn btn--gold btn--lg" data-download="${issue.id}">
                <svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/></svg>
                সম্পূর্ণ পিডিএফ নামান</button>
            </div>`;
    } else if (st === 'pending'){
      dl = `<div class="pdfv__acts">${sample}</div>
            <p class="pdfv__note">আপনার অর্ডারটি যাচাই করা হচ্ছে। অনুমোদনের পর এখানেই সম্পূর্ণ পিডিএফ নামানোর বোতাম আসবে।</p>`;
    } else {
      dl = `<div class="pdfv__acts">
              ${sample}
              <button class="btn btn--gold btn--lg" data-buy="${issue.id}">সম্পূর্ণ পিডিএফ কিনুন — ৳${bn(issue.pdf_price)}</button>
            </div>
            <p class="pdfv__note">${issue.pdf ? 'শর্ট পিডিএফে শুরুর কয়েক পৃষ্ঠা রয়েছে। ' : ''}সম্পূর্ণ সংখ্যাটি কিনে নিলে আপনার অ্যাকাউন্টে স্থায়ীভাবে যুক্ত হয়ে যাবে — যতবার খুশি নামাতে পারবেন।</p>`;
    }
  } else {
    dl = issue.pdf
      ? `<a class="btn btn--gold btn--lg" href="${esc(issue.pdf)}" download style="justify-self:center">
           <svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/></svg>
           সম্পূর্ণ পিডিএফ নামান</a>`
      : `<p class="pdfv__note">এই সংখ্যার পিডিএফ এখনও যুক্ত করা হয়নি।</p>`;
  }

  openModal(`
    <h2 class="art__h" id="modalTitle">${esc(issue.label)} — পিডিএফ</h2>
    <p class="art__meta">${esc(issue.hijri)} ॥ ${esc(issue.greg)}${issue.pages ? ` • ${bn(issue.pages)} পৃষ্ঠা` : ''}</p>
    <div class="pdfv">
      <div class="pdfv__stage"><div class="cover" id="pdfPlate"></div></div>
      ${total > 1 ? `<div class="pdfv__nav">
        <button id="pdfPrev" aria-label="আগের পৃষ্ঠা"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="pdfv__page" id="pdfPage"></span>
        <button id="pdfNext" aria-label="পরের পৃষ্ঠা"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>` : ''}
      ${dl}
    </div>`);

  const draw = () => {
    $('#pdfPlate').innerHTML = pagePlate(issue, pages[page]);
    if (total > 1){
      $('#pdfPage').textContent = `পৃষ্ঠা ${bn(page + 1)} / ${bn(total)}`;
      $('#pdfPrev').disabled = page === 0;
      $('#pdfNext').disabled = page === total - 1;
    }
  };
  if (total > 1){
    $('#pdfPrev').onclick = () => { if (page > 0){ page--; draw(); } };
    $('#pdfNext').onclick = () => { if (page < total - 1){ page++; draw(); } };
  }
  draw();
}

/* ---- অর্ডার ফর্ম (সাধারণ ও প্রি-অর্ডার) ---- */
function openOrder(issue){
  const pre = !!issue;
  const s = SITE.price_single ?? 120;
  const hint = PAYMENTS.map(p => `<strong>${esc(p.title)} ${esc(p.number)}</strong>`).join(' ॥ ');

  openModal(`
    <h2 class="art__h" id="modalTitle">${pre ? 'প্রি-অর্ডার' : 'ছাপা কপির অর্ডার'}</h2>
    <p class="art__meta">${pre ? esc(issue.label) + ' ॥ ' + esc(issue.greg) : 'বর্তমান সংখ্যা'} • ৳${bn(s)} • কুরিয়ার খরচ অন্তর্ভুক্ত</p>
    <form class="ordform" id="orderForm" name="order" method="POST" data-netlify="true">
      <input type="hidden" name="form-name" value="order">
      <input type="hidden" name="dhoron" value="${pre ? 'প্রি-অর্ডার' : 'সাধারণ অর্ডার'}">
      <input type="hidden" name="songkha" value="${pre ? esc(issue.label) : 'বর্তমান সংখ্যা'}">
      <div class="row">
        <label class="fld"><span>নাম</span><input name="nam" required placeholder="পূর্ণ নাম"></label>
        <label class="fld"><span>মোবাইল</span><input name="mobile" required inputmode="tel" placeholder="01XXXXXXXXX"></label>
      </div>
      <label class="fld"><span>ঠিকানা</span><textarea name="thikana" rows="3" required placeholder="গ্রাম/বাসা, ডাকঘর, থানা, জেলা"></textarea></label>
      <div class="row">
        <label class="fld"><span>কত কপি</span>
          <input name="copies" type="number" min="1" max="100" value="1" required>
        </label>
        <label class="fld"><span>পেমেন্ট মাধ্যম</span>
          <select name="payment">${PAYMENTS.map(p => `<option>${esc(p.title)}</option>`).join('')}<option>ক্যাশ অন ডেলিভারি</option></select>
        </label>
      </div>
      <label class="fld"><span>ট্রানজেকশন আইডি <em>(পেমেন্ট করে থাকলে)</em></span><input name="trxid" placeholder="যেমন: 9F2K7QX1"></label>
      <div class="payhint">সেন্ড মানি করুন — ${hint}। টাকা পাঠানোর পর ট্রানজেকশন আইডি লিখে অর্ডারটি নিশ্চিত করুন।</div>
      <button class="btn btn--green btn--lg" type="submit">${pre ? 'প্রি-অর্ডার নিশ্চিত করুন' : 'অর্ডার নিশ্চিত করুন'}</button>
      <p class="form__note" id="orderFormNote" role="status"></p>
    </form>`);
  wireForm($('#orderForm'), $('#orderFormNote'),
    'অর্ডার পেয়েছি। এক কর্মদিবসের মধ্যে ফোনে নিশ্চিত করা হবে, ইনশাআল্লাহ।');
}


/* =========================================================================
   অ্যাকাউন্ট — লগইন, নিবন্ধন, সংরক্ষিত লেখা, নিজের প্রশ্ন
   ========================================================================= */
function authForms(mode, pre = {}){
  const login = mode !== 'signup';
  return `
    <h2 class="art__h" id="modalTitle">${login ? 'লগইন করুন' : 'নতুন অ্যাকাউন্ট'}</h2>
    <p class="art__meta">লগইন করলে পছন্দের লেখা সংরক্ষণ করতে পারবেন, আর নিজের পাঠানো প্রশ্নের জবাব এক জায়গায় দেখতে পাবেন।</p>
    <form class="ordform" id="authForm">
      ${login ? '' : `<label class="fld"><span>আপনার নাম</span><input name="name" required placeholder="পূর্ণ নাম"></label>`}
      <label class="fld"><span>ইমেইল</span><input name="email" type="email" required placeholder="you@example.com" value="${esc(pre.email || '')}"></label>
      ${login ? '' : `<label class="fld"><span>মোবাইল নাম্বার <em>(না দিলেও চলবে)</em></span><input name="phone" type="tel" inputmode="tel" placeholder="01XXXXXXXXX" pattern="[0-9+\\-\\s]{6,20}"></label>`}
      <label class="fld"><span>পাসওয়ার্ড</span><input name="password" type="password" required minlength="6" placeholder="অন্তত ৬ অক্ষর"></label>
      <button class="btn btn--green btn--lg" type="submit">${login ? 'লগইন' : 'নিবন্ধন করুন'}</button>
      <p class="form__note" id="authNote" role="status"></p>
    </form>
    <div class="authswitch">
      ${login
        ? `<button data-auth="signup" data-email="${esc(pre.email || '')}">অ্যাকাউন্ট নেই? নিবন্ধন করুন</button>
           <button data-auth="reset">পাসওয়ার্ড ভুলে গেছেন?</button>`
        : `<button data-auth="login">অ্যাকাউন্ট আছে? লগইন করুন</button>`}
    </div>`;
}

function openAuth(mode, pre = {}){
  openModal(authForms(mode, pre));
  const form = $('#authForm'), note = $('#authNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    note.style.color = '';
    note.textContent = 'অপেক্ষা করুন…';
    try{
      if (mode === 'signup'){
        const res = await AD.signUp(f.email, f.password, f.name, (f.phone || '').trim());
        if (res?.session){                    // ইমেইল যাচাই বন্ধ থাকলে সঙ্গে সঙ্গেই লগইন
          closeModal();
          toast('স্বাগতম, ' + (f.name || ''));
        } else {
          note.textContent = 'নিবন্ধন হয়েছে। ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্টটি নিশ্চিত করুন।';
        }
      } else {
        await AD.signIn(f.email, f.password);
        closeModal();
        toast('স্বাগতম, ' + AD.userName());
      }
    }catch(err){
      note.style.color = 'var(--accent)';
      if (mode !== 'signup' && /Invalid login/i.test(String(err?.message || ''))){
        const exists = await AD.accountExists(f.email);
        if (exists === false){
          note.innerHTML = 'আপনার কোনো অ্যাকাউন্ট খোলা নেই। আগে সাইন আপ করে অ্যাকাউন্ট খুলে নিন। '
            + `<button class="linkbtn" data-auth="signup" data-email="${esc(f.email)}">নিবন্ধন করুন</button>`;
          return;
        }
        if (exists === true){ note.textContent = 'পাসওয়ার্ড মিলছে না। আবার চেষ্টা করুন।'; return; }
      }
      note.textContent = authError(err);
    }
  });
}

function authError(err){
  const m = String(err?.message || '');
  if (/Invalid login/i.test(m))      return 'ইমেইল বা পাসওয়ার্ড মিলছে না। অ্যাকাউন্ট না খুলে থাকলে আগে নিবন্ধন করে নিন।';
  if (/already registered/i.test(m)) return 'এই ইমেইলে অ্যাকাউন্ট আছে। লগইন করে দেখুন।';
  if (/Email not confirmed/i.test(m))return 'ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্টটি নিশ্চিত করুন।';
  if (/at least 6/i.test(m))         return 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।';
  if (/rate limit/i.test(m))         return 'কিছুক্ষণ পর আবার চেষ্টা করুন।';
  return 'সমস্যা হয়েছে: ' + m;
}

async function openAccount(){
  openModal(`
    <h2 class="art__h" id="modalTitle">${esc(AD.userName())}</h2>
    <p class="art__meta">${esc(AD.user?.email || '')}${AD.userPhone() ? ' • ' + esc(AD.userPhone()) : ''}</p>
    <div class="acct">
      <h3 class="acct__h">সংরক্ষিত লেখা</h3>
      <div id="acctMarks"><p class="acct__empty">লোড হচ্ছে…</p></div>
      <h3 class="acct__h">কেনা সংখ্যা</h3>
      <div id="acctBuys"></div>

      <h3 class="acct__h">আপনার প্রশ্ন</h3>
      <div id="acctQs"><p class="acct__empty">লোড হচ্ছে…</p></div>

      <div id="acctAdmin"></div>
      <button class="btn btn--line" id="signOutBtn">লগআউট</button>
    </div>`);

  $('#signOutBtn').onclick = async () => { await AD.signOut(); closeModal(); toast('লগআউট হয়েছে'); };

  const marks = [...AD.bookmarks].map(id => ARTICLES.find(a => a.id === id)).filter(Boolean);
  $('#acctMarks').innerHTML = marks.length
    ? marks.map(a => `<button class="acctitem" data-open="${a.id}">
        <b>${esc(a.title)}</b><span>${[catById(a.cat).name, authorName(a)].filter(Boolean).map(esc).join(' • ')}</span></button>`).join('')
    : '<p class="acct__empty">এখনও কোনো লেখা সংরক্ষণ করেননি। যেকোনো লেখা খুলে “সংরক্ষণ করুন” চাপলেই এখানে জমা হবে।</p>';

  renderMyBuys();
  if (AD.isAdmin) renderAdminBox();

  try{
    const qs = await AD.myQuestions();
    $('#acctQs').innerHTML = qs.length
      ? qs.map(q => `<div class="qaitem">
          <p class="q">${esc(q.body)}</p>
          <p class="a">${q.answered && q.answer ? esc(q.answer) : 'জবাব প্রস্তুত হচ্ছে।'}</p>
          <p class="acct__date">${bnDate(q.created_at)}</p>
        </div>`).join('')
      : '<p class="acct__empty">এখনও কোনো প্রশ্ন পাঠাননি।</p>';
  }catch(e){
    $('#acctQs').innerHTML = '<p class="acct__empty">প্রশ্নগুলো আনা গেল না।</p>';
  }
}

function renderMyBuys(){
  const box = $('#acctBuys'); if (!box) return;
  const rows = AD.purchases || [];
  if (!rows.length){
    box.innerHTML = '<p class="acct__empty">এখনও কোনো সংখ্যার পিডিএফ কেনেননি। “সকল সংখ্যা” অংশ থেকে কিনতে পারবেন।</p>';
    return;
  }
  const label = { pending:'যাচাই চলছে', approved:'অনুমোদিত', rejected:'বাতিল' };
  box.innerHTML = rows.map(p => `
    <div class="buyrow">
      <div>
        <b>${esc(p.issue_label || p.issue_id)}</b>
        <span>৳${bn(p.amount || 0)} • ${esc(p.method || '')} • ${esc(p.trxid || '')}</span>
        ${p.note ? `<span class="buyrow__note">${esc(p.note)}</span>` : ''}
      </div>
      <div class="buyrow__end">
        <span class="pill pill--${p.status}">${label[p.status]}</span>
        ${p.status === 'approved' ? `<button class="btn btn--green" data-download="${p.issue_id}">নামান</button>` : ''}
      </div>
    </div>`).join('');
}

async function renderAdminBox(){
  const box = $('#acctAdmin'); if (!box) return;
  box.innerHTML = '<h3 class="acct__h">অপেক্ষমাণ অর্ডার</h3><p class="acct__empty">লোড হচ্ছে…</p>';
  try{
    const rows = await AD.allPurchases('pending');
    box.innerHTML = `<h3 class="acct__h">অপেক্ষমাণ অর্ডার${rows.length ? ` (${bn(rows.length)})` : ''}</h3>` + (
      rows.length
        ? rows.map(p => `
          <div class="buyrow buyrow--admin" data-row="${p.id}">
            <div>
              <b>${esc(p.issue_label || p.issue_id)}</b>
              <span>৳${bn(p.amount || 0)} • ${esc(p.method || '')}</span>
              <span class="buyrow__trx">${esc(p.trxid || '')}</span>
              <span class="buyrow__note">${bnDate(p.created_at)}</span>
            </div>
            <div class="buyrow__end">
              <button class="btn btn--green" data-approve="${p.id}">অনুমোদন</button>
              <button class="btn btn--line" data-reject="${p.id}">বাতিল</button>
            </div>
          </div>`).join('')
        : '<p class="acct__empty">অপেক্ষমাণ কোনো অর্ডার নেই।</p>');
  }catch(err){
    console.error(err);
    box.innerHTML = '<h3 class="acct__h">অপেক্ষমাণ অর্ডার</h3><p class="acct__empty">তালিকাটি আনা গেল না।</p>';
  }
}

function renderAccountUI(){
  const btn = $('#accountBtn');
  if (!window.AD?.enabled){ btn.hidden = true; return; }
  btn.hidden = false;
  btn.querySelector('.iconbtn__dot').hidden = !AD.user;
  btn.setAttribute('aria-label', AD.user ? 'আমার অ্যাকাউন্ট' : 'লগইন করুন');
  btn.onclick = () => AD.user ? openAccount() : openAuth('login');
}

function renderVisitStats(){
  const el = $('#visitStats');
  if (!window.AD?.enabled || !AD.visits.total){ el.hidden = true; return; }
  const bits = [`আজ ${bn(AD.visits.today)} জন পড়েছেন`];
  if (AD.visits.online > 0) bits.push(`এখন অনলাইনে ${bn(AD.visits.online)} জন`);
  bits.push(`মোট ${bn(AD.visits.total)}`);
  el.textContent = bits.join(' • ');
  el.hidden = false;
}

/* =========================================================================
   বাণী পপআপ
   ========================================================================= */
let quoteShown = false;
function showQuote(){
  if (quoteShown) return;
  if (!QUOTES.enabled || !(QUOTES.quotes || []).length) return;
  if (location.hash.startsWith('#/lekha/')) return;   // সরাসরি লেখার লিংকে এলে দেখাব না
  const q = QUOTES.quotes[Math.floor(Math.random() * QUOTES.quotes.length)];
  // আরবি-বাংলা মিশ্র হলে প্রতিটি অংশ নিজের দিকে বসবে
  $('#qpopText').innerHTML = segments(q.text)
    .map(sg => `<span class="qpop__seg"${sg.ar ? ' lang="ar" dir="rtl"' : ''}>${esc(sg.text).replace(/\n/g,'<br>')}</span>`).join('');
  $('#qpopSrc').textContent = q.source || '';
  // বন্ধ করার বোতামে একেকবার একেক যিকির
  const ZIKR = ['আলহামদুলিল্লাহ', 'আল্লাহু আকবার', 'সুবহানাল্লাহ'];
  $('#qpopOk').textContent = ZIKR[Math.floor(Math.random() * ZIKR.length)];
  $('#quotePop').hidden = false;
  quoteShown = true;
  $('#quotePop').querySelector('.qpop__x').focus();
}
function closeQuote(){ $('#quotePop').hidden = true; }

/* =========================================================================
   ফর্ম (Netlify Forms)
   ========================================================================= */
function wireForm(form, note, okMsg){
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    note.textContent = 'পাঠানো হচ্ছে…';
    const hasFile = !!form.querySelector('input[type="file"]');
    const opts = hasFile
      ? { method:'POST', body: new FormData(form) }
      : { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString() };
    fetch('/', opts)
      .then(() => { form.reset(); note.textContent = okMsg; toast(okMsg); })
      .catch(() => { note.textContent = okMsg; toast(okMsg); });
  });
}

/* =========================================================================
   অনুসন্ধান
   ========================================================================= */
const PAGES = [
  { t:'আমাদের সম্পর্কে', s:'সম্পাদনা পরিষদ ও নীতিমালা', h:'#about' },
  { t:'সকল সংখ্যা', s:'আর্কাইভ', h:'#archive' },
  { t:'ইনফোগ্রাফিক্স', s:'দাওয়াহ কার্ড ও ইনফোগ্রাফিক', h:'#infographics' },
  { t:'অডিও ও ভিডিও', s:'আলোচনা ও পাঠচক্র', h:'#audiovideo' },
  { t:'আপনার জিজ্ঞাসা', s:'প্রশ্ন পাঠান', h:'#qa' },
  { t:'লেখা পাঠান', s:'আমাদের জন্য লিখুন', h:'#submit' },
  { t:'পাঠকের অনুভূতি', s:'যাঁরা পড়েছেন তাঁদের কথা', h:'#feedback' },
  { t:'এজেন্ট ও মাকতাবা', s:'যেখানে পত্রিকা পাওয়া যায়', h:'#outlets' },
  { t:'দাওয়াতি ফান্ড', s:'বিকাশ / নগদ / রকেট', h:'#donate' }
];

function renderSearch(q){
  const box = $('#searchResults');
  if (!q.trim()){ box.hidden = true; box.innerHTML = ''; return; }
  const k = q.toLowerCase();
  const arts = ARTICLES.filter(a =>
    [a.title, excerptOf(a), authorName(a), catById(a.cat).name].join(' ').toLowerCase().includes(k)
  ).slice(0, 6);
  const outs = OUTLETS.filter(o =>
    [o.name, o.address, o.district, o.division].join(' ').toLowerCase().includes(k)).slice(0, 3);
  const pages = PAGES.filter(p => (p.t + p.s).toLowerCase().includes(k)).slice(0, 3);

  const html =
    arts.map(a => `<button class="sres" data-open="${a.id}"><b>${esc(a.title)}</b><span>${[catById(a.cat).name, authorName(a)].filter(Boolean).map(esc).join(' • ')}</span></button>`).join('') +
    outs.map(o => `<a class="sres" href="#outlets" data-goto><b>${esc(o.name)}</b><span>${esc(o.kind || '')} • ${esc(o.address)}</span></a>`).join('') +
    pages.map(p => `<a class="sres" href="${p.h}" data-goto><b>${p.t}</b><span>${p.s}</span></a>`).join('');

  box.innerHTML = html || `<p class="sres--none">“${esc(q)}” লিখে কিছু পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন।</p>`;
  box.hidden = false;
}

/* =========================================================================
   থিম
   ========================================================================= */
function setTheme(t){
  document.documentElement.dataset.theme = t;
  $('#themeToggle').setAttribute('aria-label', t === 'dark' ? 'দিনের মোড চালু করুন' : 'রাতের মোড চালু করুন');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0A1512' : '#0F5132');
}

/* =========================================================================
   সূচনা
   ========================================================================= */
function renderAll(){
  applySite();
  renderAbout();
  renderHero();
  renderPreorder();
  renderFilters();
  renderArticles();
  renderAds();
  renderCats();
  renderNavIssues();
  renderIssues();
  renderAuthors();
  renderMediaEtc();
  renderFeedback();
  renderOutletFilters();
  renderOutlets();
  $$('.bn-num').forEach(el => { el.textContent = bn(el.textContent); });
}


/* =========================================================================
   পাঠকের ফন্ট বাছাই — পছন্দটি ব্রাউজারে মনে থাকে
   ========================================================================= */
const FONTS_BN = [
  { id:'SolaimanLipi',       name:'সুলাইমান লিপি',   note:'সাইটের নিজস্ব' },
  { id:'Noto Serif Bengali', name:'নোটো সেরিফ বাংলা', note:'বইয়ের মতো' },
  { id:'Tiro Bangla',        name:'তিরো বাংলা',       note:'ছাপার ধাঁচে' },
  { id:'Hind Siliguri',      name:'হিন্দ শিলিগুড়ি',   note:'পরিচ্ছন্ন, আধুনিক' },
];
const FONTS_AR = [
  { id:'Amiri',              name:'আমিরি',            note:'সাইটের নিজস্ব' },
  { id:'Scheherazade New',   name:'শাহরাজাদ',         note:'বড় ও স্পষ্ট হরকত' },
  { id:'Noto Naskh Arabic',  name:'নোটো নাসখ',        note:'সরল নাসখ' },
];
const SAMPLE_BN = 'আদ দাওয়াহ';
const SAMPLE_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

const store = {
  get: k => { try { return localStorage.getItem(k); } catch(e){ return null; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch(e){} },
};

function applyFonts(){
  const r = document.documentElement.style;
  const bn = store.get('ad-font-bn'), ar = store.get('ad-font-ar');
  bn ? r.setProperty('--font-bn', `'${bn}'`) : r.removeProperty('--font-bn');
  ar ? r.setProperty('--font-ar', `'${ar}'`) : r.removeProperty('--font-ar');
}

function renderFontPanel(){
  const curBn = store.get('ad-font-bn') || FONTS_BN[0].id;
  const curAr = store.get('ad-font-ar') || FONTS_AR[0].id;
  const opt = (f, cur, kind, sample, rtl) => `
    <button class="fopt${f.id === cur ? ' is-on' : ''}" data-font-${kind}="${esc(f.id)}" aria-pressed="${f.id === cur}">
      <span class="fopt__sample" style="font-family:'${esc(f.id)}'"${rtl ? ' dir="rtl" lang="ar"' : ''}>${sample}</span>
      <span class="fopt__name">${esc(f.name)}<small>${esc(f.note)}</small></span>
    </button>`;
  $('#fontBnOpts').innerHTML = FONTS_BN.map(f => opt(f, curBn, 'bn', SAMPLE_BN, false)).join('');
  $('#fontArOpts').innerHTML = FONTS_AR.map(f => opt(f, curAr, 'ar', SAMPLE_AR, true)).join('');
}

function toggleFontPanel(open){
  const panel = $('#fontPanel'), btn = $('#fontToggle');
  const show = open ?? panel.hidden;
  if (show) renderFontPanel();
  panel.hidden = !show;
  btn.setAttribute('aria-expanded', show);
}

function wireUI(){
  setTheme('light');   // ডিফল্ট দিনের মোড; পাঠক চাইলে বোতামে বদলাবেন
  applyFonts();
  $('#fontToggle').onclick = e => { e.stopPropagation(); toggleFontPanel(); };
  $('#fontPanel').addEventListener('click', e => {
    e.stopPropagation();
    const bn = e.target.closest('[data-font-bn]'), ar = e.target.closest('[data-font-ar]');
    if (bn){ store.set('ad-font-bn', bn.dataset.fontBn === FONTS_BN[0].id ? '' : bn.dataset.fontBn); applyFonts(); renderFontPanel(); }
    if (ar){ store.set('ad-font-ar', ar.dataset.fontAr === FONTS_AR[0].id ? '' : ar.dataset.fontAr); applyFonts(); renderFontPanel(); }
    if (e.target.closest('[data-fontreset]')){ store.set('ad-font-bn',''); store.set('ad-font-ar',''); applyFonts(); renderFontPanel(); }
    if (e.target.closest('[data-fontclose]')) toggleFontPanel(false);
  });
  document.addEventListener('click', () => { if (!$('#fontPanel').hidden) toggleFontPanel(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fontPanel').hidden) toggleFontPanel(false); });

  $('#themeToggle').onclick = () =>
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  const nav = $('#mainNav'), navBtn = $('#navToggle');
  navBtn.onclick = () => navBtn.setAttribute('aria-expanded', nav.classList.toggle('is-open'));

  const subs = $$('.nav__subtoggle').map(btn => ({ btn, menu: $('#' + btn.dataset.sub) }));
  const closeSubs = except => subs.forEach(({ btn, menu }) => {
    if (menu === except) return;
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', false);
  });
  subs.forEach(({ btn, menu }) => {
    btn.onclick = e => {
      e.stopPropagation();
      closeSubs(menu);
      btn.setAttribute('aria-expanded', menu.classList.toggle('is-open'));
    };
    if (matchMedia('(min-width: 761px)').matches){
      const li = btn.closest('.nav__has-sub');
      let timer = null;
      const open  = () => { clearTimeout(timer); closeSubs(menu); menu.classList.add('is-open'); btn.setAttribute('aria-expanded', true); };
      const close = () => { menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', false); };
      // মাউস সরে গেলেই বন্ধ না করে একটু সময় দিই — নিচের অপশনে যেতে যেন সুবিধা হয়
      li.addEventListener('mouseenter', open);
      li.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(close, 600); });
      menu.addEventListener('mouseenter', () => clearTimeout(timer));
      li.addEventListener('focusin', open);
      li.addEventListener('focusout', () => { clearTimeout(timer); timer = setTimeout(() => { if (!li.contains(document.activeElement)) close(); }, 600); });
    }
  });
  document.addEventListener('click', () => closeSubs());

  const sbar = $('#searchbar'), sinput = $('#searchInput');
  $('#searchToggle').onclick = () => {
    sbar.hidden = !sbar.hidden;
    $('#searchToggle').setAttribute('aria-expanded', !sbar.hidden);
    if (!sbar.hidden) sinput.focus();
  };
  $('#searchClose').onclick = () => { sbar.hidden = true; sinput.value = ''; renderSearch(''); state.q = ''; renderArticles(); };
  sinput.addEventListener('input', e => { state.q = e.target.value; renderSearch(e.target.value); renderArticles(); });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-authors-all]')){
      authorsExpanded = true;
      renderAuthors();
      closeSubs();
      document.getElementById('authors')?.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    if (e.target.closest('[data-authors-toggle]')){
      authorsExpanded = !authorsExpanded;
      renderAuthors();
      if (!authorsExpanded) document.getElementById('authors')?.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    const af = e.target.closest('[data-authfilter]');
    if (af){
      closeSubs();
      state.author = af.dataset.authfilter;
      const sel = $('#authorFilter'); if (sel) sel.value = state.author;
      renderArticles();
      document.getElementById('articles')?.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    if (e.target.closest('[data-qclose]')){ closeQuote(); return; }

    const share = e.target.closest('[data-share]');
    if (share){ e.stopPropagation(); doShare(share.dataset.share, ARTICLES.find(a => a.id === share.dataset.id)); return; }

    const demoEl = e.target.closest('[data-demo]');
    if (demoEl){ toast(DEMO_MSG); return; }

    const ishare = e.target.closest('[data-infoshare]');
    if (ishare){
      const g = (ishare.dataset.list === 'graph' ? INFOGRAPHS : INFOGRAPHICS)[+ishare.dataset.i];
      const url = location.origin + location.pathname +
        (g.article && ARTICLES.some(a => a.id === g.article) ? `#/lekha/${g.article}` : '#infographics');
      if (ishare.dataset.infoshare === 'copy'){
        navigator.clipboard?.writeText(`${g.title}${g.sub ? ' — ' + g.sub : ''}\n${url}`).then(() => toast('কার্ডের লেখা কপি হয়েছে'));
      } else {
        window.open(shareURL(ishare.dataset.infoshare, url, g.title), '_blank', 'noopener,width=680,height=620');
      }
      return;
    }

    const open = e.target.closest('[data-open]');
    if (open){ openArticle(open.dataset.open); sbar.hidden = true; return; }

    const jump = e.target.closest('[data-jumpcat]');
    if (jump){
      state.cat = jump.dataset.jumpcat;
      $$('#catChips .chip').forEach(c => c.classList.toggle('is-on', c.dataset.cat === state.cat));
      renderArticles();
      $('#articles').scrollIntoView({ behavior:'smooth' });
      nav.classList.remove('is-open');
      return;
    }

    const ir = e.target.closest('[data-issueread]');
    if (ir){
      state.issue = ir.dataset.issueread;
      $('#issueFilter').value = state.issue;
      renderArticles();
      $('#articles').scrollIntoView({ behavior:'smooth' });
      nav.classList.remove('is-open'); sbar.hidden = true;   // মোবাইল মেনু বন্ধ
      return;
    }
    // মেনুর "সকল সংখ্যা" থেকে সরাসরি সেই সংখ্যার পিডিএফ অংশ
    const np = e.target.closest('[data-navpdf]');
    if (np){
      e.preventDefault();
      nav.classList.remove('is-open'); sbar.hidden = true;
      openPdf(np.dataset.navpdf);
      return;
    }
    const ip = e.target.closest('[data-issuepdf]');
    if (ip){ openPdf(ip.dataset.issuepdf); return; }

    const po = e.target.closest('[data-preorder]');
    if (po){ openOrder(issueById(po.dataset.preorder)); return; }

    const cp = e.target.closest('[data-copy]');
    if (cp){ navigator.clipboard?.writeText(cp.dataset.copy).then(() => toast('নম্বর কপি হয়েছে')); return; }

    const buy = e.target.closest('[data-buy]');
    if (buy){ openBuy(buy.dataset.buy); return; }

    const dl = e.target.closest('[data-download]');
    if (dl){ downloadIssue(dl.dataset.download); return; }

    const ap = e.target.closest('[data-approve]');
    if (ap){
      ap.disabled = true;
      AD.decide(ap.dataset.approve, 'approved')
        .then(() => { toast('অনুমোদন হয়েছে'); renderAdminBox(); })
        .catch(() => { ap.disabled = false; toast('অনুমোদন করা গেল না'); });
      return;
    }

    const rj = e.target.closest('[data-reject]');
    if (rj){
      const why = prompt('বাতিলের কারণ (ক্রেতা দেখতে পাবেন):', 'ট্রানজেকশন আইডি মেলেনি');
      if (why === null) return;
      rj.disabled = true;
      AD.decide(rj.dataset.reject, 'rejected', why)
        .then(() => { toast('বাতিল করা হয়েছে'); renderAdminBox(); })
        .catch(() => { rj.disabled = false; toast('বাতিল করা গেল না'); });
      return;
    }

    const bm = e.target.closest('[data-bookmark]');
    if (bm){
      if (!AD.user){ openAuth('login'); return; }
      const id = bm.dataset.bookmark;
      AD.toggleBookmark(id).then(on => {
        bm.innerHTML = bookmarkIcon(id) + `<span>${on ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}</span>`;
        bm.classList.toggle('is-on', on);
        toast(on ? 'সংরক্ষণ করা হয়েছে' : 'সংরক্ষণ বাতিল হয়েছে');
      }).catch(() => toast('সংরক্ষণ করা গেল না'));
      return;
    }

    const sw = e.target.closest('[data-auth]');
    if (sw){
      const m = sw.dataset.auth;
      if (m === 'reset'){
        const email = prompt('যে ইমেইলে অ্যাকাউন্ট খুলেছেন সেটি লিখুন:');
        if (email) AD.resetPassword(email)
          .then(() => toast('ইমেইলে পাসওয়ার্ড বদলানোর লিংক পাঠানো হয়েছে'))
          .catch(() => toast('লিংক পাঠানো গেল না'));
      } else openAuth(m, { email: sw.dataset.email || '' });
      return;
    }

    if (e.target.closest('[data-close]')) closeModal();

    if (e.target.closest('.nav__link[href^="#"], .nav__sub a, .foot__links a, [data-goto]')){
      nav.classList.remove('is-open'); sbar.hidden = true;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){
      if (!$('#quotePop').hidden) closeQuote();
      else if (!$('#modal').hidden) closeModal();
      else if (!sbar.hidden) sbar.hidden = true;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.info--demo')){
      e.preventDefault(); toast(DEMO_MSG);
    } else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card, .info--linked')){
      e.preventDefault(); openArticle(e.target.dataset.open);
    }
  });

  $('#orderOpen').onclick = () => openOrder(null);
  const qaForm = $('#qaForm');
  qaForm?.addEventListener('submit', () => {
    if (!window.AD?.enabled) return;
    const f = Object.fromEntries(new FormData(qaForm));
    AD.submitQuestion({ name:f.nam, email:f.email, topic:f.bishoy, body:f.proshno })
      .catch(err => console.error('প্রশ্ন সংরক্ষণ ব্যর্থ:', err));
  });
  wireForm(qaForm, $('#qaNote'), 'প্রশ্নটি পৌঁছেছে। জবাব প্রস্তুত হলে ইমেইলে জানানো হবে, ইনশাআল্লাহ।');
  wireForm($('#subForm'),   $('#subNote'),   'যুক্ত হয়েছেন। নতুন সংখ্যার খবর ইমেইলে পাবেন।');
  wireForm($('#onuvutiForm'), $('#onuvutiNote'), 'আপনার কথা পৌঁছে গেছে। জাযাকাল্লাহু খাইরান।');
  wireForm($('#lekhaForm'), $('#lekhaNote'), 'লেখাটি পৌঁছেছে। সম্পাদনা পরিষদ যাচাই করে ইমেইলে জানাবে, ইনশাআল্লাহ।');

  const toTop = $('#toTop'), head = $('#head');

  // মেনুর কোন আইটেম পাতার কোন অংশের সঙ্গে যুক্ত
  // (লিংকের href থেকে, ড্রপডাউন বোতামের ক্ষেত্রে data-spy থেকে)
  const navItems = $$('.nav__link').map(l => {
    const h = l.getAttribute('href') || '';
    return { l, id: h.startsWith('#') ? h.slice(1) : (l.dataset.spy || '') };
  }).filter(x => x.id);
  // যেসব অংশের নিজস্ব মেনু নেই, সেগুলো কোন মেনুর অধীনে পড়বে
  const SPY_ALIAS = { articles: 'home', preorder: 'home' };

  const onScroll = () => {
    toTop.hidden = scrollY < 600;
    head.classList.toggle('is-stuck', scrollY > 10);

    const y = scrollY + (head.offsetHeight || 120) + 40;
    // পাতার সব দৃশ্যমান অংশ, ওপর থেকে নিচে
    const spots = $$('#main > section[id], #main > footer[id]')
      .filter(el => el.getClientRects().length)
      .map(el => ({ id: el.id, top: el.getBoundingClientRect().top + scrollY }))
      .sort((a, b) => a.top - b.top);

    let cur = 'home';
    spots.forEach(s => { if (s.top <= y) cur = s.id; });

    // পাতার একদম নিচে পৌঁছালে শেষ অংশটিই সক্রিয়
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4 && spots.length)
      cur = spots[spots.length - 1].id;

    cur = SPY_ALIAS[cur] || cur;
    navItems.forEach(({ l, id }) => l.classList.toggle('is-active', id === cur));
  };
  addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  toTop.onclick = () => scrollTo({ top:0, behavior:'smooth' });
}

let started = false;
async function init(){
  if (started) return;          // দুবার চালু হওয়া ঠেকাতে
  started = true;
  renderDates();
  wireUI();
  try{
    await loadContent();
    renderAll();
    if (window.AD){
      await AD.ready;
      AD.onChange(() => { renderAccountUI(); renderVisitStats(); renderArticles(); });
    }

    const m = location.hash.match(/^#\/lekha\/(.+)$/);
    if (m) openArticle(m[1]);
    else setTimeout(showQuote, 700);
  }catch(err){
    console.error(err);
    loadFailed(err);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

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
let INFOGRAPHICS = [], MEDIA = [], QA_RECENT = [], SITE = {}, PAYMENTS = [];
let ABOUT = {}, QUOTES = {}, ADS = [], OUTLETS = [], OUTLET_INTRO = '';

const catById    = id => CATS.find(c => c.id === id)    || CATS[0]    || { name:'', color:'#0F5132' };
const issueById  = id => ISSUES.find(i => i.id === id)  || ISSUES[0]  || { label:'', greg:'', hijri:'' };
const authorById = id => AUTHORS.find(a => a.id === id) || AUTHORS[0] || { name:'' };

/* =========================================================================
   কনটেন্ট লোড
   ========================================================================= */
const REQUIRED = ['site','categories','authors','issues','articles','media'];
const OPTIONAL = ['about','quotes','ads','outlets'];

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
  INFOGRAPHICS = media.infographics || [];
  MEDIA        = media.media || [];
  QA_RECENT    = media.qa || [];

  // ঐচ্ছিক ফাইল — না থাকলেও সাইট চলবে
  const opt = await Promise.all(OPTIONAL.map(n => getJSON(n, bust).catch(() => null)));
  const [about, quotes, ads, outlets] = opt;
  ABOUT        = about || {};
  QUOTES       = quotes || { enabled:false, quotes:[] };
  ADS          = (ads && ads.ads) || [];
  OUTLETS      = (outlets && outlets.outlets) || [];
  OUTLET_INTRO = (outlets && outlets.intro) || '';
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
  const set = (sel, href) => { const el = $(sel); if (el && href) el.href = href; };
  set('#lnkFacebook', SITE.facebook);
  set('#lnkYoutube',  SITE.youtube);
  set('#lnkTelegram', SITE.telegram);

  if (SITE.email){ const e = $('#ctEmail'); e.href = 'mailto:' + SITE.email; e.textContent = SITE.email; }
  if (SITE.phone){ const p = $('#ctPhone'); p.href = 'tel:' + SITE.phone.replace(/[^\d+]/g,''); p.textContent = bn(SITE.phone); }
  if (SITE.address) $('#ctAddress').innerHTML = esc(SITE.address).replace(/\n/g,'<br>');

  const s = SITE.price_single ?? 120, y = SITE.price_yearly ?? 450;
  $('#orderNote').textContent =
    `${SITE.order_note || ''} এক সংখ্যা ৳${bn(s)}, বার্ষিক (৪ সংখ্যা) ৳${bn(y)} — কুরিয়ার খরচসহ।`;
  if (SITE.donate_note) $('#donateNote').textContent = SITE.donate_note;
}

/* =========================================================================
   আমাদের সম্পর্কে ও ফর্মের লেখা
   ========================================================================= */
function renderAbout(){
  if (ABOUT.heading) $('#aboutHeading').textContent = ABOUT.heading;
  if (ABOUT.paragraphs?.length)
    $('#aboutBody').innerHTML = ABOUT.paragraphs.map(p => `<p>${esc(p.text)}</p>`).join('');
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
  $('#heroExcerpt').textContent = lead.excerpt;
  $('#heroBy').textContent = `${authorById(lead.author).name} • পড়তে ${bn(lead.read)} মিনিট`;
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
const viewLabel = id => {
  const n = window.AD?.enabled ? window.AD.views(id) : 0;
  return n > 0 ? ` • ${bn(n)} বার পঠিত` : '';
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
      <span class="card__tag" style="background:${c.color}">${esc(c.name)}</span>
    </div>
    <div class="card__in">
      <h3 class="card__h">${esc(a.title)}</h3>
      <p class="card__x">${esc(a.excerpt)}</p>
      <div class="card__foot">
        <span>${esc(authorById(a.author).name)} • ${d || bn(a.read) + ' মিনিট'}${viewLabel(a.id)}</span>
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
  if (state.issue !== 'all' && a.issue !== state.issue) return false;
  if (state.author !== 'all' && a.author !== state.author) return false;
  if (state.q){
    const hay = [a.title, a.excerpt, authorById(a.author).name, catById(a.cat).name].join(' ').toLowerCase();
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
    `<option value="all">সব সংখ্যা</option>` +
    ISSUES.map(i => `<option value="${i.id}">${esc(i.label)}</option>`).join('');

  $('#authorFilter').innerHTML =
    `<option value="all">সব লেখক</option>` +
    AUTHORS.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');

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
function renderCats(){
  $('#navCats').innerHTML = CATS.map(c => `<li><a href="#articles" data-jumpcat="${c.id}">${esc(c.name)}</a></li>`).join('');
  $('#catGrid').innerHTML = CATS.map(c => {
    const n = ARTICLES.filter(a => a.cat === c.id).length;
    return `<div class="catbox">
      <div class="catbox__ic" style="background:${c.color}1F;color:${c.color}">
        <svg viewBox="0 0 24 24"><path d="${c.icon || 'M12 3l7 4v5c0 4.4-3 8.3-7 9-4-.7-7-4.6-7-9V7l7-4z'}"/></svg>
      </div>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.desc)}</p>
      <button data-jumpcat="${c.id}">${bn(n)}টি লেখা দেখুন</button>
    </div>`;
  }).join('');
}

function renderIssues(){
  $('#issueGrid').innerHTML = [...ISSUES].reverse().map(i => {
    const n = ARTICLES.filter(a => a.issue === i.id).length;
    const btns = i.published
      ? `<button class="btn btn--line" data-issueread="${i.id}">লেখা দেখুন</button>
         <button class="btn btn--line" data-issuepdf="${i.id}">পিডিএফ</button>`
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

function renderAuthors(){
  $('#authorGrid').innerHTML = AUTHORS.map(a => {
    const n = ARTICLES.filter(x => x.author === a.id).length;
    const av = a.photo
      ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">`
      : esc(String(a.name).trim().slice(0,1));
    return `<div class="auth">
      <div class="auth__av" aria-hidden="true">${av}</div>
      <h3 class="auth__n">${esc(a.name)}</h3>
      <p class="auth__r">${esc(a.role)}</p>
      <p class="auth__c">${esc(a.bio)}<br>${bn(n)}টি লেখা</p>
    </div>`;
  }).join('');
}

function renderMediaEtc(){
  $('#infoGrid').innerHTML = INFOGRAPHICS.map((g, i) => {
    const art = g.image
      ? `<div class="info__art info__art--img"><img src="${esc(g.image)}" alt="${esc(g.title)}" loading="lazy"></div>`
      : `<div class="info__art" style="background:linear-gradient(155deg,${g.from || '#064E3B'},${g.to || '#0F5132'})">
           <p>${esc(g.title)}<small>${esc(g.sub)}</small></p></div>`;
    return `<div class="info">${art}
      <div class="info__bar">
        <span>দাওয়াহ কার্ড ${bn(i+1)}</span>
        <span class="card__share">
          <button class="shr" data-infoshare="whatsapp" data-i="${i}" aria-label="হোয়াটসঅ্যাপে শেয়ার">${shareIcon('whatsapp')}</button>
          <button class="shr" data-infoshare="facebook" data-i="${i}" aria-label="ফেসবুকে শেয়ার">${shareIcon('facebook')}</button>
          <button class="shr" data-infoshare="copy" data-i="${i}" aria-label="লেখা কপি">${shareIcon('copy')}</button>
        </span>
      </div>
    </div>`;
  }).join('');

  $('#mediaList').innerHTML = MEDIA.map(m => {
    const play = m.link
      ? `<a class="mitem__play" href="${esc(m.link)}" target="_blank" rel="noopener" aria-label="চালান"><svg viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z"/></svg></a>`
      : `<button class="mitem__play" aria-label="চালান"><svg viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z"/></svg></button>`;
    return `<li class="mitem">${play}
      <div><p class="mitem__t">${esc(m.title)}</p><p class="mitem__m">${esc(m.meta)}</p></div>
      <span class="mitem__len">${esc(m.length)}</span>
    </li>`;
  }).join('');

  $('#qaRecent').innerHTML = QA_RECENT.map(x =>
    `<div class="qaitem"><p class="q">${esc(x.q)}</p><p class="a">${esc(x.a)}</p></div>`).join('');

  $('#donateCards').innerHTML = PAYMENTS.map(p => `
    <div class="dcard">
      <span class="dcard__n" style="background:${p.color}">${esc(p.name)}</span>
      <div><p class="dcard__t">${esc(p.title)}</p><p class="dcard__v">${bn(p.number)}</p></div>
      <button class="dcard__copy" data-copy="${esc(p.number)}">নম্বর কপি</button>
    </div>`).join('');
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
}

function bodyHTML(blocks){
  return (blocks || []).map(b => {
    if (b.type === 'heading') return `<h3>${esc(b.text)}</h3>`;
    if (b.type === 'quote')   return `<blockquote>${esc(b.text)}<footer>${esc(b.source || '')}</footer></blockquote>`;
    if (b.type === 'image')   return `<figure class="art__fig"><img src="${esc(b.src)}" alt="${esc(b.caption || '')}" loading="lazy">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    if (b.type === 'refute')  return `<div class="refute">
        <div class="refute__claim"><span class="refute__lbl">দাবি</span><p>${esc(b.claim)}</p></div>
        <div class="refute__answer"><span class="refute__lbl">জবাব</span><p>${esc(b.answer)}</p></div>
      </div>`;
    return `<p>${esc(b.text)}</p>`;
  }).join('');
}

function openArticle(id){
  const a = ARTICLES.find(x => x.id === id); if (!a) return;
  const c = catById(a.cat), i = issueById(a.issue);
  const d = bnDate(a.date);
  const hero = a.thumb ? `<figure class="art__hero"><img src="${esc(a.thumb)}" alt="${esc(a.title)}"></figure>` : '';
  openModal(`
    ${hero}
    <p class="art__cat" style="color:${c.color}">${esc(c.name)}</p>
    <h2 class="art__h" id="modalTitle">${esc(a.title)}</h2>
    <div class="art__meta">
      <span>${esc(authorById(a.author).name)}</span>
      <span>${esc(i.label)} ॥ ${esc(i.greg)}</span>
      ${d ? `<span>${d}</span>` : ''}
      <span>পড়তে ${bn(a.read)} মিনিট</span>
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

/* ---- পিডিএফ প্রিভিউ ---- */
function pagePlate(issue, n){
  if (n === 0) return coverSVG(issue);
  const accent = issue.accent || '#D97706';
  const arts = ARTICLES.filter(a => a.issue === issue.id);
  if (n === 1){
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
  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="সম্পাদকীয়">
    <rect width="300" height="400" fill="#F8FAF8"/>
    <text x="34" y="58" fill="#B45309" font-family="SolaimanLipi, sans-serif" font-size="12">সম্পাদকীয়</text>
    <text x="34" y="86" fill="#064E3B" font-family="SolaimanLipi, sans-serif" font-size="20" font-weight="700">যে কথা বলার জন্য</text>
    <text x="34" y="110" fill="#064E3B" font-family="SolaimanLipi, sans-serif" font-size="20" font-weight="700">এই আয়োজন</text>
    ${Array.from({length:11}, (_,k) => `<rect x="34" y="${138 + k*20}" width="${k===10?150:232}" height="7" rx="3" fill="#1F2937" opacity=".16"/>`).join('')}
    <line x1="34" y1="368" x2="266" y2="368" stroke="#DFE8E2"/>
    <text x="266" y="386" text-anchor="end" fill="#5A6B63" font-family="SolaimanLipi, sans-serif" font-size="11">${esc(issue.label)}</text>
  </svg>`;
}

function openPdf(issueId){
  const issue = issueById(issueId);
  let page = 0; const total = 3;
  const dl = issue.pdf
    ? `<a class="btn btn--gold btn--lg" href="${esc(issue.pdf)}" download style="justify-self:center">
         <svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/></svg>
         সম্পূর্ণ পিডিএফ নামান</a>`
    : `<p class="pdfv__note">এই সংখ্যার পিডিএফ এখনও যুক্ত করা হয়নি।</p>`;

  openModal(`
    <h2 class="art__h" id="modalTitle">${esc(issue.label)} — পিডিএফ</h2>
    <p class="art__meta">${esc(issue.hijri)} ॥ ${esc(issue.greg)}${issue.pages ? ` • ${bn(issue.pages)} পৃষ্ঠা` : ''}</p>
    <div class="pdfv">
      <div class="pdfv__stage"><div class="cover" id="pdfPlate"></div></div>
      <div class="pdfv__nav">
        <button id="pdfPrev" aria-label="আগের পৃষ্ঠা"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="pdfv__page" id="pdfPage"></span>
        <button id="pdfNext" aria-label="পরের পৃষ্ঠা"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
      ${dl}
    </div>`);

  const draw = () => {
    $('#pdfPlate').innerHTML = pagePlate(issue, page);
    $('#pdfPage').textContent = `পৃষ্ঠা ${bn(page + 1)} / ${bn(total)}`;
    $('#pdfPrev').disabled = page === 0;
    $('#pdfNext').disabled = page === total - 1;
  };
  $('#pdfPrev').onclick = () => { if (page > 0){ page--; draw(); } };
  $('#pdfNext').onclick = () => { if (page < total - 1){ page++; draw(); } };
  draw();
}

/* ---- অর্ডার ফর্ম (সাধারণ ও প্রি-অর্ডার) ---- */
function openOrder(issue){
  const pre = !!issue;
  const s = SITE.price_single ?? 120, y = SITE.price_yearly ?? 450, b = SITE.price_bundle ?? 1000;
  const hint = PAYMENTS.map(p => `<strong>${esc(p.title)} ${bn(p.number)}</strong>`).join(' ॥ ');
  const opts = pre
    ? `<option>${esc(issue.label)} — প্রি-অর্ডার ৳${bn(s)}</option>
       <option>বার্ষিক গ্রাহক (৪ সংখ্যা) — ৳${bn(y)}</option>
       <option>১০ কপি বান্ডিল (মাদরাসা/মসজিদ) — ৳${bn(b)}</option>`
    : `<option>বর্তমান সংখ্যা — ৳${bn(s)}</option>
       <option>বার্ষিক গ্রাহক (৪ সংখ্যা) — ৳${bn(y)}</option>
       <option>১০ কপি বান্ডিল (মাদরাসা/মসজিদ) — ৳${bn(b)}</option>`;

  openModal(`
    <h2 class="art__h" id="modalTitle">${pre ? 'প্রি-অর্ডার' : 'ছাপা কপির অর্ডার'}</h2>
    <p class="art__meta">${pre ? esc(issue.label) + ' ॥ ' + esc(issue.greg) : `এক সংখ্যা ৳${bn(s)} • বার্ষিক ৪ সংখ্যা ৳${bn(y)}`} • কুরিয়ার খরচ অন্তর্ভুক্ত</p>
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
        <label class="fld"><span>কী নিতে চান</span><select name="package">${opts}</select></label>
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
function authForms(mode){
  const login = mode !== 'signup';
  return `
    <h2 class="art__h" id="modalTitle">${login ? 'লগইন করুন' : 'নতুন অ্যাকাউন্ট'}</h2>
    <p class="art__meta">লগইন করলে পছন্দের লেখা সংরক্ষণ করতে পারবেন, আর নিজের পাঠানো প্রশ্নের জবাব এক জায়গায় দেখতে পাবেন।</p>
    <form class="ordform" id="authForm">
      ${login ? '' : `<label class="fld"><span>আপনার নাম</span><input name="name" required placeholder="পূর্ণ নাম"></label>`}
      <label class="fld"><span>ইমেইল</span><input name="email" type="email" required placeholder="you@example.com"></label>
      <label class="fld"><span>পাসওয়ার্ড</span><input name="password" type="password" required minlength="6" placeholder="অন্তত ৬ অক্ষর"></label>
      <button class="btn btn--green btn--lg" type="submit">${login ? 'লগইন' : 'নিবন্ধন করুন'}</button>
      <p class="form__note" id="authNote" role="status"></p>
    </form>
    <div class="authswitch">
      ${login
        ? `<button data-auth="signup">অ্যাকাউন্ট নেই? নিবন্ধন করুন</button>
           <button data-auth="reset">পাসওয়ার্ড ভুলে গেছেন?</button>`
        : `<button data-auth="login">অ্যাকাউন্ট আছে? লগইন করুন</button>`}
    </div>`;
}

function openAuth(mode){
  openModal(authForms(mode));
  const form = $('#authForm'), note = $('#authNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    note.textContent = 'অপেক্ষা করুন…';
    try{
      if (mode === 'signup'){
        await AD.signUp(f.email, f.password, f.name);
        note.textContent = 'নিবন্ধন হয়েছে। ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্টটি নিশ্চিত করুন।';
      } else {
        await AD.signIn(f.email, f.password);
        closeModal();
        toast('স্বাগতম, ' + AD.userName());
      }
    }catch(err){
      note.textContent = authError(err);
      note.style.color = 'var(--accent)';
    }
  });
}

function authError(err){
  const m = String(err?.message || '');
  if (/Invalid login/i.test(m))      return 'ইমেইল বা পাসওয়ার্ড মিলছে না।';
  if (/already registered/i.test(m)) return 'এই ইমেইলে অ্যাকাউন্ট আছে। লগইন করে দেখুন।';
  if (/Email not confirmed/i.test(m))return 'ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্টটি নিশ্চিত করুন।';
  if (/at least 6/i.test(m))         return 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।';
  if (/rate limit/i.test(m))         return 'কিছুক্ষণ পর আবার চেষ্টা করুন।';
  return 'সমস্যা হয়েছে: ' + m;
}

async function openAccount(){
  openModal(`
    <h2 class="art__h" id="modalTitle">${esc(AD.userName())}</h2>
    <p class="art__meta">${esc(AD.user?.email || '')}</p>
    <div class="acct">
      <h3 class="acct__h">সংরক্ষিত লেখা</h3>
      <div id="acctMarks"><p class="acct__empty">লোড হচ্ছে…</p></div>
      <h3 class="acct__h">আপনার প্রশ্ন</h3>
      <div id="acctQs"><p class="acct__empty">লোড হচ্ছে…</p></div>
      <button class="btn btn--line" id="signOutBtn">লগআউট</button>
    </div>`);

  $('#signOutBtn').onclick = async () => { await AD.signOut(); closeModal(); toast('লগআউট হয়েছে'); };

  const marks = [...AD.bookmarks].map(id => ARTICLES.find(a => a.id === id)).filter(Boolean);
  $('#acctMarks').innerHTML = marks.length
    ? marks.map(a => `<button class="acctitem" data-open="${a.id}">
        <b>${esc(a.title)}</b><span>${esc(catById(a.cat).name)} • ${esc(authorById(a.author).name)}</span></button>`).join('')
    : '<p class="acct__empty">এখনও কোনো লেখা সংরক্ষণ করেননি। যেকোনো লেখা খুলে “সংরক্ষণ করুন” চাপলেই এখানে জমা হবে।</p>';

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
  $('#qpopText').textContent = q.text;
  $('#qpopSrc').textContent = q.source || '';
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
  { t:'আপনার জিজ্ঞাসা', s:'প্রশ্ন পাঠান', h:'#qa' },
  { t:'লেখা পাঠান', s:'আমাদের জন্য লিখুন', h:'#submit' },
  { t:'এজেন্ট ও মাকতাবা', s:'যেখানে পত্রিকা পাওয়া যায়', h:'#outlets' },
  { t:'দাওয়াতি ফান্ড', s:'বিকাশ / নগদ / রকেট', h:'#donate' }
];

function renderSearch(q){
  const box = $('#searchResults');
  if (!q.trim()){ box.hidden = true; box.innerHTML = ''; return; }
  const k = q.toLowerCase();
  const arts = ARTICLES.filter(a =>
    [a.title, a.excerpt, authorById(a.author).name, catById(a.cat).name].join(' ').toLowerCase().includes(k)
  ).slice(0, 6);
  const outs = OUTLETS.filter(o =>
    [o.name, o.address, o.district, o.division].join(' ').toLowerCase().includes(k)).slice(0, 3);
  const pages = PAGES.filter(p => (p.t + p.s).toLowerCase().includes(k)).slice(0, 3);

  const html =
    arts.map(a => `<button class="sres" data-open="${a.id}"><b>${esc(a.title)}</b><span>${esc(catById(a.cat).name)} • ${esc(authorById(a.author).name)}</span></button>`).join('') +
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
  renderIssues();
  renderAuthors();
  renderMediaEtc();
  renderOutletFilters();
  renderOutlets();
  $$('.bn-num').forEach(el => { el.textContent = bn(el.textContent); });
}

function wireUI(){
  setTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeToggle').onclick = () =>
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

  const nav = $('#mainNav'), navBtn = $('#navToggle');
  navBtn.onclick = () => navBtn.setAttribute('aria-expanded', nav.classList.toggle('is-open'));

  const subToggle = $('.nav__subtoggle'), sub = $('#navCats');
  subToggle.onclick = e => {
    e.stopPropagation();
    subToggle.setAttribute('aria-expanded', sub.classList.toggle('is-open'));
  };
  document.addEventListener('click', () => { sub.classList.remove('is-open'); subToggle.setAttribute('aria-expanded', false); });

  const sbar = $('#searchbar'), sinput = $('#searchInput');
  $('#searchToggle').onclick = () => {
    sbar.hidden = !sbar.hidden;
    $('#searchToggle').setAttribute('aria-expanded', !sbar.hidden);
    if (!sbar.hidden) sinput.focus();
  };
  $('#searchClose').onclick = () => { sbar.hidden = true; sinput.value = ''; renderSearch(''); state.q = ''; renderArticles(); };
  sinput.addEventListener('input', e => { state.q = e.target.value; renderSearch(e.target.value); renderArticles(); });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-qclose]')){ closeQuote(); return; }

    const share = e.target.closest('[data-share]');
    if (share){ e.stopPropagation(); doShare(share.dataset.share, ARTICLES.find(a => a.id === share.dataset.id)); return; }

    const ishare = e.target.closest('[data-infoshare]');
    if (ishare){
      const g = INFOGRAPHICS[+ishare.dataset.i];
      const url = location.origin + location.pathname + '#media';
      if (ishare.dataset.infoshare === 'copy'){
        navigator.clipboard?.writeText(`${g.title} — ${g.sub}\n${url}`).then(() => toast('কার্ডের লেখা কপি হয়েছে'));
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
      return;
    }
    const ip = e.target.closest('[data-issuepdf]');
    if (ip){ openPdf(ip.dataset.issuepdf); return; }

    const po = e.target.closest('[data-preorder]');
    if (po){ openOrder(issueById(po.dataset.preorder)); return; }

    const cp = e.target.closest('[data-copy]');
    if (cp){ navigator.clipboard?.writeText(cp.dataset.copy).then(() => toast('নম্বর কপি হয়েছে')); return; }

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
      } else openAuth(m);
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
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card')){ e.preventDefault(); openArticle(e.target.dataset.open); }
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
  wireForm($('#lekhaForm'), $('#lekhaNote'), 'লেখাটি পৌঁছেছে। সম্পাদনা পরিষদ যাচাই করে ইমেইলে জানাবে, ইনশাআল্লাহ।');

  const toTop = $('#toTop'), head = $('#head');
  const onScroll = () => {
    toTop.hidden = scrollY < 600;
    head.classList.toggle('is-stuck', scrollY > 10);
    const y = scrollY + 140;
    let cur = 'home';
    ['home','about','archive','authors','qa','submit','outlets','contact'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    });
    $$('.nav__link[href^="#"]').forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + cur));
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

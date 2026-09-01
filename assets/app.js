/* =========================================================================
   আদ দাওয়াহ — assets/app.js

   এই ফাইলে কোনো লেখা বা কনটেন্ট নেই। সব কনটেন্ট আসে content/ ফোল্ডারের
   JSON ফাইল থেকে, যেগুলো /admin প্যানেল থেকে সম্পাদনা করা যায়।
   ========================================================================= */

/* ---------- বাংলা সংখ্যা ---------- */
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const bn = v => String(v).replace(/[0-9]/g, d => BN_DIGITS[+d]);

const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const HIJRI_MONTHS = ['মুহাররম','সফর','রবিউল আউয়াল','রবিউস সানি','জুমাদাল ঊলা','জুমাদাল উখরা','রজব','শা\u200Cবান','রমাদান','শাওয়াল','যিলক্বদ','যিলহজ্জ'];

/* ---------- কনটেন্ট (লোড হওয়ার পর ভরে যাবে) ---------- */
let CATS = [], ISSUES = [], AUTHORS = [], ARTICLES = [];
let INFOGRAPHICS = [], MEDIA = [], QA_RECENT = [], SITE = {}, PAYMENTS = [];

const catById    = id => CATS.find(c => c.id === id)    || CATS[0]    || { name:'', color:'#0F5132' };
const issueById  = id => ISSUES.find(i => i.id === id)  || ISSUES[0]  || { label:'', greg:'', hijri:'' };
const authorById = id => AUTHORS.find(a => a.id === id) || AUTHORS[0] || { name:'' };

/* =========================================================================
   কনটেন্ট লোড
   ========================================================================= */
const CONTENT_FILES = ['site','categories','authors','issues','articles','media'];

async function loadContent(){
  const bust = `?v=${Date.now()}`;
  const parts = await Promise.all(
    CONTENT_FILES.map(async name => {
      const res = await fetch(`content/${name}.json${bust}`, { cache:'no-store' });
      if (!res.ok) throw new Error(`content/${name}.json — ${res.status}`);
      return res.json();
    })
  );
  const [site, cats, auths, issues, arts, media] = parts;

  SITE         = site || {};
  PAYMENTS     = SITE.payments || [];
  CATS         = cats.categories || [];
  AUTHORS      = auths.authors   || [];
  ISSUES       = issues.issues   || [];
  ARTICLES     = arts.articles   || [];
  INFOGRAPHICS = media.infographics || [];
  MEDIA        = media.media || [];
  QA_RECENT    = media.qa || [];
}

function loadFailed(err){
  document.body.insertAdjacentHTML('afterbegin', `
    <div style="background:#B45309;color:#fff;padding:16px 20px;font-size:15.5px;line-height:1.8">
      <strong>কনটেন্ট লোড করা যায়নি।</strong>
      ফাইলটি সরাসরি ডাবল-ক্লিক করে খুললে ব্রাউজার নিরাপত্তার কারণে
      <code>content/</code> ফোল্ডারের ফাইল পড়তে দেয় না। ফোল্ডারে গিয়ে
      <code>npx serve</code> অথবা <code>python3 -m http.server</code> চালিয়ে দেখুন —
      নেটলিফাইতে আপলোড করলে এই সমস্যা হবে না।
      <br><small style="opacity:.85">${err.message}</small>
    </div>`);
}

/* =========================================================================
   কভার
   ========================================================================= */
function coverSVG(issue){
  if (issue.cover){
    return `<img src="${issue.cover}" alt="${issue.label} প্রচ্ছদ" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }
  const bg = issue.bg || '#064E3B';
  const accent = issue.accent || '#D97706';
  const ink = '#F8FAF8';
  const uid = String(issue.id || 'x').replace(/[^a-z0-9-]/gi, '');
  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${issue.label} প্রচ্ছদ">
    <defs>
      <pattern id="p-${uid}" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 0l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="${accent}" opacity=".16"/>
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
      <path d="M0-19l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L0 3.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="${accent}"/>
    </g>
    <text x="150" y="172" text-anchor="middle" fill="${ink}" font-family="Noto Serif Bengali, serif" font-size="40" font-weight="700">আদ দাওয়াহ</text>
    <line x1="80" y1="192" x2="220" y2="192" stroke="${accent}" stroke-width="1"/>
    <text x="150" y="216" text-anchor="middle" fill="${ink}" opacity=".85" font-family="Hind Siliguri, sans-serif" font-size="12.5">ত্রৈমাসিক ইসলামী পত্রিকা</text>
    <text x="150" y="300" text-anchor="middle" fill="${accent}" font-family="Noto Serif Bengali, serif" font-size="19" font-weight="600">${issue.label}</text>
    <text x="150" y="326" text-anchor="middle" fill="${ink}" opacity=".8" font-family="Hind Siliguri, sans-serif" font-size="13">${issue.hijri} ॥ ${issue.greg}</text>
    <text x="150" y="364" text-anchor="middle" fill="${ink}" opacity=".55" font-family="Hind Siliguri, sans-serif" font-size="11.5">কুরআন ও সুন্নাহর আলোকে</text>
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

/* =========================================================================
   তারিখ
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

/* =========================================================================
   সাইট সেটিংস প্রয়োগ
   ========================================================================= */
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
   হিরো
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

/* =========================================================================
   লেখার গ্রিড + ছাঁকনি
   ========================================================================= */
const state = { cat:'all', issue:'all', author:'all', q:'' };

function articleCard(a){
  const c = catById(a.cat);
  return `<article class="card" data-open="${a.id}" tabindex="0" role="button" aria-label="${esc(a.title)}">
    <div class="card__band" style="background:${c.color}"></div>
    <div class="card__in">
      <p class="card__cat" style="color:${c.color}">${esc(c.name)}</p>
      <h3 class="card__h">${esc(a.title)}</h3>
      <p class="card__x">${esc(a.excerpt)}</p>
      <div class="card__foot">
        <span>${esc(authorById(a.author).name)} • ${bn(a.read)} মিনিট</span>
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

function renderArticles(){
  const list = ARTICLES.filter(matches);
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
}

/* =========================================================================
   বিভাগ, সংখ্যা, লেখক, মিডিয়া
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
      : `<button class="btn btn--line" disabled>${esc(i.tagline || 'প্রস্তুত হচ্ছে')}</button>`;
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
    return `<div class="auth">
      <div class="auth__av" aria-hidden="true">${esc(String(a.name).trim().slice(0,1))}</div>
      <h3 class="auth__n">${esc(a.name)}</h3>
      <p class="auth__r">${esc(a.role)}</p>
      <p class="auth__c">${esc(a.bio)}<br>${bn(n)}টি লেখা</p>
    </div>`;
  }).join('');
}

function renderMediaEtc(){
  $('#infoGrid').innerHTML = INFOGRAPHICS.map((g, i) => `
    <div class="info">
      <div class="info__art" style="background:linear-gradient(155deg,${g.from},${g.to})">
        <p>${esc(g.title)}<small>${esc(g.sub)}</small></p>
      </div>
      <div class="info__bar">
        <span>দাওয়াহ কার্ড ${bn(i+1)}</span>
        <span class="card__share">
          <button class="shr" data-infoshare="whatsapp" data-i="${i}" aria-label="হোয়াটসঅ্যাপে শেয়ার">${shareIcon('whatsapp')}</button>
          <button class="shr" data-infoshare="facebook" data-i="${i}" aria-label="ফেসবুকে শেয়ার">${shareIcon('facebook')}</button>
          <button class="shr" data-infoshare="copy" data-i="${i}" aria-label="লেখা কপি">${shareIcon('copy')}</button>
        </span>
      </div>
    </div>`).join('');

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
  openModal(`
    <p class="art__cat" style="color:${c.color}">${esc(c.name)}</p>
    <h2 class="art__h" id="modalTitle">${esc(a.title)}</h2>
    <div class="art__meta">
      <span>${esc(authorById(a.author).name)}</span>
      <span>${esc(i.label)} ॥ ${esc(i.greg)}</span>
      <span>পড়তে ${bn(a.read)} মিনিট</span>
    </div>
    <div class="art__body">${bodyHTML(a.body)}</div>
    <div class="art__share">
      <span>শেয়ার করুন</span>
      <button class="sbtn" data-share="whatsapp" data-id="${a.id}">${shareIcon('whatsapp')} হোয়াটসঅ্যাপ</button>
      <button class="sbtn" data-share="facebook" data-id="${a.id}">${shareIcon('facebook')} ফেসবুক</button>
      <button class="sbtn" data-share="telegram" data-id="${a.id}">${shareIcon('telegram')} টেলিগ্রাম</button>
      <button class="sbtn" data-share="copy" data-id="${a.id}">${shareIcon('copy')} লিংক কপি</button>
    </div>`);
  history.replaceState(null, '', `#/lekha/${a.id}`);
}

/* পিডিএফ প্রিভিউ */
function pagePlate(issue, n){
  if (n === 0) return coverSVG(issue);
  const accent = issue.accent || '#D97706';
  const arts = ARTICLES.filter(a => a.issue === issue.id);
  if (n === 1){
    const rows = arts.slice(0, 9).map((a, k) =>
      `<text x="34" y="${104 + k*29}" fill="#1F2937" font-family="Hind Siliguri, sans-serif" font-size="12.5">${bn(k+1)}. ${esc(a.title.slice(0, 42))}…</text>`).join('');
    return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="সূচিপত্র">
      <rect width="300" height="400" fill="#F8FAF8"/>
      <rect x="0" y="0" width="300" height="6" fill="${accent}"/>
      <text x="34" y="62" fill="#064E3B" font-family="Noto Serif Bengali, serif" font-size="24" font-weight="700">সূচিপত্র</text>
      <line x1="34" y1="76" x2="266" y2="76" stroke="#DFE8E2"/>
      ${rows}
    </svg>`;
  }
  return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="সম্পাদকীয়">
    <rect width="300" height="400" fill="#F8FAF8"/>
    <text x="34" y="58" fill="#B45309" font-family="Hind Siliguri, sans-serif" font-size="12">সম্পাদকীয়</text>
    <text x="34" y="86" fill="#064E3B" font-family="Noto Serif Bengali, serif" font-size="20" font-weight="700">যে কথা বলার জন্য</text>
    <text x="34" y="110" fill="#064E3B" font-family="Noto Serif Bengali, serif" font-size="20" font-weight="700">এই আয়োজন</text>
    ${Array.from({length:11}, (_,k) => `<rect x="34" y="${138 + k*20}" width="${k===10?150:232}" height="7" rx="3" fill="#1F2937" opacity=".16"/>`).join('')}
    <line x1="34" y1="368" x2="266" y2="368" stroke="#DFE8E2"/>
    <text x="266" y="386" text-anchor="end" fill="#5A6B63" font-family="Hind Siliguri, sans-serif" font-size="11">${esc(issue.label)}</text>
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

/* অর্ডার ফর্ম */
function openOrder(){
  const s = SITE.price_single ?? 120, y = SITE.price_yearly ?? 450, b = SITE.price_bundle ?? 1000;
  const hint = PAYMENTS.map(p => `<strong>${esc(p.title)} ${bn(p.number)}</strong>`).join(' ॥ ');
  openModal(`
    <h2 class="art__h" id="modalTitle">ছাপা কপির অর্ডার</h2>
    <p class="art__meta">এক সংখ্যা ৳${bn(s)} • বার্ষিক ৪ সংখ্যা ৳${bn(y)} • কুরিয়ার খরচ অন্তর্ভুক্ত</p>
    <form class="ordform" id="orderForm" name="order" method="POST" data-netlify="true">
      <input type="hidden" name="form-name" value="order">
      <div class="row">
        <label class="fld"><span>নাম</span><input name="nam" required placeholder="পূর্ণ নাম"></label>
        <label class="fld"><span>মোবাইল</span><input name="mobile" required inputmode="tel" placeholder="01XXXXXXXXX"></label>
      </div>
      <label class="fld"><span>ঠিকানা</span><textarea name="thikana" rows="3" required placeholder="গ্রাম/বাসা, ডাকঘর, থানা, জেলা"></textarea></label>
      <div class="row">
        <label class="fld"><span>কী নিতে চান</span>
          <select name="package">
            <option>বর্তমান সংখ্যা — ৳${bn(s)}</option>
            <option>বার্ষিক গ্রাহক (৪ সংখ্যা) — ৳${bn(y)}</option>
            <option>১০ কপি বান্ডিল (মাদরাসা/মসজিদ) — ৳${bn(b)}</option>
          </select>
        </label>
        <label class="fld"><span>পেমেন্ট মাধ্যম</span>
          <select name="payment">${PAYMENTS.map(p => `<option>${esc(p.title)}</option>`).join('')}<option>ক্যাশ অন ডেলিভারি</option></select>
        </label>
      </div>
      <label class="fld"><span>ট্রানজেকশন আইডি <em>(পেমেন্ট করে থাকলে)</em></span><input name="trxid" placeholder="যেমন: 9F2K7QX1"></label>
      <div class="payhint">সেন্ড মানি করুন — ${hint}। টাকা পাঠানোর পর ট্রানজেকশন আইডি লিখে অর্ডারটি নিশ্চিত করুন।</div>
      <button class="btn btn--green btn--lg" type="submit">অর্ডার নিশ্চিত করুন</button>
      <p class="form__note" id="orderFormNote" role="status"></p>
    </form>`);
  wireForm($('#orderForm'), $('#orderFormNote'), 'অর্ডার পেয়েছি। এক কর্মদিবসের মধ্যে ফোনে নিশ্চিত করা হবে, ইনশাআল্লাহ।');
}

/* =========================================================================
   ফর্ম (Netlify Forms)
   ========================================================================= */
function wireForm(form, note, okMsg){
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    note.textContent = 'পাঠানো হচ্ছে…';
    const data = new URLSearchParams(new FormData(form)).toString();
    fetch('/', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:data })
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
  { t:'দাওয়াতি ফান্ড', s:'বিকাশ / নগদ / রকেট', h:'#donate' }
];

function renderSearch(q){
  const box = $('#searchResults');
  if (!q.trim()){ box.hidden = true; box.innerHTML = ''; return; }
  const k = q.toLowerCase();
  const arts = ARTICLES.filter(a =>
    [a.title, a.excerpt, authorById(a.author).name, catById(a.cat).name].join(' ').toLowerCase().includes(k)
  ).slice(0, 6);
  const pages = PAGES.filter(p => (p.t + p.s).toLowerCase().includes(k)).slice(0, 3);

  const html =
    arts.map(a => `<button class="sres" data-open="${a.id}"><b>${esc(a.title)}</b><span>${esc(catById(a.cat).name)} • ${esc(authorById(a.author).name)}</span></button>`).join('') +
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
  renderHero();
  renderFilters();
  renderArticles();
  renderCats();
  renderIssues();
  renderAuthors();
  renderMediaEtc();
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

    const cp = e.target.closest('[data-copy]');
    if (cp){ navigator.clipboard?.writeText(cp.dataset.copy).then(() => toast('নম্বর কপি হয়েছে')); return; }

    if (e.target.closest('[data-close]')) closeModal();

    if (e.target.closest('.nav__link[href^="#"], .nav__sub a, .foot__links a, [data-goto]')){
      nav.classList.remove('is-open'); sbar.hidden = true;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ if (!$('#modal').hidden) closeModal(); else if (!sbar.hidden) sbar.hidden = true; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card')){ e.preventDefault(); openArticle(e.target.dataset.open); }
  });

  $('#orderOpen').onclick = openOrder;
  wireForm($('#qaForm'),  $('#qaNote'),  'প্রশ্নটি পৌঁছেছে। জবাব প্রস্তুত হলে ইমেইলে জানানো হবে, ইনশাআল্লাহ।');
  wireForm($('#subForm'), $('#subNote'), 'যুক্ত হয়েছেন। নতুন সংখ্যার খবর ইমেইলে পাবেন।');

  const toTop = $('#toTop'), head = $('#head');
  const onScroll = () => {
    toTop.hidden = scrollY < 600;
    head.classList.toggle('is-stuck', scrollY > 10);
    const y = scrollY + 140;
    let cur = 'home';
    ['home','about','archive','authors','qa','contact'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    });
    $$('.nav__link[href^="#"]').forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  toTop.onclick = () => scrollTo({ top:0, behavior:'smooth' });
}

async function init(){
  renderDates();
  wireUI();
  try{
    await loadContent();
    renderAll();
    const m = location.hash.match(/^#\/lekha\/(.+)$/);
    if (m) openArticle(m[1]);
  }catch(err){
    console.error(err);
    loadFailed(err);
  }
}

document.addEventListener('DOMContentLoaded', init);

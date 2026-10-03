/* =========================================================================
   আদ দাওয়াহ — সম্পাদনা প্যানেলের বাড়তি সুবিধা
   ১) বাঁ পাশের মেনু ও ফাইল-কার্ডে ছোট করে গণনা (কয়টি লেখা, কয়জন লেখক…)
   ২) এক-ফাইলের মেনুতে চাপলে সরাসরি সম্পাদনার পাতায় নিয়ে যাওয়া
   ৩) "article-browser" উইজেট: সংখ্যা / শুধু ওয়েবসাইটে → বিভাগ → লেখা
   ========================================================================= */
(function () {
  'use strict';
  var REPO = 'addawahmagazine/Ad-Dawah', BRANCH = 'main';
  var h = window.h;

  function bn(n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function incomplete(a) { return !a.title || !a.id || !a.cat; }   // শিরোনাম, লিংক-নাম, বিভাগ — এগুলো ছাড়া লেখা অচল
  function isWeb(a) { return a.kind === 'web' || !a.issue; }   // সাইটের নিয়মের সঙ্গে মিল রেখে

  /* ---------------- গিটহাব থেকে সর্বশেষ কনটেন্ট পড়া ---------------- */
  function token() {
    try { var u = JSON.parse(localStorage.getItem('decap-cms-user') || 'null'); return u && u.token; } catch (e) { return null; }
  }
  var fileCache = {};
  function getContent(name, fresh) {
    var c = fileCache[name];
    if (c && !fresh && Date.now() - c.t < 15000) return c.p;
    var t = token(), p;
    if (t) {
      p = fetch('https://api.github.com/repos/' + REPO + '/contents/content/' + name + '.json?ref=' + BRANCH + '&_=' + Date.now(), {
        headers: { Authorization: 'token ' + t, Accept: 'application/vnd.github.raw' }, cache: 'no-store'
      }).then(function (r) { if (!r.ok) throw r.status; return r.json(); });
    } else {
      p = fetch('https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/content/' + name + '.json?_=' + Date.now())
        .then(function (r) { if (!r.ok) throw r.status; return r.json(); });
    }
    p = p.catch(function () {           // শেষ চেষ্টা: প্রকাশিত সাইটের কপি
      return fetch('/content/' + name + '.json?_=' + Date.now()).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    });
    fileCache[name] = { t: Date.now(), p: p };
    return p;
  }
  window.__adGetContent = getContent;

  /* ---------------- ১) মেনু ও কার্ডে গণনা ---------------- */
  var styleEl = document.createElement('style');
  styleEl.id = 'ad-counts';
  document.head.appendChild(styleEl);

  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' '); }
  /* মেনু ও কার্ডের নিচের ছোট লেখা: গণনা + কে খুলে রেখেছেন — দুটো মিলিয়ে একটাই ::after */
  var COUNTS = {}, PRES = {};
  function sideSel(coll) { return 'a[data-testid="' + coll + '"][href$="/collections/' + coll + '"]'; }
  function cardSel(coll, file) { return 'a[href$="/collections/' + coll + '/entries/' + file + '"]'; }
  function side(coll, text) { COUNTS[sideSel(coll)] = text; }
  function card(coll, file, text) { COUNTS[cardSel(coll, file)] = text; }
  function renderBadges() {
    var keys = {}, css = [];
    Object.keys(COUNTS).forEach(function (k) { keys[k] = 1; });
    Object.keys(PRES).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (sel) {
      var t = [COUNTS[sel], PRES[sel] ? '✎ ' + PRES[sel] : ''].filter(Boolean).map(esc).join('\\A ');
      css.push(sel + '::after{content:"' + t + '";white-space:pre-line}');
    });
    styleEl.textContent = css.join('\n');
  }

  function refreshCounts(fresh) {
    var names = ['articles', 'issues', 'authors', 'categories', 'media', 'feedback', 'outlets', 'ads'];
    Promise.all(names.map(function (n) { return getContent(n, fresh); })).then(function (r) {
      var d = {}; names.forEach(function (n, i) { d[n] = r[i] || {}; });
      var arts = arr(d.articles.articles), iss = arr(d.issues.issues), au = arr(d.authors.authors), cat = arr(d.categories.categories);
      var m = d.media, cards = arr(m.infographics).length, graphs = arr(m.infographs).length;
      var med = arr(m.media), vid = 0, aud = 0;
      med.forEach(function (x) {
        var t = String(x.type || '') + ' ' + String(x.meta || '');
        if (/video|ভিডিও/.test(t)) vid++; else if (/audio|অডিও/.test(t)) aud++;
      });
      var fb = arr(d.feedback.items).length, out = arr(d.outlets.outlets);
      var mak = out.filter(function (o) { return o.kind === 'মাকতাবা'; }).length, ag = out.filter(function (o) { return o.kind === 'এজেন্ট'; }).length;
      var ads = arr(d.ads.ads), on = ads.filter(function (a) { return a.active !== false; }).length;
      var web = arts.filter(isWeb).length;
      [
        side('articles', 'মোট ' + bn(arts.length) + 'টি লেখা'),
        side('taxonomy', bn(iss.length) + ' সংখ্যা · ' + bn(au.length) + ' লেখক · ' + bn(cat.length) + ' বিভাগ'),
        side('media', bn(cards) + ' কার্ড · ' + bn(graphs) + ' ইনফোগ্রাফিক'),
        side('avmedia', med.length ? (bn(vid) + ' ভিডিও · ' + bn(aud) + ' অডিও' + (med.length - vid - aud ? ' · ' + bn(med.length - vid - aud) + ' অন্যান্য' : '')) : 'এখনো কিছু নেই'),
        side('feedback', bn(fb) + 'টি অনুভূতি'),
        side('outlets', bn(ag) + ' এজেন্ট · ' + bn(mak) + ' মাকতাবা'),
        side('ads', bn(ads.length) + 'টি বিজ্ঞাপন' + (ads.length ? ' (' + bn(on) + 'টি চালু)' : '')),
        card('articles', 'articles', bn(arts.length - web) + 'টি পত্রিকার · ' + bn(web) + 'টি শুধু ওয়েবসাইটে'),
        card('taxonomy', 'issues', bn(iss.length) + 'টি সংখ্যা'),
        card('taxonomy', 'authors', bn(au.length) + ' জন লেখক'),
        card('taxonomy', 'categories', bn(cat.length) + 'টি বিভাগ'),
        card('media', 'media', bn(cards) + ' কার্ড · ' + bn(graphs) + ' ইনফোগ্রাফিক'),
        card('avmedia', 'avmedia', bn(med.length) + 'টি আইটেম'),
        card('feedback', 'feedback', bn(fb) + 'টি অনুভূতি'),
        card('outlets', 'outlets', bn(ag) + ' এজেন্ট · ' + bn(mak) + ' মাকতাবা'),
        card('ads', 'ads', bn(ads.length) + 'টি বিজ্ঞাপন'),
        card('pages', 'qa', bn(arr(m.qa).length) + 'টি প্রকাশিত উত্তর')
      ];
      renderBadges();
    });
  }

  /* ---------------- ২) এক-ফাইলের মেনুতে সরাসরি সম্পাদনায় ---------------- */
  var SINGLE = { articles: 'articles', media: 'media', avmedia: 'avmedia', feedback: 'feedback', outlets: 'outlets', ads: 'ads', settings: 'site' };
  var lastHash = location.hash;
  function onRoute() {
    var m = location.hash.match(/^#\/collections\/([^/?]+)\/?$/);
    var prevWasEditor = /\/entries\//.test(lastHash);
    var fromMenu = lastHash !== location.hash && /^#\/collections\/[^/]+\/?$/.test(lastHash);   // মেনু থেকে চাপা
    lastHash = location.hash;
    if (m && SINGLE[m[1]] && fromMenu) {                 // প্রথম খোলার সময় বা সম্পাদনা থেকে ← চাপলে ফেরত পাঠাব না
      location.replace('#/collections/' + m[1] + '/entries/' + SINGLE[m[1]]);
      return;
    }
    if (!/\/entries\//.test(location.hash)) refreshCounts(prevWasEditor);  // সেভ করে ফিরলে নতুন গণনা
  }
  window.addEventListener('hashchange', onRoute);
  setTimeout(onRoute, 0);
  refreshCounts();


  /* ---------------- ৫) কে কে প্যানেলে সক্রিয় (Supabase Realtime Presence) ----------------
     শুধু GitHub নাম, ছবি আর কোন পাতা খোলা — এর বেশি কিছু পাঠানো হয় না। */
  var LABEL = {
    articles: ['লেখাসমূহ', { articles: 'লেখা' }],
    taxonomy: ['সংখ্যা, লেখক ও বিভাগ', { issues: 'সংখ্যাসমূহ', authors: 'লেখকবৃন্দ', categories: 'বিভাগসমূহ' }],
    media: ['দাওয়াহ কার্ড ও ইনফোগ্রাফিক্স', {}], avmedia: ['ভিডিও ও অডিও', {}],
    pages: ['পাতার লেখা', { about: 'আমাদের সম্পর্কে', quotes: 'স্বাগত বাণী', qa: 'ওয়েবসাইটে পাঠানো প্রশ্নের উত্তর' }],
    feedback: ['পাঠকের অনুভূতি', {}], outlets: ['এজেন্ট ও মাকতাবা', {}], ads: ['বিজ্ঞাপন', {}], settings: ['যোগাযোগ ও পেমেন্ট', {}]
  };
  // একই ফাইল একাধিক মেনু থেকে খোলা যায় — সংঘাত বোঝার জন্য আসল ফাইল ধরে মেলানো
  var FILE = { 'media/media': 'media.json', 'avmedia/avmedia': 'media.json', 'pages/qa': 'media.json' };
  function fileOf(c, e) { return FILE[c + '/' + e] || (c + '/' + e); }
  function whereText(st) {
    if (!st.coll) return 'মূল পাতায়';
    var L = LABEL[st.coll] || [st.coll, {}];
    var t = L[0] + (st.entry && L[1][st.entry] && L[1][st.entry] !== L[0] ? ' › ' + L[1][st.entry] : '');
    return (st.entry ? '✎ ' : '') + t + (st.detail ? ' › ' + st.detail : '');
  }
  function sinceText(t) {
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? 'এইমাত্র' : bn(m) + ' মিনিট ধরে';
  }
  function decapUser() {
    if (window.__AD_PRESENCE_ME) return window.__AD_PRESENCE_ME;    // শুধু প্রিভিউর জন্য
    try { var u = JSON.parse(localStorage.getItem('decap-cms-user') || 'null'); return u && (u.login || u.name) ? u : null; } catch (e) { return null; }
  }
  var TAB = Math.random().toString(36).slice(2, 8), OTHERS = [], ME = null, CH = null, DETAIL = '', SINCE = Date.now(), dismissed = '';

  function myState() {
    var m = location.hash.match(/^#\/collections\/([^/?]+)(?:\/entries\/([^/?]+))?/) || [];
    return { login: ME.login || ME.name, name: ME.name || ME.login, avatar: ME.avatar_url || '', coll: m[1] || '', entry: m[2] || '',
      detail: m[2] ? DETAIL : '', t: SINCE };
  }

  var ui = document.createElement('div');
  ui.innerHTML = '<div id="pr-badge" hidden><button type="button" id="pr-btn" aria-expanded="false"><span class="pr-live"></span><span class="pr-dots"></span><span id="pr-count"></span></button><div id="pr-list"></div></div>' +
    '<div id="pr-warn" role="status" hidden></div>';
  document.body.appendChild(ui);
  var badge = ui.querySelector('#pr-badge'), btn = ui.querySelector('#pr-btn'), list = ui.querySelector('#pr-list'), warn = ui.querySelector('#pr-warn');
  btn.onclick = function (e) { e.stopPropagation(); var o = badge.classList.toggle('open'); btn.setAttribute('aria-expanded', o); };
  document.addEventListener('click', function (e) { if (!badge.contains(e.target)) { badge.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });

  function av(u, cls) {
    var ini = String(u.name || '?').trim().slice(0, 1).toUpperCase();
    return u.avatar ? '<img class="' + cls + '" src="' + u.avatar.replace(/"/g, '') + '" alt="">' : '<span class="' + cls + '">' + ini.replace(/</g, '') + '</span>';
  }
  function htmlEsc(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderPresence() {
    if (!ME) { badge.hidden = true; warn.hidden = true; return; }
    // একই মানুষ কয়েকটি ট্যাবে থাকলে একবারই গণনা
    var people = {}; OTHERS.forEach(function (o) { if (!people[o.login] || o.entry) people[o.login] = o; });
    var ppl = Object.keys(people).map(function (k) { return people[k]; });
    var meState = myState();
    badge.hidden = false;
    btn.querySelector('.pr-dots').innerHTML = [meState].concat(ppl).slice(0, 5).map(function (u) { return av(u, 'pr-av'); }).join('');
    ui.querySelector('#pr-count').textContent = ppl.length ? 'এখন ' + bn(ppl.length + 1) + ' জন সক্রিয়' : 'শুধু আপনি সক্রিয়';
    list.innerHTML = ppl.map(function (u) {
      return '<div class="pr-row">' + av(u, 'pr-av pr-av--lg') + '<div><b>' + htmlEsc(u.name) + '</b><small>' + htmlEsc(whereText(u)) + ' · ' + sinceText(u.t) + '</small></div></div>';
    }).join('') + '<div class="pr-row">' + av(meState, 'pr-av pr-av--lg') + '<div><b>আপনি</b><small>' + htmlEsc(whereText(meState)) + '</small></div></div>';

    // মেনু ও ফাইল-কার্ডে "✎ নাম"
    PRES = {};
    ppl.forEach(function (u) {
      if (!u.coll) return;
      var k1 = sideSel(u.coll), k2 = u.entry ? cardSel(u.coll, u.entry) : null;
      PRES[k1] = PRES[k1] ? PRES[k1] + ', ' + u.name : u.name;
      if (k2) PRES[k2] = PRES[k2] ? PRES[k2] + ', ' + u.name : u.name + ' খুলে রেখেছেন';
    });
    renderBadges();

    // একই ফাইল অন্য কেউ খুলে রাখলে সতর্কবার্তা
    var clash = meState.entry && ppl.filter(function (u) { return u.entry && fileOf(u.coll, u.entry) === fileOf(meState.coll, meState.entry); });
    var key = clash && clash.length ? fileOf(meState.coll, meState.entry) + ':' + clash.map(function (u) { return u.login; }).join(',') : '';
    if (key && key !== dismissed) {
      var names = clash.map(function (u) { return '<b>' + htmlEsc(u.name) + '</b>' + (u.detail ? ' (' + htmlEsc(u.detail) + ')' : ''); }).join(', ');
      var extra = meState.coll === 'articles' ? ' সব লেখা একটি ফাইলেই থাকে, তাই আলাদা লেখা হলেও একসাথে সেভ করলে একজনের পরিবর্তন মুছে যেতে পারে।'
        : ' একসাথে সেভ করলে একজনের পরিবর্তন মুছে যেতে পারে।';
      warn.innerHTML = '<button type="button" aria-label="বন্ধ">✕</button>' + names + ' এটি এখন খুলে রেখেছেন।' + extra + ' সেভের আগে কথা বলে নিন।';
      warn.hidden = false;
      warn.querySelector('button').onclick = function () { dismissed = key; warn.hidden = true; };
    } else warn.hidden = true;
  }

  function track() { if (CH && ME) CH.track(myState()); renderPresence(); }
  window.__adPresenceDetail = function (t) { if (t !== DETAIL) { DETAIL = t || ''; track(); } };
  window.addEventListener('hashchange', function () { DETAIL = ''; SINCE = Date.now(); badge.classList.remove('open'); track(); });

  function connect() {
    ME = decapUser();
    if (!ME) { renderPresence(); return setTimeout(connect, 3000); }    // লগইনের অপেক্ষা
    var key = (ME.login || ME.name) + ':' + TAB;
    var onSync = function (all) {
      OTHERS = all.filter(function (s) { return s && s.login && s.login !== (ME.login || ME.name); });
      renderPresence();
    };
    if (window.__AD_PRESENCE_MOCK) { CH = window.__AD_PRESENCE_MOCK(onSync); track(); return; }   // শুধু প্রিভিউর জন্য
    var S = window.SUPA || {};
    if (!S.url || !S.key) return;
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(function (mod) {
      var client = mod.createClient(S.url, S.key, { auth: { persistSession: false } });
      CH = client.channel('ad-cms-editors', { config: { presence: { key: key } } });
      CH.on('presence', { event: 'sync' }, function () {
        var st = CH.presenceState(), all = [];
        Object.keys(st).forEach(function (k) { if (k !== key) st[k].forEach(function (x) { all.push(x); }); });
        onSync(all);
      }).subscribe(function (status) { if (status === 'SUBSCRIBED') track(); });
      addEventListener('beforeunload', function () { try { CH.untrack(); CH.unsubscribe(); } catch (e) {} });
    }).catch(function (e) { console.warn('presence:', e); });
  }
  setInterval(function () { if (ME && !decapUser()) { ME = null; try { CH && CH.untrack(); } catch (e) {} renderPresence(); } else if (!badge.hidden) renderPresence(); }, 30000);
  setTimeout(connect, 1500);

  /* ---------------- ৩) লেখা বাছাইয়ের উইজেট ---------------- */
  if (!window.CMS || !window.createClass || !h) return;

  var Browser = createClass({
    getInitialState: function () { return { path: [], members: null, q: '', issues: [], cats: [] }; },
    componentDidMount: function () {
      var self = this;
      Promise.all([getContent('issues'), getContent('categories')]).then(function (r) {
        self.setState({ issues: arr((r[0] || {}).issues), cats: arr((r[1] || {}).categories) });
      });
    },
    // Decap একই মুহূর্তে পরপর দুবার onChange ডাকতে পারে; তখনো props পুরোনো থাকে, তাই নিজের কাছে সর্বশেষ কপি রাখি
    list: function () {
      if (this.pending) return this.pending.slice();
      var v = this.props.value; return v && v.toArray ? v.toArray() : [];
    },
    componentDidUpdate: function (prev) { if (prev.value !== this.props.value) this.pending = null; },
    js: function (m) { return m && m.toJS ? m.toJS() : (m || {}); },
    issueLabel: function (id) {
      var i = this.state.issues.filter(function (x) { return x.id === id; })[0];
      return i ? i.label : id;
    },
    catName: function (id) {
      var c = this.state.cats.filter(function (x) { return x.id === id; })[0];
      return c ? c.name : (id || 'বিভাগ দেওয়া নেই');
    },
    /* কোন ঘরে কোন লেখা — ঢোকার সময় একবার ঠিক হয়; সম্পাদনার মাঝে সংখ্যা বদলালেও লেখা হারাবে না */
    enter: function (step) {
      var self = this, items = this.list().map(this.js), idx = [];
      items.forEach(function (a, i) {
        var ok = step.t === 'all' ? true
          : step.t === 'issue' ? (!isWeb(a) && a.issue === step.id)
          : step.t === 'cat' ? (isWeb(a) && (a.cat || '') === step.id)
          : step.t === 'one' ? i === step.i : false;
        if (ok) idx.push(i);
      });
      var path = step.t === 'cat' ? [{ t: 'web', label: 'শুধু ওয়েবসাইটে' }, step] : step.t === 'web' ? [step] : [step];
      if (step.t === 'cat' && this.state.path.length) path = this.state.path.concat([step]);
      this.mem = step.t === 'web' ? null : idx;
      this.setState({ path: path, members: this.mem, q: '' });
      if (window.__adPresenceDetail) window.__adPresenceDetail(step.t === 'issue' ? step.label : step.t === 'cat' ? 'শুধু ওয়েবসাইটে › ' + step.label : step.t === 'one' ? step.label : '');
    },
    back: function () {
      if (!this.okToLeave()) return;
      var p = this.state.path.slice(0, -1);
      this.mem = null;
      this.setState({ path: p, members: null, q: '' });
      if (window.__adPresenceDetail) window.__adPresenceDetail('');
    },
    okToLeave: function () {
      var full = this.list(), self = this, mem = this.mem || [];
      var bad = mem.filter(function (i) { return full[i] && incomplete(self.js(full[i])); }).length;
      return !bad || window.confirm('এই তালিকার ' + bn(bad) + 'টি লেখা অসম্পূর্ণ (শিরোনাম, লিংক-নাম বা বিভাগ নেই)। অসম্পূর্ণ লেখা সেভ হলে সাইটে গোলমাল হতে পারে।\n\nতবুও ফিরে যাবেন?');
    },
    home: function () { if (this.state.members && !this.okToLeave()) return; this.mem = null; this.setState({ path: [], members: null, q: '' }); },
    /* ছোট তালিকায় পরিবর্তন → পুরো তালিকায় বসানো */
    subChange: function (sub, meta) {
      var full = this.list(), mem = (this.mem || this.state.members).slice(), oldSub = mem.map(function (i) { return full[i]; });
      var neu = sub && sub.toArray ? sub.toArray() : [];
      var step = this.state.path[this.state.path.length - 1] || {};
      var self = this;
      function withDefaults(m) {   // নতুন খালি লেখায় ঘর অনুযায়ী সংখ্যা/বিভাগ বসিয়ে দেওয়া
        var o = self.js(m);
        if (o.title || o.id) return m;
        if (step.t === 'issue') return m.set('issue', step.id).set('kind', 'magazine');
        if (step.t === 'cat') { m = m.set('kind', 'web'); return step.id ? m.set('cat', step.id) : m; }
        return m;
      }
      var next;
      if (neu.length === oldSub.length) {                      // সম্পাদনা বা ক্রম বদল
        next = full.slice(); mem.forEach(function (fi, k) { next[fi] = neu[k]; });
      } else if (neu.length === oldSub.length + 1) {           // নতুন লেখা
        var at = 0; while (at < oldSub.length && oldSub[at] === neu[at]) at++;
        var added = withDefaults(neu[at]);
        next = full.slice();
        var pos = at < mem.length ? mem[at] : (mem.length ? mem[mem.length - 1] + 1 : full.length);
        next.splice(pos, 0, added);
        mem = mem.map(function (fi) { return fi >= pos ? fi + 1 : fi; });
        mem.splice(at, 0, pos);
        neu.forEach(function (x, k) { next[mem[k]] = k === at ? added : x; });
      } else if (neu.length === oldSub.length - 1) {           // মুছে ফেলা
        var rm = 0; while (rm < neu.length && oldSub[rm] === neu[rm]) rm++;
        var gone = mem[rm];
        next = full.slice(); next.splice(gone, 1);
        mem.splice(rm, 1);
        mem = mem.map(function (fi) { return fi > gone ? fi - 1 : fi; });
        neu.forEach(function (x, k) { next[mem[k]] = x; });
      } else {                                                 // অপ্রত্যাশিত — নিরাপদে পুরোটা বসানো
        var keep = full.filter(function (_, i) { return mem.indexOf(i) < 0; });
        var first = mem.length ? mem[0] : keep.length;
        next = keep.slice(0, first).concat(neu, keep.slice(first));
        mem = neu.map(function (_, k) { return first + k; });
      }
      this.mem = mem; this.pending = next;
      this.setState({ members: mem });
      var base = this.props.value && this.props.value.clear ? this.props.value.clear() : sub.clear();
      this.props.onChange(base.concat(next), meta);
    },
    bucketsRoot: function (items) {
      var self = this, rows = [];
      var byIssue = {};
      items.forEach(function (a) { if (!isWeb(a)) byIssue[a.issue] = (byIssue[a.issue] || 0) + 1; });
      var known = {};
      this.state.issues.slice().reverse().forEach(function (i) {        // নতুন সংখ্যা আগে
        known[i.id] = 1;
        if (!i.published && !byIssue[i.id]) return;
        rows.push({ step: { t: 'issue', id: i.id, label: i.label }, label: i.label, sub: i.published ? (i.greg || '') : 'অপ্রকাশিত', n: byIssue[i.id] || 0,
          bad: items.filter(function (a) { return !isWeb(a) && a.issue === i.id && incomplete(a); }).length });
      });
      Object.keys(byIssue).forEach(function (id) {
        if (!known[id] && self.state.issues.length) rows.push({ step: { t: 'issue', id: id, label: id }, label: id, sub: 'এই সংখ্যাটি তালিকায় নেই', n: byIssue[id] });
      });
      rows.push({ step: { t: 'web', label: 'শুধু ওয়েবসাইটে' }, label: 'শুধু ওয়েবসাইটে প্রকাশিত', sub: 'বিভাগ অনুযায়ী', n: items.filter(isWeb).length, web: true,
        bad: items.filter(function (a) { return isWeb(a) && incomplete(a); }).length });
      return rows;
    },
    bucketsWeb: function (items) {
      var counts = {}, rows = [], self = this;
      items.forEach(function (a) { if (isWeb(a)) counts[a.cat || ''] = (counts[a.cat || ''] || 0) + 1; });
      this.state.cats.forEach(function (c) {
        rows.push({ step: { t: 'cat', id: c.id, label: c.name }, label: c.name, n: counts[c.id] || 0,
          bad: items.filter(function (a) { return isWeb(a) && a.cat === c.id && incomplete(a); }).length });
        delete counts[c.id];
      });
      Object.keys(counts).forEach(function (id) {
        rows.push({ step: { t: 'cat', id: id, label: self.catName(id) }, label: self.catName(id), n: counts[id],
          bad: items.filter(function (a) { return isWeb(a) && (a.cat || '') === id && incomplete(a); }).length });
      });
      return rows;
    },
    renderNav: function () {
      var self = this, items = this.list().map(this.js), p = this.state.path, q = this.state.q.trim().toLowerCase();
      var head = h('div', { className: 'ab-head' },
        h('span', { className: 'ab-total' }, 'মোট ' + bn(items.length) + 'টি লেখা'),
        h('button', { type: 'button', className: 'ab-link', onClick: function () { self.enter({ t: 'all', label: 'সব লেখা' }); } }, 'সব একসাথে দেখুন'));
      var search = h('input', {
        type: 'search', className: 'ab-search', value: this.state.q,
        placeholder: p.length ? 'এখানে লেখার নাম খুঁজুন…' : 'যেকোনো লেখার নাম লিখে খুঁজুন…',
        onChange: function (e) { self.setState({ q: e.target.value }); }
      });
      var rows;
      if (q) {
        rows = items.map(function (a, i) { return { a: a, i: i }; })
          .filter(function (x) { return String(x.a.title || '').toLowerCase().indexOf(q) > -1; })
          .map(function (x) {
            var where = isWeb(x.a) ? 'শুধু ওয়েবসাইটে › ' + self.catName(x.a.cat) : self.issueLabel(x.a.issue);
            return h('button', { type: 'button', key: 'r' + x.i, className: 'ab-row', onClick: function () { self.enter({ t: 'one', i: x.i, label: x.a.title }); } },
              h('span', { className: 'ab-l' }, x.a.title || '(শিরোনাম নেই)', h('small', null, where)), h('span', { className: 'ab-chev' }, '›'));
          });
        if (!rows.length) rows = h('div', { className: 'ab-empty' }, 'কিছু পাওয়া যায়নি');
      } else {
        var list = p.length ? this.bucketsWeb(items) : this.bucketsRoot(items);
        rows = list.map(function (b, k) {
          return h('button', { type: 'button', key: 'b' + k, className: 'ab-row' + (b.web ? ' ab-web' : ''), onClick: function () { self.enter(b.step); } },
            h('span', { className: 'ab-l' }, b.label, b.sub ? h('small', null, b.sub) : null),
            b.bad ? h('span', { className: 'ab-bad', title: 'শিরোনাম, লিংক-নাম বা বিভাগ নেই' }, '⚠ ' + bn(b.bad) + 'টি অসম্পূর্ণ') : null,
            h('span', { className: 'ab-n' }, bn(b.n) + 'টি'), h('span', { className: 'ab-chev' }, '›'));
        });
      }
      var crumbs = p.length ? h('div', { className: 'ab-crumbs' },
        h('button', { type: 'button', className: 'ab-link', onClick: this.home }, '‹ সব লেখা'), h('span', null, ' › শুধু ওয়েবসাইটে প্রকাশিত')) : null;
      return h('div', { className: 'ab' }, head, crumbs, search, h('div', { className: 'ab-list' }, rows));
    },
    render: function () {
      var self = this, p = this.state.path, last = p[p.length - 1];
      if (!this.state.members) {
        return h('div', { id: this.props.forID, className: this.props.classNameWrapper }, this.renderNav());
      }
      var full = this.list(), mem = this.mem || this.state.members;
      var sub = (this.props.value && this.props.value.clear ? this.props.value.clear() : null);
      sub = sub ? sub.concat(mem.map(function (i) { return full[i]; })) : null;
      var List = this.props.resolveWidget('list').control;
      var title = last.t === 'issue' ? last.label : last.t === 'cat' ? 'শুধু ওয়েবসাইটে › ' + last.label : last.t === 'one' ? 'খোঁজার ফল' : 'সব লেখা';
      var props = {};
      for (var k in this.props) props[k] = this.props[k];
      props.value = sub;
      props.onChange = this.subChange;
      var bar = h('div', { className: 'ab-bar' },
        h('button', { type: 'button', className: 'ab-back', onClick: this.back }, '‹ পেছনে'),
        h('span', { className: 'ab-title' }, title), h('span', { className: 'ab-n' }, bn(mem.length) + 'টি লেখা'));
      var tip = (last.t === 'issue' || last.t === 'cat')
        ? h('p', { className: 'ab-tip' }, 'নিচের “নতুন লেখা” বোতামে চাপলে লেখাটি ' + (last.t === 'issue' ? 'এই সংখ্যায়' : 'এই বিভাগে, শুধু ওয়েবসাইটের লেখা হিসেবে') + ' যোগ হবে।') : null;
      return h('div', { className: 'ab-wrap' }, bar, tip,
        h(List, Object.assign(props, { key: JSON.stringify(last) })));
    }
  });
  CMS.registerWidget('article-browser', Browser, function () { return null; });

  /* ---------------- ৪) ইনফোগ্রাফিকের "কোন লেখার সঙ্গে যুক্ত" — ধাপে ধাপে বাছাই ---------------- */
  var Picker = createClass({
    getInitialState: function () { return { open: false, path: [], q: '', d: null }; },
    componentDidMount: function () { this.load(false); },
    load: function (fresh) {
      var self = this;
      Promise.all([getContent('articles', fresh), getContent('issues'), getContent('categories')]).then(function (r) {
        self.setState({ d: { arts: arr((r[0] || {}).articles), issues: arr((r[1] || {}).issues), cats: arr((r[2] || {}).categories) } });
      });
    },
    issueLabel: function (id) { var i = this.state.d.issues.filter(function (x) { return x.id === id; })[0]; return i ? i.label : id; },
    catName: function (id) { var c = this.state.d.cats.filter(function (x) { return x.id === id; })[0]; return c ? c.name : 'বিভাগ দেওয়া নেই'; },
    crumb: function (a) { return isWeb(a) ? 'শুধু ওয়েবসাইটে › ' + this.catName(a.cat) : this.issueLabel(a.issue); },
    pick: function (a) { this.props.onChange(a.id); this.setState({ open: false, path: [], q: '' }); },
    go: function (st) { this.setState({ path: this.state.path.concat([st]), q: '' }); },
    back: function () { this.setState({ path: this.state.path.slice(0, -1), q: '' }); },
    rows: function () {
      var d = this.state.d, p = this.state.path, q = this.state.q.trim().toLowerCase(), self = this, last = p[p.length - 1];
      var arts = d.arts.filter(function (a) { return a.id && a.title; });
      if (q && !p.length) return arts.filter(function (a) { return a.title.toLowerCase().indexOf(q) > -1; })
        .map(function (a) { return { art: a, sub: self.crumb(a) }; });
      var list;
      if (!p.length) {
        list = d.issues.slice().reverse().map(function (i) {
          return { st: { t: 'issue', id: i.id, label: i.label }, label: i.label, n: arts.filter(function (a) { return !isWeb(a) && a.issue === i.id; }).length };
        }).filter(function (x) { return x.n; });
        list.push({ st: { t: 'web', label: 'শুধু ওয়েবসাইটে প্রকাশিত' }, label: 'শুধু ওয়েবসাইটে প্রকাশিত', n: arts.filter(isWeb).length, web: true });
      } else if (last.t === 'issue') {
        list = arts.filter(function (a) { return !isWeb(a) && a.issue === last.id; }).map(function (a) { return { art: a, sub: self.catName(a.cat) }; });
      } else if (last.t === 'web') {
        var cnt = {}; arts.forEach(function (a) { if (isWeb(a)) cnt[a.cat || ''] = (cnt[a.cat || ''] || 0) + 1; });
        list = Object.keys(cnt).map(function (c) { return { st: { t: 'cat', id: c, label: self.catName(c) }, label: self.catName(c), n: cnt[c] }; });
      } else {
        list = arts.filter(function (a) { return isWeb(a) && (a.cat || '') === last.id; }).map(function (a) { return { art: a }; });
      }
      if (q) list = list.filter(function (x) { return (x.art ? x.art.title : x.label).toLowerCase().indexOf(q) > -1; });
      return list;
    },
    panel: function () {
      var self = this, p = this.state.path, val = this.props.value;
      if (!this.state.d) return h('div', { className: 'ap-panel' }, h('div', { className: 'ab-empty' }, 'লোড হচ্ছে…'));
      var rows = this.rows();
      return h('div', { className: 'ap-panel' },
        h('div', { className: 'ap-head' },
          p.length ? h('button', { type: 'button', className: 'ab-link', onClick: this.back }, '‹ পেছনে') : null,
          h('span', { className: 'ap-crumbs' }, ['সব'].concat(p.map(function (x) { return x.label; })).join(' › ')),
          h('button', { type: 'button', className: 'ab-link ap-x', onClick: function () { self.setState({ open: false, path: [], q: '' }); } }, 'বন্ধ')),
        h('input', { type: 'search', className: 'ab-search', autoFocus: true, value: this.state.q,
          placeholder: p.length ? 'এখানে খুঁজুন…' : 'যেকোনো লেখার নাম লিখে খুঁজুন…', onChange: function (e) { self.setState({ q: e.target.value }); } }),
        h('div', { className: 'ab-list ap-list' }, rows.length ? rows.map(function (x, k) {
          if (x.art) return h('button', { type: 'button', key: 'a' + x.art.id, className: 'ab-row' + (x.art.id === val ? ' ap-on' : ''), onClick: function () { self.pick(x.art); } },
            h('span', { className: 'ab-l' }, x.art.title, x.sub ? h('small', null, x.sub) : null), x.art.id === val ? h('span', { className: 'ap-tick' }, '✓') : null);
          return h('button', { type: 'button', key: 'g' + k, className: 'ab-row' + (x.web ? ' ab-web' : ''), onClick: function () { self.go(x.st); } },
            h('span', { className: 'ab-l' }, x.label), h('span', { className: 'ab-n' }, bn(x.n) + 'টি'), h('span', { className: 'ab-chev' }, '›'));
        }) : h('div', { className: 'ab-empty' }, 'কিছু পাওয়া যায়নি')));
    },
    render: function () {
      var self = this, v = this.props.value, d = this.state.d;
      var sel = v && d ? (d.arts.filter(function (a) { return a.id === v; })[0] || { id: v, title: v, missing: true }) : null;
      return h('div', { id: this.props.forID, className: this.props.classNameWrapper },
        h('div', { className: 'ap-box' },
          v ? h('div', { className: 'ap-sel' },
                h('small', null, !d ? '' : sel.missing ? '⚠ এই লেখাটি আর তালিকায় নেই' : this.crumb(sel)),
                h('span', null, sel ? sel.title : v))
            : h('span', { className: 'ap-ph' }, 'কোনো লেখা যুক্ত নেই'),
          h('div', { className: 'ap-actions' },
            h('button', { type: 'button', className: 'ap-btn', onClick: function () { if (!self.state.open) self.load(true); self.setState({ open: !self.state.open, path: [], q: '' }); } }, v ? 'বদলান' : 'লেখা বাছুন'),
            v ? h('button', { type: 'button', className: 'ap-btn ap-clear', onClick: function () { self.props.onChange(''); } }, 'মুছুন') : null)),
        this.state.open ? this.panel() : null);
    }
  });
  CMS.registerWidget('article-picker', Picker, function () { return null; });
})();

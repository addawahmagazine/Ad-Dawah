/* =========================================================================
   আদ দাওয়াহ — assets/auth.js

   লগইন, বুকমার্ক, পাঠকের প্রশ্ন, পঠিত সংখ্যা ও ভিজিটর গণনা।
   assets/config.js ফাঁকা থাকলে পুরো অংশটি নীরবে বন্ধ থাকে।
   ========================================================================= */

const CFG = window.SUPA || { url: '', key: '' };
const ENABLED = !!(CFG.url && CFG.key);

const AD = {
  enabled: ENABLED,
  ready: null,
  client: null,
  user: null,
  bookmarks: new Set(),
  stats: {},            // { articleId: views }
  visits: { today: 0, total: 0, online: 0 },
  isAdmin: false,
  purchases: [],          // নিজের অর্ডার
  listeners: []
};
window.AD = AD;

const emit = () => AD.listeners.forEach(fn => { try { fn(AD); } catch (e) { console.error(e); } });
AD.onChange = fn => { AD.listeners.push(fn); fn(AD); };

/* ---------------------------------------------------------------- সূচনা */
AD.ready = (async () => {
  if (!ENABLED) return AD;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    AD.client = createClient(CFG.url, CFG.key);

    const { data: { session } } = await AD.client.auth.getSession();
    AD.user = session?.user || null;

    AD.client.auth.onAuthStateChange(async (_e, s) => {
      AD.user = s?.user || null;
      await Promise.all([loadBookmarks(), loadAccountExtras()]);
      emit();
    });

    await Promise.all([loadBookmarks(), loadStats(), loadAccountExtras()]);
    recordVisit();
    trackOnline();
  } catch (err) {
    console.error('Supabase সংযোগ ব্যর্থ:', err);
    AD.enabled = false;
  }
  emit();
  return AD;
})();

/* ------------------------------------------------------------ অ্যাকাউন্ট */
AD.signUp = async (email, password, name) => {
  const { data, error } = await AD.client.auth.signUp({
    email, password, options: { data: { name } }
  });
  if (error) throw error;
  return data;
};

AD.signIn = async (email, password) => {
  const { data, error } = await AD.client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

AD.resetPassword = async email => {
  const { error } = await AD.client.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname
  });
  if (error) throw error;
};

AD.signOut = async () => {
  await AD.client.auth.signOut();
  AD.user = null;
  AD.bookmarks = new Set();
  emit();
};

AD.userName = () =>
  AD.user?.user_metadata?.name || (AD.user?.email || '').split('@')[0] || '';

/* -------------------------------------------------------------- বুকমার্ক */
async function loadBookmarks(){
  AD.bookmarks = new Set();
  if (!AD.client || !AD.user) return;
  const { data, error } = await AD.client.from('bookmarks').select('article_id');
  if (!error && data) AD.bookmarks = new Set(data.map(r => r.article_id));
}

AD.isBookmarked = id => AD.bookmarks.has(id);

AD.toggleBookmark = async id => {
  if (!AD.user) throw new Error('লগইন প্রয়োজন');
  if (AD.bookmarks.has(id)) {
    const { error } = await AD.client.from('bookmarks')
      .delete().eq('user_id', AD.user.id).eq('article_id', id);
    if (error) throw error;
    AD.bookmarks.delete(id);
  } else {
    const { error } = await AD.client.from('bookmarks')
      .insert({ user_id: AD.user.id, article_id: id });
    if (error) throw error;
    AD.bookmarks.add(id);
  }
  emit();
  return AD.bookmarks.has(id);
};

/* ---------------------------------------------------------------- প্রশ্ন */
AD.submitQuestion = async ({ name, email, topic, body }) => {
  if (!AD.client) return null;
  const row = { name: name || null, email: email || null, topic: topic || null, body };
  if (AD.user) row.user_id = AD.user.id;
  const { error } = await AD.client.from('questions').insert(row);
  if (error) throw error;
};

AD.myQuestions = async () => {
  if (!AD.client || !AD.user) return [];
  const { data, error } = await AD.client.from('questions')
    .select('id, topic, body, answer, answered, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

/* --------------------------------------------------------- পঠিত সংখ্যা */
async function loadStats(){
  if (!AD.client) return;
  const { data, error } = await AD.client.from('article_stats').select('article_id, views');
  if (!error && data) {
    AD.stats = {};
    data.forEach(r => { AD.stats[r.article_id] = Number(r.views) || 0; });
  }
}

AD.views = id => AD.stats[id] || 0;

const bumped = new Set();
AD.bumpView = async id => {
  if (!AD.client || bumped.has(id)) return;
  bumped.add(id);
  AD.stats[id] = (AD.stats[id] || 0) + 1;
  emit();
  const { error } = await AD.client.rpc('bump_view', { aid: id });
  if (error) console.error('পঠিত গণনা ব্যর্থ:', error);
};

/* ------------------------------------------------------------ ভিজিটর */
async function recordVisit(){
  if (!AD.client) return;
  try {
    await AD.client.from('visits').insert({});
  } catch (e) { /* গণনা ব্যর্থ হলে সাইট থামবে না */ }
  await refreshVisitCounts();
}

async function refreshVisitCounts(){
  if (!AD.client) return;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const [t, a] = await Promise.all([
    AD.client.from('visits').select('*', { count: 'exact', head: true }).eq('day', today),
    AD.client.from('visits').select('*', { count: 'exact', head: true })
  ]);
  AD.visits.today = t.count || 0;
  AD.visits.total = a.count || 0;
  emit();
}

function trackOnline(){
  if (!AD.client) return;
  const ch = AD.client.channel('online-readers', {
    config: { presence: { key: Math.random().toString(36).slice(2) } }
  });
  const count = () => {
    AD.visits.online = Object.keys(ch.presenceState()).length;
    emit();
  };
  ch.on('presence', { event: 'sync' }, count)
    .on('presence', { event: 'join' }, count)
    .on('presence', { event: 'leave' }, count)
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') await ch.track({ at: Date.now() });
    });
  addEventListener('beforeunload', () => { try { ch.unsubscribe(); } catch (e) {} });
}


/* =========================================================================
   পিডিএফ ক্রয়
   ========================================================================= */
async function loadAccountExtras(){
  AD.isAdmin = false;
  AD.purchases = [];
  if (!AD.client || !AD.user) return;

  const [adm, pur] = await Promise.all([
    AD.client.rpc('is_admin'),
    AD.client.from('purchases')
      .select('id, issue_id, issue_label, amount, method, trxid, status, note, created_at')
      .order('created_at', { ascending: false })
  ]);
  AD.isAdmin  = adm.data === true;
  AD.purchases = pur.data || [];
}

AD.refreshPurchases = async () => { await loadAccountExtras(); emit(); };

AD.hasIssue = issueId =>
  AD.purchases.some(p => p.issue_id === issueId && p.status === 'approved');

AD.issueStatus = issueId => {
  const rows = AD.purchases.filter(p => p.issue_id === issueId);
  if (rows.some(p => p.status === 'approved')) return 'approved';
  if (rows.some(p => p.status === 'pending'))  return 'pending';
  if (rows.some(p => p.status === 'rejected')) return 'rejected';
  return null;
};

AD.buyIssue = async ({ issue_id, issue_label, amount, method, trxid }) => {
  if (!AD.user) throw new Error('লগইন প্রয়োজন');
  const { error } = await AD.client.from('purchases').insert({
    user_id: AD.user.id, issue_id, issue_label, amount, method, trxid, status: 'pending'
  });
  if (error) throw error;
  await AD.refreshPurchases();
};

/* সুরক্ষিত ডাউনলোড — ১০ মিনিটের জন্য একটি সাময়িক লিংক */
AD.pdfLink = async issueId => {
  const { data, error } = await AD.client.storage
    .from('issues')
    .createSignedUrl(`${issueId}.pdf`, 600, { download: `ad-dawah-${issueId}.pdf` });
  if (error) throw error;
  return data.signedUrl;
};

/* ---------------------------------------------------------- প্রশাসকের কাজ */
AD.allPurchases = async (status = 'pending') => {
  if (!AD.isAdmin) return [];
  let q = AD.client.from('purchases')
    .select('id, user_id, issue_id, issue_label, amount, method, trxid, status, note, created_at')
    .order('created_at', { ascending: false });
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

AD.decide = async (id, status, note) => {
  if (!AD.isAdmin) throw new Error('অনুমতি নেই');
  const { error } = await AD.client.from('purchases')
    .update({ status, note: note || null, decided_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

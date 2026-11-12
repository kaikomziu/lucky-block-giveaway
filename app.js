// ラッキーブロック配布所（非公式）
// データは共有 Supabase の lbd_* RPC。ログインはかるわかGAMESアカウント（window.KaAccount）
(() => {
  'use strict';
  const SUPABASE_URL = 'https://kifnzvktwbomxthzvvgy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Ea_sHRg6wMwO9YkDTjgOog_stQT1mfq';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  // オープンチャット「ラッキーブロックを打つやってる人きてー」
  const OPENCHAT_URL = 'https://line.me/ti/g2/CtzIkqvq1XBZB7mz6o0fwv7GbezWdMaduF-5LQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';
  const SITE_URL = 'https://kaikomziu.github.io/lucky-block-giveaway/';
  const OPENCHAT_HTML = `<a class="oc" href="${OPENCHAT_URL}" target="_blank" rel="noopener">
      <span class="oc-icon">💬</span>
      <span class="oc-text"><small>オープンチャット（LINE）</small><b>「ラッキーブロックを打つやってる人きてー」</b><em>配布の宣伝・雑談OK！いっしょに遊ぶ仲間を見つけよう</em></span>
      <span class="oc-go">参加する ›</span></a>`;
  const ka = window.KaAccount || null;
  const $ = id => document.getElementById(id);
  const app = $('app');

  // ---------- 通信 ----------
  async function rpc(fn, body = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${fn}: ${res.status}`);
    return res.json();
  }
  const token = () => (ka ? ka.token() : null);

  const REASONS = {
    auth: 'ログインが必要です（期限が切れたかもしれません）。',
    need_roblox: '先に Roblox アカウントと連携してください。',
    body: '文章は1〜500文字で書いてください。',
    winners: '当たる人数は1〜50人にしてください。',
    deadline: '締め切りは、今から5分後〜60日後のあいだにしてください。',
    video: '動画は YouTube のリンク（https://www.youtube.com/… か https://youtu.be/…）だけ貼れます。',
    too_many_open: '受付中の配布は1人5件までです。終わったものを抽選してから新しく出してください。',
    too_many_today: '配布の投稿は1日10件までです。',
    closed: 'この配布はもう受付を締め切りました。',
    own: '自分の配布には「ほしい！」できません。',
    forbidden: 'この操作はできません。',
    already: 'もう抽選済みです（回し直しはできません）。',
    no_entrants: 'まだ「ほしい！」した人がいません。',
    not_found: '見つかりませんでした（消された可能性があります）。',
    no_code: '合言葉の期限（30分）が切れました。もう一度「合言葉を出す」を押してください。',
    too_many: '確認の回数が多すぎます。10分ほど待ってからもう一度どうぞ。',
    code_not_found: 'プロフィールの自己紹介に合言葉が見つかりませんでした。保存できているか、少し待ってからもう一度押してください。',
    roblox_not_found: 'その名前の Roblox アカウントが見つかりません。表示名ではなく「ユーザー名（@のあと）」を入れてください。',
    bad_username: 'Roblox のユーザー名は、英数字と _ で3〜20文字です。',
    roblox_error: 'Roblox に問い合わせできませんでした。少し待ってからもう一度どうぞ。',
    state: 'いまの状態ではできません。',
    reason: '通報の理由を1〜200文字で書いてください。',
    blocked: 'この配布をした人にブロックされているため、参加できません。',
    not_winner: '当たった人だけが「受け取った」を押せます。',
    ext_empty: '追加する人の名前を入れてください。',
    ext_batch: '一度に追加できるのは50人までです。',
    ext_full: 'サイト外の人は、1つの配布に300人までです。',
    ext_name: '名前は1〜30文字にしてください。',
    ext_roblox: 'Roblox のユーザー名は、英数字と _ で3〜20文字です。',
  };
  const reasonText = r => REASONS[r] || 'うまくいきませんでした。もう一度ためしてください。';

  // ---------- 小物 ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = iso => {
    if (!iso) return '';
    const d = new Date(iso), w = '日月火水木金土'[d.getDay()];
    return `${d.getMonth() + 1}/${d.getDate()}(${w}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const leftText = iso => {
    const ms = new Date(iso) - Date.now();
    if (ms <= 0) return '締め切り';
    const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d >= 1) return `あと${d}日${h % 24}時間`;
    if (h >= 1) return `あと${h}時間${m % 60}分`;
    return `あと${Math.max(1, m)}分`;
  };
  // datetime-local 用の「ローカル時刻の文字列」
  const toLocalInput = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); toast('コピーしました'); } catch { toast('コピーできませんでした'); }
  }
  function badgeHtml(b) {
    if (b === 'official') return '<span class="badge official">👑 公認</span>';
    if (b === 'verified') return '<span class="badge verified">✅ 承認済み</span>';
    return '<span class="badge none">未連携</span>';
  }
  function statusOf(p) {
    if (p.status === 'removed') return ['removed', '削除済み'];
    if (p.status === 'done') return ['done', '配布済み'];
    if (p.status === 'drawn') return ['drawn', '抽選済み'];
    if (new Date(p.deadline) <= new Date()) return ['closed', '締め切り（抽選待ち）'];
    return ['open', '受付中'];
  }
  function youtubeEmbed(url) {
    try {
      const u = new URL(url); let id = '';
      if (u.hostname.endsWith('youtu.be')) id = u.pathname.slice(1);
      else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2];
      else id = u.searchParams.get('v') || '';
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    } catch { return null; }
  }

  // ---------- 効果音（Web Audio で合成。ファイルは使わない） ----------
  let soundOn = localStorage.getItem('lbd_sound') !== 'off';
  let actx = null;
  function audio() {
    if (!soundOn) return null;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch { return null; }
    return actx;
  }
  function beep(freq, dur, type = 'square', vol = 0.06, when = 0) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const sfx = {
    tick: () => beep(1400, 0.035, 'square', 0.035),
    win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.22, 'triangle', 0.09, i * 0.09)),
    pop: () => beep(880, 0.08, 'sine', 0.06),
  };

  // ---------- 紙吹雪 ----------
  function confetti(ms = 2600) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'confetti';
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    const cols = ['#ffc21a', '#ff4d5e', '#3478f6', '#17b26a', '#8b5cf6', '#ff8a1f'];
    const ps = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    const step = now => {
      const t = now - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - ms + 700) / 700);
      for (const p of ps) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); ctx.restore();
      }
      if (t < ms) requestAnimationFrame(step); else c.remove();
    };
    requestAnimationFrame(step);
  }

  // LINE の「送る」画面を開くURL（文章とリンクが入った状態になる）
  function postUrl(id) { return `${SITE_URL}#/p/${id}`; }
  function lineShareUrl(p) {
    const body = p.body.length > 80 ? p.body.slice(0, 79) + '…' : p.body;
    const st = statusOf(p)[0];
    const lines = st === 'open'
      ? [`🎁【配布】${body}`, `⏰ 締め切り ${fmtDate(p.deadline)}／🏆 ${p.winners}人当たり`, '「ほしい！」はここから👇', postUrl(p.id)]
      : [`🎡【抽選結果】${body}`, postUrl(p.id)];
    return 'https://line.me/R/share?text=' + encodeURIComponent(lines.join('\n'));
  }

  // ---------- モーダル ----------
  function openModal(html) { $('modalBody').innerHTML = html; $('modal').classList.remove('hidden'); }
  function closeModal() { $('modal').classList.add('hidden'); $('modalBody').innerHTML = ''; }
  $('modal').addEventListener('click', e => { if (e.target === $('modal') || e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').classList.contains('hidden')) closeModal(); });

  // ---------- 自分の状態 ----------
  let me = null; // lbd_me の結果（ログインしていなければ null）
  async function loadMe() {
    const t = token();
    if (!t) { me = null; return; }
    try { const r = await rpc('lbd_me', { p_token: t }); me = r.ok ? r : null; } catch { me = null; }
  }
  function updateHeader() {
    const u = ka?.user();
    $('accountBtn').innerHTML = u ? `${esc(u.avatar || '👤')} <span class="acc-t">${esc(u.display_name)}</span>` : '👤 ログイン';
    $('adminLink').classList.toggle('hidden', !me?.is_admin);
    $('bellBtn').classList.toggle('hidden', !u);
  }
  // ログイン中はマイページへ、していなければログイン画面
  $('accountBtn').addEventListener('click', () => {
    if (!ka) { toast('アカウント機能を読み込めませんでした（オフラインかもしれません）'); return; }
    const u = ka.user();
    if (u) location.hash = `#/u/${encodeURIComponent(u.username)}`; else ka.openPanel();
  });

  // ---------- 通知（ベル） ----------
  let notifs = { items: [], unread: 0, need_draw: 0 };
  async function loadNotifs() {
    const t = token();
    if (!t) { notifs = { items: [], unread: 0, need_draw: 0 }; renderBell(); return; }
    try { const r = await rpc('lbd_notifications', { p_token: t }); if (r.ok) notifs = r; } catch {}
    renderBell();
  }
  function renderBell() {
    const n = notifs.unread || 0;
    $('bellCount').textContent = n > 9 ? '9+' : n;
    $('bellCount').classList.toggle('hidden', !n);
    $('bellBtn').classList.toggle('ring', n > 0);
  }
  const NOTIF_TEXT = {
    won: n => ['🎉', `<b>当たりました！</b>「${esc(n.body)}」`, 'won'],
    lost: n => ['🎡', `「${esc(n.body)}」の抽選が終わりました（今回ははずれ）`, ''],
    need_draw: n => ['⏰', `<b>締め切りました。</b>「${esc(n.body)}」のルーレットを回してください`, 'warn'],
    received: n => ['📦', `${esc(n.name)}さんが「${esc(n.body)}」を受け取りました`, ''],
  };
  $('bellBtn').addEventListener('click', async () => {
    await loadNotifs();
    const seen = notifs.seen_at ? new Date(notifs.seen_at) : null;
    openModal(`<h2>🔔 お知らせ</h2>
      ${notifs.items.length ? `<ul class="notif-list">${notifs.items.map(n => {
        const [ic, text, cls] = (NOTIF_TEXT[n.type] || NOTIF_TEXT.lost)(n);
        const unread = !seen || new Date(n.at) > seen;
        return `<li><a href="#/p/${n.post_id}" class="notif ${cls} ${unread ? 'unread' : ''}" data-close><span class="notif-i">${ic}</span><span class="notif-t">${text}<small>${fmtDate(n.at)}</small></span></a></li>`;
      }).join('')}</ul>` : '<p class="empty">お知らせはまだありません。<br><small>「ほしい！」した配布の抽選が終わると、ここに出ます。</small></p>'}`);
    if (notifs.unread) { try { await rpc('lbd_notif_seen', { p_token: token() }); } catch {} notifs.unread = 0; renderBell(); }
  });
  // 1分ごとに確かめる（画面を見ているときだけ）
  setInterval(() => { if (!document.hidden && token()) loadNotifs(); }, 60000);
  async function requireLogin() {
    if (token()) return true;
    if (!ka) { toast('アカウント機能を読み込めませんでした'); return false; }
    const p = await ka.requireLogin();
    return !!p;
  }
  // ログイン＋Roblox連携が必要な操作の前に呼ぶ
  async function requireRoblox() {
    if (!(await requireLogin())) return false;
    if (!me) await loadMe();
    if (me?.roblox_id) return true;
    openLinkModal();
    return false;
  }

  // ---------- Roblox 連携（プロフィールに合言葉） ----------
  function openLinkModal() {
    const linked = me?.roblox_id;
    openModal(`
      <h2>🔗 Roblox アカウントと連携</h2>
      ${linked ? `<p>いまは <b>${esc(me.roblox_display)}</b>（@${esc(me.roblox_name)}）と連携しています。別のアカウントに変えるときも、同じ手順でできます。</p>` : ''}
      <p class="hint">本人のアカウントか確かめるため、Roblox のプロフィールの「自己紹介」に、合言葉を一時的に書いてもらいます。連携が終わったら消して大丈夫です。</p>
      <ol class="steps">
        <li><button class="btn small gold" id="lkStart">合言葉を出す</button>
          <div id="lkCodeBox" class="${me?.verify_code ? '' : 'hidden'}" style="margin-top:8px">
            <div class="code"><span id="lkCode">${esc(me?.verify_code || '')}</span><button class="copy" id="lkCopy">コピー</button></div>
            <p class="hint">合言葉は30分有効です。</p>
          </div></li>
        <li><a href="https://www.roblox.com/users/profile" target="_blank" rel="noopener">Roblox のプロフィール</a> を開いて、「自己紹介」に合言葉を貼りつけて保存します。</li>
        <li>Roblox の<b>ユーザー名</b>（@ のあとの英数字）を入れて「確認する」を押します。
          <label class="f">ユーザー名<input type="text" id="lkName" placeholder="例: lucky_taro123" autocomplete="off" spellcheck="false" maxlength="20" value="${esc(me?.roblox_name || '')}"></label></li>
      </ol>
      <div class="err" id="lkErr"></div>
      <div class="actions">
        ${linked ? '<button class="btn small ghost" id="lkUnlink">連携をやめる</button>' : ''}
        <button class="btn" id="lkVerify">確認する</button>
      </div>`);
    $('lkStart').onclick = async () => {
      $('lkErr').textContent = '';
      try {
        const r = await rpc('lbd_verify_start', { p_token: token() });
        if (!r.ok) { $('lkErr').textContent = reasonText(r.reason); return; }
        $('lkCode').textContent = r.code; $('lkCodeBox').classList.remove('hidden');
      } catch { $('lkErr').textContent = reasonText(); }
    };
    $('lkCopy').onclick = () => copyText($('lkCode').textContent);
    $('lkVerify').onclick = async () => {
      const name = $('lkName').value.trim();
      $('lkErr').textContent = '';
      if (!name) { $('lkErr').textContent = 'ユーザー名を入れてください。'; return; }
      const b = $('lkVerify'); b.disabled = true; b.textContent = '確認中…';
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/lbd-roblox-verify`, {
          method: 'POST', headers: HEADERS, body: JSON.stringify({ token: token(), username: name }),
        });
        const r = await res.json();
        if (!r.ok) { $('lkErr').textContent = reasonText(r.reason); return; }
        await loadMe();
        closeModal();
        toast(`✅ ${r.roblox_display}（@${r.roblox_name}）と連携しました！自己紹介の合言葉は消してOKです`);
        route();
      } catch { $('lkErr').textContent = reasonText('roblox_error'); }
      finally { b.disabled = false; b.textContent = '確認する'; }
    };
    const ul = $('lkUnlink');
    if (ul) ul.onclick = async () => {
      if (!confirm('Roblox との連携をやめますか？（公認も外れます）')) return;
      await rpc('lbd_unlink', { p_token: token() });
      await loadMe(); closeModal(); toast('連携をやめました'); route();
    };
  }

  // ---------- 配布を出す ----------
  function openCreateModal() {
    const dl = new Date(Date.now() + 24 * 3600e3); dl.setMinutes(0, 0, 0);
    openModal(`
      <h2>🎁 配布を出す</h2>
      <label class="f">配布の内容 <small>（例: ギャラクシードラゴンを11/20に配布！）</small>
        <textarea id="cBody" maxlength="500" placeholder="何を・いつ・どうやって配るか書いてください"></textarea></label>
      <div class="count"><span id="cCount">0</span>/500</div>
      <div class="row2">
        <label class="f">受付の締め切り<input type="datetime-local" id="cDeadline" value="${toLocalInput(dl)}"></label>
        <label class="f">当たる人数<input type="number" id="cWinners" min="1" max="50" value="1"></label>
      </div>
      <label class="f">配布する日時 <small>（なくてもOK）</small><input type="datetime-local" id="cGive"></label>
      <label class="f">YouTube の動画リンク <small>（なくてもOK。あとから付けられます）</small><input type="url" id="cVideo" placeholder="https://youtu.be/…"></label>
      <p class="hint">「ほしい！」した人の中から、締め切りのあとにルーレットで当たる人を決めます。ルーレットは<b>1回だけ</b>で、回し直しはできません。</p>
      <div class="err" id="cErr"></div>
      <div class="actions"><button class="btn ghost" data-close>やめる</button><button class="btn gold" id="cSubmit">公開する</button></div>`);
    $('cBody').addEventListener('input', () => { $('cCount').textContent = $('cBody').value.length; });
    $('cBody').focus();
    $('cSubmit').onclick = async () => {
      const body = $('cBody').value.trim();
      const dlv = $('cDeadline').value, gv = $('cGive').value;
      $('cErr').textContent = '';
      if (!body) { $('cErr').textContent = reasonText('body'); return; }
      if (!dlv) { $('cErr').textContent = reasonText('deadline'); return; }
      const b = $('cSubmit'); b.disabled = true;
      try {
        const r = await rpc('lbd_post_create', {
          p_token: token(), p_body: body,
          p_give_at: gv ? new Date(gv).toISOString() : null,
          p_deadline: new Date(dlv).toISOString(),
          p_winners: parseInt($('cWinners').value, 10) || 0,
          p_video_url: $('cVideo').value.trim() || null,
        });
        if (!r.ok) { $('cErr').textContent = reasonText(r.reason); return; }
        closeModal(); toast('配布を公開しました！LINE で宣伝してみよう');
        location.hash = `#/p/${r.id}`;
      } catch { $('cErr').textContent = reasonText(); }
      finally { b.disabled = false; }
    };
  }

  // ---------- 通報 ----------
  function openReportModal(id) {
    openModal(`
      <h2>🚩 通報する</h2>
      <p class="hint">詐欺・パスワードやお金を求める・ひどい言葉など、問題のある配布を管理者に知らせます。</p>
      <label class="f">理由<textarea id="rReason" maxlength="200"></textarea></label>
      <div class="err" id="rErr"></div>
      <div class="actions"><button class="btn ghost" data-close>やめる</button><button class="btn red" id="rSend">送る</button></div>`);
    $('rSend').onclick = async () => {
      const r = await rpc('lbd_report', { p_token: token(), p_id: id, p_reason: $('rReason').value });
      if (!r.ok) { $('rErr').textContent = reasonText(r.reason); return; }
      closeModal(); toast('通報しました。ありがとうございます');
    };
  }

  // ---------- 一覧 ----------
  let filter = 'all';
  let query = '', sortBy = 'new', lastPosts = [];
  // 検索と並べ替えはブラウザの中で（最新100件が対象）
  function visiblePosts() {
    const q = query.trim().toLowerCase();
    let ps = lastPosts.filter(p => !q || p.body.toLowerCase().includes(q) || p.author.display_name.toLowerCase().includes(q)
      || (p.author.roblox_name || '').toLowerCase().includes(q));
    const openFirst = (a, b) => (statusOf(a)[0] === 'open' ? 0 : 1) - (statusOf(b)[0] === 'open' ? 0 : 1);
    if (sortBy === 'deadline') ps = ps.slice().sort((a, b) => openFirst(a, b) || new Date(a.deadline) - new Date(b.deadline));
    else if (sortBy === 'easy') ps = ps.slice().sort((a, b) => openFirst(a, b) || (a.want_count / a.winners) - (b.want_count / b.winners));
    return ps;
  }
  function renderCards() {
    const box = $('list'); if (!box) return;
    const ps = visiblePosts();
    if (ps.length) { box.innerHTML = ps.map(p => cardHtml(p)).join(''); return; }
    if (query.trim()) { box.innerHTML = `<div class="empty"><div class="empty-block">?</div><b>「${esc(query.trim())}」は見つかりませんでした</b><p>ちがう言葉で探してみてください。</p></div>`; return; }
    const msg = { all: ['まだ配布がありません', '最初の配布を出してみよう！'], open: ['受付中の配布はありません', '新しい配布を待つか、自分で出してみよう。'],
      closed: ['抽選待ちの配布はありません', '締め切ったあと、配布する人がルーレットを回すまでここに並びます。'],
      wanted: ['まだ「ほしい！」していません', '受付中の配布を見つけて「ほしい！」を押してみよう。'], mine: ['まだ配布を出していません', '「＋ 配布を出す」から始めよう！'] }[filter] || ['ここにはまだ何もありません', ''];
    box.innerHTML = `<div class="empty"><div class="empty-block">?</div><b>${msg[0]}</b><p>${msg[1]}</p></div>`;
  }
  const totalEntries = p => p.want_count + (p.ext_count || 0);
  // 締め切りまでが近いほど目立たせる
  function urgency(iso) {
    const ms = new Date(iso) - Date.now();
    return ms <= 0 ? '' : ms < 3600e3 ? 'hot' : ms < 86400e3 ? 'warm' : '';
  }
  function cardHtml(p, asLink = true) {
    const [sc, st] = statusOf(p);
    const tag = asLink ? 'a' : 'div';
    const open = sc === 'open';
    let action = '';
    if (open && !p.is_mine) action = `<button class="want-btn ${p.i_want ? 'on' : ''}" data-want="${p.id}">
        <span class="heart">${p.i_want ? '❤' : '♡'}</span>${p.i_want ? 'ほしい！済み' : 'ほしい！'}</button>`;
    else if (p.is_mine && open) action = `<span class="mine-tag">あなたの配布</span>`;
    else if (p.draw?.i_won) action = `<span class="won-tag">🎉 当たり！${p.draw.i_received ? '（受け取り済み）' : ''}</span>`;
    else if (sc === 'closed') action = `<span class="mine-tag">${p.is_mine ? '⏰ 抽選してください' : '抽選を待っています'}</span>`;
    return `<${tag} class="card s-${sc}" ${asLink ? `href="#/p/${p.id}"` : ''}>
      <div class="card-top">
        <div class="who" data-user="${esc(p.author.username)}" title="${esc(p.author.display_name)}さんのページ"><span class="av">${esc(p.author.avatar || '👤')}</span>
          <div class="who-t"><b class="who-name">${esc(p.author.display_name)}</b>
            <span class="who-sub">${badgeHtml(p.author.badge)}${p.author.roblox_name ? `<span class="rbx">@${esc(p.author.roblox_name)}</span>` : ''}</span></div></div>
        <span class="status ${sc}">${st}</span>
      </div>
      <div class="body">${esc(p.body)}</div>
      <div class="chips">
        ${open ? `<span class="chip time ${urgency(p.deadline)}">⏰ ${leftText(p.deadline)}</span>` : ''}
        <span class="chip">📅 締め切り ${fmtDate(p.deadline)}</span>
        ${p.give_at ? `<span class="chip">🎁 配布 ${fmtDate(p.give_at)}</span>` : ''}
        <span class="chip">🏆 ${p.winners}人当たり</span>
        ${p.video_url ? '<span class="chip">🎬 動画</span>' : ''}
        ${p.draw && p.draw.site_winners ? `<span class="chip ${p.received_count >= p.draw.site_winners ? 'ok' : ''}">📦 受け取り ${p.received_count}/${p.draw.site_winners}</span>` : ''}
      </div>
      <div class="card-foot">
        <span class="wants"><b>${totalEntries(p)}</b>人がほしい！${p.ext_count ? `<small class="ext-n">（サイト外 ${p.ext_count}人をふくむ）</small>` : ''}</span>
        ${action}
      </div>
    </${tag}>`;
  }
  const STEPS_HTML = `
    <ol class="how">
      <li><span class="how-n">1</span><div><b>ログイン＆連携</b><small>かるわかGAMESでログインして、Robloxアカウントとつなぐ</small></div></li>
      <li><span class="how-n">2</span><div><b>ほしい！を押す</b><small>ほしい配布を見つけたらボタンを押すだけ</small></div></li>
      <li><span class="how-n">3</span><div><b>ルーレットで抽選</b><small>当たったらRobloxで受け取る</small></div></li>
    </ol>`;
  async function renderList() {
    const t = token();
    let note = '';
    if (!t) note = `<div class="notice"><span class="notice-i">👤</span><p><b>ログインして参加しよう</b><br>かるわかGAMESアカウントで、配布を出したり「ほしい！」したりできます。</p><button class="btn gold" data-act="login">ログイン</button></div>`;
    else if (me && !me.roblox_id) note = `<div class="notice"><span class="notice-i">🔗</span><p><b>あと少し！Robloxと連携しよう</b><br>配布を出したり「ほしい！」するには、Robloxアカウントとの連携が必要です（1分くらい）。</p><button class="btn gold" data-act="link">連携する</button></div>`;
    const tabs = [['all', 'すべて'], ['open', '受付中'], ['closed', '抽選待ち'], ...(t ? [['wanted', 'ほしい！した'], ['mine', '自分の配布']] : [])];
    if (t && notifs.need_draw) note += `<div class="notice warn"><span class="notice-i">⏰</span><p><b>抽選待ちの配布が${notifs.need_draw}件あります</b><br>ほしい！した人が待っています。ルーレットを回しましょう。</p><button class="btn gold" data-act="my-closed">見る</button></div>`;
    app.innerHTML = `
      <section class="hero">
        <div class="hero-blocks" aria-hidden="true"><span>?</span><span>?</span><span>?</span></div>
        <p class="hero-kicker">Roblox「ラッキーブロックを打つ」非公式</p>
        <h1>みんなの<em>配布</em>が集まる場所</h1>
        <p class="hero-sub">ほしい配布に「ほしい！」を押そう。当たる人はルーレットで公平に決まります。</p>
        ${!t || !me?.roblox_id ? STEPS_HTML : ''}
      </section>
      ${note}
      <div class="bar">
        <div class="tabs" role="tablist">
          ${tabs.map(([k, l]) => `<button class="tab ${filter === k ? 'active' : ''}" data-filter="${k}" role="tab">${l}</button>`).join('')}
        </div>
        <button class="btn gold big" data-act="create"><span class="plus">＋</span> 配布を出す</button>
      </div>
      <div class="finder">
        <label class="search"><span>🔍</span><input type="search" id="q" placeholder="キャラ名・人で探す" value="${esc(query)}" autocomplete="off"></label>
        <select id="sort" aria-label="並べ替え">
          <option value="new" ${sortBy === 'new' ? 'selected' : ''}>新しい順</option>
          <option value="deadline" ${sortBy === 'deadline' ? 'selected' : ''}>締め切りが近い順</option>
          <option value="easy" ${sortBy === 'easy' ? 'selected' : ''}>当たりやすい順</option>
        </select>
      </div>
      <div id="list" class="list"><div class="skeleton"></div><div class="skeleton"></div></div>
      ${OPENCHAT_HTML}`;
    $('q').addEventListener('input', e => { query = e.target.value; renderCards(); });
    $('sort').addEventListener('change', e => { sortBy = e.target.value; renderCards(); });
    try {
      const r = await rpc('lbd_list', { p_token: t, p_filter: filter });
      lastPosts = r.posts || [];
      renderCards();
    } catch { $('list').innerHTML = '<div class="empty"><b>読み込めませんでした</b><p>通信を確認して、もう一度開いてください。</p></div>'; }
  }

  // ---------- 詳細 ----------
  let current = null; // 表示中の投稿
  async function renderPost(id) {
    app.innerHTML = '<a class="back" href="#/">← 一覧へもどる</a><div class="skeleton tall"></div>';
    let r;
    try { r = await rpc('lbd_get', { p_token: token(), p_id: id }); } catch { r = { ok: false }; }
    if (!r.ok) { app.innerHTML = `<a class="back" href="#/">← 一覧へ</a><p class="empty">${esc(reasonText(r.reason || 'not_found'))}</p>`; return; }
    const p = current = r.post;
    const [sc] = statusOf(p);
    const embed = p.video_url ? youtubeEmbed(p.video_url) : null;
    const stage = p.status === 'done' ? 3 : p.status === 'drawn' ? 2 : 1;
    const steps = ['受付中', 'ルーレットで抽選', '配布済み'];
    let html = `<a class="back" href="#/">← 一覧へもどる</a>`;
    if (p.status !== 'removed') html += `<ol class="progress">${steps.map((t, i) => `<li class="${i + 1 < stage ? 'done' : i + 1 === stage ? 'now' : ''}"><span>${i + 1 < stage ? '✓' : i + 1}</span>${t}</li>`).join('')}</ol>`;
    if (p.draw?.i_won) html += `<div class="won"><div>🎉 <b>おめでとう！あなたが当たりました。</b><br><small>${p.draw.i_received ? '受け取りの確認ありがとう！' : '配布する人から Roblox で受け取ったら、下のボタンを押してください。'}</small></div>
      ${p.draw.i_received ? '<span class="won-done">✅ 受け取り済み</span>' : '<button class="btn" id="receiveBtn">📦 受け取った！</button>'}</div>`;
    if (sc === 'closed' && !p.is_mine) html += `<div class="notice"><span class="notice-i">⏳</span><p><b>締め切りました</b><br>配布する人がルーレットを回すのを待っています。結果が出たら 🔔 でお知らせします。</p></div>`;
    html += cardHtml(p, false);

    // ルーレット（抽選済みなら、だれが見ても同じ結果がもう一度流れる）
    if (p.draw) {
      const names = p.draw.winner_idx.map(i => p.draw.entrants[i]);
      html += `<div class="sect"><h3>🎡 抽選の結果</h3>
        <div class="roulette">
          <div class="wheel-wrap"><canvas id="wheel" width="720" height="720"></canvas><div class="pointer"></div><div class="wheel-center"><span class="qblock">?</span></div></div>
          <div class="roulette-msg" id="rMsg">参加 ${p.draw.entrants.length}人 → 当たり ${names.length}人</div>
          <div class="winners" id="rWinners">${names.map(n => `<span>${esc(n.avatar || '👤')} ${esc(n.name)}</span>`).join('')}</div>
          <div class="share-btns center">
            <button class="btn small gold" id="replay">▶ ルーレットをもう一度見る</button>
            <button class="btn small ghost" id="saveImg">🖼 結果を画像で保存</button>
            <button class="btn small ghost sound-btn" id="soundBtn" aria-label="効果音">${soundOn ? '🔊' : '🔇'}</button>
          </div>
          <p class="fair">抽選は ${fmtDate(p.draw.drawn_at)} にサーバーで1回だけ行われ、結果はあとから変えられません。このルーレットは、保存された結果をもう一度見せています。</p>
        </div></div>`;
    } else if (p.is_mine && p.status === 'open') {
      html += `<div class="sect ${sc === 'closed' ? 'urgent' : ''}"><h3>${sc === 'closed' ? '⏰ 締め切りました！ルーレットを回してください' : '🎡 ルーレットで抽選する'}</h3>
        <p class="hint">「ほしい！」した ${totalEntries(p)}人${p.ext_count ? `（サイト外 ${p.ext_count}人をふくむ）` : ''} の中から ${p.winners}人 を選びます。<b>回し直しはできません。</b>押した時点で受付も締め切りになります。</p>
        <div class="roulette" id="drawArea">
          <div class="wheel-wrap"><canvas id="wheel" width="720" height="720"></canvas><div class="pointer"></div><div class="wheel-center"><span class="qblock">?</span></div></div>
          <div class="share-btns center">
            <button class="btn gold" id="drawBtn" ${totalEntries(p) ? '' : 'disabled'}>🎡 ルーレットを回す</button>
            <button class="btn small ghost sound-btn" id="soundBtn" aria-label="効果音">${soundOn ? '🔊' : '🔇'}</button>
          </div>
        </div></div>`;
    }

    if (p.status !== 'removed') {
      const open = statusOf(p)[0] === 'open';
      html += `<div class="sect share">
        <h3>📣 ${p.is_mine && open ? 'オプチャで宣伝しよう' : 'この配布をシェア'}</h3>
        <p class="hint">${open ? 'LINE が開くので、オープンチャットや友だちを選んで送るだけ。見た人がここから「ほしい！」できます。' : '抽選の結果ページとして送れます。'}</p>
        <div class="share-btns">
          <a class="btn line" href="${lineShareUrl(p)}" target="_blank" rel="noopener"><span class="line-logo">LINE</span>で送る</a>
          <button class="btn ghost" data-copy-link="${p.id}">🔗 リンクをコピー</button>
        </div>
        <a class="oc-link" href="${OPENCHAT_URL}" target="_blank" rel="noopener">💬 オプチャ「ラッキーブロックを打つやってる人きてー」に参加する ›</a>
      </div>`;
    }
    if (embed) html += `<div class="sect"><h3>🎬 動画</h3><div class="video"><iframe src="${embed}" title="配布の動画" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div>`;

    if (p.is_mine || me?.is_admin) {
      html += `<div class="sect"><h3>🙋 ほしい！した人 <small class="hint">（あなたと管理者にだけ見えます）</small></h3><div id="entrants"><p class="hint">読み込み中…</p></div></div>`;
      html += `<div class="sect"><h3>⚙ 配布の管理</h3>
        <label class="f">YouTube の動画リンク<input type="url" id="vUrl" value="${esc(p.video_url || '')}" placeholder="https://youtu.be/…"></label>
        <div class="err" id="mErr"></div>
        <div class="actions">
          <button class="btn small ghost" id="vSave">動画リンクを保存</button>
          ${p.status === 'drawn' ? '<button class="btn small green" id="markDone">✔ 配布した</button>' : ''}
          <button class="btn small red" id="removeBtn">🗑 この配布を消す</button>
        </div></div>`;
    } else if (token()) {
      html += `<div class="actions"><button class="btn small ghost" id="reportBtn">🚩 通報する</button></div>`;
    }
    app.innerHTML = html;

    // ルーレットの準備
    if (p.draw) {
      const wheel = new Wheel($('wheel'), p.draw.entrants.map(e => e.name));
      const play = async () => {
        $('replay').disabled = true; $('rWinners').style.visibility = 'hidden';
        await spinSequence(wheel, p.draw.winner_idx, p.draw.seed, p.draw.entrants);
        $('rWinners').style.visibility = ''; $('replay').disabled = false;
      };
      $('replay').onclick = play;
      $('saveImg').onclick = () => saveResultImage(p, wheel);
      // 抽選した直後だけ自動で回す。当たった人が初めて開いたときは紙吹雪
      if (justDrawn === p.id) { justDrawn = null; play(); }
      else if (p.draw.i_won && !sessionStorage.getItem('lbd_cf_' + p.id)) { sessionStorage.setItem('lbd_cf_' + p.id, '1'); confetti(); sfx.win(); }
    } else if ($('drawBtn')) {
      loadEntrantNames(p.id).then(names => { new Wheel($('wheel'), names.length ? names : ['?']); });
      $('drawBtn').onclick = async () => {
        if (!confirm(`${totalEntries(p)}人の中から ${p.winners}人 を選びます。回し直しはできません。回しますか？`)) return;
        $('drawBtn').disabled = true;
        const r2 = await rpc('lbd_draw', { p_token: token(), p_id: p.id });
        if (!r2.ok) { toast(reasonText(r2.reason)); $('drawBtn').disabled = false; return; }
        justDrawn = p.id; renderPost(p.id);
      };
    }
    if ($('entrants')) renderEntrants(p.id, p.is_mine && p.status === 'open');
    if ($('soundBtn')) $('soundBtn').onclick = () => {
      soundOn = !soundOn; localStorage.setItem('lbd_sound', soundOn ? 'on' : 'off');
      $('soundBtn').textContent = soundOn ? '🔊' : '🔇'; if (soundOn) sfx.pop();
    };
    if ($('receiveBtn')) $('receiveBtn').onclick = async () => {
      $('receiveBtn').disabled = true;
      const r2 = await rpc('lbd_confirm_receipt', { p_token: token(), p_id: p.id });
      if (!r2.ok) { toast(reasonText(r2.reason)); $('receiveBtn').disabled = false; return; }
      sfx.pop(); toast('📦 受け取りを記録しました。ありがとう！'); loadNotifs(); renderPost(p.id);
    };
    if ($('vSave')) $('vSave').onclick = async () => {
      const r2 = await rpc('lbd_post_update', { p_token: token(), p_id: p.id, p_action: 'video', p_value: $('vUrl').value.trim() });
      if (!r2.ok) { $('mErr').textContent = reasonText(r2.reason); return; }
      toast('動画リンクを保存しました'); renderPost(p.id);
    };
    if ($('markDone')) $('markDone').onclick = async () => {
      const r2 = await rpc('lbd_post_update', { p_token: token(), p_id: p.id, p_action: 'done' });
      if (!r2.ok) { $('mErr').textContent = reasonText(r2.reason); return; }
      toast('「配布済み」にしました'); renderPost(p.id);
    };
    if ($('removeBtn')) $('removeBtn').onclick = async () => {
      if (!confirm('この配布を消しますか？（一覧から見えなくなります）')) return;
      const r2 = await rpc('lbd_post_update', { p_token: token(), p_id: p.id, p_action: 'remove' });
      if (!r2.ok) { $('mErr').textContent = reasonText(r2.reason); return; }
      toast('消しました'); location.hash = '#/';
    };
    if ($('reportBtn')) $('reportBtn').onclick = () => openReportModal(p.id);
  }
  let justDrawn = null;

  async function loadEntrantNames(id) {
    try { const r = await rpc('lbd_entrants', { p_token: token(), p_id: id }); return r.ok ? [...r.entrants.map(e => e.display_name), ...r.external.map(e => e.name)] : []; }
    catch { return []; }
  }
  // 「名前」または「名前, Robloxユーザー名」を1行に1人
  function parseExt(text) {
    return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
      const m = l.match(/^(.+?)\s*[,，、\t]\s*@?([A-Za-z0-9_]{3,20})$/) || l.match(/^(.+?)\s+@([A-Za-z0-9_]{3,20})$/);
      return m ? { name: m[1].trim(), roblox: m[2] } : { name: l.replace(/^@/, '') };
    });
  }
  async function renderEntrants(id, canEdit = false) {
    let r;
    try { r = await rpc('lbd_entrants', { p_token: token(), p_id: id }); } catch { r = { ok: false }; }
    const box = $('entrants'); if (!box) return;
    if (!r.ok) { box.innerHTML = `<p class="hint">${esc(reasonText(r.reason))}</p>`; return; }
    const ext = r.external || [];
    const extForm = canEdit ? `<div class="ext-box">
        <h4>🌐 サイト外の人を抽選に入れる</h4>
        <p class="hint">オプチャなどで応募してきた、このサイトを使っていない人を追加できます。1行に1人、「名前」か「名前, Roblox のユーザー名」で書いてください。</p>
        <textarea id="extText" placeholder="たろう, taro_123&#10;はなこ&#10;ゆうき @yuki_rbx"></textarea>
        <div class="err" id="extErr"></div>
        <div class="actions"><button class="btn small gold" id="extAdd">＋ 追加する</button></div>
        <p class="hint">サイト外の人には 🔔 のお知らせや「受け取った」ボタンがないので、当たったらオプチャなどで連絡してください。</p>
      </div>` : '';
    if (!r.entrants.length && !ext.length) { box.innerHTML = '<p class="hint">まだだれも「ほしい！」していません。</p>' + extForm; bindExt(id); return; }
    const won = [...r.entrants.filter(e => e.won).map(e => e.roblox_name || e.display_name), ...ext.filter(e => e.won).map(e => e.roblox_name || e.name)];
    box.innerHTML = `
      ${won.length ? `<p class="hint">🏆 当たった人（Roblox のユーザー名・わからない人は名前）: <b class="mono">${won.map(esc).join(', ')}</b> <button class="copy" id="copyWon">コピー</button></p>` : ''}
      <table class="tbl"><thead><tr><th></th><th>名前</th><th>Roblox</th><th class="hide-sm">ID</th><th class="hide-sm">ほしい！した時刻</th><th></th></tr></thead><tbody>
      ${r.entrants.map(e => `<tr class="${e.won ? 'win' : ''}">
        <td>${e.won ? (e.received ? '<span title="受け取り済み">📦✅</span>' : '🏆') : ''}</td>
        <td><a href="#/u/${encodeURIComponent(e.username)}" class="plain">${esc(e.avatar || '👤')} ${esc(e.display_name)}</a></td>
        <td>${e.roblox_id ? `<a href="https://www.roblox.com/users/${encodeURIComponent(e.roblox_id)}/profile" target="_blank" rel="noopener">${esc(e.roblox_display)}</a><br><span class="mono hint">@${esc(e.roblox_name)}</span>` : '<span class="hint">連携が外れています</span>'}</td>
        <td class="hide-sm mono">${esc(e.roblox_id || '')} ${e.roblox_id ? `<button class="copy" data-copy="${esc(e.roblox_id)}">コピー</button>` : ''}</td>
        <td class="hide-sm">${fmtDate(e.wanted_at)}</td>
        <td><button class="copy danger" data-block="${esc(e.username)}" data-on="1" data-name="${esc(e.display_name)}">ブロック</button></td></tr>`).join('')}
      ${ext.map(e => `<tr class="${e.won ? 'win' : ''}">
        <td>${e.won ? '🏆' : ''}</td>
        <td>🌐 ${esc(e.name)} <span class="badge none">サイト外</span></td>
        <td>${e.roblox_name ? `<a href="https://www.roblox.com/search/users?keyword=${encodeURIComponent(e.roblox_name)}" target="_blank" rel="noopener" class="mono">@${esc(e.roblox_name)}</a>` : '<span class="hint">—</span>'}</td>
        <td class="hide-sm"></td>
        <td class="hide-sm">${fmtDate(e.added_at)}</td>
        <td>${canEdit ? `<button class="copy" data-ext-del="${e.id}">外す</button>` : ''}</td></tr>`).join('')}
      </tbody></table>
      ${extForm}
      <p class="hint">ブロックすると、その人はあなたの配布に「ほしい！」できなくなり、受付中の配布からも外れます。解除はマイページからできます。</p>`;
    const cw = $('copyWon');
    if (cw) cw.onclick = () => copyText(won.join(', '));
    bindExt(id);
  }
  function bindExt(id) {
    const add = $('extAdd'); if (!add) return;
    add.onclick = async () => {
      const items = parseExt($('extText').value);
      $('extErr').textContent = '';
      if (!items.length) { $('extErr').textContent = reasonText('ext_empty'); return; }
      add.disabled = true;
      try {
        const r = await rpc('lbd_ext_add', { p_token: token(), p_id: id, p_items: items });
        if (!r.ok) { $('extErr').textContent = reasonText(r.reason) + (r.name ? `（${r.name}）` : ''); return; }
        toast(`🌐 ${r.added}人を抽選に入れました`); renderPost(id);
      } catch { $('extErr').textContent = reasonText(); }
      finally { add.disabled = false; }
    };
  }

  // ---------- ルーレット ----------
  // 決まった結果に止まるだけ。どこで止まるか（ぶれ幅・回転数）は seed から決まるので、だれが見ても同じ動きになる
  const COLORS = ['#ffb800', '#3478f6', '#ff4d5e', '#17b26a', '#8b5cf6', '#ff8a1f', '#14b8c4', '#ec4899'];
  class Wheel {
    constructor(canvas, names) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.names = names; this.angle = 0; this.marked = new Set(); this.draw(); }
    draw() {
      const { ctx, c, names } = this, n = names.length, R = c.width / 2, seg = Math.PI * 2 / n;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.save(); ctx.translate(R, R); ctx.rotate(this.angle);
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + i * seg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 8, a0, a0 + seg); ctx.closePath();
        ctx.fillStyle = this.marked.has(i) ? '#fff3b0' : COLORS[i % COLORS.length];
        if (n % COLORS.length === 1 && i === n - 1 && n > 1) ctx.fillStyle = this.marked.has(i) ? '#fff3b0' : COLORS[3];
        ctx.fill();
        if (n > 1) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.stroke(); }
        if (n <= 48) {
          ctx.save(); ctx.rotate(a0 + seg / 2);
          ctx.fillStyle = this.marked.has(i) ? '#6b4700' : '#fff';
          const fs = Math.max(14, Math.min(34, 520 / n + 8));
          ctx.font = `800 ${fs}px "Hiragino Maru Gothic ProN","Yu Gothic UI",sans-serif`;
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          let label = names[i]; if (label.length > 9) label = label.slice(0, 8) + '…';
          ctx.fillText(label, R - 26, 0);
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(R, R, R - 4, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    }
    // index の区画の中（ぶれ jitter: 0〜1）がポインター（真上）に来る角度
    targetFor(index, jitter) {
      const seg = Math.PI * 2 / this.names.length;
      return -((index + 0.15 + jitter * 0.7) * seg);
    }
    spinTo(index, jitter, turns, ms) {
      return new Promise(resolve => {
        const TAU = Math.PI * 2, start = this.angle;
        let target = this.targetFor(index, jitter);
        // start から時計回りに turns 周以上まわって target に着く
        target = start + ((target - start) % TAU + TAU) % TAU + turns * TAU;
        const t0 = performance.now(), seg = TAU / this.names.length;
        let lastIdx = -1;
        const step = now => {
          const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 4);
          this.angle = start + (target - start) * e; this.draw();
          // ポインターの下の区画が変わったらカチッ
          const idx = Math.floor((((-this.angle) % TAU) + TAU) % TAU / seg);
          if (idx !== lastIdx && this.names.length > 1) { if (lastIdx !== -1) sfx.tick(); lastIdx = idx; }
          if (t < 1) requestAnimationFrame(step); else { this.angle %= TAU; resolve(); }
        };
        requestAnimationFrame(step);
      });
    }
  }
  function mulberry32(a) {
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  async function spinSequence(wheel, winnerIdx, seed, entrants) {
    const rnd = mulberry32(seed);
    wheel.marked.clear(); wheel.angle = 0; wheel.draw();
    const many = winnerIdx.length > 5; // 人数が多いときは早回し
    for (let k = 0; k < winnerIdx.length; k++) {
      const i = winnerIdx[k];
      $('rMsg').textContent = `${k + 1}人目を抽選中…`;
      await wheel.spinTo(i, rnd(), many ? 2 + Math.floor(rnd() * 2) : 5 + Math.floor(rnd() * 3), many ? 1600 : 4200);
      wheel.marked.add(i); wheel.draw(); sfx.win();
      $('rMsg').textContent = `🎉 ${k + 1}人目: ${entrants[i].avatar || ''} ${entrants[i].name}`;
      await new Promise(r => setTimeout(r, many ? 500 : 1200));
    }
    $('rMsg').textContent = `参加 ${entrants.length}人 → 当たり ${winnerIdx.length}人`;
    confetti();
  }

  // ---------- 結果を画像にする（オプチャに貼れる縦長 1080x1350） ----------
  function wrapText(ctx, text, maxW) {
    const out = []; let line = '';
    for (const ch of text.replace(/\s+/g, ' ')) {
      if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch;
    }
    if (line) out.push(line);
    return out;
  }
  async function saveResultImage(p, wheel) {
    try { await document.fonts.ready; } catch {}
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'), F = '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic UI",sans-serif';
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#dcecff'); g.addColorStop(1, '#fff1c4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 白いカード
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(50, 50, W - 100, H - 100, 44); ctx.fill();
    ctx.fillStyle = '#172033'; ctx.textAlign = 'center';
    ctx.font = `800 34px ${F}`; ctx.fillStyle = '#8a5a00'; ctx.fillText('🎡 抽選結果', W / 2, 130);
    ctx.fillStyle = '#172033'; ctx.font = `800 46px ${F}`;
    const lines = wrapText(ctx, p.body, W - 220).slice(0, 3);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 200 + i * 60));
    let y = 200 + lines.length * 60;
    ctx.font = `700 26px ${F}`; ctx.fillStyle = '#66728a';
    ctx.fillText(`配布: ${p.author.display_name}${p.author.roblox_name ? ' (@' + p.author.roblox_name + ')' : ''}`, W / 2, y + 6);
    // ルーレット（当たりに印を付けた状態）
    const saved = { a: wheel.angle, m: new Set(wheel.marked) };
    p.draw.winner_idx.forEach(i => wheel.marked.add(i)); wheel.draw();
    const ws = 600; ctx.drawImage(wheel.c, (W - ws) / 2, y + 40, ws, ws);
    wheel.angle = saved.a; wheel.marked = saved.m; wheel.draw();
    y += 40 + ws + 60;
    ctx.fillStyle = '#172033'; ctx.font = `800 34px ${F}`;
    ctx.fillText(`🏆 当たり ${p.draw.winner_idx.length}人（参加 ${p.draw.entrants.length}人）`, W / 2, y);
    ctx.font = `800 32px ${F}`;
    const names = p.draw.winner_idx.map(i => p.draw.entrants[i].name);
    const nameLines = wrapText(ctx, names.join('・'), W - 220).slice(0, 4);
    nameLines.forEach((l, i) => { ctx.fillStyle = '#b8730a'; ctx.fillText(l, W / 2, y + 56 + i * 46); });
    ctx.font = `700 22px ${F}`; ctx.fillStyle = '#66728a';
    ctx.fillText(`抽選日時 ${fmtDate(p.draw.drawn_at)}（サーバーで1回だけ・回し直しなし）`, W / 2, H - 120);
    ctx.fillText(`ラッキーブロック配布所（非公式）  ${postUrl(p.id).replace('https://', '')}`, W / 2, H - 84);
    c.toBlob(async blob => {
      if (!blob) { toast('画像を作れませんでした'); return; }
      const file = new File([blob], `lucky-block-result-${p.id}.png`, { type: 'image/png' });
      // スマホは共有メニュー（LINE などに直接送れる）、PCはダウンロード
      if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ files: [file], title: '抽選結果' }); return; } catch (e) { if (e.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('🖼 画像を保存しました');
    }, 'image/png');
  }

  // ---------- プロフィール ----------
  async function renderProfile(username) {
    app.innerHTML = '<a class="back" href="#/">← 一覧へもどる</a><div class="skeleton tall"></div>';
    let r;
    try { r = await rpc('lbd_profile', { p_token: token(), p_username: username }); } catch { r = { ok: false }; }
    if (!r.ok) { app.innerHTML = `<a class="back" href="#/">← 一覧へもどる</a><p class="empty">${esc(reasonText(r.reason || 'not_found'))}</p>`; return; }
    const st = r.stats, rate = st.winners ? Math.round(st.received / st.winners * 100) : null;
    app.innerHTML = `<a class="back" href="#/">← 一覧へもどる</a>
      <section class="profile">
        <div class="pf-av">${esc(r.avatar || '👤')}</div>
        <div class="pf-main">
          <h1>${esc(r.display_name)}</h1>
          <div class="who-sub">${badgeHtml(r.badge)}
            ${r.roblox_id ? `<a class="rbx" href="https://www.roblox.com/users/${encodeURIComponent(r.roblox_id)}/profile" target="_blank" rel="noopener">Roblox: ${esc(r.roblox_display)} (@${esc(r.roblox_name)})</a>` : ''}</div>
          <p class="hint">${r.linked_at ? `Roblox 連携 ${fmtDate(r.linked_at).split(' ')[0]}〜` : 'Roblox とはまだ連携していません'}${r.official_at ? `／公認 ${fmtDate(r.official_at).split(' ')[0]}〜` : ''}</p>
        </div>
        <div class="pf-act">
          ${r.is_me ? '<button class="btn small ghost" data-act="account">⚙ アカウント設定</button><button class="btn small ghost" data-act="link">🔗 Roblox 連携</button>'
            : token() ? `<button class="btn small ghost ${r.is_blocked ? '' : 'danger-t'}" data-block="${esc(r.username)}" data-on="${r.is_blocked ? 0 : 1}" data-name="${esc(r.display_name)}">${r.is_blocked ? 'ブロックを解除' : '🚫 ブロック'}</button>` : ''}
        </div>
      </section>
      <div class="stats">
        <div class="stat"><b>${st.posts}</b><span>配布した数</span></div>
        <div class="stat"><b>${st.drawn}</b><span>抽選した数</span></div>
        <div class="stat"><b>${st.done}</b><span>配布済み</span></div>
        <div class="stat ${rate === null ? '' : rate >= 80 ? 'good' : rate < 40 ? 'bad' : ''}"><b>${rate === null ? '—' : rate + '%'}</b><span>受け取り確認<br><small>${st.received}/${st.winners}人</small></span></div>
        <div class="stat"><b>${st.wins}</b><span>当たった数</span></div>
      </div>
      <p class="hint center">「受け取り確認」は、当たった人が「受け取った！」を押した割合です。高いほど、ちゃんと配っている人です。</p>
      ${r.is_me ? '<div class="sect"><h3>🚫 ブロックしている人</h3><div id="blocks"><p class="hint">読み込み中…</p></div></div>' : ''}
      <h2>${r.is_me ? 'あなたの配布' : `${esc(r.display_name)}さんの配布`}</h2>
      <div class="list">${r.posts.length ? r.posts.map(p => cardHtml(p)).join('') : '<div class="empty"><div class="empty-block">?</div><b>まだ配布がありません</b></div>'}</div>`;
    if (r.is_me) {
      const b = await rpc('lbd_blocks_list', { p_token: token() }).catch(() => ({ ok: false }));
      const box = $('blocks'); if (!box) return;
      box.innerHTML = b.ok && b.blocks.length ? `<ul class="block-list">${b.blocks.map(x => `<li><a href="#/u/${encodeURIComponent(x.username)}" class="plain">${esc(x.avatar || '👤')} ${esc(x.display_name)}</a>
          <button class="copy" data-block="${esc(x.username)}" data-on="0" data-name="${esc(x.display_name)}">解除</button></li>`).join('')}</ul>`
        : '<p class="hint">ブロックしている人はいません。</p>';
    }
  }

  // ---------- 管理 ----------
  async function renderAdmin() {
    app.innerHTML = '<a class="back" href="#/">← 一覧へもどる</a><div class="skeleton tall"></div>';
    let r;
    try { r = await rpc('lbd_admin_overview', { p_token: token() }); } catch { r = { ok: false }; }
    if (!r.ok) { app.innerHTML = `<a class="back" href="#/">← 一覧へ</a><p class="empty">${esc(reasonText(r.reason))}</p>`; return; }
    app.innerHTML = `<a class="back" href="#/">← 一覧へ</a>
      <h2>🚩 通報（${r.reports.length}件）</h2>
      <div class="sect">${r.reports.length ? `<table class="tbl"><thead><tr><th>配布</th><th>理由</th><th>通報した人</th><th></th></tr></thead><tbody>
        ${r.reports.map(x => `<tr><td><a href="#/p/${x.post_id}">${esc(x.post_body)}</a></td><td>${esc(x.reason)}</td><td>${esc(x.reporter)}<br><span class="hint">${fmtDate(x.created_at)}</span></td>
          <td><button class="copy" data-dismiss="${x.post_id}">問題なし</button></td></tr>`).join('')}</tbody></table>` : '<p class="hint">通報はありません。</p>'}</div>
      <h2>👑 Roblox 連携した人（${r.users.length}人）</h2>
      <p class="hint">「公認にする」と、その人の配布に 👑 公認 が付きます。Roblox のプロフィールを開いて、本当にその人か確かめてから押してください。</p>
      <div class="sect"><table class="tbl"><thead><tr><th>かるわかGAMES</th><th>Roblox</th><th class="hide-sm">配布</th><th></th></tr></thead><tbody>
        ${r.users.map(u => `<tr><td>${esc(u.avatar || '👤')} ${esc(u.display_name)}<br><span class="hint mono">@${esc(u.username)}</span></td>
          <td><a href="https://www.roblox.com/users/${encodeURIComponent(u.roblox_id)}/profile" target="_blank" rel="noopener">${esc(u.roblox_display)}</a><br><span class="hint mono">@${esc(u.roblox_name)}</span></td>
          <td class="hide-sm">${u.posts}件</td>
          <td>${u.official ? `<span class="badge official">👑 公認</span> <button class="copy" data-official="${u.ka_id}" data-on="0">外す</button>`
            : `<button class="btn small gold" data-official="${u.ka_id}" data-on="1">公認にする</button>`}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  // ---------- クリック（まとめて受ける） ----------
  app.addEventListener('click', async e => {
    const t = e.target.closest('[data-want],[data-filter],[data-act],[data-copy],[data-copy-link],[data-official],[data-dismiss],[data-user],[data-block],[data-ext-del]');
    if (!t) return;
    if (t.dataset.extDel) {
      const r = await rpc('lbd_ext_remove', { p_token: token(), p_entry_id: +t.dataset.extDel });
      if (!r.ok) { toast(reasonText(r.reason)); return; }
      toast('外しました'); route();
    } else if (t.dataset.user) {
      // カード（リンク）の中の作者名 → プロフィールへ
      e.preventDefault(); e.stopPropagation();
      location.hash = `#/u/${encodeURIComponent(t.dataset.user)}`;
    } else if (t.dataset.block) {
      const on = t.dataset.on === '1';
      if (on && !confirm(`${t.dataset.name}さんをブロックしますか？\nあなたの配布に「ほしい！」できなくなり、受付中の配布からも外れます。`)) return;
      const r = await rpc('lbd_block_set', { p_token: token(), p_username: t.dataset.block, p_on: on });
      if (!r.ok) { toast(reasonText(r.reason)); return; }
      toast(on ? 'ブロックしました' : 'ブロックを解除しました'); route();
    } else if (t.dataset.want) {
      e.preventDefault(); e.stopPropagation();
      if (!(await requireRoblox())) return;
      t.disabled = true;
      try {
        const r = await rpc('lbd_want_toggle', { p_token: token(), p_id: +t.dataset.want });
        if (!r.ok) { toast(reasonText(r.reason)); return; }
        if (r.i_want) sfx.pop();
        toast(r.i_want ? '❤ ほしい！しました。結果は 🔔 でお知らせします' : 'ほしい！を取り消しました');
        route();
      } finally { t.disabled = false; }
    } else if (t.dataset.filter) {
      filter = t.dataset.filter; renderList();
    } else if (t.dataset.act === 'create') {
      if (await requireRoblox()) openCreateModal();
    } else if (t.dataset.act === 'link') {
      openLinkModal();
    } else if (t.dataset.act === 'account') {
      ka?.openPanel();
    } else if (t.dataset.act === 'my-closed') {
      filter = 'mine'; sortBy = 'deadline'; renderList();
    } else if (t.dataset.act === 'login') {
      if (await requireLogin()) { await loadMe(); route(); }
    } else if (t.dataset.copyLink) {
      copyText(postUrl(t.dataset.copyLink));
    } else if (t.dataset.copy) {
      copyText(t.dataset.copy);
    } else if (t.dataset.official) {
      const r = await rpc('lbd_admin_set_official', { p_token: token(), p_ka_id: t.dataset.official, p_on: t.dataset.on === '1' });
      if (!r.ok) { toast(reasonText(r.reason)); return; }
      toast(t.dataset.on === '1' ? '公認にしました' : '公認を外しました'); renderAdmin();
    } else if (t.dataset.dismiss) {
      await rpc('lbd_admin_dismiss_reports', { p_token: token(), p_id: +t.dataset.dismiss });
      toast('通報を片付けました'); renderAdmin();
    }
  });

  // ---------- 画面の切り替え ----------
  function route() {
    const h = location.hash;
    let m;
    if ((m = h.match(/^#\/p\/(\d+)/))) renderPost(+m[1]);
    else if ((m = h.match(/^#\/u\/([^/]+)/))) renderProfile(decodeURIComponent(m[1]));
    else if (h === '#/admin') renderAdmin();
    else renderList();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });

  (async () => {
    // ログイン状態は localStorage からすぐ読めるので、SDKの準備を待たずに表示する
    await Promise.all([loadMe(), loadNotifs()]); updateHeader(); route();
    // ログイン・ログアウトしたら読み直す
    ka?.onChange(async () => { await Promise.all([loadMe(), loadNotifs()]); updateHeader(); route(); });
  })();
})();

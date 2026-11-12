// ラッキーブロック配布所（非公式）
// データは共有 Supabase の lbd_* RPC。ログインはかるわかGAMESアカウント（window.KaAccount）
(() => {
  'use strict';
  const SUPABASE_URL = 'https://kifnzvktwbomxthzvvgy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Ea_sHRg6wMwO9YkDTjgOog_stQT1mfq';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  // 公認オープンチャット「偽ラッキーブロックを打つ」（ラッキーブロックを打つ Web と同じ）
  const OPENCHAT_URL = 'https://line.me/ti/g2/RNE2vwllCnyl4-Y8ukT0Pqmay1BYPPtICBvzaw?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';
  const SITE_URL = 'https://kaikomziu.github.io/lucky-block-giveaway/';
  const OPENCHAT_HTML = `<a class="oc" href="${OPENCHAT_URL}" target="_blank" rel="noopener">
      <span class="oc-icon">💬</span>
      <span class="oc-text"><small>公認オープンチャット（LINE）</small><b>「偽ラッキーブロックを打つ」</b><em>配布の宣伝・雑談OK！作者のかるわかもいます</em></span>
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
    $('accountBtn').innerHTML = u ? `${esc(u.avatar || '👤')} ${esc(u.display_name)}` : '👤 ログイン';
    $('adminLink').classList.toggle('hidden', !me?.is_admin);
  }
  $('accountBtn').addEventListener('click', () => {
    if (!ka) { toast('アカウント機能を読み込めませんでした（オフラインかもしれません）'); return; }
    ka.openPanel();
  });
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
    else if (p.draw?.i_won) action = `<span class="won-tag">🎉 当たり！</span>`;
    return `<${tag} class="card s-${sc}" ${asLink ? `href="#/p/${p.id}"` : ''}>
      <div class="card-top">
        <div class="who"><span class="av">${esc(p.author.avatar || '👤')}</span>
          <div class="who-t"><b>${esc(p.author.display_name)}</b>
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
      </div>
      <div class="card-foot">
        <span class="wants"><b>${p.want_count}</b>人がほしい！</span>
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
    const tabs = [['all', 'すべて'], ['open', '受付中'], ...(t ? [['wanted', 'ほしい！した'], ['mine', '自分の配布']] : [])];
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
      <div id="list" class="list"><div class="skeleton"></div><div class="skeleton"></div></div>
      ${OPENCHAT_HTML}`;
    try {
      const r = await rpc('lbd_list', { p_token: t, p_filter: filter });
      const posts = r.posts || [];
      $('list').innerHTML = posts.length ? posts.map(p => cardHtml(p)).join('')
        : `<div class="empty"><div class="empty-block">?</div><b>${filter === 'all' ? 'まだ配布がありません' : 'ここにはまだ何もありません'}</b>
            <p>${filter === 'all' || filter === 'mine' ? '最初の配布を出してみよう！' : '受付中の配布を見つけて「ほしい！」を押してみよう。'}</p></div>`;
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
    if (p.draw?.i_won) html += `<div class="won">🎉 おめでとう！あなたが当たりました。配布する人からの連絡（Roblox）を待ってください。</div>`;
    html += cardHtml(p, false);

    // ルーレット（抽選済みなら、だれが見ても同じ結果がもう一度流れる）
    if (p.draw) {
      const names = p.draw.winner_idx.map(i => p.draw.entrants[i]);
      html += `<div class="sect"><h3>🎡 抽選の結果</h3>
        <div class="roulette">
          <div class="wheel-wrap"><canvas id="wheel" width="720" height="720"></canvas><div class="pointer"></div><div class="wheel-center"><span class="qblock">?</span></div></div>
          <div class="roulette-msg" id="rMsg">参加 ${p.draw.entrants.length}人 → 当たり ${names.length}人</div>
          <div class="winners" id="rWinners">${names.map(n => `<span>${esc(n.avatar || '👤')} ${esc(n.name)}</span>`).join('')}</div>
          <button class="btn small gold" id="replay">▶ ルーレットをもう一度見る</button>
          <p class="fair">抽選は ${fmtDate(p.draw.drawn_at)} にサーバーで1回だけ行われ、結果はあとから変えられません。このルーレットは、保存された結果をもう一度見せています。</p>
        </div></div>`;
    } else if (p.is_mine && p.status === 'open') {
      html += `<div class="sect"><h3>🎡 ルーレットで抽選する</h3>
        <p class="hint">「ほしい！」した ${p.want_count}人 の中から ${p.winners}人 を選びます。<b>回し直しはできません。</b>押した時点で受付も締め切りになります。</p>
        <div class="roulette" id="drawArea">
          <div class="wheel-wrap"><canvas id="wheel" width="720" height="720"></canvas><div class="pointer"></div><div class="wheel-center"><span class="qblock">?</span></div></div>
          <button class="btn gold" id="drawBtn" ${p.want_count ? '' : 'disabled'}>🎡 ルーレットを回す</button>
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
        <a class="oc-link" href="${OPENCHAT_URL}" target="_blank" rel="noopener">💬 公認オプチャ「偽ラッキーブロックを打つ」に参加する ›</a>
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
      // 抽選した直後だけ自動で回す
      if (justDrawn === p.id) { justDrawn = null; play(); }
    } else if ($('drawBtn')) {
      loadEntrantNames(p.id).then(names => { new Wheel($('wheel'), names.length ? names : ['?']); });
      $('drawBtn').onclick = async () => {
        if (!confirm(`${p.want_count}人の中から ${p.winners}人 を選びます。回し直しはできません。回しますか？`)) return;
        $('drawBtn').disabled = true;
        const r2 = await rpc('lbd_draw', { p_token: token(), p_id: p.id });
        if (!r2.ok) { toast(reasonText(r2.reason)); $('drawBtn').disabled = false; return; }
        justDrawn = p.id; renderPost(p.id);
      };
    }
    if ($('entrants')) renderEntrants(p.id);
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
    try { const r = await rpc('lbd_entrants', { p_token: token(), p_id: id }); return r.ok ? r.entrants.map(e => e.display_name) : []; }
    catch { return []; }
  }
  async function renderEntrants(id) {
    let r;
    try { r = await rpc('lbd_entrants', { p_token: token(), p_id: id }); } catch { r = { ok: false }; }
    const box = $('entrants'); if (!box) return;
    if (!r.ok) { box.innerHTML = `<p class="hint">${esc(reasonText(r.reason))}</p>`; return; }
    if (!r.entrants.length) { box.innerHTML = '<p class="hint">まだだれも「ほしい！」していません。</p>'; return; }
    const won = r.entrants.filter(e => e.won);
    box.innerHTML = `
      ${won.length ? `<p class="hint">🏆 当たった人の Roblox ユーザー名: <b class="mono">${won.map(e => esc(e.roblox_name)).join(', ')}</b> <button class="copy" id="copyWon">コピー</button></p>` : ''}
      <table class="tbl"><thead><tr><th></th><th>名前</th><th>Roblox</th><th class="hide-sm">ID</th><th class="hide-sm">ほしい！した時刻</th></tr></thead><tbody>
      ${r.entrants.map(e => `<tr class="${e.won ? 'win' : ''}">
        <td>${e.won ? '🏆' : ''}</td>
        <td>${esc(e.avatar || '👤')} ${esc(e.display_name)}</td>
        <td>${e.roblox_id ? `<a href="https://www.roblox.com/users/${encodeURIComponent(e.roblox_id)}/profile" target="_blank" rel="noopener">${esc(e.roblox_display)}</a><br><span class="mono hint">@${esc(e.roblox_name)}</span>` : '<span class="hint">連携が外れています</span>'}</td>
        <td class="hide-sm mono">${esc(e.roblox_id || '')} ${e.roblox_id ? `<button class="copy" data-copy="${esc(e.roblox_id)}">コピー</button>` : ''}</td>
        <td class="hide-sm">${fmtDate(e.wanted_at)}</td></tr>`).join('')}
      </tbody></table>`;
    const cw = $('copyWon');
    if (cw) cw.onclick = () => copyText(won.map(e => e.roblox_name).join(', '));
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
        const t0 = performance.now();
        const step = now => {
          const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 4);
          this.angle = start + (target - start) * e; this.draw();
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
      wheel.marked.add(i); wheel.draw();
      $('rMsg').textContent = `🎉 ${k + 1}人目: ${entrants[i].avatar || ''} ${entrants[i].name}`;
      await new Promise(r => setTimeout(r, many ? 500 : 1200));
    }
    $('rMsg').textContent = `参加 ${entrants.length}人 → 当たり ${winnerIdx.length}人`;
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
    const t = e.target.closest('[data-want],[data-filter],[data-act],[data-copy],[data-copy-link],[data-official],[data-dismiss]');
    if (!t) return;
    if (t.dataset.want) {
      e.preventDefault(); e.stopPropagation();
      if (!(await requireRoblox())) return;
      t.disabled = true;
      try {
        const r = await rpc('lbd_want_toggle', { p_token: token(), p_id: +t.dataset.want });
        if (!r.ok) { toast(reasonText(r.reason)); return; }
        toast(r.i_want ? '❤ ほしい！しました。当たったら配布する人から連絡が来ます' : 'ほしい！を取り消しました');
        route();
      } finally { t.disabled = false; }
    } else if (t.dataset.filter) {
      filter = t.dataset.filter; renderList();
    } else if (t.dataset.act === 'create') {
      if (await requireRoblox()) openCreateModal();
    } else if (t.dataset.act === 'link') {
      openLinkModal();
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
    else if (h === '#/admin') renderAdmin();
    else renderList();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });

  (async () => {
    // ログイン状態は localStorage からすぐ読めるので、SDKの準備を待たずに表示する
    await loadMe(); updateHeader(); route();
    // ログイン・ログアウトしたら読み直す
    ka?.onChange(async () => { await loadMe(); updateHeader(); route(); });
  })();
})();

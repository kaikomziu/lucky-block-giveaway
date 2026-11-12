# ラッキーブロック配布所（非公式） v0.04

Roblox「ラッキーブロックを打つ」の配布をまとめる非公式サイト。素の HTML/CSS/JS（`index.html` `style.css` `app.js`）。

## しくみ
- ログイン: かるわかGAMESアカウント（`karuwaka-account.js`、`data-keys` は空なのでクラウドセーブはしない）。
  `kaikomziu.github.io` に置くと、ほかのゲームとログイン状態を共有できる。
- Roblox 連携: プロフィールの自己紹介に合言葉（ひらがなの単語。13歳未満の数字フィルター対策）を書いてもらい、
  Edge Function `lbd-roblox-verify`（`supabase/functions/lbd-roblox-verify/index.ts`、verify_jwt なし）が Roblox API で読んで確認する。
  `lbd_verify_apply` は service_role だけが呼べる。
- バッジ: Roblox 連携済み＝✅ 承認済み ／ 管理者（`ka_accounts.is_admin`）が許可＝👑 公認。
- 配布する・ほしい！どちらもログイン＋Roblox 連携が必要。ほしい人の Roblox ID は配布する人と管理者にだけ見える。
- 抽選はサーバー（`lbd_draw`）で1回だけ。結果は `lbd_draws` に保存し、ルーレットのアニメはその結果をもう一度見せるだけ（seed で動きも同じ）。
- 動画は保存しない。YouTube のリンクだけ貼れる。
- LINE: オープンチャットには外部から投稿するAPIがないので、配布ページの「LINEで送る」（line.me/R/share）と、オプチャ「ラッキーブロックを打つやってる人きてー」への案内（ヘッダー・一覧の下・配布ページ）で代わりにしている。

## DB（共有 Supabase kifnzvktwbomxthzvvgy、マイグレーション `lbd_giveaway_site`）
テーブル `lbd_users` `lbd_posts` `lbd_wants` `lbd_draws` `lbd_reports`（RLS で全拒否、RPC だけ）。
RPC: `lbd_me` `lbd_verify_start` `lbd_unlink` `lbd_list` `lbd_get` `lbd_post_create` `lbd_want_toggle`
`lbd_entrants` `lbd_draw` `lbd_post_update`（done / video / remove） `lbd_report`
`lbd_admin_overview` `lbd_admin_set_official` `lbd_admin_dismiss_reports`。
制限: 受付中は1人5件まで・投稿は1日10件まで・当たりは1〜50人・締め切りは5分後〜60日後・合言葉の確認は10分に10回まで。

## テスト
ローカル: `python -m http.server 8790`。テスト用アカウントは `e2e_` で始め、終わったら
`delete from ka_accounts where username like 'e2e\_lbd\_%'` で消す（lbd_* は連鎖して消える）。

## 更新するとき
バージョンを上げる（`index.html` のフッター、`?v=`、この README の見出し）。

// Roblox プロフィールの自己紹介に合言葉が書かれているか確かめて、かるわかGAMESアカウントと連携する
// 入力: { token: かるわかGAMESのトークン, username: Robloxのユーザー名 }
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, reason: "method" }, 405);
  let token = "", username = "";
  try {
    const b = await req.json();
    token = String(b.token ?? "");
    username = String(b.username ?? "").trim();
  } catch { return json({ ok: false, reason: "bad_request" }, 400); }
  if (!token) return json({ ok: false, reason: "auth" });
  // Roblox のユーザー名は英数字と _ で 3〜20 字
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return json({ ok: false, reason: "bad_username" });

  // ユーザー名 → ID
  let user: { id: number; name: string; displayName: string } | undefined;
  try {
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    });
    if (!r.ok) return json({ ok: false, reason: "roblox_error" });
    user = (await r.json()).data?.[0];
  } catch { return json({ ok: false, reason: "roblox_error" }); }
  if (!user) return json({ ok: false, reason: "roblox_not_found" });

  // ID → 自己紹介
  let description = "";
  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${user.id}`);
    if (!r.ok) return json({ ok: false, reason: "roblox_error" });
    description = String((await r.json()).description ?? "");
  } catch { return json({ ok: false, reason: "roblox_error" }); }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.rpc("lbd_verify_apply", {
    p_token: token, p_roblox_id: user.id, p_name: user.name, p_display: user.displayName, p_description: description,
  });
  if (error) return json({ ok: false, reason: "server" }, 500);
  return json(data);
});

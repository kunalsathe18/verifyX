// ============================================================
// auth.js  –  user registry
//
// PRIMARY:  Supabase (shared DB — proves 30+ users across devices)
// FALLBACK: localStorage (works offline / before Supabase is set up)
//
// Supabase table required (run once in Supabase SQL editor):
//
//   create table users (
//     id         bigserial primary key,
//     name       text        not null,
//     email      text        not null unique,
//     pw_hash    text        not null,
//     role       text        not null check (role in ('seller','customer')),
//     created_at timestamptz not null default now()
//   );
//
//   -- Allow public read/insert (anon key is safe for this demo)
//   alter table users enable row level security;
//   create policy "public insert" on users for insert with check (true);
//   create policy "public select" on users for select using (true);
//
// ============================================================

import { supabase, supabaseReady } from "./supabase";

const SESSION_KEY  = "verifyX_session";
const LS_USERS_KEY = "verifyX_users";   // localStorage fallback

// ─────────────────────────────────────────────────────────────
// localStorage helpers (fallback only)
// ─────────────────────────────────────────────────────────────
function lsGetUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY) || "{}"); }
  catch { return {}; }
}
function lsSaveUsers(u) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(u));
}

// ─────────────────────────────────────────────────────────────
// Session (always localStorage — just tracks who is logged in)
// ─────────────────────────────────────────────────────────────
function startSession(user) {
  const s = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

// ─────────────────────────────────────────────────────────────
// Sign Up
// ─────────────────────────────────────────────────────────────
export async function signUp(name, email, password, role) {
  // ── Validate ──
  if (!name.trim())         return { ok: false, error: "Name is required." };
  if (!email.trim())        return { ok: false, error: "Email is required." };
  if (!password)            return { ok: false, error: "Password is required." };
  if (password.length < 6)  return { ok: false, error: "Password must be at least 6 characters." };
  if (!["seller", "customer"].includes(role)) return { ok: false, error: "Select a role." };

  const key    = email.toLowerCase().trim();
  const pwHash = btoa(unescape(encodeURIComponent(password))); // safe base64

  // ── Supabase path ──
  if (supabaseReady) {
    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", key)
        .maybeSingle();

      if (existing) return { ok: false, error: "An account with this email already exists." };

      const { data, error } = await supabase
        .from("users")
        .insert({ name: name.trim(), email: key, pw_hash: pwHash, role })
        .select()
        .single();

      if (error) throw error;

      const user = { id: data.id, name: data.name, email: data.email, role: data.role };
      startSession(user);
      return { ok: true, user };

    } catch (err) {
      console.error("Supabase signUp error:", err.message);
      // Fall through to localStorage
    }
  }

  // ── localStorage fallback ──
  const users = lsGetUsers();
  if (users[key]) return { ok: false, error: "An account with this email already exists." };

  const user = { id: Date.now(), name: name.trim(), email: key, role, pwHash, createdAt: Date.now() };
  users[key] = user;
  lsSaveUsers(users);
  startSession(user);
  return { ok: true, user };
}

// ─────────────────────────────────────────────────────────────
// Sign In
// ─────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  if (!email.trim()) return { ok: false, error: "Email is required." };
  if (!password)     return { ok: false, error: "Password is required." };

  const key    = email.toLowerCase().trim();
  const pwHash = btoa(unescape(encodeURIComponent(password)));

  // ── Supabase path ──
  if (supabaseReady) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, pw_hash")
        .eq("email", key)
        .maybeSingle();

      if (error) throw error;
      if (!data)              return { ok: false, error: "No account found with this email." };
      if (data.pw_hash !== pwHash) return { ok: false, error: "Incorrect password." };

      const user = { id: data.id, name: data.name, email: data.email, role: data.role };
      startSession(user);
      return { ok: true, user };

    } catch (err) {
      console.error("Supabase signIn error:", err.message);
      // Fall through to localStorage
    }
  }

  // ── localStorage fallback ──
  const users = lsGetUsers();
  const user  = users[key];
  if (!user)                return { ok: false, error: "No account found with this email." };
  if (user.pwHash !== pwHash) return { ok: false, error: "Incorrect password." };

  startSession(user);
  return { ok: true, user };
}

// ─────────────────────────────────────────────────────────────
// Stats — used by Dashboard to show total registered users
// ─────────────────────────────────────────────────────────────
export async function getUserStats() {
  if (supabaseReady) {
    try {
      const { count: total } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: sellers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "seller");

      const { count: customers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer");

      return { total: total ?? 0, sellers: sellers ?? 0, customers: customers ?? 0 };
    } catch (err) {
      console.warn("getUserStats Supabase error:", err.message);
    }
  }

  // localStorage fallback
  const users     = Object.values(lsGetUsers());
  const sellers   = users.filter(u => u.role === "seller").length;
  const customers = users.filter(u => u.role === "customer").length;
  return { total: users.length, sellers, customers };
}

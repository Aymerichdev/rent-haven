// Shim que mantiene la API de `@supabase/supabase-js` pero la enruta a la API FastAPI propia.
// Compatible con las llamadas que ya usa el frontend:
//   supabase.from(table).select().eq().or().order().single()/maybeSingle()
//   supabase.from(table).insert(rows).select().single()
//   supabase.from(table).update(payload).eq(...)
//   supabase.from(table).upsert(rows, { onConflict })
//   supabase.from(table).delete().eq(...)
//   supabase.auth.{signInWithPassword, signUp, signOut, getSession,
//                  onAuthStateChange, updateUser, resetPasswordForEmail}
//   supabase.storage.from(bucket).{upload, remove, list, getPublicUrl}

const API_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_API_URL) ||
  "http://localhost:8000";

const SESSION_KEY = "estatehub.session";

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email: string; role: string; name: string; avatar?: string };
};

type AuthListener = (event: string, session: Session | null) => void;
const listeners = new Set<AuthListener>();

function getStoredSession(): Session | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setStoredSession(s: Session | null) {
  if (typeof localStorage === "undefined") return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

function emit(event: string, session: Session | null) {
  for (const l of listeners) {
    try {
      l(event, session);
    } catch (e) {
      console.error(e);
    }
  }
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const session = getStoredSession();
  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 && session?.refresh_token) {
    // Try refresh once
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      const newSession: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };
      setStoredSession(newSession);
      emit("TOKEN_REFRESHED", newSession);
      headers.set("Authorization", `Bearer ${newSession.access_token}`);
      return fetch(`${API_URL}${path}`, { ...init, headers });
    }
  }
  return res;
}

async function asError(res: Response): Promise<{ message: string; status: number; code?: string }> {
  let detail: any = res.statusText;
  try {
    const j = await res.json();
    detail = j.detail || j.message || j;
  } catch {
    /* ignore */
  }
  const message = typeof detail === "string" ? detail : JSON.stringify(detail);
  return { message, status: res.status, code: String(res.status) };
}

// ---------------- Query builder ----------------

type QueryReturn<T = any> = { data: T | null; error: { message: string; status?: number; code?: string } | null };

class QueryBuilder<T = any> implements PromiseLike<QueryReturn<T>> {
  private params = new URLSearchParams();
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private body: any = undefined;
  private wantSingle = false;
  private wantMaybe = false;
  private extraHeaders: Record<string, string> = {};
  private representationRequested = false;

  constructor(private table: string) {}

  // SELECT
  select(_cols?: string, _opts?: any) {
    this.representationRequested = true;
    return this;
  }

  // FILTERS
  eq(col: string, val: any) {
    this.params.append(col, `eq.${val}`);
    return this;
  }
  neq(col: string, val: any) {
    this.params.append(col, `neq.${val}`);
    return this;
  }
  gt(col: string, val: any) {
    this.params.append(col, `gt.${val}`);
    return this;
  }
  lt(col: string, val: any) {
    this.params.append(col, `lt.${val}`);
    return this;
  }
  gte(col: string, val: any) {
    this.params.append(col, `gte.${val}`);
    return this;
  }
  lte(col: string, val: any) {
    this.params.append(col, `lte.${val}`);
    return this;
  }
  in(col: string, vals: any[]) {
    this.params.append(col, `in.(${vals.join(",")})`);
    return this;
  }
  is(col: string, val: any) {
    this.params.append(col, `is.${val === null ? "null" : val}`);
    return this;
  }
  like(col: string, val: string) {
    this.params.append(col, `like.${val}`);
    return this;
  }
  ilike(col: string, val: string) {
    this.params.append(col, `ilike.${val}`);
    return this;
  }
  or(expr: string) {
    this.params.set("or", `(${expr})`);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    const dir = opts?.ascending === false ? "desc" : "asc";
    const existing = this.params.get("order");
    const next = existing ? `${existing},${col}.${dir}` : `${col}.${dir}`;
    this.params.set("order", next);
    return this;
  }
  limit(n: number) {
    this.params.set("limit", String(n));
    return this;
  }
  range(from: number, to: number) {
    this.params.set("offset", String(from));
    this.params.set("limit", String(to - from + 1));
    return this;
  }

  // WRITES
  insert(rows: any) {
    this.method = "POST";
    this.body = rows;
    return this;
  }
  update(payload: any) {
    this.method = "PATCH";
    this.body = payload;
    return this;
  }
  upsert(rows: any, opts?: { onConflict?: string }) {
    this.method = "POST";
    this.body = rows;
    this.extraHeaders["Prefer"] = "resolution=merge-duplicates,return=representation";
    if (opts?.onConflict) this.extraHeaders["x-on-conflict"] = opts.onConflict;
    return this;
  }
  delete() {
    this.method = "DELETE";
    return this;
  }

  // RESULT SHAPE
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantMaybe = true;
    return this;
  }

  private async exec(): Promise<QueryReturn<T>> {
    const headers: Record<string, string> = { ...this.extraHeaders };
    if (this.wantSingle) headers["Accept"] = "application/vnd.pgrst.object+json";
    const qs = this.params.toString();
    const path = `/rest/${this.table}${qs ? `?${qs}` : ""}`;
    try {
      const res = await rawFetch(path, {
        method: this.method,
        headers,
        body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
      });
      if (!res.ok) {
        // maybeSingle: 406 (zero rows) → data null, no error
        if (this.wantMaybe && (res.status === 406 || res.status === 404)) {
          return { data: null, error: null };
        }
        return { data: null, error: await asError(res) };
      }
      const text = await res.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      if (this.wantMaybe && Array.isArray(data)) {
        data = data.length ? data[0] : null;
      }
      if (this.wantSingle && Array.isArray(data)) {
        data = data[0] ?? null;
      }
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message || "Network error" } };
    }
  }

  then<R1 = QueryReturn<T>, R2 = never>(
    onfulfilled?: ((value: QueryReturn<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

// ---------------- Auth ----------------

const auth = {
  async getSession() {
    const session = getStoredSession();
    return { data: { session }, error: null as any };
  },
  async getUser() {
    const session = getStoredSession();
    if (!session) return { data: { user: null }, error: null };
    try {
      const res = await rawFetch("/auth/me");
      if (!res.ok) return { data: { user: null }, error: await asError(res) };
      const user = await res.json();
      return { data: { user }, error: null };
    } catch (e: any) {
      return { data: { user: null }, error: { message: e?.message || "Network error" } };
    }
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { data: { session: null, user: null }, error: await asError(res) };
    const j = await res.json();
    const session: Session = {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      user: j.user,
    };
    setStoredSession(session);
    emit("SIGNED_IN", session);
    return { data: { session, user: session.user }, error: null };
  },
  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { name?: string; role?: string }; emailRedirectTo?: string };
  }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: options?.data?.name || email.split("@")[0],
        role: options?.data?.role || "tenant",
      }),
    });
    if (!res.ok) return { data: { session: null, user: null }, error: await asError(res) };
    const j = await res.json();
    const session: Session = {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      user: j.user,
    };
    setStoredSession(session);
    emit("SIGNED_IN", session);
    return { data: { session, user: session.user }, error: null };
  },
  async signOut() {
    try {
      await rawFetch("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setStoredSession(null);
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  async updateUser({ password, data }: { password?: string; data?: { name?: string; avatar?: string } }) {
    const body: any = {};
    if (password) body.password = password;
    if (data?.name !== undefined) body.name = data.name;
    if (data?.avatar !== undefined) body.avatar = data.avatar;
    const res = await rawFetch("/auth/me", { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) return { data: { user: null }, error: await asError(res) };
    const user = await res.json();
    const session = getStoredSession();
    if (session) {
      session.user = user;
      setStoredSession(session);
      emit("USER_UPDATED", session);
    }
    return { data: { user }, error: null };
  },
  async resetPasswordForEmail(email: string, _opts?: { redirectTo?: string }) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { data: null, error: await asError(res) };
    return { data: { ok: true }, error: null };
  },
  // (used only by server middleware — we keep a stub so imports don't fail)
  async getClaims(_token: string) {
    return { data: null, error: { message: "getClaims no soportado en este shim" } };
  },
  onAuthStateChange(cb: AuthListener) {
    listeners.add(cb);
    // emit current state asynchronously
    queueMicrotask(() => cb("INITIAL_SESSION", getStoredSession()));
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(cb);
          },
        },
      },
    };
  },
};

// ---------------- Storage ----------------

function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: File | Blob, _opts?: { contentType?: string; upsert?: boolean }) {
      const form = new FormData();
      // path comes as "folder/uuid.ext" — we send the folder; backend assigns a uuid filename.
      const slash = path.lastIndexOf("/");
      const folder = slash >= 0 ? path.slice(0, slash) : "";
      form.append("folder", folder);
      form.append("file", file as Blob, (file as any).name || "upload");
      try {
        const res = await rawFetch("/storage/upload", { method: "POST", body: form });
        if (!res.ok) return { data: null, error: await asError(res) };
        const j = await res.json();
        return { data: { path: j.path, fullPath: j.path, publicUrl: j.url }, error: null };
      } catch (e: any) {
        return { data: null, error: { message: e?.message || "Network error" } };
      }
    },
    async remove(paths: string[]) {
      for (const p of paths) {
        try {
          await rawFetch(`/storage/object?path=${encodeURIComponent(p)}`, { method: "DELETE" });
        } catch {
          /* ignore */
        }
      }
      return { data: null, error: null };
    },
    async list(folder: string) {
      try {
        const res = await rawFetch(`/storage/list?folder=${encodeURIComponent(folder)}`);
        if (!res.ok) return { data: null, error: await asError(res) };
        return { data: await res.json(), error: null };
      } catch (e: any) {
        return { data: null, error: { message: e?.message || "Network error" } };
      }
    },
    getPublicUrl(path: string) {
      const base = API_URL.replace(/\/$/, "");
      // Build a stable public URL by asking the backend
      return { data: { publicUrl: `${base}/storage/public-url?path=${encodeURIComponent(path)}` } };
    },
    // Synchronous-ish: the original returns immediately. We can't go async here.
    // Most callers use the returned URL as-is; we keep a fallback that synchronously
    // constructs the Supabase Storage URL if SUPABASE_URL is exposed.
  };
}

// ---------------- Public surface ----------------

export const supabase = {
  from<T = any>(table: string) {
    return new QueryBuilder<T>(table);
  },
  auth,
  storage: {
    from: storageBucket,
  },
} as any;

// KOReader Sync Server — Cloudflare Worker
// Reimplementation of koreader-flask.py
// https://github.com/myelsukov/koreader-sync

import { landingPage, favicon } from "./landing";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  username: string;
  userkey: string;
}

interface DocumentPosition {
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status });
}

// ─── Database layer (KV-backed) ─────────────────────────────────────────────

async function getUser(
  kv: KVNamespace,
  username: string,
): Promise<User | null> {
  return kv.get<User>(`user:${username}`, "json");
}

async function addUser(
  kv: KVNamespace,
  username: string,
  userkey: string,
): Promise<boolean> {
  const existing = await getUser(kv, username);
  if (existing !== null) {
    return false;
  }
  const user: User = { username, userkey };
  await kv.put(`user:${username}`, JSON.stringify(user));
  return true;
}

async function getPosition(
  kv: KVNamespace,
  username: string,
  document: string,
): Promise<(DocumentPosition & { document: string }) | Record<string, never>> {
  const doc = await kv.get<DocumentPosition>(
    `doc:${username}:${document}`,
    "json",
  );
  if (doc !== null) {
    return { ...doc, document };
  }
  return {};
}

async function updatePosition(
  kv: KVNamespace,
  username: string,
  document: string,
  position: {
    percentage?: number;
    progress?: string;
    device?: string;
    device_id?: string;
  },
): Promise<number> {
  const timestamp = Math.floor(Date.now() / 1000);
  const doc: DocumentPosition = {
    percentage: position.percentage ?? 0,
    progress: position.progress ?? "",
    device: position.device ?? "",
    device_id: position.device_id ?? "",
    timestamp,
  };
  await kv.put(`doc:${username}:${document}`, JSON.stringify(doc));
  return timestamp;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function authorizeRequest(
  kv: KVNamespace,
  request: Request,
): Promise<User> {
  const username = request.headers.get("x-auth-user");
  const userkey = request.headers.get("x-auth-key");

  if (!username || !userkey) {
    throw new ServiceError("Unauthorized", 401);
  }

  const user = await getUser(kv, username);
  if (user === null) {
    throw new ServiceError("Forbidden", 403);
  }
  if (userkey !== user.userkey) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
}

// ─── Error class ─────────────────────────────────────────────────────────────

class ServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (pathname === "/" && method === "GET") {
        return landingPage();
      }

      if (pathname === "/favicon.ico" && method === "GET") {
        return favicon();
      }

      // POST /users/create
      if (pathname === "/users/create" && method === "POST") {
        return await handleRegister(env.KV, request);
      }

      // GET /users/auth
      if (pathname === "/users/auth" && method === "GET") {
        return await handleAuthorize(env.KV, request);
      }

      // GET /syncs/progress/:document
      const progressMatch = pathname.match(/^\/syncs\/progress\/(.+)$/);
      if (progressMatch && method === "GET") {
        const document = decodeURIComponent(progressMatch[1]);
        return await handleGetProgress(env.KV, request, document);
      }

      // PUT /syncs/progress
      if (pathname === "/syncs/progress" && method === "PUT") {
        return await handleUpdateProgress(env.KV, request);
      }

      return textResponse("Not found", 404);
    } catch (err) {
      if (err instanceof ServiceError) {
        return json({ message: err.message }, err.status);
      }
      console.error(err);
      return json({ message: "Unknown server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// ─── Route handlers ──────────────────────────────────────────────────────────

async function handleRegister(
  kv: KVNamespace,
  request: Request,
): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return textResponse("Invalid request", 400);
  }

  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const { username, password: userkey } = body;

  if (!username || !userkey) {
    return textResponse("Invalid request", 400);
  }

  const created = await addUser(kv, username, userkey);
  if (!created) {
    return textResponse("Username is already registered.", 409);
  }

  return json({ username }, 201);
}

async function handleAuthorize(
  kv: KVNamespace,
  request: Request,
): Promise<Response> {
  await authorizeRequest(kv, request);
  return json({ authorized: "OK" }, 200);
}

async function handleGetProgress(
  kv: KVNamespace,
  request: Request,
  document: string,
): Promise<Response> {
  const user = await authorizeRequest(kv, request);
  const position = await getPosition(kv, user.username, document);
  return json(position, 200);
}

async function handleUpdateProgress(
  kv: KVNamespace,
  request: Request,
): Promise<Response> {
  const user = await authorizeRequest(kv, request);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return textResponse("Invalid request", 400);
  }

  const position = (await request.json()) as {
    document?: string;
    percentage?: number;
    progress?: string;
    device?: string;
    device_id?: string;
  };
  const { document } = position;

  if (!document) {
    return textResponse("Invalid request", 400);
  }

  const timestamp = await updatePosition(kv, user.username, document, position);
  return json({ document, timestamp }, 200);
}

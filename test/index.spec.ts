import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

const BASE = 'https://example.com';

function authHeaders(username = 'testuser', key = 'testpass') {
	return { 'x-auth-user': username, 'x-auth-key': key };
}

async function createUser(username = 'testuser', password = 'testpass') {
	return SELF.fetch(`${BASE}/users/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password }),
	});
}

describe('POST /users/create', () => {
	it('creates a new user', async () => {
		const res = await createUser();
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({ username: 'testuser' });
	});

	it('rejects duplicate username', async () => {
		await createUser('dupuser', 'pass1');
		const res = await createUser('dupuser', 'pass2');
		expect(res.status).toBe(409);
	});

	it('rejects non-JSON body', async () => {
		const res = await SELF.fetch(`${BASE}/users/create`, {
			method: 'POST',
			body: 'not json',
		});
		expect(res.status).toBe(400);
	});

	it('rejects missing fields', async () => {
		const res = await SELF.fetch(`${BASE}/users/create`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: 'nopass' }),
		});
		expect(res.status).toBe(400);
	});
});

describe('GET /users/auth', () => {
	it('authorizes valid credentials', async () => {
		await createUser('authuser', 'authpass');
		const res = await SELF.fetch(`${BASE}/users/auth`, {
			headers: authHeaders('authuser', 'authpass'),
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ authorized: 'OK' });
	});

	it('rejects missing headers', async () => {
		const res = await SELF.fetch(`${BASE}/users/auth`);
		expect(res.status).toBe(401);
	});

	it('rejects unknown user', async () => {
		const res = await SELF.fetch(`${BASE}/users/auth`, {
			headers: authHeaders('ghost', 'nope'),
		});
		expect(res.status).toBe(403);
	});

	it('rejects wrong password', async () => {
		await createUser('wrongpwuser', 'right');
		const res = await SELF.fetch(`${BASE}/users/auth`, {
			headers: authHeaders('wrongpwuser', 'wrong'),
		});
		expect(res.status).toBe(401);
	});
});

describe('GET /syncs/progress/:document', () => {
	it('returns empty object for unknown document', async () => {
		await createUser('reader1', 'key1');
		const res = await SELF.fetch(`${BASE}/syncs/progress/unknown-doc`, {
			headers: authHeaders('reader1', 'key1'),
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({});
	});

	it('returns saved position after update', async () => {
		await createUser('reader2', 'key2');
		await SELF.fetch(`${BASE}/syncs/progress`, {
			method: 'PUT',
			headers: { ...authHeaders('reader2', 'key2'), 'Content-Type': 'application/json' },
			body: JSON.stringify({
				document: 'book.epub',
				progress: '/body/p[5]',
				percentage: 0.25,
				device: 'kindle',
				device_id: 'dev123',
			}),
		});

		const res = await SELF.fetch(`${BASE}/syncs/progress/book.epub`, {
			headers: authHeaders('reader2', 'key2'),
		});
		expect(res.status).toBe(200);
		const body = await res.json<Record<string, unknown>>();
		expect(body.document).toBe('book.epub');
		expect(body.progress).toBe('/body/p[5]');
		expect(body.percentage).toBe(0.25);
		expect(body.device).toBe('kindle');
		expect(body.device_id).toBe('dev123');
		expect(body.timestamp).toBeTypeOf('number');
	});

	it('rejects unauthenticated request', async () => {
		const res = await SELF.fetch(`${BASE}/syncs/progress/book.epub`);
		expect(res.status).toBe(401);
	});
});

describe('PUT /syncs/progress', () => {
	it('updates position and returns document + timestamp', async () => {
		await createUser('writer1', 'wkey1');
		const res = await SELF.fetch(`${BASE}/syncs/progress`, {
			method: 'PUT',
			headers: { ...authHeaders('writer1', 'wkey1'), 'Content-Type': 'application/json' },
			body: JSON.stringify({
				document: 'novel.pdf',
				progress: 'page42',
				percentage: 0.5,
				device: 'phone',
				device_id: 'p1',
			}),
		});
		expect(res.status).toBe(200);
		const body = await res.json<Record<string, unknown>>();
		expect(body.document).toBe('novel.pdf');
		expect(body.timestamp).toBeTypeOf('number');
	});

	it('rejects non-JSON body', async () => {
		await createUser('writer2', 'wkey2');
		const res = await SELF.fetch(`${BASE}/syncs/progress`, {
			method: 'PUT',
			headers: authHeaders('writer2', 'wkey2'),
			body: 'not json',
		});
		expect(res.status).toBe(400);
	});

	it('rejects missing document field', async () => {
		await createUser('writer3', 'wkey3');
		const res = await SELF.fetch(`${BASE}/syncs/progress`, {
			method: 'PUT',
			headers: { ...authHeaders('writer3', 'wkey3'), 'Content-Type': 'application/json' },
			body: JSON.stringify({ progress: 'p1', percentage: 0.1 }),
		});
		expect(res.status).toBe(400);
	});
});

describe('GET /', () => {
	it('returns the landing page as HTML', async () => {
		const res = await SELF.fetch(`${BASE}/`);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
		const html = await res.text();
		expect(html).toContain('KOReader Sync Server');
		expect(html).toContain('/users/create');
		expect(html).toContain('/syncs/progress');
	});
});

describe('routing', () => {
	it('returns 404 for unknown paths', async () => {
		const res = await SELF.fetch(`${BASE}/nope`);
		expect(res.status).toBe(404);
	});
});

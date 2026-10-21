const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// Use isolated test database
const testDbFile = path.join(os.tmpdir(), `kudos_test_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
process.env.DB_PATH = testDbFile;

const app = require('../index');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  return {
    status: res.status,
    headers: res.headers,
    body
  };
}

describe('Datacom Kudos Portal - Spec-Driven Test Suite', () => {
  before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(() => {
        try {
          if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
        } catch {}
        resolve();
      });
    });
  });

  describe('1. Colleague Directory & User Retrieval', () => {
    it('should retrieve list of colleagues for dropdown selection', async () => {
      const res = await request('/api/users');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.users));
      assert.ok(res.body.users.length >= 5);
      const user = res.body.users[0];
      assert.ok(user.name);
      assert.ok(user.email);
      assert.ok(user.department);
    });

    it('should retrieve current user context via x-user-id header', async () => {
      const res = await request('/api/users/current', {
        headers: { 'x-user-id': 'usr_sarah_chen' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.id, 'usr_sarah_chen');
      assert.equal(res.body.user.name, 'Sarah Chen');
    });
  });

  describe('2. Kudos Submission & Validation (AC-01, AC-02)', () => {
    it('should reject kudos with empty or too short message (< 5 chars)', async () => {
      const res = await request('/api/kudos', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: {
          recipient_id: 'usr_alex_kumar',
          category: 'Teamwork',
          message: 'Hi'
        }
      });
      assert.equal(res.status, 422);
      assert.match(res.body.message, /at least 5 characters/i);
    });

    it('should reject kudos exceeding maximum 500 characters', async () => {
      const longMessage = 'A'.repeat(501);
      const res = await request('/api/kudos', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: {
          recipient_id: 'usr_alex_kumar',
          category: 'Teamwork',
          message: longMessage
        }
      });
      assert.equal(res.status, 422);
      assert.match(res.body.message, /exceeds the maximum/i);
    });

    it('should reject self-kudos (user cannot appreciate oneself)', async () => {
      const res = await request('/api/kudos', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: {
          recipient_id: 'usr_sarah_chen',
          category: 'Innovation',
          message: 'I did a fantastic job today!'
        }
      });
      assert.equal(res.status, 400);
      assert.match(res.body.message, /cannot give kudos to yourself/i);
    });

    it('should successfully create a valid kudos message', async () => {
      const res = await request('/api/kudos', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: {
          recipient_id: 'usr_alex_kumar',
          category: 'Teamwork',
          message: 'Alex provided invaluable architectural guidance on the API refactor today!'
        }
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.kudos.id);
      assert.equal(res.body.kudos.is_visible, true);
      assert.equal(res.body.kudos.recipient_name, 'Alex Kumar');
    });

    it('should prevent spam duplicate submissions within 5-minute cooldown', async () => {
      // Submitting the exact same kudos again
      const res = await request('/api/kudos', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: {
          recipient_id: 'usr_alex_kumar',
          category: 'Teamwork',
          message: 'Alex provided invaluable architectural guidance on the API refactor today!'
        }
      });
      assert.equal(res.status, 429);
      assert.match(res.body.message, /identical kudos was already submitted/i);
    });
  });

  describe('3. Public Feed & Visibility Constraints (AC-03)', () => {
    it('should only return visible, unmoderated kudos for standard users', async () => {
      const res = await request('/api/kudos', {
        headers: { 'x-user-id': 'usr_sarah_chen' }
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.items.length > 0);

      // Verify that every single returned item is visible
      res.body.items.forEach((item) => {
        assert.equal(item.is_visible, true);
      });

      // Verify that seed hidden item 'kud_seed_005' is NOT in public feed
      const hiddenFound = res.body.items.find(k => k.id === 'kud_seed_005');
      assert.equal(hiddenFound, undefined);
    });

    it('should filter kudos feed by category tag', async () => {
      const res = await request('/api/kudos?category=Innovation');
      assert.equal(res.status, 200);
      res.body.items.forEach(k => {
        assert.equal(k.category, 'Innovation');
      });
    });
  });

  describe('4. Social Reactions', () => {
    it('should toggle an emoji reaction on a kudos card', async () => {
      const res = await request('/api/kudos/kud_seed_001/react', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_sarah_chen' },
        body: { emoji: '❤️' }
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.reactions);
      assert.equal(res.body.reactions['❤️'].hasReacted, true);
    });
  });

  describe('5. Content Moderation & RBAC Governance (US-07, US-08, US-09)', () => {
    it('should forbid non-admin users from hiding kudos (403 Forbidden)', async () => {
      const res = await request('/api/moderation/kud_seed_001/hide', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_alex_kumar' }, // Regular USER
        body: { reason: 'I disagree with this comment.' }
      });
      assert.equal(res.status, 403);
      assert.match(res.body.message, /administrator privileges are required/i);
    });

    it('should require a detailed reason of at least 5 chars for moderation', async () => {
      const res = await request('/api/moderation/kud_seed_001/hide', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_jordan_taylor' }, // ADMIN
        body: { reason: 'No' }
      });
      assert.equal(res.status, 400);
      assert.match(res.body.message, /at least 5 characters is mandatory/i);
    });

    it('should allow administrator to hide inappropriate kudos and update metadata', async () => {
      const res = await request('/api/moderation/kud_seed_002/hide', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_jordan_taylor' }, // ADMIN
        body: { reason: 'Contains unauthorized sensitive client reference.' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.is_visible, false);
      assert.equal(res.body.moderated_by, 'usr_jordan_taylor');
      assert.ok(res.body.moderated_at);

      // Verify it is now immediately hidden from the public feed
      const feedRes = await request('/api/kudos', {
        headers: { 'x-user-id': 'usr_sarah_chen' }
      });
      const hiddenFound = feedRes.body.items.find(k => k.id === 'kud_seed_002');
      assert.equal(hiddenFound, undefined);
    });

    it('should create an immutable audit log record for every moderation action', async () => {
      const res = await request('/api/moderation/logs', {
        headers: { 'x-user-id': 'usr_jordan_taylor' }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.logs));
      const latestLog = res.body.logs[0];
      assert.equal(latestLog.admin_name, 'Jordan Taylor');
      assert.ok(latestLog.action);
      assert.ok(latestLog.reason);
    });

    it('should allow administrator to unhide / restore a kudos', async () => {
      const res = await request('/api/moderation/kud_seed_002/unhide', {
        method: 'POST',
        headers: { 'x-user-id': 'usr_jordan_taylor' },
        body: { reason: 'Review completed; approved by manager.' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.is_visible, true);

      // Verify it appears back in the public feed
      const feedRes = await request('/api/kudos', {
        headers: { 'x-user-id': 'usr_sarah_chen' }
      });
      const found = feedRes.body.items.find(k => k.id === 'kud_seed_002');
      assert.ok(found);
    });
  });
});

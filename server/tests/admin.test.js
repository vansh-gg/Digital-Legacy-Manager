import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { client, registeredClient, prisma } from './helpers.js';

const DEMO_PASSWORD = 'Test-Demo-4821';

async function adminClient() {
  const admin = await registeredClient({ name: 'Site Admin' });
  await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  return admin;
}

const statusOf = async (email) => (await prisma.user.findUnique({ where: { email } })).legacyStatus;

describe('Admin area & demo tools', () => {
  before(async () => {
    process.env.DEMO_PASSWORD = DEMO_PASSWORD;
    // Start from a clean demo set (no demo accounts yet in the test database).
    const admin = await adminClient();
    const res = await admin.c.post('/api/admin/demo/reset');
    assert.equal(res.status, 200, JSON.stringify(res.body));
  });

  test('TC-ADM-01 admin endpoints need a signed-in administrator (checked on the server)', async () => {
    const anon = client();
    assert.equal((await anon.get('/api/admin/overview')).status, 401);

    const { c } = await registeredClient();
    for (const [method, url] of [
      ['get', '/api/admin/overview'],
      ['get', '/api/admin/users'],
      ['get', '/api/admin/users/someone/activity'],
      ['post', '/api/admin/demo/reset'],
    ]) {
      assert.equal((await c[method](url)).status, 403, `${method} ${url}`);
    }
  });

  test('TC-ADM-02 admin sees account status and dates but never vault contents', async () => {
    const owner = await registeredClient({ name: 'Private Owner' });
    await owner.c.post('/api/assets').send({ category: 'BANK', title: 'Secret Swiss Account', secret: { password: 'TopSecret!9' } });
    await owner.c.post('/api/nominees').send({ name: 'Hidden Heir', email: 'heir.adm02@example.com', relationship: 'Son' });

    const { c } = await adminClient();
    const res = await c.get(`/api/admin/users?q=${encodeURIComponent(owner.user.email)}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.users.length, 1);
    const row = res.body.users[0];
    assert.equal(row.legacyStatus, 'ACTIVE');
    assert.ok(row.nextCheckInDue);
    assert.equal(row.trustedPeople, 1);

    const activity = await c.get(`/api/admin/users/${owner.user.id}/activity`);
    assert.equal(activity.status, 200);
    assert.ok(activity.body.activity.some((e) => e.action === 'ASSET_CREATED' || e.action === 'ACCOUNT_CREATED'));

    const everything = JSON.stringify([res.body, activity.body, (await c.get('/api/admin/overview')).body]);
    for (const leak of ['Secret Swiss Account', 'TopSecret!9', 'Hidden Heir', 'heir.adm02']) {
      assert.ok(!everything.includes(leak), `admin response leaked "${leak}"`);
    }
  });

  test('TC-ADM-03 accounts can be searched by name/email and filtered by status', async () => {
    const { c } = await adminClient();
    const byName = await c.get('/api/admin/users?q=sunita');
    assert.deepEqual(byName.body.users.map((u) => u.email), ['sunita@example.com']);
    const released = await c.get('/api/admin/users?status=RELEASED');
    assert.ok(released.body.users.some((u) => u.email === 'gopal@example.com'));
    assert.ok(released.body.users.every((u) => u.legacyStatus === 'RELEASED'));
    const overview = await c.get('/api/admin/overview');
    assert.ok(overview.body.totals.demo >= 13); // 6 owners + 7 nominees with accounts
    assert.ok(overview.body.totals.byStatus.GRACE >= 2);
  });

  test('TC-DEMO-01 read-only preview shows a demo owner without counting as a check-in', async () => {
    const c = client();
    const login = await c.post('/api/auth/login').send({ email: 'sunita@example.com', password: DEMO_PASSWORD, preview: true });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.readOnly, true);
    assert.equal(login.body.user.legacyStatus, 'REMINDED');
    assert.equal(await statusOf('sunita@example.com'), 'REMINDED');

    assert.equal((await c.get('/api/dashboard')).status, 200);
    assert.equal((await c.get('/api/auth/me')).body.user.readOnly, true);
    // Nothing can be changed, including checking in.
    assert.equal((await c.post('/api/check-in')).status, 403);
    assert.equal((await c.post('/api/assets').send({ category: 'OTHER', title: 'x' })).status, 403);
    assert.equal(await statusOf('sunita@example.com'), 'REMINDED');

    // Preview is only for demo accounts.
    const real = await registeredClient();
    const other = await client().post('/api/auth/login').send({ email: real.user.email, password: real.password, preview: true });
    assert.equal(other.status, 400);
  });

  test('TC-DEMO-02 normal login still checks in; reset restores every scenario', async () => {
    for (const email of ['sunita@example.com', 'mohan@example.com', 'gopal@example.com']) {
      const res = await client().post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.legacyStatus, 'ACTIVE', `${email} should be checked in by a normal login`);
    }

    const { c } = await adminClient();
    const reset = await c.post('/api/admin/demo/reset');
    assert.equal(reset.status, 200);
    assert.equal(reset.body.scenarios, 6);

    assert.equal(await statusOf('ramesh@example.com'), 'ACTIVE');
    assert.equal(await statusOf('sunita@example.com'), 'REMINDED');
    assert.equal(await statusOf('mohan@example.com'), 'GRACE');
    assert.equal(await statusOf('meera@example.com'), 'GRACE');
    assert.equal(await statusOf('gopal@example.com'), 'RELEASED');
    assert.equal(await statusOf('harish@example.com'), 'ACTIVE');
    // The demo password did not change.
    assert.equal((await client().post('/api/auth/login').send({ email: 'kavya@example.com', password: DEMO_PASSWORD })).status, 200);
  });

  test('TC-DEMO-03 reset leaves every non-demo account untouched', async () => {
    const owner = await registeredClient({ name: 'Untouched Owner' });
    await owner.c.post('/api/assets').send({ category: 'BANK', title: 'My real account' });
    await owner.c.post('/api/nominees').send({ name: 'Real Nominee', email: 'real.nominee.demo03@example.com', relationship: 'Wife' });
    await prisma.user.update({ where: { id: owner.user.id }, data: { legacyStatus: 'GRACE', graceEndsAt: new Date(Date.now() + 86_400_000) } });

    const snapshot = async () => {
      const users = await prisma.user.findMany({ where: { isDemo: false }, orderBy: { id: 'asc' } });
      const assets = await prisma.asset.count({ where: { owner: { isDemo: false } } });
      const nominees = await prisma.nominee.count({ where: { owner: { isDemo: false } } });
      const logs = await prisma.auditLog.count({ where: { user: { isDemo: false }, action: { not: 'ADMIN_DEMO_RESET' } } });
      return JSON.stringify({ users: users.map((u) => [u.id, u.email, u.legacyStatus, u.lastCheckInAt, u.role]), assets, nominees, logs });
    };

    const before = await snapshot();
    const { c } = await adminClient();
    const afterAdmin = await snapshot(); // the new admin account itself
    assert.equal((await c.post('/api/admin/demo/reset')).status, 200);
    assert.equal(await snapshot(), afterAdmin);
    assert.notEqual(before, afterAdmin);
    assert.equal(await statusOf(owner.user.email), 'GRACE');
  });

  test('TC-DEMO-04 demo email addresses cannot be registered by anyone else', async () => {
    const res = await client().post('/api/auth/register').send({ name: 'Imposter', email: 'ramesh@example.com', password: 'Secret123' });
    assert.equal(res.status, 409);
  });
});

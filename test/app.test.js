const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../app');

async function setup() {
  const server = createApp().listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (user, method, url, body) => {
    const r = await fetch(base + url, { method, headers: { 'x-user': user, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: r.status, json: await r.json() };
  };
  return { call, close: () => server.close() };
}

test('create, save and reload preserves formatting; scripts are stripped', async () => {
  const { call, close } = await setup();
  const { json: { id } } = await call('alice', 'POST', '/docs', {});
  await call('alice', 'PUT', `/docs/${id}`, { title: 'Plan', content: '<h1>Hi</h1><p><b>bold</b><script>x()</script></p><ul><li>a</li></ul>' });
  const { json } = await call('alice', 'GET', `/docs/${id}`);
  assert.strictEqual(json.title, 'Plan');
  assert.strictEqual(json.content, '<h1>Hi</h1><p><b>bold</b></p><ul><li>a</li></ul>');
  close();
});

test('sharing: owner vs shared, viewer cannot edit, strangers see nothing', async () => {
  const { call, close } = await setup();
  const { json: { id } } = await call('alice', 'POST', '/docs', { title: 'Spec' });
  assert.strictEqual((await call('bob', 'GET', `/docs/${id}`)).status, 404);
  assert.strictEqual((await call('bob', 'POST', `/docs/${id}/share`, { user: 'carol', role: 'editor' })).status, 404);
  await call('alice', 'POST', `/docs/${id}/share`, { user: 'bob', role: 'viewer' });
  assert.strictEqual((await call('bob', 'PUT', `/docs/${id}`, { content: 'x' })).status, 403);
  await call('alice', 'POST', `/docs/${id}/share`, { user: 'bob', role: 'editor' });
  assert.strictEqual((await call('bob', 'PUT', `/docs/${id}`, { content: '<p>x</p>' })).status, 200);
  const list = (await call('bob', 'GET', '/docs')).json;
  assert.deepStrictEqual(list.map((d) => d.role), ['editor']);
  assert.strictEqual((await call('alice', 'GET', '/docs')).json[0].role, 'owner');
  close();
});

test('validation: bad title, bad role, unsupported upload', async () => {
  const { call, close } = await setup();
  assert.strictEqual((await call('alice', 'POST', '/docs', { title: '   ' })).status, 400);
  const { json: { id } } = await call('alice', 'POST', '/docs', {});
  assert.strictEqual((await call('alice', 'POST', `/docs/${id}/share`, { user: 'bob', role: 'admin' })).status, 400);
  assert.strictEqual((await call(undefined, 'GET', '/docs')).status, 401);
  close();
});

test('markdown import becomes an editable document', async () => {
  const server = createApp().listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const r = await fetch(`${base}/import?name=notes.md`, { method: 'POST', headers: { 'x-user': 'alice' }, body: '# Title\n\n- one\n- two' });
  assert.strictEqual(r.status, 201);
  const { id } = await r.json();
  const d = await (await fetch(`${base}/docs/${id}`, { headers: { 'x-user': 'alice' } })).json();
  assert.match(d.content, /<h1>Title<\/h1>/);
  assert.match(d.content, /<li>one<\/li>/);
  const bad = await fetch(`${base}/import?name=x.exe`, { method: 'POST', headers: { 'x-user': 'alice' }, body: 'x' });
  assert.strictEqual(bad.status, 400);
  server.close();
});

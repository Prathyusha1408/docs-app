const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const sanitizeHtml = require('sanitize-html');
const mammoth = require('mammoth');
const { marked } = require('marked');
const path = require('path');

const USERS = [
  { id: 'alice', name: 'Alice Chen' },
  { id: 'bob', name: 'Bob Okafor' },
  { id: 'carol', name: 'Carol Diaz' },
];
const ROLES = ['viewer', 'editor'];
const CLEAN = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'div', 'span'],
  allowedAttributes: {},
};
const clean = (html) => sanitizeHtml(String(html ?? ''), CLEAN);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function createApp(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS docs(id INTEGER PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', owner TEXT NOT NULL, updated_at TEXT NOT NULL);
           CREATE TABLE IF NOT EXISTS shares(doc_id INTEGER NOT NULL, user TEXT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(doc_id, user));`);
  const now = () => new Date().toISOString();
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Mocked auth: the client sends the chosen seeded user in X-User.
  app.use('/api', (req, res, next) => {
    if (req.path === '/users') return next();
    const u = USERS.find((x) => x.id === req.get('x-user'));
    if (!u) return res.status(401).json({ error: 'Pick a user to continue.' });
    req.user = u.id;
    next();
  });

  // Returns the caller's access level for a doc: 'owner' | 'editor' | 'viewer' | null.
  const access = (doc, user) => {
    if (!doc) return null;
    if (doc.owner === user) return 'owner';
    return db.prepare('SELECT role FROM shares WHERE doc_id=? AND user=?').get(doc.id, user)?.role ?? null;
  };
  const load = (req, res, need) => {
    const doc = db.prepare('SELECT * FROM docs WHERE id=?').get(Number(req.params.id));
    const lvl = access(doc, req.user);
    if (!lvl) { res.status(404).json({ error: 'Document not found.' }); return null; }
    if (need === 'edit' && lvl === 'viewer') { res.status(403).json({ error: 'You have view-only access.' }); return null; }
    if (need === 'owner' && lvl !== 'owner') { res.status(403).json({ error: 'Only the owner can do this.' }); return null; }
    return { doc, role: lvl };
  };
  const insert = (title, content, owner) =>
    Number(db.prepare('INSERT INTO docs(title,content,owner,updated_at) VALUES(?,?,?,?)').run(title, content, owner, now()).lastInsertRowid);
  const validTitle = (t) => typeof t === 'string' && t.trim().length > 0 && t.length <= 120;

  app.get('/api/users', (_q, res) => res.json(USERS));

  app.get('/api/docs', (req, res) => {
    const rows = db.prepare(`SELECT d.id,d.title,d.owner,d.updated_at, CASE WHEN d.owner=? THEN 'owner' ELSE s.role END AS role
      FROM docs d LEFT JOIN shares s ON s.doc_id=d.id AND s.user=? WHERE d.owner=? OR s.user IS NOT NULL ORDER BY d.updated_at DESC`).all(req.user, req.user, req.user);
    res.json(rows);
  });

  app.post('/api/docs', (req, res) => {
    const title = req.body.title ?? 'Untitled document';
    if (!validTitle(title)) return res.status(400).json({ error: 'Title must be 1–120 characters.' });
    res.status(201).json({ id: insert(title.trim(), '', req.user) });
  });

  app.get('/api/docs/:id', (req, res) => {
    const r = load(req, res); if (!r) return;
    const shares = r.role === 'owner' ? db.prepare('SELECT user,role FROM shares WHERE doc_id=?').all(r.doc.id) : undefined;
    res.json({ ...r.doc, role: r.role, shares });
  });

  app.put('/api/docs/:id', (req, res) => {
    const r = load(req, res, 'edit'); if (!r) return;
    const { title, content } = req.body;
    if (title !== undefined && !validTitle(title)) return res.status(400).json({ error: 'Title must be 1–120 characters.' });
    if (content !== undefined && typeof content !== 'string') return res.status(400).json({ error: 'Content must be HTML text.' });
    db.prepare('UPDATE docs SET title=?, content=?, updated_at=? WHERE id=?')
      .run(title?.trim() ?? r.doc.title, content === undefined ? r.doc.content : clean(content), now(), r.doc.id);
    res.json({ ok: true });
  });

  app.post('/api/docs/:id/share', (req, res) => {
    const r = load(req, res, 'owner'); if (!r) return;
    const { user, role } = req.body;
    if (!USERS.some((u) => u.id === user)) return res.status(400).json({ error: 'Unknown user.' });
    if (user === req.user) return res.status(400).json({ error: 'You already own this document.' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Role must be viewer or editor.' });
    db.prepare('INSERT INTO shares(doc_id,user,role) VALUES(?,?,?) ON CONFLICT(doc_id,user) DO UPDATE SET role=excluded.role').run(r.doc.id, user, role);
    res.json({ ok: true });
  });

  app.delete('/api/docs/:id/share/:user', (req, res) => {
    const r = load(req, res, 'owner'); if (!r) return;
    db.prepare('DELETE FROM shares WHERE doc_id=? AND user=?').run(r.doc.id, req.params.user);
    res.json({ ok: true });
  });

  // Import: raw file body, filename in ?name=. Supports .txt, .md, .docx (5 MB max).
  app.post('/api/import', express.raw({ type: '*/*', limit: '5mb' }), async (req, res) => {
    const name = String(req.query.name || '');
    const ext = path.extname(name).toLowerCase();
    if (!['.txt', '.md', '.docx'].includes(ext)) return res.status(400).json({ error: 'Unsupported file type. Use .txt, .md or .docx.' });
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'The file is empty.' });
    try {
      let html;
      if (ext === '.docx') html = (await mammoth.convertToHtml({ buffer: req.body })).value;
      else if (ext === '.md') html = marked.parse(req.body.toString('utf8'));
      else html = req.body.toString('utf8').split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
      const title = path.basename(name, ext).slice(0, 120) || 'Imported document';
      res.status(201).json({ id: insert(title, clean(html), req.user) });
    } catch {
      res.status(422).json({ error: 'Could not read that file. Is it a valid .docx?' });
    }
  });

  return app;
}
module.exports = { createApp, USERS };

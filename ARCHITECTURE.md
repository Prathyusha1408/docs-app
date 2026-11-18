# Architecture note
**Shape:** one Express process serves a JSON API and a static single-page UI. SQLite holds two tables, `docs` and `shares(doc_id, user, role)`.

**What I prioritized**
1. *Access logic on the server.* Every document route goes through one `load(req, res, need)` check returning owner, editor, viewer or 404. The UI hides controls, but the API is what enforces them, and the tests target the API.
2. *Editing that feels usable.* A native `contenteditable` editor with a toolbar, debounced autosave, a visible save status, and keyboard shortcuts. This costs nothing to host and keeps the bundle small.
3. *Import that fits the workflow.* A file becomes an editable draft: mammoth for .docx, marked for .md, escaped paragraphs for .txt.
4. *Safe persistence.* HTML is sanitized on write, so stored content is trusted on read.

**Deliberate cuts:** real-time collaboration (needs CRDT/OT; last write wins here), real auth (seeded users via an `X-User` header, which is not secure and is labelled as mock), delete and version history, and a framework or build step. Next, with 2–4 hours: Tiptap or Yjs for the editor and live co-editing, password or OAuth login, delete and trash, and a conflict warning when a doc changed since it was opened.

**Tradeoffs:** `execCommand` is deprecated but works in every browser and is enough for this formatting set. SQLite is simple but single-node.

# Submission contents

## Links
- **Live product:** https://docs-app-732u.onrender.com/
- **Walkthrough video:** https://www.loom.com/share/4dec421f37484a94808805b496e1351e (also in `walkthrough-url.txt`)
- **Source repo:** https://github.com/Prathyusha1408/docs-app

## Seeded users (no passwords)
Alice Chen, Bob Okafor, Carol Diaz. Pick one from the "Signed in as" dropdown.
Hosting note: the free tier sleeps when idle, so the first load can take about a minute. Documents reset when the service restarts or redeploys.

## Included files
- Source: `app.js`, `server.js`, `public/index.html`, `test/app.test.js`, `package.json`, `package-lock.json`, `Dockerfile`, `.dockerignore`, `.gitignore`
- `README.md`: setup, seeded users, review steps
- `ARCHITECTURE.md`: architecture note
- `AI_WORKFLOW.md`: AI workflow note
- `walkthrough-url.txt`: walkthrough video URL

## What's working
Create, rename, edit, autosave and reopen documents with rich text (bold, italic, underline, headings, bulleted and numbered lists); import of .txt, .md and .docx files; sharing with owner, editor and viewer roles, enforced on the server; SQLite persistence; validation and error handling; 4 automated tests; deployed on Render.

## What's incomplete
No real-time co-editing (last write wins), mocked login with seeded users, no document delete, no version history.

## Next, with another 2-4 hours
Real-time editing with Tiptap and Yjs, real authentication, delete and trash, and a warning when a document changed since it was opened.
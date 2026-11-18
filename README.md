# Drafts: a lightweight collaborative document editor

Node 22.12+ + Express + SQLite (`node:sqlite`, no native build) with a dependency-free browser UI.

## Run locally
```
npm install
npm start        # http://localhost:3000
npm test         # 4 automated API tests (node:test)
```
Docker: `docker build -t drafts . && docker run -p 3000:3000 -v drafts:/data drafts`

If port 3000 is already in use, pick another one:
- Command Prompt: `set PORT=3456 && npm start`
- PowerShell: `$env:PORT=3456; npm start`

## Review the sharing flow
Mocked auth: pick a seeded user in the header dropdown (**Alice Chen, Bob Okafor, Carol Diaz**; no passwords).
1. As Alice, click **New document**, type, format, rename. It autosaves.
2. Click **Share**, give Bob "Can edit" (or "Can view").
3. Switch to Bob: the doc appears under **Shared with me** with a badge. View-only docs lock the editor.
4. Switch to Carol: she sees nothing (the API returns 404).

## Features
- Create, rename, edit, autosave, reopen. Bold, italic, underline, heading, subheading, bulleted and numbered lists.
- Import **.txt, .md, .docx** (max 5 MB). Each file becomes a new editable document. Other types are rejected with a message.
- Owner, editor and viewer roles. Only the owner can share, change access or remove people.
- Content is stored as sanitized HTML (allow-list of tags, no attributes), so formatting survives reloads and pasted scripts are stripped.

## Known limits
No real-time co-editing (last write wins), no real authentication, no version history, no delete. `node:sqlite` prints an experimental warning on Node 22.

## Deploy
Live at https://docs-app-732u.onrender.com/ (Render, free tier, Docker). The `Dockerfile` also works on Fly.io or Railway. Render's free tier has no persistent disk, so documents reset on restart or redeploy; mount a volume at `/data` to keep the SQLite file.


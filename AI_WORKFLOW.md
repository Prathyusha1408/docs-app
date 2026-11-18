# AI workflow note

**Tools:** Claude (chat with a code sandbox) generated the first version of the code, tests and docs. I ran, reviewed and fixed it locally in VS Code, and tested it in Chrome.

**Where AI sped me up:** Scaffolding the API and access-check structure, writing the test cases, and building the first working UI in one pass. It also suggested `node:sqlite`, which avoids installing a native database module.

**What I changed or rejected:**
- **Startup bug in `server.js`.** The generated version printed "Docs running" even when the port was already taken, then exited silently. I diagnosed the port conflict on my machine with `netstat` and `tasklist`, which showed another Java process holding port 3000. With Claude's help I traced the silent exit to the server's startup callback, then changed the server to report the error and exit with a failure code. In the meantime I ran on a different port.
- **Docker setup.** The first version was missing a `.dockerignore` (my Windows `node_modules` would have been copied into the Linux container) and a `/data` folder for the database. I added both before deploying.
- **Scope.** I kept the cuts the AI proposed (no real-time co-editing, real login, delete or version history) because they fit the timebox, and I documented them instead of half-building them.

**How I verified it:**
- **Correctness:** 4 automated API tests covering a formatting round trip (including script stripping), owner/editor/viewer enforcement, input validation, and markdown import.
- **UX:** I used the app in Chrome and went through creating, formatting and reloading a document, importing a file, and the locked view-only editor.
- **Sharing:** I shared documents as editor and as viewer and switched between Alice, Bob and Carol to confirm who could see and edit what.
- **Deployment:** Deployed on Render (free tier, Docker) at https://docs-app-732u.onrender.com and repeated the sharing flow there with Alice, Bob and Carol.
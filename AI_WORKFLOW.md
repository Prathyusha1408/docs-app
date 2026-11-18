# AI workflow note
**Tools:** Claude (chat, with a code sandbox) generated the first version of the code, tests and docs.

**Where AI sped me up:** scaffolding the API, the access-check structure, the test cases, and the UI in one pass; choosing `node:sqlite` to avoid a native-module install.

**Changed or rejected:** “Fixed a bug in the generated server.js: when port 3000 was already taken, it printed ‘running’ and exited silently. It now reports the error and exits with a failure code. Added a .dockerignore and a /data folder in the Dockerfile that the first version was missing.”

**How it was verified:** “Ran the 4 automated tests. Tested the full sharing flow in Chrome with Alice, Bob and Carol: create, format, reload, import, share as editor and viewer, revoke.”



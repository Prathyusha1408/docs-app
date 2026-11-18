const { createApp } = require('./app');
const port = process.env.PORT || 3000;
// Express 5 passes startup errors (e.g. EADDRINUSE) to this callback.
createApp(process.env.DB_PATH || 'data.db').listen(port, (err) => {
  if (err) {
    console.error(`Could not start on port ${port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`Docs running on http://localhost:${port}`);
});
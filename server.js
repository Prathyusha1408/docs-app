const { createApp } = require('./app');
const port = process.env.PORT || 3000;
createApp(process.env.DB_PATH || 'data.db').listen(port, () => console.log(`Docs running on http://localhost:${port}`));

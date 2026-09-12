const Database = require("better-sqlite3");

const db = new Database("routine_app.db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    date TEXT NOT NULL,
    appOpened INTEGER DEFAULT 0,
    actionCompleted INTEGER DEFAULT 0,
    feedbackValue INTEGER,
    receivedAt TEXT NOT NULL
  )
`).run();

const columns = db.prepare("PRAGMA table_info(events)").all();
const hasFeedbackText = columns.some((column) => column.name === "feedbackText");

if (!hasFeedbackText) {
  db.prepare("ALTER TABLE events ADD COLUMN feedbackText TEXT").run();
}

module.exports = db;
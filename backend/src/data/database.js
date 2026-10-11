const Database = require("better-sqlite3");

const db = new Database("routine_app.db");
db.pragma("foreign_keys = ON");

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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    displayName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient'
      CHECK (role IN ('patient', 'therapist')),
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    tokenHash TEXT PRIMARY KEY NOT NULL,
    userId TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (expiresAt > createdAt)
  );

  CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
    ON auth_sessions(userId);

  CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiration
    ON auth_sessions(expiresAt);
`);

module.exports = db;
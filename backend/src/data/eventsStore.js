const db = require("./database");

function addEvent(eventData) {
  const receivedAt = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO events (
      userId,
      date,
      appOpened,
      actionCompleted,
      feedbackValue,
      feedbackText,
      receivedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    eventData.userId,
    eventData.date,
    eventData.appOpened ? 1 : 0,
    eventData.actionCompleted ? 1 : 0,
    eventData.feedbackValue ?? null,
    eventData.feedbackText ?? null,
    receivedAt
  );

  return {
    id: result.lastInsertRowid,
    ...eventData,
    receivedAt,
  };
}

function getAllEvents() {
  return db.prepare("SELECT * FROM events ORDER BY id DESC").all();
}

function getEventsByUserId(userId) {
  return db
    .prepare("SELECT * FROM events WHERE userId = ? ORDER BY date ASC")
    .all(userId);
}

module.exports = {
  addEvent,
  getAllEvents,
  getEventsByUserId,
};
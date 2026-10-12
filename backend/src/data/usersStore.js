const { randomUUID } = require("node:crypto");
const db = require("./database");

function findUserByEmail(email) {
    return db.prepare(`
        SELECT id, email, displayName, passwordHash, role, createdAt, emailVerifiedAt
        FROM users
        WHERE email = ?
    `).get(email);
}

function findUserById(id) {
    return db.prepare(`
        SELECT id, email, displayName, role, createdAt, emailVerifiedAt
        FROM users
        WHERE id = ?
    `).get(id);
}

function createPatient({ email, displayName, passwordHash }) {
    const id = randomUUID();
    const createdAt = Date.now();

    db.prepare(`
        INSERT INTO users (
            id,
            email,
            displayName,
            passwordHash,
            role,
            createdAt
        )
        VALUES (?, ?, ?, ?, 'patient', ?)
    `).run(id, email, displayName, passwordHash, createdAt);

    return findUserById(id);
}

module.exports = {
    findUserByEmail,
    findUserById,
    createPatient,
};
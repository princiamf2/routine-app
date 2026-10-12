const { randomBytes, createHash } = require("node:crypto");
const db = require("../data/database");

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

const insertSession = db.transaction((userId) => {
    const user = db.prepare(`
        SELECT id
        FROM users
        WHERE id = ? AND emailVerifiedAt IS NOT NULL
    `).get(userId);

    if (!user) {
        return null;
    }

    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;
    const token = randomBytes(32).toString("base64url");

    db.prepare(`
        DELETE FROM auth_sessions
        WHERE expiresAt <= ?
    `).run(now);

    db.prepare(`
        INSERT INTO auth_sessions (
            tokenHash, userId, createdAt, expiresAt
        )
        VALUES (?, ?, ?, ?)
    `).run(hashToken(token), user.id, now, expiresAt);

    return { token, expiresAt };
});

function createAuthSession(userId) {
    if (typeof userId !== "string" || userId.length === 0) {
        return null;
    }

    return insertSession.immediate(userId);
}

function getAuthenticatedUser(token) {
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
        return null;
    }

    const user = db.prepare(`
        SELECT
            users.id,
            users.email,
            users.displayName,
            users.role,
            users.createdAt,
            users.emailVerifiedAt
        FROM auth_sessions
        JOIN users ON users.id = auth_sessions.userId
        WHERE auth_sessions.tokenHash = ?
          AND auth_sessions.expiresAt > ?
          AND users.emailVerifiedAt IS NOT NULL
    `).get(hashToken(token), Date.now());

    return user ?? null;
}

function revokeAuthSession(token) {
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
        return false;
    }

    const result = db.prepare(`
        DELETE FROM auth_sessions
        WHERE tokenHash = ?
    `).run(hashToken(token));

    return result.changes > 0;
}

module.exports = {
    createAuthSession,
    getAuthenticatedUser,
    revokeAuthSession,
};
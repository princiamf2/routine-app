const db = require("../data/database");
const { sendVerificationEmail } = require("./mailService");
const {
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode,
} = require("./verificationCodeService");

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(until, now) {
    return {
        status: "rate_limited",
        retryAfterSeconds: Math.max(1, Math.ceil((until - now) / 1000)),
    };
}

const prepareVerification = db.transaction((userId) => {
    const now = Date.now();

    const user = db.prepare(`
        SELECT email, emailVerifiedAt
        FROM users
        WHERE id = ?
    `).get(userId);

    if (!user || user.emailVerifiedAt !== null) {
        return { status: "not_required" };
    }

    const previous = db.prepare(`
        SELECT codeHash, createdAt, expiresAt, attempts
        FROM email_verifications
        WHERE userId = ?
    `).get(userId);

    const previousIsActive = previous && previous.expiresAt > now;

    if (previousIsActive && previous.attempts >= MAX_ATTEMPTS) {
        return rateLimited(previous.expiresAt, now);
    }

    if (previous && now < previous.createdAt + RESEND_DELAY_MS) {
        return rateLimited(previous.createdAt + RESEND_DELAY_MS, now);
    }

    let code;
    let codeHash;

    do {
        code = generateVerificationCode();
        codeHash = hashVerificationCode(userId, code);
    } while (previous && codeHash === previous.codeHash);

    // Un renvoi ne remet pas à zéro les essais d'un code encore actif.
    const attempts = previousIsActive ? previous.attempts : 0;

    db.prepare(`
        INSERT INTO email_verifications (
            userId, codeHash, createdAt, expiresAt, attempts
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(userId) DO UPDATE SET
            codeHash = excluded.codeHash,
            createdAt = excluded.createdAt,
            expiresAt = excluded.expiresAt,
            attempts = excluded.attempts
    `).run(userId, codeHash, now, now + CODE_LIFETIME_MS, attempts);

    return {
        status: "prepared",
        email: user.email,
        code,
    };
});

async function requestEmailVerification(userId) {
    if (typeof userId !== "string" || userId.length === 0) {
        return { status: "not_required" };
    }

    const prepared = prepareVerification.immediate(userId);

    if (prepared.status !== "prepared") {
        return prepared;
    }

    // L'envoi réseau se fait après la transaction SQLite.
    // Si l'envoi échoue, le délai avant renvoi reste en vigueur.
    await sendVerificationEmail(prepared.email, prepared.code);

    return {
        status: "sent",
        retryAfterSeconds: RESEND_DELAY_MS / 1000,
    };
}

const checkVerification = db.transaction((userId, code) => {
    const now = Date.now();

    const user = db.prepare(`
        SELECT emailVerifiedAt
        FROM users
        WHERE id = ?
    `).get(userId);

    if (!user || user.emailVerifiedAt !== null) {
        return { status: "invalid" };
    }

    const verification = db.prepare(`
        SELECT codeHash, expiresAt, attempts
        FROM email_verifications
        WHERE userId = ?
    `).get(userId);

    if (!verification || verification.expiresAt <= now) {
        return { status: "invalid" };
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
        return rateLimited(verification.expiresAt, now);
    }

    const matches = verifyVerificationCode(
        userId,
        code,
        verification.codeHash
    );

    if (!matches) {
        db.prepare(`
            UPDATE email_verifications
            SET attempts = attempts + 1
            WHERE userId = ?
        `).run(userId);

        if (verification.attempts + 1 >= MAX_ATTEMPTS) {
            return rateLimited(verification.expiresAt, now);
        }

        return { status: "invalid" };
    }

    db.prepare(`
        UPDATE users
        SET emailVerifiedAt = ?
        WHERE id = ?
    `).run(now, userId);

    db.prepare(`
        DELETE FROM email_verifications
        WHERE userId = ?
    `).run(userId);

    return { status: "verified" };
});

function confirmEmailVerification(userId, code) {
    if (typeof userId !== "string" || userId.length === 0) {
        return { status: "invalid" };
    }

    return checkVerification.immediate(userId, code);
}

module.exports = {
    requestEmailVerification,
    confirmEmailVerification,
};
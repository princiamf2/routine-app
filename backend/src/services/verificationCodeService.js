const {
    randomInt,
    createHmac,
    timingSafeEqual,
} = require("node:crypto");

function getSecret() {
    const secret = process.env.EMAIL_VERIFICATION_SECRET;

    if (typeof secret !== "string" || !/^[a-f0-9]{64}$/.test(secret)) {
        throw new Error("La clé de vérification des e-mails est manquante ou invalide.");
    }

    return Buffer.from(secret, "hex");
}

function generateVerificationCode() {
    return randomInt(0, 1000000).toString().padStart(6, "0");
}

function hashVerificationCode(userId, code) {
    if (typeof userId !== "string" || userId.length === 0) {
        throw new Error("Identifiant utilisateur invalide.");
    }

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
        throw new Error("Le code doit contenir 6 chiffres.");
    }

    const payload = JSON.stringify([
        "routine-email-verification-v1",
        userId,
        code,
    ]);

    return createHmac("sha256", getSecret())
        .update(payload)
        .digest("hex");
}

function verifyVerificationCode(userId, code, storedHash) {
    if (
        typeof userId !== "string" ||
        userId.length === 0 ||
        typeof code !== "string" ||
        !/^\d{6}$/.test(code) ||
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(storedHash)
    ) {
        return false;
    }

    const actualHash = hashVerificationCode(userId, code);

    return timingSafeEqual(
        Buffer.from(actualHash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}

module.exports = {
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode,
};
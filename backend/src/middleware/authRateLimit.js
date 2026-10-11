const { rateLimit } = require("express-rate-limit");

function createLimiter(limit, message) {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            error: message,
        },
    });
}

const registrationLimiter = createLimiter(
    5,
    "Trop de demandes d’inscription. Réessaie plus tard."
);

const verifyEmailLimiter = createLimiter(
    30,
    "Trop de tentatives de vérification. Réessaie plus tard."
);

const resendVerificationLimiter = createLimiter(
    5,
    "Trop de demandes de code. Réessaie plus tard."
);

module.exports = {
    registrationLimiter,
    verifyEmailLimiter,
    resendVerificationLimiter,
};
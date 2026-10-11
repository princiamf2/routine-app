const express = require("express");
const { validateRegistration } = require("../services/authValidationService");
const { hashPassword } = require("../services/passwordService");
const {
    findUserByEmail,
    createPatient,
} = require("../data/usersStore");
const {
    requestEmailVerification,
    confirmEmailVerification,
} = require("../services/emailVerificationService");
const {
    registrationLimiter,
    verifyEmailLimiter,
    resendVerificationLimiter,
} = require("../middleware/authRateLimit");

const router = express.Router();

function readEmail(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return null;
    }

    if (typeof body.email !== "string") {
        return null;
    }

    const email = body.email.trim().toLowerCase();

    if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return null;
    }

    return email;
}

function registrationConflict(res) {
    return res.status(409).json({
        success: false,
        error: "Cette adresse est déjà utilisée. Connecte-toi ou demande un nouveau code si ton adresse n’est pas encore vérifiée.",
    });
}

router.post("/register", registrationLimiter, async (req, res) => {
    const validation = validateRegistration(req.body);

    if (validation.error) {
        return res.status(400).json({
            success: false,
            error: validation.error,
        });
    }

    try {
        const { email, displayName, password } = validation.data;

        if (findUserByEmail(email)) {
            return registrationConflict(res);
        }

        const passwordHash = await hashPassword(password);
        const patient = createPatient({
            email,
            displayName,
            passwordHash,
        });

        let codeSent = false;

        try {
            const result = await requestEmailVerification(patient.id);
            codeSent = result.status === "sent";
        } catch {
            console.error("Échec de l’envoi du code après inscription.");
        }

        return res.status(201).json({
            success: true,
            verificationRequired: true,
            codeSent,
            email: patient.email,
            message: codeSent
                ? "Compte créé. Saisis le code reçu par e-mail."
                : "Compte créé, mais l’envoi du code n’a pas été confirmé. Demande un nouveau code dans une minute.",
        });
    } catch (error) {
        // Deux inscriptions simultanées peuvent viser la même adresse.
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return registrationConflict(res);
        }

        console.error("Échec de la création du compte.");

        return res.status(500).json({
            success: false,
            error: "Impossible de créer le compte pour le moment.",
        });
    }
});

router.post("/verify-email", verifyEmailLimiter, (req, res) => {
    const email = readEmail(req.body);
    const code = typeof req.body?.code === "string"
        ? req.body.code.trim()
        : null;

    if (!email || !code || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            success: false,
            error: "Une adresse e-mail valide et un code à 6 chiffres sont requis.",
        });
    }

    try {
        const user = findUserByEmail(email);
        const result = user
            ? confirmEmailVerification(user.id, code)
            : { status: "invalid" };

        if (result.status === "rate_limited") {
            res.set("Retry-After", String(result.retryAfterSeconds));

            return res.status(429).json({
                success: false,
                error: "Trop de tentatives. Attends avant de demander un nouveau code.",
                retryAfterSeconds: result.retryAfterSeconds,
            });
        }

        if (result.status !== "verified") {
            return res.status(400).json({
                success: false,
                error: "Code invalide ou expiré.",
            });
        }

        return res.json({
            success: true,
            message: "Adresse e-mail vérifiée. Tu peux maintenant te connecter.",
        });
    } catch {
        console.error("Échec de la vérification de l’adresse e-mail.");

        return res.status(500).json({
            success: false,
            error: "Impossible de vérifier l’adresse pour le moment.",
        });
    }
});

router.post(
    "/resend-verification",
    resendVerificationLimiter,
    async (req, res) => {
        const email = readEmail(req.body);

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Une adresse e-mail valide est requise.",
            });
        }

        try {
            const user = findUserByEmail(email);

            if (user) {
                await requestEmailVerification(user.id);
            }

            // Même réponse pour une adresse absente, déjà vérifiée
            // ou temporairement limitée.
            return res.status(202).json({
                success: true,
                message: "Si cette adresse correspond à un compte non vérifié et que le délai de renvoi est écoulé, un nouveau code sera envoyé.",
            });
        } catch {
            console.error("Échec du renvoi du code de vérification.");

            return res.status(503).json({
                success: false,
                error: "L’envoi n’a pas pu être confirmé. Réessaie dans une minute.",
            });
        }
    }
);

module.exports = router;
const { isValidPassword } = require("./passwordService");

function validateRegistration(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Les informations d’inscription sont invalides." };
    }

    if (typeof body.email !== "string") {
        return { error: "Une adresse e-mail valide est requise." };
    }

    const email = body.email.trim().toLowerCase();

    if (
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return { error: "Une adresse e-mail valide est requise." };
    }

    if (typeof body.displayName !== "string") {
        return { error: "Le nom doit contenir entre 1 et 100 caractères." };
    }

    const displayName = body.displayName.trim();
    const nameLength = Array.from(displayName).length;

    if (nameLength < 1 || nameLength > 100) {
        return { error: "Le nom doit contenir entre 1 et 100 caractères." };
    }

    if (!isValidPassword(body.password)) {
        return {
            error: "Le mot de passe doit contenir entre 8 et 128 caractères, une majuscule, un chiffre et un caractère spécial.",
        };
    }

    return {
        data: {
            email,
            displayName,
            password: body.password,
        },
    };
}

module.exports = { validateRegistration };
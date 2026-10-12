const {
    getAuthenticatedUser,
} = require("../services/authSessionService");

function unauthorized(res) {
    res.set("WWW-Authenticate", 'Bearer realm="Routine"');

    return res.status(401).json({
        success: false,
        error: "Une connexion valide est requise.",
    });
}

function requireAuth(req, res, next) {
    res.set("Cache-Control", "no-store");

    const authorization = req.get("Authorization");
    const match = typeof authorization === "string"
        ? /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(authorization)
        : null;

    if (!match) {
        return unauthorized(res);
    }

    try {
        const token = match[1];
        const user = getAuthenticatedUser(token);

        if (!user) {
            return unauthorized(res);
        }

        req.user = user;
        req.authToken = token;
    } catch {
        console.error("Échec du contrôle de la session.");

        return res.status(500).json({
            success: false,
            error: "Impossible de vérifier la connexion pour le moment.",
        });
    }

    return next();
}

module.exports = { requireAuth };
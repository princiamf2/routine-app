function validateEventPayload(body, today = new Date().toISOString().slice(0, 10)) {
    if (!body || typeof body !== "object" || Array.isArray(body))
        return { error: "Le corps de la requête doit être un objet." };

    const { userId, date } = body;

    if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(userId))
        return { error: "Identifiant utilisateur invalide." };

    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return { error: "La date doit respecter le format AAAA-MM-JJ." };

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date > today)
        return { error: "La date doit être valide et ne pas être future." };

    const appOpened = body.appOpened === undefined ? false : body.appOpened;
    const actionCompleted = body.actionCompleted === undefined ? false : body.actionCompleted;

    if (typeof appOpened !== "boolean" || typeof actionCompleted !== "boolean")
        return { error: "Les indicateurs doivent être des booléens." };

    if (appOpened === actionCompleted)
        return {error: "Un événement doit représenter soit une ouverture, soit une séance terminée.",};

    const feedbackValue = body.feedbackValue ?? null;
    const feedbackText = body.feedbackText ?? null;

    if (actionCompleted && (!Number.isInteger(feedbackValue) || feedbackValue < 1 || feedbackValue > 10))
        return { error: "Le ressenti doit être un entier entre 1 et 10." };

    if (feedbackText !== null && (typeof feedbackText !== "string" || feedbackText.length > 2000))
        return { error: "Le commentaire doit contenir au maximum 2000 caractères." };

    if (!actionCompleted && (feedbackValue !== null || (feedbackText !== null && feedbackText !== "")))
        return { error: "Le ressenti doit accompagner une séance terminée." };

    return {
        event: {
            userId,
            date,
            appOpened,
            actionCompleted,
            feedbackValue,
            feedbackText,
        },
    };
}

module.exports = { validateEventPayload };
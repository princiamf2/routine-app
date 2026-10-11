const express = require("express");
const {
    addEvent,
    getEventsByUserId,
} = require("../data/eventsStore");
const {
    validateEventPayload,
} = require("../services/eventValidationService");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.post("/", (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({
            success: false,
            error: "Le corps de la requête doit être un objet.",
        });
    }

    if (body.userId !== undefined && body.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: "Impossible d’enregistrer un événement pour un autre compte.",
        });
    }

    const validation = validateEventPayload({
        ...body,
        userId: req.user.id,
    });

    if (validation.error) {
        return res.status(400).json({
            success: false,
            error: validation.error,
        });
    }

    const event = addEvent(validation.event);

    return res.status(201).json({
        success: true,
        event,
    });
});

router.get("/", (req, res) => {
    const events = getEventsByUserId(req.user.id);
    return res.json(events);
});

module.exports = router;
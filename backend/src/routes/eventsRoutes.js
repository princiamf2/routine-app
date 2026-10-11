const express = require("express");
const { addEvent, getAllEvents, } = require("../data/eventsStore");
const { validateEventPayload, } = require("../services/eventValidationService");

const router = express.Router();

router.post("/", (req, res) => {
    const validation = validateEventPayload(req.body);

    if (validation.error)
        return res.status(400).json({ success: false, error: validation.error, });

    const event = addEvent(validation.event);


    res.status(201).json({
        success: true,
        event,
    });
});

router.get("/", (req, res) => {
    const events = getAllEvents();
    res.json(events);
});

module.exports = router;
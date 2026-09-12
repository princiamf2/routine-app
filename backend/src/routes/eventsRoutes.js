const express = require("express");
const {
    addEvent,
    getAllEvents,
} = require("../data/eventsStore");

const router = express.Router();

router.post("/", (req, res) => {
    const event = addEvent(req.body);

    console.log("New event:", event);

    res.status(201).json({
        sucess: true,
        event,
    });
});

router.get("/", (req, res) => {
    const events = getAllEvents();
    res.json(events);
});

module.exports = router;
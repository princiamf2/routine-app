const express = require("express");
const { getEventsByUserId } = require("../data/eventsStore");
const { buildUserAnalytics } = require("../services/analyticsService");
const { buildAdaptiveSession } = require("../services/adaptiveProgramService");

const router = express.Router();

router.get("/:userId", (req, res) => {
    const userId = req.params.userId;
    const day = Number(req.query.day || 1);

    const events = getEventsByUserId(userId);
    const analytics = buildUserAnalytics(events);
    const session = buildAdaptiveSession(analytics.streak, day, analytics.feedbackAverage);

    res.json({
        success: true,
        ...session,
    });
});

module.exports = router;
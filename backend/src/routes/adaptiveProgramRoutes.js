const express = require("express");
const { getEventsByUserId } = require("../data/eventsStore");
const { buildUserAnalytics } = require("../services/analyticsService");
const { buildAdaptiveSession } = require("../services/adaptiveProgramService");

const router = express.Router();

router.get("/:userId", (req, res) => {
    const userId = req.params.userId;
    const rawDay = req.query.day;
    const day = rawDay === undefined ? 1 : typeof rawDay === "string" ? Number(rawDay) : NaN;
    if ((rawDay !== undefined && (typeof rawDay !== "string" || !/^[1-9]\d*$/.test(rawDay))) || !Number.isSafeInteger(day) || day < 1)
        return res.status(400).json({success: false, error: "Le jour doit être un entier positif valide",});

    const events = getEventsByUserId(userId);
    const analytics = buildUserAnalytics(events);
    const session = buildAdaptiveSession(analytics.streak, day, analytics.latestFeedback);

    res.json({
        success: true,
        ...session,
        feedbackAverage: analytics.feedbackAverage,
    });
});

module.exports = router;
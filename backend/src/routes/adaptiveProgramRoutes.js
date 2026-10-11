const express = require("express");
const { getEventsByUserId } = require("../data/eventsStore");
const { buildUserAnalytics } = require("../services/analyticsService");
const { buildAdaptiveSession } = require("../services/adaptiveProgramService");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
    const rawDay = req.query.day;
    const day = rawDay === undefined
        ? 1
        : typeof rawDay === "string"
            ? Number(rawDay)
            : NaN;

    if (
        (
            rawDay !== undefined &&
            (typeof rawDay !== "string" || !/^[1-9]\d*$/.test(rawDay))
        ) ||
        !Number.isSafeInteger(day) ||
        day < 1
    ) {
        return res.status(400).json({
            success: false,
            error: "Le jour doit être un entier positif valide.",
        });
    }

    const events = getEventsByUserId(req.user.id);
    const analytics = buildUserAnalytics(events);
    const session = buildAdaptiveSession(
        analytics.streak,
        day,
        analytics.latestFeedback
    );

    return res.json({
        success: true,
        ...session,
        feedbackAverage: analytics.feedbackAverage,
    });
});

module.exports = router;
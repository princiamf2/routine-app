const express = require("express");
const { getEventsByUserId } = require("../data/eventsStore");
const { buildUserAnalytics } = require("../services/analyticsService");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res) => {
    const userId = req.user.id;
    const userEvents = getEventsByUserId(userId);
    const analytics = buildUserAnalytics(userEvents);

    return res.json({
        userId,
        ...analytics,
    });
});

module.exports = router;
const express = require("express");
const { getEventsByUserId } = require("../data/eventsStore");
const { buildUserAnalytics } = require("../services/analyticsService");

const router = express.Router();

router.get("/:userId", (req, res) => {
  const userId = req.params.userId;

  const userEvents = getEventsByUserId(userId);
  const analytics = buildUserAnalytics(userEvents);

  res.json({
    userId,
    ...analytics,
  });
});

module.exports = router;
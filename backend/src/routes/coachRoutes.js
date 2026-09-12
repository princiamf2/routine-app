const express = require("express");
const { buildCoachResponse } = require("../services/coachBotService");

const router = express.Router();

router.post("/message", (req, res) => {
  try {
    const { message, history, movementTitle, movementDescription } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    const response = buildCoachResponse(message, history || [], {
      movementTitle,
      movementDescription,
    });

    res.json(response);
  } catch (error) {
    console.log("Erreur route coach:", error);

    res.status(500).json({
      success: false,
      error: "Erreur serveur pendant l’analyse du message",
    });
  }
});

module.exports = router;
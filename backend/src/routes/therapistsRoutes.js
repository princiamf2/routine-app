const express = require("express");
const { findNearbyTherapists } = require("../services/therapistsService");

const router = express.Router();

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: "lat and lng are required",
      });
    }

    const therapists = await findNearbyTherapists(lat, lng);

    res.json(therapists);
  } catch (error) {
    console.log("Erreur route therapists:", error);

    res.status(500).json({
      success: false,
      error: "Erreur serveur pendant la recherche de thérapeutes",
    });
  }
});

module.exports = router;
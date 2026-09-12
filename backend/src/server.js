const express = require("express");
const cors = require("cors");
const eventsRoutes = require("./routes/eventsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const therapistsRoutes = require("./routes/therapistsRoutes");
const coachRoutes= require("./routes/coachRoutes");
const adaptiveProgramRoutes = require("./routes/adaptiveProgramRoutes");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/events", eventsRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/therapists", therapistsRoutes);
app.use("/coach", coachRoutes);
app.use("/adaptive-session", adaptiveProgramRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
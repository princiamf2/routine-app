const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("La configuration d’envoi des e-mails est manquante.");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
}

async function sendVerificationEmail(email, code) {
  if (
    typeof email !== "string" ||
    !email.trim() ||
    /[\r\n]/.test(email)
  ) {
    throw new Error("Adresse de destination invalide.");
  }

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new Error("Le code de vérification doit contenir 6 chiffres.");
  }

  const result = await getTransporter().sendMail({
    from: {
      name: "Routine",
      address: process.env.SMTP_USER.trim(),
    },
    to: { address: email.trim() },
    subject: "Routine — Vérifie ton adresse e-mail",
    text: [
      "Bonjour,",
      "",
      `Ton code de vérification Routine est : ${code}`,
      "",
      "Ce code est valable pendant 10 minutes.",
      "Ne le communique à personne.",
      "",
      "Si tu n’as pas demandé ce code, ignore ce message.",
      "",
      "L’équipe Routine",
    ].join("\n"),
  });

  if (!result.accepted?.length) {
    throw new Error("Le serveur d’envoi n’a pas accepté le destinataire.");
  }
}

module.exports = { sendVerificationEmail };
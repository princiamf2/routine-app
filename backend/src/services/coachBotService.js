function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function extractPainScore(text) {
  const match = text.match(/(\d{1,2})\s*(\/|sur)\s*10/);

  if (!match) {
    return null;
  }

  const score = Number(match[1]);

  if (Number.isNaN(score)) {
    return null;
  }

  return Math.max(0, Math.min(score, 10));
}

function extractAnswerData(questionId, message) {
  const text = normalizeText(message);
  const painScore = extractPainScore(text);

  if (questionId === "pain_score") {
    return {
      painScore,
    };
  }

  if (questionId === "pain_increase") {
    return {
      painIncrease:
        containsAny(text, ["oui", "augmente", "de plus en plus", "plus mal"]),
    };
  }

  if (questionId === "pain_radiation") {
    return {
      radiation:
        containsAny(text, ["oui", "descend", "jambe", "bras"]),
    };
  }

  if (questionId === "nerve_symptoms") {
    return {
      nerveSymptoms:
        containsAny(text, ["oui", "fourmillement", "engourdissement", "faiblesse"]),
    };
  }

  if (questionId === "walking") {
    return {
      walkingNormal:
        containsAny(text, ["oui", "normal", "j arrive", "je peux"])
          ? true
          : containsAny(text, ["non", "pas", "impossible", "difficile"])
          ? false
          : null,
    };
  }

  return {};
}

function buildAssessment(history) {
  const assessment = {};

  if (!Array.isArray(history)) {
    return assessment;
  }

  for (let i = 0; i < history.length - 1; i++) {
    const currentMessage = history[i];
    const nextMessage = history[i + 1];

    if (currentMessage.role !== "assistant") {
      continue;
    }

    if (nextMessage.role !== "user") {
      continue;
    }

    const question = triageQuestions.find((item) =>
      normalizeText(currentMessage.text).includes(
        normalizeText(item.question)
      )
    );

    if (!question) {
      continue;
    }

    const extractedData = extractAnswerData(
      question.id,
      nextMessage.text
    );

    Object.assign(assessment, extractedData);
  }

  return assessment;
}

function determineFinalDecision(assessment) {
  if (
    assessment.painScore >= 7 ||
    assessment.painIncrease === true ||
    assessment.radiation === true ||
    assessment.nerveSymptoms === true ||
    assessment.walkingNormal === false
  ) {
    return {
      level: "red",
      title: "Avis professionnel recommandé",
      shouldShowTherapists: true,
      needsQuestions: false,
      suggestedAction: "stop_and_get_help",
      reply:
        "D'après tes réponses, il vaut mieux arrêter l'exercice pour aujourd'hui. Comme il y a un signe qui mérite vérification, je te conseille de demander un avis à un kiné ou à un professionnel de santé avant de reprendre.",
      followUpQuestion: null,
    };
  }
  if (
    assessment.painScore >= 3 ||
    assessment.painIncrease === false ||
    assessment.radiation === false ||
    assessment.nerveSymptoms === false
  ) {
    return {
      level: "yellow",
      title: "Adapter l'exercice",
      shouldShowTherapists: false,
      needsQuestions: false,
      suggestedAction: "adapt_exercise",
      reply:
        "D'après tes reponses, tu peux continuer seulement si la sensation reste légère et stable. Choisis une version plus douce, réduis l'amplitude, ralentis le mouvement et arrête si la douleur augmente.",
      followUpQuestion: "Tu veux que je te propose une version plus facile de l'exercice ?",
    };
  }
  return {
    level: "green",
    title: "Continue progressivement",
    shouldShowTherapists: false,
    needsQuestions: false,
    suggestedAction: "Continue_carefulty",
    reply:
      "D'après tes réponses, tu peux continuer progressivement. Reste dans une intensité confortable et arrête si une douleur apparait ou augmente.",
    followUpQuestion: null,
  };
}

function analyzeCoachMessage(message) {
  const text = normalizeText(message);
  const painScore = extractPainScore(text);

  const emergencyFlags = [
    "douleur poitrine",
    "difficulte a respirer",
    "perte urine",
    "perte d urine",
    "perte de selle",
    "incontinence",
    "perte de sensation entre les jambes",
    "engourdissement entre les jambes",
    "accident",
    "chute grave",
  ];

  const redFlags = [
    "je n arrive plus a marcher",
    "je ne peux plus marcher",
    "je n arrive plus a prendre appui",
    "douleur insupportable",
    "douleur tres forte",
    "douleur brutale",
    "ca empire",
    "ca augmente",
    "douleur augmente",
    "douleur descend",
    "fourmillement",
    "engourdissement",
    "faiblesse",
    "jambe faible",
    "malaise",
    "vertige",
  ];

  const yellowFlags = [
    "douleur",
    "gene",
    "bloque",
    "raide",
    "crispation",
    "peur",
    "tiraillement",
    "sensible",
  ];

  if (containsAny(text, emergencyFlags)) {
    return {
      level: "emergency",
      title: "Signe d’alerte",
      shouldShowTherapists: true,
      needsQuestions: false,
      suggestedAction: "urgent_help",
    };
  }

  if (containsAny(text, redFlags) || painScore >= 7) {
    return {
      level: "red",
      title: "Avis professionnel recommandé",
      shouldShowTherapists: true,
      needsQuestions: false,
      suggestedAction: "stop_and_get_help",
    };
  }

  if (containsAny(text, yellowFlags) || (painScore !== null && painScore >= 3)) {
    return {
      level: "yellow",
      title: "Vérification nécessaire",
      shouldShowTherapists: false,
      needsQuestions: true,
      suggestedAction: "ask_one_question",
    };
  }

  return {
    level: "green",
    title: "Continuer progressivement",
    shouldShowTherapists: false,
    needsQuestions: false,
    suggestedAction: "continue_carefully",
  };
}

const triageQuestions = [
  {
    id: "pain_increase",
    question: "Est-ce que la douleur augmente pendant l’exercice ?",
  },
  {
    id: "pain_score",
    question: "Tu la notes combien sur 10 ?",
  },
  {
    id: "pain_radiation",
    question: "Est-ce qu’elle descend dans la jambe ou le bras ?",
  },
  {
    id: "nerve_symptoms",
    question: "Est-ce qu’il y a fourmillement, engourdissement ou faiblesse ?",
  },
  {
    id: "walking",
    question: "Est-ce que tu arrives à marcher et à prendre appui normalement ?",
  },
];

function getLastAssistantText(history) {
  if (!Array.isArray(history)) {
    return "";
  }

  const lastAssistantMessage = [...history]
    .reverse()
    .find((message) => message.role === "assistant");

  return normalizeText(lastAssistantMessage?.text || "");
}

function getCurrentQuestionIndex(history) {
  const lastAssistantText = getLastAssistantText(history);

  return triageQuestions.findIndex((item) =>
    lastAssistantText.includes(normalizeText(item.question))
  );
}

function hasDangerousAnswer(message) {
  const text = normalizeText(message);
  const painScore = extractPainScore(text);

  if (painScore !== null && painScore >= 7) {
    return true;
  }

  return containsAny(text, [
    "augmente",
    "douleur augmente",
    "descend",
    "fourmillement",
    "engourdissement",
    "faiblesse",
    "je n arrive pas a marcher",
    "je ne peux pas marcher",
    "pas prendre appui",
  ]);
}

function buildEmergencyResponse() {
  return {
    reply:
      "Par prudence, arrête immédiatement l’exercice. Ce que tu décris peut correspondre à un signe d’alerte. Je ne peux pas poser de diagnostic, mais il vaut mieux demander une aide médicale rapidement si le symptôme est fort, nouveau ou inquiétant.",
    followUpQuestion: null,
  };
}

function buildRedResponse() {
  return {
    reply:
      "Arrête l’exercice pour aujourd’hui. Une douleur forte, qui augmente, descend dans la jambe ou le bras, ou s’accompagne de faiblesse, fourmillement ou difficulté à marcher doit être prise au sérieux.",
    followUpQuestion: "Est-ce que tu arrives à marcher et à prendre appui normalement ?",
  };
}

function buildGreenResponse() {
  return {
    reply:
      "D’accord. Si la sensation reste légère, stable, et ne devient pas douloureuse, tu peux continuer doucement. Garde une respiration calme et arrête si la sensation augmente.",
    followUpQuestion: "Tu veux continuer l’exercice ou choisir une version plus douce ?",
  };
}

function buildYellowResponse(history) {
  const currentQuestionIndex = getCurrentQuestionIndex(history);
  const nextQuestionIndex = currentQuestionIndex + 1;
  const nextQuestion = triageQuestions[nextQuestionIndex];

  if (!nextQuestion) {
    return {
      reply:
        "Merci pour tes réponses. Comme il n’y a pas de signe d’alerte évident, tu peux reprendre seulement si la sensation reste légère et stable. Choisis une version plus douce et arrête si ça augmente.",
      followUpQuestion: "Tu veux que je te propose une version plus facile de l’exercice ?",
    };
  }

  return {
    reply:
      "Je préfère vérifier un point avant de te conseiller. Pour l’instant, fais une pause et ne force pas le mouvement.",
    followUpQuestion: nextQuestion.question,
  };
}

function buildExerciseAdaptation() {
  return {
    success: true,
    level: "yellow",
    title: "Version plus douce",
    shouldShowTherapists: false,
    needsQuestions: false,
    suggestedAction: false,
    reply:
      "Oui. Pour faire une version plus douce, réduis l'amplitude du mouvement, ralentis le rythme, fais moins de répétitions et garde un support stable si besoin. Lobjectif est de rester dans une sensation légère et contrôlable, pas de forcer.",
    followUpQuestion:
      "Est-ce que cette version te semble faisable maintenant ?",
  };
}

function buildExerciseAdaptation(movementTitle, movementDescription) {
  if (!movementTitle) {
    return {
      reply:
        "Oui. Choisis une version plus douce : réduis l’amplitude, ralentis le mouvement, fais moins de répétitions et arrête si la douleur augmente.",
      followUpQuestion: "Est-ce que cette version te semble faisable maintenant ?",
    };
  }

  return {
    reply:
      `Oui. Pour l’exercice "${movementTitle}", fais une version plus douce. ` +
      `Exercice prévu : ${movementDescription || "description non disponible"}. ` +
      "Réduis l’amplitude, ralentis le rythme, fais moins de répétitions et garde un support stable si besoin. L’objectif est de rester dans une sensation légère et contrôlable.",
    followUpQuestion: "Est-ce que cette version te semble faisable maintenant ?",
  };
}

function buildCoachResponse(message, history = [], context = {}) {
  const movementTitle = context.movementTitle || "";
  const movementDescription = context.movementDescription || "";
  const text = normalizeText(message);
  const lastAssistantText = getLastAssistantText(history);
  const userWantsAdaptation =
    containsAny(text, ["oui", "ok", "d accord", "vas y"]);
  const assistantAskedForAdaptation =
    lastAssistantText.includes(
      normalizeText(
        "Tu veux que je te propose une version plus facile de l’exercice ?"
      )
    );

  if (userWantsAdaptation && assistantAskedForAdaptation) {
    const adaptation = buildExerciseAdaptation(
      movementTitle,
      movementDescription
    );

    return {
      success: true,
      level: "yellow",
      title: "Version plus douce",
      shouldShowTherapists: false,
      needsQuestions: false,
      suggestedAction: "adapt_exercise",
      reply: adaptation.reply,
      followUpQuestion: adaptation.followUpQuestion,
    };
  }
  const analysis = analyzeCoachMessage(message);
  const currentQuestionIndex = getCurrentQuestionIndex(history);
  const isAnsweringTriage = currentQuestionIndex !== -1;

  if (analysis.level === "emergency") {
    const replyData = buildEmergencyResponse();

    return {
      success: true,
      ...analysis,
      reply: replyData.reply,
      followUpQuestion: replyData.followUpQuestion,
    };
  }

  if (analysis.level === "red") {
    const replyData = buildRedResponse();

    return {
      success: true,
      ...analysis,
      reply: replyData.reply,
      followUpQuestion: replyData.followUpQuestion,
    };
  }

  if (isAnsweringTriage && hasDangerousAnswer(message)) {
    return {
      success: true,
      level: "red",
      title: "Avis professionnel recommandé",
      shouldShowTherapists: true,
      needsQuestions: false,
      suggestedAction: "stop_and_get_help",
      reply:
        "Merci pour ta réponse. Par prudence, arrête l’exercice pour aujourd’hui. Ce type de signe mérite un avis professionnel avant de reprendre.",
      followUpQuestion: null,
    };
  }

  if (isAnsweringTriage) {
    const currentQuestionIndex = getCurrentQuestionIndex(history);
    const isLastQuestion = currentQuestionIndex === triageQuestions.length - 1;

    if (isLastQuestion) {
      const fullHistory = [
        ...history,
        {
          role: "user",
          text: message,
        },
      ];
      const assessment = buildAssessment(fullHistory);
      return {
        success: true,
        ...determineFinalDecision(assessment),
      };
    }
  }

  if (analysis.level === "yellow" || isAnsweringTriage) {
    const replyData = buildYellowResponse(history);

    return {
      success: true,
      level: "yellow",
      title: "Vérification nécessaire",
      shouldShowTherapists: false,
      needsQuestions: true,
      suggestedAction: "ask_one_question",
      reply: replyData.reply,
      followUpQuestion: replyData.followUpQuestion,
    };
  }

  const replyData = buildGreenResponse();

  return {
    success: true,
    ...analysis,
    reply: replyData.reply,
    followUpQuestion: replyData.followUpQuestion,
  };
}

module.exports = {
  buildCoachResponse,
};
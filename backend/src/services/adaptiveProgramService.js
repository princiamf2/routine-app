const { getAllExercises } = require("../data/exercisesStore");

function getAllowedLevels(streak) {
    if (streak <= 3) {
        return ["green"];
    }
    if (streak <= 7) {
        return ["green", "orange"];
    }
    if (streak <= 14) {
        return ["orange"];
    }
    if (streak <= 21) {
        return ["orange", "red"];
    }
    return ["red"];
}

function getProgression(streak) {
    if (streak <= 3) {
        return {
            label: "Semaine 1 · Adaptation",
            reps: 8,
            series: 2,
            rest: "3 min",
        };
    }
    if (streak <= 7) {
        return {
            label: "Semaine 2 · Activation",
            reps: 10,
            series: 3,
            rest: "2-3 min",
        };
    }
    if (streak <= 14) {
        return {
            label: "Semaine 3 · Progression",
            reps: 12,
            series: 4,
            rest: "2-3 min",
        };
    }
    return {
        label: "Semaine 4 · Consolidation",
        reps: 15,
        series: 5,
        rest: "2 min",
    };
}

function adjustProgressionByFeedback(progression, feedbackAverage) {
  if (feedbackAverage === null || feedbackAverage === undefined) {
    return progression;
  }

  if (feedbackAverage >= 7) {
    return {
      ...progression,
      reps: Math.max(5, Math.round(progression.reps * 0.7)),
      series: Math.max(1, progression.series - 1),
      rest: "3 min",
      note: "Séance allégée car le dernier ressenti est élevé.",
    };
  }

  if (feedbackAverage >= 4) {
    return {
      ...progression,
      reps: Math.max(6, Math.round(progression.reps * 0.85)),
      rest: "2-3 min",
      note: "Séance légèrement adaptée selon le ressenti.",
    };
  }

  return progression;
}

function mixExercisesByDay(exercises, day) {
  const variants = [
    exercises,
    [exercises[0], exercises[2], exercises[1]],
    [exercises[2], exercises[0], exercises[1]],
  ];

  return variants[(day - 1) % variants.length];
}

function limitLevelsByFeedback(allowedLevels, feedbackAverage) {
  if (feedbackAverage === null || feedbackAverage === undefined) {
    return allowedLevels;
  }

  if (feedbackAverage >= 7) {
    return ["green"];
  }

  if (feedbackAverage >= 4) {
    if (allowedLevels.includes("red")) {
      return ["orange"];
    }

    return ["green", "orange"].filter((level) =>
      allowedLevels.includes(level)
    );
  }

  return allowedLevels;
}

function buildAdaptiveSession(streak, day, feedbackAverage) {
  const allExercises = getAllExercises();
  const streakLevels = getAllowedLevels(streak);
  const allowedLevels = limitLevelsByFeedback(streakLevels, feedbackAverage);

  const greenExercises = allExercises.filter((exercise) => exercise.level === "green");
  const orangeExercises = allExercises.filter((exercise) => exercise.level === "orange");
  const redExercises = allExercises.filter((exercise) => exercise.level === "red");

  let selectedExercises = [];

  if (allowedLevels.length === 1 && allowedLevels[0] === "green") {
    selectedExercises = pickExercises(greenExercises, day, 3);
  }

  if (allowedLevels.length === 1 && allowedLevels[0] === "orange") {
    selectedExercises = pickExercises(orangeExercises, day, 3);
  }

  if (allowedLevels.length === 1 && allowedLevels[0] === "red") {
    selectedExercises = pickExercises(redExercises, day, 3);
  }

  if (allowedLevels.includes("green") && allowedLevels.includes("orange")) {
    selectedExercises = mixExercisesByDay([
        pickOneExercise(greenExercises, day),
        pickOneExercise(greenExercises, day + 1),
        pickOneExercise(orangeExercises,day),
    ], day);
  }

  if (allowedLevels.includes("orange") && allowedLevels.includes("red")) {
    selectedExercises = mixExercisesByDay([
        pickOneExercise(orangeExercises, day),
        pickOneExercise(orangeExercises, day + 1),
        pickOneExercise(redExercises, day),
    ], day);
  }

  const progression = getProgression(streak);
  const adjustedProgression = adjustProgressionByFeedback(
    progression,
    feedbackAverage
  );

  return {
    streak,
    day,
    feedbackAverage,
    allowedLevels,
    progression: adjustedProgression,
    exercises: selectedExercises,
  };
}

function pickOneExercise(exercises, day) {
  const index = (day - 1) % exercises.length;
  return exercises[index];
}

function pickExercises(exercises, day, count) {
  const selectedExercises = [];
  const startIndex = ((day - 1) * count) % exercises.length;

  for (let i = 0; i < count; i++) {
    selectedExercises.push(exercises[(startIndex + i) % exercises.length]);
  }

  return selectedExercises;
}

module.exports = {
    buildAdaptiveSession,
};
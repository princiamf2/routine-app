function getCompledActionDates(events) {
    const dates = [];

    events.forEach((event) => {
        if (event.actionCompleted && event.date) {
            if (!dates.includes(event.date)) {
                dates.push(event.date);
            }
        }
    });
    dates.sort();
    return dates;
}

function calculateStreak(dates) {
  if (dates.length === 0) return 0;

  let streak = 1;

  for (let i = dates.length - 1; i > 0; i--) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i - 1]);

    const diff = (current - previous) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function buildUserAnalytics(events) {
    const completedDates = getCompledActionDates(events);
    const activeDays = completedDates.length;
    const regularityPercent = Math.round((activeDays / 30) * 100);
    const streak = calculateStreak(completedDates);
    const totalOpenCount = events.filter((event) => event.appOpened).length;
    const today = new Date().toISOString().slice(0, 10);
    const opensToday = events.filter((event) => {
        return event.appOpened && event.date === today;
    }).length;
    const feedbackValues = events.filter((event) => event.feedbackValue !== null).map((event) => event.feedbackValue);
    const feedbackAverage = feedbackValues.length === 0 ? null : Math.round(
        feedbackValues.reduce((sum, value) => sum + value, 0) / feedbackValues.length
    );

    return {
        activeDays,
        regularityPercent,
        streak,
        totalOpenCount,
        opensToday,
        feedbackAverage,
        completedDates,
    };
}

module.exports = {
    buildUserAnalytics,
};
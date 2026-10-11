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

function calculateStreak(dates, today) {
    const completedDates = dates.filter((date) => date <= today);
    if (completedDates.length === 0) return 0;
    const dayInMs = 24 * 60 * 60 * 1000;
    const lastDate = completedDates[completedDates.length - 1];
    const daysSinceLastCompletion =
        (new Date(today) - new Date(lastDate)) / dayInMs;
    if (daysSinceLastCompletion > 1) return 0;
    let streak = 1;
    for (let i = completedDates.length - 1; i > 0; i--) {
        const difference =
            (new Date(completedDates[i]) -
                new Date(completedDates[i - 1])) / dayInMs;
        if (difference !== 1) break;
        streak++;
    }
    return streak;
}

function buildUserAnalytics(events, today = new Date().toISOString().slice(0, 10)) {
    const completedDates = getCompledActionDates(events).filter((date) => date <= today);
    const activeDays = completedDates.length;
    const regularityPercent = Math.min(100, Math.round((activeDays / 30) * 100));
    const streak = calculateStreak(completedDates, today);
    const totalOpenCount = events.filter((event) => event.appOpened).length;
    const opensToday = events.filter((event) => {
        return event.appOpened && event.date === today;
    }).length;
    const feedbackEvents = events.filter((event) => {
        const completed =
            event.actionCompleted === true || event.actionCompleted === 1;

        return (
            completed &&
            Number.isInteger(event.feedbackValue) &&
            event.feedbackValue >= 1 &&
            event.feedbackValue <= 10
        );
    });
    const feedbackValues = feedbackEvents.map((event) => event.feedbackValue);
    const feedbackAverage = feedbackValues.length === 0
        ? null
        : Math.round(
            feedbackValues.reduce((sum, value) => sum + value, 0) /
            feedbackValues.length
        );
    const latestFeedbackEvent = feedbackEvents.reduce((latest, event) => {
        if (latest === null || event.id > latest.id) {
            return event;
        }
        return latest;
    }, null);
    const latestFeedback = latestFeedbackEvent?.feedbackValue ?? null;

    return {
        activeDays,
        regularityPercent,
        streak,
        totalOpenCount,
        opensToday,
        feedbackAverage,
        latestFeedback,
        completedDates,
    };
}

module.exports = {
    buildUserAnalytics,
};
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_PROGRESS_KEY = "movement_session_progress";

export type MovementSessionProgress = {
    day: number;
    currentExerciseIndex: number;
    isResting: boolean;
    restSecondsLeft: number;
};

export async function saveMovementSessionProgress(
    progress: MovementSessionProgress
) {
    await AsyncStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify(progress));
}

export async function getMovementSessionProgress() {
    const value =  await AsyncStorage.getItem(SESSION_PROGRESS_KEY);
    if (!value) {
        return null;
    }
    return JSON.parse(value) as MovementSessionProgress;
}

export async function clearMovementSessionProgress() {
    await AsyncStorage.removeItem(SESSION_PROGRESS_KEY);
}
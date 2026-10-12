import { useSyncExternalStore } from "react";
import { getAuthSnapshot, getServerAuthSnapshot, subscribeAuth, restoreSession, signIn, signOut, } from "@/src/services/authSessionManager";

export function useAuth() {
    const session = useSyncExternalStore(
        subscribeAuth,
        getAuthSnapshot,
        getServerAuthSnapshot,
    );
    return {
        ...session,
        restoreSession,
        signIn,
        signOut,
    };
}
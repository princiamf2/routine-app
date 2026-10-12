import AsyncStorage from "@react-native-async-storage/async-storage";

export function createAccountStorage(userId: string) {
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Un compte est nécessaire pour accéder à la progression.");
  }

  const prefix = `routine.account.${encodeURIComponent(userId)}.`;

  function getKey(name: string) {
    if (!name) {
      throw new Error("La clé de stockage est invalide.");
    }

    return `${prefix}${name}`;
  }

  return {
    getItem(name: string): Promise<string | null> {
      return AsyncStorage.getItem(getKey(name));
    },

    setItem(name: string, value: string): Promise<void> {
      return AsyncStorage.setItem(getKey(name), value);
    },

    removeItem(name: string): Promise<void> {
      return AsyncStorage.removeItem(getKey(name));
    },
  };
}
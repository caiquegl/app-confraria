import AsyncStorage from "@react-native-async-storage/async-storage";

const WELCOME_MODAL_KEY = "@confraria:welcome_modal_shown";

export async function getWelcomeModalShown(): Promise<boolean> {
  const value = await AsyncStorage.getItem(WELCOME_MODAL_KEY);
  return value === "true";
}

export async function setWelcomeModalShown(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_MODAL_KEY, "true");
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "elementlab_token";
const USER_KEY = "elementlab_user";

export type StoredUser = {
  _id: string;
  name: string;
  username: string;
  [key: string]: any;
};

export async function saveSession(token: string, user: StoredUser) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// 1.6 - Logout terminates the user's current session. JWTs are stateless,
// so "terminating the session" means wiping the locally stored token/user
// so the app no longer sends it and no longer treats the user as logged in.
export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
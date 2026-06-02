type CurrentProfileSummary = {
  avatar: string | null;
  name: string | null;
};

let currentProfile: CurrentProfileSummary = {
  avatar: null,
  name: null,
};

const listeners = new Set<(profile: CurrentProfileSummary) => void>();

export function getStoredCurrentProfile(): CurrentProfileSummary {
  return currentProfile;
}

export function setStoredCurrentProfile(profile: CurrentProfileSummary): void {
  currentProfile = profile;
  listeners.forEach((listener) => listener(profile));
}

export function subscribeStoredCurrentProfile(
  listener: (profile: CurrentProfileSummary) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

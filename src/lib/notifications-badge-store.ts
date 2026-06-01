let unreadCount = 0;
const listeners = new Set<(count: number) => void>();

export function getStoredUnreadCount(): number {
  return unreadCount;
}

export function setStoredUnreadCount(count: number): void {
  unreadCount = count;
  listeners.forEach((listener) => listener(count));
}

export function subscribeStoredUnreadCount(
  listener: (count: number) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

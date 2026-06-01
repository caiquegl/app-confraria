let unreadCount = 0;
const listeners = new Set<(count: number) => void>();

export function getStoredMessagesUnreadCount(): number {
  return unreadCount;
}

export function setStoredMessagesUnreadCount(count: number): void {
  unreadCount = count;
  listeners.forEach((listener) => listener(count));
}

export function subscribeStoredMessagesUnreadCount(
  listener: (count: number) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

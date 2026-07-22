let activeRouteId: string | null = null;

const listeners = new Set<(routeId: string | null) => void>();

export function getActiveNavigationRouteId(): string | null {
  return activeRouteId;
}

export function setActiveNavigationRouteId(routeId: string | null): void {
  activeRouteId = routeId;
  listeners.forEach((listener) => listener(activeRouteId));
}

export function subscribeActiveNavigation(
  listener: (routeId: string | null) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

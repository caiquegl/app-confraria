import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl, subscribeApiEnvironment } from "./api-environment";
import { getToken } from "./auth";

export type RouteLiveLocation = {
  avatarUrl: string | null;
  heading: number;
  latitude: number;
  longitude: number;
  name: string;
  updatedAt: string;
  userId: string;
};

type RouteLocationsSnapshotPayload = {
  locations: RouteLiveLocation[];
  routeId: string;
};

type RouteLocationUpdatePayload = RouteLiveLocation;

type RouteErrorPayload = {
  message: string;
};

type Listener<T> = (payload: T) => void;

let socket: Socket | null = null;
let unsubscribeEnvironment: (() => void) | null = null;
let activeRouteId: string | null = null;

const snapshotListeners = new Set<Listener<RouteLocationsSnapshotPayload>>();
const locationListeners = new Set<Listener<RouteLocationUpdatePayload>>();
const leftListeners = new Set<Listener<{ userId: string }>>();
const errorListeners = new Set<Listener<RouteErrorPayload>>();

function notify<T>(listeners: Set<Listener<T>>, payload: T) {
  listeners.forEach((listener) => listener(payload));
}

async function createSocket() {
  const baseUrl = await getApiBaseUrl();
  const token = await getToken();

  if (!token) {
    return null;
  }

  const nextSocket = io(`${baseUrl}/route-navigation`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"],
  });

  nextSocket.on("route:locations:snapshot", (payload: RouteLocationsSnapshotPayload) => {
    notify(snapshotListeners, payload);
  });

  nextSocket.on("route:location:update", (payload: RouteLocationUpdatePayload) => {
    notify(locationListeners, payload);
  });

  nextSocket.on("route:participant:left", (payload: { userId: string }) => {
    notify(leftListeners, payload);
  });

  nextSocket.on("route:error", (payload: RouteErrorPayload) => {
    notify(errorListeners, payload);
  });

  nextSocket.on("connect", () => {
    if (activeRouteId) {
      nextSocket.emit("route:join", { routeId: activeRouteId });
    }
  });

  return nextSocket;
}

export async function connectRouteNavigationSocket(): Promise<void> {
  if (socket?.connected) {
    return;
  }

  if (!socket) {
    socket = await createSocket();
    unsubscribeEnvironment = subscribeApiEnvironment(async () => {
      await disconnectRouteNavigationSocket();
      socket = await createSocket();
      if (activeRouteId && socket) {
        socket.emit("route:join", { routeId: activeRouteId });
      }
    });
  }
}

export async function disconnectRouteNavigationSocket(): Promise<void> {
  unsubscribeEnvironment?.();
  unsubscribeEnvironment = null;
  activeRouteId = null;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function joinRouteNavigationRoom(routeId: string) {
  activeRouteId = routeId;
  socket?.emit("route:join", { routeId });
}

export function emitRouteNavigationLocation(params: {
  heading: number;
  latitude: number;
  longitude: number;
  routeId: string;
}) {
  socket?.emit("route:location", params);
}

export function subscribeRouteLocationsSnapshot(listener: Listener<RouteLocationsSnapshotPayload>) {
  snapshotListeners.add(listener);
  return () => snapshotListeners.delete(listener);
}

export function subscribeRouteLocationUpdate(listener: Listener<RouteLocationUpdatePayload>) {
  locationListeners.add(listener);
  return () => locationListeners.delete(listener);
}

export function subscribeRouteParticipantLeft(listener: Listener<{ userId: string }>) {
  leftListeners.add(listener);
  return () => leftListeners.delete(listener);
}

export function subscribeRouteNavigationError(listener: Listener<RouteErrorPayload>) {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

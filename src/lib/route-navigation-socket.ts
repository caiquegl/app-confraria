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
let connectPromise: Promise<Socket | null> | null = null;
let unsubscribeEnvironment: (() => void) | null = null;
let activeRouteId: string | null = null;

const snapshotListeners = new Set<Listener<RouteLocationsSnapshotPayload>>();
const locationListeners = new Set<Listener<RouteLocationUpdatePayload>>();
const leftListeners = new Set<Listener<{ userId: string }>>();
const errorListeners = new Set<Listener<RouteErrorPayload>>();
const finishedListeners = new Set<Listener<{ routeId: string }>>();

function notify<T>(listeners: Set<Listener<T>>, payload: T) {
  listeners.forEach((listener) => listener(payload));
}

function attachSocketListeners(nextSocket: Socket) {
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

  nextSocket.on("route:finished", (payload: { routeId: string }) => {
    notify(finishedListeners, payload);
  });

  nextSocket.on("connect", () => {
    if (activeRouteId) {
      nextSocket.emit("route:join", { routeId: activeRouteId });
    }
  });
}

function waitForSocketConnection(target: Socket, timeoutMs = 12_000): Promise<void> {
  if (target.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao conectar na navegação em tempo real"));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onConnectError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      target.off("connect", onConnect);
      target.off("connect_error", onConnectError);
    };

    target.on("connect", onConnect);
    target.on("connect_error", onConnectError);

    if (!target.active) {
      target.connect();
    }
  });
}

async function createSocket(): Promise<Socket | null> {
  const baseUrl = await getApiBaseUrl();
  const token = await getToken();

  if (!token) {
    notify(errorListeners, { message: "Faça login para compartilhar sua localização na rota" });
    return null;
  }

  const nextSocket = io(`${baseUrl}/route-navigation`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"],
  });

  attachSocketListeners(nextSocket);
  return nextSocket;
}

export async function connectRouteNavigationSocket(): Promise<Socket | null> {
  if (socket?.connected) {
    return socket;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      if (!socket) {
        socket = await createSocket();
        if (!socket) {
          return null;
        }

        unsubscribeEnvironment = subscribeApiEnvironment(async () => {
          await disconnectRouteNavigationSocket();
          await connectRouteNavigationSocket();
          if (activeRouteId) {
            await joinRouteNavigationRoom(activeRouteId);
          }
        });
      }

      await waitForSocketConnection(socket);
      return socket;
    } catch (error) {
      notify(errorListeners, {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível conectar na navegação em tempo real",
      });
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function disconnectRouteNavigationSocket(): Promise<void> {
  unsubscribeEnvironment?.();
  unsubscribeEnvironment = null;
  activeRouteId = null;
  connectPromise = null;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export async function joinRouteNavigationRoom(routeId: string): Promise<void> {
  activeRouteId = routeId;
  const activeSocket = await connectRouteNavigationSocket();
  activeSocket?.emit("route:join", { routeId });
}

export async function emitRouteNavigationLocation(params: {
  heading: number;
  latitude: number;
  longitude: number;
  routeId: string;
}): Promise<void> {
  const activeSocket = await connectRouteNavigationSocket();
  activeSocket?.emit("route:location", params);
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

export function subscribeRouteFinished(listener: Listener<{ routeId: string }>) {
  finishedListeners.add(listener);
  return () => finishedListeners.delete(listener);
}

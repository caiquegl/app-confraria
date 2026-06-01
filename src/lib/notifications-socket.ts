import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl, subscribeApiEnvironment } from "./api-environment";
import { getToken } from "./auth";

type NotificationNewPayload = {
  unreadCount: number;
};

type ConnectOptions = {
  onNewNotification: (payload: NotificationNewPayload) => void;
};

let socket: Socket | null = null;
let unsubscribeEnvironment: (() => void) | null = null;

async function createSocket(onNewNotification: (payload: NotificationNewPayload) => void) {
  const baseUrl = await getApiBaseUrl();
  const token = await getToken();

  if (!token) {
    return null;
  }

  return io(`${baseUrl}/notifications`, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"],
  }).on("notification:new", onNewNotification);
}

export async function connectNotificationsSocket({
  onNewNotification,
}: ConnectOptions): Promise<void> {
  await disconnectNotificationsSocket();

  socket = await createSocket(onNewNotification);

  unsubscribeEnvironment = subscribeApiEnvironment(async () => {
    await disconnectNotificationsSocket();
    socket = await createSocket(onNewNotification);
  });
}

export async function disconnectNotificationsSocket(): Promise<void> {
  unsubscribeEnvironment?.();
  unsubscribeEnvironment = null;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

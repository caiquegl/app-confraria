import { router, useLocalSearchParams } from "expo-router";

import { ChatView } from "@/pages/messages";

export default function ChatScreen() {
  const { conversationId, participantAvatar, participantName } =
    useLocalSearchParams<{
      conversationId: string;
      participantAvatar?: string;
      participantName?: string;
    }>();

  return (
    <ChatView
      conversationId={conversationId}
      participantAvatar={participantAvatar || null}
      participantName={participantName}
      onBack={() => router.back()}
    />
  );
}

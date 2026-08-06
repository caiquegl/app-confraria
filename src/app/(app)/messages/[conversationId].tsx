import { router, useLocalSearchParams } from "expo-router";

import { ChatView } from "@/pages/messages";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    conversationId: string | string[];
    participantAvatar?: string | string[];
    participantName?: string | string[];
  }>();

  const conversationId = firstParam(params.conversationId) ?? "";
  const participantAvatar = firstParam(params.participantAvatar);
  const participantName = firstParam(params.participantName);

  return (
    <ChatView
      conversationId={conversationId}
      participantAvatar={participantAvatar || null}
      participantName={participantName}
      onBack={() => router.back()}
    />
  );
}

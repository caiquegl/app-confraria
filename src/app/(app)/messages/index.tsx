import { router } from "expo-router";

import { MessagesListView, type ChatUser } from "@/pages/messages";

export default function MessagesScreen() {
  const openConversation = (conversationId: string, participant: ChatUser) => {
    router.push({
      pathname: "/messages/[conversationId]",
      params: {
        conversationId,
        participantAvatar: participant.userAvatar ?? "",
        participantName: participant.userName,
      },
    });
  };

  return (
    <MessagesListView
      onBack={() => router.back()}
      onOpenConversation={openConversation}
    />
  );
}

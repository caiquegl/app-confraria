import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { formatRelativeTime } from "@/pages/home/services/feed.service";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { useConversations } from "../business/useConversations";
import type { ChatContact, ChatConversation, ChatUser } from "../types/messages.types";

type MessagesListViewProps = {
  onBack: () => void;
  onOpenConversation: (conversationId: string, participant: ChatUser) => void;
};

export function MessagesListView({
  onBack,
  onOpenConversation,
}: MessagesListViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    contacts,
    conversations,
    error,
    isLoading,
    openOrCreateConversation,
    refresh,
  } = useConversations();

  const openContact = async (contact: ChatContact) => {
    const conversationId = await openOrCreateConversation(contact);
    if (!conversationId) return;

    onOpenConversation(conversationId, {
      userAvatar: contact.userAvatar,
      userId: contact.userId,
      userName: contact.userName,
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <View>
          <Text style={styles.title}>Mensagens</Text>
          <Text style={styles.subtitle}>Converse com quem você segue</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <SectionTitle title="Conversas" />
          {conversations.length === 0 ? (
            <EmptyState text="Nenhuma conversa iniciada ainda." />
          ) : (
            conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                onPress={() =>
                  onOpenConversation(conversation.id, conversation.participant)
                }
              />
            ))
          )}

          <SectionTitle title="Pessoas que você segue" />
          {contacts.length === 0 ? (
            <EmptyState text="Siga alguém para iniciar uma conversa." />
          ) : (
            contacts.map((contact) => (
              <ContactRow
                key={contact.userId}
                contact={contact}
                onPress={() => void openContact(contact)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function EmptyState({ text }: { text: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyState}>
      <Ionicons color={colors.border.default} name="chatbubble-ellipses-outline" size={30} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function getConversationPreview(conversation: ChatConversation): string {
  const message = conversation.lastMessage;
  if (!message) return "Conversa iniciada";

  if (message.sharedRoute) {
    const title = message.sharedRoute.title?.trim();
    const path = `${message.sharedRoute.originLabel} → ${message.sharedRoute.destinationLabel}`;
    return title ? `${title} · ${path}` : path;
  }

  if (message.sharedEvent?.title) return message.sharedEvent.title;
  if (message.sharedPost?.caption) return message.sharedPost.caption;
  if (message.text.trim()) return message.text.trim();

  return "Conversa iniciada";
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ChatConversation;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const preview = getConversationPreview(conversation);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <UserAvatar
        avatarUrl={conversation.participant.userAvatar}
        name={conversation.participant.userName}
        size={46}
      />
      <View style={styles.rowContent}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {conversation.participant.userName}
          </Text>
          <Text style={styles.timeText}>{formatRelativeTime(conversation.updatedAt)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.previewText}>
          {preview}
        </Text>
      </View>
      {conversation.unreadCount > 0 && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function ContactRow({
  contact,
  onPress,
}: {
  contact: ChatContact;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <UserAvatar avatarUrl={contact.userAvatar} name={contact.userName} size={46} />
      <View style={styles.rowContent}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {contact.userName}
        </Text>
        <Text style={styles.previewText}>
          {contact.conversationId ? "Continuar conversa" : "Iniciar conversa"}
        </Text>
      </View>
      <Ionicons color={colors.text.muted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 18,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
    padding: 22,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: 13,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  previewText: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 3,
  },
  retryButton: {
    backgroundColor: colors.accent.brand,
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.text.onBrand,
    fontSize: 13,
    fontWeight: "800",
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  rowTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
    marginTop: 12,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: 11,
    marginLeft: "auto",
  },
  title: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "900",
  },
  unreadDot: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";
import { setHighlightPostId } from "@/lib/feed-highlight-store";
import { formatRelativeTime } from "@/pages/home/services/feed.service";
import { colors } from "@/theme/colors";

import { useChatConversation } from "../business/useChatConversation";
import type { ChatMessage } from "../types/messages.types";

const CHAT_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ChatViewProps = {
  conversationId: string;
  participantAvatar?: string | null;
  participantName?: string;
  onBack: () => void;
};

export function ChatView({
  conversationId,
  participantAvatar,
  participantName = "Conversa",
  onBack,
}: ChatViewProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [draft, setDraft] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const { error, isLoading, messages, reactToMessage, refresh, sendMessage } =
    useChatConversation(conversationId);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOffset(Math.max(0, event.endCoordinates.height - insets.bottom));
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    sendMessage(text, { replyToMessageId: replyingToMessage?.id });
    setDraft("");
    setReplyingToMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={styles.screen}
    >
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <UserAvatar avatarUrl={participantAvatar ?? null} name={participantName} size={44} />
        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={styles.headerName}>
            {participantName}
          </Text>
          <Text style={styles.headerStatus}>Conversa em tempo real</Text>
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
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onOpenReactions={setReactionTarget}
              onReact={reactToMessage}
              onReply={setReplyingToMessage}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons color="#D1D5DB" name="chatbubbles-outline" size={34} />
              <Text style={styles.emptyText}>Envie a primeira mensagem.</Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.composerWrap,
          {
            marginBottom: Platform.OS === "android" ? keyboardOffset : 0,
            paddingBottom: 12,
          },
        ]}
      >
        {replyingToMessage ? (
          <ReplyComposerPreview
            message={replyingToMessage}
            participantName={participantName}
            onCancel={() => setReplyingToMessage(null)}
          />
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            multiline
            placeholder="Escreva uma mensagem..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
          />
          <Pressable
            accessibilityLabel="Enviar mensagem"
            disabled={!draft.trim()}
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
          >
            <Ionicons
              color={draft.trim() ? colors.brandDark : "#9CA3AF"}
              name="send"
              size={18}
            />
          </Pressable>
        </View>
      </View>

      <ReactionPicker
        message={reactionTarget}
        onClose={() => setReactionTarget(null)}
        onSelect={(emoji) => {
          if (!reactionTarget) return;
          reactToMessage(reactionTarget.id, emoji);
          setReactionTarget(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onOpenReactions,
  onReact,
  onReply,
}: {
  message: ChatMessage;
  onOpenReactions: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
}) {
  const [translateX] = useState(() => new Animated.Value(0));
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dx > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          translateX.setValue(Math.min(72, Math.max(0, gestureState.dx)));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 56) {
            onReply(message);
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [message, onReply, translateX],
  );

  return (
    <View style={[styles.messageRow, message.isMine && styles.messageRowMine]}>
      <View style={styles.swipeWrap}>
        <View style={styles.swipeReplyIcon}>
          <Ionicons color={colors.brandPrimary} name="return-up-forward" size={18} />
        </View>
        <Animated.View
          {...panResponder.panHandlers}
          style={{ transform: [{ translateX }] }}
        >
          <Pressable
            accessibilityRole="button"
            delayLongPress={260}
            style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleOther]}
            onLongPress={() => onOpenReactions(message)}
          >
            {message.replyToMessage ? (
              <MessageReplySnippet
                isMine={message.isMine}
                replyToMessage={message.replyToMessage}
              />
            ) : null}
            {message.sharedEvent ? (
              <SharedEventCard message={message} />
            ) : message.sharedPost ? (
              <SharedPostCard message={message} />
            ) : (
              <Text style={[styles.messageText, message.isMine && styles.messageTextMine]}>
                {message.text}
              </Text>
            )}
            <Text style={[styles.messageMeta, message.isMine && styles.messageMetaMine]}>
              {message.isMine
                ? message.readAt
                  ? `Visualizada ${formatRelativeTime(message.readAt)}`
                  : "Não visualizada"
                : formatRelativeTime(message.createdAt)}
            </Text>
            <ReactionBadgeGroup message={message} onReact={onReact} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function ReactionPicker({
  message,
  onClose,
  onSelect,
}: {
  message: ChatMessage | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  return (
    <Modal animationType="fade" transparent statusBarTranslucent visible={Boolean(message)}>
      <Pressable style={styles.reactionBackdrop} onPress={onClose} />
      <View style={styles.reactionPickerWrap}>
        <View style={styles.reactionPicker}>
          {CHAT_REACTIONS.map((emoji) => {
            const active = message?.myReaction === emoji;

            return (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.reactionOption, active && styles.reactionOptionActive]}
                onPress={() => onSelect(emoji)}
              >
                <Text style={styles.reactionOptionText}>{emoji}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function ReactionBadgeGroup({
  message,
  onReact,
}: {
  message: ChatMessage;
  onReact: (messageId: string, emoji: string) => void;
}) {
  if (message.reactions.length === 0) return null;

  return (
    <View style={styles.reactionBadges}>
      {message.reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji}
          accessibilityRole="button"
          disabled={!reaction.reactedByMe}
          hitSlop={6}
          style={[
            styles.reactionBadge,
            reaction.reactedByMe && styles.reactionBadgeMine,
          ]}
          onPress={() => onReact(message.id, reaction.emoji)}
        >
          <Text style={styles.reactionBadgeEmoji}>{reaction.emoji}</Text>
          {reaction.count > 1 ? (
            <Text style={styles.reactionBadgeCount}>{reaction.count}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function ReplyComposerPreview({
  message,
  participantName,
  onCancel,
}: {
  message: ChatMessage;
  participantName: string;
  onCancel: () => void;
}) {
  return (
    <View style={styles.replyComposerPreview}>
      <View style={styles.replyComposerAccent} />
      <View style={styles.replyComposerTextWrap}>
        <Text style={styles.replyComposerTitle}>
          Respondendo {message.isMine ? "você" : participantName}
        </Text>
        <Text numberOfLines={1} style={styles.replyComposerText}>
          {getMessagePreviewText(message)}
        </Text>
      </View>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onCancel}>
        <Ionicons color="#6B7280" name="close" size={18} />
      </Pressable>
    </View>
  );
}

function MessageReplySnippet({
  isMine,
  replyToMessage,
}: {
  isMine: boolean;
  replyToMessage: NonNullable<ChatMessage["replyToMessage"]>;
}) {
  return (
    <View style={[styles.replySnippet, isMine && styles.replySnippetMine]}>
      <Text numberOfLines={1} style={styles.replySnippetTitle}>
        {replyToMessage.senderName}
      </Text>
      <Text numberOfLines={2} style={styles.replySnippetText}>
        {replyToMessage.text}
      </Text>
    </View>
  );
}

function getMessagePreviewText(message: ChatMessage) {
  if (message.text.trim()) return message.text.trim();
  if (message.sharedEvent) return message.sharedEvent.title || "Evento compartilhado";
  if (message.sharedPost) return message.sharedPost.caption || "Post compartilhado";
  return "Mensagem";
}

function SharedEventCard({ message }: { message: ChatMessage }) {
  const sharedEvent = message.sharedEvent;
  if (!sharedEvent) return null;

  const openEvent = () => {
    router.push({
      pathname: "/event/[eventId]",
      params: { eventId: sharedEvent.eventId },
    });
  };

  return (
    <Pressable style={styles.sharedCard} onPress={openEvent}>
      {sharedEvent.thumbnail ? (
        <Image
          source={{ uri: sharedEvent.thumbnail }}
          style={styles.sharedImage}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={sharedEvent.thumbnail}
        />
      ) : (
        <View style={styles.sharedImageFallback}>
          <Ionicons color="#9CA3AF" name="calendar-outline" size={20} />
        </View>
      )}
      <View style={styles.sharedInfo}>
        <Text numberOfLines={1} style={styles.sharedLabel}>
          Evento de {sharedEvent.organizerName}
        </Text>
        <Text numberOfLines={2} style={styles.sharedCaption}>
          {sharedEvent.title || message.text}
        </Text>
      </View>
      <Ionicons color="#9CA3AF" name="chevron-forward" size={16} />
    </Pressable>
  );
}

function SharedPostCard({ message }: { message: ChatMessage }) {
  const sharedPost = message.sharedPost;
  if (!sharedPost) return null;

  const openPost = () => {
    setHighlightPostId(sharedPost.postId);
    router.push("/feed");
  };

  return (
    <Pressable style={styles.sharedCard} onPress={openPost}>
      {sharedPost.thumbnail ? (
        <Image
          source={{ uri: sharedPost.thumbnail }}
          style={styles.sharedImage}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={sharedPost.thumbnail}
        />
      ) : (
        <View style={styles.sharedImageFallback}>
          <Ionicons color="#9CA3AF" name="image-outline" size={20} />
        </View>
      )}
      <View style={styles.sharedInfo}>
        <Text numberOfLines={1} style={styles.sharedLabel}>
          Post de {sharedPost.authorName}
        </Text>
        <Text numberOfLines={2} style={styles.sharedCaption}>
          {sharedPost.caption || message.text}
        </Text>
      </View>
      <Ionicons color="#9CA3AF" name="chevron-forward" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  bubble: {
    borderRadius: 22,
    maxWidth: "100%",
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.brandGreen,
  },
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  composerRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
  },
  composerWrap: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 260,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "900",
  },
  headerStatus: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageMeta: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
  },
  messageMetaMine: {
    color: "rgba(28,33,38,0.64)",
  },
  messageRow: {
    alignItems: "flex-start",
    marginBottom: 10,
  },
  messageRowMine: {
    alignItems: "flex-end",
  },
  messageText: {
    color: "#374151",
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: colors.brandDark,
  },
  messagesContent: {
    flexGrow: 1,
    padding: 14,
  },
  nextStepCard: {
    backgroundColor: "#F7F8F4",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  nextStepText: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  nextStepTitle: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900",
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  reactionBackdrop: {
    backgroundColor: "rgba(0,0,0,0.12)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  reactionBadge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  reactionBadgeCount: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "900",
  },
  reactionBadgeEmoji: {
    fontSize: 13,
  },
  reactionBadgeMine: {
    borderColor: colors.brandPrimary,
  },
  reactionBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  reactionOption: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  reactionOptionActive: {
    backgroundColor: "#EEF3E2",
  },
  reactionOptionText: {
    fontSize: 22,
  },
  reactionPicker: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  reactionPickerWrap: {
    alignItems: "center",
    bottom: 94,
    left: 0,
    position: "absolute",
    right: 0,
  },
  routeButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#DADFD5",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  routeButtonText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  replyComposerAccent: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 999,
    width: 4,
  },
  replyComposerPreview: {
    alignItems: "center",
    backgroundColor: "#F7F8F4",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replyComposerText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  replyComposerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  replyComposerTitle: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900",
  },
  replySnippet: {
    backgroundColor: "#F3F4F6",
    borderLeftColor: colors.brandPrimary,
    borderLeftWidth: 3,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  replySnippetMine: {
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  replySnippetText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
  replySnippetTitle: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  sharedCaption: {
    color: "#4B5563",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  sharedCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(28,33,38,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: 260,
    padding: 8,
  },
  sharedImage: {
    borderRadius: 12,
    height: 48,
    width: 48,
  },
  sharedImageFallback: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sharedInfo: {
    flex: 1,
    minWidth: 0,
  },
  sharedLabel: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "900",
  },
  swipeReplyIcon: {
    alignItems: "center",
    backgroundColor: "#EEF3E2",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    left: 6,
    marginTop: -16,
    position: "absolute",
    top: "50%",
    width: 32,
  },
  swipeWrap: {
    maxWidth: "84%",
    minWidth: 64,
    position: "relative",
  },
});

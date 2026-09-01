import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";
import { setHighlightPostId } from "@/lib/feed-highlight-store";
import { formatRelativeTime } from "@/pages/home/services/feed.service";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { useChatConversation } from "../business/useChatConversation";
import { fetchChatConversations } from "../services/messages.service";
import type { ChatMessage } from "../types/messages.types";

const CHAT_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const TYPING_IDLE_MS = 2000;
const TYPING_PULSE_MS = 1000;

type ChatViewProps = {
  conversationId: string;
  participantAvatar?: string | null;
  participantName?: string;
  onBack: () => void;
};

export function ChatView({
  conversationId,
  participantAvatar,
  participantName,
  onBack,
}: ChatViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardState((state) => state.height);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const typingIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<ChatMessage | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  const [headerName, setHeaderName] = useState(
    participantName?.trim() || "Conversa",
  );
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(
    participantAvatar?.trim() ? participantAvatar : null,
  );
  const {
    error,
    isLoading,
    isPeerTyping,
    messages,
    notifyTyping,
    reactToMessage,
    refresh,
    retryFailedMessage,
    sendMessage,
  } = useChatConversation(conversationId);

  useEffect(() => {
    const nextName = participantName?.trim();
    if (nextName) setHeaderName(nextName);

    const nextAvatar = participantAvatar?.trim();
    if (nextAvatar) setHeaderAvatar(nextAvatar);
  }, [participantAvatar, participantName]);

  useEffect(() => {
    const hasName = Boolean(participantName?.trim());
    const hasAvatar = Boolean(participantAvatar?.trim());
    if (hasName && hasAvatar) return;

    let cancelled = false;

    void fetchChatConversations()
      .then((data) => {
        if (cancelled) return;
        const conversation = data.conversations.find(
          (item) => item.id === conversationId,
        );
        if (!conversation) return;

        if (!hasName) {
          setHeaderName(conversation.participant.userName);
        }
        if (!hasAvatar) {
          setHeaderAvatar(conversation.participant.userAvatar);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [conversationId, participantAvatar, participantName]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingIdleTimeoutRef.current) clearTimeout(typingIdleTimeoutRef.current);
      if (typingPulseTimeoutRef.current) clearTimeout(typingPulseTimeoutRef.current);
      if (isTypingRef.current) {
        notifyTyping(false);
        isTypingRef.current = false;
      }
    };
  }, [notifyTyping]);

  const stopTyping = () => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
      typingIdleTimeoutRef.current = null;
    }
    if (typingPulseTimeoutRef.current) {
      clearTimeout(typingPulseTimeoutRef.current);
      typingPulseTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      notifyTyping(false);
      isTypingRef.current = false;
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      notifyTyping(true);
    } else if (!typingPulseTimeoutRef.current) {
      typingPulseTimeoutRef.current = setTimeout(() => {
        typingPulseTimeoutRef.current = null;
        if (isTypingRef.current) {
          notifyTyping(true);
        }
      }, TYPING_PULSE_MS);
    }

    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }
    typingIdleTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_MS);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    stopTyping();
    sendMessage(text, {
      replyToMessage: replyingToMessage
        ? {
            id: replyingToMessage.id,
            senderId: replyingToMessage.senderId,
            senderName: replyingToMessage.isMine ? "Você" : headerName,
            sharedType: replyingToMessage.sharedEvent
              ? "event"
              : replyingToMessage.sharedPost
                ? "post"
                : replyingToMessage.sharedRoute
                  ? "route"
                  : null,
            text: replyingToMessage.text,
          }
        : null,
      replyToMessageId: replyingToMessage?.id.startsWith("local:")
        ? undefined
        : replyingToMessage?.id,
    });
    setDraft("");
    setReplyingToMessage(null);
  };

  // Com teclado aberto o safe-area inferior some (fica atrás do teclado).
  const composerBottomPad = isKeyboardOpen ? 8 : Math.max(insets.bottom, 12);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <UserAvatar avatarUrl={headerAvatar} name={headerName} size={44} />
        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={styles.headerName}>
            {headerName}
          </Text>
          <Text style={styles.headerStatus}>
            {isPeerTyping ? `${headerName} está digitando…` : "Conversa em tempo real"}
          </Text>
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
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesContent,
            keyboardHeight > 0 ? { paddingBottom: 14 + keyboardHeight } : null,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onOpenReactions={setReactionTarget}
              onReact={reactToMessage}
              onReply={setReplyingToMessage}
              onRetry={retryFailedMessage}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons color={colors.border.default} name="chatbubbles-outline" size={34} />
              <Text style={styles.emptyText}>Envie a primeira mensagem.</Text>
            </View>
          }
        />
      )}

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={[styles.composerWrap, { paddingBottom: composerBottomPad }]}>
          {isPeerTyping ? (
            <Text style={styles.typingIndicator}>
              {headerName} está digitando…
            </Text>
          ) : null}
          {replyingToMessage ? (
            <ReplyComposerPreview
              message={replyingToMessage}
              participantName={headerName}
              onCancel={() => setReplyingToMessage(null)}
            />
          ) : null}
          <View style={styles.composerRow}>
            <TextInput
              multiline
              placeholder="Escreva uma mensagem..."
              placeholderTextColor={colors.text.placeholder}
              style={styles.input}
              value={draft}
              onBlur={stopTyping}
              onChangeText={handleDraftChange}
            />
            <Pressable
              accessibilityLabel="Enviar mensagem"
              disabled={!draft.trim()}
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
            >
              <Ionicons
                color={draft.trim() ? colors.brandDark : colors.text.muted}
                name="send"
                size={18}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>

      <ReactionPicker
        message={reactionTarget}
        onClose={() => setReactionTarget(null)}
        onSelect={(emoji) => {
          if (!reactionTarget) return;
          reactToMessage(reactionTarget.id, emoji);
          setReactionTarget(null);
        }}
      />
    </View>
  );
}

function getOwnMessageMeta(message: ChatMessage): string {
  if (message.sendStatus === "sending") return "Enviando…";
  if (message.sendStatus === "failed") return "Falha no envio · Toque para reenviar";
  if (message.readAt) return `Visualizada ${formatRelativeTime(message.readAt)}`;
  return "Entregue";
}

function MessageBubble({
  message,
  onOpenReactions,
  onReact,
  onReply,
  onRetry,
}: {
  message: ChatMessage;
  onOpenReactions: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onRetry: (messageId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [translateX] = useState(() => new Animated.Value(0));
  const canReply = message.sendStatus !== "sending" && message.sendStatus !== "failed";
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          canReply &&
          gestureState.dx > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          translateX.setValue(Math.min(72, Math.max(0, gestureState.dx)));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (canReply && gestureState.dx > 56) {
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
    [canReply, message, onReply, translateX],
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
            style={[
              styles.bubble,
              message.isMine ? styles.bubbleMine : styles.bubbleOther,
              message.sendStatus === "failed" && styles.bubbleFailed,
            ]}
            onLongPress={() => {
              if (message.sendStatus === "failed") return;
              onOpenReactions(message);
            }}
            onPress={() => {
              if (message.sendStatus === "failed") {
                onRetry(message.clientMessageId ?? message.id);
              }
            }}
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
            ) : message.sharedRoute ? (
              <SharedRouteCard message={message} />
            ) : (
              <Text style={[styles.messageText, message.isMine && styles.messageTextMine]}>
                {message.text}
              </Text>
            )}
            <Text
              style={[
                styles.messageMeta,
                message.isMine && styles.messageMetaMine,
                message.sendStatus === "failed" && styles.messageMetaFailed,
              ]}
            >
              {message.isMine
                ? getOwnMessageMeta(message)
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
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
        <Ionicons color={colors.text.secondary} name="close" size={18} />
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
  const styles = useThemedStyles(createStyles);
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
  if (message.sharedRoute) {
    const { title, originLabel, destinationLabel } = message.sharedRoute;
    const path = `${originLabel} → ${destinationLabel}`;
    return title?.trim() ? `${title} · ${path}` : path;
  }
  if (message.text.trim()) return message.text.trim();
  if (message.sharedEvent) return message.sharedEvent.title || "Evento compartilhado";
  if (message.sharedPost) return message.sharedPost.caption || "Post compartilhado";
  return "Mensagem";
}

function SharedEventCard({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <Ionicons color={colors.text.muted} name="calendar-outline" size={20} />
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
      <Ionicons color={colors.text.muted} name="chevron-forward" size={16} />
    </Pressable>
  );
}

function SharedRouteCard({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const sharedRoute = message.sharedRoute;
  if (!sharedRoute) return null;

  const openRoute = () => {
    router.push(`/routes/${sharedRoute.routeId}` as Href);
  };

  const title = sharedRoute.title?.trim() || "Rota compartilhada";

  return (
    <Pressable style={styles.sharedRouteCard} onPress={openRoute}>
      <View style={styles.sharedRouteIcon}>
        <Ionicons color={colors.brandGreen} name="map-outline" size={22} />
      </View>
      <View style={styles.sharedInfo}>
        <View style={styles.sharedRoutePathRow}>
          <Text numberOfLines={1} style={styles.sharedRoutePath}>
            {sharedRoute.originLabel}
          </Text>
          <Text style={styles.sharedRouteArrow}>→</Text>
          <Text numberOfLines={1} style={styles.sharedRoutePath}>
            {sharedRoute.destinationLabel}
          </Text>
        </View>
        <Text numberOfLines={2} style={styles.sharedRouteTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.sharedRouteMeta}>
          Rota de {sharedRoute.creatorName}
        </Text>
      </View>
      <Ionicons color={colors.text.muted} name="chevron-forward" size={16} />
    </Pressable>
  );
}

function SharedPostCard({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          <Ionicons color={colors.text.muted} name="image-outline" size={20} />
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
      <Ionicons color={colors.text.muted} name="chevron-forward" size={16} />
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
  bubble: {
    borderRadius: 22,
    maxWidth: "100%",
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleFailed: {
    opacity: 0.85,
  },
  bubbleMine: {
    backgroundColor: colors.brandGreen,
  },
  bubbleOther: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  typingIndicator: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 260,
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
    backgroundColor: "rgba(255,255,255,0.96)",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  messagesList: {
    flex: 1,
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
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 4,
  },
  messageMetaFailed: {
    color: "#B91C1C",
    fontWeight: "700",
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
    color: colors.text.body,
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
    backgroundColor: colors.surface.preview,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  nextStepText: {
    color: colors.text.secondary,
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
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  reactionBadgeCount: {
    color: colors.text.secondary,
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
    backgroundColor: colors.surface.brandSubtle,
  },
  reactionOptionText: {
    fontSize: 22,
  },
  reactionPicker: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    shadowColor: colors.surface.video,
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
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.brand,
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
    backgroundColor: colors.surface.preview,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replyComposerText: {
    color: colors.text.secondary,
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
    backgroundColor: colors.surface.subtle,
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
    color: colors.text.secondary,
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
    backgroundColor: colors.border.subtle,
  },
  sharedCaption: {
    color: colors.text.comment,
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
    backgroundColor: colors.surface.subtle,
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
  sharedRouteArrow: {
    color: colors.brandDark,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  sharedRouteCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "rgba(28,33,38,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: 280,
    minWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sharedRouteIcon: {
    alignItems: "center",
    backgroundColor: colors.surface.brandSubtle,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sharedRouteMeta: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  sharedRoutePath: {
    color: colors.brandDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  sharedRoutePathRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  sharedRouteTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
  swipeReplyIcon: {
    alignItems: "center",
    backgroundColor: colors.surface.brandSubtle,
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

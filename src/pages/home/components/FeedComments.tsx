import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUserId } from "@/lib/auth";
import { colors } from "@/theme/colors";

import { formatRelativeTime } from "../services/feed.service";
import type { FeedComment } from "../types/feed.types";
import {
  buildReplyTarget,
  buildReplyText,
  type ReplyTarget,
} from "../business/feed-comments.utils";
import { CommentActionSheet } from "./CommentActionSheet";

type FeedCommentsProps = {
  comments: FeedComment[];
  onAddComment: (text: string) => void | Promise<void>;
  onAddReply: (
    parentCommentId: string,
    text: string,
    replyToCommentId?: string,
  ) => void | Promise<void>;
  onDeleteComment: (commentId: string) => void | Promise<void>;
  onEditComment: (commentId: string, text: string) => void | Promise<void>;
  onOpenUserProfile: (userId: string) => void;
  onToggleCommentLike: (commentId: string) => void | Promise<void>;
};

type CommentItemProps = {
  comment: FeedComment;
  currentUserId: string | null;
  depth?: number;
  rootCommentId: string;
  editingId: string | null;
  editText: string;
  replyTarget: ReplyTarget | null;
  replyText: string;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onChangeEditText: (text: string) => void;
  onChangeReplyText: (text: string) => void;
  onOpenActions: (commentId: string) => void;
  onOpenUserProfile: (userId: string) => void;
  onStartReply: (comment: FeedComment, depth: number, rootCommentId: string) => void;
  onSubmitEdit: () => void;
  onSubmitReply: () => void;
  onToggleLike: (commentId: string) => void;
};

function CommentItem({
  comment,
  currentUserId,
  depth = 0,
  rootCommentId,
  editingId,
  editText,
  replyTarget,
  replyText,
  onCancelEdit,
  onCancelReply,
  onChangeEditText,
  onChangeReplyText,
  onOpenActions,
  onOpenUserProfile,
  onStartReply,
  onSubmitEdit,
  onSubmitReply,
  onToggleLike,
}: CommentItemProps) {
  const [repliesToggled, setRepliesToggled] = useState(false);
  const replies = comment.replies ?? [];
  const isMine = comment.userId === currentUserId;
  const isEditing = editingId === comment.id;
  const isReplying = replyTarget?.replyToCommentId === comment.id;
  const isLiked = comment.isLiked ?? false;
  const likeCount = comment.likeCount ?? 0;
  const isActiveReplyParent = depth === 0 && replyTarget?.parentId === comment.id;
  const repliesExpanded = isActiveReplyParent ? !repliesToggled : repliesToggled;

  return (
    <View style={[styles.commentBlock, depth > 0 && styles.nestedComment]}>
      <View style={styles.commentRow}>
        <Pressable
          accessibilityLabel={`Abrir perfil de ${comment.userName}`}
          accessibilityRole="button"
          onPress={() => onOpenUserProfile(comment.userId)}
        >
          <UserAvatar avatarUrl={comment.userAvatar} name={comment.userName} size={28} />
        </Pressable>

        <View style={styles.commentContent}>
          {isEditing ? (
            <View style={styles.inlineEditor}>
              <TextInput
                autoFocus
                value={editText}
                style={styles.inlineInput}
                onChangeText={onChangeEditText}
                onSubmitEditing={onSubmitEdit}
              />
              <Pressable hitSlop={8} onPress={onSubmitEdit}>
                <Ionicons color={colors.brandGreen} name="checkmark-circle" size={22} />
              </Pressable>
              <Pressable hitSlop={8} onPress={onCancelEdit}>
                <Text style={styles.inlineCancel}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.commentBubble}>
                <Text
                  style={styles.commentName}
                  onPress={() => onOpenUserProfile(comment.userId)}
                >
                  {comment.userName}
                </Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>

              {comment.editedAt ? <Text style={styles.editedLabel}>Editado</Text> : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatRelativeTime(comment.createdAt)}</Text>

                <Pressable
                  hitSlop={8}
                  style={styles.likeButton}
                  onPress={() => onToggleLike(comment.id)}
                >
                  <Ionicons
                    color={isLiked ? "#EF4444" : "#9CA3AF"}
                    name={isLiked ? "heart" : "heart-outline"}
                    size={13}
                  />
                  {likeCount > 0 && (
                    <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                      {likeCount}
                    </Text>
                  )}
                </Pressable>

                <Pressable hitSlop={8} onPress={() => onStartReply(comment, depth, rootCommentId)}>
                  <Text style={styles.replyButton}>Responder</Text>
                </Pressable>

                {isMine && (
                  <Pressable
                    hitSlop={8}
                    style={styles.moreButton}
                    onPress={() => onOpenActions(comment.id)}
                  >
                    <Ionicons color="#9CA3AF" name="ellipsis-horizontal" size={16} />
                  </Pressable>
                )}
              </View>
            </>
          )}

          {isReplying && (
            <View style={styles.inlineEditor}>
              <TextInput
                autoFocus
                value={replyText}
                placeholder={`Respondendo a ${comment.userName}...`}
                placeholderTextColor="#9CA3AF"
                style={styles.inlineInput}
                onChangeText={onChangeReplyText}
                onSubmitEditing={onSubmitReply}
              />
              <Pressable hitSlop={8} onPress={onSubmitReply}>
                <Ionicons color={colors.brandGreen} name="checkmark-circle" size={22} />
              </Pressable>
              <Pressable hitSlop={8} onPress={onCancelReply}>
                <Text style={styles.inlineCancel}>Cancelar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {replies.length > 0 && depth === 0 && (
        <>
          <Pressable
            hitSlop={8}
            style={styles.repliesToggle}
            onPress={() => setRepliesToggled((value) => !value)}
          >
            <View style={styles.repliesToggleLine} />
            <Text style={styles.repliesToggleText}>
              {repliesExpanded
                ? "Ocultar respostas"
                : `Ver respostas (${replies.length})`}
            </Text>
          </Pressable>

          {repliesExpanded && (
            <View style={styles.repliesList}>
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  rootCommentId={rootCommentId}
                  editingId={editingId}
                  editText={editText}
                  replyTarget={replyTarget}
                  replyText={replyText}
                  onCancelEdit={onCancelEdit}
                  onCancelReply={onCancelReply}
                  onChangeEditText={onChangeEditText}
                  onChangeReplyText={onChangeReplyText}
                  onOpenActions={onOpenActions}
                  onOpenUserProfile={onOpenUserProfile}
                  onStartReply={onStartReply}
                  onSubmitEdit={onSubmitEdit}
                  onSubmitReply={onSubmitReply}
                  onToggleLike={onToggleLike}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

export function FeedComments({
  comments,
  onAddComment,
  onAddReply,
  onDeleteComment,
  onEditComment,
  onOpenUserProfile,
  onToggleCommentLike,
}: FeedCommentsProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionSheetCommentId, setActionSheetCommentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId);
  }, []);

  const closeActionSheet = () => {
    setActionSheetCommentId(null);
    setConfirmDelete(false);
  };

  const findCommentById = (
    items: FeedComment[],
    commentId: string,
  ): FeedComment | null => {
    for (const item of items) {
      if (item.id === commentId) return item;
      if (item.replies?.length) {
        const nested = findCommentById(item.replies, commentId);
        if (nested) return nested;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const value = text.trim();
    if (!value || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(value);
      setText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    const value = replyText.trim();
    if (!value || !replyTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddReply(
        replyTarget.parentId,
        buildReplyText(value, replyTarget.mentionName),
        replyTarget.replyToCommentId,
      );
      setReplyText("");
      setReplyTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    const value = editText.trim();
    if (!value || !editingId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onEditComment(editingId, value);
      setEditingId(null);
      setEditText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!actionSheetCommentId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onDeleteComment(actionSheetCommentId);
      closeActionSheet();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          rootCommentId={comment.id}
          editingId={editingId}
          editText={editText}
          replyTarget={replyTarget}
          replyText={replyText}
          onCancelEdit={() => {
            setEditingId(null);
            setEditText("");
          }}
          onCancelReply={() => {
            setReplyTarget(null);
            setReplyText("");
          }}
          onChangeEditText={setEditText}
          onChangeReplyText={setReplyText}
          onOpenActions={setActionSheetCommentId}
          onOpenUserProfile={onOpenUserProfile}
          onStartReply={(target, depth, rootId) => {
            setReplyTarget(buildReplyTarget(target, rootId, depth));
            setReplyText("");
            setEditingId(null);
          }}
          onSubmitEdit={() => void handleSubmitEdit()}
          onSubmitReply={() => void handleSubmitReply()}
          onToggleLike={(commentId) => void onToggleCommentLike(commentId)}
        />
      ))}

      <View style={[styles.inputRow, text.trim() && styles.inputRowFocused]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Adicionar comentário..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="send"
          editable={!isSubmitting}
          onSubmitEditing={() => void handleSubmit()}
        />
        {text.trim() ? (
          <Pressable
            style={styles.sendButtonInside}
            disabled={isSubmitting}
            hitSlop={8}
            onPress={() => void handleSubmit()}
          >
            <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>

      <CommentActionSheet
        confirmDelete={confirmDelete}
        visible={Boolean(actionSheetCommentId)}
        onCancel={closeActionSheet}
        onConfirmDelete={() => void handleConfirmDelete()}
        onEdit={() => {
          if (!actionSheetCommentId) return;
          const target = findCommentById(comments, actionSheetCommentId);
          closeActionSheet();
          if (!target) return;
          setEditingId(target.id);
          setEditText(target.text);
          setReplyTarget(null);
        }}
        onRequestDelete={() => setConfirmDelete(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  commentBlock: {
    gap: 10,
  },
  commentBubble: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentName: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
  },
  commentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  commentText: {
    color: "#4B5563",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  container: {
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  editedLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
    paddingLeft: 2,
  },
  inlineCancel: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  inlineEditor: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  inlineInput: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    color: colors.brandDark,
    flex: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    backgroundColor: "transparent",
    color: colors.brandDark,
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
    paddingRight: 4,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    paddingLeft: 12,
    paddingRight: 6,
  },
  inputRowFocused: {
    borderColor: colors.brandGreen,
  },
  likeButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  likeCount: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  likeCountActive: {
    color: "#EF4444",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
    paddingLeft: 2,
  },
  metaText: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  moreButton: {
    marginLeft: "auto",
  },
  nestedComment: {
    marginLeft: 32,
  },
  replyButton: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  repliesList: {
    gap: 10,
    marginTop: 8,
  },
  repliesToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginLeft: 32,
    marginTop: 4,
  },
  repliesToggleLine: {
    backgroundColor: "#D1D5DB",
    height: 1,
    width: 24,
  },
  repliesToggleText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },
  sendButtonInside: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});

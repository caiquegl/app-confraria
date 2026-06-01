import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import type { FeedComment } from "../types/feed.types";

type FeedCommentsProps = {
  comments: FeedComment[];
  onAddComment: (text: string) => void | Promise<void>;
};

export function FeedComments({ comments, onAddComment }: FeedCommentsProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentRow}>
          <UserAvatar avatarUrl={comment.userAvatar} name={comment.userName} size={28} />
          <View style={styles.commentBubble}>
            <Text style={styles.commentName}>{comment.userName}</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
        </View>
      ))}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Adicionar comentário..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || isSubmitting) && styles.sendButtonDisabled]}
          disabled={!text.trim() || isSubmitting}
          hitSlop={8}
          onPress={() => void handleSubmit()}
        >
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={text.trim() && !isSubmitting ? colors.brandGreen : "#D1D5DB"}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentBubble: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  input: {
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
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

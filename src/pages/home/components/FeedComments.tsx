import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

import type { FeedComment } from "../types/feed.types";

type FeedCommentsProps = {
  comments: FeedComment[];
  onAddComment: (text: string) => void;
};

export function FeedComments({ comments, onAddComment }: FeedCommentsProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const value = text.trim();
    if (!value) return;

    onAddComment(value);
    setText("");
  };

  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentRow}>
          <Image source={{ uri: comment.userAvatar }} style={styles.avatar} contentFit="cover" />
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
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          disabled={!text.trim()}
          hitSlop={8}
          onPress={handleSubmit}
        >
          <Ionicons name="checkmark-circle" size={22} color={text.trim() ? colors.brandGreen : "#D1D5DB"} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 14,
    height: 28,
    marginTop: 2,
    width: 28,
  },
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

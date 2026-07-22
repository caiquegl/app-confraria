import { StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";
import type { ServiceReview } from "@/pages/services/types/services.types";

import { StarRating } from "./StarRating";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

type ReviewItemProps = {
  review: ServiceReview;
};

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <View style={styles.container}>
      <UserAvatar
        avatarUrl={review.userAvatarUrl}
        name={review.userName}
        size={40}
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.name}>
            {review.userName}
            {review.isMine ? " (você)" : ""}
          </Text>
          <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
        </View>

        <StarRating size={14} value={review.rating} />

        {review.comment ? (
          <Text style={styles.comment}>{review.comment}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  container: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
  },
  date: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
});

import { Text, type TextStyle } from "react-native";

import { colors } from "@/theme/colors";

import type { FeedPost } from "../types/feed.types";

type FeedActionTextProps = {
  post: FeedPost;
  style?: TextStyle;
};

export function FeedActionText({ post, style }: FeedActionTextProps) {
  switch (post.type) {
    case "event_attended":
      return (
        <Text style={style}>
          participou de <Text style={styles.strong}>{post.eventTitle}</Text>
        </Text>
      );
    case "event_liked":
      return (
        <Text style={style}>
          curtiu o evento <Text style={styles.strong}>{post.eventTitle}</Text>
        </Text>
      );
    case "photo_shared":
      return (
        <Text style={style}>
          {post.eventTitle ? (
            <>
              compartilhou fotos em <Text style={styles.strong}>{post.eventTitle}</Text>
            </>
          ) : (
            "compartilhou fotos"
          )}
        </Text>
      );
    case "route_completed":
      return (
        <Text style={style}>
          completou a rota <Text style={styles.strong}>{post.routeTitle}</Text>
          {post.routeDistanceKm ? ` · ${post.routeDistanceKm}km` : ""}
        </Text>
      );
    default:
      return null;
  }
}

const styles = {
  strong: {
    color: colors.brandDark,
    fontWeight: "700" as const,
  },
};

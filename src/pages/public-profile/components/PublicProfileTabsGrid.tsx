import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { FeedPost } from "@/pages/home/types/feed.types";
import type { PublicProfileEvent } from "@/pages/public-profile-events/types/public-profile-events.types";
import { colors } from "@/theme/colors";

type ProfileTabKey = "posts" | "events";

type PublicProfileTabsGridProps = {
  events: PublicProfileEvent[];
  isEventsLoading: boolean;
  isLoading: boolean;
  posts: FeedPost[];
  onEventPress: (event: PublicProfileEvent) => void;
  onPostLongPress?: (post: FeedPost) => void;
  onPostPress: (index: number) => void;
};

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "events", label: "Eventos" },
];

const EMPTY_LABEL: Record<ProfileTabKey, string> = {
  events: "Nenhum evento ainda",
  posts: "Nenhum post ainda",
};

const GRID_GAP = 3;
const HORIZONTAL_PADDING = 24;
const ITEM_SIZE = Math.floor(
  (Dimensions.get("window").width - HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3,
);

export function PublicProfileTabsGrid({
  events,
  isEventsLoading,
  isLoading,
  posts,
  onEventPress,
  onPostLongPress,
  onPostPress,
}: PublicProfileTabsGridProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("posts");
  const isPostsTab = activeTab === "posts";
  const activeItemsCount = isPostsTab ? posts.length : events.length;
  const isActiveTabLoading = isPostsTab ? isLoading : isEventsLoading;
  const isEmpty = activeItemsCount === 0;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isActiveTabLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{EMPTY_LABEL[activeTab]}</Text>
        </View>
      ) : isPostsTab ? (
        <View style={styles.grid}>
          {posts.map((post, index) => (
            <PublicProfilePostGridItem
              key={post.id}
              post={post}
              onLongPress={onPostLongPress ? () => onPostLongPress(post) : undefined}
              onPress={() => onPostPress(index)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {events.map((event) => (
            <PublicProfileEventGridItem
              key={event.id}
              event={event}
              onPress={() => onEventPress(event)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function PublicProfilePostGridItem({
  onLongPress,
  post,
  onPress,
}: {
  onLongPress?: () => void;
  post: FeedPost;
  onPress: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const videoThumbnail = post.media?.find((item) => item.mediaType === "video")?.thumbnailUrl;
  const image = post.media?.find((item) => item.mediaType === "image")?.url
    ?? videoThumbnail
    ?? post.photos?.[0]
    ?? post.eventImage;
  const hasVideo = post.media?.some((item) => item.mediaType === "video") ?? false;
  const label = post.caption || post.eventTitle || post.routeTitle;

  return (
    <Pressable
      delayLongPress={320}
      style={styles.item}
      onLongPress={onLongPress}
      onPress={onPress}
    >
      {image && !hasImageError ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={`${post.id}-${image}`}
          onError={() => setHasImageError(true)}
        />
      ) : hasVideo ? (
        <View style={styles.videoFallback}>
          <Ionicons color="#FFFFFF" name="play" size={26} />
        </View>
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons color="#9CA3AF" name="image-outline" size={24} />
        </View>
      )}
      {post.media && post.media.length > 1 ? (
        <View style={styles.mediaCountBadge}>
          <Ionicons color="#FFFFFF" name="copy-outline" size={13} />
        </View>
      ) : null}
      {hasVideo && image && !hasImageError ? (
        <View style={styles.videoPlayBadge}>
          <Ionicons color="#FFFFFF" name="play" size={16} />
        </View>
      ) : null}
      {label ? (
        <View style={styles.labelBadge}>
          <Text numberOfLines={1} style={styles.labelText}>
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function PublicProfileEventGridItem({
  event,
  onPress,
}: {
  event: PublicProfileEvent;
  onPress: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <Pressable style={styles.item} onPress={onPress}>
      {event.image && !hasImageError ? (
        <Image
          source={{ uri: event.image }}
          style={styles.image}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={`${event.id}-${event.image}`}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons color="#9CA3AF" name="calendar-outline" size={24} />
        </View>
      )}
      <View style={styles.labelBadge}>
        <Text numberOfLines={1} style={styles.labelText}>
          {event.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 18,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    marginTop: 14,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageFallback: {
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    flex: 1,
    justifyContent: "center",
  },
  item: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    height: ITEM_SIZE,
    overflow: "hidden",
    position: "relative",
    width: ITEM_SIZE,
  },
  labelBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    bottom: 6,
    left: 6,
    maxWidth: "88%",
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  mediaCountBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 5,
    position: "absolute",
    right: 6,
    top: 6,
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.brandGreen,
  },
  tabs: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  tabText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.brandDark,
    fontWeight: "900",
  },
  videoFallback: {
    alignItems: "center",
    backgroundColor: "#111827",
    flex: 1,
    justifyContent: "center",
  },
  videoPlayBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    left: "50%",
    marginLeft: -17,
    marginTop: -17,
    position: "absolute",
    top: "50%",
    width: 34,
  },
});

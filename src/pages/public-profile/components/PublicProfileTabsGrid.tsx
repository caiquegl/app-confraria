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

import { colors } from "@/theme/colors";
import type { FeedPost } from "@/pages/home/types/feed.types";

type ProfileTabKey = "posts" | "places" | "events";

type PublicProfileTabsGridProps = {
  isLoading: boolean;
  posts: FeedPost[];
  onPostPress: (index: number) => void;
};

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "places", label: "Lugares" },
  { key: "events", label: "Eventos" },
];

const EMPTY_LABEL: Record<ProfileTabKey, string> = {
  events: "Nenhum evento ainda",
  places: "Nenhuma rota ainda",
  posts: "Nenhum post ainda",
};

const GRID_GAP = 3;
const HORIZONTAL_PADDING = 24;
const ITEM_SIZE = Math.floor(
  (Dimensions.get("window").width - HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3,
);

export function PublicProfileTabsGrid({
  isLoading,
  posts,
  onPostPress,
}: PublicProfileTabsGridProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("posts");
  const isPostsTab = activeTab === "posts";
  const isEmpty = !isPostsTab || posts.length === 0;

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

      {isLoading && isPostsTab ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{EMPTY_LABEL[activeTab]}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {posts.map((post, index) => (
            <PublicProfilePostGridItem
              key={post.id}
              post={post}
              onPress={() => onPostPress(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function PublicProfilePostGridItem({
  post,
  onPress,
}: {
  post: FeedPost;
  onPress: () => void;
}) {
  const image = post.photos?.[0] ?? post.eventImage;
  const label = post.caption || post.eventTitle || post.routeTitle;

  return (
    <Pressable style={styles.item} onPress={onPress}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={image}
        />
      ) : (
        <View style={styles.imageFallback} />
      )}
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
    backgroundColor: "#E5E7EB",
    flex: 1,
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
});

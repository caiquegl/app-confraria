import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import type { SavedRoute } from "../types/saved-route.types";
import { SavedRouteCard } from "./SavedRouteCard";

type RoutesHorizontalSectionProps = {
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRoutePress: (routeId: string) => void;
  routes: SavedRoute[];
  showAuthor?: boolean;
  subtitle: string;
  title: string;
};

export function RoutesHorizontalSection({
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRoutePress,
  routes,
  showAuthor = true,
  subtitle,
  title,
}: RoutesHorizontalSectionProps) {
  if (isLoading || routes.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <FlatList
        horizontal
        nestedScrollEnabled
        contentContainerStyle={styles.carousel}
        data={routes}
        keyExtractor={(route) => route.id}
        renderItem={({ item }) => (
          <SavedRouteCard
            route={item}
            showAuthor={showAuthor}
            onPress={() => onRoutePress(item.id)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const distanceFromEnd =
            contentSize.width - layoutMeasurement.width - contentOffset.x;

          if (distanceFromEnd < 80 && hasMore && !isLoadingMore) {
            onLoadMore();
          }
        }}
        scrollEventThrottle={16}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.brandDark} size="small" />
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    gap: 12,
    paddingLeft: 24,
    paddingRight: 12,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    width: 48,
  },
  footerSpacer: {
    width: 12,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  list: {
    minHeight: 188,
  },
  section: {
    marginBottom: 24,
    paddingTop: 8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
});

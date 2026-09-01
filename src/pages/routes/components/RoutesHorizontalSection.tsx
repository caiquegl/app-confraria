import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { SavedRoute } from "../types/saved-route.types";
import { CommunityRouteCard } from "./CommunityRouteCard";
import { SavedRouteCard } from "./SavedRouteCard";

type RoutesHorizontalSectionProps = {
  cardVariant?: "community" | "saved";
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onRoutePress: (routeId: string) => void;
  paginationError?: boolean;
  routes: SavedRoute[];
  showAuthor?: boolean;
  subtitle: string;
  title: string;
};

export function RoutesHorizontalSection({
  cardVariant = "saved",
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRoutePress,
  paginationError = false,
  routes,
  showAuthor = true,
  subtitle,
  title,
}: RoutesHorizontalSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
        renderItem={({ item }) =>
          cardVariant === "community" ? (
            <CommunityRouteCard route={item} onPress={() => onRoutePress(item.id)} />
          ) : (
            <SavedRouteCard
              route={item}
              showAuthor={showAuthor}
              onPress={() => onRoutePress(item.id)}
            />
          )
        }
        showsHorizontalScrollIndicator={false}
        style={[styles.list, cardVariant === "community" && styles.listCommunity]}
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
          ) : paginationError ? (
            <Pressable
              accessibilityRole="button"
              style={styles.retryFooter}
              onPress={onLoadMore}
            >
              <Text style={styles.retryFooterText}>Tentar novamente</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
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
  retryFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    width: 120,
  },
  retryFooterText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  list: {
    minHeight: 188,
  },
  listCommunity: {
    minHeight: 280,
  },
  section: {
    marginBottom: 24,
    paddingTop: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
});

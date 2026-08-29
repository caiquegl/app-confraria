import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar } from "@/components/AppTopBar";
import {
  getStoredCurrentProfile,
  subscribeStoredCurrentProfile,
} from "@/lib/current-profile-store";
import { useGeolocation } from "@/lib/location";
import { useNotificationBadge } from "@/pages/notifications";
import { colors } from "@/theme/colors";

import { RoutesHorizontalSection } from "../components/RoutesHorizontalSection";
import { useFriendsRoutes } from "../hooks/useFriendsRoutes";
import { useMyPublishedRoutes } from "../hooks/useMyPublishedRoutes";
import { useNearPublishedRoutes } from "../hooks/useNearPublishedRoutes";

export function RoutesExploreView() {
  const insets = useSafeAreaInsets();
  const { hasUnread } = useNotificationBadge();
  const { location } = useGeolocation();
  const storedProfile = getStoredCurrentProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(storedProfile.avatar);
  const [userName, setUserName] = useState<string>(storedProfile.name ?? "Perfil");

  const publishedRoutes = useMyPublishedRoutes({
    enabled: true,
    searchQuery,
  });
  const nearRoutes = useNearPublishedRoutes({
    city: location.city,
    enabled: true,
    region: location.region,
    searchQuery,
  });
  const friendsRoutes = useFriendsRoutes({
    enabled: true,
    searchQuery,
  });

  useEffect(() => {
    return subscribeStoredCurrentProfile((profile) => {
      setUserAvatar(profile.avatar);
      setUserName(profile.name ?? "Perfil");
    });
  }, []);

  const hasCommunityContent =
    publishedRoutes.routes.length > 0 ||
    nearRoutes.routes.length > 0 ||
    friendsRoutes.routes.length > 0;
  const isCommunityLoading =
    (publishedRoutes.isLoading || nearRoutes.isLoading || friendsRoutes.isLoading) &&
    !hasCommunityContent;

  const locationLabel =
    location.cityLabel ?? (location.status === "ready" ? "Localização atual" : "Explorar rotas");

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 96 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.stickyHeader}>
          <AppTopBar
            hasUnreadNotifications={hasUnread}
            locationLabel={locationLabel}
            searchPlaceholder="Buscar rota por nome"
            searchQuery={searchQuery}
            topInset={insets.top}
            userAvatar={userAvatar}
            userName={userName}
            onOpenNotifications={() => router.push("/notifications")}
            onOpenProfile={() => router.push("/profile")}
            onSearchChange={setSearchQuery}
          />

          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Voltar para o mapa"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Comunidade</Text>
              <Text style={styles.pageTitle}>Explorar rotas</Text>
            </View>
          </View>
        </View>

        <View style={styles.communityContent}>
          <RoutesHorizontalSection
            hasMore={publishedRoutes.hasMore}
            isLoading={publishedRoutes.isLoading}
            isLoadingMore={publishedRoutes.isLoadingMore}
            routes={publishedRoutes.routes}
            subtitle="Suas rotas disponíveis para o Confraria"
            title="Publicadas por você"
            onLoadMore={() => void publishedRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          <RoutesHorizontalSection
            hasMore={nearRoutes.hasMore}
            isLoading={nearRoutes.isLoading}
            isLoadingMore={nearRoutes.isLoadingMore}
            routes={nearRoutes.routes}
            subtitle="Roteiros compartilhados perto da sua região"
            title="Rotas próximas de você"
            onLoadMore={() => void nearRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          <RoutesHorizontalSection
            hasMore={friendsRoutes.hasMore}
            isLoading={friendsRoutes.isLoading}
            isLoadingMore={friendsRoutes.isLoadingMore}
            routes={friendsRoutes.routes}
            subtitle="Roteiros de quem você segue no Confraria"
            title="Rotas de amigos"
            onLoadMore={() => void friendsRoutes.loadMore()}
            onRoutePress={(routeId) => router.push(`/routes/${routeId}` as Href)}
          />

          {isCommunityLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandDark} size="large" />
            </View>
          ) : !hasCommunityContent ? (
            <View style={styles.communityPlaceholder}>
              <Text style={styles.communityTitle}>
                {searchQuery.trim() ? "Nenhum resultado" : "Explorar rotas"}
              </Text>
              <Text style={styles.communitySubtitle}>
                {searchQuery.trim()
                  ? "Não encontramos rotas publicadas com esse termo."
                  : "Publique uma rota, explore roteiros da sua cidade ou siga outros membros para ver mais passeios."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  communityContent: {
    paddingBottom: 24,
  },
  communityPlaceholder: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  communitySubtitle: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  communityTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
  },
  eyebrow: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  headerCopy: {
    flex: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  pageTitle: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: colors.brandGray,
  },
});

import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { usePublicProfileFollows } from "../business/usePublicProfileFollows";
import type {
  PublicProfileFollowRequest,
  PublicProfileFollowTab,
  PublicProfileFollowUser,
} from "../types/public-profile.types";

type PublicProfileFollowsViewProps = {
  initialTab: PublicProfileFollowTab;
  userId: string;
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
};

const TABS: { key: PublicProfileFollowTab; label: string }[] = [
  { key: "followers", label: "Seguidores" },
  { key: "following", label: "Seguindo" },
  { key: "requests", label: "Pedidos" },
];

export function PublicProfileFollowsView({
  initialTab,
  userId,
  onBack,
  onOpenProfile,
}: PublicProfileFollowsViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    acceptRequest,
    activeTab,
    canViewRequests,
    declineRequest,
    error,
    filteredRequests,
    filteredUsers,
    followersCount,
    followingCount,
    followingLoadingById,
    isLoading,
    isRetrying,
    requestLoadingById,
    requestsCount,
    retry,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    followUser,
  } = usePublicProfileFollows(userId, initialTab);
  const visibleTabs = canViewRequests
    ? TABS
    : TABS.filter((tab) => tab.key !== "requests");

  const emptyMessage =
    activeTab === "followers"
      ? "Este usuário ainda não tem seguidores."
      : activeTab === "following"
        ? "Este usuário ainda não segue ninguém."
        : "Você ainda não recebeu pedidos.";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Seguidores</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons color={colors.text.muted} name="search" size={17} />
        <TextInput
          placeholder="Buscar por nome..."
          placeholderTextColor={colors.text.placeholder}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabsWrap}>
        {visibleTabs.map((tab) => {
          const active = tab.key === activeTab;
          const count =
            tab.key === "followers"
              ? followersCount
              : tab.key === "following"
                ? followingCount
                : requestsCount;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label} {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && !isLoading ? (
        <ErrorState
          description="Verifique a conexão e tente novamente."
          retrying={isRetrying}
          style={styles.errorState}
          title="Não foi possível carregar seguidores"
          onRetry={() => void retry()}
        />
      ) : isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : activeTab === "requests" ? (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.requestId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          renderItem={({ item }) => (
            <FollowRequestCard
              request={item}
              isLoading={requestLoadingById[item.requestId] ?? false}
              onAccept={() => void acceptRequest(item)}
              onDecline={() => void declineRequest(item)}
              onOpenProfile={() => onOpenProfile(item.userId)}
            />
          )}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          renderItem={({ item }) => (
            <FollowUserCard
              user={item}
              isLoading={followingLoadingById[item.userId] ?? false}
              onFollow={() => void followUser(item)}
              onOpenProfile={() => onOpenProfile(item.userId)}
            />
          )}
        />
      )}
    </View>
  );
}

function FollowRequestCard({
  isLoading,
  request,
  onAccept,
  onDecline,
  onOpenProfile,
}: {
  isLoading: boolean;
  request: PublicProfileFollowRequest;
  onAccept: () => void;
  onDecline: () => void;
  onOpenProfile: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Pressable style={styles.userRow} onPress={onOpenProfile}>
        <UserAvatar avatarUrl={request.avatar} name={request.name} size={54} />
        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName}>
            {request.name}
          </Text>
          <Text style={styles.locationText}>
            {request.location ?? "Solicitou seguir você"}
          </Text>
        </View>
      </Pressable>

      <View style={styles.requestActions}>
        <Pressable
          disabled={isLoading}
          style={[styles.acceptButton, isLoading && styles.followButtonDisabled]}
          onPress={onAccept}
        >
          <Text style={styles.acceptText}>Aceitar</Text>
        </Pressable>
        <Pressable
          disabled={isLoading}
          style={[styles.declineButton, isLoading && styles.followButtonDisabled]}
          onPress={onDecline}
        >
          <Text style={styles.declineText}>Recusar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FollowUserCard({
  isLoading,
  user,
  onFollow,
  onOpenProfile,
}: {
  isLoading: boolean;
  user: PublicProfileFollowUser;
  onFollow: () => void;
  onOpenProfile: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const disableFollow = user.isSelf || user.isFollowing || isLoading;
  const buttonLabel = user.isSelf ? "Você" : user.isFollowing ? "Seguindo" : "Seguir";

  return (
    <View style={styles.card}>
      <Pressable style={styles.userRow} onPress={onOpenProfile}>
        <UserAvatar avatarUrl={user.avatar} name={user.name} size={54} />
        <View style={styles.userInfo}>
          <Text numberOfLines={1} style={styles.userName}>
            {user.name}
          </Text>
          {user.location ? (
            <View style={styles.locationRow}>
              <Ionicons color={colors.text.muted} name="location-outline" size={12} />
              <Text numberOfLines={1} style={styles.locationText}>
                {user.location}
              </Text>
            </View>
          ) : (
            <Text style={styles.locationText}>Confraria</Text>
          )}
        </View>
      </Pressable>

      <Pressable
        disabled={disableFollow}
        style={[styles.followButton, disableFollow && styles.followButtonDisabled]}
        onPress={onFollow}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.brandDark} size="small" />
        ) : (
          <Text style={[styles.followText, disableFollow && styles.followTextDisabled]}>
            {buttonLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.empty}>
      <Ionicons color={colors.border.default} name="people-outline" size={42} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  acceptText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  declineButton: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 12,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  declineText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 70,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 13,
    textAlign: "center",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
  },
  followButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    marginTop: 10,
  },
  followButtonDisabled: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderWidth: 1,
  },
  followText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  followTextDisabled: {
    color: colors.text.secondary,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "900",
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 3,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  searchInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  tabsWrap: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    marginHorizontal: 20,
    padding: 4,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.brandDark,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
  },
  userRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
});

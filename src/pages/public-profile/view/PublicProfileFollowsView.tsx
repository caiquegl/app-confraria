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

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import { usePublicProfileFollows } from "../business/usePublicProfileFollows";
import type {
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
];

export function PublicProfileFollowsView({
  initialTab,
  userId,
  onBack,
  onOpenProfile,
}: PublicProfileFollowsViewProps) {
  const {
    activeTab,
    error,
    filteredUsers,
    followersCount,
    followingCount,
    followingLoadingById,
    isLoading,
    retry,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    followUser,
  } = usePublicProfileFollows(userId, initialTab);

  const emptyMessage =
    activeTab === "followers"
      ? "Este usuário ainda não tem seguidores."
      : "Este usuário ainda não segue ninguém.";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Seguidores</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons color="#9CA3AF" name="search" size={17} />
        <TextInput
          placeholder="Buscar por nome..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabsWrap}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          const count = tab.key === "followers" ? followersCount : followingCount;

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

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void retry()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
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
              <Ionicons color="#9CA3AF" name="location-outline" size={12} />
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
  return (
    <View style={styles.empty}>
      <Ionicons color="#D1D5DB" name="people-outline" size={42} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
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
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
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
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  followText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  followTextDisabled: {
    color: "#6B7280",
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
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 3,
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
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
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
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
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 18,
    marginHorizontal: 20,
    padding: 4,
  },
  tabText: {
    color: "#6B7280",
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

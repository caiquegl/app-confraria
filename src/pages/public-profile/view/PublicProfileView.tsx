import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import { usePublicProfile } from "../business/usePublicProfile";
import {
  followPublicProfile,
  unfollowPublicProfile,
} from "../services/public-profile.service";

type PublicProfileViewProps = {
  userId: string;
  onBack: () => void;
};

export function PublicProfileView({ onBack, userId }: PublicProfileViewProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { error, isLoading, profile, retry, updateFollowState } =
    usePublicProfile(userId);

  const handleToggleFollow = async () => {
    if (isFollowLoading || !profile) return;

    setIsFollowLoading(true);
    try {
      const result = profile.isFollowing
        ? await unfollowPublicProfile(userId)
        : await followPublicProfile(userId);

      updateFollowState(result);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {profile?.handle || profile?.name || "Perfil"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : error || !profile ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Perfil não encontrado</Text>
          <Text style={styles.errorText}>{error ?? "Tente novamente em instantes."}</Text>
          <Pressable style={styles.retryButton} onPress={() => void retry()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <UserAvatar avatarUrl={profile.avatar} name={profile.name} size={104} />
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons color="#FFFFFF" name="checkmark" size={14} />
                </View>
              )}
            </View>

            <Text style={styles.name}>{profile.name}</Text>
            {profile.location ? (
              <Text style={styles.location}>{profile.location}</Text>
            ) : null}
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.statsRow}>
              <ProfileStat label="posts" value={profile.postsCount} />
              <ProfileStat label="seguidores" value={profile.followersCount} />
              <ProfileStat label="seguindo" value={profile.followingCount} />
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[
                styles.actionButton,
                profile.isFollowing ? styles.followingButton : styles.followButton,
                isFollowLoading && styles.actionButtonDisabled,
              ]}
              disabled={isFollowLoading}
              onPress={() => void handleToggleFollow()}
            >
              <Ionicons
                color={colors.brandDark}
                name={profile.isFollowing ? "checkmark" : "person-add-outline"}
                size={16}
              />
              <Text style={styles.actionText}>
                {profile.isFollowing ? "Seguindo" : "Seguir"}
              </Text>
            </Pressable>

            <Pressable style={[styles.actionButton, styles.messageButton]}>
              <Ionicons color={colors.brandDark} name="chatbubble-outline" size={16} />
              <Text style={styles.actionText}>Mensagem</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 44,
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    marginBottom: 14,
    position: "relative",
  },
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
  bio: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    textAlign: "center",
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    paddingBottom: 120,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  errorTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  followButton: {
    backgroundColor: colors.brandGreen,
  },
  followingButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  location: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
  },
  messageButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  name: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  profileCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 22,
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
    fontWeight: "700",
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    borderRadius: 22,
    flexDirection: "row",
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: "100%",
  },
  statValue: {
    color: colors.brandDark,
    fontSize: 17,
    fontWeight: "800",
  },
  verifiedBadge: {
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandGray,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 4,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    width: 26,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { UserAvatar } from "@/components/UserAvatar";
import { createChatConversation } from "@/pages/messages/services/messages.service";
import { StoryViewer } from "@/pages/stories/components/StoryViewer";
import {
  fetchUserStories,
  markStoryViewed,
  toggleStoryLike,
} from "@/pages/stories/services/stories.service";
import type { StoryGroup, StoryItem } from "@/pages/stories/types/stories.types";
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
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [profileStoryGroup, setProfileStoryGroup] = useState<StoryGroup | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const { error, isLoading, profile, retry, updateFollowState } =
    usePublicProfile(userId);

  useEffect(() => {
    let cancelled = false;

    void fetchUserStories(userId)
      .then((storyGroup) => {
        if (!cancelled) setProfileStoryGroup(storyGroup);
      })
      .catch(() => {
        if (!cancelled) setProfileStoryGroup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  const handleStoryVisible = (story: StoryItem) => {
    if (story.isMine || story.viewed) return;

    setProfileStoryGroup((current) =>
      current
        ? {
            ...current,
            stories: current.stories.map((item) =>
              item.id === story.id ? { ...item, viewed: true } : item,
            ),
          }
        : current,
    );

    void markStoryViewed(story.id);
  };

  const updateProfileStory = (storyId: string, patch: Partial<StoryItem>) => {
    setProfileStoryGroup((current) =>
      current
        ? {
            ...current,
            stories: current.stories.map((item) =>
              item.id === storyId ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  };

  const handleToggleStoryLike = async (story: StoryItem) => {
    if (story.isMine) return;

    updateProfileStory(story.id, {
      isLiked: !story.isLiked,
      likeCount: Math.max(0, story.likeCount + (story.isLiked ? -1 : 1)),
    });

    try {
      const result = await toggleStoryLike(story.id);
      updateProfileStory(story.id, {
        isLiked: result.liked,
        likeCount: result.likeCount,
      });
    } catch {
      updateProfileStory(story.id, {
        isLiked: story.isLiked,
        likeCount: story.likeCount,
      });
      Toast.show({
        type: "error",
        text1: "Erro ao curtir story",
        text2: "Não foi possível atualizar sua curtida.",
      });
    }
  };

  const handleOpenMessage = async () => {
    if (!profile?.isFollowing || isMessageLoading) return;

    setIsMessageLoading(true);
    try {
      const conversation = await createChatConversation(profile.id);
      router.push({
        pathname: "/messages/[conversationId]",
        params: {
          conversationId: conversation.id,
          participantAvatar: profile.avatar ?? "",
          participantName: profile.name,
        },
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao abrir conversa",
        text2: "Não foi possível iniciar a conversa.",
      });
    } finally {
      setIsMessageLoading(false);
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
            <Pressable
              accessibilityLabel={`Ver story de ${profile.name}`}
              accessibilityRole="button"
              disabled={!profileStoryGroup}
              style={styles.avatarWrap}
              onPress={() => setStoryViewerOpen(true)}
            >
              <View
                style={[
                  styles.avatarRing,
                  profileStoryGroup && styles.avatarRingActive,
                ]}
              >
                <UserAvatar avatarUrl={profile.avatar} name={profile.name} size={104} />
              </View>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons color="#FFFFFF" name="checkmark" size={14} />
                </View>
              )}
            </Pressable>

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

            <Pressable
              disabled={!profile.isFollowing || isMessageLoading}
              style={[
                styles.actionButton,
                styles.messageButton,
                (!profile.isFollowing || isMessageLoading) &&
                  styles.messageButtonDisabled,
              ]}
              onPress={() => void handleOpenMessage()}
            >
              <Ionicons
                color={profile.isFollowing ? colors.brandDark : "#9CA3AF"}
                name="chatbubble-outline"
                size={16}
              />
              <Text
                style={[
                  styles.actionText,
                  !profile.isFollowing && styles.actionTextDisabled,
                ]}
              >
                Mensagem
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {profileStoryGroup && (
        <StoryViewer
          groups={[profileStoryGroup]}
          initialGroupIndex={0}
          visible={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          onOpenViewers={() => undefined}
          onStoryVisible={handleStoryVisible}
          onToggleLike={(story) => void handleToggleStoryLike(story)}
        />
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
  actionTextDisabled: {
    color: "#9CA3AF",
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
  avatarRing: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 3,
    height: 114,
    justifyContent: "center",
    width: 114,
  },
  avatarRingActive: {
    borderColor: colors.brandGreen,
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
  messageButtonDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.75,
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

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
import { getCurrentUserId } from "@/lib/auth";
import { fetchUserBikes } from "@/pages/bikes/services/bikes.service";
import { SharePostSheet } from "@/pages/home/components/SharePostSheet";
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
import { usePublicProfilePosts } from "../business/usePublicProfilePosts";
import { PublicProfilePostsViewer } from "../components/PublicProfilePostsViewer";
import { PublicProfileTabsGrid } from "../components/PublicProfileTabsGrid";
import {
  followPublicProfile,
  unfollowPublicProfile,
} from "../services/public-profile.service";

type PublicProfileViewProps = {
  userId: string;
  isOwnProfile?: boolean;
  refreshKey?: number;
  onBack?: () => void;
  onEditProfile?: () => void;
  onOpenSettings?: () => void;
};

export function PublicProfileView({
  isOwnProfile = false,
  onBack,
  onEditProfile,
  onOpenSettings,
  refreshKey = 0,
  userId,
}: PublicProfileViewProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [profileStoryGroup, setProfileStoryGroup] = useState<StoryGroup | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [postsViewerIndex, setPostsViewerIndex] = useState<number | null>(null);
  const [bikeCount, setBikeCount] = useState(0);
  const { error, isLoading, profile, retry, updateFollowState } =
    usePublicProfile(userId);
  const profilePosts = usePublicProfilePosts(userId);

  useEffect(() => {
    if (refreshKey <= 0) return;

    queueMicrotask(() => {
      void retry();
    });
  }, [refreshKey, retry]);

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

  useEffect(() => {
    if (!isOwnProfile) return;

    let cancelled = false;

    void fetchUserBikes()
      .then((bikes) => {
        if (!cancelled) setBikeCount(bikes.length);
      })
      .catch(() => {
        if (!cancelled) setBikeCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, refreshKey]);

  const handleToggleFollow = async () => {
    if (isFollowLoading || !profile || profile.followStatus === "pending") return;

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
  const isFollowPending = profile?.followStatus === "pending";
  const followButtonLabel = profile?.isFollowing
    ? "Seguindo"
    : isFollowPending
      ? "Pedido feito"
      : "Seguir";
  const followButtonIcon = profile?.isFollowing
    ? "checkmark"
    : isFollowPending
      ? "time-outline"
      : "person-add-outline";

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

  const openUserProfile = (targetUserId: string) => {
    void getCurrentUserId().then((currentUserId) => {
      if (currentUserId === targetUserId) {
        router.push("/profile");
        return;
      }

      router.push({ pathname: "/users/[userId]", params: { userId: targetUserId } });
    });
  };

  return (
    <View style={styles.screen}>
      {isOwnProfile ? (
        <View style={styles.ownHeader}>
          <Text numberOfLines={1} style={styles.ownHeaderTitle}>
            Minha área
          </Text>
          <Pressable
            accessibilityLabel="Configurações do perfil"
            accessibilityRole="button"
            style={styles.settingsButton}
            onPress={onOpenSettings}
          >
            <Ionicons color="#6B7280" name="settings-outline" size={20} />
          </Pressable>
        </View>
      ) : (
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
      )}

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
          onScroll={({ nativeEvent }) => {
            const distanceToBottom =
              nativeEvent.contentSize.height -
              nativeEvent.layoutMeasurement.height -
              nativeEvent.contentOffset.y;

            if (distanceToBottom < 180) {
              void profilePosts.loadMore();
            }
          }}
          scrollEventThrottle={400}
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
            {profile.email ? (
              <View style={styles.contactRow}>
                <Ionicons color="#6B7280" name="mail-outline" size={14} />
                <Text style={styles.contactText}>{profile.email}</Text>
              </View>
            ) : null}
            {profile.phone ? (
              <View style={styles.contactRow}>
                <Ionicons color="#6B7280" name="call-outline" size={14} />
                <Text style={styles.contactText}>{formatPhone(profile.phone)}</Text>
              </View>
            ) : null}
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.statsRow}>
              <ProfileStat label="posts" value={profile.postsCount} />
              <ProfileStat
                label="seguidores"
                value={profile.followersCount}
                onPress={() =>
                  router.push({
                    pathname: "/users/[userId]/follows",
                    params: { initialTab: "followers", userId: profile.id },
                  })
                }
              />
              <ProfileStat
                label="seguindo"
                value={profile.followingCount}
                onPress={() =>
                  router.push({
                    pathname: "/users/[userId]/follows",
                    params: { initialTab: "following", userId: profile.id },
                  })
                }
              />
            </View>
          </View>

          {isOwnProfile ? (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.messageButton]}
                onPress={onEditProfile}
              >
                <Ionicons color={colors.brandDark} name="create-outline" size={16} />
                <Text style={styles.actionText}>Editar perfil</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <Pressable
                style={[
                  styles.actionButton,
                  profile.isFollowing || isFollowPending
                    ? styles.followingButton
                    : styles.followButton,
                  isFollowLoading && styles.actionButtonDisabled,
                ]}
                disabled={isFollowLoading || isFollowPending}
                onPress={() => void handleToggleFollow()}
              >
                <Ionicons
                  color={colors.brandDark}
                  name={followButtonIcon}
                  size={16}
                />
                <Text style={styles.actionText}>{followButtonLabel}</Text>
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
          )}

          {isOwnProfile ? (
            <ProfileStatsBar
              bikeCount={bikeCount}
              eventsCreatedCount={profile.eventsCreatedCount}
              favoriteCount={profile.eventFavoritesCount}
              onFavoritesPress={() => router.push("/profile/favorites")}
              onEventsPress={() =>
                router.push({
                  pathname: "/users/[userId]/events",
                  params: { avatarUrl: profile.avatar ?? "", userId: profile.id },
                })
              }
              onGaragePress={() => router.push("/profile/bikes")}
            />
          ) : null}

          {profile.canViewPrivateContent ? (
            <PublicProfileTabsGrid
              isLoading={profilePosts.isLoading}
              posts={profilePosts.posts}
              onPostPress={setPostsViewerIndex}
            />
          ) : (
            <PrivateProfileNotice />
          )}
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

      <PublicProfilePostsViewer
        commentsLoadingByPost={profilePosts.commentsLoadingByPost}
        hasMore={profilePosts.hasMore}
        initialIndex={postsViewerIndex ?? 0}
        isLoadingMore={profilePosts.isLoadingMore}
        posts={profilePosts.posts}
        visible={postsViewerIndex !== null}
        onAddComment={profilePosts.addComment}
        onAddReply={profilePosts.addReply}
        onClose={() => setPostsViewerIndex(null)}
        onDeleteComment={profilePosts.deleteComment}
        onEditComment={profilePosts.editComment}
        onLoadComments={profilePosts.loadComments}
        onLoadMore={profilePosts.loadMore}
        onOpenShare={profilePosts.openShare}
        onOpenUserProfile={openUserProfile}
        onToggleCommentLike={profilePosts.toggleCommentLike}
        onToggleLike={profilePosts.toggleLike}
      />

      <SharePostSheet
        friends={profilePosts.friends}
        post={profilePosts.sharePost}
        sentFriendId={profilePosts.sentFriendId}
        onClose={profilePosts.closeShare}
        onSent={(result) => {
          profilePosts.closeShare();
          setPostsViewerIndex(null);
          router.push({
            pathname: "/messages/[conversationId]",
            params: {
              conversationId: result.conversationId,
              participantAvatar: result.participantAvatar ?? "",
              participantName: result.participantName,
            },
          });
        }}
        onSendToFriend={profilePosts.shareToFriend}
      />
    </View>
  );
}

function PrivateProfileNotice() {
  return (
    <View style={styles.privateNotice}>
      <Ionicons color="#9CA3AF" name="lock-closed-outline" size={34} />
      <Text style={styles.privateNoticeTitle}>Esta conta é privada</Text>
      <Text style={styles.privateNoticeText}>
        Siga este perfil para ver posts, lugares e eventos.
      </Text>
    </View>
  );
}

function ProfileStatsBar({
  bikeCount,
  eventsCreatedCount,
  favoriteCount,
  onFavoritesPress,
  onEventsPress,
  onGaragePress,
}: {
  bikeCount: number;
  eventsCreatedCount: number;
  favoriteCount: number;
  onFavoritesPress: () => void;
  onEventsPress: () => void;
  onGaragePress: () => void;
}) {
  return (
    <View style={styles.shortcutWrap}>
      <View style={styles.shortcutCard}>
        <ProfileShortcut
          icon="heart-outline"
          label="Favoritos"
          value={favoriteCount}
          onPress={onFavoritesPress}
        />
        <View style={styles.shortcutDivider} />
        <ProfileShortcut
          icon="calendar-outline"
          label="Eventos"
          value={eventsCreatedCount}
          onPress={onEventsPress}
        />
        <View style={styles.shortcutDivider} />
        <ProfileShortcut
          icon="bicycle-outline"
          label="Garagem"
          value={bikeCount}
          onPress={onGaragePress}
        />
      </View>
    </View>
  );
}

function ProfileShortcut({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons color={colors.brandPrimary} name={icon} size={18} />
      <Text style={styles.shortcutValue}>{value}</Text>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.shortcutItem} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.shortcutItem}>{content}</View>;
}

function ProfileStat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  const Content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.statItem} onPress={onPress}>
        {Content}
      </Pressable>
    );
  }

  return (
    <View style={styles.statItem}>
      {Content}
    </View>
  );
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
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
  backButtonHidden: {
    opacity: 0,
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
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  contactText: {
    color: "#6B7280",
    fontSize: 13,
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
  ownHeader: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  ownHeaderTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 20,
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
  privateNotice: {
    alignItems: "center",
    paddingHorizontal: 36,
    paddingVertical: 34,
  },
  privateNoticeText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  privateNoticeTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  shortcutCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 1,
    padding: 8,
  },
  shortcutDivider: {
    backgroundColor: "#F3F4F6",
    width: 1,
  },
  shortcutItem: {
    alignItems: "center",
    flex: 1,
    minWidth: 80,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  shortcutLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  shortcutValue: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  shortcutWrap: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  settingsButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
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

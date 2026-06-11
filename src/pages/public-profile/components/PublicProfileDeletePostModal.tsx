import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { FeedPost } from "@/pages/home/types/feed.types";
import { colors } from "@/theme/colors";

type PublicProfileDeletePostModalProps = {
  displayHandle: string;
  isDeleting: boolean;
  post: FeedPost | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function PublicProfileDeletePostModal({
  displayHandle,
  isDeleting,
  post,
  onClose,
  onConfirm,
}: PublicProfileDeletePostModalProps) {
  const insets = useSafeAreaInsets();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const videoThumbnail = post?.media?.find((item) => item.mediaType === "video")
    ?.thumbnailUrl;
  const image =
    post?.media?.find((item) => item.mediaType === "image")?.url ??
    videoThumbnail ??
    post?.photos?.[0] ??
    post?.eventImage;
  const hasVideo = post?.media?.some((item) => item.mediaType === "video") ?? false;
  const label = post?.caption || post?.eventTitle || post?.routeTitle;

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent
      visible={Boolean(post)}
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable
          disabled={isDeleting}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={styles.contentWrap}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Post</Text>
                <Text numberOfLines={1} style={styles.headerSubtitle}>
                  {displayHandle}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Fechar post"
                accessibilityRole="button"
                disabled={isDeleting}
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons color="#9CA3AF" name="close" size={22} />
              </Pressable>
            </View>

            <View style={styles.mediaWrap}>
              {image && !hasImageError ? (
                <Image
                  source={{ uri: image }}
                  style={styles.media}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  onError={() => setHasImageError(true)}
                />
              ) : (
                <View style={styles.mediaFallback}>
                  <Ionicons color="#9CA3AF" name="image-outline" size={34} />
                </View>
              )}

              {hasVideo ? (
                <View style={styles.videoBadge}>
                  <Ionicons color="#FFFFFF" name="play" size={18} />
                </View>
              ) : null}

              {label ? (
                <View style={styles.labelBadge}>
                  <Text numberOfLines={1} style={styles.labelText}>
                    {label}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.actionsWrap, { paddingBottom: insets.bottom + 16 }]}>
              {confirmingDelete ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmTitle}>Excluir este post?</Text>
                  <Text style={styles.confirmDescription}>
                    Essa ação remove o post do seu perfil e não pode ser desfeita.
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isDeleting}
                      style={[styles.confirmButton, styles.cancelButton]}
                      onPress={() => setConfirmingDelete(false)}
                    >
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isDeleting}
                      style={[styles.confirmButton, styles.deleteButton]}
                      onPress={onConfirm}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.deleteText}>Excluir</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  style={styles.openConfirmButton}
                  onPress={() => setConfirmingDelete(true)}
                >
                  <Ionicons color="#DC2626" name="trash-outline" size={18} />
                  <Text style={styles.openConfirmText}>Excluir post</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backdrop: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  backdropWrap: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  cancelText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  confirmBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  confirmDescription: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  confirmTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
  },
  contentWrap: {
    alignSelf: "center",
    maxWidth: 390,
    width: "100%",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
  },
  labelBadge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    bottom: 12,
    left: 12,
    maxWidth: "80%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  media: {
    aspectRatio: 1,
    width: "100%",
  },
  mediaFallback: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    width: "100%",
  },
  mediaWrap: {
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  openConfirmButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
  },
  openConfirmText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  videoBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 40,
  },
});

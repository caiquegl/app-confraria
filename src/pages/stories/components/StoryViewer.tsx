import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";
import { formatRelativeTime } from "@/pages/home/services/feed.service";

import { StoryOwnerOptionsSheet } from "./StoryOwnerOptionsSheet";
import type { StoryGroup, StoryItem } from "../types/stories.types";

const STORY_DURATION_MS = 5000;
const MAX_VIDEO_DURATION_MS = 30000;

type StoryOverlay = "none" | "sheet" | "deleting";

type StoryViewerProps = {
  groups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
  visible: boolean;
  onClose: () => void;
  onDeleteStory?: (story: StoryItem) => Promise<void>;
  onOpenViewers: (story: StoryItem) => void;
  onStoryVisible: (story: StoryItem) => void;
  onToggleLike: (story: StoryItem) => void;
};

export function StoryViewer({
  groups,
  initialGroupIndex,
  initialStoryIndex = 0,
  visible,
  onClose,
  onDeleteStory,
  onOpenViewers,
  onStoryVisible,
  onToggleLike,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const progress = useMemo(() => new Animated.Value(0), []);
  const didLongPressRef = useRef(false);
  const deleteAbortRef = useRef<AbortController | null>(null);
  const progressValueRef = useRef(0);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [loadedStoryId, setLoadedStoryId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [overlay, setOverlay] = useState<StoryOverlay>("none");
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);

  const group = groups[groupIndex];
  const clampedStoryIndex = useMemo(() => {
    if (!group || group.stories.length === 0) return 0;
    return Math.min(storyIndex, group.stories.length - 1);
  }, [group, storyIndex]);
  const story = group?.stories[clampedStoryIndex];
  const isOverlayOpen = overlay !== "none";
  const isPlaybackPaused = isPaused || isOverlayOpen;
  const isStoryLoaded = Boolean(story && loadedStoryId === story.id);
  const storyDurationMs =
    story?.mediaType === "video"
      ? Math.min(story.durationMs ?? MAX_VIDEO_DURATION_MS, MAX_VIDEO_DURATION_MS)
      : STORY_DURATION_MS;

  const goNext = useCallback(() => {
    const currentGroup = groups[groupIndex];
    if (!currentGroup) {
      onClose();
      return;
    }

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((current) => current + 1);
      return;
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((current) => current + 1);
      setStoryIndex(0);
      return;
    }

    onClose();
  }, [groupIndex, groups, onClose, storyIndex]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((current) => current - 1);
      return;
    }

    if (groupIndex > 0) {
      const previousGroup = groups[groupIndex - 1];
      setGroupIndex((current) => current - 1);
      setStoryIndex(Math.max(0, (previousGroup?.stories.length ?? 1) - 1));
    }
  }, [groupIndex, groups, storyIndex]);

  const startProgressAnimation = useCallback(
    (fromValue: number) => {
      progress.stopAnimation();
      progress.setValue(fromValue);

      const remainingDuration = Math.max(
        0,
        storyDurationMs * (1 - fromValue),
      );

      const animation = Animated.timing(progress, {
        duration: remainingDuration,
        toValue: 1,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished) goNext();
      });

      return animation;
    },
    [goNext, progress, storyDurationMs],
  );

  const pauseProgress = useCallback(() => {
    didLongPressRef.current = true;
    setIsPaused(true);
    progress.stopAnimation((value) => {
      progressValueRef.current = value;
    });
  }, [progress]);

  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    startProgressAnimation(progressValueRef.current);
  }, [startProgressAnimation]);

  const handlePressPrevious = useCallback(() => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }

    goPrev();
  }, [goPrev]);

  const handlePressNext = useCallback(() => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }

    goNext();
  }, [goNext]);

  const handleCancelOverlay = useCallback(() => {
    deleteAbortRef.current?.abort();
    deleteAbortRef.current = null;
    setOverlay("none");
  }, []);

  const handleRequestDelete = useCallback(async () => {
    if (!story || !onDeleteStory) return;

    setOverlay("deleting");
    const controller = new AbortController();
    deleteAbortRef.current = controller;

    try {
      await onDeleteStory(story);
      if (controller.signal.aborted) return;
      setOverlay("none");
    } catch {
      if (controller.signal.aborted) return;
      setOverlay("sheet");
    } finally {
      if (deleteAbortRef.current === controller) {
        deleteAbortRef.current = null;
      }
    }
  }, [onDeleteStory, story]);

  useEffect(() => {
    if (!visible) {
      deleteAbortRef.current?.abort();
      deleteAbortRef.current = null;
      queueMicrotask(() => {
        setOverlay("none");
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const currentGroup = groups[groupIndex];
    if (!currentGroup || currentGroup.stories.length === 0) {
      queueMicrotask(() => {
        onClose();
      });
    }
  }, [groupIndex, groups, onClose, visible]);

  useEffect(() => {
    if (!visible || !story) return;

    onStoryVisible(story);
    progressValueRef.current = 0;
    progress.setValue(0);
    queueMicrotask(() => {
      setOverlay("none");
    });
  }, [onStoryVisible, progress, story, visible]);

  useEffect(() => {
    if (!visible || !story || !isStoryLoaded) return;

    if (isPlaybackPaused) {
      progress.stopAnimation((value) => {
        progressValueRef.current = value;
      });
      return;
    }

    const animation = startProgressAnimation(progressValueRef.current);

    return () => animation.stop();
  }, [isPlaybackPaused, isStoryLoaded, startProgressAnimation, story, visible]);

  if (!visible || !group || !story) return null;

  return (
    <Modal animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.screen}>
        <StoryMedia
          isPaused={isPlaybackPaused}
          story={story}
          onLoaded={() => setLoadedStoryId(story.id)}
        />
        <View style={styles.overlay} />

        {!isStoryLoaded && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        )}

        <View style={[styles.progressRow, { paddingTop: insets.top + 10 }]}>
          {group.stories.map((item, index) => (
            <View key={item.id} style={styles.progressTrack}>
              {index < clampedStoryIndex ? (
                <View style={styles.progressFull} />
              ) : index === clampedStoryIndex ? (
                <Animated.View
                  style={[
                    styles.progressFull,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <UserAvatar avatarUrl={story.userAvatar} name={story.userName} size={36} />
          <Text style={styles.userName}>{story.userName}</Text>
          <Text style={styles.timeText}>{formatRelativeTime(story.createdAt)}</Text>
          <View style={styles.headerActions}>
            {story.isMine && onDeleteStory && (
              <Pressable
                accessibilityLabel="Opções do story"
                hitSlop={8}
                style={styles.headerActionButton}
                onPress={() => setOverlay("sheet")}
              >
                <Ionicons color="#FFFFFF" name="ellipsis-horizontal" size={24} />
              </Pressable>
            )}
            <Pressable
              accessibilityLabel="Fechar story"
              hitSlop={8}
              style={styles.headerActionButton}
              onPress={onClose}
            >
              <Ionicons color="#FFFFFF" name="close" size={26} />
            </Pressable>
          </View>
        </View>

        {!isOverlayOpen && (
          <>
            <Pressable
              accessibilityLabel="Story anterior"
              style={styles.prevZone}
              onLongPress={pauseProgress}
              onPress={handlePressPrevious}
              onPressOut={resumeProgress}
            />
            <Pressable
              accessibilityLabel="Próximo story"
              style={styles.nextZone}
              onLongPress={pauseProgress}
              onPress={handlePressNext}
              onPressOut={resumeProgress}
            />
          </>
        )}

        {story.isMine && (
          <Pressable
            accessibilityLabel="Ver visualizações do story"
            style={[styles.viewersButton, { bottom: Math.max(insets.bottom, 16) }]}
            onPress={() => onOpenViewers(story)}
          >
            <Ionicons color="#FFFFFF" name="eye-outline" size={18} />
            <Text style={styles.viewersText}>{story.viewerCount} visualizações</Text>
          </Pressable>
        )}

        {!story.isMine && (
          <Pressable
            accessibilityLabel={story.isLiked ? "Descurtir story" : "Curtir story"}
            style={[styles.likeButton, { bottom: Math.max(insets.bottom, 16) }]}
            onPress={() => onToggleLike(story)}
          >
            <Ionicons
              color={story.isLiked ? "#EF4444" : "#FFFFFF"}
              name={story.isLiked ? "heart" : "heart-outline"}
              size={26}
            />
            <Text style={styles.likeText}>{story.likeCount}</Text>
          </Pressable>
        )}

        <StoryOwnerOptionsSheet
          visible={overlay === "sheet"}
          onCancel={handleCancelOverlay}
          onDelete={() => void handleRequestDelete()}
        />

        {overlay === "deleting" && (
          <View style={styles.deletingOverlay}>
            <View style={styles.deletingContent}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <Text style={styles.deletingText}>Apagando story…</Text>
            </View>
            <Pressable style={styles.deletingCancelButton} onPress={handleCancelOverlay}>
              <Text style={styles.deletingCancelText}>Cancelar carregamento</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

function StoryMedia({
  isPaused,
  story,
  onLoaded,
}: {
  isPaused: boolean;
  story: StoryItem;
  onLoaded: () => void;
}) {
  if (story.mediaType === "video") {
    return (
      <StoryVideo
        key={story.id}
        isPaused={isPaused}
        uri={story.image}
        onLoaded={onLoaded}
      />
    );
  }

  return (
    <View style={styles.image}>
      <Image
        source={{ uri: story.image }}
        style={styles.mediaFill}
        cachePolicy="memory-disk"
        contentFit="cover"
        recyclingKey={story.image}
        onLoad={onLoaded}
      />
      <StoryOverlays overlays={story.overlays ?? []} />
    </View>
  );
}

function StoryOverlays({ overlays }: { overlays: StoryItem["overlays"] }) {
  if (!overlays || overlays.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.mediaFill}>
      {overlays.map((overlay, index) => (
        <Image
          key={`${overlay.imageUrl}-${index}`}
          source={{ uri: overlay.imageUrl }}
          style={[
            styles.storyStickerOverlay,
            {
              left: `${overlay.xRatio * 100}%`,
              top: `${overlay.yRatio * 100}%`,
              width: `${overlay.sizeRatio * 100}%`,
            },
          ]}
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={overlay.imageUrl}
        />
      ))}
    </View>
  );
}

function StoryVideo({
  isPaused,
  uri,
  onLoaded,
}: {
  isPaused: boolean;
  uri: string;
  onLoaded: () => void;
}) {
  const player = useVideoPlayer({ uri, useCaching: true }, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    if (isPaused) {
      player.pause();
      return;
    }

    player.play();
  }, [isPaused, player]);

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.image}
      onFirstFrameRender={onLoaded}
    />
  );
}

const styles = StyleSheet.create({
  deletingCancelButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  deletingCancelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  deletingContent: {
    alignItems: "center",
    gap: 12,
  },
  deletingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    bottom: 0,
    gap: 24,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 32,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  deletingText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  headerActionButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
    marginLeft: "auto",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    position: "relative",
    zIndex: 3,
  },
  image: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  mediaFill: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  likeButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    zIndex: 4,
  },
  likeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  nextZone: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "66%",
    zIndex: 2,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  prevZone: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: "34%",
    zIndex: 2,
  },
  progressFull: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: "100%",
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    position: "relative",
    zIndex: 3,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    flex: 1,
    height: 3,
    overflow: "hidden",
  },
  screen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  storyStickerOverlay: {
    aspectRatio: 1,
    position: "absolute",
  },
  timeText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  viewersButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    zIndex: 4,
  },
  viewersText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

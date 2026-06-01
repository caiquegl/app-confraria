import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar } from "@/components/UserAvatar";

import type { StoryGroup, StoryItem } from "../types/stories.types";

const STORY_DURATION_MS = 5000;

type StoryViewerProps = {
  groups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
  visible: boolean;
  onClose: () => void;
  onOpenViewers: (story: StoryItem) => void;
  onStoryVisible: (story: StoryItem) => void;
};

export function StoryViewer({
  groups,
  initialGroupIndex,
  initialStoryIndex = 0,
  visible,
  onClose,
  onOpenViewers,
  onStoryVisible,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const progress = useMemo(() => new Animated.Value(0), []);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

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

  useEffect(() => {
    if (!visible || !story) return;

    onStoryVisible(story);
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      duration: STORY_DURATION_MS,
      toValue: 1,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) goNext();
    });

    return () => animation.stop();
  }, [goNext, onStoryVisible, progress, story, visible]);

  if (!visible || !group || !story) return null;

  return (
    <Modal animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.screen}>
        <Image source={{ uri: story.image }} style={styles.image} contentFit="cover" />
        <View style={styles.overlay} />

        <View style={[styles.progressRow, { paddingTop: insets.top + 10 }]}>
          {group.stories.map((item, index) => (
            <View key={item.id} style={styles.progressTrack}>
              {index < storyIndex ? (
                <View style={styles.progressFull} />
              ) : index === storyIndex ? (
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
          <Text style={styles.timeText}>agora</Text>
          <Pressable
            accessibilityLabel="Fechar story"
            hitSlop={8}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons color="#FFFFFF" name="close" size={26} />
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Story anterior"
          style={styles.prevZone}
          onPress={goPrev}
        />
        <Pressable
          accessibilityLabel="Próximo story"
          style={styles.nextZone}
          onPress={goNext}
        />

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    marginLeft: "auto",
    padding: 4,
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

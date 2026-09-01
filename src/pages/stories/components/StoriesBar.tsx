import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { StoryGroup } from "../types/stories.types";

type StoriesBarProps = {
  currentUser: {
    userName: string;
    userAvatar: string | null;
  } | null;
  isUploading?: boolean;
  myStoryGroup: StoryGroup | null;
  stories: StoryGroup[];
  onAddStory: () => void;
  onOpenMyStories: () => void;
  onOpenSearch: () => void;
  onOpenStory: (index: number) => void;
};

export function StoriesBar({
  currentUser,
  isUploading = false,
  myStoryGroup,
  stories,
  onAddStory,
  onOpenMyStories,
  onOpenSearch,
  onOpenStory,
}: StoriesBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (!currentUser) return null;

  const hasMyStory = Boolean(myStoryGroup?.stories.length);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
        <Pressable
          accessibilityLabel={hasMyStory ? "Ver seu story" : "Adicionar seu story"}
          accessibilityRole="button"
          style={styles.storyButton}
          disabled={isUploading}
          onPress={hasMyStory ? onOpenMyStories : onAddStory}
        >
          <View style={[styles.myStoryRing, hasMyStory && styles.activeStoryRing]}>
            <UserAvatar
              avatarUrl={currentUser.userAvatar}
              name={currentUser.userName}
              size={60}
            />
          </View>
          <Pressable
            accessibilityLabel="Adicionar novo story"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.addBadge}
            disabled={isUploading}
            onPress={(event) => {
              event.stopPropagation();
              onAddStory();
            }}
          >
            <Ionicons color={colors.text.onBrand} name="add" size={13} />
          </Pressable>
          <Text numberOfLines={1} style={styles.storyLabel}>
            Seu story
          </Text>
        </Pressable>

        {stories.map((storyGroup, index) => {
          const hasUnseenStory = storyGroup.stories.some((story) => !story.viewed);

          return (
            <Pressable
              key={storyGroup.userId}
              accessibilityLabel={`Ver story de ${storyGroup.userName}`}
              accessibilityRole="button"
              style={styles.storyButton}
              onPress={() => onOpenStory(index)}
            >
              <View style={[styles.storyRing, hasUnseenStory && styles.activeStoryRing]}>
                <UserAvatar
                  avatarUrl={storyGroup.userAvatar}
                  name={storyGroup.userName}
                  size={60}
                />
              </View>
              <Text numberOfLines={1} style={styles.storyLabel}>
                {storyGroup.userName}
              </Text>
            </Pressable>
          );
        })}
        </ScrollView>

        <Pressable
          accessibilityLabel="Buscar perfis"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.searchButton}
          onPress={onOpenSearch}
        >
          <Ionicons color={colors.text.secondary} name="search-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  activeStoryRing: {
    borderColor: colors.brandGreen,
    borderStyle: "solid",
  },
  addBadge: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 18,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    width: 22,
  },
  container: {
    marginBottom: 14,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    marginTop: 12,
    width: 44,
  },
  myStoryRing: {
    alignItems: "center",
    borderColor: colors.border.brand,
    borderRadius: 999,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  storyRing: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  scrollContent: {
    gap: 14,
    paddingHorizontal: 2,
  },
  storyButton: {
    alignItems: "center",
    position: "relative",
    width: 72,
  },
  storyLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
    width: "100%",
  },
});

import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";

import {
  createStory,
  fetchStoriesFeed,
  fetchStoryViewers,
  markStoryViewed,
} from "../services/stories.service";
import type {
  StoriesFeed,
  StoryGroup,
  StoryItem,
  StoryViewerUser,
} from "../types/stories.types";

type StoryViewerState = {
  groups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
} | null;

export function useStories() {
  const [feed, setFeed] = useState<StoriesFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerState, setViewerState] = useState<StoryViewerState>(null);
  const [viewersStory, setViewersStory] = useState<StoryItem | null>(null);
  const [viewers, setViewers] = useState<StoryViewerUser[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const currentUser = feed?.currentUser ?? null;
  const groups = useMemo(() => feed?.groups ?? [], [feed?.groups]);
  const myStoryGroup = groups.find((group) => group.isMine) ?? null;
  const otherStoryGroups = groups.filter((group) => !group.isMine);

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStoriesFeed();
      setFeed(data);
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar stories",
        text2: "Não foi possível buscar os stories.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  const addStory = useCallback(async (uri: string) => {
    if (isUploading) return false;

    setIsUploading(true);
    try {
      await createStory(uri);
      await loadStories();
      return true;
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao publicar story",
        text2:
          error instanceof Error
            ? error.message
            : "Não foi possível publicar o story.",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, loadStories]);

  const openMyStories = useCallback(() => {
    if (!myStoryGroup) return;

    setViewerState({
      groups: [myStoryGroup],
      initialGroupIndex: 0,
    });
  }, [myStoryGroup]);

  const openStoryGroup = useCallback(
    (groupIndex: number) => {
      setViewerState({
        groups: otherStoryGroups,
        initialGroupIndex: groupIndex,
      });
    },
    [otherStoryGroups],
  );

  const closeStoryViewer = useCallback(() => {
    setViewerState(null);
  }, []);

  const markAsViewed = useCallback(async (story: StoryItem) => {
    if (story.isMine || story.viewed) return;

    setFeed((current) =>
      current
        ? {
            ...current,
            groups: current.groups.map((group) => ({
              ...group,
              stories: group.stories.map((item) =>
                item.id === story.id ? { ...item, viewed: true } : item,
              ),
            })),
          }
        : current,
    );

    try {
      await markStoryViewed(story.id);
    } catch {
      // A failed view marker should not interrupt story playback.
    }
  }, []);

  const openViewers = useCallback(async (story: StoryItem) => {
    if (!story.isMine) return;

    setViewersStory(story);
    setIsLoadingViewers(true);
    try {
      const data = await fetchStoryViewers(story.id);
      setViewers(data);
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar visualizações",
        text2: "Não foi possível buscar quem viu este story.",
      });
    } finally {
      setIsLoadingViewers(false);
    }
  }, []);

  const closeViewers = useCallback(() => {
    setViewersStory(null);
    setViewers([]);
  }, []);

  return {
    addStory,
    closeStoryViewer,
    closeViewers,
    currentUser,
    groups,
    isLoading,
    isLoadingViewers,
    isUploading,
    loadStories,
    markAsViewed,
    myStoryGroup,
    openMyStories,
    openStoryGroup,
    openViewers,
    otherStoryGroups,
    viewerState,
    viewers,
    viewersStory,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";

import {
  createStory,
  deleteStory as deleteStoryRequest,
  fetchStoriesFeed,
  fetchStoryViewers,
  markStoryViewed,
  toggleStoryLike,
} from "../services/stories.service";
import type {
  StoriesFeed,
  StoryGroup,
  StoryItem,
  StoryDraftMedia,
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
    queueMicrotask(() => {
      void loadStories();
    });
  }, [loadStories]);

  const addStory = useCallback(async (media: StoryDraftMedia) => {
    if (isUploading) return false;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await createStory(media, setUploadProgress);
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
      setUploadProgress(0);
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

  const updateStory = useCallback(
    (storyId: string, patch: Partial<StoryItem>) => {
      setFeed((current) =>
        current
          ? {
              ...current,
              groups: current.groups.map((group) => ({
                ...group,
                stories: group.stories.map((item) =>
                  item.id === storyId ? { ...item, ...patch } : item,
                ),
              })),
            }
          : current,
      );

      setViewerState((current) =>
        current
          ? {
              ...current,
              groups: current.groups.map((group) => ({
                ...group,
                stories: group.stories.map((item) =>
                  item.id === storyId ? { ...item, ...patch } : item,
                ),
              })),
            }
          : current,
      );

      setViewersStory((current) =>
        current?.id === storyId ? { ...current, ...patch } : current,
      );
    },
    [],
  );

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

  const toggleLike = useCallback(
    async (story: StoryItem) => {
      if (story.isMine) return;

      const optimisticPatch = {
        isLiked: !story.isLiked,
        likeCount: Math.max(0, story.likeCount + (story.isLiked ? -1 : 1)),
      };
      updateStory(story.id, optimisticPatch);

      try {
        const result = await toggleStoryLike(story.id);
        updateStory(story.id, {
          isLiked: result.liked,
          likeCount: result.likeCount,
        });
      } catch {
        updateStory(story.id, {
          isLiked: story.isLiked,
          likeCount: story.likeCount,
        });
        Toast.show({
          type: "error",
          text1: "Erro ao curtir story",
          text2: "Não foi possível atualizar sua curtida.",
        });
      }
    },
    [updateStory],
  );

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

  const removeStoryFromState = useCallback((storyId: string) => {
    const filterGroups = (items: StoryGroup[]) =>
      items
        .map((group) => ({
          ...group,
          stories: group.stories.filter((item) => item.id !== storyId),
        }))
        .filter((group) => group.stories.length > 0);

    setFeed((current) =>
      current
        ? {
            ...current,
            groups: filterGroups(current.groups),
          }
        : current,
    );

    setViewerState((current) => {
      if (!current) return current;

      const nextGroups = filterGroups(current.groups);
      if (nextGroups.length === 0) return null;

      return {
        ...current,
        groups: nextGroups,
      };
    });

    setViewersStory((current) => (current?.id === storyId ? null : current));
  }, []);

  const deleteStory = useCallback(
    async (story: StoryItem) => {
      if (!story.isMine) return;

      try {
        await deleteStoryRequest(story.id);
        removeStoryFromState(story.id);
      } catch {
        Toast.show({
          type: "error",
          text1: "Erro ao apagar story",
          text2: "Não foi possível apagar este story.",
        });
        throw new Error("Failed to delete story");
      }
    },
    [removeStoryFromState],
  );

  return {
    addStory,
    closeStoryViewer,
    closeViewers,
    currentUser,
    deleteStory,
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
    toggleLike,
    uploadProgress,
    viewerState,
    viewers,
    viewersStory,
  };
}

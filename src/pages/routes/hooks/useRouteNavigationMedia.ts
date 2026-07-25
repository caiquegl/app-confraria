import * as Location from "expo-location";
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

import { fetchOwnProfile } from "@/pages/profile/services/profile.service";
import { createFeedPost } from "@/pages/home/services/feed.service";
import type {
  ComposeAudience,
  ComposeFeedMedia,
} from "@/pages/home/types/feed.types";
import { useStories } from "@/pages/stories/business/useStories";
import type { StoryDraftMedia } from "@/pages/stories/types/stories.types";

import { createRoutePhoto } from "../services/routes.service";
import type { RoutePhoto } from "../types/route-photo.types";

type UseRouteNavigationMediaParams = {
  getCurrentCoords: () => { latitude: number; longitude: number } | null;
  onMapPhotoCreated?: (photo: RoutePhoto) => void;
  routeId: string;
};

export function useRouteNavigationMedia({
  getCurrentCoords,
  onMapPhotoCreated,
  routeId,
}: UseRouteNavigationMediaParams) {
  const stories = useStories();

  const [isMediaSheetVisible, setIsMediaSheetVisible] = useState(false);
  const [isStoryCameraOpen, setIsStoryCameraOpen] = useState(false);
  const [isStorySuccessVisible, setIsStorySuccessVisible] = useState(false);
  const [selectedStoryMedia, setSelectedStoryMedia] = useState<StoryDraftMedia | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMedia, setCameraMedia] = useState<ComposeFeedMedia[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposeFeedMedia[]>([]);
  const [composeCaption, setComposeCaption] = useState("");
  const [composeAudience, setComposeAudience] = useState<ComposeAudience>("all");
  const [isComposerRestrictedToFollowers, setIsComposerRestrictedToFollowers] =
    useState(false);
  const [composeActivePhotoIndex, setComposeActivePhotoIndex] = useState(0);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [postUploadProgress, setPostUploadProgress] = useState(0);
  const [isPostSuccessVisible, setIsPostSuccessVisible] = useState(false);

  const [isMapPinCameraOpen, setIsMapPinCameraOpen] = useState(false);
  const [isUploadingMapPin, setIsUploadingMapPin] = useState(false);

  const openMediaSheet = useCallback(() => {
    setIsMediaSheetVisible(true);
  }, []);

  const closeMediaSheet = useCallback(() => {
    setIsMediaSheetVisible(false);
  }, []);

  const openStoryCamera = useCallback(() => {
    setIsMediaSheetVisible(false);
    setSelectedStoryMedia(null);
    setIsStoryCameraOpen(true);
  }, []);

  const closeStoryCamera = useCallback(() => {
    setSelectedStoryMedia(null);
    setIsStoryCameraOpen(false);
  }, []);

  const publishStory = useCallback(
    (mediaOverride?: StoryDraftMedia) => {
      const storyMedia = mediaOverride ?? selectedStoryMedia;
      if (!storyMedia) return;

      void stories.addStory(storyMedia).then((published) => {
        if (published) {
          setSelectedStoryMedia(null);
          setIsStoryCameraOpen(false);
          setIsStorySuccessVisible(true);
        }
      });
    },
    [selectedStoryMedia, stories],
  );

  const openComposerWithMedia = useCallback(async (media: ComposeFeedMedia[]) => {
    if (media.length === 0) return;

    let restrictToFollowers = false;
    try {
      const profile = await fetchOwnProfile();
      restrictToFollowers = !profile.isPublicProfile;
    } catch {
      restrictToFollowers = false;
    }

    setComposerMedia(media);
    setComposeActivePhotoIndex(0);
    setComposeCaption("");
    setIsComposerRestrictedToFollowers(restrictToFollowers);
    setComposeAudience(restrictToFollowers ? "friends" : "all");
    setIsComposerOpen(true);
  }, []);

  const openFeedCamera = useCallback(() => {
    setIsMediaSheetVisible(false);
    setCameraMedia([]);
    setIsCameraOpen(true);
  }, []);

  const closeNewPostCamera = useCallback(() => {
    setCameraMedia([]);
    setIsCameraOpen(false);
  }, []);

  const addCameraMedia = useCallback((media: ComposeFeedMedia) => {
    setCameraMedia((prev) => [...prev, media]);
  }, []);

  const openComposerFromCamera = useCallback(() => {
    if (cameraMedia.length === 0) {
      Toast.show({
        type: "error",
        text1: "Nenhuma mídia",
        text2: "Capture ao menos uma mídia para avançar.",
      });
      return;
    }

    void openComposerWithMedia(cameraMedia);
    setCameraMedia([]);
    setIsCameraOpen(false);
  }, [cameraMedia, openComposerWithMedia]);

  const openComposerFromGallery = useCallback(
    (media: ComposeFeedMedia[]) => {
      void openComposerWithMedia(media);
      setCameraMedia([]);
      setIsCameraOpen(false);
    },
    [openComposerWithMedia],
  );

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false);
    setComposerMedia([]);
    setComposeCaption("");
    setIsComposerRestrictedToFollowers(false);
    setComposeAudience("all");
    setComposeActivePhotoIndex(0);
    setPostUploadProgress(0);
  }, []);

  const removeComposerPhoto = useCallback((index: number) => {
    setComposerMedia((prev) => {
      const next = prev.filter((_, photoIndex) => photoIndex !== index);

      if (next.length === 0) {
        setIsComposerOpen(false);
        setComposeCaption("");
        setIsComposerRestrictedToFollowers(false);
        setComposeAudience("all");
        setComposeActivePhotoIndex(0);
        return [];
      }

      setComposeActivePhotoIndex((current) => {
        if (current > next.length - 1) return next.length - 1;
        if (current > index) return current - 1;
        return current;
      });

      return next;
    });
  }, []);

  const reorderComposerPhotos = useCallback((fromIndex: number, toIndex: number) => {
    setComposerMedia((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      setComposeActivePhotoIndex((current) => {
        if (current === fromIndex) return toIndex;
        if (fromIndex < current && toIndex >= current) return current - 1;
        if (fromIndex > current && toIndex <= current) return current + 1;
        return current;
      });

      return next;
    });
  }, []);

  const publishPost = useCallback(async () => {
    if (composerMedia.length === 0) return;

    const caption = composeCaption.trim();
    if (!caption) {
      Toast.show({
        type: "error",
        text1: "Legenda obrigatória",
        text2: "Adicione uma legenda antes de compartilhar.",
      });
      return;
    }

    setIsPublishingPost(true);
    setPostUploadProgress(0);
    try {
      await createFeedPost({
        audience: composeAudience,
        caption,
        media: composerMedia,
        onUploadProgress: setPostUploadProgress,
      });
      closeComposer();
      setIsPostSuccessVisible(true);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : null) ??
        "Não foi possível publicar o post.";

      Toast.show({
        type: "error",
        text1: "Erro ao publicar",
        text2: message,
      });
    } finally {
      setIsPublishingPost(false);
      setPostUploadProgress(0);
    }
  }, [closeComposer, composeAudience, composeCaption, composerMedia]);

  const openMapPinCamera = useCallback(() => {
    setIsMediaSheetVisible(false);
    setIsMapPinCameraOpen(true);
  }, []);

  const closeMapPinCamera = useCallback(() => {
    if (isUploadingMapPin) return;
    setIsMapPinCameraOpen(false);
  }, [isUploadingMapPin]);

  const confirmMapPinPhoto = useCallback(
    async (imageUri: string) => {
      if (isUploadingMapPin) return;

      setIsUploadingMapPin(true);
      try {
        let coords = getCurrentCoords();
        if (!coords) {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!permission.granted) {
            throw new Error("Permita o acesso à localização para marcar no mapa.");
          }

          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        }

        const photo = await createRoutePhoto({
          imageUri,
          latitude: coords.latitude,
          longitude: coords.longitude,
          routeId,
        });

        onMapPhotoCreated?.(photo);
        setIsMapPinCameraOpen(false);
        Toast.show({
          type: "success",
          text1: "Foto marcada no mapa",
          text2: "Todos na navegação podem ver este ponto.",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Não foi possível salvar a foto no mapa.";
        Toast.show({
          type: "error",
          text1: "Erro ao marcar no mapa",
          text2: message,
        });
      } finally {
        setIsUploadingMapPin(false);
      }
    },
    [getCurrentCoords, isUploadingMapPin, onMapPhotoCreated, routeId],
  );

  return {
    addCameraMedia,
    cameraMedia,
    closeComposer,
    closeMapPinCamera,
    closeMediaSheet,
    closeNewPostCamera,
    closePostSuccess: () => setIsPostSuccessVisible(false),
    closeStoryCamera,
    closeStorySuccess: () => setIsStorySuccessVisible(false),
    composeActivePhotoIndex,
    composeAudience,
    composeCaption,
    composerMedia,
    confirmMapPinPhoto,
    isCameraOpen,
    isComposerOpen,
    isComposerRestrictedToFollowers,
    isMapPinCameraOpen,
    isMediaSheetVisible,
    isPostSuccessVisible,
    isPublishingPost,
    isStoryCameraOpen,
    isStorySuccessVisible,
    isStoryUploading: stories.isUploading,
    isUploadingMapPin,
    openComposerFromCamera,
    openComposerFromGallery,
    openFeedCamera,
    openMapPinCamera,
    openMediaSheet,
    openStoryCamera,
    postUploadProgress,
    publishPost,
    publishStory,
    removeComposerPhoto,
    reorderComposerPhotos,
    selectedStoryMedia,
    setComposeActivePhotoIndex,
    setComposeAudience,
    setComposeCaption,
    setSelectedStoryMedia,
    storyUploadProgress: stories.uploadProgress,
  };
}

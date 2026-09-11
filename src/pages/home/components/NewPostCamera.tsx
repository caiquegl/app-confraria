import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraType,
} from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import {
  formatRecordingTime,
  getFeedVideoDurationError,
  MAX_FEED_VIDEO_DURATION_MS,
  normalizeVideoDurationMs,
} from "@/lib/video-duration";
import { colors } from "@/theme/colors";

import { styles } from "./NewPostCamera.styles";
import type { ComposeFeedMedia } from "../types/feed.types";

const MAX_FEED_MEDIA = 10;
const MAX_VIDEO_FILE_SIZE = 80 * 1024 * 1024;

type CameraMode = "picture" | "video";

type NewPostCameraProps = {
  capturedMedia: ComposeFeedMedia[];
  onAddMedia: (media: ComposeFeedMedia) => void;
  onClose: () => void;
  onDone: () => void;
  onGallerySelected: (media: ComposeFeedMedia[]) => void;
  visible: boolean;
};

export function NewPostCamera({
  capturedMedia,
  onAddMedia,
  onClose,
  onDone,
  onGallerySelected,
  visible,
}: NewPostCameraProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const isRecordingRef = useRef(false);
  const shouldDiscardRef = useRef(false);
  const recordingSessionRef = useRef(0);
  const recordingStartedAtRef = useRef<number | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);

  const latestMedia = capturedMedia[capturedMedia.length - 1];
  const hasReachedMediaLimit = capturedMedia.length >= MAX_FEED_MEDIA;
  const isVideoMode = cameraMode === "video";

  const resetRecordingState = useCallback(() => {
    isRecordingRef.current = false;
    shouldDiscardRef.current = false;
    recordingStartedAtRef.current = null;
    setIsRecording(false);
    setRecordingElapsedMs(0);
  }, []);

  const stopRecording = useCallback((discard = false) => {
    if (!isRecordingRef.current) return;

    if (discard) {
      shouldDiscardRef.current = true;
    }

    try {
      cameraRef.current?.stopRecording();
    } catch {
      resetRecordingState();
    }
  }, [resetRecordingState]);

  const startRecording = useCallback(async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      isRecordingRef.current ||
      hasReachedMediaLimit
    ) {
      return;
    }

    const session = recordingSessionRef.current + 1;
    recordingSessionRef.current = session;
    shouldDiscardRef.current = false;
    isRecordingRef.current = true;
    recordingStartedAtRef.current = Date.now();
    setIsRecording(true);
    setRecordingElapsedMs(0);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_FEED_VIDEO_DURATION_MS / 1000,
        maxFileSize: MAX_VIDEO_FILE_SIZE,
      });

      if (
        shouldDiscardRef.current ||
        recordingSessionRef.current !== session ||
        !video?.uri
      ) {
        return;
      }

      const wallClockMs = recordingStartedAtRef.current
        ? Date.now() - recordingStartedAtRef.current
        : MAX_FEED_VIDEO_DURATION_MS;
      const durationMs = Math.min(
        Math.max(1, wallClockMs),
        MAX_FEED_VIDEO_DURATION_MS,
      );

      onAddMedia({
        durationMs,
        mediaType: "video",
        uri: video.uri,
      });
    } catch {
      if (!shouldDiscardRef.current) {
        Toast.show({
          type: "error",
          text1: "Erro na gravação",
          text2: "Não foi possível gravar o vídeo. Tente novamente.",
        });
      }
    } finally {
      if (recordingSessionRef.current === session) {
        resetRecordingState();
      }
    }
  }, [
    hasReachedMediaLimit,
    isCameraReady,
    isTakingPhoto,
    onAddMedia,
    resetRecordingState,
  ]);

  const handleTakePhoto = async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      isRecordingRef.current ||
      hasReachedMediaLimit
    ) {
      return;
    }

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo?.uri) {
        onAddMedia({ mediaType: "image", uri: photo.uri });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro na câmera",
        text2: "Não foi possível tirar a foto. Tente novamente.",
      });
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleOpenGallery = async () => {
    if (isRecordingRef.current) return;

    const remainingSlots = MAX_FEED_MEDIA - capturedMedia.length;
    if (remainingSlots <= 0) {
      Toast.show({
        type: "error",
        text1: "Limite atingido",
        text2: "Você pode adicionar até 10 mídias por post.",
      });
      return;
    }

    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!mediaPermission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para selecionar mídias.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images", "videos"],
      quality: 1,
      selectionLimit: remainingSlots,
      videoMaxDuration: MAX_FEED_VIDEO_DURATION_MS / 1000,
    });

    if (result.canceled) return;

    const selectedMedia: ComposeFeedMedia[] = [];
    for (const asset of result.assets.slice(0, remainingSlots)) {
      const isVideo = asset.type === "video";

      if (isVideo) {
        const durationMs = normalizeVideoDurationMs(asset.duration);
        const durationError = getFeedVideoDurationError(durationMs);
        if (durationError) {
          Toast.show({
            type: "error",
            text1: "Vídeo inválido",
            text2: durationError,
          });
          return;
        }

        selectedMedia.push({
          durationMs,
          mediaType: "video",
          uri: asset.uri,
        });
        continue;
      }

      selectedMedia.push({
        durationMs: null,
        mediaType: "image",
        uri: asset.uri,
      });
    }

    onGallerySelected([...capturedMedia, ...selectedMedia]);
  };

  const ensureMicrophonePermission = async () => {
    if (microphonePermission?.granted) return true;

    const status = await requestMicrophonePermission();
    if (!status.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso ao microfone para gravar vídeo.",
      });
      return false;
    }

    return true;
  };

  const handleCapturePress = async () => {
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    if (isTakingPhoto || !isCameraReady || hasReachedMediaLimit) return;

    if (!isVideoMode) {
      await handleTakePhoto();
      return;
    }

    const hasMic = await ensureMicrophonePermission();
    if (!hasMic) return;

    await startRecording();
  };

  const toggleCameraMode = () => {
    if (isRecordingRef.current || hasReachedMediaLimit) return;
    setCameraMode((current) => (current === "video" ? "picture" : "video"));
  };

  const toggleFacing = () => {
    if (isRecordingRef.current) return;
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleClose = () => {
    if (isRecordingRef.current) {
      stopRecording(true);
    }
    onClose();
  };

  useEffect(() => {
    if (visible) return;
    if (isRecordingRef.current) {
      stopRecording(true);
    }
    setIsCameraReady(false);
  }, [stopRecording, visible]);

  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return;
      if (isRecordingRef.current) {
        stopRecording(true);
      }
    });

    return () => subscription.remove();
  }, [stopRecording, visible]);

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;

      const elapsedMs = Math.min(Date.now() - startedAt, MAX_FEED_VIDEO_DURATION_MS);
      setRecordingElapsedMs(elapsedMs);

      if (elapsedMs >= MAX_FEED_VIDEO_DURATION_MS) {
        stopRecording();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRecording, stopRecording]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal animationType="slide" visible={visible} statusBarTranslucent>
        <View style={[styles.permissionScreen, { paddingTop: insets.top + 24 }]}>
          <Pressable style={styles.closePermission} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.brandDark} />
          </Pressable>

          <View style={styles.permissionContent}>
            <Ionicons name="camera-outline" size={48} color={colors.brandDark} />
            <Text style={styles.permissionTitle}>Permita acesso à câmera</Text>
            <Text style={styles.permissionText}>
              Para criar uma postagem, o Confraria precisa acessar sua câmera.
            </Text>
            <Button size="lg" style={styles.permissionButton} onPress={requestPermission}>
              Permitir câmera
            </Button>
          </View>
        </View>
      </Modal>
    );
  }

  const captureDisabled =
    isTakingPhoto || (!isCameraReady && !isRecording) || hasReachedMediaLimit;

  return (
    <Modal animationType="slide" visible={visible} statusBarTranslucent>
      <View style={styles.screen}>
        <CameraView
          ref={cameraRef}
          active={visible}
          facing={facing}
          mode={cameraMode}
          mute={false}
          style={styles.camera}
          videoQuality="1080p"
          onCameraReady={() => setIsCameraReady(true)}
        />

        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.iconButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text.inverse} />
          </Pressable>

          <Pressable
            style={[
              styles.checkButton,
              (capturedMedia.length === 0 || isRecording) && styles.checkButtonDisabled,
            ]}
            disabled={capturedMedia.length === 0 || isRecording}
            onPress={onDone}
          >
            <Ionicons name="checkmark" size={24} color={colors.brandDark} />
          </Pressable>
        </View>

        {isRecording && (
          <View style={[styles.recordingPill, { top: insets.top + 70 }]}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {formatRecordingTime(recordingElapsedMs)} / 0:30
            </Text>
          </View>
        )}

        <Pressable
          disabled={isRecording || hasReachedMediaLimit}
          style={[
            styles.modeButton,
            isVideoMode && styles.modeButtonActive,
            (isRecording || hasReachedMediaLimit) && styles.controlDisabled,
            { bottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          onPress={toggleCameraMode}
        >
          <Ionicons
            name={isVideoMode ? "videocam" : "camera"}
            size={16}
            color={isVideoMode ? colors.text.onBrand : colors.text.inverse}
          />
          <Text
            style={[
              styles.modeButtonText,
              isVideoMode && styles.modeButtonTextActive,
            ]}
          >
            {isVideoMode ? "Vídeo" : "Foto"}
          </Text>
        </Pressable>

        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Pressable
            disabled={isRecording}
            style={[styles.galleryButton, isRecording && styles.controlDisabled]}
            onPress={() => void handleOpenGallery()}
          >
            <Ionicons name="images-outline" size={26} color={colors.text.inverse} />
          </Pressable>

          <Pressable
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
              captureDisabled && styles.captureButtonDisabled,
            ]}
            disabled={captureDisabled}
            onPress={() => void handleCapturePress()}
          >
            <View
              style={isRecording ? styles.captureInnerRecording : styles.captureInner}
            />
          </Pressable>

          <Pressable
            disabled={isRecording}
            style={[styles.flipButton, isRecording && styles.controlDisabled]}
            onPress={toggleFacing}
          >
            <Ionicons name="camera-reverse-outline" size={26} color={colors.text.inverse} />
          </Pressable>
        </View>

        {capturedMedia.length > 0 && !isRecording && (
          <View style={[styles.mediaCounter, { bottom: Math.max(insets.bottom, 16) + 98 }]}>
            {latestMedia.mediaType === "video" ? (
              <View style={styles.latestVideoThumb}>
                <Ionicons name="play" size={14} color={colors.text.inverse} />
              </View>
            ) : (
              <Image
                source={{ uri: latestMedia.uri }}
                style={styles.latestThumb}
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={latestMedia.uri}
              />
            )}
            <Text style={styles.mediaCounterText}>{capturedMedia.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

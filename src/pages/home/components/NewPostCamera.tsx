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
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import type { ComposeFeedMedia } from "../types/feed.types";

const MAX_FEED_MEDIA = 10;
const MAX_VIDEO_DURATION_MS = 30_000;
const VIDEO_PRESS_DELAY_MS = 250;

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
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const stopRequestedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);

  const latestMedia = capturedMedia[capturedMedia.length - 1];
  const hasReachedMediaLimit = capturedMedia.length >= MAX_FEED_MEDIA;

  const clearPressTimer = useCallback(() => {
    if (!pressTimerRef.current) return;

    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  }, []);

  const handleTakePhoto = async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      isRecording ||
      isRecordingRef.current ||
      hasReachedMediaLimit
    ) {
      return;
    }

    setIsTakingPhoto(true);
    try {
      setCameraMode("picture");
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      onAddMedia({ mediaType: "image", uri: photo.uri });
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

  const startRecording = useCallback(async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      isRecording ||
      hasReachedMediaLimit
    ) {
      return;
    }

    const microphoneStatus =
      microphonePermission?.granted ? microphonePermission : await requestMicrophonePermission();

    if (!microphoneStatus.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso ao microfone para gravar vídeo.",
      });
      return;
    }

    setIsRecording(true);
    setRecordingElapsedMs(0);
    isRecordingRef.current = true;
    stopRequestedRef.current = false;
    setCameraMode("video");
    recordingStartedAtRef.current = Date.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 120));
      const recording = cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_MS / 1000,
        maxFileSize: 80 * 1024 * 1024,
      });

      if (stopRequestedRef.current) {
        cameraRef.current.stopRecording();
      }

      const video = await recording;
      if (!video?.uri) return;

      const recordedDurationMs = recordingStartedAtRef.current
        ? Math.min(Date.now() - recordingStartedAtRef.current, MAX_VIDEO_DURATION_MS)
        : MAX_VIDEO_DURATION_MS;

      onAddMedia({
        durationMs: Math.max(1, recordedDurationMs),
        mediaType: "video",
        uri: video.uri,
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro na gravação",
        text2: "Não foi possível gravar o vídeo. Tente novamente.",
      });
    } finally {
      isRecordingRef.current = false;
      recordingStartedAtRef.current = null;
      stopRequestedRef.current = false;
      setRecordingElapsedMs(0);
      setIsRecording(false);
      setCameraMode("picture");
    }
  }, [
    hasReachedMediaLimit,
    isCameraReady,
    isRecording,
    isTakingPhoto,
    microphonePermission,
    onAddMedia,
    requestMicrophonePermission,
  ]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    stopRequestedRef.current = true;
    cameraRef.current?.stopRecording();
  }, []);

  const handleOpenGallery = async () => {
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
      videoMaxDuration: MAX_VIDEO_DURATION_MS / 1000,
    });

    if (result.canceled) return;

    const selectedMedia: ComposeFeedMedia[] = [];
    for (const asset of result.assets.slice(0, remainingSlots)) {
      const isVideo = asset.type === "video";

      if (isVideo && asset.duration && asset.duration > MAX_VIDEO_DURATION_MS) {
        Toast.show({
          type: "error",
          text1: "Vídeo muito longo",
          text2: "Escolha vídeos de até 30 segundos.",
        });
        return;
      }

      selectedMedia.push({
        durationMs: isVideo ? asset.duration ?? MAX_VIDEO_DURATION_MS : null,
        mediaType: isVideo ? "video" : "image",
        uri: asset.uri,
      });
    }

    onGallerySelected([...capturedMedia, ...selectedMedia]);
  };

  const handleCapturePressIn = () => {
    if (isTakingPhoto || !isCameraReady || hasReachedMediaLimit) return;

    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      void startRecording();
    }, VIDEO_PRESS_DELAY_MS);
  };

  const handleCapturePressOut = () => {
    if (pressTimerRef.current) {
      clearPressTimer();
      void handleTakePhoto();
      return;
    }

    stopRecording();
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  useEffect(() => {
    if (visible) return;

    clearPressTimer();
    if (isRecordingRef.current) {
      stopRequestedRef.current = true;
      cameraRef.current?.stopRecording();
    }
  }, [clearPressTimer, visible]);

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;

      setRecordingElapsedMs(Math.min(Date.now() - startedAt, MAX_VIDEO_DURATION_MS));
    }, 250);

    return () => clearInterval(interval);
  }, [isRecording]);

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal animationType="slide" visible={visible} statusBarTranslucent>
        <View style={[styles.permissionScreen, { paddingTop: insets.top + 24 }]}>
          <Pressable style={styles.closePermission} onPress={onClose}>
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

  return (
    <Modal animationType="slide" visible={visible} statusBarTranslucent>
      <View style={styles.screen}>
        <CameraView
          ref={cameraRef}
          active={visible}
          facing={facing}
          mode={cameraMode}
          style={styles.camera}
          videoQuality="1080p"
          onCameraReady={() => setIsCameraReady(true)}
        />

        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[styles.checkButton, capturedMedia.length === 0 && styles.checkButtonDisabled]}
            disabled={capturedMedia.length === 0}
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

        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Pressable style={styles.galleryButton} onPress={handleOpenGallery}>
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
              (isTakingPhoto || !isCameraReady || hasReachedMediaLimit) &&
                styles.captureButtonDisabled,
            ]}
            disabled={isTakingPhoto || !isCameraReady || hasReachedMediaLimit}
            onPressIn={handleCapturePressIn}
            onPressOut={handleCapturePressOut}
          >
            <View style={[styles.captureInner, isRecording && styles.captureInnerRecording]} />
          </Pressable>

          <Pressable style={styles.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        {capturedMedia.length > 0 && (
          <View style={[styles.mediaCounter, { bottom: Math.max(insets.bottom, 16) + 98 }]}>
            {latestMedia?.mediaType === "image" ? (
              <Image source={{ uri: latestMedia.uri }} style={styles.latestThumb} contentFit="cover" />
            ) : (
              <View style={styles.latestVideoThumb}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </View>
            )}
            <Text style={styles.mediaCounterText}>{capturedMedia.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function formatRecordingTime(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  return `0:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  bottomControls: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 34,
    position: "absolute",
    right: 0,
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    alignItems: "center",
    borderColor: "#FFFFFF",
    borderRadius: 42,
    borderWidth: 4,
    height: 78,
    justifyContent: "center",
    width: 78,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonRecording: {
    borderColor: "#EF4444",
    transform: [{ scale: 1.08 }],
  },
  captureInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  captureInnerRecording: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    height: 34,
    width: 34,
  },
  checkButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  checkButtonDisabled: {
    opacity: 0.45,
  },
  closePermission: {
    left: 18,
    position: "absolute",
    top: 18,
  },
  flipButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  galleryButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  latestThumb: {
    borderRadius: 8,
    height: 32,
    width: 32,
  },
  latestVideoThumb: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.86)",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  mediaCounter: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    left: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: "absolute",
  },
  mediaCounterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  permissionButton: {
    marginTop: 24,
    maxWidth: 292,
    width: "100%",
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 320,
    paddingHorizontal: 28,
    width: "100%",
  },
  permissionScreen: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    flex: 1,
    justifyContent: "center",
  },
  permissionText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 280,
    textAlign: "center",
    width: "100%",
  },
  permissionTitle: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center",
    width: "100%",
  },
  recordingDot: {
    backgroundColor: "#EF4444",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  recordingPill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
  },
  recordingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  topControls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 18,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

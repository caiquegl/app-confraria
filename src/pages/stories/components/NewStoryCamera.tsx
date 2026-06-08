import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraType,
} from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { StoryPhotoEditor, type StoryPhotoEditorHandle } from "./StoryPhotoEditor";
import type { StoryDraftMedia } from "../types/stories.types";

const MAX_VIDEO_DURATION_MS = 30_000;
type NewStoryCameraProps = {
  isPublishing?: boolean;
  selectedMedia: StoryDraftMedia | null;
  uploadProgress?: number;
  visible: boolean;
  onClose: () => void;
  onSelectMedia: (media: StoryDraftMedia | null) => void;
  onPublish: (media: StoryDraftMedia) => void;
};

export function NewStoryCamera({
  isPublishing = false,
  selectedMedia,
  uploadProgress = 0,
  visible,
  onClose,
  onSelectMedia,
  onPublish,
}: NewStoryCameraProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const photoEditorRef = useRef<StoryPhotoEditorHandle | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discardedRecordingSessionRef = useRef(0);
  const isRecordingRef = useRef(false);
  const nativeRecordingStartedRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingSessionRef = useRef(0);
  const shouldDiscardRecordingRef = useRef(false);
  const suppressNextCaptureRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [isExportingPhoto, setIsExportingPhoto] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const isBusy = isPublishing || isExportingPhoto;
  const isVideoMode = cameraMode === "video";
  const uploadPercent = Math.round(Math.min(Math.max(uploadProgress, 0), 1) * 100);

  const clearPressTimer = useCallback(() => {
    if (!pressTimerRef.current) return;

    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  }, []);

  const clearStopFallbackTimer = useCallback(() => {
    if (!stopFallbackTimerRef.current) return;

    clearTimeout(stopFallbackTimerRef.current);
    stopFallbackTimerRef.current = null;
  }, []);

  const handleTakePhoto = async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      isRecording ||
      isRecordingRef.current
    ) {
      return;
    }

    setIsTakingPhoto(true);
    try {
      setCameraMode("picture");
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      onSelectMedia({ mediaType: "image", uri: photo.uri });
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
    console.log("[story-camera] startRecording chamado", {
      hasCamera: Boolean(cameraRef.current),
      isCameraReady,
      isRecording,
      isRecordingRef: isRecordingRef.current,
      isTakingPhoto,
    });
    if (!cameraRef.current || !isCameraReady || isTakingPhoto || isRecording) return;

    setIsRecording(true);
    setRecordingElapsedMs(0);
    isRecordingRef.current = true;
    shouldDiscardRecordingRef.current = false;
    const recordingSession = recordingSessionRef.current + 1;
    recordingSessionRef.current = recordingSession;
    discardedRecordingSessionRef.current = 0;
    stopRequestedRef.current = false;
    setCameraMode("video");
    recordingStartedAtRef.current = Date.now();
    console.log("[story-camera] gravação iniciando", { recordingSession });

    try {
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (
        shouldDiscardRecordingRef.current ||
        recordingSessionRef.current !== recordingSession ||
        !isRecordingRef.current ||
        !cameraRef.current
      ) {
        console.log("[story-camera] recordAsync cancelado antes de iniciar", {
          hasCamera: Boolean(cameraRef.current),
          isRecordingRef: isRecordingRef.current,
          recordingSession,
          recordingSessionCurrent: recordingSessionRef.current,
          shouldDiscard: shouldDiscardRecordingRef.current,
        });
        return;
      }

      console.log("[story-camera] chamando recordAsync", { recordingSession });
      nativeRecordingStartedRef.current = true;
      const recording = cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_MS / 1000,
        maxFileSize: 80 * 1024 * 1024,
      });

      if (stopRequestedRef.current) {
        console.log("[story-camera] stop já solicitado antes do recordAsync resolver", {
          recordingSession,
        });
        try {
          cameraRef.current.stopRecording();
        } catch (error) {
          console.log("[story-camera] erro ao parar após stop antecipado", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const video = await recording;
      console.log("[story-camera] recordAsync resolveu", {
        discardedRecordingSession: discardedRecordingSessionRef.current,
        hasUri: Boolean(video?.uri),
        recordingSession,
        recordingSessionCurrent: recordingSessionRef.current,
        shouldDiscard: shouldDiscardRecordingRef.current,
        stopRequested: stopRequestedRef.current,
      });

      if (
        shouldDiscardRecordingRef.current ||
        discardedRecordingSessionRef.current === recordingSession ||
        recordingSessionRef.current !== recordingSession ||
        !video?.uri
      ) {
        return;
      }

      const recordedDurationMs = recordingStartedAtRef.current
        ? Math.min(Date.now() - recordingStartedAtRef.current, MAX_VIDEO_DURATION_MS)
        : MAX_VIDEO_DURATION_MS;

      onSelectMedia({
        durationMs: Math.max(1, recordedDurationMs),
        mediaType: "video",
        uri: video.uri,
      });
    } catch (error) {
      console.log("[story-camera] erro na gravação", {
        error: error instanceof Error ? error.message : String(error),
        recordingSession,
      });
      Toast.show({
        type: "error",
        text1: "Erro na gravação",
        text2: "Não foi possível gravar o vídeo. Tente novamente.",
      });
    } finally {
      console.log("[story-camera] finally gravação", {
        recordingSession,
        recordingSessionCurrent: recordingSessionRef.current,
      });
      if (recordingSessionRef.current === recordingSession) {
        clearStopFallbackTimer();
        isRecordingRef.current = false;
        nativeRecordingStartedRef.current = false;
        recordingStartedAtRef.current = null;
        shouldDiscardRecordingRef.current = false;
        stopRequestedRef.current = false;
        setRecordingElapsedMs(0);
        setIsRecording(false);
        setCameraMode("picture");
      }
    }
  }, [
    clearStopFallbackTimer,
    isCameraReady,
    isRecording,
    isTakingPhoto,
    onSelectMedia,
  ]);

  const stopRecording = useCallback((discard = false) => {
    clearStopFallbackTimer();
    const wasRecording = isRecordingRef.current;
    console.log("[story-camera] stopRecording chamado", {
      discard,
      hasCamera: Boolean(cameraRef.current),
      isRecordingRef: wasRecording,
      nativeRecordingStarted: nativeRecordingStartedRef.current,
      recordingSession: recordingSessionRef.current,
      stopRequested: stopRequestedRef.current,
    });
    if (discard) {
      shouldDiscardRecordingRef.current = true;
      discardedRecordingSessionRef.current = recordingSessionRef.current;
      isRecordingRef.current = false;
      recordingStartedAtRef.current = null;
      setRecordingElapsedMs(0);
      setIsRecording(false);
      setCameraMode("picture");
    }

    if (!wasRecording) {
      console.log("[story-camera] stopRecording ignorado, não havia gravação ativa");
      return;
    }

    if (stopRequestedRef.current && !discard) {
      console.log("[story-camera] stopRecording ignorado, stop já solicitado");
      return;
    }

    stopRequestedRef.current = true;
    if (!nativeRecordingStartedRef.current) {
      console.log("[story-camera] stop aguardando recordAsync iniciar", {
        discard,
        recordingSession: recordingSessionRef.current,
      });
      return;
    }

    try {
      cameraRef.current?.stopRecording();
    } catch (error) {
      console.log("[story-camera] erro ao chamar stopRecording nativo", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    console.log("[story-camera] stopRecording enviado para CameraView", {
      discard,
      stopRequested: stopRequestedRef.current,
    });
  }, [clearStopFallbackTimer]);

  const handleOpenGallery = async () => {
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!mediaPermission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para selecionar uma mídia.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images", "videos"],
      quality: 1,
      selectionLimit: 1,
      videoMaxDuration: MAX_VIDEO_DURATION_MS / 1000,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === "video";

    if (isVideo && asset.duration && asset.duration > MAX_VIDEO_DURATION_MS) {
      Toast.show({
        type: "error",
        text1: "Vídeo muito longo",
        text2: "Escolha um vídeo de até 30 segundos.",
      });
      return;
    }

    onSelectMedia({
      durationMs: isVideo ? asset.duration ?? MAX_VIDEO_DURATION_MS : null,
      mediaType: isVideo ? "video" : "image",
      uri: asset.uri,
    });
  };

  const ensureMicrophonePermission = async () => {
    if (microphonePermission?.granted) return true;

    const microphoneStatus = await requestMicrophonePermission();

    if (!microphoneStatus.granted) {
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
    console.log("[story-camera] capturePress", {
      cameraMode,
      hasSelectedMedia: Boolean(selectedMedia),
      isCameraReady,
      isRecording,
      isRecordingRef: isRecordingRef.current,
      isTakingPhoto,
    });

    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    if (selectedMedia || isTakingPhoto || !isCameraReady) return;

    if (!isVideoMode) {
      await handleTakePhoto();
      return;
    }

    const hasMicrophonePermission = await ensureMicrophonePermission();
    if (!hasMicrophonePermission) return;

    await startRecording();
  };

  const toggleCameraMode = () => {
    if (selectedMedia || isRecordingRef.current || isBusy) return;

    setCameraMode((current) => (current === "video" ? "picture" : "video"));
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handlePublish = async () => {
    if (!selectedMedia || isBusy) return;

    if (selectedMedia.mediaType !== "image") {
      onPublish(selectedMedia);
      return;
    }

    setIsExportingPhoto(true);
    try {
      const editedPhoto = await photoEditorRef.current?.captureEditedPhoto();
      onPublish({
        ...selectedMedia,
        overlays: editedPhoto?.overlays ?? [],
        uri: editedPhoto?.uri ?? selectedMedia.uri,
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao editar foto",
        text2: "Não foi possível preparar a imagem para publicação.",
      });
    } finally {
      setIsExportingPhoto(false);
    }
  };

  useEffect(() => {
    if (visible) return;

    console.log("[story-camera] componente fechou", {
      isRecordingRef: isRecordingRef.current,
      recordingSession: recordingSessionRef.current,
    });
    clearPressTimer();
    clearStopFallbackTimer();
    if (isRecordingRef.current) {
      stopRecording(true);
    }
  }, [clearPressTimer, clearStopFallbackTimer, stopRecording, visible]);

  const handleClose = useCallback(() => {
    console.log("[story-camera] fechar pressionado", {
      isRecordingRef: isRecordingRef.current,
      nativeRecordingStarted: nativeRecordingStartedRef.current,
      recordingSession: recordingSessionRef.current,
      stopRequested: stopRequestedRef.current,
    });
    if (isRecordingRef.current) {
      stopRecording(true);
    }
    onClose();
  }, [onClose, stopRecording]);

  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return;

      console.log("[story-camera] app state interrompeu gravação", {
        isRecordingRef: isRecordingRef.current,
        state,
      });
      suppressNextCaptureRef.current = true;
      clearPressTimer();
      clearStopFallbackTimer();
      stopRecording(true);
    });

    return () => subscription.remove();
  }, [clearPressTimer, clearStopFallbackTimer, stopRecording, visible]);

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;

      const elapsedMs = Math.min(Date.now() - startedAt, MAX_VIDEO_DURATION_MS);
      setRecordingElapsedMs(elapsedMs);

      if (elapsedMs >= MAX_VIDEO_DURATION_MS && !stopRequestedRef.current) {
        console.log("[story-camera] timer 30s solicitou stop", { elapsedMs });
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
              Para criar um story, o Confraria precisa acessar sua câmera.
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
        {selectedMedia ? (
          <StoryMediaPreview
            ref={photoEditorRef}
            disabled={isBusy}
            media={selectedMedia}
          />
        ) : (
          <CameraView
            ref={cameraRef}
            active={visible}
            facing={facing}
            mode={cameraMode}
            style={styles.camera}
            videoQuality="1080p"
            onCameraReady={() => setIsCameraReady(true)}
          />
        )}

        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <Pressable
            disabled={isBusy}
            style={[styles.iconButton, isBusy && styles.controlDisabled]}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[
              styles.checkButton,
              (!selectedMedia || isBusy) && styles.checkButtonDisabled,
            ]}
            disabled={!selectedMedia || isBusy}
            onPress={() => void handlePublish()}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.brandDark} size="small" />
            ) : (
              <Ionicons name="checkmark" size={24} color={colors.brandDark} />
            )}
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
          <Pressable
            disabled={isBusy || isRecording}
            style={[styles.galleryButton, (isBusy || isRecording) && styles.controlDisabled]}
            onPress={handleOpenGallery}
          >
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          </Pressable>

          {selectedMedia ? (
            <Pressable
              disabled={isBusy}
              style={[styles.retakeButton, isBusy && styles.controlDisabled]}
              onPress={() => onSelectMedia(null)}
            >
              <Text style={styles.retakeText}>Trocar mídia</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.captureButton,
                isRecording && styles.captureButtonRecording,
                (isTakingPhoto || (!isCameraReady && !isRecording)) && styles.captureButtonDisabled,
              ]}
              disabled={isTakingPhoto || (!isCameraReady && !isRecording)}
              onPressIn={() => {
                console.log("[story-camera] captureButton onPressIn direto", {
                  isRecording,
                  isRecordingRef: isRecordingRef.current,
                  stopRequested: stopRequestedRef.current,
                });
                if (isRecordingRef.current) {
                  stopRecording();
                }
              }}
              onPress={() => {
                console.log("[story-camera] captureButton onPress direto", {
                  isRecording,
                  isRecordingRef: isRecordingRef.current,
                  stopRequested: stopRequestedRef.current,
                });
                if (isRecordingRef.current) return;
                void handleCapturePress();
              }}
            >
              <View style={[styles.captureInner, isRecording && styles.captureInnerRecording]} />
            </Pressable>
          )}

          <Pressable
            disabled={isBusy || isRecording}
            style={[styles.flipButton, (isBusy || isRecording) && styles.controlDisabled]}
            onPress={isRecording ? undefined : toggleFacing}
          >
            <Ionicons
              name={isVideoMode ? "videocam" : "camera-reverse-outline"}
              size={26}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {!selectedMedia && !isRecording && (
          <Pressable
            accessibilityRole="button"
            style={[styles.modeButton, isVideoMode && styles.modeButtonActive]}
            onPress={toggleCameraMode}
          >
            <Ionicons
              name={isVideoMode ? "camera-outline" : "videocam-outline"}
              size={18}
              color={isVideoMode ? colors.brandDark : "#FFFFFF"}
            />
            <Text style={[styles.modeButtonText, isVideoMode && styles.modeButtonTextActive]}>
              {isVideoMode ? "Foto" : "Vídeo"}
            </Text>
          </Pressable>
        )}

        {isBusy && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadCard}>
              <ActivityIndicator color={colors.brandGreen} size="large" />
              <Text style={styles.uploadTitle}>
                {isExportingPhoto
                  ? "Preparando foto..."
                  : uploadPercent >= 100
                    ? "Processando story..."
                    : "Publicando story..."}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {isExportingPhoto
                  ? "Aplicando textos e efeitos na imagem."
                  : uploadPercent >= 100
                  ? "Finalizando o envio no servidor."
                  : "Mantenha a tela aberta até concluir."}
              </Text>
              <View style={styles.uploadProgressTrack}>
                <View style={[styles.uploadProgressFill, { width: `${uploadPercent}%` }]} />
              </View>
              <Text style={styles.uploadPercent}>{uploadPercent}%</Text>
            </View>
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

const StoryMediaPreview = forwardRef<
  StoryPhotoEditorHandle,
  { disabled?: boolean; media: StoryDraftMedia }
>(function StoryMediaPreview({ disabled = false, media }, ref) {
  if (media.mediaType === "video") {
    return <StoryVideoPreview uri={media.uri} />;
  }

  return <StoryPhotoEditor ref={ref} disabled={disabled} uri={media.uri} />;
});

function StoryVideoPreview({ uri }: { uri: string }) {
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void VideoThumbnails.getThumbnailAsync(uri, {
      quality: 0.55,
      time: 500,
    })
      .then((thumbnail) => {
        if (isMounted) {
          setThumbnailUri(thumbnail.uri);
        }
      })
      .catch((error) => {
        console.log("[story-camera] erro ao gerar thumb do preview", {
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [uri]);

  if (!shouldLoadPreview) {
    return (
      <Pressable
        accessibilityRole="button"
        style={styles.videoPreviewPlaceholder}
        onPress={() => setShouldLoadPreview(true)}
      >
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.videoPreviewThumbnail}
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={thumbnailUri}
          />
        ) : null}
        <View style={styles.videoPreviewScrim} />
        <View style={styles.videoPreviewIcon}>
          <Ionicons name="play" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.videoPreviewTitle}>Vídeo gravado</Text>
        <Text style={styles.videoPreviewText}>Toque para visualizar antes de publicar.</Text>
      </Pressable>
    );
  }

  return <StoryVideoPlayer uri={uri} />;
}

function StoryVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.camera}
    />
  );
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
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
    borderRadius: 18,
    transform: [{ scale: 1.02 }],
  },
  captureInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  captureInnerRecording: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    height: 28,
    width: 28,
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
  controlDisabled: {
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
  modeButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    bottom: 140,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "absolute",
  },
  modeButtonActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  modeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  modeButtonTextActive: {
    color: colors.brandDark,
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
  recordingDotPaused: {
    backgroundColor: "#F59E0B",
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
    zIndex: 6,
  },
  recordingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  retakeButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  retakeText: {
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
  uploadCard: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.92)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    width: 280,
  },
  uploadOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  uploadPercent: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  uploadProgressFill: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: "100%",
  },
  uploadProgressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    height: 7,
    marginTop: 18,
    overflow: "hidden",
    width: "100%",
  },
  uploadSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  uploadTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 16,
  },
  videoPreviewIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    height: 78,
    justifyContent: "center",
    width: 78,
    zIndex: 2,
  },
  videoPreviewPlaceholder: {
    alignItems: "center",
    backgroundColor: "#000000",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 28,
  },
  videoPreviewScrim: {
    backgroundColor: "rgba(0,0,0,0.42)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  videoPreviewText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    zIndex: 2,
  },
  videoPreviewThumbnail: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  videoPreviewTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    zIndex: 2,
  },
});

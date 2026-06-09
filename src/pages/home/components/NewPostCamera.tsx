import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
} from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import { styles } from "./NewPostCamera.styles";
import type { ComposeFeedMedia } from "../types/feed.types";

const MAX_FEED_MEDIA = 10;
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
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const latestMedia = capturedMedia[capturedMedia.length - 1];
  const hasReachedMediaLimit = capturedMedia.length >= MAX_FEED_MEDIA;

  const handleTakePhoto = async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isTakingPhoto ||
      hasReachedMediaLimit
    ) {
      return;
    }

    setIsTakingPhoto(true);
    try {
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
      mediaTypes: ["images"],
      quality: 1,
      selectionLimit: remainingSlots,
    });

    if (result.canceled) return;

    const selectedMedia: ComposeFeedMedia[] = [];
    for (const asset of result.assets.slice(0, remainingSlots)) {
      selectedMedia.push({
        durationMs: null,
        mediaType: "image",
        uri: asset.uri,
      });
    }

    onGallerySelected([...capturedMedia, ...selectedMedia]);
  };

  const handleCapturePress = async () => {
    if (isTakingPhoto || !isCameraReady || hasReachedMediaLimit) return;
    await handleTakePhoto();
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleClose = () => {
    onClose();
  };

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

  return (
    <Modal animationType="slide" visible={visible} statusBarTranslucent>
      <View style={styles.screen}>
        <CameraView
          ref={cameraRef}
          active={visible}
          facing={facing}
          mode="picture"
          style={styles.camera}
          onCameraReady={() => setIsCameraReady(true)}
        />

        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.iconButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[
              styles.checkButton,
              capturedMedia.length === 0 && styles.checkButtonDisabled,
            ]}
            disabled={capturedMedia.length === 0}
            onPress={onDone}
          >
            <Ionicons name="checkmark" size={24} color={colors.brandDark} />
          </Pressable>
        </View>

        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Pressable style={styles.galleryButton} onPress={handleOpenGallery}>
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[
              styles.captureButton,
              (isTakingPhoto || !isCameraReady || hasReachedMediaLimit) && styles.captureButtonDisabled,
            ]}
            disabled={isTakingPhoto || !isCameraReady || hasReachedMediaLimit}
            onPress={() => void handleCapturePress()}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <Pressable style={styles.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        {capturedMedia.length > 0 && (
          <View style={[styles.mediaCounter, { bottom: Math.max(insets.bottom, 16) + 98 }]}>
            <Image
              source={{ uri: latestMedia.uri }}
              style={styles.latestThumb}
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={latestMedia.uri}
            />
            <Text style={styles.mediaCounterText}>{capturedMedia.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}


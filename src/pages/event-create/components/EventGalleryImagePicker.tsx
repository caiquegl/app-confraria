import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

const GALLERY_MAX_IMAGES = 10;
const GALLERY_MAX_SIZE = 720;

type EventGalleryImagePickerProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function EventGalleryImagePicker({ images, onChange }: EventGalleryImagePickerProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const remainingSlots = GALLERY_MAX_IMAGES - images.length;
  const hasReachedLimit = remainingSlots <= 0;

  const openCamera = () => {
    if (hasReachedLimit) {
      showLimitToast();
      return;
    }

    setIsCameraVisible(true);
  };

  const openGallery = async () => {
    if (hasReachedLimit) {
      showLimitToast();
      return;
    }

    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para escolher fotos.",
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

    try {
      const selectedImages = await Promise.all(
        result.assets.slice(0, remainingSlots).map((asset) => resizeGalleryImage(asset)),
      );
      onChange([...images, ...selectedImages]);
      closeCamera();
    } catch {
      Toast.show({
        type: "error",
        text1: "Não foi possível preparar as imagens",
        text2: "Tente selecionar outras fotos.",
      });
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto || hasReachedLimit) return;

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return;

      const optimizedUri = await resizeGalleryImage(photo);
      onChange([...images, optimizedUri]);
      closeCamera();
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

  const removeImage = (index: number) => {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const closeCamera = () => {
    setIsCameraVisible(false);
    setIsCameraReady(false);
  };

  const toggleFacing = () => {
    setFacing((currentFacing) => (currentFacing === "back" ? "front" : "back"));
  };

  return (
    <View>
      <View>
        <Text style={styles.label}>Galeria do evento</Text>
        <Pressable
          accessibilityRole="button"
          disabled={hasReachedLimit}
          style={[styles.galleryPicker, hasReachedLimit && styles.galleryPickerDisabled]}
          onPress={openCamera}
        >
          <Ionicons color="#6B7280" name="camera-outline" size={20} />
          <Text style={styles.galleryPickerText}>
            {hasReachedLimit ? "Limite de 10 fotos atingido" : "Adicionar imagens à galeria"}
          </Text>
        </Pressable>
        <Text style={styles.helperText}>{images.length}/10 fotos adicionadas</Text>
      </View>

      {images.length > 0 ? (
        <View style={styles.galleryGrid}>
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.galleryItem}>
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={uri}
                source={{ uri }}
                style={styles.galleryImage}
              />
              <Pressable
                accessibilityRole="button"
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons color="#FFFFFF" name="close" size={14} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <GalleryCameraModal
        cameraRef={cameraRef}
        facing={facing}
        isCameraReady={isCameraReady}
        isTakingPhoto={isTakingPhoto}
        permissionGranted={permission?.granted === true}
        topInset={insets.top}
        visible={isCameraVisible}
        onClose={closeCamera}
        onOpenGallery={openGallery}
        onRequestPermission={requestPermission}
        onSetCameraReady={setIsCameraReady}
        onTakePhoto={takePhoto}
        onToggleFacing={toggleFacing}
      />
    </View>
  );
}

type GalleryImageAsset = {
  height?: number;
  uri: string;
  width?: number;
};

type GalleryCameraModalProps = {
  cameraRef: React.RefObject<CameraView | null>;
  facing: CameraType;
  isCameraReady: boolean;
  isTakingPhoto: boolean;
  permissionGranted: boolean;
  topInset: number;
  visible: boolean;
  onClose: () => void;
  onOpenGallery: () => void;
  onRequestPermission: () => void;
  onSetCameraReady: (ready: boolean) => void;
  onTakePhoto: () => void;
  onToggleFacing: () => void;
};

function GalleryCameraModal({
  cameraRef,
  facing,
  isCameraReady,
  isTakingPhoto,
  permissionGranted,
  topInset,
  visible,
  onClose,
  onOpenGallery,
  onRequestPermission,
  onSetCameraReady,
  onTakePhoto,
  onToggleFacing,
}: GalleryCameraModalProps) {
  if (!visible) return null;

  if (!permissionGranted) {
    return (
      <Modal animationType="slide" statusBarTranslucent visible={visible}>
        <View style={[styles.permissionScreen, { paddingTop: topInset + 24 }]}>
          <Pressable style={styles.closePermission} onPress={onClose}>
            <Ionicons color={colors.brandDark} name="close" size={24} />
          </Pressable>

          <View style={styles.permissionContent}>
            <Ionicons color={colors.brandDark} name="camera-outline" size={48} />
            <Text style={styles.permissionTitle}>Permita acesso à câmera</Text>
            <Text style={styles.permissionText}>
              Para adicionar fotos à galeria, o Confraria precisa acessar sua câmera.
            </Text>
            <Button size="lg" style={styles.permissionButton} onPress={onRequestPermission}>
              Permitir câmera
            </Button>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" statusBarTranslucent visible={visible}>
      <View style={styles.cameraScreen}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          mode="picture"
          style={styles.camera}
          onCameraReady={() => onSetCameraReady(true)}
        />

        <View style={[styles.cameraTopBar, { paddingTop: topInset + 16 }]}>
          <Pressable style={styles.cameraIconButton} onPress={onClose}>
            <Ionicons color="#FFFFFF" name="close" size={24} />
          </Pressable>
          <Text style={styles.cameraTitle}>Galeria do evento</Text>
          <Pressable style={styles.cameraIconButton} onPress={onToggleFacing}>
            <Ionicons color="#FFFFFF" name="camera-reverse-outline" size={24} />
          </Pressable>
        </View>

        <View style={styles.cameraBottomBar}>
          <Pressable
            accessibilityLabel="Abrir galeria"
            accessibilityRole="button"
            style={styles.cameraGalleryButton}
            onPress={onOpenGallery}
          >
            <Ionicons color="#FFFFFF" name="images-outline" size={24} />
          </Pressable>

          <Pressable
            accessibilityLabel="Tirar foto"
            accessibilityRole="button"
            disabled={!isCameraReady || isTakingPhoto}
            style={[styles.captureButton, (!isCameraReady || isTakingPhoto) && styles.captureDisabled]}
            onPress={onTakePhoto}
          >
            <View style={styles.captureButtonInner} />
          </Pressable>

          <View style={styles.cameraBottomSpacer} />
        </View>
      </View>
    </Modal>
  );
}

async function resizeGalleryImage(asset: GalleryImageAsset) {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const shouldResize = width > GALLERY_MAX_SIZE || height > GALLERY_MAX_SIZE || (!width && !height);
  const actions = shouldResize
    ? [
        {
          resize:
            width >= height
              ? { width: GALLERY_MAX_SIZE }
              : { height: GALLERY_MAX_SIZE },
        },
      ]
    : [];

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

function showLimitToast() {
  Toast.show({
    type: "error",
    text1: "Limite atingido",
    text2: "Você pode adicionar até 10 fotos na galeria do evento.",
  });
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraBottomBar: {
    alignItems: "center",
    bottom: 68,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 34,
    position: "absolute",
    right: 0,
  },
  cameraBottomSpacer: {
    width: 54,
  },
  cameraGalleryButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  cameraIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.38)",
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  cameraScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  cameraTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 18,
    position: "absolute",
    right: 0,
    top: 0,
  },
  captureButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  captureButtonInner: {
    backgroundColor: "#FFFFFF",
    borderColor: "#111827",
    borderRadius: 999,
    borderWidth: 2,
    height: 62,
    width: 62,
  },
  captureDisabled: {
    opacity: 0.55,
  },
  closePermission: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 24,
    width: 44,
    zIndex: 2,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  galleryImage: {
    borderRadius: 14,
    height: "100%",
    width: "100%",
  },
  galleryItem: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    width: "31%",
  },
  galleryPicker: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  galleryPickerDisabled: {
    opacity: 0.55,
  },
  galleryPickerText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  permissionButton: {
    marginTop: 22,
    width: "100%",
  },
  permissionContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  permissionScreen: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flex: 1,
    justifyContent: "center",
  },
  permissionText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  permissionTitle: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
  removeImageButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.74)",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 24,
  },
});

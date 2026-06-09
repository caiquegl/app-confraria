import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRef, useState } from "react";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

const COVER_MAX_SIZE = 720;

type EventCoverImagePickerProps = {
  imageUri: string;
  onChange: (uri: string) => void;
  onRemove: () => void;
};

export function EventCoverImagePicker({
  imageUri,
  onChange,
  onRemove,
}: EventCoverImagePickerProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const openCamera = async () => {
    setIsCameraVisible(true);
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para escolher a capa.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    await handlePickedImage(result);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return;

      const optimizedUri = await resizeCoverImage(photo);
      onChange(optimizedUri);
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

  const handlePickedImage = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]?.uri) return;

    try {
      const optimizedUri = await resizeCoverImage(result.assets[0]);
      onChange(optimizedUri);
      closeCamera();
    } catch {
      Toast.show({
        type: "error",
        text1: "Não foi possível preparar a imagem",
        text2: "Tente escolher outra foto para a capa.",
      });
    }
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
      <Text style={styles.label}>Imagem de capa</Text>
      {imageUri ? (
        <View style={styles.coverCard}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={imageUri}
            source={{ uri: imageUri }}
            style={styles.coverImage}
          />
          <View style={styles.coverActions}>
            <Pressable style={styles.coverActionButton} onPress={openCamera}>
              <Ionicons color={colors.brandDark} name="camera-outline" size={18} />
              <Text style={styles.coverActionText}>Tirar nova foto</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Remover imagem de capa"
              accessibilityRole="button"
              style={styles.deleteButton}
              onPress={onRemove}
            >
              <Ionicons color="#EF4444" name="trash-outline" size={18} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.imagePickerButton} onPress={openCamera}>
          <Ionicons color="#6B7280" name="camera-outline" size={20} />
          <Text style={styles.imagePickerText}>Adicionar imagem de capa</Text>
        </Pressable>
      )}
      <CoverCameraModal
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

type CoverImageAsset = {
  height?: number;
  uri: string;
  width?: number;
};

type CoverCameraModalProps = {
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

function CoverCameraModal({
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
}: CoverCameraModalProps) {
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
              Para adicionar a capa do evento, o Confraria precisa acessar sua câmera.
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
          <Text style={styles.cameraTitle}>Imagem de capa</Text>
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

async function resizeCoverImage(asset: CoverImageAsset) {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const shouldResize = width > COVER_MAX_SIZE || height > COVER_MAX_SIZE || (!width && !height);
  const actions = shouldResize
    ? [
        {
          resize:
            width >= height
              ? { width: COVER_MAX_SIZE }
              : { height: COVER_MAX_SIZE },
        },
      ]
    : [];

  const result = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
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
  coverActionButton: {
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 42,
    justifyContent: "center",
  },
  coverActions: {
    flexDirection: "row",
    gap: 10,
  },
  coverActionText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  coverCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  coverImage: {
    borderRadius: 14,
    height: 160,
    width: "100%",
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#FECACA",
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 48,
  },
  imagePickerButton: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  imagePickerText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
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
});

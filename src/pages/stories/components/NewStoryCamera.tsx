import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type NewStoryCameraProps = {
  isPublishing?: boolean;
  selectedPhoto: string | null;
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: (uri: string) => void;
  onPublish: () => void;
};

export function NewStoryCamera({
  isPublishing = false,
  selectedPhoto,
  visible,
  onClose,
  onSelectPhoto,
  onPublish,
}: NewStoryCameraProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      onSelectPhoto(photo.uri);
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
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!mediaPermission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à galeria para selecionar uma foto.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 0.85,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    onSelectPhoto(result.assets[0].uri);
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

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
        {selectedPhoto ? (
          <Image source={{ uri: selectedPhoto }} style={styles.camera} contentFit="cover" />
        ) : (
          <CameraView
            ref={cameraRef}
            active={visible}
            facing={facing}
            mode="picture"
            style={styles.camera}
            onCameraReady={() => setIsCameraReady(true)}
          />
        )}

        <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={[
              styles.checkButton,
              (!selectedPhoto || isPublishing) && styles.checkButtonDisabled,
            ]}
            disabled={!selectedPhoto || isPublishing}
            onPress={onPublish}
          >
            <Ionicons name="checkmark" size={24} color={colors.brandDark} />
          </Pressable>
        </View>

        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Pressable style={styles.galleryButton} onPress={handleOpenGallery}>
            <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          </Pressable>

          {selectedPhoto ? (
            <Pressable style={styles.retakeButton} onPress={() => onSelectPhoto("")}>
              <Text style={styles.retakeText}>Trocar foto</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
              disabled={isTakingPhoto || !isCameraReady}
              onPress={handleTakePhoto}
            >
              <View style={styles.captureInner} />
            </Pressable>
          )}

          <Pressable style={styles.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
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
  captureInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 31,
    height: 62,
    width: 62,
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
});

import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
} from "expo-camera";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

type RouteMapPinCameraProps = {
  isUploading?: boolean;
  visible: boolean;
  onClose: () => void;
  onConfirm: (imageUri: string) => void;
};

export function RouteMapPinCamera({
  isUploading = false,
  visible,
  onClose,
  onConfirm,
}: RouteMapPinCameraProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPreviewUri(null);
      setIsTakingPhoto(false);
      setIsCameraReady(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (isUploading) return;
    setPreviewUri(null);
    onClose();
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto || isUploading || previewUri) {
      return;
    }

    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
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

  const handleRetake = () => {
    if (isUploading) return;
    setIsCameraReady(false);
    setPreviewUri(null);
  };

  const handleConfirm = () => {
    if (!previewUri || isUploading) return;
    onConfirm(previewUri);
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal animationType="slide" visible={visible} statusBarTranslucent>
        <View style={[styles.permissionScreen, { paddingTop: insets.top + 24 }]}>
          <Pressable style={styles.closePermission} onPress={handleClose}>
            <Ionicons color={colors.brandDark} name="close" size={24} />
          </Pressable>
          <View style={styles.permissionContent}>
            <Ionicons color={colors.brandDark} name="camera-outline" size={48} />
            <Text style={styles.permissionTitle}>Permita acesso à câmera</Text>
            <Text style={styles.permissionText}>
              Para marcar um ponto no mapa, o Confraria precisa acessar sua câmera.
            </Text>
            <Button
              size="lg"
              style={styles.permissionButton}
              textStyle={styles.permissionButtonText}
              onPress={requestPermission}
            >
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
        {previewUri ? (
          <View collapsable={false} style={styles.previewWrap}>
            <View collapsable={false} style={styles.previewCanvas}>
              <Image
                cachePolicy="none"
                contentFit="cover"
                recyclingKey={previewUri}
                source={{ uri: previewUri }}
                style={styles.preview}
              />
            </View>
          </View>
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
          <Pressable
            disabled={isUploading}
            style={[styles.iconButton, isUploading && styles.disabled]}
            onPress={handleClose}
          >
            <Ionicons color="#FFFFFF" name="close" size={24} />
          </Pressable>
          <Text style={styles.title}>Marcar no mapa</Text>
          <View style={styles.iconButtonPlaceholder} />
        </View>

        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          {previewUri ? (
            <>
              <Pressable
                disabled={isUploading}
                style={[styles.secondaryButton, isUploading && styles.disabled]}
                onPress={handleRetake}
              >
                <Ionicons color="#FFFFFF" name="refresh" size={22} />
                <Text style={styles.secondaryButtonText}>Tirar outra</Text>
              </Pressable>
              <Pressable
                disabled={isUploading}
                style={[styles.confirmButton, isUploading && styles.disabled]}
                onPress={handleConfirm}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.brandDark} />
                ) : (
                  <>
                    <Ionicons color={colors.brandDark} name="checkmark" size={22} />
                    <Text style={styles.confirmButtonText}>Salvar no mapa</Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.sideSpacer} />
              <Pressable
                disabled={isTakingPhoto || !isCameraReady}
                style={[
                  styles.captureButton,
                  (isTakingPhoto || !isCameraReady) && styles.disabled,
                ]}
                onPress={() => void handleTakePhoto()}
              >
                <View style={styles.captureInner} />
              </Pressable>
              <Pressable
                style={styles.flipButton}
                onPress={() =>
                  setFacing((current) => (current === "back" ? "front" : "back"))
                }
              >
                <Ionicons color="#FFFFFF" name="camera-reverse-outline" size={26} />
              </Pressable>
            </>
          )}
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
    paddingHorizontal: 24,
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
  captureInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  closePermission: {
    left: 18,
    position: "absolute",
    top: 18,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    flexDirection: "row",
    flex: 1,
    gap: 8,
    height: 52,
    justifyContent: "center",
    marginLeft: 12,
  },
  confirmButtonText: {
    color: colors.brandDark,
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  flipButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  iconButtonPlaceholder: {
    height: 42,
    width: 42,
  },
  permissionButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minWidth: 220,
  },
  permissionButtonText: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  permissionContent: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    width: "100%",
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
    textAlign: "center",
  },
  permissionTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  preview: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  previewCanvas: {
    backgroundColor: "#000000",
    flex: 1,
    overflow: "hidden",
  },
  previewWrap: {
    flex: 1,
  },
  screen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sideSpacer: {
    width: 52,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  topControls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingHorizontal: 16,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

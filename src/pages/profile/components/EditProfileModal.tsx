import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

import type { OwnProfile, UpdateProfilePayload } from "../types/profile.types";

type EditProfileModalProps = {
  profile: OwnProfile;
  isSaving?: boolean;
  visible: boolean;
  onClose: () => void;
  onSave: (payload: UpdateProfilePayload) => Promise<void>;
};

type FormErrors = Partial<Record<"name" | "email" | "bio", string>>;

export function EditProfileModal({
  profile,
  isSaving = false,
  visible,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [location, setLocation] = useState(profile.location ?? "");
  const [cpf, setCpf] = useState(profile.cpf ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const previewAvatar = avatarUri ?? profile.avatar;
  const androidKeyboardOffset = Platform.OS === "android" && visible ? keyboardHeight : 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Nome é obrigatório";
    }

    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = "Email inválido";
    }

    if (bio.length > 150) {
      nextErrors.bio = "Bio não pode exceder 150 caracteres";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || isSaving) return;

    await onSave({
      avatarUri,
      bio,
      cpf,
      email,
      location,
      name,
      phone,
    });
  };

  const handleOpenGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
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

    setAvatarUri(result.assets[0].uri);
  };

  const handleOpenCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permissão necessária",
        text2: "Permita acesso à câmera para tirar uma foto.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setAvatarUri(result.assets[0].uri);
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.closeArea} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              marginBottom: androidKeyboardOffset,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Editar Perfil</Text>
            <Pressable accessibilityLabel="Fechar" style={styles.closeButton} onPress={onClose}>
              <Ionicons color="#9CA3AF" name="close" size={24} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.form,
              androidKeyboardOffset > 0 && styles.formWithKeyboard,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreview}>
                {previewAvatar ? (
                  <Image
                    source={{ uri: previewAvatar }}
                    style={styles.avatarImage}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    recyclingKey={previewAvatar}
                  />
                ) : (
                  <UserAvatar avatarUrl={null} name={name || profile.name} size={96} />
                )}
              </View>

              <View style={styles.avatarActions}>
                <Pressable style={styles.avatarButton} onPress={handleOpenCamera}>
                  <Ionicons color={colors.brandDark} name="camera-outline" size={18} />
                  <Text style={styles.avatarButtonText}>Câmera</Text>
                </Pressable>
                <Pressable style={styles.avatarButton} onPress={handleOpenGallery}>
                  <Ionicons color={colors.brandDark} name="images-outline" size={18} />
                  <Text style={styles.avatarButtonText}>Galeria</Text>
                </Pressable>
              </View>
            </View>

            <ProfileInput
              error={errors.name}
              label="Nome *"
              value={name}
              onChangeText={setName}
            />
            <ProfileInput
              autoCapitalize="none"
              error={errors.email}
              keyboardType="email-address"
              label="Email *"
              value={email}
              onChangeText={setEmail}
            />
            <ProfileInput
              label="Localização (opcional)"
              placeholder="Ex: São Paulo, SP"
              value={location}
              onChangeText={setLocation}
            />
            <ProfileInput
              keyboardType="number-pad"
              label="CPF (opcional)"
              placeholder="000.000.000-00"
              value={formatCpf(cpf)}
              onChangeText={(value) => setCpf(onlyDigits(value).slice(0, 11))}
            />

            <View>
              <Text style={styles.label}>Bio (até 150 caracteres)</Text>
              <TextInput
                multiline
                maxLength={150}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.bioInput, errors.bio && styles.inputError]}
                textAlignVertical="top"
                value={bio}
                onChangeText={setBio}
              />
              <View style={styles.bioFooter}>
                <Text style={styles.counter}>{bio.length}/150</Text>
                {errors.bio ? <Text style={styles.errorText}>{errors.bio}</Text> : null}
              </View>
            </View>

            <ProfileInput
              keyboardType="phone-pad"
              label="Telefone (opcional)"
              placeholder="(XX) XXXXX-XXXX"
              value={formatPhone(phone)}
              onChangeText={(value) => setPhone(onlyDigits(value).slice(0, 11))}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Button
              disabled={isSaving}
              size="lg"
              style={styles.actionButton}
              variant="secondary"
              onPress={onClose}
            >
              Cancelar
            </Button>
            <Button
              disabled={isSaving}
              size="lg"
              style={styles.actionButton}
              onPress={() => void handleSave()}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ProfileInputProps = {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  onChangeText: (value: string) => void;
};

function ProfileInput({
  label,
  value,
  error,
  placeholder,
  autoCapitalize,
  keyboardType = "default",
  onChangeText,
}: ProfileInputProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
  },
  avatarActions: {
    flexDirection: "row",
    gap: 10,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  avatarButtonText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  avatarImage: {
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  avatarPreview: {
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96,
  },
  avatarSection: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 8,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  bioFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  bioInput: {
    height: 86,
    paddingTop: 12,
  },
  closeArea: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  counter: {
    color: "#6B7280",
    fontSize: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    gap: 14,
    paddingBottom: 4,
  },
  formWithKeyboard: {
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    color: colors.brandDark,
    fontSize: 14,
    height: 48,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
});

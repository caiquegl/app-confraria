import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { getUpdateInfo } from "@/lib/updates";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type SettingsModalProps = {
  visible: boolean;
  isChangingPassword?: boolean;
  isDeletingAccount?: boolean;
  isSavingPrivacy?: boolean;
  initialIsPublicProfile?: boolean;
  initialShowEmail?: boolean;
  initialShowPhone?: boolean;
  onClose: () => void;
  onChangePassword: (password: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  onSavePrivacy: (
    payload: { isPublicProfile: boolean; showEmail: boolean; showPhone: boolean },
    options?: { close?: boolean; showToast?: boolean },
  ) => Promise<void>;
};

export function SettingsModal({
  isChangingPassword = false,
  isDeletingAccount = false,
  isSavingPrivacy = false,
  initialIsPublicProfile = true,
  initialShowEmail = false,
  initialShowPhone = false,
  visible,
  onChangePassword,
  onClose,
  onDeleteAccount,
  onLogout,
  onSavePrivacy,
}: SettingsModalProps) {
  const { colors, isDark, setColorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const updateInfo = getUpdateInfo();
  const [isPublic, setIsPublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!visible) return;

    queueMicrotask(() => {
      setIsPublic(initialIsPublicProfile);
      setShowEmail(initialShowEmail);
      setShowPhone(initialShowPhone);
    });
  }, [initialIsPublicProfile, initialShowEmail, initialShowPhone, visible]);

  const handleIsPublicChange = (value: boolean) => {
    const previousValue = isPublic;
    setIsPublic(value);

    void onSavePrivacy(
      { isPublicProfile: value, showEmail, showPhone },
      { close: false, showToast: false },
    ).catch(() => {
      setIsPublic(previousValue);
    });
  };

  const handleShowEmailChange = (value: boolean) => {
    const previousValue = showEmail;
    setShowEmail(value);

    void onSavePrivacy(
      { isPublicProfile: isPublic, showEmail: value, showPhone },
      { close: false, showToast: false },
    ).catch(() => {
      setShowEmail(previousValue);
    });
  };

  const handleShowPhoneChange = (value: boolean) => {
    const previousValue = showPhone;
    setShowPhone(value);

    void onSavePrivacy(
      { isPublicProfile: isPublic, showEmail, showPhone: value },
      { close: false, showToast: false },
    ).catch(() => {
      setShowPhone(previousValue);
    });
  };

  if (!visible) return null;

  return (
    <>
    <Modal animationType="fade" transparent visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={styles.closeArea} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Configurações</Text>
            <Pressable accessibilityLabel="Fechar" style={styles.closeButton} onPress={onClose}>
              <Ionicons color={colors.text.muted} name="close" size={24} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aparência</Text>
              <SettingSwitch
                label="Tema escuro"
                value={isDark}
                onValueChange={(value) => {
                  void setColorScheme(value ? "dark" : "light");
                }}
              />
              <Text style={styles.helperText}>
                Ajusta as cores do app para o modo noturno.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacidade</Text>
              <SettingSwitch
                disabled={isSavingPrivacy}
                label="Perfil Público"
                value={isPublic}
                onValueChange={handleIsPublicChange}
              />
              <Text style={styles.helperText}>
                Quando ativado, outros usuários podem ver seu perfil e dados.
              </Text>
              <SettingSwitch
                bordered
                disabled={isSavingPrivacy}
                label="Mostrar Email"
                value={showEmail}
                onValueChange={handleShowEmailChange}
              />
              <SettingSwitch
                bordered
                disabled={isSavingPrivacy}
                label="Mostrar Telefone"
                value={showPhone}
                onValueChange={handleShowPhoneChange}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conta</Text>
              <MenuButton label="Alterar Senha" onPress={() => setShowChangePassword(true)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre o app</Text>
              <View style={styles.versionCard}>
                <InfoRow label="Versão do app" value={updateInfo.appVersion} />
                <InfoRow label="OTA" value={String(updateInfo.otaVersion)} />
                <InfoRow label="EAS Update" value={updateInfo.label} />
                {updateInfo.updatedAt ? (
                  <InfoRow label="Atualizado em" value={updateInfo.updatedAt} />
                ) : null}
              </View>
            </View>

            <View style={[styles.section, styles.dangerSection]}>
              <Text style={styles.dangerTitle}>Zona de Perigo</Text>
              <Pressable style={styles.dangerButtonSoft} onPress={() => setShowLogoutConfirm(true)}>
                <View style={styles.dangerButtonContent}>
                  <Ionicons color="#DC2626" name="log-out-outline" size={18} />
                  <Text style={styles.dangerButtonText}>Fazer Logout</Text>
                </View>
              </Pressable>
              <Pressable style={styles.dangerButton} onPress={() => setShowDeleteConfirm(true)}>
                <Text style={styles.dangerButtonText}>Deletar Conta</Text>
              </Pressable>
              <Text style={styles.helperText}>
                Sua conta será desativada e deixará de aparecer para outros usuários.
              </Text>
            </View>

         
          </ScrollView>
        </View>

        {showChangePassword ? (
          <ChangePasswordDialog
            isSaving={isChangingPassword}
            onCancel={() => setShowChangePassword(false)}
            onSubmit={async (password) => {
              await onChangePassword(password);
              setShowChangePassword(false);
            }}
          />
        ) : null}
      </View>
    </Modal>

        <ConfirmModal
          confirmLabel="Logout"
          description="Você será desconectado e retornará à tela de login. Nada é excluído da sua conta."
          title="Fazer Logout?"
          variant="destructive"
          visible={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            onLogout();
          }}
        />

        <ConfirmModal
          confirmLabel="Deletar"
          description="Sua conta será marcada como inativa. Você será desconectado e não aparecerá mais no app. Essa ação não restaura a conta automaticamente."
          isLoading={isDeletingAccount}
          title="Deletar Conta?"
          variant="destructive"
          visible={showDeleteConfirm}
          onClose={() => {
            if (!isDeletingAccount) setShowDeleteConfirm(false);
          }}
          onConfirm={() => onDeleteAccount()}
        />
    </>
  );
}

function SettingSwitch({
  bordered = false,
  disabled = false,
  label,
  value,
  onValueChange,
}: {
  bordered?: boolean;
  disabled?: boolean;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.switchRow, bordered && styles.switchRowBordered]}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        disabled={disabled}
        thumbColor={value ? colors.brandDark : "#F9FAFB"}
        trackColor={{ false: "#D1D5DB", true: colors.brandGreen }}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

function MenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable style={styles.menuButton} onPress={onPress}>
      <Text style={styles.menuButtonText}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function ChangePasswordDialog({
  isSaving,
  onCancel,
  onSubmit,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const styles = useThemedStyles(createStyles);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError("Senha deve ter ao menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setError(null);
    await onSubmit(password);
  };

  return (
    <View style={styles.dialogBackdrop}>
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>Alterar Senha</Text>
        <Text style={styles.dialogMessage}>
          Informe a nova senha e confirme para atualizar o acesso da sua conta.
        </Text>

        <PasswordInput
          error={Boolean(error)}
          placeholder="Nova senha"
          value={password}
          visible={passwordVisible}
          onChangeText={setPassword}
          onToggleVisible={() => setPasswordVisible((current) => !current)}
        />
        <PasswordInput
          error={Boolean(error)}
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          visible={confirmPasswordVisible}
          onChangeText={setConfirmPassword}
          onToggleVisible={() => setConfirmPasswordVisible((current) => !current)}
        />
        {error ? <Text style={styles.passwordError}>{error}</Text> : null}

        <View style={styles.dialogActions}>
          <Button disabled={isSaving} variant="secondary" style={styles.dialogButton} onPress={onCancel}>
            Cancelar
          </Button>
          <Button disabled={isSaving} style={styles.dialogButton} onPress={() => void handleSubmit()}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </View>
      </View>
    </View>
  );
}

function PasswordInput({
  error,
  placeholder,
  value,
  visible,
  onChangeText,
  onToggleVisible,
}: {
  error: boolean;
  placeholder: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggleVisible: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.passwordInputWrap, error && styles.passwordInputError]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        secureTextEntry={!visible}
        style={styles.passwordInput}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
        hitSlop={8}
        onPress={onToggleVisible}
      >
        <Ionicons color={colors.text.muted} name={visible ? "eye-off-outline" : "eye-outline"} size={20} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  closeArea: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 26,
    paddingBottom: 4,
  },
  dangerButton: {
    borderColor: colors.feedback.danger,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  dangerButtonSoft: {
    borderColor: colors.feedback.dangerBorder,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: colors.feedback.dangerStrong,
    fontSize: 14,
    fontWeight: "700",
  },
  dangerSection: {
    borderTopColor: "#FEE2E2",
    borderTopWidth: 1,
    paddingTop: 20,
  },
  dangerTitle: {
    color: colors.feedback.dangerStrong,
    fontSize: 18,
    fontWeight: "800",
  },
  dialog: {
    backgroundColor: colors.surface.primary,
    borderRadius: 20,
    padding: 22,
    width: "84%",
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
  },
  dialogBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  dialogButton: {
    flex: 1,
  },
  dialogMessage: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  infoRow: {
    alignItems: "center",
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoValue: {
    color: colors.brandDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 12,
    textAlign: "right",
  },
  menuButton: {
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  passwordError: {
    color: colors.feedback.danger,
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  passwordInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  passwordInputError: {
    borderColor: colors.feedback.danger,
  },
  passwordInputWrap: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  switchLabel: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  switchRowBordered: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "800",
  },
  versionCard: {
    backgroundColor: colors.surface.disabled,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
});

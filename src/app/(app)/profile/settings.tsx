import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

import { getCurrentUserId, removeToken } from "@/lib/auth";
import { setStoredCurrentProfile } from "@/lib/current-profile-store";
import { BikeCategoriesEditorModal } from "@/pages/profile/components/BikeCategoriesEditorModal";
import { SettingsModal } from "@/pages/profile/components/SettingsModal";
import {
  changeOwnPassword,
  deleteOwnAccount,
  fetchOwnProfile,
  updateOwnProfileBikeCategories,
} from "@/pages/profile/services/profile.service";
import type { OwnProfile } from "@/pages/profile/types/profile.types";
import { fetchBikeCategories } from "@/pages/wizard/services/wizard.service";
import type { BikeCategory } from "@/pages/wizard/types/wizard.types";
import { colors } from "@/theme/colors";

type SettingsCard = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  wide?: boolean;
  onPress: () => void;
};

export default function ProfileSettingsScreen() {
  const [bikeCategories, setBikeCategories] = useState<BikeCategory[]>([]);
  const [ownProfile, setOwnProfile] = useState<OwnProfile | null>(null);
  const [isBikeCategoriesOpen, setIsBikeCategoriesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingBikeCategories, setIsLoadingBikeCategories] = useState(false);
  const [isSavingBikeCategories, setIsSavingBikeCategories] = useState(false);

  const openOwnFollowers = () => {
    void getCurrentUserId().then((userId) => {
      if (!userId) {
        showComingSoon("Seguidores");
        return;
      }

      router.push({
        pathname: "/users/[userId]/follows",
        params: { initialTab: "followers", userId },
      });
    });
  };

  const openBikeCategories = async () => {
    if (isLoadingBikeCategories) return;

    setIsLoadingBikeCategories(true);
    try {
      const [profile, categories] = await Promise.all([
        fetchOwnProfile(),
        fetchBikeCategories(),
      ]);

      setOwnProfile(profile);
      setBikeCategories(categories);
      setIsBikeCategoriesOpen(true);
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar categorias",
        text2: "Não foi possível abrir essa edição agora.",
      });
    } finally {
      setIsLoadingBikeCategories(false);
    }
  };

  const saveBikeCategories = async (categoryIds: string[]) => {
    if (categoryIds.length === 0 || isSavingBikeCategories) return;

    setIsSavingBikeCategories(true);
    try {
      const updatedProfile = await updateOwnProfileBikeCategories(categoryIds);
      setOwnProfile(updatedProfile);
      setIsBikeCategoriesOpen(false);
      Toast.show({
        type: "success",
        text1: "Categorias atualizadas",
        text2: "Seu estilo de estrada foi salvo.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar categorias",
        text2: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSavingBikeCategories(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setStoredCurrentProfile({ avatar: null, name: null });
    setIsSettingsOpen(false);
    router.replace("/landing");
  };

  const handleChangePassword = async (password: string) => {
    if (isChangingPassword) return;

    setIsChangingPassword(true);
    try {
      await changeOwnPassword(password);
      Toast.show({
        type: "success",
        text1: "Senha alterada",
        text2: "Sua senha foi atualizada com sucesso.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao alterar senha",
        text2: error instanceof Error ? error.message : "Tente novamente.",
      });
      throw error;
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      await deleteOwnAccount();
      await handleLogout();
      Toast.show({
        type: "success",
        text1: "Conta desativada",
        text2: "Sua conta foi desativada e você saiu do app.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao deletar conta",
        text2: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const cards: SettingsCard[] = [
    {
      icon: "notifications-outline",
      label: "Notificações",
      onPress: () => router.push("/notifications"),
    },
    {
      icon: "bicycle-outline",
      label: "Minhas Motos",
      onPress: () => router.push("/profile/bikes"),
    },
    {
      icon: "people-outline",
      label: "Meus Seguidores",
      onPress: openOwnFollowers,
    },
    {
      icon: "heart-outline",
      label: "Favoritos",
      onPress: () => router.push("/feed/liked"),
    },
    {
      icon: "id-card-outline",
      label: "Estilo de Estrada",
      onPress: () => void openBikeCategories(),
    },
    {
      icon: "settings-outline",
      label: "Configurações",
      onPress: () => setIsSettingsOpen(true),
    },
    {
      icon: "options-outline",
      label: "Minha assinatura",
      wide: true,
      onPress: () => showComingSoon("Minha assinatura"),
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.label}
              activeOpacity={0.75}
              disabled={card.label === "Estilo de Estrada" && isLoadingBikeCategories}
              style={[
                styles.card,
                card.wide && styles.cardWide,
                card.label === "Estilo de Estrada" &&
                  isLoadingBikeCategories &&
                  styles.cardDisabled,
              ]}
              onPress={card.onPress}
            >
              <Ionicons color={colors.brandPrimary} name={card.icon} size={24} />
              <Text style={styles.cardText}>
                {card.label === "Estilo de Estrada" && isLoadingBikeCategories
                  ? "Carregando..."
                  : card.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {ownProfile ? (
        <BikeCategoriesEditorModal
          categories={bikeCategories}
          isSaving={isSavingBikeCategories}
          selectedCategoryIds={ownProfile.bikeCategories.map((category) => category.id)}
          visible={isBikeCategoriesOpen}
          onClose={() => {
            if (!isSavingBikeCategories) setIsBikeCategoriesOpen(false);
          }}
          onSave={saveBikeCategories}
        />
      ) : null}

      <SettingsModal
        isChangingPassword={isChangingPassword}
        isDeletingAccount={isDeletingAccount}
        visible={isSettingsOpen}
        onChangePassword={handleChangePassword}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAccount={handleDeleteAccount}
        onLogout={() => void handleLogout()}
      />
    </View>
  );
}

function showComingSoon(label: string) {
  Toast.show({
    type: "info",
    text1: label,
    text2: "Essa opção será adicionada em breve.",
  });
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    height: 128,
    justifyContent: "space-between",
    padding: 16,
    width: "48%",
  },
  cardText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  cardWide: {
    height: 96,
    width: "100%",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  title: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
  },
});

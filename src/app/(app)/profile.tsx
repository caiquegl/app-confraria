import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { router, useFocusEffect } from "expo-router";

import { getCurrentUserId } from "@/lib/auth";
import { setStoredCurrentProfile } from "@/lib/current-profile-store";
import { EditProfileModal } from "@/pages/profile/components/EditProfileModal";
import {
  fetchOwnProfile,
  updateOwnProfile,
} from "@/pages/profile/services/profile.service";
import type {
  OwnProfile,
  UpdateProfilePayload,
} from "@/pages/profile/types/profile.types";
import { PublicProfileView } from "@/pages/public-profile/view/PublicProfileView";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [editProfile, setEditProfile] = useState<OwnProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLoadingEditProfile, setIsLoadingEditProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const hasFocusedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void getCurrentUserId()
      .then((userId) => {
        if (!cancelled) setCurrentUserId(userId);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }

      setProfileRefreshKey((current) => current + 1);
    }, []),
  );

  const handleOpenEditProfile = async () => {
    if (isLoadingEditProfile) return;

    setIsLoadingEditProfile(true);
    try {
      const profile = await fetchOwnProfile();
      setEditProfile(profile);
      setIsEditProfileOpen(true);
    } catch {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar perfil",
        text2: "Não foi possível abrir a edição agora.",
      });
    } finally {
      setIsLoadingEditProfile(false);
    }
  };

  const handleSaveProfile = async (payload: UpdateProfilePayload) => {
    setIsSavingProfile(true);
    try {
      const updatedProfile = await updateOwnProfile(payload);
      setEditProfile(updatedProfile);
      setStoredCurrentProfile({
        avatar: updatedProfile.avatar,
        name: updatedProfile.name,
      });
      setProfileRefreshKey((current) => current + 1);
      setIsEditProfileOpen(false);
      Toast.show({
        type: "success",
        text1: "Perfil atualizado",
        text2: "Suas informações foram salvas.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar perfil",
        text2: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoadingUser) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (!currentUserId) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>Não foi possível carregar seu perfil.</Text>
      </View>
    );
  }

  return (
    <>
      <PublicProfileView
        isOwnProfile
        refreshKey={profileRefreshKey}
        userId={currentUserId}
        onEditProfile={() => void handleOpenEditProfile()}
        onOpenSettings={() => router.push("/profile/settings")}
      />

      {editProfile ? (
        <EditProfileModal
          isSaving={isSavingProfile}
          profile={editProfile}
          visible={isEditProfileOpen}
          onClose={() => {
            if (!isSavingProfile) setIsEditProfileOpen(false);
          }}
          onSave={handleSaveProfile}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});

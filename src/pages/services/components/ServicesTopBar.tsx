import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type ServicesTopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenProfile: () => void;
  userAvatar: string | null;
  userName: string;
};

export function ServicesTopBar({
  searchQuery,
  onSearchChange,
  onOpenProfile,
  userAvatar,
  userName,
}: ServicesTopBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.searchWrap}>
          <Ionicons
            color={colors.text.muted}
            name="search"
            size={18}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Busque por Categorias, no..."
            placeholderTextColor={colors.text.placeholder}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>

        <Pressable
          accessibilityLabel="Abrir perfil"
          accessibilityRole="button"
          style={styles.avatarButton}
          onPress={onOpenProfile}
        >
          <UserAvatar avatarUrl={userAvatar} name={userName} size={44} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  avatarButton: {
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    elevation: 3,
    shadowColor: colors.surface.video,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  container: {
    backgroundColor: colors.brandGray,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchIcon: {
    left: 12,
    position: "absolute",
    zIndex: 1,
  },
  searchInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    height: 46,
    paddingLeft: 38,
    paddingRight: 12,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
});

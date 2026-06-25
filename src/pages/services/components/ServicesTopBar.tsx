import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { colors } from "@/theme/colors";

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
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.searchWrap}>
          <Ionicons
            color="#9CA3AF"
            name="search"
            size={18}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Busque por Categorias, no..."
            placeholderTextColor="#9CA3AF"
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

const styles = StyleSheet.create({
  avatarButton: {
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    elevation: 3,
    shadowColor: "#000000",
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
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
});

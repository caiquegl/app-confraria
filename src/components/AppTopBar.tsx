import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type AppTopBarProps = {
  hasUnreadNotifications?: boolean;
  locationLabel: string;
  onBack?: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchQuery: string;
  showBack?: boolean;
  /** Padding extra no topo. Não incluir safe area — o root layout já aplica. */
  topInset?: number;
  userAvatar: string | null;
  userName: string;
};

export function AppTopBar({
  hasUnreadNotifications = false,
  locationLabel,
  onBack,
  onOpenNotifications,
  onOpenProfile,
  onSearchChange,
  searchPlaceholder,
  searchQuery,
  showBack = false,
  topInset = 8,
  userAvatar,
  userName,
}: AppTopBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.topRow}>
        <View style={styles.locationRow}>
          <Ionicons color={colors.text.secondary} name="location-outline" size={14} />
          <Text numberOfLines={1} style={styles.locationText}>
            {locationLabel}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Abrir notificações"
          accessibilityRole="button"
          style={styles.notificationButton}
          onPress={onOpenNotifications}
        >
          <Ionicons color={colors.text.secondary} name="notifications-outline" size={20} />
          {hasUnreadNotifications ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
          </Pressable>
        ) : null}

        <View style={styles.searchWrap}>
          <Ionicons color={colors.text.muted} name="search" size={20} style={styles.searchIcon} />
          <TextInput
            placeholder={searchPlaceholder}
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
          <UserAvatar avatarUrl={userAvatar} name={userName} size={48} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarButton: {
    borderColor: colors.surface.primary,
    borderRadius: 999,
    borderWidth: 2,
    overflow: "hidden",
    shadowColor: colors.surface.video,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  container: {
    backgroundColor: colors.brandGray,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  locationText: {
    color: colors.text.secondary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  notificationButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    position: "relative",
    width: 40,
  },
  searchIcon: {
    left: 14,
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  searchInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingLeft: 42,
    paddingRight: 14,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  unreadDot: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGray,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 8,
    top: 8,
    width: 10,
  },
});

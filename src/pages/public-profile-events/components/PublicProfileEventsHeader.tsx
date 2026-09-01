import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type PublicProfileEventsHeaderProps = {
  avatarUrl?: string | null;
  onBack: () => void;
  onAvatarPress: () => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
};

export function PublicProfileEventsHeader({
  avatarUrl,
  onBack,
  onAvatarPress,
  onSearchChange,
  searchQuery,
}: PublicProfileEventsHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.header, { paddingTop: 12 }]}>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
        <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
      </Pressable>

      <View style={styles.searchBox}>
        <Ionicons color={colors.text.muted} name="search-outline" size={20} />
        <TextInput
          placeholder="Busque por categoria..."
          placeholderTextColor={colors.text.placeholder}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <Pressable accessibilityRole="button" style={styles.avatarButton} onPress={onAvatarPress}>
        {avatarUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={avatarUrl}
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons color={colors.text.muted} name="person-outline" size={22} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  avatarButton: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.surface.primary,
    borderRadius: 24,
    borderWidth: 2,
    elevation: 2,
    height: 48,
    overflow: "hidden",
    shadowColor: colors.surface.video,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: 48,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    flex: 1,
    justifyContent: "center",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
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
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    padding: 0,
  },
});

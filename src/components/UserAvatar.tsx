import { Image } from "expo-image";
import { StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import { getUserInitials } from "@/lib/user-avatar";
import { colors } from "@/theme/colors";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function UserAvatar({ avatarUrl, name, size = 40, style }: UserAvatarProps) {
  const radius = size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.34));

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[{ borderRadius: radius, height: size, width: size }, style as StyleProp<ImageStyle>]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          borderRadius: radius,
          height: size,
          width: size,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getUserInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    justifyContent: "center",
  },
  initials: {
    color: colors.brandDark,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

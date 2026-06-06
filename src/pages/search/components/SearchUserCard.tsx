import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/UserAvatar";

import type { UserSearchResult } from "../types/search.types";

type SearchUserCardProps = {
  user: UserSearchResult;
  onPress: () => void;
};

export function SearchUserCard({ user, onPress }: SearchUserCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <UserAvatar avatarUrl={user.avatar} name={user.name} size={54} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {user.name}
        </Text>
        <Text numberOfLines={1} style={styles.handle}>
          {user.handle}
        </Text>
        {user.location ? (
          <View style={styles.locationRow}>
            <Ionicons color="#9CA3AF" name="location-outline" size={12} />
            <Text numberOfLines={1} style={styles.locationText}>
              {user.location}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons color="#D1D5DB" name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F3F4F6",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  handle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: "#9CA3AF",
    flex: 1,
    fontSize: 12,
  },
  name: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
});

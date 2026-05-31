import { StyleSheet, Text, View } from "react-native";

import { useApiEnvironment } from "@/hooks/useApiEnvironment";

export function EnvironmentBanner() {
  const { apiUrl, isHomolog } = useApiEnvironment();

  if (!isHomolog) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>AMBIENTE HOMOLOG</Text>
      <Text style={styles.url}>{apiUrl}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  url: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    marginTop: 2,
  },
});

import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { removeToken } from "@/lib/auth";
import { colors } from "@/theme/colors";

import { useHomeVersion } from "../business/useHomeVersion";

export function HomeView() {
  const updateInfo = useHomeVersion();

  const handleLogout = async () => {
    await removeToken();
    router.replace("/landing");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>home</Text>

      <View style={styles.versionCard}>
        <Text style={styles.versionTitle}>Versões</Text>
        <Text style={styles.versionRow}>
          App: <Text style={styles.versionValue}>{updateInfo.appVersion}</Text>
        </Text>
        <Text style={styles.versionRow}>
          OTA: <Text style={styles.versionValue}>{updateInfo.label}</Text>
        </Text>
        <Text style={styles.versionRow}>
          Canal: <Text style={styles.versionValue}>{updateInfo.channel}</Text>
        </Text>
        <Text style={styles.versionRow}>
          Runtime: <Text style={styles.versionValue}>{updateInfo.runtimeVersion}</Text>
        </Text>
        {updateInfo.updatedAt && (
          <Text style={styles.versionMeta}>Atualizado em {updateInfo.updatedAt}</Text>
        )}
      </View>

      <Button variant="secondary" size="lg" style={styles.logoutButton} onPress={handleLogout}>
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoutButton: {
    marginTop: 24,
    width: "100%",
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "600",
  },
  versionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
  },
  versionMeta: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  versionRow: {
    color: "#6B7280",
    fontSize: 14,
  },
  versionTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  versionValue: {
    color: colors.brandDark,
    fontWeight: "600",
  },
});

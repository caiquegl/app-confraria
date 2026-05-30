import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { removeToken } from "@/lib/auth";
import { colors } from "@/theme/colors";

export default function ProfileScreen() {
  const handleLogout = async () => {
    await removeToken();
    router.replace("/landing");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
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
});

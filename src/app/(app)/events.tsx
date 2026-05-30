import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: colors.brandDark,
    fontSize: 24,
    fontWeight: "600",
  },
});

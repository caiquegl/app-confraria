import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppColors, useTheme, useThemedStyles } from "@/theme";

type EventEditLayoutProps = {
  children: React.ReactNode;
  footer: React.ReactNode;
  onBack: () => void;
};

export function EventEditLayout({ children, footer, onBack }: EventEditLayoutProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.title}>Editar evento</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      >
        {children}
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {footer}
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
  flex: {
    flex: 1,
  },
  footer: {
    backgroundColor: colors.surface.primary,
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.brandGray,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  headerSpacer: {
    width: 48,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
  },
});

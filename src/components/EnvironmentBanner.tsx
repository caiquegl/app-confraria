import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, Text, View } from "react-native";

import { useApiEnvironment } from "@/hooks/useApiEnvironment";

export const ENVIRONMENT_BANNER_BODY_HEIGHT = 38;

type EnvironmentBannerContextValue = {
  setSuppressed: (suppressed: boolean) => void;
  suppressed: boolean;
};

const EnvironmentBannerContext = createContext<EnvironmentBannerContextValue | null>(null);

export function EnvironmentBannerProvider({ children }: { children: ReactNode }) {
  const [suppressed, setSuppressedState] = useState(false);

  const setSuppressed = useCallback((value: boolean) => {
    setSuppressedState(value);
  }, []);

  const value = useMemo(
    () => ({
      setSuppressed,
      suppressed,
    }),
    [setSuppressed, suppressed],
  );

  return (
    <EnvironmentBannerContext.Provider value={value}>{children}</EnvironmentBannerContext.Provider>
  );
}

export function useEnvironmentBannerSuppression() {
  const context = useContext(EnvironmentBannerContext);

  if (!context) {
    throw new Error("useEnvironmentBannerSuppression must be used within EnvironmentBannerProvider");
  }

  return context;
}

export function useEnvironmentBannerInset(): number {
  const { isHomolog } = useApiEnvironment();

  // Always reserve space on homolog so suppressing the banner never
  // resizes the screen (MapView camera jumps if the parent height changes).
  if (!isHomolog) {
    return 0;
  }

  return ENVIRONMENT_BANNER_BODY_HEIGHT;
}

export function EnvironmentBanner() {
  const { apiUrl, isHomolog } = useApiEnvironment();
  const { suppressed } = useEnvironmentBannerSuppression();

  if (!isHomolog) {
    return null;
  }

  return (
    <>
      <View style={styles.spacer} />
      {suppressed ? null : (
        <View pointerEvents="none" style={styles.banner}>
          <Text style={styles.text}>AMBIENTE HOMOLOG</Text>
          <Text style={styles.url}>{apiUrl}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    elevation: 100,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 100,
  },
  spacer: {
    height: ENVIRONMENT_BANNER_BODY_HEIGHT,
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

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

const MESSAGES = [
  "Aquecendo os motores...",
  "Mapeando as melhores curvas para você...",
  "Sintonizando com a Confraria...",
  "Tudo pronto para a estrada!",
];

const STEP_INTERVAL_MS = 1200;
const COMPLETE_DELAY_MS = 1000;

const STEP_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  "flash",
  "map",
  "bicycle",
  "shield-checkmark",
];

export type PreparingProfileProps = {
  visible: boolean;
  userName: string;
  onComplete: () => void;
};

export function PreparingProfile({ onComplete, userName, visible }: PreparingProfileProps) {
  const [step, setStep] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setStep(0);
      spin.setValue(0);
      progress.setValue(0);
      pulse.setValue(1);
      completedRef.current = false;
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      return;
    }

    completedRef.current = false;

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        duration: 3000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 800,
          toValue: 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 800,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    spinLoop.start();
    pulseLoop.start();

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= MESSAGES.length - 1) {
          clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            completeTimeoutRef.current = setTimeout(onComplete, COMPLETE_DELAY_MS);
          }
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      spinLoop.stop();
      pulseLoop.stop();
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, [onComplete, progress, pulse, spin, visible]);

  useEffect(() => {
    if (!visible) return;

    Animated.timing(progress, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
      toValue: (step + 1) / MESSAGES.length,
      useNativeDriver: false,
    }).start();
  }, [progress, step, visible]);

  const spinRotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const iconName = STEP_ICONS[step] ?? "flash";

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spinRotation }] }]}>
              <View style={styles.spinnerRing} />
            </Animated.View>
            <View style={styles.iconCenter}>
              <Ionicons color={colors.brandGreen} name={iconName} size={40} />
            </View>
          </View>

          <Text style={styles.title}>Segura aí, {userName}!</Text>
          <Animated.Text style={[styles.message, { opacity: pulse }]}>
            {MESSAGES[step]}
          </Animated.Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCenter: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  iconWrapper: {
    height: 96,
    marginBottom: 48,
    width: 96,
  },
  message: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  overlay: {
    backgroundColor: colors.brandDark,
    flex: 1,
  },
  progressFill: {
    backgroundColor: colors.brandGreen,
    height: "100%",
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    height: 4,
    marginBottom: 48,
    marginHorizontal: 48,
    overflow: "hidden",
  },
  spinner: {
    height: 96,
    width: 96,
  },
  spinnerRing: {
    borderColor: "rgba(200, 247, 99, 0.2)",
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    width: 96,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import {
  DISTANCE_MAX_STEP,
  DISTANCE_STEPS,
  formatDistanceStep,
} from "../utils/events-filters.utils";

const THUMB_SIZE = 24;
const THUMB_HIT_SLOP = 12;

type DistanceRangeSliderProps = {
  onChange: (range: [number, number]) => void;
  value: [number, number];
};

export function DistanceRangeSlider({ onChange, value }: DistanceRangeSliderProps) {
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const trackRef = useRef<View>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [onChange, value]);

  const [trackWidth, setTrackWidth] = useState(0);
  const [minPanHandlers, setMinPanHandlers] = useState<Record<string, unknown> | null>(null);
  const [maxPanHandlers, setMaxPanHandlers] = useState<Record<string, unknown> | null>(null);

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((pageX) => {
      trackPageXRef.current = pageX;
    });
  }, []);

  const getThumbLeft = useCallback((step: number, width: number) => {
    if (width <= THUMB_SIZE) {
      return 0;
    }

    const usable = width - THUMB_SIZE;
    return (step / DISTANCE_MAX_STEP) * usable;
  }, []);

  const stepFromPageX = useCallback((pageX: number) => {
    const locationX = pageX - trackPageXRef.current;
    const usable = Math.max(trackWidthRef.current - THUMB_SIZE, 1);
    const ratio = Math.min(1, Math.max(0, (locationX - THUMB_SIZE / 2) / usable));
    return Math.round(ratio * DISTANCE_MAX_STEP);
  }, []);

  const moveThumb = useCallback((thumb: 0 | 1, nextStep: number) => {
    const current = valueRef.current;
    const step = Math.min(DISTANCE_MAX_STEP, Math.max(0, nextStep));
    const next: [number, number] =
      thumb === 0
        ? [Math.min(step, current[1]), current[1]]
        : [current[0], Math.max(step, current[0])];

    if (next[0] !== current[0] || next[1] !== current[1]) {
      onChangeRef.current(next);
    }
  }, []);

  useEffect(() => {
    const minResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        measureTrack();
        moveThumb(0, stepFromPageX(event.nativeEvent.pageX));
      },
      onPanResponderMove: (event) => {
        moveThumb(0, stepFromPageX(event.nativeEvent.pageX));
      },
      onStartShouldSetPanResponder: () => true,
    });

    const maxResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        measureTrack();
        moveThumb(1, stepFromPageX(event.nativeEvent.pageX));
      },
      onPanResponderMove: (event) => {
        moveThumb(1, stepFromPageX(event.nativeEvent.pageX));
      },
      onStartShouldSetPanResponder: () => true,
    });

    const timeout = setTimeout(() => {
      setMinPanHandlers(minResponder.panHandlers as unknown as Record<string, unknown>);
      setMaxPanHandlers(maxResponder.panHandlers as unknown as Record<string, unknown>);
    }, 0);

    return () => clearTimeout(timeout);
  }, [measureTrack, moveThumb, stepFromPageX]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
    setTrackWidth(event.nativeEvent.layout.width);
    measureTrack();
  };

  const minThumbLeft = getThumbLeft(value[0], trackWidth);
  const maxThumbLeft = getThumbLeft(value[1], trackWidth);

  return (
    <View style={styles.container}>
      <View ref={trackRef} style={styles.trackWrap} onLayout={handleTrackLayout}>
        <View pointerEvents="none" style={styles.track} />
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              left: minThumbLeft + THUMB_SIZE / 2,
              right: trackWidth - maxThumbLeft - THUMB_SIZE / 2,
            },
          ]}
        />

        <View
          style={[
            styles.thumbHitArea,
            {
              left: minThumbLeft - THUMB_HIT_SLOP,
            },
          ]}
          {...(minPanHandlers ?? {})}
        >
          <View style={styles.thumb} />
        </View>

        <View
          style={[
            styles.thumbHitArea,
            {
              left: maxThumbLeft - THUMB_HIT_SLOP,
            },
          ]}
          {...(maxPanHandlers ?? {})}
        >
          <View style={styles.thumb} />
        </View>
      </View>

      <View style={styles.labels}>
        {DISTANCE_STEPS.map((stepKm, index) => (
          <Text key={stepKm} style={styles.label}>
            {index === DISTANCE_MAX_STEP ? "1000+" : stepKm}
          </Text>
        ))}
      </View>
    </View>
  );
}

export { formatDistanceStep };

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  fill: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 6,
    position: "absolute",
    top: 9,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginLeft: 10
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.brandGreen,
    borderRadius: 999,
    borderWidth: 2,
    height: THUMB_SIZE,
    width: THUMB_SIZE,
  },
  thumbHitArea: {
    alignItems: "center",
    height: THUMB_SIZE + THUMB_HIT_SLOP * 2,
    justifyContent: "center",
    position: "absolute",
    top: -THUMB_HIT_SLOP,
    width: THUMB_SIZE + THUMB_HIT_SLOP * 2,
  },
  track: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 6,
    marginTop: 9,
  },
  trackWrap: {
    height: THUMB_SIZE,
    position: "relative",
  },
});

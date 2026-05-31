import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_PADDING = 32;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;
const MEDIA_HEIGHT = Math.round(CARD_WIDTH * 0.56);

type FeedMediaCarouselProps = {
  photos: string[];
  title: string;
};

export function FeedMediaCarousel({ photos, title }: FeedMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (photos.length === 0) return null;

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, photos.length - 1));
    scrollRef.current?.scrollTo({ animated: true, x: CARD_WIDTH * clamped });
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(nextIndex);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {photos.map((photo, index) => (
          <Image
            key={`${photo}-${index}`}
            source={{ uri: photo }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={`${title} ${index + 1}`}
          />
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <>
          <View style={styles.dots}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotIdle]}
              />
            ))}
          </View>

          {activeIndex > 0 && (
            <Pressable
              style={[styles.arrow, styles.arrowLeft]}
              hitSlop={8}
              onPress={() => scrollToIndex(activeIndex - 1)}
            >
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
          )}

          {activeIndex < photos.length - 1 && (
            <Pressable
              style={[styles.arrow, styles.arrowRight]}
              hitSlop={8}
              onPress={() => scrollToIndex(activeIndex + 1)}
            >
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    width: 36,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  dot: {
    borderRadius: 999,
    height: 6,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 20,
  },
  dotIdle: {
    backgroundColor: "rgba(255,255,255,0.55)",
    width: 6,
  },
  dots: {
    alignItems: "center",
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  image: {
    height: MEDIA_HEIGHT,
    width: CARD_WIDTH,
  },
  wrapper: {
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
});

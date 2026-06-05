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
const DEFAULT_MEDIA_HEIGHT = Math.round(CARD_WIDTH * 0.75);

type FeedMediaCarouselProps = {
  onDoublePress?: () => void;
  photos: string[];
  title: string;
};

function resolveImageHeight(width: number, height: number): number {
  if (!width || !height) return DEFAULT_MEDIA_HEIGHT;
  return Math.round((CARD_WIDTH / width) * height);
}

export function FeedMediaCarousel({ onDoublePress, photos, title }: FeedMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});
  const scrollRef = useRef<ScrollView>(null);
  const lastPressAtRef = useRef(0);

  if (photos.length === 0) return null;

  const activeHeight = imageHeights[activeIndex] ?? DEFAULT_MEDIA_HEIGHT;

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, photos.length - 1));
    scrollRef.current?.scrollTo({ animated: true, x: CARD_WIDTH * clamped });
    setActiveIndex(clamped);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(nextIndex);
  };

  const handleImageLoad = (index: number, width?: number | null, height?: number | null) => {
    if (!width || !height) return;

    setImageHeights((current) => ({
      ...current,
      [index]: resolveImageHeight(width, height),
    }));
  };

  const handlePhotoPress = () => {
    const now = Date.now();

    if (now - lastPressAtRef.current < 280) {
      lastPressAtRef.current = 0;
      onDoublePress?.();
      return;
    }

    lastPressAtRef.current = now;
  };

  return (
    <View style={[styles.wrapper, { height: activeHeight }]}>
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
        {photos.map((photo, index) => {
          const slideHeight = imageHeights[index] ?? activeHeight;

          return (
            <Pressable
              key={`${photo}-${index}`}
              accessibilityLabel={`Foto ${index + 1} de ${title}. Toque duas vezes para curtir ou descurtir.`}
              accessibilityRole="imagebutton"
              style={[styles.slide, { height: slideHeight }]}
              onPress={handlePhotoPress}
            >
              <Image
                source={{ uri: photo }}
                style={[styles.image, { height: slideHeight }]}
                cachePolicy="memory-disk"
                contentFit="contain"
                recyclingKey={photo}
                onLoad={({ source }) => handleImageLoad(index, source.width, source.height)}
              />
            </Pressable>
          );
        })}
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
    backgroundColor: "#E5E7EB",
    width: CARD_WIDTH,
  },
  slide: {
    width: CARD_WIDTH,
  },
  wrapper: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
});

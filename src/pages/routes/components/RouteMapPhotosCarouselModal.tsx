import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import type { RoutePhoto } from "../types/route-photo.types";

type RouteMapPhotosCarouselModalProps = {
  photos: RoutePhoto[];
  visible: boolean;
  onClose: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function RouteMapPhotosCarouselModal({
  photos,
  visible,
  onClose,
}: RouteMapPhotosCarouselModalProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<RoutePhoto>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedPhotos = useMemo(
    () =>
      [...photos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [photos],
  );

  useEffect(() => {
    if (!visible) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });
  }, [visible, orderedPhotos]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === "number") {
        setActiveIndex(index);
      }
    },
  ).current;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const activePhoto = orderedPhotos[activeIndex];

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons color={colors.text.inverse} name="close" size={22} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Fotos no mapa</Text>
            <Text style={styles.headerSubtitle}>
              {orderedPhotos.length} {orderedPhotos.length === 1 ? "foto" : "fotos"} neste ponto
            </Text>
          </View>
          <View style={styles.closeButtonPlaceholder} />
        </View>

        <FlatList
          ref={listRef}
          horizontal
          data={orderedPhotos}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.list}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onMomentumScrollEnd={handleMomentumEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                cachePolicy="memory-disk"
                contentFit="contain"
                recyclingKey={item.id}
                source={{ uri: item.url }}
                style={styles.photo}
              />
            </View>
          )}
        />

        {activePhoto ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.author}>{activePhoto.userName}</Text>
            <Text style={styles.counter}>
              {activeIndex + 1}/{orderedPhotos.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  author: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: "700",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.94)",
    flex: 1,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  closeButtonPlaceholder: {
    height: 40,
    width: 40,
  },
  counter: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  headerTextWrap: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  photo: {
    flex: 1,
    width: "100%",
  },
  slide: {
    flex: 1,
    paddingHorizontal: 12,
    width: SCREEN_WIDTH,
  },
});

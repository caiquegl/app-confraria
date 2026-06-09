import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { colors } from "@/theme/colors";

type EventDetailGalleryProps = {
  imageUrls: string[];
};

export function EventDetailGallery({ imageUrls }: EventDetailGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (imageUrls.length === 0) return null;

  const selectedImageUrl = selectedIndex !== null ? imageUrls[selectedIndex] : null;
  const hasMultipleImages = imageUrls.length > 1;

  const goToPreviousImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + imageUrls.length) % imageUrls.length);
  };

  const goToNextImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % imageUrls.length);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Galeria</Text>
      <View style={styles.grid}>
        {imageUrls.map((imageUrl, index) => (
          <Pressable
            key={`${imageUrl}-${index}`}
            accessibilityRole="imagebutton"
            style={styles.imageWrap}
            onPress={() => setSelectedIndex(index)}
          >
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={imageUrl}
              source={{ uri: imageUrl }}
              style={styles.image}
            />
          </Pressable>
        ))}
      </View>

      <Modal transparent visible={Boolean(selectedImageUrl)} animationType="fade">
        <View style={styles.previewBackdrop}>
          <Pressable
            accessibilityRole="button"
            style={styles.previewCloseButton}
            onPress={() => setSelectedIndex(null)}
          >
            <Ionicons color="#FFFFFF" name="close" size={24} />
          </Pressable>

          {selectedImageUrl ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              recyclingKey={`preview-${selectedImageUrl}`}
              source={{ uri: selectedImageUrl }}
              style={styles.previewImage}
            />
          ) : null}

          {hasMultipleImages ? (
            <>
              <Pressable
                accessibilityRole="button"
                style={[styles.previewNavButton, styles.previewPrevButton]}
                onPress={goToPreviousImage}
              >
                <Ionicons color="#FFFFFF" name="chevron-back" size={28} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.previewNavButton, styles.previewNextButton]}
                onPress={goToNextImage}
              >
                <Ionicons color="#FFFFFF" name="chevron-forward" size={28} />
              </Pressable>
            </>
          ) : null}

          {selectedIndex !== null ? (
            <Text style={styles.previewCounter}>
              {selectedIndex + 1} / {imageUrls.length}
            </Text>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
    width: "32%",
  },
  previewBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  previewCloseButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 54,
    width: 44,
    zIndex: 2,
  },
  previewCounter: {
    bottom: 52,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    position: "absolute",
  },
  previewImage: {
    height: "82%",
    width: "100%",
  },
  previewNavButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    width: 48,
  },
  previewNextButton: {
    right: 18,
  },
  previewPrevButton: {
    left: 18,
  },
  title: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { EventCoverImagePicker } from "@/pages/event-create/components/EventCoverImagePicker";
import { colors } from "@/theme/colors";

import type { RouteThumbnailType } from "../types/saved-route.types";

type RouteCoverPickerProps = {
  /** Padding e preview menores (rota rápida na home). */
  compact?: boolean;
  coverImageUri: string;
  onCoverImageChange: (uri: string) => void;
  onRemoveCover: () => void;
  onThumbnailTypeChange: (type: RouteThumbnailType) => void;
  style?: StyleProp<ViewStyle>;
  thumbnailType: RouteThumbnailType;
};

export function RouteCoverPicker({
  compact = false,
  coverImageUri,
  onCoverImageChange,
  onRemoveCover,
  onThumbnailTypeChange,
  style,
  thumbnailType,
}: RouteCoverPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePickCover = (uri: string) => {
    onCoverImageChange(uri);
    onThumbnailTypeChange("image");
  };

  const handleRemoveCover = () => {
    onRemoveCover();
    onThumbnailTypeChange("map");
  };

  const summaryLabel = thumbnailType === "image" ? "Foto" : "Traçado";

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={styles.collapseHeader}
        onPress={() => setIsExpanded((current) => !current)}
      >
        <View style={styles.collapseCopy}>
          <Text style={styles.title}>Capa da rota</Text>
          {!isExpanded ? (
            <Text style={styles.collapseSummary}>{summaryLabel}</Text>
          ) : null}
        </View>
        <Ionicons
          color="#9CA3AF"
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
        />
      </Pressable>

      {isExpanded ? (
        <>
          <View style={styles.typeSwitch}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: thumbnailType === "map" }}
              style={[styles.typeOption, thumbnailType === "map" && styles.typeOptionActive]}
              onPress={() => onThumbnailTypeChange("map")}
            >
              <Ionicons
                color={thumbnailType === "map" ? colors.brandDark : "#6B7280"}
                name="map-outline"
                size={16}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  thumbnailType === "map" && styles.typeOptionTextActive,
                ]}
              >
                Traçado
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: thumbnailType === "image" }}
              style={[styles.typeOption, thumbnailType === "image" && styles.typeOptionActive]}
              onPress={() => onThumbnailTypeChange("image")}
            >
              <Ionicons
                color={thumbnailType === "image" ? colors.brandDark : "#6B7280"}
                name="image-outline"
                size={16}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  thumbnailType === "image" && styles.typeOptionTextActive,
                ]}
              >
                Foto
              </Text>
            </Pressable>
          </View>

          {thumbnailType === "image" ? (
            <EventCoverImagePicker
              imageUri={coverImageUri}
              onChange={handlePickCover}
              onRemove={handleRemoveCover}
            />
          ) : (
            <View style={[styles.mapPreview, compact && styles.mapPreviewCompact]}>
              <Ionicons color="#728F21" name="navigate-outline" size={compact ? 22 : 28} />
              <Text style={styles.mapPreviewText}>Mini traçado do mapa no card da rota</Text>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  collapseCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  collapseHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  collapseSummary: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  containerCompact: {
    padding: 12,
  },
  mapPreview: {
    alignItems: "center",
    backgroundColor: "#EEF2EA",
    borderRadius: 16,
    gap: 8,
    justifyContent: "center",
    minHeight: 120,
    padding: 16,
  },
  mapPreviewCompact: {
    minHeight: 88,
    padding: 12,
  },
  mapPreviewText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  title: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  typeOption: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 10,
  },
  typeOptionActive: {
    backgroundColor: colors.brandGreen,
  },
  typeOptionText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  typeOptionTextActive: {
    color: colors.brandDark,
    fontWeight: "800",
  },
  typeSwitch: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
});

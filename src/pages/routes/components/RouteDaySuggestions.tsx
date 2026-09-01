import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  buildPlacePhotoSource,
  type RouteDaySuggestionAlert,
  type RouteStopSuggestion,
} from "@/lib/places";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { RouteDraftDay } from "../types/route-create.types";
import { isSuggestionAddedToDay } from "../utils/route-suggestions.utils";

export const SUGGESTION_CARD_WIDTH = 208;
export const SUGGESTION_CAROUSEL_HEIGHT = 272;

type RouteDaySuggestionsProps = {
  alert: RouteDaySuggestionAlert | null;
  day: RouteDraftDay;
  dayLabel: string;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onAddSuggestion: (suggestion: RouteStopSuggestion) => void;
  onLoadMore?: () => void;
  onScrollBegin?: () => void;
  onScrollEnd?: () => void;
  suggestions: RouteStopSuggestion[];
};

function SuggestionPhoto({
  photoName,
  variant = "card",
}: {
  photoName: string | null;
  variant?: "card" | "sheet";
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [source, setSource] = useState<{ headers?: { Authorization: string }; uri: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void buildPlacePhotoSource(photoName).then((nextSource) => {
      if (!cancelled) {
        setSource(nextSource);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [photoName]);

  if (!source) {
    return (
      <View
        style={[
          styles.photoPlaceholder,
          variant === "sheet" ? styles.sheetPhotoPlaceholder : null,
        ]}
      >
        <Ionicons color={colors.text.muted} name="image-outline" size={28} />
      </View>
    );
  }

  return (
    <Image
      contentFit="cover"
      source={source}
      style={[styles.photo, variant === "sheet" ? styles.sheetPhoto : null]}
    />
  );
}

function AlertBadge({ alert }: { alert: RouteDaySuggestionAlert }) {
  const styles = useThemedStyles(createStyles);
  const isWarning = alert.tone === "warning";

  return (
    <View style={[styles.alertBadge, isWarning ? styles.alertWarning : styles.alertInfo]}>
      <Text style={[styles.alertText, isWarning ? styles.alertWarningText : styles.alertInfoText]}>
        {alert.title}
      </Text>
    </View>
  );
}

type SuggestionDetailModalProps = {
  dayLabel: string;
  onAdd: () => void;
  onClose: () => void;
  suggestion: RouteStopSuggestion | null;
  isAdded: boolean;
};

function SuggestionDetailModal({
  dayLabel,
  isAdded,
  onAdd,
  onClose,
  suggestion,
}: SuggestionDetailModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  if (!suggestion) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      statusBarTranslucent
      transparent
      visible
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <SuggestionPhoto photoName={suggestion.photoName} variant="sheet" />
          <View style={styles.modalBody}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{suggestion.name}</Text>
              {suggestion.rating != null ? (
                <View style={styles.ratingRow}>
                  <Ionicons color={colors.rating.star} name="star" size={12} />
                  <Text style={styles.ratingText}>{suggestion.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.modalMeta}>
              {suggestion.typeLabel} • km {suggestion.kmFromDayOrigin}
            </Text>
            <Text style={styles.modalDescription}>{suggestion.description}</Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.modalDetailsButton}
                onPress={onClose}
              >
                <Text style={styles.modalDetailsButtonText}>Fechar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isAdded}
                style={[styles.modalAddButton, isAdded && styles.addButtonAdded]}
                onPress={onAdd}
              >
                <Text style={[styles.modalAddButtonText, isAdded && styles.addButtonTextAdded]}>
                  {isAdded ? "Na rota" : `+ ${dayLabel}`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SuggestionCard({
  day,
  dayLabel,
  onAddSuggestion,
  onOpenDetails,
  suggestion,
}: {
  day: RouteDraftDay;
  dayLabel: string;
  onAddSuggestion: (suggestion: RouteStopSuggestion) => void;
  onOpenDetails: (suggestion: RouteStopSuggestion) => void;
  suggestion: RouteStopSuggestion;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAdded = isSuggestionAddedToDay(suggestion, day);

  return (
    <View style={[styles.card, isAdded ? styles.cardAdded : styles.cardDefault]}>
      <SuggestionPhoto photoName={suggestion.photoName} />
      <View style={styles.cardTitleRow}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {suggestion.name}
        </Text>
        {suggestion.rating != null ? (
          <View style={styles.ratingRow}>
            <Ionicons color={colors.rating.star} name="star" size={10} />
            <Text style={styles.ratingTextSmall}>{suggestion.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardMeta}>
        {suggestion.typeLabel} • km {suggestion.kmFromDayOrigin}
      </Text>
      <Text numberOfLines={2} style={styles.cardDescription}>
        {suggestion.description}
      </Text>
      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          style={styles.detailsButton}
          onPress={() => onOpenDetails(suggestion)}
        >
          <Text style={styles.detailsButtonText}>Ver detalhes</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isAdded}
          style={[styles.addButton, isAdded && styles.addButtonAdded]}
          onPress={() => onAddSuggestion(suggestion)}
        >
          <Text style={[styles.addButtonText, isAdded && styles.addButtonTextAdded]}>
            {isAdded ? "Na rota" : `+ ${dayLabel}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingMoreCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.loadingMoreCard}>
      <ActivityIndicator color={colors.brandDark} size="small" />
      <Text style={styles.loadingMoreText}>Carregando...</Text>
    </View>
  );
}

export function RouteDaySuggestions({
  alert,
  day,
  dayLabel,
  hasMore,
  isLoading,
  isLoadingMore,
  onAddSuggestion,
  onLoadMore,
  onScrollBegin,
  onScrollEnd,
  suggestions,
}: RouteDaySuggestionsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RouteStopSuggestion | null>(null);
  const loadMoreRequestedRef = useRef(false);

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreRequestedRef.current = false;
    }
  }, [isLoadingMore]);

  const handleScrollEnd = () => {
    onScrollEnd?.();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMore || isLoadingMore || !onLoadMore || loadMoreRequestedRef.current) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromEnd = contentSize.width - (contentOffset.x + layoutMeasurement.width);

    if (distanceFromEnd <= 48) {
      loadMoreRequestedRef.current = true;
      onLoadMore();
    }
  };

  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sugestões de paradas</Text>
        {alert ? <AlertBadge alert={alert} /> : null}
      </View>

      {isLoading && suggestions.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.brandDark} size="small" />
          <Text style={styles.loadingText}>Buscando sugestões na rota...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          contentContainerStyle={styles.carouselContent}
          directionalLockEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          onMomentumScrollEnd={handleScrollEnd}
          onScroll={handleScroll}
          onScrollBeginDrag={() => onScrollBegin?.()}
          onScrollEndDrag={handleScrollEnd}
        >
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              day={day}
              dayLabel={dayLabel}
              suggestion={suggestion}
              onAddSuggestion={onAddSuggestion}
              onOpenDetails={setSelectedSuggestion}
            />
          ))}
          {isLoadingMore ? <LoadingMoreCard /> : null}
        </ScrollView>
      )}

      <SuggestionDetailModal
        dayLabel={dayLabel}
        isAdded={selectedSuggestion ? isSuggestionAddedToDay(selectedSuggestion, day) : false}
        suggestion={selectedSuggestion}
        onAdd={() => {
          if (!selectedSuggestion) return;
          onAddSuggestion(selectedSuggestion);
          setSelectedSuggestion(null);
        }}
        onClose={() => setSelectedSuggestion(null)}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => ({
  addButton: {
    backgroundColor: colors.accent.brand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addButtonAdded: {
    backgroundColor: colors.surface.successSubtle,
  },
  addButtonText: {
    color: colors.text.onBrand,
    fontSize: 10,
    fontWeight: "700",
  },
  addButtonTextAdded: {
    color: "#15803D",
  },
  alertBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertInfo: {
    backgroundColor: "#E0F2FE",
  },
  alertInfoText: {
    color: "#0369A1",
  },
  alertText: {
    fontSize: 10,
    fontWeight: "700",
  },
  alertWarning: {
    backgroundColor: "#FFFBEB",
  },
  alertWarningText: {
    color: "#B45309",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    padding: 12,
    width: SUGGESTION_CARD_WIDTH,
  },
  cardActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  cardAdded: {
    backgroundColor: "rgba(240, 253, 244, 0.7)",
    borderColor: "#BBF7D0",
  },
  cardDefault: {
    backgroundColor: "#FAFBF8",
    borderColor: colors.border.subtle,
  },
  cardDescription: {
    color: colors.text.secondary,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12,
    minHeight: 28,
  },
  cardMeta: {
    color: colors.text.secondary,
    fontSize: 10,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
    marginTop: 8,
  },
  carousel: {
    flexGrow: 0,
    height: SUGGESTION_CAROUSEL_HEIGHT,
    marginHorizontal: -16,
  },
  carouselContent: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingRight: 4,
  },
  detailsButton: {
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailsButtonText: {
    color: colors.text.comment,
    fontSize: 10,
    fontWeight: "700",
  },
  loadingMoreCard: {
    alignItems: "center",
    backgroundColor: "#FAFBF8",
    borderColor: colors.border.subtle,
    borderRadius: 20,
    borderWidth: 1,
    height: SUGGESTION_CAROUSEL_HEIGHT - 8,
    justifyContent: "center",
    marginRight: 12,
    width: 120,
  },
  loadingMoreText: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 8,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  modalAddButton: {
    backgroundColor: colors.accent.brand,
    borderRadius: 999,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalAddButtonText: {
    color: colors.text.onBrand,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalCard: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    width: "100%",
  },
  modalDescription: {
    color: colors.text.comment,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  modalDetailsButton: {
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalDetailsButtonText: {
    color: colors.text.comment,
    fontSize: 14,
    fontWeight: "700",
  },
  modalMeta: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },
  modalTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  photo: {
    borderRadius: 12,
    height: 112,
    width: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 12,
    height: 112,
    justifyContent: "center",
    width: "100%",
  },
  sheetPhoto: {
    borderRadius: 0,
    height: 200,
    width: "100%",
  },
  sheetPhotoPlaceholder: {
    borderRadius: 0,
    height: 200,
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    color: colors.rating.star,
    fontSize: 12,
    fontWeight: "700",
  },
  ratingTextSmall: {
    color: colors.rating.star,
    fontSize: 10,
    fontWeight: "700",
  },
  section: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});

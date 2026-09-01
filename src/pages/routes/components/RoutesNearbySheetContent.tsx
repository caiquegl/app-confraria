import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { NearbyPlace } from "@/pages/services/types/services.types";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import type { RoutesSheetDetent } from "./RoutesHomeBottomSheet";
import { NearbyCategoryIcon } from "./NearbyCategoryIcon";
import type { SavedRoute } from "../types/saved-route.types";
import { sortNearbyPlacesByPriority } from "../utils/nearby-places.utils";

type NearbyCategoryFilter = "all" | "Postos de Gasolina" | "Mecânicas" | "Restaurantes" | "Hotéis";

const ADDRESS_MAX_CHARS = 28;

function truncateAddress(address: string | null | undefined): string {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const value = address?.trim();
  if (!value) return " ";
  if (value.length <= ADDRESS_MAX_CHARS) return value;
  return `${value.slice(0, ADDRESS_MAX_CHARS - 1).trimEnd()}…`;
}

const CATEGORY_FILTERS: { key: NearbyCategoryFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "Postos de Gasolina", label: "Postos" },
  { key: "Mecânicas", label: "Oficinas" },
  { key: "Restaurantes", label: "Restaurantes" },
  { key: "Hotéis", label: "Hotéis" },
];

type RoutesNearbySheetContentProps = {
  category: NearbyCategoryFilter;
  detent: RoutesSheetDetent;
  isLoadingNearby: boolean;
  locationBlocked: boolean;
  locationPending: boolean;
  onCategoryChange: (category: NearbyCategoryFilter) => void;
  onPartnerPress: (place: NearbyPlace) => void;
  onRequestLocation: () => void;
  partners: NearbyPlace[];
  recentRoutes: SavedRoute[];
};

export function RoutesNearbySheetContent({
  category,
  detent,
  isLoadingNearby,
  locationBlocked,
  locationPending,
  onCategoryChange,
  onPartnerPress,
  onRequestLocation,
  partners,
  recentRoutes,
}: RoutesNearbySheetContentProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const showFilters = detent === "expanded";
  const showRecent = detent !== "collapsed";

  const filteredPartners = sortNearbyPlacesByPriority(
    category === "all"
      ? partners
      : partners.filter((place) => place.category === category),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      scrollEnabled={detent === "expanded"}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.shortcutsRow}>
        <Pressable
          accessibilityRole="button"
          style={styles.shortcutCard}
          onPress={() => router.push("/routes/explore" as Href)}
        >
          <View style={styles.shortcutIcon}>
            <Ionicons color={colors.brandPrimary} name="compass-outline" size={17} />
          </View>
          <View style={styles.shortcutCopy}>
            <Text style={styles.shortcutTitle}>Explorar rotas</Text>
            <Text style={styles.shortcutSubtitle}>Da comunidade</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.shortcutCard}
          onPress={() => router.push("/routes/mine" as Href)}
        >
          <View style={styles.shortcutIcon}>
            <Ionicons color={colors.brandPrimary} name="bookmark-outline" size={17} />
          </View>
          <View style={styles.shortcutCopy}>
            <Text style={styles.shortcutTitle}>Minhas rotas</Text>
            <Text style={styles.shortcutSubtitle}>Salvas e planejadas</Text>
          </View>
        </Pressable>
      </View>

      {locationBlocked ? (
        <View style={styles.locationBlocked}>
          <Ionicons color={colors.text.muted} name="location-outline" size={22} />
          <Text style={styles.locationBlockedTitle}>Ative a localização</Text>
          <Text style={styles.locationBlockedText}>
            Precisamos da sua localização para montar trajetos a partir de onde você está.
          </Text>
          <Pressable accessibilityRole="button" style={styles.locationButton} onPress={onRequestLocation}>
            <Text style={styles.locationButtonText}>Permitir localização</Text>
          </Pressable>
        </View>
      ) : null}

      {locationPending ? (
        <View style={styles.locationPending}>
          <ActivityIndicator color={colors.text.muted} size="small" />
          <Text style={styles.locationPendingText}>Localizando você…</Text>
        </View>
      ) : null}

      {!locationBlocked && !locationPending ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Por perto</Text>
            <Text style={styles.sectionSubtitle}>
              Postos, oficinas e paradas perto de você
            </Text>
          </View>

          {showFilters ? (
            <ScrollView
              horizontal
              contentContainerStyle={styles.filtersRow}
              showsHorizontalScrollIndicator={false}
            >
              {CATEGORY_FILTERS.map((item) => {
                const active = category === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => onCategoryChange(item.key)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {isLoadingNearby ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.brandDark} size="small" />
            </View>
          ) : filteredPartners.length === 0 ? (
            <Text style={styles.emptyPartners}>
              Nenhum estabelecimento desta categoria por perto.
            </Text>
          ) : (
            <ScrollView
              horizontal
              contentContainerStyle={styles.partnersRow}
              showsHorizontalScrollIndicator={false}
            >
              {filteredPartners.map((place) => (
                <Pressable
                  key={place.googlePlaceId}
                  accessibilityRole="button"
                  style={styles.partnerCard}
                  onPress={() => onPartnerPress(place)}
                >
                  <View style={styles.partnerCardHeader}>
                    <View style={styles.partnerTypeRow}>
                      <NearbyCategoryIcon category={place.category} color={colors.text.muted} size={13} />
                      <Text style={styles.partnerType}>{place.category}</Text>
                    </View>
                    {place.isConfrariaPartner ? <View style={styles.partnerDot} /> : null}
                  </View>

                  <View style={styles.partnerCardBody}>
                    {place.isConfrariaPartner ? (
                      <Text style={styles.partnerBadge}>Parceiro Confraria</Text>
                    ) : null}
                    {place.isSponsored ? (
                      <Text style={styles.sponsoredBadge}>Patrocinado</Text>
                    ) : null}
                    <Text numberOfLines={2} style={styles.partnerName}>
                      {place.name}
                    </Text>
                    {place.googleRating != null ? (
                      <View style={styles.partnerMeta}>
                        <Ionicons color={colors.rating.star} name="star" size={11} />
                        <Text style={styles.partnerRating}>
                          {place.googleRating.toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.partnerOpen,
                        place.openNow === false && styles.partnerClosed,
                      ]}
                    >
                      {place.openNow == null
                        ? truncateAddress(place.address)
                        : place.openNow
                          ? "Aberto agora"
                          : "Fechado"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {showRecent && recentRoutes.length > 0 ? (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trajetos recentes</Text>
                <Text style={styles.sectionSubtitle}>Para onde você foi ultimamente</Text>
              </View>

              {recentRoutes.map((route) => (
                <Pressable
                  key={route.id}
                  accessibilityRole="button"
                  style={styles.recentRow}
                  onPress={() => router.push(`/routes/${route.id}` as Href)}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons color={colors.text.secondary} name="time-outline" size={15} />
                  </View>
                  <View style={styles.recentCopy}>
                    <Text numberOfLines={1} style={styles.recentTitle}>
                      {route.destinationLabel}
                    </Text>
                    <Text style={styles.recentMeta}>{route.distanceLabel}</Text>
                  </View>
                  <Ionicons color={colors.border.default} name="chevron-forward" size={16} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

export type { NearbyCategoryFilter };

const createStyles = (colors: AppColors) => ({
  content: {
    paddingBottom: 24,
  },
  emptyPartners: {
    color: colors.text.secondary,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterChip: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: colors.brandDark,
    fontWeight: "700",
  },
  filtersRow: {
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  loadingRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
  locationBlocked: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 20,
    padding: 20,
  },
  locationBlockedText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 260,
    textAlign: "center",
  },
  locationBlockedTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  locationButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationButtonText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
  },
  locationPending: {
    alignItems: "center",
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    padding: 16,
  },
  locationPendingText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  partnerBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  partnerCard: {
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    width: 176,
  },
  partnerCardBody: {
    padding: 12,
  },
  partnerCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  partnerClosed: {
    color: colors.text.muted,
  },
  partnerDot: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  partnerMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginTop: 6,
  },
  partnerName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  partnerOpen: {
    color: colors.brandPrimary,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  partnerRating: {
    color: colors.brandDark,
    fontSize: 11,
    fontWeight: "700",
  },
  partnerType: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
  },
  partnerTypeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  partnersRow: {
    gap: 12,
    paddingHorizontal: 20,
    paddingRight: 28,
  },
  recentCopy: {
    flex: 1,
    minWidth: 0,
  },
  recentIcon: {
    alignItems: "center",
    backgroundColor: colors.surface.subtle,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  recentMeta: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  recentRow: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    paddingVertical: 12,
  },
  recentSection: {
    marginTop: 20,
  },
  recentTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "800",
  },
  shortcutCard: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  shortcutCopy: {
    flex: 1,
    minWidth: 0,
  },
  shortcutIcon: {
    alignItems: "center",
    backgroundColor: "rgba(87, 109, 30, 0.08)",
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  shortcutSubtitle: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 1,
  },
  shortcutTitle: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800",
  },
  shortcutsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sponsoredBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    color: "#92400E",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

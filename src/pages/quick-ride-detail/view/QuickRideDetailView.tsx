import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { UserAvatar } from "@/components/UserAvatar";
import { QuickRideCancelModal } from "@/pages/quick-ride-detail/components/QuickRideCancelModal";
import { QuickRideDeleteConfirmModal } from "@/pages/quick-ride-detail/components/QuickRideDeleteConfirmModal";
import { QuickRideDetailHostMenu } from "@/pages/quick-ride-detail/components/QuickRideDetailHostMenu";
import { QuickRideEditUnavailableModal } from "@/pages/quick-ride-detail/components/QuickRideEditUnavailableModal";
import {
  cancelQuickRide,
  fetchQuickRideDetail,
  joinQuickRide,
  leaveQuickRide,
} from "@/pages/quick-rides/services/quick-rides.service";
import type { QuickRideDetail } from "@/pages/quick-rides/types/quick-ride.types";
import {
  formatQuickRideWhen,
  getQuickRideOriginDestinationLabel,
  isQuickRideFullFromDetail,
  isQuickRideListItemEnded,
} from "@/pages/quick-rides/types/quick-ride.types";
import { colors } from "@/theme/colors";

type QuickRideDetailViewProps = {
  onBack: () => void;
  quickRideId: string;
};

export function QuickRideDetailView({ onBack, quickRideId }: QuickRideDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<QuickRideDetail | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingJoin, setIsTogglingJoin] = useState(false);
  const [editUnavailableVisible, setEditUnavailableVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadRide = useCallback(async () => {
    if (!quickRideId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    try {
      const response = await fetchQuickRideDetail(quickRideId);
      setRide(response);
    } catch {
      setRide(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [quickRideId]);

  useFocusEffect(
    useCallback(() => {
      void loadRide();
    }, [loadRide]),
  );

  const handleToggleJoin = async () => {
    if (!ride || isTogglingJoin || ride.isHost || isQuickRideListItemEnded(ride)) return;

    setIsTogglingJoin(true);
    try {
      if (ride.isParticipant) {
        await leaveQuickRide(ride.id);
      } else {
        await joinQuickRide(ride.id);
      }
      await loadRide();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: ride.isParticipant ? "Não foi possível sair do rolê" : "Não foi possível topar",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsTogglingJoin(false);
    }
  };

  const isEnded = ride ? isQuickRideListItemEnded(ride) : false;
  const showJoinFooter = ride && !ride.isHost && !isEnded;
  const joined = ride?.isParticipant ?? false;
  const full = ride ? isQuickRideFullFromDetail(ride) : false;
  const otherParticipantsCount = ride
    ? ride.participants.filter((participant) => participant.id !== ride.host.id).length
    : 0;

  const handleEditRide = () => {
    if (!ride) return;

    if (isEnded) {
      setEditUnavailableVisible(true);
      return;
    }

    router.push({
      pathname: "/quick-rides/[quickRideId]/edit",
      params: { quickRideId: ride.id },
    });
  };

  const handleCancelPress = () => {
    if (!ride) return;

    if (otherParticipantsCount > 0) {
      setCancelModalVisible(true);
      return;
    }

    setDeleteModalVisible(true);
  };

  const handleConfirmCancel = async (reason?: string) => {
    if (!ride) return;

    setIsCancelling(true);
    try {
      await cancelQuickRide(ride.id, reason);
      Toast.show({
        type: "success",
        text1: otherParticipantsCount > 0 ? "Rolê cancelado" : "Rolê removido",
      });
      onBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Não foi possível cancelar o rolê",
        text2: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsCancelling(false);
      setCancelModalVisible(false);
      setDeleteModalVisible(false);
    }
  };

  let joinLabel = "Topar";
  if (joined) joinLabel = "Sair do rolê";
  else if (full) joinLabel = "Lotado";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={24} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {ride?.title ?? "Rolê rápido"}
        </Text>
        {ride && isEnded ? (
          <View style={styles.endedBadge}>
            <Text style={styles.endedBadgeText}>Encerrado</Text>
          </View>
        ) : null}
        {ride?.isHost ? (
          <QuickRideDetailHostMenu
            otherParticipantsCount={otherParticipantsCount}
            topInset={insets.top}
            onCancelRide={handleCancelPress}
            onEditRide={handleEditRide}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : null}

      {!isLoading && hasError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Não foi possível carregar este rolê.</Text>
        </View>
      ) : null}

      {!isLoading && ride ? (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: showJoinFooter ? 120 + insets.bottom : 24 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hostRow}>
              <UserAvatar
                avatarUrl={ride.host.avatarUrl}
                name={ride.host.name}
                size={48}
              />
              <View style={styles.hostCopy}>
                <Text style={styles.hostName}>{ride.host.name}</Text>
                <Text style={styles.hostSubtitle}>organizando este rolê</Text>
              </View>
            </View>

            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Ionicons color="#9CA3AF" name="location-outline" size={16} />
                <Text style={styles.metaText}>{getQuickRideOriginDestinationLabel(ride)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons color="#9CA3AF" name="time-outline" size={16} />
                <Text style={styles.metaText}>{formatQuickRideWhen(ride.startsAt)}</Text>
              </View>
            </View>

            {ride.description ? (
              <Text style={styles.description}>{ride.description}</Text>
            ) : null}

            <View style={styles.participantsSection}>
              <Text style={styles.participantsTitle}>
                {ride.participantCount}{" "}
                {ride.participantCount === 1 ? "pessoa topou" : "pessoas toparam"}
                {ride.maxParticipants != null
                  ? ` · ${ride.remainingSpots ?? 0} vaga(s)`
                  : ""}
              </Text>

              {ride.participants.length === 0 ? (
                <Text style={styles.emptyParticipants}>
                  Ninguém topou ainda. Seja o primeiro!
                </Text>
              ) : (
                <View style={styles.participantsRow}>
                  <View style={styles.avatarStack}>
                    {ride.participants.slice(0, 6).map((participant, index) => (
                      <View
                        key={participant.id}
                        style={[styles.avatarWrap, index > 0 && styles.avatarOverlap]}
                      >
                        <UserAvatar
                          avatarUrl={participant.avatarUrl}
                          name={participant.name}
                          size={32}
                        />
                      </View>
                    ))}
                    {ride.participants.length > 6 ? (
                      <View style={[styles.avatarWrap, styles.avatarOverlap, styles.moreAvatar]}>
                        <Text style={styles.moreAvatarText}>+{ride.participants.length - 6}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={styles.participantNames}>
                    {ride.participants
                      .slice(0, 2)
                      .map((participant) => participant.name)
                      .join(", ")}
                    {ride.participants.length > 2
                      ? ` e mais ${ride.participants.length - 2}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {showJoinFooter ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Button
                disabled={(full && !joined) || isTogglingJoin}
                size="lg"
                style={styles.footerButton}
                variant={joined ? "secondary" : "default"}
                onPress={() => void handleToggleJoin()}
              >
                {joinLabel}
              </Button>
            </View>
          ) : null}
        </>
      ) : null}

      {ride ? (
        <>
          <QuickRideEditUnavailableModal
            message="Só é possível editar rolês ativos que ainda aceitam participantes."
            title="Edição indisponível"
            visible={editUnavailableVisible}
            onClose={() => setEditUnavailableVisible(false)}
          />
          <QuickRideCancelModal
            isDeleting={isCancelling}
            otherParticipantsCount={otherParticipantsCount}
            rideTitle={ride.title}
            visible={cancelModalVisible}
            onClose={() => setCancelModalVisible(false)}
            onConfirm={(reason) => void handleConfirmCancel(reason)}
          />
          <QuickRideDeleteConfirmModal
            isDeleting={isCancelling}
            rideTitle={ride.title}
            visible={deleteModalVisible}
            onClose={() => setDeleteModalVisible(false)}
            onConfirm={() => void handleConfirmCancel()}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  description: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
  },
  endedBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  endedBadgeText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyParticipants: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  errorText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F3F4F6",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButton: {
    width: "100%",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F3F4F6",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 21,
  },
  hostCopy: {
    flex: 1,
  },
  hostName: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  hostRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  hostSubtitle: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  metaBlock: {
    gap: 8,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 14,
  },
  moreAvatar: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  moreAvatarText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
  },
  participantNames: {
    color: "#6B7280",
    flex: 1,
    fontSize: 12,
  },
  participantsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  participantsSection: {
    gap: 8,
  },
  participantsTitle: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
});

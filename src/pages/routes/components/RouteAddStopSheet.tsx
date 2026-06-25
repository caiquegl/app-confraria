import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import { Button } from "@/components/Button";
import type { PlaceReference, PlaceWithCoords } from "@/lib/places";
import { resolvePlaceWithCoords } from "@/lib/places";
import { colors } from "@/theme/colors";

type RouteAddStopSheetProps = {
  dayLabel: string;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (place: PlaceWithCoords) => Promise<void>;
  visible: boolean;
};

export function RouteAddStopSheet({
  dayLabel,
  isSaving,
  onClose,
  onConfirm,
  visible,
}: RouteAddStopSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlace, setSelectedPlace] = useState<PlaceReference | null>(null);

  const handleClose = () => {
    setSelectedPlace(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedPlace) return;

    const resolved = await resolvePlaceWithCoords(selectedPlace);
    await onConfirm(resolved);
    setSelectedPlace(null);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.label}>Nova parada</Text>
        <Text style={styles.subtitle}>Adicionar parada no {dayLabel}</Text>

        <PlaceAutocompleteField
          placeholder="Nome do local ou endereço"
          value={selectedPlace}
          onChange={setSelectedPlace}
        />

        <Button
          disabled={!selectedPlace || isSaving}
          size="lg"
          style={styles.confirmButton}
          onPress={() => void handleConfirm()}
        >
          {isSaving ? "Salvando..." : `Adicionar parada no ${dayLabel}`}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
  },
  confirmButton: {
    marginTop: 16,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  label: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  subtitle: {
    color: colors.brandDark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 4,
  },
});

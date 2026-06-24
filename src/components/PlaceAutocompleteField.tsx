import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fetchPlaceAutocomplete } from "@/lib/places";
import type { PlaceReference } from "@/lib/places";
import { colors } from "@/theme/colors";

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 450;

type PlaceAutocompleteFieldProps = {
  compact?: boolean;
  label?: string;
  onChange: (place: PlaceReference | null) => void;
  placeholder: string;
  required?: boolean;
  value: PlaceReference | null;
};

export function PlaceAutocompleteField({
  compact = false,
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: PlaceAutocompleteFieldProps) {
  const [query, setQuery] = useState(value?.description ?? "");
  const [suggestions, setSuggestions] = useState<PlaceReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const queryMatchesSelectedPlace = value?.description === query;

    if (trimmedQuery.length < MIN_SEARCH_LENGTH || queryMatchesSelectedPlace) {
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      if (cancelled) return;

      setIsLoading(true);
      void fetchPlaceAutocomplete(trimmedQuery)
        .then((places) => {
          if (cancelled) return;
          setSuggestions(places);
        })
        .catch(() => {
          if (cancelled) return;
          setSuggestions([]);
          setHasError(true);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, value?.description]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    setHasError(false);

    if (value && text !== value.description) {
      onChange(null);
    }

    if (text.trim().length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelectPlace = (place: PlaceReference) => {
    setQuery(place.description);
    setSuggestions([]);
    setHasError(false);
    setIsLoading(false);
    onChange(place);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setHasError(false);
    setIsLoading(false);
    onChange(null);
  };

  const shouldShowDropdown =
    query.trim().length >= MIN_SEARCH_LENGTH &&
    value?.description !== query &&
    (isLoading || hasError || suggestions.length > 0);

  return (
    <View>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? " *" : ""}
        </Text>
      ) : null}

      <View style={[styles.inputWrap, compact && styles.inputWrapCompact]}>
        <Ionicons color="#9CA3AF" name="location-outline" size={compact ? 16 : 18} />
        <TextInput
          autoCapitalize="words"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, compact && styles.inputCompact]}
          value={query}
          onChangeText={handleChangeText}
        />
        {isLoading ? <ActivityIndicator color={colors.brandDark} size="small" /> : null}
        {query ? (
          <Pressable
            accessibilityLabel="Limpar endereço"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Ionicons color="#9CA3AF" name="close-circle" size={compact ? 16 : 18} />
          </Pressable>
        ) : null}
      </View>

      {shouldShowDropdown ? (
        <View style={styles.dropdown}>
          {hasError ? (
            <Text style={styles.dropdownMessage}>Não foi possível buscar endereços.</Text>
          ) : null}

          {!hasError && !isLoading && suggestions.length === 0 ? (
            <Text style={styles.dropdownMessage}>Nenhum endereço encontrado.</Text>
          ) : null}

          {suggestions.map((place) => (
            <Pressable
              key={place.placeId}
              accessibilityRole="button"
              style={styles.option}
              onPress={() => handleSelectPlace(place)}
            >
              <View style={styles.optionIcon}>
                <Ionicons color="#6B7280" name="location-outline" size={16} />
              </View>
              <View style={styles.optionTextBlock}>
                <Text numberOfLines={1} style={styles.optionTitle}>
                  {place.mainText || place.description}
                </Text>
                {place.secondaryText ? (
                  <Text numberOfLines={2} style={styles.optionSubtitle}>
                    {place.secondaryText}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dropdownMessage: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    padding: 14,
  },
  input: {
    color: colors.brandDark,
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  inputCompact: {
    fontSize: 14,
    paddingVertical: 10,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputWrapCompact: {
    borderRadius: 14,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  label: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    marginTop: 2,
    width: 30,
  },
  optionSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 2,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
});

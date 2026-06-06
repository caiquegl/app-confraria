import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { useUserSearch } from "../business/useUserSearch";
import { SearchUserCard } from "../components/SearchUserCard";
import type { UserSearchViewProps } from "../types/search.types";

export function UserSearchView({ onBack, onOpenProfile }: UserSearchViewProps) {
  const insets = useSafeAreaInsets();
  const { error, hasSearched, isSearching, results, searchQuery, setSearchQuery } =
    useUserSearch();

  const showEmptyHint = searchQuery.trim().length === 0;
  const showNoResults = hasSearched && !isSearching && results.length === 0 && !error;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons color="#9CA3AF" name="search" size={17} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Buscar por nickname ou e-mail"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isSearching ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : showEmptyHint ? (
        <View style={styles.centerState}>
          <Ionicons color="#D1D5DB" name="search-outline" size={42} />
          <Text style={styles.hintText}>Digite um nickname ou e-mail</Text>
        </View>
      ) : showNoResults ? (
        <View style={styles.centerState}>
          <Ionicons color="#D1D5DB" name="person-outline" size={42} />
          <Text style={styles.hintText}>Nenhum perfil encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SearchUserCard user={item} onPress={() => onOpenProfile(item.userId)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: "700",
  },
  hintText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  screen: {
    backgroundColor: colors.brandGray,
    flex: 1,
  },
  searchInput: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

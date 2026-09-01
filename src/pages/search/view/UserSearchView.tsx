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

import { ErrorState } from "@/components/ErrorState";
import { type AppColors, useTheme, useThemedStyles } from "@/theme";

import { useUserSearch } from "../business/useUserSearch";
import { SearchUserCard } from "../components/SearchUserCard";
import type { UserSearchViewProps } from "../types/search.types";

export function UserSearchView({ onBack, onOpenProfile }: UserSearchViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { error, hasSearched, isRetrying, isSearching, results, retry, searchQuery, setSearchQuery } =
    useUserSearch();

  const showEmptyHint = searchQuery.trim().length === 0;
  const showNoResults = hasSearched && !isSearching && results.length === 0 && !error;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Pressable accessibilityLabel="Voltar" style={styles.backButton} onPress={onBack}>
          <Ionicons color={colors.brandDark} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons color={colors.text.muted} name="search" size={17} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Buscar por nickname ou e-mail"
          placeholderTextColor={colors.text.placeholder}
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
        <ErrorState
          description="Verifique a conexão e tente novamente."
          layout="inline"
          retrying={isRetrying}
          style={styles.errorState}
          title="Não foi possível buscar perfis"
          onRetry={retry}
        />
      ) : showEmptyHint ? (
        <View style={styles.centerState}>
          <Ionicons color={colors.border.default} name="search-outline" size={42} />
          <Text style={styles.hintText}>Digite um nickname ou e-mail</Text>
        </View>
      ) : showNoResults ? (
        <View style={styles.centerState}>
          <Ionicons color={colors.border.default} name="person-outline" size={42} />
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

const createStyles = (colors: AppColors) => ({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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
  errorState: {
    flex: 1,
    justifyContent: "center",
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
    color: colors.text.muted,
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
    color: colors.text.emphasis,
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: colors.surface.primary,
    borderColor: colors.border.subtle,
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

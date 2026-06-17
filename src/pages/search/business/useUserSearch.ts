import { useEffect, useState } from "react";

import { searchUsers } from "../services/search.service";
import type { UserSearchResult } from "../types/search.types";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

type SearchState = {
  query: string;
  results: UserSearchResult[];
  error: string | null;
};

const EMPTY_SEARCH_STATE: SearchState = {
  query: "",
  results: [],
  error: null,
};

export function useUserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>(EMPTY_SEARCH_STATE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      return;
    }

    let cancelled = false;

    void searchUsers(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setSearchState({
          query: debouncedQuery,
          results: data,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSearchState({
          query: debouncedQuery,
          results: [],
          error: "Não foi possível buscar perfis. Tente novamente.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const matchesQuery = searchState.query === debouncedQuery;

  return {
    error: canSearch && matchesQuery ? searchState.error : null,
    hasSearched: canSearch && matchesQuery,
    isSearching: canSearch && !matchesQuery,
    results: canSearch && matchesQuery ? searchState.results : [],
    searchQuery,
    setSearchQuery,
  };
}

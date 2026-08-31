import { useCallback, useEffect, useRef, useState } from "react";

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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const failedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      failedQueryRef.current = null;
      return;
    }

    let cancelled = false;
    const isRetryAttempt = failedQueryRef.current === debouncedQuery;
    if (isRetryAttempt) {
      setIsRetrying(true);
    }

    void searchUsers(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        failedQueryRef.current = null;
        setSearchState({
          query: debouncedQuery,
          results: data,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        failedQueryRef.current = debouncedQuery;
        setSearchState({
          query: debouncedQuery,
          results: [],
          error: "Não foi possível buscar perfis.",
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsRetrying(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, retryCount]);

  const retry = useCallback(() => {
    if (isRetrying) return;
    setRetryCount((current) => current + 1);
  }, [isRetrying]);

  const canSearch = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const matchesQuery = searchState.query === debouncedQuery;

  return {
    error: canSearch && matchesQuery ? searchState.error : null,
    hasSearched: canSearch && matchesQuery,
    isRetrying,
    isSearching: canSearch && !matchesQuery && !isRetrying,
    results: canSearch && matchesQuery ? searchState.results : [],
    retry,
    searchQuery,
    setSearchQuery,
  };
}

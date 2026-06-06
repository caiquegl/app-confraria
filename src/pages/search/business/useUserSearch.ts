import { useEffect, useState } from "react";

import { searchUsers } from "../services/search.service";
import type { UserSearchResult } from "../types/search.types";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function useUserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    setIsSearching(true);
    setError(null);

    void searchUsers(debouncedQuery)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        setHasSearched(true);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setHasSearched(true);
        setError("Não foi possível buscar perfis. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return {
    error,
    hasSearched,
    isSearching,
    results,
    searchQuery,
    setSearchQuery,
  };
}

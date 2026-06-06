import { api } from "@/lib/api";
import { apiRoutes } from "@/lib/api-routes";

import type { UserSearchResult } from "../types/search.types";

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<UserSearchResult[]>(apiRoutes.users.search(query));
  return data;
}

import { router } from "expo-router";

import { UserSearchView } from "@/pages/search";

export default function UserSearchScreen() {
  return (
    <UserSearchView
      onBack={() => router.back()}
      onOpenProfile={(userId) =>
        router.push({ pathname: "/users/[userId]", params: { userId } })
      }
    />
  );
}

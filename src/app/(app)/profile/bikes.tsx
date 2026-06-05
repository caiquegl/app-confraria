import { router } from "expo-router";

import { MyBikesView } from "@/pages/bikes/view/MyBikesView";

export default function ProfileBikesScreen() {
  return <MyBikesView onBack={() => router.back()} />;
}

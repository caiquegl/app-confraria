import { router } from "expo-router";

import { MySubscriptionView } from "@/pages/subscription/view/MySubscriptionView";

export default function ProfileSubscriptionScreen() {
  return <MySubscriptionView onBack={() => router.back()} />;
}

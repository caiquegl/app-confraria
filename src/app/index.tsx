import { router } from "expo-router";

import { LoadingView } from "@/pages/loading";

export default function Index() {
  return (
    <LoadingView
      onComplete={(route) => {
        router.replace(route === "feed" ? "/feed" : "/landing");
      }}
    />
  );
}

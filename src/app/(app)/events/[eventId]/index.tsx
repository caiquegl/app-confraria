import { Redirect, useLocalSearchParams } from "expo-router";

export default function EventUniversalLinkScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  return (
    <Redirect
      href={{
        pathname: "/event/[eventId]",
        params: { eventId: eventId ?? "" },
      }}
    />
  );
}

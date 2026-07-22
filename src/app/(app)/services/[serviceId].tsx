import { useLocalSearchParams } from "expo-router";

import { ServiceDetailView } from "@/pages/service-detail/view/ServiceDetailView";

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();

  return <ServiceDetailView serviceId={serviceId ?? ""} />;
}

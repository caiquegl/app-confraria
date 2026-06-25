import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";

import type { EventPlaceReference } from "../types/event-create.types";

type EventPlaceAutocompleteFieldProps = {
  label?: string;
  onChange: (place: EventPlaceReference | null) => void;
  placeholder: string;
  required?: boolean;
  value: EventPlaceReference | null;
};

export function EventPlaceAutocompleteField(props: EventPlaceAutocompleteFieldProps) {
  return <PlaceAutocompleteField {...props} />;
}

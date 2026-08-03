type Listener = () => void;

let ratingUiOpen = false;
const listeners = new Set<Listener>();

export function setRouteRatingUiOpen(open: boolean) {
  if (ratingUiOpen === open) return;
  ratingUiOpen = open;
  listeners.forEach((listener) => listener());
}

export function isRouteRatingUiOpen() {
  return ratingUiOpen;
}

export function subscribeRouteRatingUi(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

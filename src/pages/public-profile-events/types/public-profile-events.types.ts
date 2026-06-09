export type PublicProfileEventTab = "Inscrito" | "Visitados" | "Criados";

export type PublicProfileEvent = {
  id: string;
  category: string;
  date: string;
  description?: string;
  image: string;
  isLatestVisit?: boolean;
  location: string;
  organizer: string;
  organizerAvatar?: string;
  rating: number;
  reviews: number;
  startsAt: string;
  title: string;
};

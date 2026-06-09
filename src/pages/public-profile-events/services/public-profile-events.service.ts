import type {
  PublicProfileEvent,
  PublicProfileEventTab,
} from "../types/public-profile-events.types";

export const PUBLIC_PROFILE_EVENT_TABS: PublicProfileEventTab[] = [
  "Inscrito",
  "Visitados",
  "Criados",
];

const TODAY_ISO = new Date().toISOString();

const MOCK_CREATED_EVENTS: PublicProfileEvent[] = [
  {
    id: "created-1",
    title: "Trilha asfalto",
    category: "Moto Club Iron Horses",
    description: "Passeio de asfalto com paradas estratégicas e encontro de moto clubes.",
    image:
      "https://images.unsplash.com/photo-1625026435348-77b314953932?q=80&w=900&auto=format&fit=crop",
    rating: 4.9,
    reviews: 999,
    date: "Novembro / 25",
    organizer: "Moto Club Iron Horses",
    organizerAvatar:
      "https://images.unsplash.com/photo-1614959541559-07085775f0f3?q=80&w=100&auto=format&fit=crop",
    location: "Curitiba",
    startsAt: TODAY_ISO,
  },
  {
    id: "created-2",
    title: "Rota do Sol",
    category: "Estrada",
    description: "Rota panorâmica para quem curte estrada, curvas e visual aberto.",
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=900&auto=format&fit=crop",
    rating: 4.8,
    reviews: 312,
    date: "Novembro / 25",
    organizer: "Iron Horses",
    organizerAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop",
    location: "Nordeste",
    startsAt: "2025-11-25T12:00:00.000Z",
  },
];

const MOCK_JOINED_EVENTS: PublicProfileEvent[] = [
  {
    id: "joined-1",
    title: "O Rolê com a Gata",
    category: "Moto Club Iron Horses",
    description: "Evento descontraído para casais motociclistas e amigos da estrada.",
    image:
      "https://images.unsplash.com/photo-1623868662369-0731f4a97405?q=80&w=900&auto=format&fit=crop",
    rating: 4.9,
    reviews: 999,
    date: "Nesta Semana",
    organizer: "Iron Horses",
    organizerAvatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=100&auto=format&fit=crop",
    location: "Rio de Janeiro",
    startsAt: TODAY_ISO,
  },
];

const MOCK_VISITED_EVENTS: PublicProfileEvent[] = [
  {
    id: "visited-1",
    title: "Encontro Nacional de Motociclistas",
    category: "Evento nacional",
    description: "Grande encontro com shows, expositores e rotas guiadas durante o fim de semana.",
    image:
      "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=900&auto=format&fit=crop",
    rating: 5,
    reviews: 1200,
    date: "Outubro / 25",
    isLatestVisit: true,
    organizer: "Confraria Riders",
    organizerAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
    location: "Foz do Iguaçu",
    startsAt: "2025-10-18T12:00:00.000Z",
  },
];

export function getMockPublicProfileEvents(tab: PublicProfileEventTab): PublicProfileEvent[] {
  switch (tab) {
    case "Inscrito":
      return MOCK_JOINED_EVENTS;
    case "Visitados":
      return MOCK_VISITED_EVENTS;
    case "Criados":
    default:
      return MOCK_CREATED_EVENTS;
  }
}

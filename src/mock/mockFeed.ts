import type { FeedPost } from "@/pages/home/types/feed.types";

export const MOCK_FEED: FeedPost[] = [
  {
    id: "feed-1",
    type: "event_attended",
    userId: "user-feed-2",
    userName: "Ricardo Alvares",
    userAvatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    eventId: "en-1",
    eventTitle: "Encontro Nacional de Motociclistas",
    eventImage:
    "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=600&auto=format&fit=crop",
    caption: "Que evento incrível! Valeu a viagem até Foz do Iguaçu",
    likeCount: 34,
    commentCount: 5,
    comments: [
      {
        id: "c-1-1",
        userId: "user-feed-3",
        userName: "Fernanda Lima",
        userAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
        text: "Estava lá também! Que evento sensacional!",
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        id: "c-1-2",
        userId: "user-feed-4",
        userName: "Paulo Siqueira",
        userAvatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
        text: "Ano que vem eu vou de qualquer jeito!",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "feed-5",
    type: "photo_shared",
    userId: "user-feed-2",
    userName: "Ricardo Alvares",
    userAvatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    eventId: "en-1",
    eventTitle: "Encontro Nacional de Motociclistas",
    photos: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1609630856908-0937a4e0a96f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558981359-219d6364c9c8?q=80&w=600&auto=format&fit=crop",
    ],
    caption: "Memórias do Encontro Nacional. Que pessoal incrível!",
    likeCount: 87,
    commentCount: 11,
    comments: [
      {
        id: "c-5-1",
        userId: "user-feed-5",
        userName: "Camila Ferreira",
        userAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
        text: "As fotos ficaram incríveis! Você tem talento",
        createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c-5-2",
        userId: "user-feed-7",
        userName: "Thiago Monteiro",
        userAvatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
        text: "Manda o link do álbum completo!",
        createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "feed-6",
    type: "photo_shared",
    userId: "user-feed-9",
    userName: "Bruno Castilho",
    userAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    eventTitle: "Mirante Pedra Grande",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
    ],
    caption: "Vista de tirar o fôlego no Mirante Pedra Grande",
    likeCount: 43,
    commentCount: 4,
    comments: [
      {
        id: "c-6-1",
        userId: "user-feed-3",
        userName: "Fernanda Lima",
        userAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
        text: "Que paisagem! Preciso ir nesse mirante",
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "feed-8",
    type: "route_completed",
    userId: "user-feed-5",
    userName: "Camila Ferreira",
    userAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    routeId: "sul-1",
    routeTitle: "Serra Gaúcha Panorâmica",
    routeDistanceKm: 310,
    eventImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop",
    caption: "310km de pura adrenalina! A Serra Gaúcha é outro nível",
    likeCount: 62,
    commentCount: 8,
    comments: [
      {
        id: "c-8-1",
        userId: "user-feed-2",
        userName: "Ricardo Alvares",
        userAvatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
        text: "Que rota! Você foi sozinha?",
        createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "c-8-2",
        userId: "user-feed-5",
        userName: "Camila Ferreira",
        userAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
        text: "Fui com o clube! Mas da próxima vez te chamo",
        createdAt: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "feed-11",
    type: "event_liked",
    userId: "user-feed-3",
    userName: "Fernanda Lima",
    userAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    eventId: "en-3",
    eventTitle: "Biker Day Campinas",
    eventImage:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
    likeCount: 12,
    commentCount: 2,
    comments: [
      {
        id: "c-11-1",
        userId: "user-feed-4",
        userName: "Paulo Siqueira",
        userAvatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
        text: "Esse evento é ótimo! Já participei três vezes",
        createdAt: new Date(Date.now() - 119 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

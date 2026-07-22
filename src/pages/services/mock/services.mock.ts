import type { Service, ServicesSection } from "../types/services.types";

export const MOCK_SERVICES: Service[] = [
  {
    id: "1",
    name: "Oficina do Moto Center",
    category: "Mecânicas",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    rating: 4.9,
    reviewCount: 312,
    phone: "(43) 99999-0001",
    isFavorited: false,
  },
  {
    id: "2",
    name: "Pit Stop Motos",
    category: "Mecânicas",
    imageUrl:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400",
    rating: 4.7,
    reviewCount: 198,
    phone: "(43) 99999-0002",
    isFavorited: false,
  },
  {
    id: "3",
    name: "Turbo Mecânica",
    category: "Mecânicas",
    imageUrl:
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400",
    rating: 4.8,
    reviewCount: 276,
    phone: "(43) 99999-0003",
    isFavorited: false,
  },
  {
    id: "4",
    name: "Hotel Beira Mar - SP",
    category: "Hotéis",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
    rating: 4.9,
    reviewCount: 999,
    phone: "(11) 98888-0001",
    isFavorited: true,
  },
  {
    id: "5",
    name: "Pousada Estrada Real",
    category: "Hotéis",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
    rating: 4.6,
    reviewCount: 421,
    phone: "(11) 98888-0002",
    isFavorited: false,
  },
  {
    id: "6",
    name: "Moto Peças Nova América",
    category: "Acessórios",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400",
    rating: 4.9,
    reviewCount: 999,
    phone: "(43) 99999-0004",
    isFavorited: false,
  },
  {
    id: "7",
    name: "Moto Store Premium",
    category: "Acessórios",
    imageUrl:
      "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=400",
    rating: 4.7,
    reviewCount: 532,
    phone: "(43) 99999-0005",
    isFavorited: false,
  },
  {
    id: "8",
    name: "Escola Moto Seguro",
    category: "Moto escolas",
    imageUrl:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400",
    rating: 4.8,
    reviewCount: 144,
    phone: "(43) 99999-0006",
    isFavorited: false,
  },
  {
    id: "9",
    name: "Guincho 24h Rodoviário",
    category: "Guinchos",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    rating: 4.5,
    reviewCount: 87,
    phone: "(43) 99999-0007",
    isFavorited: false,
  },
];

export const MOCK_QUICK_SERVICES = MOCK_SERVICES.filter(
  (s) => s.category === "Mecânicas",
);

export const MOCK_SECTIONS: ServicesSection[] = [
  {
    category: "Hotéis",
    services: MOCK_SERVICES.filter((s) => s.category === "Hotéis"),
  },
  {
    category: "Acessórios",
    services: MOCK_SERVICES.filter((s) => s.category === "Acessórios"),
  },
  {
    category: "Moto escolas",
    services: MOCK_SERVICES.filter((s) => s.category === "Moto escolas"),
  },
  {
    category: "Guinchos",
    services: MOCK_SERVICES.filter((s) => s.category === "Guinchos"),
  },
];

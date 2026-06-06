export type UserSearchResult = {
  userId: string;
  name: string;
  handle: string;
  avatar: string | null;
  location: string | null;
};

export type UserSearchViewProps = {
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
};

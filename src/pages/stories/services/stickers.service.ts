export type StoryStickerSearchItem = {
  id: string;
  imageUrl: string;
  previewUrl: string;
};

type GiphyImage = {
  url?: string;
};

type GiphyItem = {
  id?: string;
  images?: {
    fixed_height?: GiphyImage;
    fixed_width?: GiphyImage;
    fixed_width_small?: GiphyImage;
    downsized_medium?: GiphyImage;
    original_still?: GiphyImage;
    preview_gif?: GiphyImage;
  };
};

type GiphyResponse = {
  data?: GiphyItem[];
};

const GIPHY_API_URL = "https://api.giphy.com/v1/gifs";
const GIPHY_LIMIT = 24;

export async function searchStoryStickers(query: string): Promise<StoryStickerSearchItem[]> {
  const apiKey = '1fCwgkL5bRpBFRJspLjZHLXrh2AECLJ2';
  if (!apiKey) {
    throw new Error("Configure EXPO_PUBLIC_GIPHY_API_KEY para buscar figurinhas.");
  }

  const trimmedQuery = query.trim();
  const endpoint = trimmedQuery ? "search" : "trending";
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(GIPHY_LIMIT),
    rating: "g",
  });

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  const response = await fetch(`${GIPHY_API_URL}/${endpoint}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Não foi possível buscar figurinhas agora.");
  }

  const payload = (await response.json()) as GiphyResponse;
  return (payload.data ?? []).flatMap(mapGiphyItem);
}

function mapGiphyItem(item: GiphyItem): StoryStickerSearchItem[] {
  const id = item.id;
  const previewUrl =
    item.images?.fixed_width_small?.url ??
    item.images?.preview_gif?.url ??
    item.images?.original_still?.url;
  const imageUrl =
    item.images?.fixed_height?.url ??
    item.images?.fixed_width?.url ??
    item.images?.downsized_medium?.url ??
    previewUrl;

  if (!id || !previewUrl || !imageUrl) return [];

  return [{ id, imageUrl, previewUrl }];
}

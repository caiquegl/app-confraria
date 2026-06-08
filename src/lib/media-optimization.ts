import { manipulateAsync, SaveFormat, type Action } from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

const MAX_IMAGE_UPLOAD_DIMENSION = 2048;
const IMAGE_UPLOAD_COMPRESS = 0.88;

export type OptimizedImageUpload = {
  extension: "jpg";
  mimeType: "image/jpeg";
  uri: string;
};

export async function optimizeImageForUpload(uri: string): Promise<OptimizedImageUpload> {
  try {
    const size = await getImageSize(uri);
    const actions = buildResizeActions(size.width, size.height);
    const result = await manipulateAsync(uri, actions, {
      compress: IMAGE_UPLOAD_COMPRESS,
      format: SaveFormat.JPEG,
    });

    return {
      extension: "jpg",
      mimeType: "image/jpeg",
      uri: result.uri,
    };
  } catch {
    return {
      extension: "jpg",
      mimeType: "image/jpeg",
      uri,
    };
  }
}

function buildResizeActions(width: number, height: number): Action[] {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_UPLOAD_DIMENSION) return [];

  if (width >= height) {
    return [{ resize: { width: MAX_IMAGE_UPLOAD_DIMENSION } }];
  }

  return [{ resize: { height: MAX_IMAGE_UPLOAD_DIMENSION } }];
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ height, width }),
      reject,
    );
  });
}

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { Button } from "@/components/Button";
import { colors } from "@/theme/colors";

import type { ComposeAudience, ComposeFeedMedia } from "../types/feed.types";

const THUMBNAIL_SIZE = 80;
const THUMBNAIL_GAP = 12;
const THUMBNAIL_STEP = THUMBNAIL_SIZE + THUMBNAIL_GAP;

type NewPostComposerProps = {
  activePhotoIndex: number;
  audience: ComposeAudience;
  caption: string;
  onBack: () => void;
  onChangeActivePhotoIndex: (index: number) => void;
  onChangeAudience: (audience: ComposeAudience) => void;
  onChangeCaption: (caption: string) => void;
  onPublish: () => void | Promise<void>;
  onRemovePhoto: (index: number) => void;
  onReorderPhotos: (fromIndex: number, toIndex: number) => void;
  media: ComposeFeedMedia[];
  postUploadProgress?: number;
  publishing?: boolean;
  restrictToFollowers?: boolean;
  visible: boolean;
};

export function NewPostComposer({
  activePhotoIndex,
  audience,
  caption,
  onBack,
  onChangeActivePhotoIndex,
  onChangeAudience,
  onChangeCaption,
  onPublish,
  onRemovePhoto,
  onReorderPhotos,
  media,
  postUploadProgress = 0,
  publishing = false,
  restrictToFollowers = false,
  visible,
}: NewPostComposerProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const activeMedia = media[activePhotoIndex] ?? media[0];
  const uploadPercent = Math.round(Math.min(Math.max(postUploadProgress, 0), 1) * 100);
  const isAndroidKeyboardVisible = Platform.OS === "android" && androidKeyboardHeight > 0;

  useEffect(() => {
    if (restrictToFollowers && audience !== "friends") {
      onChangeAudience("friends");
    }
  }, [audience, onChangeAudience, restrictToFollowers]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setAndroidKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handlePublishPress = () => {
    void onPublish();
  };

  const handleCaptionFocus = () => {
    if (Platform.OS !== "android") return;

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <Modal animationType="slide" visible={visible} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
        style={styles.screen}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            accessibilityLabel="Voltar para o feed"
            hitSlop={8}
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={28} color={colors.brandDark} />
          </Pressable>

          <Text style={styles.headerTitle}>Novo post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            isAndroidKeyboardVisible && {
              paddingBottom: androidKeyboardHeight + 56,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeMedia && (
            <View style={styles.previewCard}>
              <ComposerMediaPreview media={activeMedia} />
              <Pressable
                accessibilityLabel="Remover mídia"
                hitSlop={8}
                style={styles.removePreviewButton}
                onPress={() => onRemovePhoto(activePhotoIndex)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {media.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnails}
            >
              {media.map((item, index) => (
                <DraggableThumbnail
                  key={`${item.uri}-${index}`}
                  media={item}
                  index={index}
                  total={media.length}
                  active={activePhotoIndex === index}
                  onPress={() => onChangeActivePhotoIndex(index)}
                  onMove={onReorderPhotos}
                />
              ))}
            </ScrollView>
          )}

          <TextInput
            multiline
            value={caption}
            placeholder="Adicione uma legenda obrigatória..."
            placeholderTextColor="#7B8493"
            style={styles.captionInput}
            onFocus={handleCaptionFocus}
            onChangeText={onChangeCaption}
          />

          <View style={styles.audienceRow}>
            {!restrictToFollowers ? (
              <Pressable
                style={[styles.audienceButton, audience === "all" && styles.audienceButtonActive]}
                onPress={() => onChangeAudience("all")}
              >
                <Ionicons name="earth-outline" size={18} color={colors.brandDark} />
                <Text style={styles.audienceText}>Todos</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[styles.audienceButton, audience === "friends" && styles.audienceButtonActive]}
              onPress={() => onChangeAudience("friends")}
            >
              <Ionicons name="people-outline" size={18} color={colors.brandDark} />
              <Text style={styles.audienceText}>Seguidores</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
            isAndroidKeyboardVisible && styles.footerHidden,
          ]}
        >
          <Button
            size="lg"
            style={styles.publishButton}
            disabled={media.length === 0 || publishing}
            onPress={handlePublishPress}
          >
            {publishing ? "Publicando..." : "Compartilhar"}
          </Button>
        </View>
        {publishing && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadCard}>
              <ActivityIndicator color={colors.brandGreen} size="large" />
              <Text style={styles.uploadTitle}>
                {uploadPercent >= 100 ? "Processando post..." : "Publicando post..."}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {uploadPercent >= 100
                  ? "Finalizando o envio no servidor."
                  : "Mantenha a tela aberta até concluir."}
              </Text>
              <View style={styles.uploadProgressTrack}>
                <View style={[styles.uploadProgressFill, { width: `${uploadPercent}%` }]} />
              </View>
              <Text style={styles.uploadPercent}>{uploadPercent}%</Text>
            </View>
          </View>
        )}
        <Toast topOffset={insets.top + 12} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

type DraggableThumbnailProps = {
  active: boolean;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  media: ComposeFeedMedia;
  total: number;
};

function DraggableThumbnail({
  active,
  index,
  onMove,
  onPress,
  media,
  total,
}: DraggableThumbnailProps) {
  const translateXRef = useRef(new Animated.Value(0));
  const currentIndexRef = useRef(index);

  const translateX = translateXRef.current;

  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const offset = Math.round(gesture.dx / THUMBNAIL_STEP);
          const targetIndex = Math.max(0, Math.min(currentIndexRef.current + offset, total - 1));

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();

          if (targetIndex !== currentIndexRef.current) {
            onMove(currentIndexRef.current, targetIndex);
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onMove, total, translateX],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.thumbnailDragWrapper,
        {
          transform: [{ translateX }],
          zIndex: active ? 2 : 1,
        },
      ]}
    >
      <Pressable
        style={[styles.thumbnailButton, active && styles.thumbnailButtonActive]}
        onPress={onPress}
      >
        {media.mediaType === "image" ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.thumbnailImage}
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={media.uri}
          />
        ) : (
          <View style={styles.thumbnailVideo}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function ComposerMediaPreview({ media }: { media: ComposeFeedMedia }) {
  if (media.mediaType === "video") {
    return <ComposerVideoPreview uri={media.uri} />;
  }

  return (
    <Image
      source={{ uri: media.uri }}
      style={styles.previewImage}
      cachePolicy="memory-disk"
      contentFit="cover"
      recyclingKey={media.uri}
    />
  );
}

function ComposerVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = true;
    instance.play();
  });

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.previewImage}
    />
  );
}

const styles = StyleSheet.create({
  audienceButton: {
    alignItems: "center",
    backgroundColor: "#F3F4EF",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  audienceButtonActive: {
    backgroundColor: "#EEF3E2",
  },
  audienceRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  audienceText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  captionInput: {
    color: colors.brandDark,
    fontSize: 18,
    lineHeight: 32,
    marginTop: 18,
    minHeight: 72,
    padding: 0,
    textAlignVertical: "top",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#ECEDE8",
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  footerHidden: {
    display: "none",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E7E9E4",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
  },
  previewCard: {
    backgroundColor: "#F3F4EF",
    borderRadius: 28,
    elevation: 4,
    overflow: "hidden",
    shadowColor: colors.brandDark,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
  },
  previewImage: {
    aspectRatio: 4 / 5,
    width: "100%",
  },
  publishButton: {
    width: "100%",
  },
  screen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  removePreviewButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
  },
  thumbnailButton: {
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbnailButtonActive: {
    borderColor: colors.brandGreen,
  },
  thumbnailImage: {
    height: THUMBNAIL_SIZE,
    width: THUMBNAIL_SIZE,
  },
  thumbnailVideo: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.86)",
    height: THUMBNAIL_SIZE,
    justifyContent: "center",
    width: THUMBNAIL_SIZE,
  },
  thumbnailDragWrapper: {
    borderRadius: 16,
  },
  thumbnails: {
    gap: 12,
    paddingTop: 16,
  },
  uploadCard: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.92)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    width: 280,
  },
  uploadOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  uploadPercent: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  uploadProgressFill: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    height: "100%",
  },
  uploadProgressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    height: 7,
    marginTop: 18,
    overflow: "hidden",
    width: "100%",
  },
  uploadSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  uploadTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 16,
  },
});

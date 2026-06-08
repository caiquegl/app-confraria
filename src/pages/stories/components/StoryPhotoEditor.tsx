/* eslint-disable react-hooks/refs */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";

import { colors } from "@/theme/colors";

import {
  searchStoryStickers,
  type StoryStickerSearchItem,
} from "../services/stickers.service";
import type { StoryOverlay } from "../types/stories.types";

type EffectId =
  | "original"
  | "warm"
  | "cool"
  | "dark"
  | "light"
  | "sunset"
  | "rose"
  | "grape"
  | "forest"
  | "sepia"
  | "night";

type StoryTextItem = {
  id: string;
  color: string;
  fontSize: number;
  text: string;
  x: number;
  y: number;
};

type StoryStickerItem = {
  id: string;
  imageUrl: string;
  size: number;
  x: number;
  y: number;
};

type DraftText = {
  color: string;
  fontSize: number;
  text: string;
};

export type StoryPhotoEditorExport = {
  overlays: StoryOverlay[];
  uri: string;
};

export type StoryPhotoEditorHandle = {
  captureEditedPhoto: () => Promise<StoryPhotoEditorExport>;
};

type StoryPhotoEditorProps = {
  disabled?: boolean;
  uri: string;
};

const TEXT_COLORS = ["#FFFFFF", "#111827", "#C8F763", "#F97316", "#60A5FA", "#F472B6"];
const MIN_TEXT_SIZE = 22;
const MAX_TEXT_SIZE = 58;
const MIN_STICKER_SIZE = 56;
const MAX_STICKER_SIZE = 180;
const DEFAULT_TEXT_DRAFT: DraftText = {
  color: "#FFFFFF",
  fontSize: 32,
  text: "",
};

const EFFECTS: {
  id: EffectId;
  label: string;
  overlayColor: string | null;
}[] = [
  { id: "original", label: "Original", overlayColor: null },
  { id: "warm", label: "Quente", overlayColor: "rgba(249,115,22,0.2)" },
  { id: "cool", label: "Frio", overlayColor: "rgba(59,130,246,0.18)" },
  { id: "dark", label: "Escuro", overlayColor: "rgba(0,0,0,0.24)" },
  { id: "light", label: "Claro", overlayColor: "rgba(255,255,255,0.18)" },
  { id: "sunset", label: "Pôr do sol", overlayColor: "rgba(251,146,60,0.26)" },
  { id: "rose", label: "Rosa", overlayColor: "rgba(244,114,182,0.2)" },
  { id: "grape", label: "Uva", overlayColor: "rgba(147,51,234,0.18)" },
  { id: "forest", label: "Verde", overlayColor: "rgba(34,197,94,0.16)" },
  { id: "sepia", label: "Sépia", overlayColor: "rgba(120,53,15,0.22)" },
  { id: "night", label: "Noite", overlayColor: "rgba(15,23,42,0.34)" },
];

export const StoryPhotoEditor = forwardRef<StoryPhotoEditorHandle, StoryPhotoEditorProps>(
  function StoryPhotoEditor({ disabled = false, uri }, ref) {
    const viewShotRef = useRef<ViewShotRef | null>(null);
    const layerIdRef = useRef(0);
    const [canvasSize, setCanvasSize] = useState({ height: 0, width: 0 });
    const [effect, setEffect] = useState<EffectId>("original");
    const [texts, setTexts] = useState<StoryTextItem[]>([]);
    const [stickers, setStickers] = useState<StoryStickerItem[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
    const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
    const [isLoadingStickers, setIsLoadingStickers] = useState(false);
    const [stickerQuery, setStickerQuery] = useState("");
    const [stickerError, setStickerError] = useState<string | null>(null);
    const [stickerResults, setStickerResults] = useState<StoryStickerSearchItem[]>([]);
    const [draftText, setDraftText] = useState<DraftText>(DEFAULT_TEXT_DRAFT);

    const selectedEffect = useMemo(
      () => EFFECTS.find((item) => item.id === effect) ?? EFFECTS[0],
      [effect],
    );
    const selectedText = useMemo(
      () => texts.find((item) => item.id === selectedTextId) ?? null,
      [selectedTextId, texts],
    );
    const selectedSticker = useMemo(
      () => stickers.find((item) => item.id === selectedStickerId) ?? null,
      [selectedStickerId, stickers],
    );
    const getStickerOverlays = useCallback((): StoryOverlay[] => {
      if (!canvasSize.width || !canvasSize.height) return [];

      return stickers.map((item) => ({
        imageUrl: item.imageUrl,
        sizeRatio: item.size / canvasSize.width,
        type: "sticker",
        xRatio: item.x / canvasSize.width,
        yRatio: item.y / canvasSize.height,
      }));
    }, [canvasSize.height, canvasSize.width, stickers]);

    useImperativeHandle(ref, () => ({
      captureEditedPhoto: async () => {
        const capturedUri = await viewShotRef.current?.capture();
        return {
          overlays: getStickerOverlays(),
          uri: capturedUri ?? uri,
        };
      },
    }), [getStickerOverlays, uri]);

    const handleCanvasLayout = (event: LayoutChangeEvent) => {
      const { height, width } = event.nativeEvent.layout;
      setCanvasSize({ height, width });
    };

    const openAddText = () => {
      if (disabled) return;

      setEditingTextId(null);
      setSelectedTextId(null);
      setSelectedStickerId(null);
      setIsStickerPickerOpen(false);
      setDraftText(DEFAULT_TEXT_DRAFT);
      setIsTextEditorOpen(true);
    };

    const searchStickers = async (query = stickerQuery) => {
      if (disabled || isLoadingStickers) return;

      setIsLoadingStickers(true);
      setStickerError(null);
      try {
        const results = await searchStoryStickers(query);
        setStickerResults(results);
      } catch (error) {
        setStickerResults([]);
        setStickerError(error instanceof Error ? error.message : "Erro ao buscar figurinhas.");
      } finally {
        setIsLoadingStickers(false);
      }
    };

    const openStickerPicker = () => {
      if (disabled) return;

      setIsTextEditorOpen(false);
      setSelectedTextId(null);
      setSelectedStickerId(null);
      setIsStickerPickerOpen(true);
      if (stickerResults.length === 0 && !isLoadingStickers) {
        void searchStickers("");
      }
    };

    const openEditText = (item: StoryTextItem) => {
      if (disabled) return;

      setEditingTextId(item.id);
      setSelectedTextId(item.id);
      setSelectedStickerId(null);
      setIsStickerPickerOpen(false);
      setDraftText({
        color: item.color,
        fontSize: item.fontSize,
        text: item.text,
      });
      setIsTextEditorOpen(true);
    };

    const closeTextEditor = () => {
      setIsTextEditorOpen(false);
      setEditingTextId(null);
      setDraftText(DEFAULT_TEXT_DRAFT);
    };

    const saveText = () => {
      const trimmedText = draftText.text.trim();
      if (!trimmedText) return;

      if (editingTextId) {
        setTexts((current) =>
          current.map((item) =>
            item.id === editingTextId
              ? { ...item, ...draftText, text: trimmedText }
              : item,
          ),
        );
      } else {
        const index = texts.length;
        const id = `text-${layerIdRef.current++}`;
        setTexts((current) => [
          ...current,
          {
            ...draftText,
            id,
            text: trimmedText,
            x: Math.max(24, Math.min(64 + index * 16, canvasSize.width - 160)),
            y: Math.max(120, Math.min(180 + index * 24, canvasSize.height - 120)),
          },
        ]);
        setSelectedTextId(id);
      }

      closeTextEditor();
    };

    const removeText = () => {
      if (!editingTextId) return;

      setTexts((current) => current.filter((item) => item.id !== editingTextId));
      setSelectedTextId(null);
      closeTextEditor();
    };

    const updateTextPosition = (id: string, x: number, y: number) => {
      const maxX = Math.max(0, canvasSize.width - 96);
      const maxY = Math.max(0, canvasSize.height - 56);

      setTexts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                x: Math.max(0, Math.min(x, maxX)),
                y: Math.max(0, Math.min(y, maxY)),
              }
            : item,
        ),
      );
    };

    const addSticker = (sticker: StoryStickerSearchItem) => {
      const index = stickers.length;
      const id = `sticker-${sticker.id}-${layerIdRef.current++}`;
      const size = 96;

      setStickers((current) => [
        ...current,
        {
          id,
          imageUrl: sticker.imageUrl,
          size,
          x: Math.max(24, Math.min(82 + index * 18, canvasSize.width - size - 24)),
          y: Math.max(128, Math.min(220 + index * 22, canvasSize.height - size - 128)),
        },
      ]);
      setSelectedStickerId(id);
      setSelectedTextId(null);
      setIsStickerPickerOpen(false);
    };

    const selectSticker = (item: StoryStickerItem) => {
      if (disabled) return;

      setSelectedStickerId(item.id);
      setSelectedTextId(null);
      setIsTextEditorOpen(false);
      setIsStickerPickerOpen(false);
    };

    const removeSelectedSticker = () => {
      if (!selectedStickerId) return;

      setStickers((current) => current.filter((item) => item.id !== selectedStickerId));
      setSelectedStickerId(null);
    };

    const updateStickerPosition = (id: string, x: number, y: number) => {
      const sticker = stickers.find((item) => item.id === id);
      const size = sticker?.size ?? MIN_STICKER_SIZE;
      const maxX = Math.max(0, canvasSize.width - size);
      const maxY = Math.max(0, canvasSize.height - size);

      setStickers((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                x: Math.max(0, Math.min(x, maxX)),
                y: Math.max(0, Math.min(y, maxY)),
              }
            : item,
        ),
      );
    };

    const updateStickerSize = (id: string, size: number) => {
      const nextSize = Math.max(MIN_STICKER_SIZE, Math.min(size, MAX_STICKER_SIZE));

      setStickers((current) =>
        current.map((item) =>
          item.id === id ? { ...item, size: nextSize } : item,
        ),
      );
    };

    const updateTextSize = (id: string, fontSize: number) => {
      const nextSize = Math.max(MIN_TEXT_SIZE, Math.min(fontSize, MAX_TEXT_SIZE));

      setTexts((current) =>
        current.map((item) =>
          item.id === id ? { ...item, fontSize: nextSize } : item,
        ),
      );

      if (editingTextId === id) {
        setDraftText((current) => ({ ...current, fontSize: nextSize }));
      }
    };

    return (
      <View style={styles.container}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.96, result: "tmpfile" }}
          style={styles.captureArea}
        >
          <View collapsable={false} style={styles.canvas} onLayout={handleCanvasLayout}>
            <Image
              source={{ uri }}
              style={styles.image}
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={uri}
            />
            {selectedEffect.overlayColor ? (
              <View
                pointerEvents="none"
                style={[styles.effectOverlay, { backgroundColor: selectedEffect.overlayColor }]}
              />
            ) : null}
            {texts.map((item) => (
              <DraggableStoryText
                key={item.id}
                item={item}
                disabled={disabled || isTextEditorOpen}
                onEdit={openEditText}
                onMove={updateTextPosition}
              />
            ))}
          </View>
        </ViewShot>

        {stickers.map((item) => (
          <DraggableStorySticker
            key={item.id}
            item={item}
            disabled={disabled || isTextEditorOpen || isStickerPickerOpen}
            onMove={updateStickerPosition}
            onSelect={selectSticker}
          />
        ))}

        {selectedText ? (
          <TextSizeScale
            disabled={disabled}
            fontSize={selectedText.fontSize}
            onChange={(fontSize) => updateTextSize(selectedText.id, fontSize)}
          />
        ) : selectedSticker ? (
          <TextSizeScale
            disabled={disabled}
            fontSize={selectedSticker.size}
            onChange={(size) => updateStickerSize(selectedSticker.id, size)}
          />
        ) : null}

        <View pointerEvents={disabled ? "none" : "auto"} style={styles.toolbar}>
          <View style={styles.toolButtonsRow}>
            <Pressable style={[styles.toolButton, disabled && styles.disabled]} onPress={openAddText}>
              <Ionicons color="#FFFFFF" name="create-outline" size={22} />
            </Pressable>
            <Pressable
              style={[styles.toolButton, disabled && styles.disabled]}
              onPress={openStickerPicker}
            >
              <Ionicons color="#FFFFFF" name="happy-outline" size={22} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.effectsRow}
          >
            {EFFECTS.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.effectButton,
                  effect === item.id && styles.effectButtonActive,
                  disabled && styles.disabled,
                ]}
                onPress={() => setEffect(item.id)}
              >
                <Text
                  style={[
                    styles.effectButtonText,
                    effect === item.id && styles.effectButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isTextEditorOpen ? (
          <View style={styles.textEditor}>
            <TextInput
              autoFocus
              maxLength={80}
              placeholder="Digite seu texto"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.textInput,
                { color: draftText.color, fontSize: Math.min(draftText.fontSize, 32) },
              ]}
              value={draftText.text}
              onChangeText={(text) => setDraftText((current) => ({ ...current, text }))}
            />

            <View style={styles.editorGroup}>
              <Text style={styles.editorLabel}>Cor</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
              >
                {TEXT_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    accessibilityLabel={`Selecionar cor ${color}`}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      draftText.color === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setDraftText((current) => ({ ...current, color }))}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.editorActions}>
              {editingTextId ? (
                <Pressable style={styles.removeButton} onPress={removeText}>
                  <Text style={styles.removeButtonText}>Remover</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.cancelButton} onPress={closeTextEditor}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={saveText}>
                <Text style={styles.saveButtonText}>{editingTextId ? "Salvar" : "Adicionar"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isStickerPickerOpen ? (
          <View style={styles.stickerPicker}>
            <View style={styles.stickerSearchRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Buscar figurinhas"
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
                style={styles.stickerSearchInput}
                value={stickerQuery}
                onChangeText={setStickerQuery}
                onSubmitEditing={() => void searchStickers()}
              />
              <Pressable
                disabled={isLoadingStickers}
                style={[styles.stickerSearchButton, isLoadingStickers && styles.disabled]}
                onPress={() => void searchStickers()}
              >
                {isLoadingStickers ? (
                  <ActivityIndicator color={colors.brandDark} size="small" />
                ) : (
                  <Ionicons color={colors.brandDark} name="search" size={18} />
                )}
              </Pressable>
              <Pressable style={styles.stickerCloseButton} onPress={() => setIsStickerPickerOpen(false)}>
                <Ionicons color="#FFFFFF" name="close" size={18} />
              </Pressable>
            </View>

            {stickerError ? <Text style={styles.stickerError}>{stickerError}</Text> : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stickerResults}
            >
              {stickerResults.map((sticker) => (
                <Pressable
                  key={sticker.id}
                  style={styles.stickerResultButton}
                  onPress={() => addSticker(sticker)}
                >
                  <Image
                    source={{ uri: sticker.previewUrl }}
                    style={styles.stickerResultImage}
                    cachePolicy="memory-disk"
                    contentFit="contain"
                    recyclingKey={sticker.previewUrl}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {selectedSticker ? (
          <Pressable style={styles.stickerRemoveButton} onPress={removeSelectedSticker}>
            <Ionicons color="#FFFFFF" name="trash-outline" size={18} />
          </Pressable>
        ) : null}
      </View>
    );
  },
);

function TextSizeScale({
  disabled,
  fontSize,
  onChange,
}: {
  disabled: boolean;
  fontSize: number;
  onChange: (fontSize: number) => void;
}) {
  const disabledRef = useRef(disabled);
  const fontSizeRef = useRef(fontSize);
  const onChangeRef = useRef(onChange);
  const startSizeRef = useRef(fontSize);

  useEffect(() => {
    disabledRef.current = disabled;
    fontSizeRef.current = fontSize;
    onChangeRef.current = onChange;
  }, [disabled, fontSize, onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: () => {
        startSizeRef.current = fontSizeRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        onChangeRef.current(startSizeRef.current - gesture.dy * 0.42);
      },
    }),
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      pointerEvents={disabled ? "none" : "auto"}
      style={[styles.textSizeScale, disabled && styles.disabled]}
    >
      <View style={styles.textSizeScaleTrack}>
        {[28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6].map((width, index) => (
          <View key={index} style={[styles.textSizeScaleMark, { width }]} />
        ))}
      </View>
    </View>
  );
}

function DraggableStorySticker({
  disabled,
  item,
  onMove,
  onSelect,
}: {
  disabled: boolean;
  item: StoryStickerItem;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (item: StoryStickerItem) => void;
}) {
  const position = useRef(new Animated.ValueXY({ x: item.x, y: item.y })).current;
  const startPositionRef = useRef({ x: item.x, y: item.y });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !disabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          onSelect(item);
          startPositionRef.current = { x: item.x, y: item.y };
        },
        onPanResponderMove: (_, gesture) => {
          position.setValue({
            x: startPositionRef.current.x + gesture.dx,
            y: startPositionRef.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (_, gesture) => {
          const nextX = startPositionRef.current.x + gesture.dx;
          const nextY = startPositionRef.current.y + gesture.dy;
          onMove(item.id, nextX, nextY);
        },
        onPanResponderTerminate: (_, gesture) => {
          const nextX = startPositionRef.current.x + gesture.dx;
          const nextY = startPositionRef.current.y + gesture.dy;
          onMove(item.id, nextX, nextY);
        },
      }),
    [disabled, item, onMove, onSelect, position],
  );

  useEffect(() => {
    position.setValue({ x: item.x, y: item.y });
  }, [item.x, item.y, position]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableStickerWrap,
        {
          height: item.size,
          transform: position.getTranslateTransform(),
          width: item.size,
        },
      ]}
    >
      <Pressable disabled={disabled} hitSlop={8} onPress={() => onSelect(item)}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.storySticker}
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={item.imageUrl}
        />
      </Pressable>
    </Animated.View>
  );
}

function DraggableStoryText({
  disabled,
  item,
  onEdit,
  onMove,
}: {
  disabled: boolean;
  item: StoryTextItem;
  onEdit: (item: StoryTextItem) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const position = useRef(new Animated.ValueXY({ x: item.x, y: item.y })).current;
  const startPositionRef = useRef({ x: item.x, y: item.y });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !disabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          startPositionRef.current = { x: item.x, y: item.y };
        },
        onPanResponderMove: (_, gesture) => {
          position.setValue({
            x: startPositionRef.current.x + gesture.dx,
            y: startPositionRef.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (_, gesture) => {
          const nextX = startPositionRef.current.x + gesture.dx;
          const nextY = startPositionRef.current.y + gesture.dy;
          onMove(item.id, nextX, nextY);
        },
        onPanResponderTerminate: (_, gesture) => {
          const nextX = startPositionRef.current.x + gesture.dx;
          const nextY = startPositionRef.current.y + gesture.dy;
          onMove(item.id, nextX, nextY);
        },
      }),
    [disabled, item.id, item.x, item.y, onMove, position],
  );

  useEffect(() => {
    position.setValue({ x: item.x, y: item.y });
  }, [item.x, item.y, position]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableTextWrap,
        {
          transform: position.getTranslateTransform(),
        },
      ]}
    >
      <Pressable disabled={disabled} hitSlop={8} onPress={() => onEdit(item)}>
        <Text
          style={[
            styles.storyText,
            {
              color: item.color,
              fontSize: item.fontSize,
              textShadowColor: item.color === "#111827" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)",
            },
          ]}
        >
          {item.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "800",
  },
  canvas: {
    backgroundColor: "#000000",
    flex: 1,
    overflow: "hidden",
  },
  captureArea: {
    flex: 1,
  },
  colorButton: {
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  colorButtonActive: {
    borderColor: colors.brandGreen,
    transform: [{ scale: 1.12 }],
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
  },
  container: {
    flex: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  draggableTextWrap: {
    left: 0,
    maxWidth: "82%",
    position: "absolute",
    top: 0,
  },
  draggableStickerWrap: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  editorActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  editorGroup: {
    marginTop: 12,
  },
  editorLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  effectButton: {
    backgroundColor: "rgba(17,24,39,0.68)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  effectButtonActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  effectButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  effectButtonTextActive: {
    color: colors.brandDark,
  },
  effectOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  effectsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingRight: 18,
  },
  image: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  removeButton: {
    marginRight: "auto",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeButtonText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: colors.brandGreen,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "900",
  },
  stickerCloseButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 34,
  },
  stickerError: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  stickerPicker: {
    backgroundColor: "rgba(17,24,39,0.96)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 22,
    borderWidth: 1,
    left: 16,
    maxHeight: 210,
    padding: 12,
    position: "absolute",
    right: 16,
    top: 96,
  },
  stickerRemoveButton: {
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.84)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: "18%",
    width: 42,
    zIndex: 20,
  },
  stickerResultButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    borderWidth: 1,
    height: 76,
    justifyContent: "center",
    overflow: "hidden",
    width: 76,
  },
  stickerResultImage: {
    height: "100%",
    width: "100%",
  },
  stickerResults: {
    gap: 10,
    paddingTop: 12,
    paddingRight: 8,
  },
  stickerSearchButton: {
    alignItems: "center",
    backgroundColor: colors.brandGreen,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 44,
  },
  stickerSearchInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    borderWidth: 1,
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    height: 40,
    paddingHorizontal: 12,
  },
  stickerSearchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  storySticker: {
    height: "100%",
    width: "100%",
  },
  storyText: {
    fontWeight: "900",
    textShadowOffset: { height: 1, width: 1 },
    textShadowRadius: 4,
  },
  textEditor: {
    backgroundColor: "rgba(17,24,39,0.96)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 22,
    borderWidth: 1,
    left: 16,
    padding: 14,
    position: "absolute",
    right: 16,
    top: 96,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    borderWidth: 1,
    fontWeight: "900",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textSizeScale: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.58)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 28,
    borderWidth: 1,
    height: 200,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 18,
    position: "absolute",
    right: 12,
    top: "25%",
    width: 34,
    zIndex: 18,
  },
  textSizeScaleMark: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 999,
    height: 5,
  },
  textSizeScaleTrack: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    width: "90%",
  },
  toolbar: {
    bottom: 146,
    gap: 10,
    left: 16,
    position: "absolute",
    right: 16,
  },
  toolButtonsRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  toolButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.78)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});

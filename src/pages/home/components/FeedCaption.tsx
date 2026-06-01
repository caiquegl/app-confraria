import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

const PREVIEW_LINES = 3;
const MIN_CHARS_FOR_TOGGLE = 120;

type FeedCaptionProps = {
  text: string;
};

export function FeedCaption({ text }: FeedCaptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(text.length > MIN_CHARS_FOR_TOGGLE);

  const handleTextLayout = (lineCount: number) => {
    if (!expanded) {
      setIsTruncated(lineCount >= PREVIEW_LINES || text.length > MIN_CHARS_FOR_TOGGLE);
    }
  };

  const showToggle = isTruncated;

  return (
    <View style={styles.container}>
      <Text
        style={styles.caption}
        numberOfLines={expanded ? undefined : PREVIEW_LINES}
        onTextLayout={(event) => handleTextLayout(event.nativeEvent.lines.length)}
      >
        {text}
      </Text>

      {showToggle && (
        <Pressable hitSlop={8} onPress={() => setExpanded((current) => !current)}>
          <Text style={styles.toggle}>{expanded ? "ver menos" : "ver mais"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  toggle: {
    color: colors.brandPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
});

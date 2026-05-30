import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/colors";

type LogoProps = {
  variant?: "black" | "white";
  width?: number;
  height?: number;
};

export function Logo({ height = 48, variant = "black", width = 80 }: LogoProps) {
  const color = variant === "black" ? colors.brandDark : "#FFFFFF";
  const accent = colors.brandGreen;

  return (
    <Svg width={width} height={height} viewBox="0 0 100 60" fill="none" style={{ width, height }}>
      <Path
        d="M45 30C45 38.2843 38.2843 45 30 45C21.7157 45 15 38.2843 15 30C15 21.7157 21.7157 15 30 15C33.6 15 36.9 16.3 39.4 18.5"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M55 30C55 38.2843 61.7157 45 70 45C78.2843 45 85 38.2843 85 30C85 21.7157 78.2843 15 70 15"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M40 20L60 40"
        stroke="transparent"
        strokeWidth={4}
      />
      <Path
        d="M39 19C41 17 44 15 48 15L75 15"
        stroke={accent}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M48 15L43 25"
        stroke={accent}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

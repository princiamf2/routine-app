/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primaryGreen = "#2F7D46";
const softGreen = "#DDE8D8";
const creamBackground = "#F4F1EA";
const darkText = "#1F2A24";
const secondaryText = "#5F6F64";
const whiteCard = "#FFFFFF";

export const Colors = {
  light: {
    text: darkText,
    secondaryText: secondaryText,
    background: creamBackground,
    card: whiteCard,
    primary: primaryGreen,
    soft: softGreen,

    tint: primaryGreen,

    icon: secondaryText,
    tabIconDefault: secondaryText,
    tabIconSelected: primaryGreen,
  },

  dark: {
    text: "#ECEDEE",
    secondaryText: "#9BA1A6",
    background: "#151718",
    card: "#222526",
    primary: "#4DAA68",
    soft: "#2B3A30",

    tint: "#FFFFFF",

    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#FFFFFF",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

import { Image, type ImageProps } from 'expo-image';
import { type ImageStyle, type StyleProp } from 'react-native';

const STAR_LOGO_SOURCE = require('../assets/images/star-logo.svg');

type StarLogoProps = {
  style?: StyleProp<ImageStyle>;
  tintColor?: ImageProps['tintColor'];
};

export function StarLogo({ style, tintColor }: StarLogoProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="North Star logo"
      contentFit="contain"
      source={STAR_LOGO_SOURCE}
      style={style}
      tintColor={tintColor}
    />
  );
}

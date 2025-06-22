import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS, SPACING } from '../../constants/theme';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
}

const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  style 
}) => {
  const logoSize = {
    small: { width: 60, height: 60, fontSize: FONTS.size.lg },
    medium: { width: 120, height: 120, fontSize: FONTS.size.xxl },
    large: { width: 180, height: 180, fontSize: FONTS.size.xxxl },
  };

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={require('../../../assets/logo-splash.png')}
        style={[styles.logo, logoSize[size]]}
        resizeMode="contain"
      />
      {/* {showText && (
        <Text style={[styles.appName, { fontSize: logoSize[size].fontSize }]}>
          KrishiVeda
        </Text>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: SPACING.sm,
  },
  appName: {
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
});

export default AppLogo;


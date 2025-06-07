import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export const loadingSpinnerStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.large,
  },
  message: {
    marginTop: SPACING.medium,
    fontSize: FONTS.sizes.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});


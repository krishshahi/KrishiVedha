import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

// Hardcoded theme values to avoid undefined errors
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

const FONTS = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
};

export const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  descriptionText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    textTransform: 'capitalize',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  feelsLikeText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
  },
  detailsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginLeft: SPACING.xs,
  },
  updateTime: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.primaryLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});


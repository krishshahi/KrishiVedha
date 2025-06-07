import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: SPACING.medium,
    marginVertical: SPACING.small,
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
    marginBottom: SPACING.small,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  descriptionText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
  temperatureContainer: {
    alignItems: 'center',
    marginVertical: SPACING.medium,
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  feelsLikeText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.textLight,
  },
  detailsContainer: {
    marginTop: SPACING.medium,
    paddingTop: SPACING.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.small,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginLeft: SPACING.tiny,
  },
  updateTime: {
    fontSize: FONTS.sizes.tiny,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.small,
  },
});


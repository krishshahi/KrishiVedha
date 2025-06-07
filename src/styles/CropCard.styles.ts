import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export const cropCardStyles = StyleSheet.create({
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
    marginBottom: SPACING.medium,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cropNameEn: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
  },
  waterIndicator: {
    alignItems: 'center',
  },
  waterText: {
    fontSize: FONTS.sizes.tiny,
    marginTop: 2,
  },
  seasonContainer: {
    marginBottom: SPACING.medium,
  },
  seasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.tiny,
  },
  seasonLabel: {
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.tiny,
    marginRight: SPACING.tiny,
  },
  seasonText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  durationText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginLeft: SPACING.tiny,
  },
  detailsContainer: {
    marginTop: SPACING.medium,
    paddingTop: SPACING.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.tiny,
  },
  detailLabel: {
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
    color: COLORS.text,
    width: 60,
  },
  detailValue: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    flex: 1,
  },
  tipsContainer: {
    marginTop: SPACING.medium,
  },
  tipsHeader: {
    fontSize: FONTS.sizes.small,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.tiny,
  },
  tipText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginBottom: SPACING.tiny,
    lineHeight: 18,
  },
});


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

export const cropCardStyles = StyleSheet.create({
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
    marginBottom: SPACING.md,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  cropNameEn: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
  },
  waterIndicator: {
    alignItems: 'center',
  },
  waterText: {
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  seasonContainer: {
    marginBottom: SPACING.md,
  },
  seasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  seasonLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
    marginRight: SPACING.xs,
  },
  seasonText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  durationText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginLeft: SPACING.xs,
  },
  detailsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    width: 60,
  },
  detailValue: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    flex: 1,
  },
  tipsContainer: {
    marginTop: SPACING.md,
  },
  tipsHeader: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stageText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});


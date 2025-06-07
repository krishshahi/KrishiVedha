import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  appName: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  tagline: {
    fontSize: FONTS.size.md,
    color: COLORS.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  weatherSummary: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    margin: SPACING.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherInfo: {
    flex: 1,
  },
  temperatureText: {
    fontSize: FONTS.size.xxxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  locationText: {
    fontSize: FONTS.size.md,
    color: COLORS.textWhite,
  },
  weatherCondition: {
    fontSize: FONTS.size.md,
    color: COLORS.textWhite,
    opacity: 0.9,
  },
  weatherDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  weatherDetail: {
    fontSize: FONTS.size.sm,
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.sm,
  },
  featureCard: {
    width: '46%',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    margin: SPACING.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  alertContainer: {
    marginHorizontal: SPACING.md,
  },
  alertItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alertDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  calendarContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  calendarItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  calendarDate: {
    width: 50,
    height: 60,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  calendarDay: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  calendarMonth: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  calendarContent: {
    flex: 1,
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  calendarDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
});

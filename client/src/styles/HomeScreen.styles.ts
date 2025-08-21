import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, SPACING, FONTS, SHADOWS, BORDER_RADIUS } from '../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.sm,
    fontWeight: '600',
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
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
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
    color: COLORS.text.primary,
  },
  calendarDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  calendarIcon: {
    fontSize: 24,
    marginLeft: SPACING.sm,
  },
  // Stats section styles
  statsContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statNumber: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: SPACING.lg,
    fontStyle: 'italic',
  },
  // Farms section styles
  farmsContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  farmCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  farmIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  farmIconText: {
    fontSize: 24,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  farmLocation: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  farmArea: {
    fontSize: FONTS.size.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: FONTS.size.lg,
    color: COLORS.error,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});

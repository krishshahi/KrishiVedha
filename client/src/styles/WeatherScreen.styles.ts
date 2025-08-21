import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

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
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
  },
  scrollView: {
    flex: 1,
  },
  currentWeather: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    margin: SPACING.md,
    padding: SPACING.md,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
  },
  locationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
  },
  locationButtonText: {
    color: COLORS.text.primaryWhite,
    fontSize: FONTS.size.sm,
  },
  weatherMainInfo: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  temperatureText: {
    fontSize: FONTS.size.xxxl,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
  },
  weatherCondition: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryWhite,
    opacity: 0.9,
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  weatherDetailItem: {
    alignItems: 'center',
  },
  weatherDetailIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  weatherDetailTitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryWhite,
    opacity: 0.8,
  },
  weatherDetailValue: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
  },
  alertContainer: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
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
    color: COLORS.text.primaryLight,
  },
  alertButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
  },
  alertButtonText: {
    color: COLORS.text.primaryWhite,
    fontSize: FONTS.size.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 25,
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
  },
  activeTabText: {
    color: COLORS.text.primaryWhite,
    fontWeight: 'bold',
  },
  hourlyForecastContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  forecastTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  hourlyScroll: {
    flexDirection: 'row',
  },
  forecastItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 60,
  },
  forecastTime: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.xs,
  },
  forecastIcon: {
    fontSize: 24,
    marginVertical: SPACING.xs,
  },
  forecastTemp: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  forecastPrecip: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent,
  },
  dailyForecastContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dailyDay: {
    width: 60,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  dailyIcon: {
    width: 40,
    fontSize: 24,
    textAlign: 'center',
  },
  dailyTempContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dailyHighTemp: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginRight: SPACING.md,
  },
  dailyLowTemp: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
  },
  dailyPrecip: {
    width: 40,
    fontSize: FONTS.size.md,
    color: COLORS.accent,
    textAlign: 'right',
  },
  impactContainer: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.lg,
  },
  impactItem: {
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
  impactIcon: {
    fontSize: 30,
    marginRight: SPACING.md,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  impactDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    lineHeight: 20,
  },
});


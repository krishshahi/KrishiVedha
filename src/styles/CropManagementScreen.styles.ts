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
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  cropsContainer: {
    padding: SPACING.md,
  },
  actionButtonContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  cropCard: {
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
  cropImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cropImagePlaceholder: {
    fontSize: 30,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cropStage: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  daysRemaining: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent,
  },
  weatherImpactContainer: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  weatherImpactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderRadius: 10,
    padding: SPACING.md,
  },
  weatherImpactIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  weatherImpactTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  weatherImpactDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  calendarContainer: {
    padding: SPACING.md,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  monthSelectorArrow: {
    fontSize: FONTS.size.xl,
    color: COLORS.primary,
    padding: SPACING.sm,
  },
  currentMonth: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  calendarEventList: {
    marginBottom: SPACING.md,
  },
  eventItem: {
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
  completedEvent: {
    opacity: 0.7,
  },
  eventDate: {
    width: 50,
    height: 60,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  eventDay: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  eventMonth: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  eventDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  eventStatus: {
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  statusIndicator: {
    width: 15,
    height: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  completedIndicator: {
    backgroundColor: COLORS.primary,
  },
  guideContainer: {
    padding: SPACING.md,
  },
  searchContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchPlaceholder: {
    color: COLORS.placeholder,
  },
  cropCategoryContainer: {
    marginBottom: SPACING.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  categoryIcon: {
    fontSize: 30,
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recommendationContainer: {
    marginBottom: SPACING.xl,
  },
  recommendationItem: {
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
  recommendationIcon: {
    fontSize: 30,
    marginRight: SPACING.md,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recommendationDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});


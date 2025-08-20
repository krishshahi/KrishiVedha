import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS, SHADOWS, BORDER_RADIUS } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  
  // Header Styles
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    ...SHADOWS.small,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
    marginBottom: SPACING.xs,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textWhite + 'CC',
    flex: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  offlineText: {
    fontSize: FONTS.size.xs,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: SPACING.xs / 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scrollContainer: {
    flex: 1,
  },
  debugText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  loading: {
    fontSize: FONTS.size.md,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  error: {
    fontSize: FONTS.size.md,
    color: COLORS.error || '#ff0000',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.text.primaryWhite,
    fontWeight: 'bold',
  },
  farmContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  farmName: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  farmInfo: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.sm,
  },
  noCropsContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  noCropsText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.sm,
  },
  addCropButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addCropButtonText: {
    color: COLORS.text.primaryWhite,
    fontWeight: 'bold',
  },
  cropContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cropName: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  cropVariety: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
  },
  cropStatus: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent,
  },
  weatherImpactCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.warning}20`,
    borderRadius: 10,
    padding: SPACING.md,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
    elevation: 2,
  },
  statNumber: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Controls (Search & Filters)
  controlsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    elevation: 1,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.background,
  },

  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: SPACING.lg,
  },
  errorText: {
    fontSize: FONTS.size.md,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateMessage: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.sm,
  },

  // Farms Container
  farmsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Farm Card
  farmCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 3,
    overflow: 'hidden',
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight + '10',
  },
  farmHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmInfo: {
    marginLeft: SPACING.md,
  },
  farmName: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },
  farmSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  farmHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addCropButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  deleteFarmButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.error,
  },

  // Empty Crops State
  emptyCropsState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyCropsText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  addFirstCropButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addFirstCropText: {
    fontSize: FONTS.size.md,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Crops Container
  cropsContainer: {
    padding: SPACING.md,
  },

  // Crop Card
  cropCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cropImageContainer: {
    marginRight: SPACING.sm,
  },
  cropCardImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  cropName: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },
  cropVariety: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  cropCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteCropButton: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Progress
  cropProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.xs,
  },
  progressText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  // Dates
  cropDates: {
    gap: SPACING.xs,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },

  // ML Health Analysis Styles
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs / 2,
  },

  healthScoreText: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    marginLeft: SPACING.xs / 2,
  },

  mlInsightsContainer: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs / 2,
  },

  diseaseAlert: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  diseaseAlertText: {
    fontSize: FONTS.size.xs,
    fontWeight: '500',
    marginLeft: SPACING.xs / 2,
    flex: 1,
  },

  growthPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  growthPredictionText: {
    fontSize: FONTS.size.xs,
    color: COLORS.info,
    marginLeft: SPACING.xs / 2,
    fontWeight: '500',
  },

  topRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  recommendationText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs / 2,
    flex: 1,
    fontWeight: '500',
  },
});

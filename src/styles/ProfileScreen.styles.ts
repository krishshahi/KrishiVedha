import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';

export const profileScreenStyles = StyleSheet.create({
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileImagePlaceholder: {
    fontSize: 50,
  },
  profileName: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  profileType: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  farmSection: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  addButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  farmCard: {
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
  farmIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  farmIcon: {
    fontSize: 30,
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
  farmCrops: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primary,
  },
  farmSize: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primary,
  },
  settingsSection: {
    padding: SPACING.md,
  },
  settingsGroup: {
    marginBottom: SPACING.lg,
  },
  settingsGroupTitle: {
    fontSize: FONTS.size.md,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
  },
  settingValue: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  chevronIcon: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  logoutButton: {
    backgroundColor: COLORS.danger + '20',
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONTS.size.md,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  retryButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  emptyFarmsContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  emptyFarmsText: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  emptyFarmsSubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});


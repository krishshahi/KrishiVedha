import { StyleSheet, Platform, StatusBar } from 'react-native';
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

export const profileScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
    textAlign: 'center',
    flex: 1,
  },
  headerBack: {
    color: COLORS.text.primaryWhite,
    fontSize: 30,
    position: 'absolute',
    left: SPACING.lg,
    top: SPACING.xl - 5,
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
  profileImageButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  
  profileImageButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  profileName: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  profileType: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.md,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: COLORS.text.primaryWhite,
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
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.xs,
  },
  farmCrops: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primary,
  },
  
  // Profile details container styles
  profileDetailsContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '20',
  },
  
  profileDetailLabel: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 0.3,
  },
  
  profileDetailValue: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    flex: 0.7,
    textAlign: 'right',
  },
  
  profileDetailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 0.7,
  },
  
  verificationBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
  },
  
  verificationText: {
    color: COLORS.text.primaryWhite,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  profileInfo: {
    alignItems: 'center',
  },
  
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  profileEmail: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.xs,
  },
  
  profileLocation: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
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
    color: COLORS.text.primaryLight,
  },
  chevronIcon: {
    fontSize: 24,
    color: COLORS.text.primaryLight,
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
    color: COLORS.text.primaryLight,
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
    color: COLORS.text.primaryWhite,
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
    color: COLORS.text.primaryLight,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  emptyFarmsSubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    textAlign: 'center',
  },
  editForm: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    marginVertical: SPACING.sm,
    padding: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitleContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitleText: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryLight,
    paddingBottom: SPACING.xs,
  },
  inputGroup: {
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: COLORS.disabled,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primaryLight,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  saveButtonText: {
    color: COLORS.text.primaryWhite,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  cancelButtonText: {
    color: COLORS.text.primary,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
  
  // Enhanced profile section styles
  profileInfo: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  
  profileEmail: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginBottom: SPACING.xs,
  },
  
  profileLocation: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
  },
  
  // Header with edit button
  editButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 15,
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.xl + 5,
  },
  
  editButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
  },
  
  // Quick actions
  quickActionsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  statLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginTop: SPACING.xs,
  },
  
  quickActionButton: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    marginRight: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  quickActionText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  
  verificationBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
  },
  
  verificationText: {
    color: COLORS.text.primaryWhite,
    fontSize: FONTS.size.xs,
    fontWeight: 'bold',
  },
  
  // Enhanced section container
  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  
  // View all button
  viewAllButton: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  
  viewAllText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  
  modalTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  modalCancelButton: {
    color: COLORS.text.primaryLight,
    fontSize: FONTS.size.md,
  },
  
  modalSaveButton: {
    color: COLORS.primary,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  
  modalSaveButtonDisabled: {
    color: COLORS.text.primaryLight,
  },
  
  modalContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  
  inputHelper: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.primaryLight,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  
  // Profile Image Section Styles
  profileImageSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  profileImagePlaceholderText: {
    fontSize: 50,
    color: COLORS.text.primaryLight,
  },
  
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  cameraIconText: {
    fontSize: 16,
  },
  
  profileImageHint: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});


import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../constants/colors';

// Define spacing and fonts locally if not available
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
  },
  eyeButton: {
    padding: SPACING.sm,
    paddingRight: SPACING.md,
  },
  eyeText: {
    fontSize: 18,
  },
  strengthContainer: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginRight: SPACING.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FONTS.size.sm,
    fontWeight: '500',
    minWidth: 50,
  },
  passwordMismatchText: {
    color: COLORS.error,
    fontSize: FONTS.size.sm,
    marginTop: SPACING.xs,
  },
  requirementsContainer: {
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
    marginBottom: SPACING.lg,
  },
  requirementsTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  requirementText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  apiErrorContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  apiErrorText: {
    color: COLORS.error,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: COLORS.primary + '60',
  },
  resetButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.md,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: FONTS.size.md,
    fontWeight: '600',
  },
  // Error/Invalid state styles
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
    marginBottom: SPACING.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  errorListItem: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    maxWidth: 400,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    minHeight: 48,
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.size.md,
    fontWeight: '500',
  },
});

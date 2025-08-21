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
    minHeight: 400,
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
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.card,
  },
  errorContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  errorText: {
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
  // Success state styles
  successContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    marginBottom: SPACING.xl,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  successText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  helpText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
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

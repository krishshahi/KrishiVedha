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
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONTS.size.xxxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 40,
    color: COLORS.textWhite,
  },
  appName: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.size.md,
    backgroundColor: COLORS.card,
    color: COLORS.text.primary,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.sm,
    padding: SPACING.xs,
  },
  passwordToggleText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: SPACING.xs,
  },
  socialButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
  },
  signupButton: {
    marginLeft: SPACING.xs,
  },
  signupButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
  },
});


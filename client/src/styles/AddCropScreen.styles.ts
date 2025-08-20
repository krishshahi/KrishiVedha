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
    padding: SPACING.md,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primaryWhite,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  label: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  picker: {
    height: 50,
    color: COLORS.text.primary,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  datePickerText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
  },
  datePickerPlaceholder: {
    fontSize: FONTS.size.md,
    color: COLORS.placeholder,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  buttonText: {
    color: COLORS.text.primaryWhite,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  cropTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  cropTypeButton: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cropTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  cropTypeText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
  },
  cropTypeTextActive: {
    color: COLORS.text.primaryWhite,
  },
  helpText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primaryLight,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  datePickerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePickerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

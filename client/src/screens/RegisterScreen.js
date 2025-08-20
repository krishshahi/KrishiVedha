import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { register, authError, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmSize: '',
    location: '',
    cropTypes: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const authService = await import('../services/authService').then(m => m.default);
      await authService.initialize();
      const authState = authService.getAuthState();
      setBiometricAvailable(authState.biometricAvailable);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Farm size validation
    if (!formData.farmSize.trim()) {
      errors.farmSize = 'Farm size is required';
    } else if (isNaN(parseFloat(formData.farmSize)) || parseFloat(formData.farmSize) <= 0) {
      errors.farmSize = 'Please enter a valid farm size';
    }

    // Location validation
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }

    // Crop types validation
    if (!formData.cropTypes.trim()) {
      errors.cropTypes = 'Crop types are required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields.');
      return;
    }

    setLoading(true);
    clearError();
    
    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      farmSize: parseFloat(formData.farmSize),
      location: formData.location.trim(),
      cropTypes: formData.cropTypes.trim(),
      enableBiometric: enableBiometric && biometricAvailable,
    };

    const result = await register(registrationData);
    
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Registration Successful!',
        `Welcome to KrishiVedha, ${result.user.name}! Your account has been created successfully.`
      );
      // Navigation will be handled automatically by the AuthContext state change
    }
    // Error handling is now done through authError state and displayed inline
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: '', color: '#ccc' };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(check => check).length;

    if (strength <= 2) return { strength: strength / 5, text: 'Weak', color: '#f44336' };
    if (strength <= 3) return { strength: strength / 5, text: 'Fair', color: '#ff9800' };
    if (strength <= 4) return { strength: strength / 5, text: 'Good', color: '#2196f3' };
    return { strength: strength / 5, text: 'Strong', color: '#4caf50' };
  };

  const passwordStrength = getPasswordStrength();

  const renderInputField = (
    fieldKey,
    placeholder,
    iconName,
    options = {}
  ) => {
    const {
      secureTextEntry = false,
      keyboardType = 'default',
      autoCapitalize = 'words',
      multiline = false,
      showPasswordToggle = false,
      passwordVisible = false,
      onTogglePassword = () => {},
    } = options;

    return (
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          validationErrors[fieldKey] && styles.inputWrapperError
        ]}>
          <Icon name={iconName} size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, multiline && styles.textInputMultiline]}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={formData[fieldKey]}
            onChangeText={(value) => updateFormData(fieldKey, value)}
            secureTextEntry={secureTextEntry && !passwordVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={!loading}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
          {showPasswordToggle && (
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={onTogglePassword}
            >
              <Icon
                name={passwordVisible ? 'visibility-off' : 'visibility'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          )}
        </View>
        {validationErrors[fieldKey] && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={16} color="#f44336" />
            <Text style={styles.errorText}>{validationErrors[fieldKey]}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.logoContainer}
            >
              <Icon name="agriculture" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Join KrishiVedha</Text>
            <Text style={styles.subtitle}>Start your smart farming journey</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Fill in your details to get started</Text>

            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInputField('name', 'Full Name', 'person')}
            {renderInputField('email', 'Email Address', 'email', {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {/* Password Fields */}
            <Text style={styles.sectionTitle}>Security</Text>
            
            {renderInputField('password', 'Password', 'lock', {
              secureTextEntry: true,
              autoCapitalize: 'none',
              showPasswordToggle: true,
              passwordVisible: showPassword,
              onTogglePassword: () => setShowPassword(!showPassword),
            })}

            {/* Password Strength Indicator */}
            {formData.password && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View
                    style={[
                      styles.passwordStrengthFill,
                      {
                        width: `${passwordStrength.strength * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}

            {renderInputField('confirmPassword', 'Confirm Password', 'lock', {
              secureTextEntry: true,
              autoCapitalize: 'none',
              showPasswordToggle: true,
              passwordVisible: showConfirmPassword,
              onTogglePassword: () => setShowConfirmPassword(!showConfirmPassword),
            })}

            {/* Farm Information */}
            <Text style={styles.sectionTitle}>Farm Details</Text>
            
            {renderInputField('farmSize', 'Farm Size (hectares)', 'landscape', {
              keyboardType: 'decimal-pad',
              autoCapitalize: 'none',
            })}
            
            {renderInputField('location', 'Farm Location', 'location-on')}
            
            {renderInputField('cropTypes', 'Crop Types (comma separated)', 'grass', {
              autoCapitalize: 'none',
              multiline: true,
            })}

            {/* Biometric Setup */}
            {biometricAvailable && (
              <View style={styles.biometricSection}>
                <Text style={styles.sectionTitle}>Security Options</Text>
                <TouchableOpacity
                  style={styles.biometricOption}
                  onPress={() => setEnableBiometric(!enableBiometric)}
                >
                  <View style={styles.biometricOptionContent}>
                    <Icon name="fingerprint" size={24} color="#4CAF50" />
                    <View style={styles.biometricOptionText}>
                      <Text style={styles.biometricOptionTitle}>
                        Enable Biometric Login
                      </Text>
                      <Text style={styles.biometricOptionDescription}>
                        Use fingerprint or face recognition for quick access
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    enableBiometric && styles.checkboxChecked
                  ]}>
                    {enableBiometric && (
                      <Icon name="check" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* API Error Display */}
            {authError && (
              <View style={styles.apiErrorContainer}>
                <Icon name="error" size={24} color="#f44336" />
                <View style={styles.apiErrorContent}>
                  <Text style={styles.apiErrorTitle}>Registration Error</Text>
                  <Text style={styles.apiErrorMessage}>{authError}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.clearErrorButton}
                  onPress={clearError}
                >
                  <Icon name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#ccc', '#aaa'] : ['#4CAF50', '#45a049']}
                style={styles.registerButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="person-add" size={20} color="#fff" />
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Privacy */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputWrapperError: {
    borderColor: '#f44336',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
  },
  textInputMultiline: {
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginLeft: 4,
    flex: 1,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  biometricSection: {
    marginTop: 8,
  },
  biometricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  biometricOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  biometricOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  biometricOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  biometricOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  apiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  apiErrorContent: {
    flex: 1,
    marginLeft: 12,
  },
  apiErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4,
  },
  apiErrorMessage: {
    fontSize: 14,
    color: '#c62828',
    lineHeight: 20,
  },
  clearErrorButton: {
    padding: 4,
    marginLeft: 8,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  legalSection: {
    padding: 16,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default RegisterScreen;

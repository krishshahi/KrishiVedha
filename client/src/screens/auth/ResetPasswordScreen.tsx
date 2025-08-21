import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { resetPassword, verifyResetToken, clearError } from '../../store/slices/authSlice';
import { COLORS } from '../../constants/colors';
import { styles } from '../../styles/ResetPasswordScreen.styles';
import AppLogo from '../../components/common/AppLogo';

interface ResetPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      token: string;
    };
  };
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const { token } = route.params;

  useEffect(() => {
    // Verify token validity when component mounts
    const verifyToken = async () => {
      if (token) {
        const result = await dispatch(verifyResetToken(token));
        if (verifyResetToken.fulfilled.match(result)) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          Alert.alert(
            'Invalid Link',
            'This password reset link is invalid or has expired. Please request a new one.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('ForgotPassword')
              }
            ]
          );
        }
      } else {
        setTokenValid(false);
        Alert.alert(
          'Invalid Link',
          'No reset token provided. Please use the link from your email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    };

    verifyToken();
  }, [token, dispatch, navigation]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: COLORS.text.secondary };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    strength = checks.filter(check => check).length;

    if (strength <= 2) return { strength: strength / 5, text: 'Weak', color: COLORS.error };
    if (strength <= 3) return { strength: strength / 5, text: 'Fair', color: COLORS.warning };
    if (strength <= 4) return { strength: strength / 5, text: 'Good', color: COLORS.info };
    return { strength: strength / 5, text: 'Strong', color: COLORS.success };
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your new password');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Password Requirements', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Clear any previous errors
    dispatch(clearError());
    
    // Dispatch reset password action
    const result = await dispatch(resetPassword({ token, newPassword }));
    
    if (resetPassword.fulfilled.match(result)) {
      Alert.alert(
        'Password Reset Successfully',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      Alert.alert('Error', result.payload as string);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  if (tokenValid === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (tokenValid === false) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <AppLogo size="medium" style={styles.logoContainer} />
            <Text style={styles.title}>Invalid Link</Text>
            <Text style={styles.subtitle}>
              This password reset link is invalid or has expired
            </Text>

            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>
                The reset link you clicked is no longer valid. This could be because:
              </Text>
              <Text style={styles.errorListItem}>• The link has expired (24-hour limit)</Text>
              <Text style={styles.errorListItem}>• The link has already been used</Text>
              <Text style={styles.errorListItem}>• A new reset was requested</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={navigateToForgotPassword}
              >
                <Text style={styles.primaryButtonText}>Request New Reset Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={navigateToLogin}
              >
                <Text style={styles.secondaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <AppLogo size="medium" style={styles.logoContainer} />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.text.secondary}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${passwordStrength.strength * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.text.secondary}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={styles.passwordMismatchText}>Passwords do not match</Text>
              )}
            </View>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementText}>• At least 8 characters long</Text>
              <Text style={styles.requirementText}>• Contains uppercase and lowercase letters</Text>
              <Text style={styles.requirementText}>• Contains at least one number</Text>
            </View>

            {error && (
              <View style={styles.apiErrorContainer}>
                <Text style={styles.apiErrorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.textWhite} />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;

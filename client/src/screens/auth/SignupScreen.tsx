import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { registerUser, clearError } from '../../store/slices/authSlice';
import DropDownPicker from 'react-native-dropdown-picker';
import { COLORS } from '../../constants/colors';
import { styles } from '../../styles/SignupScreen.styles';
import AppLogo from '../../components/common/AppLogo';
import locationData from '../../data/locations.json';

interface SignupScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Dropdown states
  const [openCountry, setOpenCountry] = useState(false);
  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const countries = locationData.countries.map(c => ({ label: c.name, value: c.name }));
  const provinces = country ? locationData.countries
    .find(c => c.name === country)?.states
    .map(s => ({ label: s.name, value: s.name })) || [] : [];
  const districts = province ? locationData.countries
    .find(c => c.name === country)?.states
    .find(s => s.name === province)?.districts
    .map(d => ({ label: d.name, value: d.name })) || [] : [];

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !email.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      if (!isValidEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    } else if (step === 2) {
      if (!phone.trim() || !country || !province || !district) {
        Alert.alert('Error', 'Please fill in all contact information');
        return;
      }
    } else if (step === 3) {
      if (!password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all password fields');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
      handleSignup();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    dispatch(clearError());
    
    // Format location as a string for backend compatibility
    const locationString = [district, province, country].filter(Boolean).join(', ');
    
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: locationString,
      password
    };

    const result = await dispatch(registerUser(userData));
    
    if (registerUser.rejected.match(result)) {
      Alert.alert('Signup Failed', result.payload as string);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Contact Information';
      case 3: return 'Account Security';
      default: return 'Sign Up';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Tell us about yourself';
      case 2: return 'How can we reach you?';
      case 3: return 'Secure your account';
      default: return '';
    }
  };

return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <AppLogo size="medium" style={styles.logoContainer} />

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>Step {step} of 3</Text>
            </View>

            {/* Step Navigation Dots */}
            <View style={styles.stepDots}>
              {[1, 2, 3].map((stepNum) => (
                <View
                  key={stepNum}
                  style={[
                    styles.stepDot,
                    step >= stepNum && styles.stepDotActive
                  ]}
                />
              ))}
            </View>

            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

            <View style={styles.form}>
              {step === 1 && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor={COLORS.text.secondary}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email address"
                      placeholderTextColor={COLORS.text.secondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter your phone number"
                      placeholderTextColor={COLORS.text.secondary}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Country *</Text>
                    <DropDownPicker
                      open={openCountry}
                      value={country}
                      items={countries}
                      setOpen={setOpenCountry}
                      setValue={setCountry}
                      setItems={() => {}}
                      onSelectItem={(item) => {
                        if (item.value !== country) {
                          setProvince('');
                          setDistrict('');
                        }
                      }}
                      placeholder="Select your country"
                      listMode="MODAL"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownList}
                      textStyle={styles.dropdownText}
                      zIndex={3000}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>State/Province *</Text>
                    <DropDownPicker
                      open={openProvince}
                      value={province}
                      items={provinces}
                      setOpen={setOpenProvince}
                      setValue={setProvince}
                      setItems={() => {}}
                      onSelectItem={(item) => {
                        if (item.value !== province) {
                          setDistrict('');
                        }
                      }}
                      placeholder="Select your state/province"
                      disabled={!country}
                      listMode="MODAL"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownList}
                      textStyle={styles.dropdownText}
                      zIndex={2000}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>District *</Text>
                    <DropDownPicker
                      open={openDistrict}
                      value={district}
                      items={districts}
                      setOpen={setOpenDistrict}
                      setValue={setDistrict}
                      setItems={() => {}}
                      placeholder="Select your district"
                      disabled={!province}
                      listMode="MODAL"
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownList}
                      textStyle={styles.dropdownText}
                      zIndex={1000}
                    />
                  </View>
                </>
              )}

              {step === 3 && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a strong password"
                      placeholderTextColor={COLORS.text.secondary}
                      secureTextEntry
                      returnKeyType="next"
                    />
                    <Text style={styles.helperText}>Minimum 6 characters</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor={COLORS.text.secondary}
                      secureTextEntry
                      returnKeyType="done"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  disabled={isLoading}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  step === 1 && styles.fullWidthButton,
                  isLoading && styles.disabledButton
                ]}
                onPress={handleNext}
                disabled={isLoading}
              >
                <Text style={styles.nextButtonText}>
                  {isLoading ? 'Please wait...' : step === 3 ? 'Create Account' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default SignupScreen;


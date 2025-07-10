import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AuthWrapper from '@/components/auth/authWrapper';
import { useDarkMode } from '@/context/DarkModeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { resetPasswordWithEmail } from '@/api/auth';

export default function ForgotPassword() {
  const params = useLocalSearchParams();
  const shouldShowVerifyBadge = params?.verify === "1";
  const { isDarkMode } = useDarkMode();
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const mutedText = isDarkMode ? '#9CA3AF' : 'rgba(0, 0, 0, 0.2)';
  const backgroundColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF';
  const inputBackground = isDarkMode ? 'rgba(0, 0, 0, 0.1)' : '#fff';
  const inputTextColor = isDarkMode ? '#fff' : '#000';

  const [email, setEmail] = useState('');
  const [wasAttempted, setWasAttempted] = useState(false);
  const [cachedError, setCachedError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const generateErrorMessage = () => {
    if (!email.trim()) return 'Email is required.';
    return '';
  };

  const formIsValid = email.trim() !== '';

  const handleResetPassword = async () => {
    if (!formIsValid) {
      const errorMsg = generateErrorMessage();
      setCachedError(errorMsg);
      setWasAttempted(true);
      return;
    }

    try {
      const { error } = await resetPasswordWithEmail(email);
      if (error) {
        setCachedError(error.message);
        setWasAttempted(true);
      } else {
        setCachedError('');
        setSuccessMessage('Password reset email sent successfully.');
        setWasAttempted(false);
        router.push({ pathname: '/auth/signin', params: { success: '1' } });
      }
    } catch (err) {
      setCachedError('Unexpected error. Please try again.');
      setWasAttempted(true);
    }
  };

  return (
    <AuthWrapper>
      <View style={[styles.container, { backgroundColor }]}>
        {shouldShowVerifyBadge && (
          <View style={{
            backgroundColor: "#F59E0B",
            padding: 10,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <Text style={{ color: "#1F2937", fontWeight: "500", textAlign: "center" }}>
              Please verify your email before continuing.
            </Text>
          </View>
        )}
        <Text style={[styles.title, { color: textColor }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: mutedText }]}>Enter your email to reset your password.</Text>
        
        <TextInput 
          placeholder="Please enter your email address" 
          onChangeText={setEmail}
          placeholderTextColor={mutedText} 
          style={[styles.input, { backgroundColor: inputBackground, color: inputTextColor }]} 
        />

        {wasAttempted && cachedError !== '' && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 12 }}>
            {cachedError}
          </Text>
        )}

        {successMessage !== '' && (
          <Text style={{ color: 'green', fontSize: 12, marginBottom: 12 }}>
            {successMessage}
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.signInButton, { opacity: formIsValid ? 1 : 0.5 }]}
          onPress={handleResetPassword}
        >
          <Text style={styles.signInText}>Submit</Text>
        </TouchableOpacity>
        
        <Text style={[styles.bottomText, { color: mutedText }]}>
          <TouchableOpacity onPress={() => router.push('/auth/signin')}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 550,
    height: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    padding: 80,
    paddingVertical: 80,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    outline: 'none',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    alignContent: 'center',
    justifyContent: 'center',
    height: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 13,
  },
  link: {
    color: '#3B82F6',
  },
});
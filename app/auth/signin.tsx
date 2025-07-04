import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AuthWrapper from '@/components/auth/authWrapper';
import AppleIcon from '@/assets/icons/house.svg';
import GoogleIcon from '@/assets/icons/house.svg';
import { useDarkMode } from '@/context/DarkModeContext';

export default function SignIn() {
  const { isDarkMode } = useDarkMode();
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const mutedText = isDarkMode ? '#9CA3AF' : '#6B7280';
  const backgroundColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const inputBackground = isDarkMode ? '#111827' : '#F9FAFB';
  const inputTextColor = isDarkMode ? '#fff' : '#111827';

  return (
    <AuthWrapper>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: mutedText }]}>Your Social Campaigns</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: inputBackground }]}>
            <AppleIcon width={16} height={16} style={styles.icon} />
            <Text style={[styles.socialText, { color: isDarkMode ? '#fff' : '#111827' }]}>Sign in with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { backgroundColor: inputBackground }]}>
            <GoogleIcon width={16} height={16} style={styles.icon} />
            <Text style={[styles.socialText, { color: isDarkMode ? '#fff' : '#111827' }]}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.orText, { color: mutedText }]}>Or with Email</Text>
        
        <TextInput 
          placeholder="Email" 
          placeholderTextColor={mutedText} 
          style={[styles.input, { backgroundColor: inputBackground, color: inputTextColor }]} 
        />
        <TextInput 
          placeholder="Password" 
          placeholderTextColor={mutedText} 
          secureTextEntry 
          style={[styles.input, { backgroundColor: inputBackground, color: inputTextColor }]} 
        />
        
        <TouchableOpacity style={styles.forgotWrapper}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        
        <Text style={[styles.bottomText, { color: mutedText }]}>
          Not a Member yet? <Text style={styles.link}>Sign Up</Text>
        </Text>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    height: '100%',
    maxHeight: 680,
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  socialText: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 4,
  },
  orText: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#3B82F6',
    fontSize: 13,
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 13,
  },
  link: {
    color: '#3B82F6',
  },
});
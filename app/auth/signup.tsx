import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AuthWrapper from '@/components/auth/authWrapper';
import AppleIcon from '@/assets/icons/apple.svg';
import GoogleIcon from '@/assets/icons/google.svg';
import EyeIcon from '@/assets/icons/eye.svg';
import EyeOffIcon from '@/assets/icons/eye-slash.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import { signInWithApple, signInWithGoogle } from '@/api/auth/login';
import { router } from 'expo-router';

export default function SignUp() {
  const { isDarkMode } = useDarkMode();
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const mutedText = isDarkMode ? '#9CA3AF' : 'rgba(0, 0, 0, 0.2)';
  const backgroundColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF';
  const inputBackground = isDarkMode ? 'rgba(0, 0, 0, 0.1)' : '#fff';
  const inputTextColor = isDarkMode ? '#fff' : '#000';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [repeatPassword, setRepeatPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wasAttempted, setWasAttempted] = useState(false);
  const [cachedError, setCachedError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Medium' | 'Strong' | ''>('');

  const checkPasswordStrength = (pass: string): typeof passwordStrength => {
    if (!pass) return '';
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    const medium = /^(?=.*[a-z])(?=.*\d).{6,}$/;
    if (strong.test(pass)) return 'Strong';
    if (medium.test(pass)) return 'Medium';
    return 'Weak';
  };

  const generateErrorMessage = () => {
    let message = '';
    if (!email.trim()) message += 'Email is required. ';
    if (password.length < 8) message += 'Password must be at least 8 characters. ';
    if (password !== repeatPassword) message += 'Passwords do not match. ';
    if (!accepted) message += 'You must accept the Terms. ';
    return message.trim();
  };

  const getPasswordStrengthLevel = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const formIsValid =
    email.trim() !== '' &&
    password.length >= 8 &&
    password === repeatPassword &&
    accepted;

  return (
    <AuthWrapper>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Sign Up</Text>
        <Text style={[styles.subtitle, { color: mutedText }]}>Your Social Campaigns</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: inputBackground }]} 
            onPress={signInWithApple}
          >
            <AppleIcon 
              width={16} 
              height={16} 
              style={styles.icon} 
              fill={isDarkMode ? '#FFFFFF' : '#111827'} 
            />
            <Text style={[styles.socialText, { color: textColor }]}>Sign up with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: inputBackground }]} 
            onPress={signInWithGoogle}
          >
            <GoogleIcon width={16} height={16} style={styles.icon} />
            <Text style={[styles.socialText, { color: textColor }]}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={[styles.orText, { color: mutedText }]}>Or with Email</Text>
          <View style={styles.line} />
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor={mutedText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: inputBackground, color: inputTextColor }]}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={mutedText}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordStrength(checkPasswordStrength(text));
            }}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, { backgroundColor: inputBackground, color: inputTextColor }]}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon width={20} height={20} fill={mutedText} />
            ) : (
              <EyeIcon width={20} height={20} fill={mutedText} />
            )}
          </TouchableOpacity>
        </View>

        {password !== '' && (
          <View style={{ marginBottom: 12 }}>
            <View style={styles.strengthDotsContainer}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthDot,
                    {
                      backgroundColor: i < getPasswordStrengthLevel(password) ? '#9CA3AF' : '#E5E7EB'
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.helperText, { color: mutedText }]}>
          Use 8 or more characters with a mix of letters, numbers & symbols.
        </Text>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Repeat Password"
            placeholderTextColor={mutedText}
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, { backgroundColor: inputBackground, color: inputTextColor }]}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon width={20} height={20} fill={mutedText} />
            ) : (
              <EyeIcon width={20} height={20} fill={mutedText} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity 
            onPress={() => setAccepted(!accepted)} 
            style={[styles.checkbox, accepted && styles.checkboxChecked]} 
          />
          <Text style={{ color: mutedText }}>
            I Accept the <TouchableOpacity onPress={() => router.push('/tac')}><Text style={styles.link}>Terms</Text></TouchableOpacity>
          </Text>
        </View>

        {wasAttempted && cachedError !== '' && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 12 }}>
            {cachedError}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.signUpButton, { opacity: formIsValid ? 1 : 0.5 }]}
          onPress={() => {
            if (!formIsValid) {
              const errorMsg = generateErrorMessage();
              setCachedError(errorMsg);
              setWasAttempted(true);
            } else {
              console.log('Submitting...');
            }
          }}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={[styles.bottomText, { color: mutedText }]}>
          Already have an Account? <TouchableOpacity onPress={() => router.push('/auth/signin')}><Text style={styles.link}>Sign in</Text></TouchableOpacity>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  socialText: {
    fontSize: 14,
  },
  icon: {
    marginRight: 4,
    height: 16,
    width: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    textAlign: 'center',
    fontSize: 13,
  },
  input: {
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    alignContent: 'center',
    justifyContent: 'center',
    top: '18%',
  },
  strengthDotsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
  },
  checkboxChecked: {
    backgroundColor: '#999',
  },
  signUpButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signUpText: {
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
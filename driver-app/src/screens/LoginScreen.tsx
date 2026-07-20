import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/useAuthStore';

const PRIMARY = '#3E6BFA';

export function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const authError = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // error already surfaced via authError
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>MS</Text>
          </View>
          <Text style={styles.title}>Driver Sign In</Text>
          <Text style={styles.subtitle}>Sign in with the account created for you by the school admin.</Text>

          {authError && <Text style={styles.error}>{authError}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9AA3B2"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9AA3B2"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={[styles.button, submitting && styles.disabled]} onPress={onSubmit} disabled={submitting || !email || !password}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: '#161B22', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#5C6673', marginBottom: 24 },
  error: { color: '#C22A2F', fontSize: 13, marginBottom: 12 },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E9EF',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
    color: '#161B22',
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});

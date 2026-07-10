import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Button } from '@components/ui';
import { colors, spacing, radius, gradients } from '@theme';
import { useAuthStore } from '@store/useAuthStore';

export function LoginScreen() {
  const { signIn, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // error surfaced via store
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <LinearGradient colors={gradients.primary} style={styles.logo}>
            <AppText variant="h1" color={colors.textInverse} style={{ fontSize: 28 }}>
              MIS
            </AppText>
          </LinearGradient>
          <AppText variant="displayLg" align="center" style={{ marginTop: spacing.lg }}>
            Student Portal
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center" style={{ marginTop: 4 }}>
            Sign in to see your homework, timetable and results
          </AppText>

          <View style={{ marginTop: spacing.xxl }}>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
              Email
            </AppText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@misstudent.edu"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
              Password
            </AppText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              style={styles.input}
            />

            {error && (
              <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.sm }}>
                {error}
              </AppText>
            )}

            <Button label="Sign In" onPress={onSubmit} loading={loading} fullWidth style={{ marginTop: spacing.xl }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
});

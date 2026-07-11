import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button } from '@components/ui';
import { colors, spacing, radius } from '@theme';
import { useAuthStore } from '@store/useAuthStore';

export function LoginScreen() {
  const { signIn, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          <View style={styles.logo}>
            <AppText variant="h1" color={colors.textInverse} style={{ fontSize: 24 }}>
              MIS
            </AppText>
          </View>
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
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@misstudent.edu"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: 6 }}>
              Password
            </AppText>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <AppText variant="caption" color={colors.dangerStrong} style={{ marginLeft: 6, flex: 1 }}>
                  {error}
                </AppText>
              </View>
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
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
});

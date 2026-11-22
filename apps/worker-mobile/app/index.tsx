import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BushoLogo } from '@/components/ui/BushoLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldInput } from '@/components/ui/FieldInput';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function WorkerEntryScreen() {
  const { theme, typeScale } = useTheme();
  const { status, identity, message, configured, hasSession, signIn, signOut, retryVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });

  async function handleSignIn() {
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Enter your registered email and password.');
      return;
    }
    setSubmitting(true);
    const error = await signIn(email, password);
    setSubmitting(false);
    if (error) setFormError(error);
    else setPassword('');
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setFormError('Sign out could not be completed. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <BushoLogo size={58} />
            <Text style={[styles.eyebrow, muted(12)]}>SHC HEALTH WORKER</Text>
            <Text style={[styles.title, text(27)]}>BUSHO Mobile</Text>
            <Text style={[styles.subtitle, muted(15)]}>A secure workspace for authorised health workers.</Text>
          </View>

          {status === 'initializing' || status === 'verifying' ? (
            <Card style={styles.stateCard}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={[styles.stateTitle, text(17)]}>{status === 'initializing' ? 'Restoring secure session' : 'Verifying worker access'}</Text>
              <Text style={[styles.center, muted(14)]}>Checking your account, worker record and assigned facility.</Text>
            </Card>
          ) : null}

          {(status === 'signedOut' || (status === 'error' && !hasSession)) ? (
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, text(20)]}>Sign in</Text>
              <Text style={[styles.description, muted(14)]}>Use the account provisioned for you by your BUSHO administrator. Public self-registration is not available.</Text>
              {!configured ? <Text style={[styles.notice, { color: theme.colors.danger, fontSize: 13 * typeScale }]}>{message}</Text> : null}
              <FieldInput label="Email address" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" editable={configured && !submitting} />
              <FieldInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoCapitalize="none" autoComplete="password" textContentType="password" returnKeyType="done" onSubmitEditing={handleSignIn} editable={configured && !submitting} />
              {formError || (status === 'error' ? message : null) ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.danger, fontSize: 13 * typeScale }]}>{formError ?? message}</Text> : null}
              <Button label="Sign in securely" onPress={handleSignIn} loading={submitting} disabled={!configured} />
              <Text style={[styles.footnote, muted(12)]}>Access is granted only after your worker role and facility assignment are verified.</Text>
            </Card>
          ) : null}

          {status === 'denied' ? (
            <Card style={styles.card}>
              <StatusPill label="Access not approved" tone="danger" />
              <Text style={[styles.sectionTitle, text(20)]}>We couldn't verify your access</Text>
              <Text style={[styles.description, muted(14)]}>{message}</Text>
              <Button label="Check access again" variant="secondary" onPress={retryVerification} />
              <Button label="Sign out" variant="tertiary" onPress={handleSignOut} loading={signingOut} />
            </Card>
          ) : null}

          {status === 'error' && hasSession ? (
            <Card style={styles.card}>
              <StatusPill label="Verification unavailable" tone="warning" />
              <Text style={[styles.sectionTitle, text(20)]}>We couldn't verify your access</Text>
              <Text style={[styles.description, muted(14)]}>{message}</Text>
              <Button label="Retry verification" variant="secondary" onPress={retryVerification} />
              <Button label="Sign out" variant="tertiary" onPress={handleSignOut} loading={signingOut} />
            </Card>
          ) : null}

          {status === 'ready' && identity ? (
            <Card style={styles.card}>
              <View style={styles.readyHeader}>
                <StatusPill label="Access verified" tone="success" />
                {identity.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}
              </View>
              <Text style={[styles.sectionTitle, text(20)]}>Welcome, {identity.worker.displayName}</Text>
              <Text style={[styles.description, muted(14)]}>Your worker account and facility assignment are active.</Text>
              <View style={[styles.detailBlock, { borderColor: theme.colors.border }]}>
                <Text style={[styles.detailLabel, muted(12)]}>ASSIGNED FACILITY</Text>
                <Text style={[styles.facilityName, text(17)]}>{identity.facility.name}</Text>
                {identity.facility.district ? <Text style={muted(13)}>{identity.facility.district}</Text> : null}
                <Text style={[styles.facilityType, muted(12)]}>{identity.facility.facilityType.replaceAll('_', ' ').toUpperCase()}</Text>
              </View>
              <Text style={[styles.footnote, muted(12)]}>M1.2 authentication is active. Operational workflows will appear in later milestones.</Text>
              <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
            </Card>
          ) : null}

          <Text style={[styles.footer, muted(11)]}>BUSHO · SHC WORKER ACCESS</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28, gap: 18 },
  brand: { alignItems: 'flex-start', gap: 5, marginBottom: 4 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.5, marginTop: 12 },
  title: { fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { lineHeight: 22, maxWidth: 320, marginTop: 2 },
  card: { gap: 14, padding: 20 },
  stateCard: { gap: 12, alignItems: 'center', padding: 24 },
  stateTitle: { fontWeight: '800', textAlign: 'center' },
  center: { textAlign: 'center', lineHeight: 21 },
  sectionTitle: { fontWeight: '800', letterSpacing: -0.3 },
  description: { lineHeight: 21 },
  notice: { lineHeight: 19 },
  error: { lineHeight: 19 },
  footnote: { lineHeight: 18 },
  footer: { textAlign: 'center', letterSpacing: 1.1, fontWeight: '700', marginTop: 4 },
  readyHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailBlock: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 5 },
  detailLabel: { fontWeight: '800', letterSpacing: 1 },
  facilityName: { fontWeight: '800' },
  facilityType: { fontWeight: '700', letterSpacing: 0.6, marginTop: 3 },
});

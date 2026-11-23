import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Languages, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function FacilityScreen() {
  const { identity, signOut } = useAuth();
  const { theme, typeScale } = useTheme();
  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });

  if (!identity) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, muted(11)]}>ACCOUNT & ASSIGNMENT</Text>
        <Text style={[styles.title, text(25)]}>Facility & profile</Text>
        {identity.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}

        <Card style={styles.card}>
          <View style={styles.headingRow}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><UserRound size={21} color={theme.colors.primary} /></View>
            <View style={styles.flex}>
              <Text style={[styles.name, text(18)]}>{identity.worker.displayName}</Text>
              <Text style={muted(13)}>SHC health worker</Text>
            </View>
            <StatusPill label="Active" tone="success" />
          </View>
          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          <View style={styles.detailRow}>
            <Languages size={17} color={theme.colors.textMuted} />
            <View style={styles.flex}><Text style={muted(11)}>PREFERRED LANGUAGE</Text><Text style={[styles.value, text(14)]}>{identity.worker.preferredLanguage}</Text></View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.headingRow}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.successSurface }]}><Building2 size={21} color={theme.colors.success} /></View>
            <View style={styles.flex}><Text style={[styles.name, text(17)]}>{identity.facility.name}</Text><Text style={muted(13)}>{identity.facility.district ?? 'District not listed'}</Text></View>
          </View>
          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          <View style={styles.detailRow}><ShieldCheck size={17} color={theme.colors.success} /><Text style={[styles.value, { color: theme.colors.success, fontSize: 12 * typeScale }]}>Verified AAM-SHC assignment</Text></View>
        </Card>

        <Button label="Sign out securely" variant="secondary" onPress={() => void signOut()} style={styles.signOut} />
        <Text style={[styles.footer, muted(11)]}>Your role and facility access are verified by BUSHO. Contact your administrator to change an assignment.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingTop: 22, paddingBottom: 28, gap: 14 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.2 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  card: { padding: 16, gap: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconTile: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 4 },
  name: { fontWeight: '800' },
  separator: { height: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { fontWeight: '700' },
  signOut: { marginTop: 5 },
  footer: { lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});

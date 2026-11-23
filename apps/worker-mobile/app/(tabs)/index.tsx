import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Building2, ClipboardList, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouter } from 'expo-router';

export default function WorkerHomeScreen() {
  const { identity } = useAuth();
  const { theme, typeScale } = useTheme();
  const router = useRouter();
  if (!identity) return null;

  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topline}>
          <View>
            <Text style={[styles.eyebrow, muted(11)]}>BUSHO · SHC WORKER</Text>
            <Text style={[styles.greeting, text(25)]}>Good day, {identity.worker.displayName.split(' ')[0]}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: theme.colors.infoSurface }]}>
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{identity.worker.displayName.trim().charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {identity.facility.isSynthetic ? (
          <View style={styles.pills}><StatusPill label="Synthetic Pilot" tone="warning" /><StatusPill label="Access verified" tone="success" /></View>
        ) : (
          <View style={styles.pills}><StatusPill label="Access verified" tone="success" /></View>
        )}

        <Card style={styles.facilityCard}>
          <View style={styles.cardHeading}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><Building2 size={20} color={theme.colors.primary} /></View>
            <View style={styles.flex}>
              <Text style={[styles.kicker, muted(11)]}>YOUR ASSIGNED FACILITY</Text>
              <Text style={[styles.facilityName, text(18)]}>{identity.facility.name}</Text>
              <Text style={muted(13)}>{[identity.facility.district, 'AAM-SHC'].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.verifiedRow}>
            <ShieldCheck size={17} color={theme.colors.success} />
            <Text style={[styles.verifiedText, { color: theme.colors.success, fontSize: 12 * typeScale }]}>Worker and facility access verified</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, text(19)]}>Your workspace</Text>
          <Text style={muted(12)}>Tools for your facility</Text>
        </View>

        <Card style={styles.actionCard}>
          <View style={styles.actionTop}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.warningSurface }]}><ClipboardList size={21} color={theme.colors.warning} /></View>
            <StatusPill label="Case tracking" tone="success" />
          </View>
          <Text style={[styles.actionTitle, text(17)]}>Medicine stockouts</Text>
          <Text style={[styles.body, muted(13)]}>Review dated physical observations and follow cases through the verified SHC–PHC workflow.</Text>
          <Text style={[styles.helper, muted(12)]}>View your recorded cases, observed quantities and current PHC coordination status.</Text>
        </Card>

        <Card style={styles.actionCard}>
          <View style={styles.actionTop}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.surfaceSubtle }]}><ArrowRight size={20} color={theme.colors.textMuted} /></View>
            <StatusPill label="Coming next" tone="neutral" />
          </View>
          <Text style={[styles.actionTitle, text(17)]}>Field updates</Text>
          <Text style={[styles.body, muted(13)]}>Follow case progress and submit supported receipt or handover evidence when requested.</Text>
          <Button label="View field updates" variant="secondary" onPress={() => router.push('/(tabs)/updates' as never)} />
        </Card>

        <Text style={[styles.disclaimer, muted(11)]}>BUSHO supports coordination. It does not replace official registers, inventory systems or procurement authority.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28, gap: 16 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.3, marginBottom: 7 },
  greeting: { fontWeight: '800', letterSpacing: -0.5, maxWidth: 280 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  facilityCard: { padding: 16, gap: 14 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 4 },
  kicker: { fontWeight: '800', letterSpacing: 1 },
  facilityName: { fontWeight: '800', lineHeight: 24 },
  divider: { height: 1 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifiedText: { fontWeight: '700' },
  sectionHeader: { gap: 3, marginTop: 5 },
  sectionTitle: { fontWeight: '800', letterSpacing: -0.3 },
  actionCard: { padding: 16, gap: 11 },
  actionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionTitle: { fontWeight: '800' },
  body: { lineHeight: 20 },
  helper: { lineHeight: 18 },
  disclaimer: { lineHeight: 17, textAlign: 'center', paddingHorizontal: 8, marginTop: 2 },
});

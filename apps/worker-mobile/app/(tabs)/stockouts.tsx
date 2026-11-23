import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, ShieldCheck } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function StockoutsScreen() {
  const { identity } = useAuth();
  const { theme, typeScale } = useTheme();
  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, muted(11)]}>FACILITY COORDINATION</Text>
        <Text style={[styles.title, text(25)]}>Stockouts</Text>
        <Text style={[styles.subtitle, muted(14)]}>Dated observations from your assigned facility.</Text>
        {identity?.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}
        <Card style={styles.card}>
          <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><ClipboardList size={24} color={theme.colors.primary} /></View>
          <Text style={[styles.heading, text(18)]}>Stockout reporting is being connected</Text>
          <Text style={[styles.body, muted(14)]}>The next milestone will connect this screen to the existing BUSHO stockout-case workflow. Until then, this screen does not create, estimate or display stock records.</Text>
          <View style={[styles.note, { backgroundColor: theme.colors.surfaceSubtle }]}>
            <ShieldCheck size={17} color={theme.colors.success} />
            <Text style={[styles.noteText, muted(12)]}>Only dated physical observations will be shown. BUSHO does not represent live or official inventory.</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingTop: 22, gap: 12 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.2 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { lineHeight: 21, marginBottom: 4 },
  card: { padding: 18, gap: 13, marginTop: 8 },
  iconTile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heading: { fontWeight: '800', lineHeight: 24 },
  body: { lineHeight: 22 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 10 },
  noteText: { flex: 1, lineHeight: 19 },
});

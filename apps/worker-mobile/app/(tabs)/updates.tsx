import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, CalendarDays, FileCheck2, RefreshCw } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusPill, StatusTone } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/theme/ThemeProvider';

type CaseEvent = {
  id: string;
  stockout_case_id: string;
  action: string;
  status_from: string | null;
  status_to: string;
  note: string | null;
  external_reference: string | null;
  quantity: number | null;
  created_at: string;
  stockout_cases?: { medicine_name: string; medicine_strength_form: string } | null;
};

const ACTIONS: Record<string, { title: string; tone: StatusTone }> = {
  worker_draft_created: { title: 'Case draft created', tone: 'neutral' },
  worker_submitted_to_phc: { title: 'Submitted to PHC', tone: 'info' },
  phc_acknowledged: { title: 'PHC acknowledged', tone: 'info' },
  phc_review_started: { title: 'PHC review started', tone: 'info' },
  phc_clarification_requested: { title: 'Clarification requested', tone: 'warning' },
  worker_resubmitted: { title: 'Worker resubmitted', tone: 'info' },
  phc_accepted_for_action: { title: 'Accepted for PHC action', tone: 'success' },
  phc_marked_unavailable: { title: 'PHC marked unavailable', tone: 'warning' },
  official_indent_reference_recorded: { title: 'Indent reference recorded', tone: 'info' },
  upstream_supply_receipt_recorded: { title: 'Upstream receipt recorded at PHC', tone: 'success' },
  phc_handover_recorded: { title: 'PHC handover recorded', tone: 'success' },
  shc_collection_recorded: { title: 'SHC collection recorded', tone: 'success' },
  shc_partial_receipt_recorded: { title: 'Partial receipt recorded', tone: 'warning' },
  shc_no_receipt_recorded: { title: 'No receipt recorded', tone: 'danger' },
  shc_discrepancy_recorded: { title: 'Receipt discrepancy recorded', tone: 'warning' },
  shc_receipt_completed: { title: 'Receipt completed at SHC', tone: 'success' },
  case_closed: { title: 'Case closed', tone: 'neutral' },
  case_cancelled: { title: 'Case cancelled', tone: 'neutral' },
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FieldUpdatesScreen() {
  const { identity } = useAuth();
  const { theme, typeScale } = useTheme();
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!identity) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await getSupabaseClient()
        .from('stockout_case_events')
        .select('id, stockout_case_id, action, status_from, status_to, note, external_reference, quantity, created_at, stockout_cases!inner(medicine_name, medicine_strength_form, shc_facility_id, submitted_by_worker_id)')
        .eq('stockout_cases.shc_facility_id', identity.facility.id)
        .eq('stockout_cases.submitted_by_worker_id', identity.worker.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (queryError) throw queryError;
      setEvents((data ?? []) as unknown as CaseEvent[]);
    } catch {
      setError('We could not load case updates. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [identity]);

  useEffect(() => { void load(); }, [load]);

  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, muted(11)]}>CASE FOLLOW-UP</Text>
            <Text style={[styles.title, text(25)]}>Field updates</Text>
            <Text style={[styles.subtitle, muted(14)]}>A dated history of actions on your cases.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh field updates" onPress={() => void load(true)} hitSlop={10} style={[styles.refresh, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <RefreshCw size={19} color={theme.colors.primary} />
          </Pressable>
        </View>
        {identity?.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}

        {loading ? (
          <Card style={styles.stateCard}><ActivityIndicator color={theme.colors.primary} /><Text style={muted(13)}>Loading case updates…</Text></Card>
        ) : error ? (
          <Card style={styles.stateCard}>
            <AlertCircle size={24} color={theme.colors.danger} />
            <Text style={[styles.stateTitle, text(16)]}>Updates unavailable</Text>
            <Text style={[styles.stateBody, muted(13)]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={[styles.retryText, { color: theme.colors.primary }]}>Try again</Text></Pressable>
          </Card>
        ) : events.length === 0 ? (
          <Card style={styles.stateCard}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><FileCheck2 size={23} color={theme.colors.primary} /></View>
            <Text style={[styles.stateTitle, text(17)]}>No case updates yet</Text>
            <Text style={[styles.stateBody, muted(13)]}>When a case moves through the SHC–PHC workflow, its recorded actions will appear here.</Text>
            <View style={[styles.notice, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <FileCheck2 size={17} color={theme.colors.success} />
              <Text style={[styles.noticeText, muted(12)]}>This timeline uses the existing case event history. It does not create a separate reporting process.</Text>
            </View>
          </Card>
        ) : (
          <View style={styles.timeline}>
            <Text style={[styles.sectionTitle, text(18)]}>Recent activity <Text style={muted(12)}>· {events.length}</Text></Text>
            {events.map((event) => {
              const action = ACTIONS[event.action] ?? { title: 'Case updated', tone: 'neutral' as StatusTone };
              const medicine = event.stockout_cases;
              return (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                    <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                  </View>
                  <Card style={styles.eventCard}>
                    <View style={styles.eventTop}>
                      <Text style={[styles.eventTitle, text(14)]}>{action.title}</Text>
                      <StatusPill label={action.title} tone={action.tone} />
                    </View>
                    {medicine ? <Text style={[styles.medicine, muted(12)]}>{medicine.medicine_name} · {medicine.medicine_strength_form}</Text> : null}
                    <View style={styles.dateRow}>
                      <CalendarDays size={14} color={theme.colors.textMuted} />
                      <Text style={muted(11)}>{formatDate(event.created_at)}</Text>
                    </View>
                    {event.quantity !== null ? <Text style={muted(12)}>Recorded quantity: {Number(event.quantity)}</Text> : null}
                    {event.external_reference ? <Text style={muted(12)}>Reference: {event.external_reference}</Text> : null}
                    {event.note ? <Text style={[styles.note, muted(12)]}>{event.note}</Text> : null}
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, gap: 5 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.2 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { lineHeight: 20 },
  refresh: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stateCard: { padding: 20, gap: 12, alignItems: 'flex-start', marginTop: 8 },
  iconTile: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '800' },
  stateBody: { lineHeight: 20 },
  notice: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 10, alignItems: 'flex-start', width: '100%' },
  noticeText: { flex: 1, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: 'center' },
  retryText: { fontWeight: '800' },
  timeline: { gap: 12, marginTop: 4 },
  sectionTitle: { fontWeight: '800', marginBottom: 3 },
  eventRow: { flexDirection: 'row', gap: 10 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 18 },
  line: { width: 2, flex: 1, marginTop: 4 },
  eventCard: { flex: 1, padding: 13, gap: 8 },
  eventTop: { gap: 7, alignItems: 'flex-start' },
  eventTitle: { fontWeight: '800' },
  medicine: { lineHeight: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  note: { lineHeight: 18 },
});

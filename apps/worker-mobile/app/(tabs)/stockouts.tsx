import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, CalendarDays, ClipboardList, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { StatusPill, StatusTone } from '@/components/ui/StatusPill';
import { useAuth } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/theme/ThemeProvider';

type ServiceLink = {
  id: string;
  phc_facility_id: string;
  verification_status: string;
  data_mode: 'operational' | 'synthetic_demo';
  effective_from: string | null;
  effective_until: string | null;
};

type StockoutCase = {
  id: string;
  medicine_name: string;
  medicine_strength_form: string;
  reported_quantity: number;
  requested_quantity: number;
  quantity_unit: string;
  observation_source: string;
  observed_at: string;
  status: string;
  data_mode: 'operational' | 'synthetic_demo';
  created_at: string;
  updated_at: string;
};

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted_to_phc: { label: 'Submitted to PHC', tone: 'info' },
  acknowledged_by_phc: { label: 'Acknowledged', tone: 'info' },
  under_phc_review: { label: 'Under PHC review', tone: 'info' },
  clarification_requested: { label: 'Clarification requested', tone: 'warning' },
  resubmitted: { label: 'Resubmitted', tone: 'info' },
  accepted_for_phc_action: { label: 'Accepted for PHC action', tone: 'success' },
  phc_cannot_fulfil: { label: 'PHC unable to fulfil', tone: 'warning' },
  official_indent_submitted: { label: 'Indent reference recorded', tone: 'info' },
  upstream_supply_received_at_phc: { label: 'Supply received at PHC', tone: 'success' },
  phc_handover_recorded: { label: 'Handover recorded', tone: 'success' },
  collected_by_shc: { label: 'Collected by SHC', tone: 'success' },
  partially_received_at_shc: { label: 'Partially received', tone: 'warning' },
  discrepancy_recorded: { label: 'Receipt discrepancy', tone: 'warning' },
  no_receipt_recorded: { label: 'No receipt recorded', tone: 'danger' },
  received_at_shc: { label: 'Received at SHC', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isCurrentLink(link: ServiceLink) {
  const today = new Date().toLocaleDateString('en-CA');
  return link.verification_status === 'verified'
    && (link.effective_from === null || link.effective_from <= today)
    && (link.effective_until === null || link.effective_until >= today);
}

export default function StockoutsScreen() {
  const { identity } = useAuth();
  const { theme, typeScale } = useTheme();
  const [cases, setCases] = useState<StockoutCase[]>([]);
  const [phcName, setPhcName] = useState<string | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!identity) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: links, error: linkError } = await supabase
        .from('facility_service_links')
        .select('id, phc_facility_id, verification_status, data_mode, effective_from, effective_until')
        .eq('shc_facility_id', identity.facility.id)
        .eq('relationship_type', 'shc_reports_to_phc')
        .eq('data_mode', identity.facility.isSynthetic ? 'synthetic_demo' : 'operational')
        .order('effective_from', { ascending: false })
        .limit(5);
      if (linkError) throw linkError;
      const activeLinks = ((links ?? []) as ServiceLink[]).filter(isCurrentLink);
      if (activeLinks.length !== 1) {
        setLinkReady(false);
        setPhcName(null);
      } else {
        const link = activeLinks[0];
        const { data: phc, error: phcError } = await supabase
          .from('facilities')
          .select('id, name, facility_type, verification_status, is_active')
          .eq('id', link.phc_facility_id)
          .maybeSingle();
        if (phcError) throw phcError;
        const validPhc = phc && phc.facility_type === 'phc' && phc.verification_status === 'verified' && phc.is_active;
        setLinkReady(Boolean(validPhc));
        setPhcName(validPhc ? phc.name : null);
      }

      const { data, error: casesError } = await supabase
        .from('stockout_cases')
        .select('id, medicine_name, medicine_strength_form, reported_quantity, requested_quantity, quantity_unit, observation_source, observed_at, status, data_mode, created_at, updated_at')
        .eq('shc_facility_id', identity.facility.id)
        .eq('submitted_by_worker_id', identity.worker.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (casesError) throw casesError;
      setCases((data ?? []) as StockoutCase[]);
    } catch {
      setError('We could not refresh stockout cases. Check your connection and try again.');
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
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, muted(11)]}>FACILITY COORDINATION</Text>
            <Text style={[styles.title, text(25)]}>Stockouts</Text>
            <Text style={[styles.subtitle, muted(14)]}>Physical observations and case progress.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh stockout cases" onPress={() => void load(true)} hitSlop={10} style={[styles.refresh, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <RefreshCw size={19} color={theme.colors.primary} />
          </Pressable>
        </View>

        {identity?.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}

        <Card style={styles.linkCard}>
          <View style={styles.linkRow}>
            <View style={[styles.iconTile, { backgroundColor: linkReady ? theme.colors.successSurface : theme.colors.warningSurface }]}>
              {linkReady ? <ShieldCheck size={21} color={theme.colors.success} /> : <AlertCircle size={21} color={theme.colors.warning} />}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, text(15)]}>SHC–PHC coordination</Text>
              <Text style={muted(12)}>{linkReady ? phcName : 'A current verified PHC link is required for case submission.'}</Text>
            </View>
            <StatusPill label={linkReady ? 'Verified' : 'Not ready'} tone={linkReady ? 'success' : 'warning'} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, text(19)]}>Your cases</Text>
            <Text style={muted(12)}>Cases recorded by your worker account</Text>
          </View>
          <Text style={[styles.count, { color: theme.colors.textMuted, fontSize: 13 * typeScale }]}>{cases.length}</Text>
        </View>

        {loading ? (
          <Card style={styles.stateCard}><ActivityIndicator color={theme.colors.primary} /><Text style={muted(13)}>Loading your cases…</Text></Card>
        ) : error ? (
          <Card style={styles.stateCard}>
            <AlertCircle size={24} color={theme.colors.danger} />
            <Text style={[styles.stateTitle, text(16)]}>Cases unavailable</Text>
            <Text style={[styles.stateBody, muted(13)]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={[styles.retryText, { color: theme.colors.primary }]}>Try again</Text></Pressable>
          </Card>
        ) : cases.length === 0 ? (
          <Card style={styles.stateCard}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><ClipboardList size={23} color={theme.colors.primary} /></View>
            <Text style={[styles.stateTitle, text(17)]}>No stockout cases yet</Text>
            <Text style={[styles.stateBody, muted(13)]}>When a case is recorded for your facility, it will appear here with its observed date and current workflow status.</Text>
            <View style={[styles.notice, { backgroundColor: theme.colors.surfaceSubtle }]}>
              <ShieldCheck size={17} color={theme.colors.success} />
              <Text style={[styles.noticeText, muted(12)]}>Only dated physical observations are represented. BUSHO is not a live or official inventory system.</Text>
            </View>
          </Card>
        ) : cases.map((item) => {
          const status = STATUS[item.status] ?? { label: 'Status update', tone: 'neutral' as StatusTone };
          return (
            <Card key={item.id} style={styles.caseCard}>
              <View style={styles.caseTop}>
                <View style={styles.flex}>
                  <Text style={[styles.caseName, text(16)]}>{item.medicine_name}</Text>
                  <Text style={muted(12)}>{item.medicine_strength_form}</Text>
                </View>
                <StatusPill label={status.label} tone={status.tone} />
              </View>
              <View style={[styles.quantityPanel, { backgroundColor: theme.colors.surfaceSubtle }]}>
                <View style={styles.quantityBlock}>
                  <Text style={muted(10)}>OBSERVED</Text>
                  <Text style={[styles.quantity, text(16)]}>{Number(item.reported_quantity)} {item.quantity_unit}</Text>
                </View>
                <View style={[styles.quantityDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.quantityBlock}>
                  <Text style={muted(10)}>REQUESTED</Text>
                  <Text style={[styles.quantity, text(16)]}>{Number(item.requested_quantity)} {item.quantity_unit}</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <CalendarDays size={15} color={theme.colors.textMuted} />
                <Text style={muted(12)}>Observed {formatDate(item.observed_at)}</Text>
              </View>
              {item.data_mode === 'synthetic_demo' ? <StatusPill label="Synthetic record" tone="warning" /> : null}
            </Card>
          );
        })}

        <Text style={[styles.footerNote, muted(11)]}>Case creation is not enabled in this build yet. Refresh to check for new case activity.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerCopy: { flex: 1, gap: 5 },
  eyebrow: { fontWeight: '800', letterSpacing: 1.2 },
  title: { fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { lineHeight: 20 },
  refresh: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  linkCard: { padding: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconTile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 3 },
  cardTitle: { fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontWeight: '800', letterSpacing: -0.3 },
  count: { fontWeight: '700' },
  stateCard: { padding: 20, gap: 12, alignItems: 'flex-start' },
  stateTitle: { fontWeight: '800' },
  stateBody: { lineHeight: 20 },
  notice: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 10, alignItems: 'flex-start', width: '100%' },
  noticeText: { flex: 1, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: 'center' },
  retryText: { fontWeight: '800' },
  caseCard: { padding: 15, gap: 12 },
  caseTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  caseName: { fontWeight: '800' },
  quantityPanel: { flexDirection: 'row', borderRadius: 10, padding: 12, alignItems: 'center' },
  quantityBlock: { flex: 1, gap: 4 },
  quantity: { fontWeight: '800' },
  quantityDivider: { width: 1, height: 34, marginHorizontal: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footerNote: { lineHeight: 17, textAlign: 'center', marginTop: 4, paddingHorizontal: 8 },
});

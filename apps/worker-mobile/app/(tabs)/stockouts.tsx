import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, CalendarDays, ClipboardList, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldInput } from '@/components/ui/FieldInput';
import { StatusPill, StatusTone } from '@/components/ui/StatusPill';
import { UnitChips } from '@/components/ui/UnitChips';
import type { StockoutUnit } from '@/components/ui/UnitChips';
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
type ObservationSource = 'physical_count' | 'dispensing_box_check' | 'paper_register' | 'worker_report' | 'other';
type StockoutInsert = {
  id: string;
  shc_facility_id: string;
  phc_facility_id: string;
  submitted_by_worker_id: string;
  medicine_name: string;
  medicine_strength_form: string;
  reported_quantity: number;
  requested_quantity: number;
  quantity_unit: string;
  observation_source: ObservationSource;
  observed_at: string;
  worker_note: string | null;
  status: 'submitted_to_phc';
  data_mode: 'operational' | 'synthetic_demo';
};
type PendingAttempt = { id: string; createdAt: string; payload?: StockoutInsert };
const PENDING_KEY = '@busho/worker-mobile/pending-stockout-create/v1';
const pendingKeyFor = (workerId: string) => `${PENDING_KEY}/${workerId}`;
const SOURCES: { value: ObservationSource; label: string }[] = [
  { value: 'physical_count', label: 'Physical count' },
  { value: 'dispensing_box_check', label: 'Dispensing box' },
  { value: 'paper_register', label: 'Paper register' },
  { value: 'worker_report', label: 'Worker report' },
  { value: 'other', label: 'Other' },
];
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
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function isCurrentLink(link: ServiceLink) {
  const today = todayLocal();
  return link.verification_status === 'verified'
    && (link.effective_from === null || link.effective_from <= today)
    && (link.effective_until === null || link.effective_until >= today);
}
function todayLocal() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function dateAtLocalNoon(value: string) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export default function StockoutsScreen() {
  const { identity } = useAuth();
  const { theme, typeScale } = useTheme();
  const [cases, setCases] = useState<StockoutCase[]>([]);
  const [phcName, setPhcName] = useState<string | null>(null);
  const [serviceLink, setServiceLink] = useState<ServiceLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [medicine, setMedicine] = useState('');
  const [strength, setStrength] = useState('');
  const [observedQty, setObservedQty] = useState('0');
  const [requestedQty, setRequestedQty] = useState('1');
  const [unit, setUnit] = useState<StockoutUnit>('tablets');
  const [source, setSource] = useState<ObservationSource>('physical_count');
  const [observedDate, setObservedDate] = useState(todayLocal());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingAttempt | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

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
        .order('effective_from', { ascending: false }).limit(5);
      if (linkError) throw linkError;
      const activeLinks = ((links ?? []) as ServiceLink[]).filter(isCurrentLink);
      if (activeLinks.length !== 1) {
        setServiceLink(null); setPhcName(null);
      } else {
        const link = activeLinks[0];
        const { data: phc, error: phcError } = await supabase.from('facilities')
          .select('id, name, facility_type, verification_status, is_active, is_synthetic')
          .eq('id', link.phc_facility_id).maybeSingle();
        if (phcError) throw phcError;
        const validPhc = phc && phc.facility_type === 'phc' && phc.verification_status === 'verified'
          && phc.is_active && Boolean(phc.is_synthetic) === identity.facility.isSynthetic;
        setServiceLink(validPhc ? link : null);
        setPhcName(validPhc ? phc.name : null);
      }
      const { data, error: casesError } = await supabase.from('stockout_cases')
        .select('id, medicine_name, medicine_strength_form, reported_quantity, requested_quantity, quantity_unit, observation_source, observed_at, status, data_mode, created_at, updated_at')
        .eq('shc_facility_id', identity.facility.id)
        .eq('submitted_by_worker_id', identity.worker.id)
        .order('updated_at', { ascending: false }).limit(50);
      if (casesError) throw casesError;
      setCases((data ?? []) as StockoutCase[]);
    } catch {
      setError('We could not refresh stockout cases. Check your connection and try again.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [identity]);

  const reconcilePending = useCallback(async (attempt: PendingAttempt) => {
    if (!identity) return;
    setPendingMessage('Checking whether the previous submission reached BUSHO…');
    try {
      const { data, error: queryError } = await getSupabaseClient().from('stockout_cases')
        .select('id').eq('id', attempt.id).eq('shc_facility_id', identity.facility.id)
        .eq('submitted_by_worker_id', identity.worker.id).maybeSingle();
      if (queryError) throw queryError;
      if (data) {
        await AsyncStorage.removeItem(pendingKeyFor(identity.worker.id));
        setPending(null);
        setPendingMessage('Your submission was received. The case list has been refreshed.');
        await load(true);
      } else if (attempt.payload) {
        setPendingMessage('No case is visible yet. You can safely retry the exact saved submission using the same case ID.');
      } else {
        setPendingMessage('This is an older attempt without a saved submission payload. Do not create another case until an administrator confirms whether it was received.');
      }
    } catch {
      setPendingMessage('We could not verify the previous submission. Do not resend it yet; reconnect and check the case list again.');
    }
  }, [identity, load]);

  const retryPending = useCallback(async (attempt: PendingAttempt) => {
    if (!identity || !attempt.payload || saving) return;
    setSaving(true);
    setPendingMessage('Retrying the saved submission with its original case ID…');
    try {
      const { error: insertError } = await getSupabaseClient().from('stockout_cases').insert(attempt.payload);
      if (insertError) {
        if (insertError.code === '23505' || [408, 409, 500, 502, 503, 504].includes(insertError.status ?? 0)) {
          await reconcilePending(attempt);
          return;
        }
        await AsyncStorage.removeItem(pendingKeyFor(identity.worker.id));
        setPending(null);
        const message = insertError.code === '42501'
          ? 'BUSHO did not authorise this submission. Your account or facility assignment may need administrator review.'
          : 'BUSHO rejected the saved submission. Review your facility assignment and case details before creating a new case.';
        setPendingMessage(null);
        Alert.alert('Submission not accepted', message);
        return;
      }
      await AsyncStorage.removeItem(pendingKeyFor(identity.worker.id));
      setPending(null);
      setPendingMessage('Your saved submission was accepted. The case list has been refreshed.');
      await load(true);
    } catch {
      setPending(attempt);
      setPendingMessage('The connection is still uncertain. Your original submission is saved on this device; verify it before trying again.');
    } finally {
      setSaving(false);
    }
  }, [identity, load, reconcilePending, saving]);

  useEffect(() => {
    void load();
    void AsyncStorage.getItem(pendingKeyFor(identity.worker.id)).then((raw) => {
      if (!raw) return;
      try {
        const attempt = JSON.parse(raw) as PendingAttempt;
        if (attempt.id && attempt.createdAt) {
          setPending(attempt);
          setPendingMessage('A previous submission may have been interrupted. Verify its status before creating another case.');
          void reconcilePending(attempt);
        }
      } catch {
        setPendingMessage('A previous submission marker could not be read. Refresh the case list before creating another case.');
      }
    });
  }, [load, reconcilePending]);

  const resetForm = () => {
    setMedicine(''); setStrength(''); setObservedQty('0'); setRequestedQty('1');
    setUnit('tablets'); setSource('physical_count'); setObservedDate(todayLocal());
    setNote(''); setFormError(null);
  };

  const submitCase = async () => {
    if (!identity || !serviceLink || saving || pending) return;
    const cleanMedicine = medicine.trim();
    const cleanStrength = strength.trim();
    const observed = Number(observedQty);
    const requested = Number(requestedQty);
    const date = dateAtLocalNoon(observedDate);
    if (!cleanMedicine || !cleanStrength) { setFormError('Enter the medicine name and strength/form.'); return; }
    if (!Number.isFinite(observed) || observed < 0 || !Number.isFinite(requested) || requested <= 0) {
      setFormError('Observed quantity must be zero or more, and requested quantity must be greater than zero.'); return;
    }
    if (!date || observedDate > todayLocal()) { setFormError('Enter a valid observation date that is not in the future.'); return; }
    if (note.trim().length > 500) { setFormError('Keep the note within 500 characters.'); return; }

    const id = uuid();
    const payload: StockoutInsert = {
      id,
      shc_facility_id: identity.facility.id,
      phc_facility_id: serviceLink.phc_facility_id,
      submitted_by_worker_id: identity.worker.id,
      medicine_name: cleanMedicine,
      medicine_strength_form: cleanStrength,
      reported_quantity: observed,
      requested_quantity: requested,
      quantity_unit: unit.toLowerCase(),
      observation_source: source,
      observed_at: date.toISOString(),
      worker_note: note.trim() || null,
      status: 'submitted_to_phc',
      data_mode: identity.facility.isSynthetic ? 'synthetic_demo' : 'operational',
    };
    const attempt: PendingAttempt = { id, createdAt: new Date().toISOString(), payload };
    setSaving(true); setFormError(null); setPendingMessage(null);
    try {
      try {
        await AsyncStorage.setItem(pendingKeyFor(identity.worker.id), JSON.stringify(attempt));
      } catch {
        setFormError('This device could not securely prepare the submission check. Check device storage and try again. No case was sent.');
        setSaving(false);
        return;
      }
      setPending(attempt);
      const { error: insertError } = await getSupabaseClient().from('stockout_cases').insert(payload);
      if (insertError) {
        const uncertain = insertError.code === '23505' || [408, 409, 500, 502, 503, 504].includes(insertError.status ?? 0);
        if (uncertain) {
          setPending(attempt);
          setPendingMessage('BUSHO returned an uncertain response. Checking whether the case was saved…');
          await reconcilePending(attempt);
          return;
        }
        await AsyncStorage.removeItem(pendingKeyFor(identity.worker.id));
        setPending(null);
        setFormError(insertError.code === '42501'
          ? 'BUSHO did not authorise this submission. Your account or facility assignment may need administrator review.'
          : 'BUSHO could not accept this case. Review the details and try again.');
        return;
      }
      await AsyncStorage.removeItem(pendingKeyFor(identity.worker.id));
      setPending(null);
      setFormOpen(false); resetForm();
      Alert.alert('Submitted to PHC', 'Your dated observation has been sent to the verified PHC for review.');
      await load(true);
    } catch {
      setPending(attempt);
      setPendingMessage('Connection interrupted — refresh case list to verify before resending');
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const text = (size: number) => ({ color: theme.colors.text, fontSize: size * typeScale });
  const muted = (size: number) => ({ color: theme.colors.textMuted, fontSize: size * typeScale });
  const coordinationReady = Boolean(serviceLink && phcName);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.primary} />}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, muted(11)]}>FACILITY COORDINATION</Text>
            <Text style={[styles.title, text(25)]}>Stockouts</Text>
            <Text style={[styles.subtitle, muted(14)]}>Record physical observations and follow case progress.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh stockout cases" onPress={() => void load(true)} hitSlop={10}
            style={[styles.refresh, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><RefreshCw size={19} color={theme.colors.primary} /></Pressable>
        </View>
        {identity?.facility.isSynthetic ? <StatusPill label="Synthetic Pilot" tone="warning" /> : null}

        <Card style={styles.linkCard}>
          <View style={styles.linkRow}>
            <View style={[styles.iconTile, { backgroundColor: coordinationReady ? theme.colors.successSurface : theme.colors.warningSurface }]}>
              {coordinationReady ? <ShieldCheck size={21} color={theme.colors.success} /> : <AlertCircle size={21} color={theme.colors.warning} />}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.cardTitle, text(15)]}>SHC–PHC coordination</Text>
              <Text style={muted(12)}>{phcName ?? 'A current verified PHC link is required to create a case.'}</Text>
            </View>
            <StatusPill label={coordinationReady ? 'Verified' : 'Not ready'} tone={coordinationReady ? 'success' : 'warning'} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <View><Text style={[styles.sectionTitle, text(19)]}>Your cases</Text><Text style={muted(12)}>Cases recorded by your worker account</Text></View>
          <Text style={[styles.count, muted(13)]}>{cases.length}</Text>
        </View>

        {pending ? <Card style={styles.pendingCard}>
          <View style={styles.pendingHeader}><AlertCircle size={20} color={theme.colors.warning} /><Text style={[styles.pendingTitle, text(14)]}>Submission needs verification</Text></View>
          <Text style={[styles.stateBody, muted(12)]}>{pendingMessage ?? 'A previous submission may have been interrupted.'}</Text>
          <Button label="Verify previous submission" variant="secondary" onPress={() => void reconcilePending(pending)} disabled={saving} />
          {pending.payload ? <Button label="Retry same submission" onPress={() => void retryPending(pending)} loading={saving} disabled={saving} /> : null}
          <Text style={muted(11)}>The retry uses the original case ID and saved details. Do not create a separate case.</Text>
        </Card> : null}

        {coordinationReady && !pending ? <Button label="Record a stockout observation" onPress={() => { resetForm(); setFormOpen(true); }} style={styles.createButton} /> : null}

        {loading ? <Card style={styles.stateCard}><ActivityIndicator color={theme.colors.primary} /><Text style={muted(13)}>Loading your cases…</Text></Card>
          : error ? <Card style={styles.stateCard}><AlertCircle size={24} color={theme.colors.danger} /><Text style={[styles.stateTitle, text(16)]}>Cases unavailable</Text><Text style={[styles.stateBody, muted(13)]}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={[styles.retryText, { color: theme.colors.primary }]}>Try again</Text></Pressable></Card>
          : cases.length === 0 ? <Card style={styles.stateCard}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.infoSurface }]}><ClipboardList size={23} color={theme.colors.primary} /></View>
            <Text style={[styles.stateTitle, text(17)]}>No stockout cases yet</Text>
            <Text style={[styles.stateBody, muted(13)]}>{coordinationReady ? 'Record a dated physical observation when a medicine is unavailable at your facility.' : 'A verified SHC–PHC service link is needed before a case can be created.'}</Text>
            <View style={[styles.notice, { backgroundColor: theme.colors.surfaceSubtle }]}><ShieldCheck size={17} color={theme.colors.success} /><Text style={[styles.noticeText, muted(12)]}>Only dated physical observations are represented. BUSHO is not a live or official inventory system.</Text></View>
          </Card> : cases.map((item) => {
            const status = STATUS[item.status] ?? { label: 'Status update', tone: 'neutral' as StatusTone };
            return <Card key={item.id} style={styles.caseCard}>
              <View style={styles.caseTop}><View style={styles.flex}><Text style={[styles.caseName, text(16)]}>{item.medicine_name}</Text><Text style={muted(12)}>{item.medicine_strength_form}</Text></View><StatusPill label={status.label} tone={status.tone} /></View>
              <View style={[styles.quantityPanel, { backgroundColor: theme.colors.surfaceSubtle }]}>
                <View style={styles.quantityBlock}><Text style={muted(10)}>OBSERVED</Text><Text style={[styles.quantity, text(16)]}>{Number(item.reported_quantity)} {item.quantity_unit}</Text></View>
                <View style={[styles.quantityDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.quantityBlock}><Text style={muted(10)}>REQUESTED</Text><Text style={[styles.quantity, text(16)]}>{Number(item.requested_quantity)} {item.quantity_unit}</Text></View>
              </View>
              <View style={styles.dateRow}><CalendarDays size={15} color={theme.colors.textMuted} /><Text style={muted(12)}>Observed {formatDate(item.observed_at)}</Text></View>
              {item.data_mode === 'synthetic_demo' ? <StatusPill label="Synthetic record" tone="warning" /> : null}
            </Card>;
          })}
        <Text style={[styles.footerNote, muted(11)]}>Quantities are dated observations, not live stock balances.</Text>
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => !saving && setFormOpen(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.colors.background }]} edges={['top','bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.flex}><Text style={[styles.modalEyebrow, muted(10)]}>NEW CASE · SHC TO PHC</Text><Text style={[styles.modalTitle, text(21)]}>Stockout observation</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close form" disabled={saving} onPress={() => setFormOpen(false)} style={styles.close}><X size={22} color={theme.colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.notice, { backgroundColor: theme.colors.infoSurface }]}><ShieldCheck size={17} color={theme.colors.primary} /><Text style={[styles.noticeText, muted(12)]}>Record what was physically observed at {identity?.facility.name}. Do not enter patient details.</Text></View>
            <FieldInput label="Medicine name" required value={medicine} onChangeText={setMedicine} placeholder="Enter the medicine name" maxLength={120} returnKeyType="next" />
            <FieldInput label="Strength / form" required value={strength} onChangeText={setStrength} placeholder="e.g. 500 mg tablet" maxLength={120} returnKeyType="next" />
            <View style={styles.twoFields}>
              <View style={styles.flex}><FieldInput label="Quantity observed" required value={observedQty} onChangeText={setObservedQty} keyboardType="decimal-pad" placeholder="0" /></View>
              <View style={styles.flex}><FieldInput label="Quantity requested" required value={requestedQty} onChangeText={setRequestedQty} keyboardType="decimal-pad" placeholder="1" /></View>
            </View>
            <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, text(14)]}>Unit</Text><UnitChips value={unit} onChange={setUnit} /></View>
            <View style={styles.fieldGroup}><Text style={[styles.fieldLabel, text(14)]}>How was this observed?</Text><View style={styles.choiceWrap}>
              {SOURCES.map((item) => { const selected = source === item.value; return <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setSource(item.value)} style={[styles.choice, { backgroundColor: selected ? theme.colors.infoSurface : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border }]}><Text style={{ color: selected ? theme.colors.primary : theme.colors.text, fontSize: 12 * typeScale, fontWeight: '700' }}>{item.label}</Text></Pressable>; })}
            </View></View>
            <FieldInput label="Observation date" required value={observedDate} onChangeText={setObservedDate} placeholder="YYYY-MM-DD" hint="Use YYYY-MM-DD. Future dates are not accepted." autoCapitalize="none" />
            <FieldInput label="Additional note (optional)" value={note} onChangeText={setNote} placeholder="Brief factual context; no patient information" multiline maxLength={500} style={styles.noteInput} />
            {formError ? <Text accessibilityLiveRegion="polite" style={[styles.formError, { color: theme.colors.danger }]}>{formError}</Text> : null}
            <View style={[styles.notice, { backgroundColor: theme.colors.warningSurface }]}><AlertCircle size={17} color={theme.colors.warning} /><Text style={[styles.noticeText, { color: theme.colors.warning, fontSize: 12 * typeScale }]}>Submitting sends this dated observation to the verified PHC. It does not represent an official procurement request.</Text></View>
            <Button label="Submit to PHC" onPress={() => void submitCase()} loading={saving} disabled={saving} />
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => setFormOpen(false)} style={styles.cancel}><Text style={[styles.cancelText, { color: theme.colors.textMuted, fontSize: 14 * typeScale }]}>Cancel</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  createButton: { marginTop: 2 },
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
  pendingCard: { padding: 15, gap: 10, borderColor: '#D8A23A' },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingTitle: { fontWeight: '800' },
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  modalEyebrow: { fontWeight: '800', letterSpacing: 1.1 },
  modalTitle: { fontWeight: '800' },
  close: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formContent: { padding: 20, gap: 17, paddingBottom: 36 },
  twoFields: { flexDirection: 'row', gap: 12 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontWeight: '700' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, borderWidth: 1, borderRadius: 22, paddingHorizontal: 13, justifyContent: 'center' },
  noteInput: { minHeight: 88, textAlignVertical: 'top' },
  formError: { fontSize: 13, lineHeight: 19 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '700' },
});

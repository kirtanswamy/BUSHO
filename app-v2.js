const STORAGE_KEY = 'busho-demo-state-v1';
const PORTAL_ROLE = document.querySelector('[data-portal-role]')?.dataset.portalRole || null;

function t(key, vars) {
  const helper = window.BUSHO_I18N && window.BUSHO_I18N.t;
  return typeof helper === 'function' ? helper(key, vars || {}) : key;
}

function currentLanguage() {
  return window.BUSHO_I18N && window.BUSHO_I18N.getCurrentLanguage ? window.BUSHO_I18N.getCurrentLanguage() : 'en';
}

function localizedSample(kind) { return t(`sample.${kind}`); }
function updateReportInput(value) {
  state.rawReport = value;
  reportInput.value = value;
  messageText.textContent = value || t('worker.emptyReport');
  state.extracted = false; state.confirmed = false; state.draft = [];
  renderDraftStatus(); renderDashboard(); renderAdminResponse(); saveState();
}
const baseReportCount = 18;
const inventory = [
  { id: 'ors', nameKey: 'supervisor.inventory.ors', short: 'ORS', stock: 20, capacity: 50, unitKey: 'unit.packets', severity: 'critical' },
  { id: 'ifa', nameKey: 'supervisor.inventory.ifa', short: 'Fe', stock: 14, capacity: 60, unitKey: 'unit.strips', severity: 'warning' },
  { id: 'zinc', nameKey: 'supervisor.inventory.zinc', short: 'Zn', stock: 72, capacity: 100, unitKey: 'unit.tablets', severity: 'safe' }
];

const extractionList = document.getElementById('extraction-list');
const reportInput = document.getElementById('report-input');
const messageText = document.getElementById('message-text') || document.getElementById('mock-field-text');
const draftChip = document.getElementById('draft-chip');
const provisionalBanner = document.getElementById('provisional-banner');
const verificationBar = document.getElementById('verification-bar');
const feedback = document.getElementById('draft-feedback');
const toast = document.getElementById('toast');
const inventoryDrawer = document.getElementById('inventory-drawer');
let lastFocusedElement = null;

function initialState() {
  return { version: 1, view: 'worker', sample: 'routine', rawReport: localizedSample('routine'), extracted: false, confirmed: false, draft: [], replenishment: { status: 'none', medicineId: null, source: null } };
}

function loadState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored || stored.version !== 1 || typeof stored.rawReport !== 'string') return initialState();
    const next = initialState();
    next.view = PORTAL_ROLE === 'supervisor' ? 'supervisor' : 'worker';
    next.sample = stored.sample === 'ambiguous' ? 'ambiguous' : 'routine';
    next.rawReport = stored.rawReport.slice(0, 4000);
    next.extracted = Boolean(stored.extracted);
    next.confirmed = Boolean(stored.confirmed && stored.extracted);
    next.draft = Array.isArray(stored.draft) ? stored.draft.filter(item => item && typeof item.id === 'string' && typeof item.value === 'string') : [];
    if (next.extracted && !next.draft.length) { next.extracted = false; next.confirmed = false; }
    const replenishment = stored.replenishment || {};
    next.replenishment = { status: ['none', 'draft', 'approved'].includes(replenishment.status) ? replenishment.status : 'none', medicineId: inventory.some(item => item.id === replenishment.medicineId) ? replenishment.medicineId : null, source: typeof replenishment.source === 'string' ? replenishment.source : null };
    return next;
  } catch { return initialState(); }
}

let state = loadState();

function saveState() {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { showToast(t('worker.toast.save')); }
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function showToast(message) { document.getElementById('toast-text').textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200); }
function normalizeDigits(value) { return String(value).replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d)).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[௦-௯]/g, d => '௦௧௨௩௪௫௬௭௮௯'.indexOf(d)).replace(/[౦-౯]/g, d => '౦౧౨౩౪౫౬౭౮౯'.indexOf(d)); }
function hasAny(text, words) { return words.some(word => text.toLowerCase().includes(word.toLowerCase())); }
function numberBefore(text, words) { const pattern = new RegExp('(\\d+)\\s*(?:patients?|cases?|people|மாணவர்கள்|நோயாளிகள்|రోగులు|রোগী|रुग्ण)?[^.。!?]{0,24}(' + words.join('|') + ')', 'i'); const match = text.match(pattern); return match ? match[1] : ''; }
function extractionWords(lang) { return ({
  en: { fever: ['fever'], diarrhea: ['diarrhea'], ors: ['ors'], iron: ['iron'], almost: ['almost finished', 'nearly finished'] },
  hi: { fever: ['बुखार'], diarrhea: ['दस्त', 'डायरिया'], ors: ['ors'], iron: ['आयरन', 'लोह'], almost: ['लगभग खत्म', 'लगभग समाप्त'] },
  ta: { fever: ['காய்ச்சல்'], diarrhea: ['வயிற்றுப்போக்கு'], ors: ['ors'], iron: ['இரும்பு'], almost: ['கிட்டத்தட்ட முடிந்த', 'முடிந்துவிட்ட'] },
  te: { fever: ['జ్వరం'], diarrhea: ['విరేచనాలు'], ors: ['ors'], iron: ['ఇనుము'], almost: ['దాదాపు ముగి', 'ముగిసింది'] },
  bn: { fever: ['জ্বর'], diarrhea: ['ডায়রিয়া', 'ডায়রিয়া'], ors: ['ors'], iron: ['আয়রন', 'লোহা'], almost: ['প্রায় শেষ', 'শেষ'] },
  mr: { fever: ['ताप'], diarrhea: ['जुलाब'], ors: ['ors'], iron: ['लोह'], almost: ['जवळजवळ संपले', 'संपले'] }
}[lang] || {}); }

function setSample(type) {
  state.sample = type === 'ambiguous' ? 'ambiguous' : 'routine'; state.rawReport = localizedSample(state.sample); state.extracted = false; state.confirmed = false; state.draft = [];
  reportInput.value = state.rawReport; messageText.textContent = state.rawReport; renderAll(); saveState(); showToast(t(`worker.toast.${state.sample}`));
}

function makeExtraction() {
  const report = normalizeDigits(reportInput.value.trim());
  if (!report) { showToast(t('worker.toast.empty')); reportInput.focus(); return; }
  const lang = currentLanguage();
  const catalog = {
    en: ['ORS','oral rehydration salts','paracetamol','acetaminophen','ibuprofen','amoxicillin','azithromycin','iron','folic acid','IFA','zinc','insulin','metformin','antibiotic','antibiotics','tablet','tablets','capsule','capsules','syrup','injection','malaria','dengue','diabetes','hypertension','fever','cough','cold','diarrhea','diarrhoea','vomiting','headache','anemia','asthma','tuberculosis','typhoid'],
    hi: ['ओआरएस','पैरासिटामोल','पेरासिटामोल','आइबुप्रोफेन','एमोक्सिसिलिन','एज़िथ्रोमाइसिन','आयरन','फोलिक एसिड','जिंक','इंसुलिन','मेटफॉर्मिन','एंटीबायोटिक','गोली','दवा','दवाई','सिरप','इंजेक्शन','मलेरिया','डेंगू','मधुमेह','डायबिटीज','उच्च रक्तचाप','बुखार','खांसी','जुकाम','दस्त','उल्टी','सिरदर्द','एनीमिया','टीबी','टाइफाइड'],
    bn: ['ওআরএস','প্যারাসিটামল','আইবুপ্রোফেন','অ্যামোক্সিসিলিন','অ্যাজিথ্রোমাইসিন','আয়রন','ফলিক অ্যাসিড','জিঙ্ক','ইনসুলিন','মেটফর্মিন','অ্যান্টিবায়োটিক','ট্যাবলেট','ওষুধ','সিরাপ','ইনজেকশন','ম্যালেরিয়া','ডেঙ্গু','ডায়াবেটিস','উচ্চ রক্তচাপ','জ্বর','কাশি','সর্দি','ডায়রিয়া','বমি','মাথাব্যথা','রক্তাল্পতা','যক্ষ্মা','টাইফয়েড'],
    ta: ['ஓஆர்எஸ்','பாராசிட்டமால்','ஐபுபுரூஃபன்','அமோக்சிசிலின்','அசித்ரோமைசின்','இரும்பு','ஃபோலிக் அமிலம்','துத்தநாகம்','இன்சுலின்','மெட்ஃபார்மின்','ஆண்டிபயாடிக்','மாத்திரை','மருந்து','சிரப்','ஊசி','மலேரியா','டெங்கு','நீரிழிவு','உயர் இரத்த அழுத்தம்','காய்ச்சல்','இருமல்','சளி','வயிற்றுப்போக்கு','வாந்தி','தலைவலி','இரத்தசோகை','காசநோய்','டைபாய்டு'],
    te: ['ఓఆర్ఎస్','పారాసిటమాల్','ఇబుప్రోఫెన్','అమోక్సిసిలిన్','అజిత్రోమైసిన్','ఇనుము','ఫోలిక్ యాసిడ్','జింక్','ఇన్సులిన్','మెట్‌ఫార్మిన్','యాంటీబయాటిక్','మాత్రలు','మందు','సిరప్','ఇంజెక్షన్','మలేరియా','డెంగ్యూ','మధుమేహం','అధిక రక్తపోటు','జ్వరం','దగ్గు','జలుబు','విరేచనాలు','వాంతులు','తలనొప్పి','రక్తహీనత','క్షయ','టైఫాయిడ్'],
    mr: ['ओआरएस','पॅरासिटामॉल','आयबुप्रोफेन','अमॉक्सिसिलिन','अॅझिथ्रोमायसिन','लोह','फॉलिक अॅसिड','झिंक','इन्सुलिन','मेटफॉर्मिन','प्रतिजैविक','गोळी','औषध','सिरप','इंजेक्शन','मलेरिया','डेंग्यू','मधुमेह','उच्च रक्तदाब','ताप','खोकला','सर्दी','जुलाब','उलटी','डोकेदुखी','अशक्तपणा','क्षयरोग','टायफॉइड']
  };
  const terms = catalog[lang] || catalog.en;
  const lower = report.toLocaleLowerCase();
  const medicines = terms.filter(term => lower.includes(term.toLocaleLowerCase()));
  const numbers = [...report.matchAll(/[0-9]+/g)].map(match => match[0]);
  const makeItem = (id, kind, icon, label, value, note) => ({
    id, kind, icon, label, value: value || t('draft.notDetected'),
    confidence: value ? 'review' : 'review',
    note: value ? t('draft.confidence.review') : note
  });
  state.rawReport = report;
  state.draft = [
    makeItem('reported-details','symptom','+',t('draft.reportedDetails'),report,t('draft.needsClarify')),
    makeItem('reported-medicines','medicine','Rx',t('draft.reportedMedicines'),medicines.join(', '),t('draft.notDetected')),
    makeItem('reported-quantities','quantity','#',t('draft.reportedQuantities'),numbers.join(', '),t('draft.notDetected')),
    { id:'original-report', kind:'source', icon:'Aa', label:t('draft.originalReport'), value:report, confidence:'high', note:t('draft.source'), readOnly:true }
  ];
  state.extracted = true;
  state.confirmed = false;
  state.replenishment = { status:'none', medicineId:null, source:null };
  renderAll();
  saveState();
  showToast(t('worker.toast.extract'));
}
function renderExtraction() {
  if (!state.extracted || !state.draft.length) { extractionList.innerHTML = `<div class="empty-extraction"><div class="empty-orbit">${escapeHtml(t('worker.draft'))}</div><strong>${escapeHtml(t('worker.emptyTitle'))}</strong><span>${escapeHtml(t('worker.emptyDesc'))}</span></div>`; return; }
  extractionList.innerHTML = state.draft.map(item => { const confidence = state.confirmed && item.confidence === 'review' ? 'high' : item.confidence; const note = state.confirmed && item.confidence === 'review' ? t('draft.confidence.workerChecked') : item.note; return `<div class="extraction-item" data-field-id="${escapeHtml(item.id)}"><div class="item-icon ${escapeHtml(item.kind)}">${escapeHtml(item.icon)}</div><div class="field-copy"><label class="item-label" for="field-${escapeHtml(item.id)}">${escapeHtml(({ 'reported-details': t('draft.reportedDetails'), 'reported-medicines': t('draft.reportedMedicines'), 'reported-quantities': t('draft.reportedQuantities'), 'original-report': t('draft.originalReport') })[item.id] || item.label)}</label><span class="field-source">${escapeHtml(t('draft.source'))}</span><input class="field-edit" id="field-${escapeHtml(item.id)}" value="${escapeHtml(item.value)}" ${item.readOnly || state.confirmed ? 'readonly' : ''} aria-label="${escapeHtml(item.label)}" /></div><span class="confidence ${escapeHtml(confidence)}">${escapeHtml(note)}</span></div>`; }).join('');
  extractionList.querySelectorAll('.field-edit').forEach(input => input.addEventListener('input', event => { const item = state.draft.find(entry => entry.id === event.target.id.replace('field-', '')); if (item) item.value = event.target.value; event.target.classList.remove('invalid'); feedback.textContent = ''; saveState(); }));
}

function renderDraftStatus() {
  draftChip.className = 'draft-chip';
  if (!state.extracted) { draftChip.textContent = t('worker.draftAwaiting'); provisionalBanner.innerHTML = `<span class="banner-icon">i</span><div><strong>${escapeHtml(t('worker.provisionalTitle'))}</strong><span>${escapeHtml(t('worker.provisionalDesc'))}</span></div>`; verificationBar.classList.add('hidden'); return; }
  if (state.confirmed) { draftChip.textContent = t('worker.draftVerified'); draftChip.classList.add('confirmed'); provisionalBanner.innerHTML = `<span class="banner-icon">OK</span><div><strong>${escapeHtml(t('worker.provisionalVerifiedTitle'))}</strong><span>${escapeHtml(t('worker.provisionalVerified'))}</span></div>`; verificationBar.classList.add('hidden'); return; }
  draftChip.textContent = t('worker.draftNeedsVerify'); draftChip.classList.add('ready'); provisionalBanner.innerHTML = `<span class="banner-icon">!</span><div><strong>${escapeHtml(t('worker.provisionalFlaggedTitle'))}</strong><span>${escapeHtml(t('worker.provisionalFlagged'))}</span></div>`; verificationBar.classList.remove('hidden'); feedback.textContent = '';
}

function validationForDraft() { return state.draft.filter(item => item.confidence === 'review' && (!item.value.trim() || item.id === 'symptoms' && item.value === t('draft.symptomsUnclear') || item.id !== 'symptoms' && item.id !== 'clinical-status' && item.value === t('draft.quantityUnclear'))); }
function confirmReport() { if (!state.extracted) return showToast(t('worker.toast.extractFirst')); const invalid = validationForDraft(); extractionList.querySelectorAll('.field-edit').forEach(input => input.classList.remove('invalid')); if (invalid.length) { feedback.textContent = `${t('draft.needsClarify')}: ${invalid.map(item => item.label).join(', ')}.`; invalid.forEach(item => document.getElementById(`field-${item.id}`)?.classList.add('invalid')); document.getElementById(`field-${invalid[0].id}`)?.focus(); showToast(t('worker.toast.validate')); return; } state.confirmed = true; renderAll(); saveState(); document.getElementById('post-confirm')?.classList.remove('hidden'); showToast(t('worker.toast.confirm')); }
function editFields() { if (!state.extracted) return; const first = extractionList.querySelector('.field-edit:not([readonly])') || extractionList.querySelector('.field-edit'); first?.focus(); first?.select(); showToast(t('worker.toast.edit')); }
function renderDashboard() { const pending = state.confirmed ? 0 : 1; document.getElementById('reports-count').textContent = String(baseReportCount + (state.confirmed ? 1 : 0)); document.getElementById('reports-trend').textContent = t(state.confirmed ? 'supervisor.metric.trend.positive' : 'supervisor.metric.trend.baseline'); document.getElementById('pending-count').textContent = String(pending); document.getElementById('pending-trend').textContent = t(pending ? 'supervisor.metric.trend.warning' : 'supervisor.metric.trend.allReviewed'); document.getElementById('pending-trend').className = `metric-trend ${pending ? 'warning' : 'positive'}`; const badge = document.getElementById('admin-badge'); if (badge) badge.textContent = String(pending); }
function renderAdminResponse() { const response = document.getElementById('admin-response'); const approve = document.getElementById('approve-replenishment'); if (!state.confirmed) { response.classList.add('hidden'); return; } response.classList.remove('hidden'); const title = document.getElementById('admin-action-title'); const copy = document.getElementById('admin-action-copy'); const status = document.getElementById('admin-action-status'); const medicine = inventory.find(item => item.id === state.replenishment.medicineId); if (state.replenishment.status === 'approved' && medicine) { title.textContent = t('supervisor.responseTitleApproved'); copy.textContent = t('supervisor.responseCopyApproved', { name: t(medicine.nameKey) }); status.textContent = t('supervisor.statusApproved'); approve.disabled = true; approve.textContent = t('supervisor.approvedBtn'); } else if (state.replenishment.status === 'draft' && medicine) { title.textContent = t('supervisor.responseTitleDraft'); copy.textContent = t('supervisor.responseCopyDraft', { name: t(medicine.nameKey), qty: medicine.capacity - medicine.stock, unit: t(medicine.unitKey), source: state.replenishment.source }); status.textContent = t('supervisor.statusPending'); approve.disabled = false; approve.textContent = t('supervisor.approveBtn'); } else { title.textContent = t('supervisor.responseTitle'); copy.textContent = t('supervisor.responseCopy'); status.textContent = t('supervisor.statusAwaiting'); approve.disabled = true; approve.textContent = t('supervisor.approveBtn'); } }
function renderInventory() { const list = document.getElementById('inventory-detail-list'); list.innerHTML = inventory.map(item => `<div class="inventory-detail-row"><div><strong>${escapeHtml(t(item.nameKey))}</strong><span>${item.stock} / ${item.capacity} ${escapeHtml(t(item.unitKey))} · ${escapeHtml(t(`supervisor.severity.${item.severity}`))}</span></div><button class="secondary-btn inventory-draft" type="button" data-medicine="${item.id}" ${item.severity === 'safe' ? 'disabled' : ''}>${escapeHtml(t(item.severity === 'safe' ? 'supervisor.drawerNoAction' : 'supervisor.drawerDraftBtn'))}</button></div>`).join(''); list.querySelectorAll('.inventory-draft').forEach(button => button.addEventListener('click', () => createReplenishmentDraft(button.dataset.medicine))); }
function openInventory() { lastFocusedElement = document.activeElement; inventoryDrawer.classList.remove('hidden'); renderInventory(); document.getElementById('close-inventory').focus(); }
function closeInventory() { inventoryDrawer.classList.add('hidden'); (lastFocusedElement || document.getElementById('view-inventory')).focus(); }
function createReplenishmentDraft(medicineId) { const medicine = inventory.find(item => item.id === medicineId); if (!medicine || medicine.severity === 'safe') return; state.replenishment = { status: 'draft', medicineId, source: state.confirmed ? t('supervisor.sourceVerified') : t('supervisor.sourceSynthetic') }; renderAdminResponse(); saveState(); closeInventory(); showToast(t('supervisor.toast.draftCreated', { name: t(medicine.nameKey) })); }
function approveReplenishment() { if (state.replenishment.status !== 'draft') return; state.replenishment.status = 'approved'; renderAdminResponse(); saveState(); showToast(t('supervisor.toast.approved')); }
function switchView(view, notify = true) { state.view = PORTAL_ROLE ? (PORTAL_ROLE === 'supervisor' ? 'supervisor' : 'worker') : (view === 'admin' || view === 'supervisor' ? 'supervisor' : 'worker'); document.querySelectorAll('.role-btn').forEach(button => { const active = !PORTAL_ROLE && button.dataset.view === state.view; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); }); document.querySelectorAll('.view-panel').forEach(panel => { const active = panel.id === `${state.view}-panel`;  panel.classList.toggle('active', active); panel.hidden = !active; }); saveState(); if (notify && state.view === 'supervisor' && !state.confirmed) showToast(t('supervisor.toast.confirmed')); }
function renderAll() { reportInput.value = state.rawReport; messageText.textContent = state.rawReport || t('worker.emptyReport'); renderExtraction(); renderDraftStatus(); renderDashboard(); renderAdminResponse(); switchView(state.view, false); }

document.querySelectorAll('.role-btn').forEach(button => {
  button.addEventListener('click', () => switchView(button.dataset.view));
  button.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
    const tabs = [...document.querySelectorAll('.role-btn')];
    const next = tabs[(tabs.indexOf(button) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    event.preventDefault();
    next.focus();
    switchView(next.dataset.view);
  });
});
document.querySelectorAll('.quick-btn').forEach(button => button.addEventListener('click', () => setSample(button.dataset.sample)));
document.getElementById('extract-btn').addEventListener('click', makeExtraction); document.getElementById('confirm-btn').addEventListener('click', confirmReport); document.getElementById('edit-btn').addEventListener('click', editFields); document.getElementById('view-inventory').addEventListener('click', openInventory); document.getElementById('close-inventory').addEventListener('click', closeInventory); document.getElementById('approve-replenishment').addEventListener('click', approveReplenishment);
document.getElementById('reset-demo').addEventListener('click', () => { try { window.localStorage.removeItem(STORAGE_KEY); } catch {} state = initialState(); closeInventory(); renderAll(); showToast(t('footer.reset')); });
// Voice input using the browser Web Speech API.
const voiceButton = document.querySelector('.voice-button');
let recognition = null;
let isRecording = false;
let isStarting = false;
let isStopping = false;
let currentSessionId = 0;
let voiceWanted = false;

const speechLocales = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN'
};
// Brave exposes navigator.brave; its speech service may fail even when mic access works.
const isBraveBrowser = Boolean(navigator.brave);

function setVoiceButtonState(mode) {
  if (!voiceButton) return;
  const recording = mode === 'listening' || mode === 'starting';
  voiceButton.classList.toggle('recording', recording);
  voiceButton.classList.toggle('is-starting', mode === 'starting');
  voiceButton.setAttribute('aria-pressed', String(recording));
  voiceButton.setAttribute('aria-label', t(recording ? 'voice.listening' : 'voice.demo'));
  voiceButton.setAttribute('title', t(recording ? 'voice.stop' : 'voice.demo'));
}

function resetVoiceSession(sessionId) {
  if (sessionId !== currentSessionId) return;
  isRecording = false;
  isStarting = false;
  isStopping = false;
  recognition = null;
  setVoiceButtonState('idle');
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast(t('voice.unsupported'));
    return;
  }
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    showToast(t('voice.secureContext'));
    return;
  }
  if (isRecording || isStarting) {
    stopVoice();
    return;
  }
  if (isStopping || recognition) return;

  let session;
  try {
    session = new SpeechRecognition();
  } catch {
    showToast(t('voice.startFailed'));
    return;
  }

  recognition = session;
  const sessionId = ++currentSessionId;
  voiceWanted = true;
  isStarting = true;
  session.continuous = true;
  session.interimResults = true;
  session.maxAlternatives = 1;
  session.lang = speechLocales[currentLanguage()] || 'en-IN';
  setVoiceButtonState('starting');

  session.onstart = () => {
    if (sessionId !== currentSessionId || recognition !== session) return;
    isStarting = false;
    isRecording = true;
    setVoiceButtonState('listening');
    showToast(t('voice.listening'));
  };

  session.onresult = (event) => {
    if (sessionId !== currentSessionId || recognition !== session) return;
    const finalParts = [];
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal && result[0]?.transcript) finalParts.push(result[0].transcript.trim());
    }
    const transcript = finalParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!transcript) return;

    const existingText = reportInput.value.trim();
    const separator = existingText && !/[\s]$/.test(reportInput.value) ? ' ' : '';
    updateReportInput(existingText ? reportInput.value + separator + transcript : transcript);
    reportInput.focus();
    showToast(t('voice.transcribed'));
  };

  session.onerror = (event) => {
    if (sessionId !== currentSessionId || recognition !== session) return;
    isRecording = false;
    isStarting = false;
    isStopping = true;
    setVoiceButtonState('idle');
    console.warn('[BUSHO voice] Speech recognition error:', event.error, event.message || '');
    if (event.error === 'no-speech') return;
    else if (event.error === 'audio-capture') showToast(t('voice.audioCapture'));
    else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') showToast(t('voice.notAllowed'));
    else if (event.error === 'network') { voiceWanted = false; showToast(t(isBraveBrowser ? 'voice.braveNetwork' : 'voice.network')); }
    else if (event.error === 'language-not-supported') showToast(t('voice.languageUnsupported'));
    else if (event.error === 'aborted') return;
    else showToast(t('voice.errorDetail', { error: event.error || 'unknown' }));
  };

  session.onend = () => {
    if (sessionId !== currentSessionId || recognition !== session) return;
    isRecording = false;
    recognition = null;
    if (voiceWanted && !isStopping) {
      setVoiceButtonState('starting');
      window.setTimeout(() => {
        if (sessionId !== currentSessionId || !voiceWanted) return;
        recognition = null;
        startVoice();
      }, 400);
    } else resetVoiceSession(sessionId);
  };

  try {
    session.start();
  } catch {
    resetVoiceSession(sessionId);
    showToast(t('voice.startFailed'));
  }
}

function stopVoice() {
  if (!recognition || isStopping) return;
  voiceWanted = false;
  isStopping = true;
  isRecording = false;
  isStarting = false;
  setVoiceButtonState('idle');
  try {
    recognition.stop();
  } catch {
    const sessionId = currentSessionId;
    resetVoiceSession(sessionId);
  }
}

if (voiceButton) {
  voiceButton.addEventListener('click', () => {
    if (isRecording || isStarting) stopVoice();
    else startVoice();
  });
}
reportInput.addEventListener('input', () => updateReportInput(reportInput.value));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !inventoryDrawer.classList.contains('hidden')) closeInventory(); if (event.key === 'Tab' && !inventoryDrawer.classList.contains('hidden')) { const focusable = [...inventoryDrawer.querySelectorAll('button:not([disabled]), [href], input, select, textarea')]; if (!focusable.length) return; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); } } });
if (window.BUSHO_I18N && window.BUSHO_I18N.onLanguageChange) window.BUSHO_I18N.onLanguageChange(() => { if (!state.extracted) state.rawReport = localizedSample(state.sample); renderAll(); renderInventory(); });
renderInventory(); renderAll();

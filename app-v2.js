const STORAGE_PREFIX = 'busho-worker-state-v1:';
let activeAuthUserId = null;
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
  if (['submitted', 'resubmitted', 'supervisor_verified', 'closed', 'rejected'].includes(state.serverStatus)) {
    state.reportId = null;
    state.serverStatus = null;
    state.syncStatus = 'idle';
  }
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
  return { version: 1, view: 'worker', sample: 'routine', rawReport: localizedSample('routine'), extracted: false, confirmed: false, draft: [], reportId: null, serverStatus: null, syncStatus: 'idle', replenishment: { status: 'none', medicineId: null, source: null } };
}

function loadState(userId) {
  if (!userId) return initialState();
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + userId) || 'null');
    if (!stored || stored.version !== 1 || typeof stored.rawReport !== 'string') return initialState();
    const next = initialState();
    next.view = PORTAL_ROLE === 'supervisor' ? 'supervisor' : 'worker';
    next.sample = stored.sample === 'ambiguous' ? 'ambiguous' : 'routine';
    next.rawReport = stored.rawReport.slice(0, 4000);
    next.extracted = Boolean(stored.extracted);
    next.confirmed = Boolean(stored.confirmed && stored.extracted);
    next.reportId = typeof stored.reportId === 'string' && stored.reportId.length <= 80 ? stored.reportId : null;
    next.serverStatus = typeof stored.serverStatus === 'string' ? stored.serverStatus : null;
    next.syncStatus = ['idle', 'saving', 'draft_saved', 'submitted', 'error'].includes(stored.syncStatus) ? stored.syncStatus : 'idle';
    next.draft = Array.isArray(stored.draft) ? stored.draft.filter(item => item && typeof item.id === 'string' && typeof item.value === 'string') : [];
    if (next.extracted && (!next.draft.length || !next.draft.some(item => item.id === 'disease-table') || !next.draft.some(item => item.id === 'medicine-table'))) { next.extracted = false; next.confirmed = false; next.draft = []; }
    const replenishment = stored.replenishment || {};
    next.replenishment = { status: ['none', 'draft', 'approved'].includes(replenishment.status) ? replenishment.status : 'none', medicineId: inventory.some(item => item.id === replenishment.medicineId) ? replenishment.medicineId : null, source: typeof replenishment.source === 'string' ? replenishment.source : null };
    return next;
  } catch { return initialState(); }
}

let state = initialState();

function persistState() {
  if (!activeAuthUserId) throw new Error('No authenticated BUSHO account is available for draft storage.');
  const key = STORAGE_PREFIX + activeAuthUserId;
  if (['submitted', 'resubmitted', 'supervisor_verified', 'closed', 'rejected'].includes(state.serverStatus)) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(state));
}

function saveState() {
  if (!activeAuthUserId) return;
  try { persistState(); }
  catch { showToast(t('worker.toast.save')); }
}

document.addEventListener('busho:authenticated', event => {
  const userId = event.detail?.profile?.id;
  if (!userId) return;
  activeAuthUserId = userId;
  state = loadState(userId);
  renderAll();
});

document.addEventListener('busho:unauthenticated', () => {
  activeAuthUserId = null;
  state = initialState();
  renderAll();
});

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
  if (['submitted', 'resubmitted', 'supervisor_verified', 'closed', 'rejected'].includes(state.serverStatus)) {
    state.reportId = null;
    state.serverStatus = null;
    state.syncStatus = 'idle';
  }
  state.sample = type === 'ambiguous' ? 'ambiguous' : 'routine'; state.rawReport = localizedSample(state.sample); state.extracted = false; state.confirmed = false; state.draft = [];
  reportInput.value = state.rawReport; messageText.textContent = state.rawReport; renderAll(); saveState(); showToast(t(`worker.toast.${state.sample}`));
}

const MEDICINE_CATALOG = [
  ['Paracetamol','paracetamol','acetaminophen','crocin','calpol','dolo','p-500','पैरासिटामोल','पेरासिटामोल','paracetmol'],
  ['Cetirizine','cetirizine','zyrtec','cetzine','cetcip','सेटिरिज़िन','सेट्रीज़िन'],
  ['Levocetirizine','levocetirizine','xyzal','levo cetirizine'],
  ['Ibuprofen','ibuprofen','brufen','combiflam','इबुप्रोफेन'],
  ['Amoxicillin','amoxicillin','amox','mox','novamox','अमोक्सिसिलिन'],
  ['Azithromycin','azithromycin','azithral','zithromax','अज़िथ्रोमाइसिन'],
  ['Metformin','metformin','glycomet','glucophage','मेटफॉर्मिन'],
  ['ORS','ors','oral rehydration salts','oral rehydration solution','ओआरएस'],
  ['Iron / IFA','iron folic acid','ifa','ferrous sulfate','ferrous sulphate','iron tablets','आयरन','लोह','இரும்பு','ఇనుము'],
  ['Folic acid','folic acid','folvite','फोलिक एसिड'],
  ['Zinc','zinc','zinc sulfate','zinc sulphate','जिंक','துத்தநாகம்','జింక్'],
  ['Amlodipine','amlodipine','amlong'],['Losartan','losartan','losar'],['Atenolol','atenolol','tenormin'],
  ['Omeprazole','omeprazole','omez'],['Pantoprazole','pantoprazole','pantocid','pan'],
  ['Domperidone','domperidone','motilium','domstal'],['Ondansetron','ondansetron','ondem'],
  ['Metronidazole','metronidazole','flagyl'],['Ciprofloxacin','ciprofloxacin','ciplox'],
  ['Doxycycline','doxycycline','doxicip'],['Albendazole','albendazole','zentel'],
  ['Salbutamol','salbutamol','albuterol','asthalin'],['Montelukast','montelukast','montek'],
  ['Loratadine','loratadine','claritin'],['Insulin','insulin','actrapid','mixtard'],
  ['Aspirin','aspirin','ecosprin'],['Clopidogrel','clopidogrel','clopilet'],
  ['Atorvastatin','atorvastatin','atorva'],['Diclofenac','diclofenac','voveran'],
  ['Calcium','calcium carbonate','shelcal'],['Vitamin D3','vitamin d3','cholecalciferol','uprise-d3'],
  ['Multivitamin','multivitamin','becosules','supradyn'],['Cotrimoxazole','cotrimoxazole','septran'],
  ['Artemether + Lumefantrine','artemether lumefantrine','coartem'],
  ['Chloroquine','chloroquine'],['Prednisolone','prednisolone','wysolone'],
  ['Dexamethasone','dexamethasone','decadron'],['Mupirocin','mupirocin','t-bact'],
  ['Clotrimazole','clotrimazole','canesten'],['Fluconazole','fluconazole','forcan']
];
const DISEASE_CATALOG = [
  ['Malaria','malaria','मलेरिया','maleriya','மலேரியா','మలేరియా','ম্যালেরিয়া'],
  ['Dengue','dengue','डेंगू','dengu','டெங்கு','డెంగ్యూ','ডেঙ্গু'],
  ['Chikungunya','chikungunya','चिकनगुनिया','சிக்குன்குனியா','చికున్‌గున్యా'],
  ['Fever','fever','बुखार','bukhar','ताप','காய்ச்சல்','ஜ்வரம்','జ్వరం','জ্বর'],
  ['Diarrhoea','diarrhea','diarrhoea','दस्त','डायरिया','जुलाब','வயிற்றுப்போக்கு','విరేచనాలు','ডায়রিয়া'],
  ['Cough','cough','खांसी','khansi','खोकला','இருமல்','దగ్గు','কাশি'],
  ['Common cold','common cold','cold','जुकाम','sardi','सर्दी','சளி','జలుబు','সর্দি'],
  ['Diabetes','diabetes','मधुमेह','डायबिटीज','நீரிழிவு','మధుమేహం','ডায়াবেটিস'],
  ['Hypertension','hypertension','high blood pressure','उच्च रक्तचाप','बीपी','உயர் இரத்த அழுத்தம்','అధిక రక్తపోటు'],
  ['Tuberculosis','tuberculosis','tb','टीबी','क्षयरोग','காசநோய்','క్షయ','যক্ষ্মা'],
  ['Typhoid','typhoid','टाइफाइड','टायफॉइड','டைபாய்டு','టైఫాయిడ్'],
  ['Asthma','asthma','दमा','अस्थमा','ஆஸ்துமா','ఉబ్బసం'],
  ['Anaemia','anaemia','anemia','खून की कमी','रक्ताल्पता','अशक्तपणा','இரத்தசோகை','రక్తహీనత'],
  ['Pneumonia','pneumonia','निमोनिया','நிமோனியா','న్యుమోనియా'],
  ['Headache','headache','सिरदर्द','डोकेदुखी','தலைவலி','తలనొప్పి'],
  ['Vomiting','vomiting','उल्टी','उलटी','வாந்தி','వాంతులు'],
  ['Abdominal pain','abdominal pain','stomach pain','पेट दर्द','पोटदुखी','வயிற்று வலி','కడుపు నొప్పి'],
  ['Urinary tract infection','urinary tract infection','uti','मूत्र संक्रमण'],
  ['Chickenpox','chickenpox','चेचक','कांजिण्या','சின்னம்மை']
];
function editDistance(a,b){const p=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let d=p[0];p[0]=i;for(let j=1;j<=b.length;j++){const q=p[j];p[j]=Math.min(p[j]+1,p[j-1]+1,d+(a[i-1]===b[j-1]?0:1));d=q;}}return p[b.length];}
function catalogMatches(text,catalog){
 const lower=text.toLocaleLowerCase(),matches=[];
 for(const row of catalog){let best=null;
  for(const alias of row.slice(1)){
   const escaped=alias.replace(/[.*+?^$()|[\]\\]/g,'\\$&'),latin=/^[a-z0-9 +.-]+$/i.test(alias);
   const re=latin?new RegExp('(^|[^a-z0-9])('+escaped+')(?=$|[^a-z0-9])','i'):new RegExp(escaped,'i'),found=re.exec(lower);
   if(found){const index=found.index+(latin&&found[1]?found[1].length:0),length=latin&&found[2]?found[2].length:found[0].length;if(!best||index<best.index)best={index,end:index+length,alias,fuzzy:false};}
   if(!best&&/^[a-z]{6,}$/i.test(alias)){for(const word of lower.matchAll(/[a-z]{5,}/g)){const limit=alias.length>=12?2:1;if(Math.abs(word[0].length-alias.length)<=limit&&editDistance(word[0],alias.toLowerCase())<=limit){best={index:word.index,end:word.index+word[0].length,alias,fuzzy:true};break;}}}
  }if(best)matches.push({name:row[0],...best});
 }return matches.sort((a,b)=>a.index-b.index);
}
function reportClause(report,index,end){const bounds=[...report.matchAll(/[,;.!?।॥]|\band\b/gi)].map(m=>({start:m.index,end:m.index+m[0].length}));const left=bounds.filter(x=>x.end<=index).at(-1)?.end??0,right=bounds.find(x=>x.start>=end)?.start??report.length;return report.slice(left,right);}
function nearestNumber(text,index,before=55,after=45){const l=text.slice(Math.max(0,index-before),index),r=text.slice(index,Math.min(text.length,index+after)),lm=[...l.matchAll(/[0-9]+/g)].at(-1),rm=r.match(/[0-9]+/),ld=lm?l.length-lm.index-lm[0].length:Infinity,rd=rm?rm.index:Infinity;if(Math.min(ld,rd)>26)return '';return ld<=rd?lm[0]:rm[0];}
function medicineQuantity(report,match){const clause=reportClause(report,match.index,match.end),index=match.index-report.indexOf(clause),quantity=nearestNumber(clause,index,45,55),unit=(clause.match(/\b(tablets?|tabs?|strips?|packs?|packets?|bottles?|capsules?|caps?|sachets?|vials?|ampoules?|ml|millilit(?:er|re)s?|doses?|units?|गोलियां|गोलियाँ|गोली|पत्ते|पैकेट|மாத்திரைகள்|மாத்திரை|మాత్రలు|టాబ్లెట్లు)\b/i)||[])[1]||'',remaining=/(left|remaining|remain|balance|stock|available|only|bacha|bache|bachi|shesh|बचे|बचा|बची|बाकी|शेष|உள்ளன|மீதம்|మిగిలి|বাকি|অবশিষ্ট)/i.test(clause);return{quantity,unit,stockStatus:quantity?(remaining?'Remaining stock · verify':'Quantity mentioned · verify'):'Quantity not stated · clarify',sourcePhrase:clause.trim(),fuzzy:Boolean(match.fuzzy)};}
function conditionPatientCount(report,match){const clause=reportClause(report,match.index,match.end),index=match.index-report.indexOf(clause),count=nearestNumber(clause,index,45,45),cue=/(patient|patients|people|cases?|मरीज|रोगी|पेशेंट|நோயாளி|రోగి|রোগী|रुग्ण)/i.test(clause);return{patients:count&&cue?count:'',countStatus:count&&cue?'Patient count · verify':'Not stated · clarify',sourcePhrase:clause.trim()};}
function makeExtraction() {
  const report = normalizeDigits(reportInput.value.trim());
  if (!report) { showToast(t('worker.toast.empty')); reportInput.focus(); return; }
  const medicines = catalogMatches(report, MEDICINE_CATALOG).map(match => ({ name: match.name, mentionedAs: match.alias, ...medicineQuantity(report, match) }));
  const conditions = catalogMatches(report, DISEASE_CATALOG).map(match => ({ name: match.name, ...conditionPatientCount(report, match) }));
  const makeTable = (id, kind, icon, label, rows) => ({
    id, kind, icon, label, rows, value: JSON.stringify(rows), confidence: 'review',
    note: rows.length ? t('draft.confidence.review') : t('draft.notDetected')
  });
  state.rawReport = report;
  state.draft = [
    makeTable('disease-table', 'symptom', '+', t('draft.diseaseTable'), conditions),
    makeTable('medicine-table', 'medicine', 'Rx', t('draft.medicineTable'), medicines),
    { id: 'original-report', kind: 'source', icon: 'Aa', label: t('draft.originalReport'), value: report, confidence: 'high', note: t('draft.source'), readOnly: true }
  ];
  state.extracted = true;
  state.confirmed = false;
  state.replenishment = { status: 'none', medicineId: null, source: null };
  renderAll();
  saveState();
  showToast(t('worker.toast.extract'));
}
function renderExtraction() {
  if (!state.extracted || !state.draft.length) { extractionList.innerHTML = `<div class="empty-extraction"><div class="empty-state"><strong>${escapeHtml(t('worker.emptyTitle'))}</strong><p>${escapeHtml(t('worker.emptyDesc'))}</p></div></div>`; return; }
  const diseaseItem=state.draft.find(x=>x.id==='disease-table'), medicineItem=state.draft.find(x=>x.id==='medicine-table'), sourceItem=state.draft.find(x=>x.id==='original-report');
  const input=(value,table,row,key,label,type='text')=>`<input class="clinical-edit-input" data-table="${table}" data-row="${row}" data-key="${key}" aria-label="${label}" type="${type}" value="${escapeHtml(value??'')}">`;
  const diseaseRows=diseaseItem.rows||[], medicineRows=medicineItem.rows||[];
  const d=diseaseRows.map((r,i)=>`<tr><td><span class="clinical-item-name"><span class="clinical-mini-icon">✚</span>${input(r.name,'disease-table',i,'name','Condition')}</span></td><td>${input(r.patients,'disease-table',i,'patients','Patient count','number')}</td><td><span class="clinical-status">${escapeHtml(r.countStatus||'Needs review')}</span></td><td><button type="button" class="clinical-remove" data-remove-table="disease-table" data-remove-row="${i}">Remove</button></td></tr>`).join('');
  const m=medicineRows.map((r,i)=>`<tr><td><span class="clinical-item-name"><span class="clinical-mini-icon medicine">Rx</span>${input(r.name,'medicine-table',i,'name','Medicine')}</span><small class="clinical-alias">Heard as: ${escapeHtml(r.mentionedAs||r.name)}${r.fuzzy?' · possible spelling correction':''}</small></td><td>${input(r.quantity,'medicine-table',i,'quantity','Quantity','number')}</td><td>${input(r.unit,'medicine-table',i,'unit','Unit')}</td><td><span class="clinical-status">${escapeHtml(r.stockStatus||'Needs review')}</span></td><td><button type="button" class="clinical-remove" data-remove-table="medicine-table" data-remove-row="${i}">Remove</button></td></tr>`).join('');
  extractionList.innerHTML=`<div class="clinical-summary"><span><strong>${diseaseRows.length}</strong> conditions</span><span><strong>${medicineRows.length}</strong> medicines</span><span class="clinical-review-hint">Review and correct before confirming</span></div><section class="clinical-result-section"><div class="clinical-result-heading"><div><span class="clinical-result-icon">✚</span><div><h4>Reported conditions</h4><p>Patient counts linked to each condition</p></div></div><button type="button" class="clinical-add" data-add-row="disease-table">＋ Add condition</button></div><div class="clinical-table-wrap"><table class="clinical-table"><thead><tr><th>Condition</th><th>Patients</th><th>Count status</th><th></th></tr></thead><tbody>${d||'<tr><td colspan="4" class="clinical-empty">No condition recognised. Add one manually.</td></tr>'}</tbody></table></div></section><section class="clinical-result-section"><div class="clinical-result-heading"><div><span class="clinical-result-icon">Rx</span><div><h4>Medicine stock</h4><p>Medicine names and reported quantities</p></div></div><button type="button" class="clinical-add" data-add-row="medicine-table">＋ Add medicine</button></div><div class="clinical-table-wrap"><table class="clinical-table medicine-table"><thead><tr><th>Medicine</th><th>Quantity</th><th>Unit</th><th>Stock status</th><th></th></tr></thead><tbody>${m||'<tr><td colspan="5" class="clinical-empty">No medicine recognised. Add one manually.</td></tr>'}</tbody></table></div></section><details class="clinical-source"><summary>Original field report · show source text</summary><p>${escapeHtml(sourceItem?.value||state.rawReport)}</p></details>`;
  extractionList.querySelectorAll('.clinical-edit-input').forEach(el=>el.addEventListener('change',()=>{const item=state.draft.find(x=>x.id===el.dataset.table),row=item?.rows?.[Number(el.dataset.row)];if(!row)return;row[el.dataset.key]=el.value;if(el.dataset.key==='patients')row.countStatus=el.value?'Worker corrected · verify':'Not stated · clarify';if(el.dataset.key==='quantity'||el.dataset.key==='unit')row.stockStatus=el.value?'Worker corrected · verify':'Quantity not stated · clarify';item.value=JSON.stringify(item.rows);saveState();}));
  extractionList.querySelectorAll('[data-add-row]').forEach(btn=>btn.addEventListener('click',()=>{const item=state.draft.find(x=>x.id===btn.dataset.addRow);if(!item)return;item.rows.push(item.id==='disease-table'?{name:'',patients:'',countStatus:'Not stated · clarify',sourcePhrase:'Manually added'}:{name:'',mentionedAs:'Manually added',quantity:'',unit:'',stockStatus:'Quantity not stated · clarify',sourcePhrase:'Manually added'});item.value=JSON.stringify(item.rows);saveState();renderExtraction();extractionList.querySelector(`[data-table="${item.id}"][data-row="${item.rows.length-1}"]`)?.focus();}));
  extractionList.querySelectorAll('[data-remove-table]').forEach(btn=>btn.addEventListener('click',()=>{const item=state.draft.find(x=>x.id===btn.dataset.removeTable);if(!item)return;item.rows.splice(Number(btn.dataset.removeRow),1);item.value=JSON.stringify(item.rows);saveState();renderExtraction();}));
}
function renderDraftStatus() {
  draftChip.className = 'draft-chip';
  if (!state.extracted) { draftChip.textContent = t('worker.draftAwaiting'); provisionalBanner.innerHTML = `<span class="banner-icon">i</span><div><strong>${escapeHtml(t('worker.provisionalTitle'))}</strong><span>${escapeHtml(t('worker.provisionalDesc'))}</span></div>`; verificationBar.classList.add('hidden'); return; }
  if (state.confirmed) { draftChip.textContent = t('worker.draftVerified'); draftChip.classList.add('confirmed'); provisionalBanner.innerHTML = `<span class="banner-icon">OK</span><div><strong>${escapeHtml(t('worker.provisionalVerifiedTitle'))}</strong><span>${escapeHtml(t('worker.provisionalVerified'))}</span></div>`; verificationBar.classList.add('hidden'); return; }
  draftChip.textContent = t('worker.draftNeedsVerify'); draftChip.classList.add('ready'); provisionalBanner.innerHTML = `<button type="button" class="banner-icon" id="verification-info" aria-label="Why verification is needed" title="Why verification is needed">!</button>`; provisionalBanner.querySelector('#verification-info')?.addEventListener('click',()=>showToast('Please verify the extracted names and counts against the original report.')); verificationBar.classList.remove('hidden'); feedback.textContent = '';
}

function validationForDraft() { return state.draft.filter(item => item.confidence === 'review' && (!item.value.trim() || item.id === 'symptoms' && item.value === t('draft.symptomsUnclear') || item.id !== 'symptoms' && item.id !== 'clinical-status' && item.value === t('draft.quantityUnclear'))); }
async function confirmReport() {
  if (!state.extracted) return showToast(t('worker.toast.extractFirst'));
  const invalid = validationForDraft();
  extractionList.querySelectorAll('.field-edit').forEach(input => input.classList.remove('invalid'));
  if (invalid.length) {
    feedback.textContent = `${t('draft.needsClarify')}: ${invalid.map(item => item.label).join(', ')}.`;
    invalid.forEach(item => document.getElementById(`field-${item.id}`)?.classList.add('invalid'));
    document.getElementById(`field-${invalid[0].id}`)?.focus();
    showToast(t('worker.toast.validate'));
    return;
  }

  const button = document.getElementById('confirm-btn');
  const persistence = window.BUSHO_REPORT_PERSISTENCE;
  const clientFactory = window.BUSHO_SUPABASE_CLIENT;
  const config = window.BUSHO_SUPABASE_CONFIG;
  if (!activeAuthUserId || !persistence || !clientFactory || !config) {
    feedback.textContent = 'Sign in with an approved BUSHO worker account before submitting this report.';
    showToast('Secure report submission is unavailable. Your draft has not been submitted.');
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  let draftCheckpointSaved = Boolean(state.reportId);
  state.syncStatus = 'saving';
  feedback.textContent = 'Saving your report securely…';
  saveState();

  try {
    const client = clientFactory.createClient(config);
    await client.requireActiveProfile(['worker']);
    const result = await persistence.persistConfirmedReport({
      client,
      reportId: state.reportId,
      originalText: state.rawReport,
      languageCode: currentLanguage(),
      draft: state.draft,
      onDraftCreated: async reportId => {
        state.reportId = reportId;
        state.syncStatus = 'draft_saved';
        persistState();
        draftCheckpointSaved = true;
      }
    });
    state.reportId = result.report.id;
    state.serverStatus = result.report.status;
    state.syncStatus = 'submitted';
    state.confirmed = true;
    renderAll();
    saveState();
    document.getElementById('post-confirm')?.classList.remove('hidden');
    feedback.textContent = 'Report submitted for supervisor review. Reference: ' + state.reportId;
    showToast('Report submitted successfully for supervisor review.');
  } catch (cause) {
    state.confirmed = false;
    state.syncStatus = state.reportId ? 'draft_saved' : 'error';
    saveState();
    feedback.textContent = state.reportId && draftCheckpointSaved
      ? 'Submission not confirmed. Your saved draft is preserved; retry to continue. ' + cause.message
      : state.reportId
        ? 'A server draft was created, but this browser could not save its recovery checkpoint. Keep this tab open and retry before leaving. ' + cause.message
        : 'Report not submitted. No saved report ID was returned. ' + cause.message;
    showToast('Report not submitted. Please review the message and retry.');
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}
function editFields() { if (!state.extracted) return; const first=extractionList.querySelector('.clinical-edit-input'); first?.focus(); first?.select(); if(first) first.scrollIntoView({behavior:'smooth',block:'center'}); else showToast('Use Add condition or Add medicine to enter a missing item.'); }
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
document.getElementById('reset-demo').addEventListener('click', () => { try { if (activeAuthUserId) window.localStorage.removeItem(STORAGE_PREFIX + activeAuthUserId); } catch {} state = initialState(); closeInventory(); renderAll(); showToast(t('footer.reset')); });
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
    if (event.error === 'no-speech') { isStopping = false; return; }
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

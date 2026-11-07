(function () {
  'use strict';

  const locales = {
    en: {
      // Header
      'app.name': 'BUSHO',
      'app.tagline': 'Bottom-Up Smart Health Orchestrator',
      'nav.howItWorks': 'How it works',
      'nav.tryDemo': 'Try the demo',
      'nav.safety': 'Safety',
      'header.demoBadge': 'Demo: synthetic data',
      'header.langLabel': 'Language',

      // Hero
      'hero.headline': 'Health workers report in their own words. BUSHO helps the right people act, safely.',
      'hero.subtext': 'Reports travel slowly by calls and registers. BUSHO turns a field note into a verified draft the worker confirms, so a supervisor can act.',
      'hero.tryDemo': 'Try the demo',
      'hero.seeHow': 'See how it works',
      'hero.trust1': 'A person confirms every record',
      'hero.trust2': 'No diagnosis',
      'hero.trust3': 'Synthetic demo data',

      // How it works
      'how.title': 'How it works',
      'how.step1.title': 'Report',
      'how.step1.by': 'Health worker',
      'how.step1.desc': 'Writes or speaks a short field update in their own words.',
      'how.step2.title': 'Draft',
      'how.step2.by': 'BUSHO suggests',
      'how.step2.desc': 'AI creates a structured draft from the free-text note.',
      'how.step3.title': 'Confirm',
      'how.step3.by': 'Health worker',
      'how.step3.desc': 'Worker reviews each field and confirms the record.',
      'how.step4.title': 'Act',
      'how.step4.by': 'Supervisor',
      'how.step4.desc': 'Verified signal informs a replenishment draft for approval.',

      // Worker console
      'worker.title': 'Health worker',
      'worker.subtitle': 'Speak naturally. Review what BUSHO understood before you confirm.',
      'worker.step1': 'Step 1 of 2: Report',
      'worker.step2': 'Step 2 of 2: Review & confirm',
      'worker.step3': 'Review and confirm',
      'worker.sendUpdate': 'Send a field update',
      'worker.channel': 'Text / Voice',
      'worker.placeholder': 'Describe what you saw today: symptoms, counts, stock levels...',
      'worker.voiceBtn': 'Voice input (demo)',
      'worker.voiceNote': 'Voice transcription is simulated in this prototype',
      'worker.tryExample': 'Try an example',
      'worker.sample.routine': 'Routine report',
      'worker.sample.ambiguous': 'Ambiguous report',
      'worker.extractBtn': 'Extract report',
      'worker.privacy': 'Do not enter patient names, phone numbers or diagnoses. Report only aggregated, non-identifying information.',
      'worker.draftTitle': 'What BUSHO heard',
      'worker.draftAwaiting': 'Awaiting extraction',
      'worker.draftNeedsVerify': 'Needs verification',
      'worker.draftVerified': 'Verified by worker',
      'worker.provisional': 'Automatically extracted information is provisional. Review each field. Nothing is submitted until you confirm.',
      'worker.provisionalFlagged': 'Provisional draft needs human verification. Flagged fields must be clarified before the record can be confirmed.',
      'worker.provisionalVerified': 'Report saved to BUSHO and submitted for supervisor review.',
      'worker.confidenceKey': 'High confidence · Needs review',
      'worker.engineLabel': 'Mock extraction engine · Schema validated',
      'worker.verifyPrompt': 'Does this look right for today\'s report?',
      'worker.verifyNote': 'Confirmation submits this report to your assigned supervisor for review. BUSHO does not diagnose.',
      'worker.editBtn': 'Edit fields',
      'worker.confirmBtn': 'Confirm report',
      'worker.seeSupervisor': 'See what the supervisor sees',
      'worker.toast.routine': 'Routine sample loaded',
      'worker.toast.ambiguous': 'Ambiguous sample loaded',
      'worker.toast.extract': 'Draft created. Review before confirming',
      'worker.toast.extractAmbiguous': 'Draft created. Clarify the flagged fields',
      'worker.toast.empty': 'Enter a field report before extracting',
      'worker.toast.confirm': 'Report submitted for supervisor review.',
      'worker.toast.edit': 'Review the extracted fields, then confirm the corrected draft',
      'worker.toast.validate': 'Some extracted fields still need clarification',
      'worker.toast.voice': 'Voice input uses your browser\'s speech recognition service, which may send audio to the browser vendor. BUSHO does not store audio. Don\'t say names, phone numbers or diagnoses.',
      'voice.demo': 'Voice input (demo)',
      'voice.listening': 'Listening...',
      'voice.transcribed': 'Transcript added',
      'voice.stop': 'Stop recording',
      'voice.unsupported': 'Speech recognition not supported in this browser. Please type your report.',
      'voice.notAllowed': 'Microphone access denied. Please allow microphone access or type your report.',
      'voice.audioCapture': 'Microphone error. Please check your microphone and try again.',
      'voice.noSpeech': 'No speech detected. Please try again or type your report.',
      'voice.error': 'Recognition error.',
      'voice.startFailed': 'Could not start voice recognition.',


      // Draft field labels
      'draft.symptoms': 'Reported symptoms',
      'draft.orsStock': 'Remaining stock / ORS',
      'draft.ifaStock': 'Remaining stock / Iron and folic acid',
      'draft.clinicalStatus': 'Clinical status',
      'draft.clinicalValue': 'Reported trend only; no diagnosis',
      'draft.source': 'Extracted from the report',
      'draft.confidence.high': 'High confidence',
      'draft.confidence.review': 'Needs review',
      'draft.confidence.workerChecked': 'Worker checked',
      'draft.needsClarify': 'Clarify before confirmation',
      'draft.quantityNeeded': 'Quantity needed',
      'draft.safeByDesign': 'Safe by design',

      // Supervisor view
      'supervisor.title': 'Supervisor',
      'supervisor.subtitle': 'Respond to verified stock signals with clear context and human approval.',
      'supervisor.priorityLabel': 'PRIORITY REVIEW',
      'supervisor.priorityTitle': 'Reported fever signal at Rampur HWC',
      'supervisor.priorityTrend': '+38% mentions / health trend only',
      'supervisor.priorityState': 'Needs review',
      'supervisor.metric.reports': 'Reports received',
      'supervisor.metric.pending': 'Awaiting confirmation',
      'supervisor.metric.lowStock': 'Low-stock medicines',
      'supervisor.metric.stockout': 'Potential stockout',
      'supervisor.metric.trend.positive': 'Includes current verified report',
      'supervisor.metric.trend.baseline': 'Synthetic baseline',
      'supervisor.metric.trend.warning': 'Needs worker review',
      'supervisor.metric.trend.allReviewed': 'All current reports reviewed',
      'supervisor.metric.trend.critical': 'At Rampur HWC',
      'supervisor.metric.trend.stockout': 'ORS · based on reported use',
      'supervisor.trendLabel': 'HEALTH SIGNAL REVIEW',
      'supervisor.trendTitle': 'Reported symptoms in context',
      'supervisor.trendChip': 'Needs review',
      'supervisor.trendNumber': 'Fever mentions at Rampur HWC',
      'supervisor.trendDesc': 'Compared with the previous 7-day reporting period',
      'supervisor.chartLabel': '7 days ago',
      'supervisor.chartToday': 'Today',
      'supervisor.safetyCallout': 'Reported health trend. This is a signal for human review. It does not confirm a medical event or outbreak.',
      'supervisor.inventoryLabel': 'INVENTORY INTELLIGENCE',
      'supervisor.inventoryTitle': 'Stock that needs attention',
      'supervisor.viewAll': 'View all',
      'supervisor.inventory.ors': 'ORS packets',
      'supervisor.inventory.ifa': 'Iron and folic acid',
      'supervisor.inventory.zinc': 'Zinc tablets',
      'supervisor.inventory.healthy': 'Healthy',
      'supervisor.inventory.needsAttention': 'Needs attention',
      'supervisor.severity.critical': 'Critical',
      'supervisor.severity.warning': 'Low',
      'supervisor.severity.safe': 'Healthy',
      'supervisor.responseTitle': 'Verified report available for admin review',
      'supervisor.responseCopy': 'Open inventory and choose a low-stock item to create a replenishment draft. No purchase order is created by this demo.',
      'supervisor.responseTitleDraft': 'Replenishment draft ready for approval',
      'supervisor.responseCopyDraft': '{name} / proposed replenishment to {qty} {unit}. Source: {source}.',
      'supervisor.responseTitleApproved': 'Replenishment draft approved in demo',
      'supervisor.responseCopyApproved': '{name} / proposed replenishment quantity recorded for review. No purchase order was placed.',
      'supervisor.statusAwaiting': 'Awaiting admin action',
      'supervisor.statusPending': 'Pending approval',
      'supervisor.statusApproved': 'Approved in demo',
      'supervisor.approveBtn': 'Approve draft',
      'supervisor.approvedBtn': 'Draft approved',
      'supervisor.drawerTitle': 'Inventory detail',
      'supervisor.drawerNote': 'Demo inventory only. Drafting an item prepares an approval record; it does not place an order.',
      'supervisor.drawerDraftBtn': 'Draft replenishment',
      'supervisor.drawerNoAction': 'No action needed',
      'supervisor.toast.draftCreated': '{name} replenishment draft created for admin approval',
      'supervisor.toast.approved': 'Draft marked approved in demo. No purchase order was placed',
      'supervisor.toast.confirmed': 'Admin view shows one signal awaiting worker confirmation',

      // Safety
      'safety.title': 'Built-in guardrails',
      'safety.subtitle': 'Clear states make the product trustworthy.',
      'safety.desc': 'BUSHO shows the worker report, the human verification step, and the administrator response as separate records.',
      'safety.state1.label': 'STATE 01',
      'safety.state1.pill': 'Unverified',
      'safety.state1.title': 'Reported health trend',
      'safety.state1.desc': 'A field signal for review, with its source and context attached.',
      'safety.state1.footer': 'Source: anonymized worker reports',
      'safety.state2.label': 'STATE 02',
      'safety.state2.pill': 'Requires evidence',
      'safety.state2.title': 'Confirmed medical event',
      'safety.state2.desc': 'A clinical conclusion requires an authorized review process. BUSHO keeps that decision outside the extraction flow.',
      'safety.state2.footer': 'Clinical review remains human-led',
      'safety.state3.label': 'STATE 03',
      'safety.state3.pill': 'Requires approval',
      'safety.state3.title': 'Administrative action',
      'safety.state3.desc': 'Inventory responses can be drafted from verified stock data. An authorized administrator approves the request.',
      'safety.state3.footer': 'Draft request, pending approval',

      // Footer
      'footer.event': 'Hack for Social Cause, VBYLD 2027',
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'footer.reset': 'Reset demo data',
      'footer.prototype': 'Prototype: not for real patient data',
      'footer.aiNote': 'Translations were AI-drafted and need native-speaker review before any real pilot.',

      // Sample reports
      'sample.routine': 'Today we saw 12 patients with fever and 8 with diarrhea. We have only 20 ORS packets left, and our iron tablets are almost finished.',
      'sample.ambiguous': 'A few fever cases today. ORS is almost finished.',

      // Glossary
      'glossary.hwc': 'Health & Wellness Centre',
      'glossary.cho': 'Community Health Officer',
      'glossary.ors': 'Oral rehydration salts',

      // Units
      'unit.packets': 'packets',
      'unit.strips': 'strips',
      'unit.tablets': 'tablets',
      'worker.draft': 'Draft',
      'worker.emptyTitle': 'Run the demo to create a review draft',
      'worker.emptyDesc': 'Fields stay provisional until you confirm them.',
      'worker.provisionalTitle': 'Draft information is provisional',
      'worker.provisionalDesc': 'Review each field. Nothing is committed until you confirm.',
      'worker.provisionalFlaggedTitle': 'Draft needs human verification',
      'worker.provisionalVerifiedTitle': 'Report submitted for supervisor review',
      'worker.emptyReport': 'No report entered yet.',
      'worker.toast.save': 'Could not save the local recovery draft. Keep this tab open.',
      'worker.toast.extractFirst': 'Extract a draft before confirming',
      'draft.symptomsValue': 'Fever: {fever} mentions; diarrhea: {diarrhea} mentions',
      'draft.symptomsUnclear': 'Symptoms mentioned; count unclear',
      'draft.quantityUnclear': 'Quantity not stated',
      'draft.almostFinished': 'Almost finished',
      'supervisor.sourceVerified': 'verified worker report',
      'supervisor.sourceSynthetic': 'synthetic inventory snapshot',
      'ui.skipLink': 'Skip to main content',
      'ui.mainNavigation': 'Main navigation',
      'ui.languageSelection': 'Language selection',
      'ui.selectLanguage': 'Select language',
      'ui.trustIndicators': 'Trust indicators',
      'ui.switchView': 'Switch view',
      'ui.progress': 'Progress: Step 1 of 3',
      'ui.verification': 'Verification',
      'ui.priorityAlert': 'Priority alert',
      'ui.keyMetrics': 'Key metrics',
      'ui.medicineStock': 'Medicine stock',
      'ui.closeInventory': 'Close inventory',
      'ui.chartAlt': 'Fever mentions trend over 7 days. Day 1: 31%, Day 2: 38%, Day 3: 27%, Day 4: 48%, Day 5: 45%, Day 6: 64%, Day 7 (Today): 84%',
      'ui.chartLegend': 'Chart legend',
      'ui.facility': 'Rampur HWC',
      'ui.location': 'Rampur block / Synthetic demo data',
      'ui.inventoryRecent': 'Rampur HWC / reported 2m ago',
      'ui.inventoryYesterday': 'Rampur HWC / local demo state, yesterday',
      'mock.fieldNote': 'Today we saw 12 patients with fever and 8 with diarrhea. We have only 20 ORS packets left, and our iron tablets are almost finished.',
      'mock.time': '10:42 AM',
      'mock.symptomsLabel': 'Symptoms',
      'mock.symptomsValue': 'Fever: 12; Diarrhea: 8',
      'mock.orsLabel': 'ORS',
      'mock.orsValue': '20 packets',
      'mock.ironLabel': 'Iron',
      'mock.ironValue': 'Almost finished',
      'mock.verified': 'Verified',
      'chart.legendReported': 'Reported trend',
      'chart.legendToday': 'Today',
      'voice.seconds': '{seconds}s',
    },
    hi: {

      'nav.howItWorks': 'यह कैसे काम करता है', 'nav.tryDemo': 'डेमो आज़माएँ', 'nav.safety': 'सुरक्षा',
      'header.demoBadge': 'डेमो: कृत्रिम डेटा', 'header.langLabel': 'भाषा',
      'hero.headline': 'स्वास्थ्य कर्मी अपनी भाषा में रिपोर्ट करते हैं। BUSHO सही लोगों को सुरक्षित रूप से कार्य करने में मदद करता है।',
      'hero.subtext': 'रिपोर्ट कॉल और रजिस्टर से धीरे चलती हैं। BUSHO एक क्षेत्र नोट को सत्यापित ड्राफ्ट में बदलता है।',
      'hero.tryDemo': 'डेमो आज़माएँ', 'hero.seeHow': 'कैसे काम करता है',
      'hero.trust1': 'हर रिकॉर्ड की मानव पुष्टि', 'hero.trust2': 'कोई निदान नहीं', 'hero.trust3': 'कृत्रिम डेमो डेटा',
      'how.title': 'यह कैसे काम करता है', 'how.step1.title': 'रिपोर्ट', 'how.step2.title': 'ड्राफ्ट', 'how.step3.title': 'पुष्टि', 'how.step4.title': 'कार्य',
      'how.step1.desc': 'अपने शब्दों में एक छोटा क्षेत्र अपडेट लिखता या बोलता है।', 'how.step2.desc': 'AI फ्री-टेक्स्ट नोट से संरचित ड्राफ्ट बनाता है।', 'how.step3.desc': 'कर्मी हर क्षेत्र की समीक्षा करता है और रिकॉर्ड की पुष्टि करता है।', 'how.step4.desc': 'सत्यापित संकेत पुनर्पूर्ति ड्राफ्ट के लिए जानकारी देता है।',
      'how.step1.by': 'स्वास्थ्य कर्मी', 'how.step2.by': 'BUSHO सुझाव', 'how.step3.by': 'स्वास्थ्य कर्मी', 'how.step4.by': 'पर्यवेक्षक',
      'worker.title': 'स्वास्थ्य कर्मी', 'supervisor.title': 'पर्यवेक्षक', 'safety.title': 'सुरक्षा गार्डरेल',
      'footer.event': 'हैक फॉर सोशल कॉज, VBYLD 2027', 'footer.terms': 'शर्तें', 'footer.privacy': 'गोपनीयता',
      'footer.reset': 'डेमो डेटा रीसेट', 'footer.prototype': 'प्रोटोटाइप: वास्तविक रोगी डेटा के लिए नहीं',
      'sample.routine': 'आज हमने 12 बुखार और 8 दस्त के मरीज देखे। ORS पैकेट केवल 20 बचे हैं और आयरन की गोलियाँ लगभग खत्म हैं।', 'sample.ambiguous': 'आज कुछ बुखार के मामले। ORS लगभग खत्म।',
      'glossary.hwc': 'स्वास्थ्य और कल्याण केंद्र', 'glossary.cho': 'सामुदायिक स्वास्थ्य अधिकारी', 'glossary.ors': 'मौखिक पुनर्जलीकरण लवण',
      'unit.packets': 'पैकेट', 'unit.strips': 'स्ट्रिप्स', 'unit.tablets': 'गोलियाँ',
      'voice.toast.voice': 'वॉइस इनपुट आपके ब्राउज़र की स्पीच रेकग्निशन सेवा का उपयोग करता है, जो ऑडियो को ब्राउज़र विक्रेता को भेज सकता है। BUSHO ऑडियो स्टोर नहीं करता। नाम, फोन नंबर या निदान न बोलें।',
    },
    ta: {
      'app.name': 'BUSHO', 'app.tagline': 'பாட்டம்-அப் ஸ்மார்ட் ஹெல்த் ஆர்கஸ்ட்ரேட்டர்',
      'nav.howItWorks': 'எப்படி வேலை செய்கிறது', 'nav.tryDemo': 'டெமோ முயற்சிக்கவும்', 'nav.safety': 'பாதுகாப்பு',
      'header.demoBadge': 'டெமோ: செயற்கை தரவு', 'header.langLabel': 'மொழி',
      'hero.headline': 'சுகாதார பணியாளர்கள் தங்கள் சொந்த வார்த்தைகளில் அறிக்கை செய்கிறார்கள். BUSHO பாதுகாப்பாக சரியான நபர்களை செயல்படுத்த உதவுகிறது.',
      'hero.subtext': 'அறிக்கைகள் அழைப்புகள் மற்றும் பதிவேடுகள் மூலம் மெதுவாக பயணிக்கின்றன.',
      'hero.tryDemo': 'டெமோ முயற்சிக்கவும்', 'hero.seeHow': 'எப்படி வேலை செய்கிறது',
      'hero.trust1': 'ஒவ்வொரு பதிவும் மனித உறுதி', 'hero.trust2': 'நோய் கண்டறிதல் இல்லை', 'hero.trust3': 'செயற்கை டெமோ தரவு',
      'how.title': 'எப்படி வேலை செய்கிறது',
      'how.step1.title': 'அறிக்கை', 'how.step2.title': 'வரைவு', 'how.step3.title': 'உறுதி', 'how.step4.title': 'செயல்',
      'how.step1.by': 'சுகாதார பணியாளர்', 'how.step2.by': 'BUSHO பரிந்துரை', 'how.step3.by': 'சுகாதார பணியாளர்', 'how.step4.by': 'மேற்பார்வையாளர்',
      'worker.title': 'சுகாதார பணியாளர்', 'supervisor.title': 'மேற்பார்வையாளர்', 'safety.title': 'பாதுகாப்பு',
      'footer.event': 'சமூக நன்மைக்கான ஹேக், VBYLD 2027', 'footer.terms': 'விதிமுறைகள்', 'footer.privacy': 'தனியுரிமை',
      'footer.reset': 'டெமோ தரவை மீட்டமை', 'footer.prototype': 'முன்மாதிரி: உண்மையான நோயாளி தரவுக்காக அல்ல',
      'sample.routine': 'இன்று 12 காய்ச்சல் மற்றும் 8 வயிற்றுப்போக்கு நோயாளிகள். ORS பாக்கெட்டுகள் 20 மட்டுமே உள்ளன, இரும்பு மாத்திரைகள் கிட்டத்தட்ட முடிந்துவிட்டன.', 'sample.ambiguous': 'இன்று சில காய்ச்சல். ORS கிட்டத்தட்ட முடிந்துவிட்டது.',
      'glossary.hwc': 'சுகாதாரம் மற்றும் நல்வாழ்வு மையம்', 'glossary.cho': 'சமூக சுகாதார அதிகாரி', 'glossary.ors': 'வாய் தண்ணீர் உப்புகள்',
      'unit.packets': 'பாக்கெட்டுகள்', 'unit.strips': 'தடவுகள்', 'unit.tablets': 'மாத்திரைகள்',
    },
    te: {
      'app.name': 'BUSHO', 'app.tagline': 'బాటమ్-అప్ స్మార్ట్ హెల్త్ ఆర్కెస్ట్రేటర్',
      'nav.howItWorks': 'ఎలా పనిచేస్తుంది', 'nav.tryDemo': 'డెమో ప్రయత్నించండి', 'nav.safety': 'భద్రత',
      'header.demoBadge': 'డెమో: కృత్రిమ డేటా', 'header.langLabel': 'భాష',
      'hero.headline': 'ఆరోగ్య కార్మికులు తమ స్వంత పదాలతో నివేదిస్తారు. BUSHO సురక్షితంగా సరైన వ్యక్తులను చర్య తీసుకోవడంలో సహాయపడుతుంది.',
      'hero.subtext': 'నివేదికలు కాల్స్ మరియు రిజిస్టర్‌ల ద్వారా నెమ్మదిగా ప్రయాణిస్తాయి.',
      'hero.tryDemo': 'డెమో ప్రయత్నించండి', 'hero.seeHow': 'ఎలా పనిచేస్తుంది',
      'hero.trust1': 'ప్రతి రికార్డూ మానవ నిర్ధారణ', 'hero.trust2': 'రోగనిర్ధారణ లేదు', 'hero.trust3': 'కృత్రిమ డెమో డేటా',
      'how.title': 'ఎలా పనిచేస్తుంది',
      'how.step1.title': 'నివేదిక', 'how.step2.title': 'డ్రాఫ్ట్', 'how.step3.title': 'నిర్ధారణ', 'how.step4.title': 'చర్య',
      'how.step1.by': 'ఆరోగ్య కార్మికుడు', 'how.step2.by': 'BUSHO సలహా', 'how.step3.by': 'ఆరోగ్య కార్మికుడు', 'how.step4.by': 'సూపర్‌వైజర్',
      'worker.title': 'ఆరోగ్య కార్మికుడు', 'supervisor.title': 'సూపర్‌వైజర్', 'safety.title': 'భద్రత',
      'footer.event': 'హ్యాక్ ఫర్ సోషల్ కాజ్, VBYLD 2027', 'footer.terms': 'నిబంధనలు', 'footer.privacy': 'గోప్యత',
      'footer.reset': 'డెమో డేటాను రీసెట్ చేయండి', 'footer.prototype': 'ప్రోటోటైప్: నిజమైన రోగి డేటా కోసం కాదు',
      'sample.routine': 'నేటి రోజున 12 జ్వరం మరియు 8 విరేచనాలు. ORS ప్యాకెట్లు 20 మాత్రమే మిగిలి ఉన్నాయి, ఇనుము మాత్రలు దాదాపు ముగిశాయి.', 'sample.ambiguous': 'నేటి రోజున కొన్ని జ్వరం కేసులు. ORS దాదాపు ముగిసింది.',
      'glossary.hwc': 'ఆరోగ్యం మరియు క్షేమ కేంద్రం', 'glossary.cho': 'సమాజ ఆరోగ్య అధికారి', 'glossary.ors': 'నోటి పునర్జలీకరణ లవణాలు',
      'unit.packets': 'ప్యాకెట్లులు', 'unit.strips': 'స్ట్రిప్స్', 'unit.tablets': 'టాబ్లెట్లు',
    },
    bn: {
      'app.name': 'BUSHO', 'app.tagline': 'বটম-আপ স্মার্ট হেলথ অর্কেস্ট্রেটর',
      'nav.howItWorks': 'কাজ করে কীভাবে', 'nav.tryDemo': 'ডেমো চেষ্টা করুন', 'nav.safety': 'সুরক্ষা',
      'header.demoBadge': 'ডেমো: কৃত্রিম ডেটা', 'header.langLabel': 'ভাষা',
      'hero.headline': 'স্বাস্থ্য কর্মীরা তাদের নিজস্ব ভাষায় রিপোর্ট করে। BUSHO নিরাপদে সঠিক ব্যক্তিদের কাজ করতে সাহায্য করে।',
      'hero.subtext': 'রিপোর্ট কল এবং রেজিস্টার দিয়ে ধীরে ভ্রমণ করে।',
      'hero.tryDemo': 'ডেমো চেষ্টা করুন', 'hero.seeHow': 'কাজ করে কীভাবে',
      'hero.trust1': 'প্রতিটি রেকর্ড মানব যাচাই', 'hero.trust2': 'কোনো রোগ নির্ণয় নয়', 'hero.trust3': 'কৃত্রিম ডেমো ডেটা',
      'how.title': 'কাজ করে কীভাবে', 'how.step1.title': 'রিপোর্ট', 'how.step2.title': 'খসড়া', 'how.step3.title': 'যাচাই', 'how.step4.title': 'প্রতিক্রিয়া',
      'how.step1.by': 'স্বাস্থ্য কর্মী', 'how.step2.by': 'BUSHO পরামর্শ', 'how.step3.by': 'স্বাস্থ্য কর্মী', 'how.step4.by': 'তত্ত্বাবধায়ক',
      'worker.title': 'স্বাস্থ্য কর্মী', 'supervisor.title': 'তত্ত্বাবধায়ক', 'safety.title': 'সুরক্ষা',
      'footer.event': 'হ্যাক ফর সোশ্যাল কজ, VBYLD 2027', 'footer.terms': 'শর্তাবলী', 'footer.privacy': 'গোপনীয়তা',
      'footer.reset': 'ডেমো ডেটা রিসেট', 'footer.prototype': 'প্রোটোটাইপ: বাস্তব রুগীর ডেটা নয়',
      'sample.routine': 'আজ ১২ জ্বর এবং ৮ ডায়রিয়া। ORS প্যাকেট মাত্র ২০ বাকি আছে, আর আয়রনের ট্যাবলেট প্রায় শেষ।', 'sample.ambiguous': 'আজ কিছু জ্বর। ORS প্রায় শেষ।',
      'glossary.hwc': 'স্বাস্থ্য ও কল্যাণ কেন্দ্র', 'glossary.cho': 'কমিউনিটি স্বাস্থ্য কর্মকর্তা', 'glossary.ors': 'ওরাল রিহাইড্রেশন সল্ট',
      'unit.packets': 'প্যাকেট', 'unit.strips': 'স্ট্রিপ', 'unit.tablets': 'ট্যাবলেট',
    },
    mr: {
      'app.tagline': 'तळापासून वरपर्यंत स्मार्ट आरोग्य समन्वयक', 'worker.title': 'आरोग्य कार्यकर्ता', 'how.step1.by': 'आरोग्य कार्यकर्ता', 'how.step3.by': 'आरोग्य कार्यकर्ता', 'how.step4.by': 'पर्यवेक्षक', 'sample.routine': 'आज १२ ताप आणि ८ जुलाबाचे रुग्ण दिसले। ORS ची फक्त २० पाकिटे उरली आहेत आणि लोहाच्या गोळ्या जवळजवळ संपल्या आहेत।', 'sample.ambiguous': 'आज काही तापाची प्रकरणे आहेत। ORS जवळजवळ संपले आहे।',
      'app.name': 'BUSHO', 'app.tagline': 'बॉटम-अप स्मार्ट हेल्थ ऑर्केस्ट्रेटर',
      'nav.howItWorks': 'हे कसे कार्य करते', 'nav.tryDemo': 'डेमो प्रयत्न करा', 'nav.safety': 'सुरक्षा',
      'header.demoBadge': 'डेमो: कृत्रिम डेटा', 'header.langLabel': 'भाषा',
      'hero.headline': 'आरोग्य कर्मी त्यांच्या स्वतःच्या शब्दांत अहवाल देतात. BUSHO सुरक्षितपणे योग्य लोकांना कारवाई करण्यास मदत करते.',
      'hero.subtext': 'अहवाल कॉल आणि रजिस्टरद्वारे हळूहळू प्रवास करतात.',
      'hero.tryDemo': 'डेमो प्रयत्न करा', 'hero.seeHow': 'हे कसे कार्य करते',
      'hero.trust1': 'प्रत्येक रेकॉर्ड मानवी खात्री', 'hero.trust2': 'निदान नाही', 'hero.trust3': 'कृत्रिम डेमो डेटा',
      'how.title': 'हे कसे कार्य करते', 'how.step1.title': 'अहवाल', 'how.step2.title': 'मसुदा', 'how.step3.title': 'पुष्टी', 'how.step4.title': 'कार्य',
      'how.step1.by': 'आरोग्य कर्मी', 'how.step2.by': 'BUSHO सूचना', 'how.step3.by': 'आरोग्य कर्मी', 'how.step4.by': 'पर्यवेक्षक',
      'worker.title': 'आरोग्य कर्मी', 'supervisor.title': 'पर्यवेक्षक', 'safety.title': 'सुरक्षा',
      'footer.event': 'हॅक फॉर सोशल कॉज, VBYLD 2027', 'footer.terms': 'अटी', 'footer.privacy': 'गोपनीयता',
      'footer.reset': 'डेमो डेटा रीसेट', 'footer.prototype': 'प्रोटोटाइप: वास्तविक रुग्ण डेटा नाही',
      'sample.routine': 'आज १२ ताप आणि ८ अतिसार. ORS पॅकेट्स केवळ २० राहिले आहेत, आणि लोहाच्या गोळ्या जवळजवळ संपल्या आहेत.', 'sample.ambiguous': 'आज काही ताप प्रकरणे. ORS जवळजवळ संपले.',
      'glossary.hwc': 'आरोग्य आणि कल्याण केंद्र', 'glossary.cho': 'समुदाय आरोग्य अधिकारी', 'glossary.ors': 'तोंडी पुनर्जलीकरण मीठ',
      'unit.packets': 'पॅकेट्स', 'unit.strips': 'स्ट्रिप्स', 'unit.tablets': 'गोळ्या',
      'voice.toast.voice': 'व्हॉइस इनपुट तुमच्या ब्राउझरची स्पीच रेकग्निशन सेवा वापरते, जी ऑडियो ब्राउझर विक्रेत्याकडे पाठवू शकते. BUSHO ऑडियो साठवत नाही. नावे, फोन नंबर किंवा निदान बोलू नका.',
    },
    ta: {
      'app.name': 'BUSHO', 'app.tagline': 'கீழ்மட்டத்திலிருந்து மேல்மட்டம் வரை ஸ்மார்ட் சுகாதார ஒருங்கிணைப்பாளர்', 'nav.howItWorks': 'எப்படி செயல்படுகிறது', 'nav.tryDemo': 'டெமோ முயற்சி', 'nav.safety': 'பாதுகாப்பு', 'header.demoBadge': 'டெமோ: செயற்கைத் தரவு', 'header.langLabel': 'மொழி', 'hero.headline': 'சுகாதாரப் பணியாளர்கள் தங்கள் சொந்த வார்த்தைகளில் அறிக்கை தருகிறார்கள்। BUSHO சரியானவர்கள் பாதுகாப்பாகச் செயல்பட உதவுகிறது।', 'hero.subtext': 'அழைப்புகள் மற்றும் பதிவேடுகள் மூலம் அறிக்கைகள் மெதுவாகச் செல்கின்றன। BUSHO களக் குறிப்பை பணியாளர் உறுதி செய்யும் சரிபார்க்கப்பட்ட வரைவாக மாற்றுகிறது।', 'hero.tryDemo': 'டெமோ முயற்சி', 'hero.seeHow': 'எப்படி செயல்படுகிறது', 'hero.trust1': 'ஒவ்வொரு பதிவையும் ஒருவர் உறுதி செய்கிறார்', 'hero.trust2': 'நோய் கண்டறிதல் இல்லை', 'hero.trust3': 'செயற்கை டெமோ தரவு', 'how.title': 'எப்படி செயல்படுகிறது', 'how.step1.title': 'அறிக்கை', 'how.step2.title': 'வரைவு', 'how.step2.by': 'BUSHO பரிந்துரை', 'how.step3.title': 'உறுதி', 'how.step4.title': 'செயல்', 'supervisor.title': 'மேற்பார்வையாளர்', 'safety.title': 'பாதுகாப்பு வரம்புகள்', 'footer.event': 'சமூக நலனுக்கான ஹேக், VBYLD 2027', 'footer.terms': 'விதிமுறைகள்', 'footer.privacy': 'தனியுரிமை', 'footer.reset': 'டெமோ தரவை மீட்டமை', 'footer.prototype': 'முன்மாதிரி: உண்மையான நோயாளி தரவுக்காக அல்ல', 'glossary.hwc': 'சுகாதாரம் மற்றும் நல்வாழ்வு மையம்', 'glossary.cho': 'சமூக சுகாதார அதிகாரி', 'glossary.ors': 'வாய்வழி நீரேற்ற உப்புகள்', 'unit.packets': 'பாக்கெட்டுகள்', 'unit.strips': 'ஸ்ட்ரிப்புகள்', 'unit.tablets': 'மாத்திரைகள்', 'worker.title': 'சுகாதாரப் பணியாளர்', 'how.step1.by': 'சுகாதாரப் பணியாளர்', 'how.step3.by': 'சுகாதாரப் பணியாளர்', 'how.step4.by': 'மேற்பார்வையாளர்', 'sample.routine': 'இன்று ௧௨ காய்ச்சல் மற்றும் ௮ வயிற்றுப்போக்கு நோயாளிகள்। ORS பாக்கெட்டுகள் ௨௦ மட்டுமே உள்ளன; இரும்பு மாத்திரைகள் கிட்டத்தட்ட முடிந்துவிட்டன।', 'sample.ambiguous': 'இன்று சில காய்ச்சல்। ORS கிட்டத்தட்ட முடிந்துவிட்டது।',
      'how.step1.desc': 'சுகாதாரப் பணியாளர் தன் சொற்களில் ஒரு சிறிய களப் புதுப்பிப்பை எழுதுகிறார் அல்லது சொல்கிறார்।', 'how.step2.desc': 'BUSHO எளிய குறிப்பிலிருந்து பார்க்கக்கூடிய வரைவை உருவாக்குகிறது।', 'how.step3.desc': 'சுகாதாரப் பணியாளர் ஒவ்வொரு பகுதியையும் பார்த்து பதிவை உறுதி செய்கிறார்।', 'how.step4.desc': 'சரிபார்க்கப்பட்ட குறிப்பு மூலம் பொருள் நிரப்பும் வரைவு ஒப்புதலுக்குத் தயாராகிறது।',
      'worker.channel': 'உரை / குரல்', 'worker.voiceBtn': 'குரல் உள்ளீடு (டெமோ)', 'worker.voiceNote': 'இந்த முன்மாதிரியில் குரல் உள்ளீடு டெமோவாக மட்டும் உள்ளது', 'worker.tryExample': 'ஓர் உதாரணத்தை முயற்சிக்கவும்', 'worker.sample.routine': 'வழக்கமான அறிக்கை', 'worker.sample.ambiguous': 'தெளிவில்லாத அறிக்கை', 'worker.privacy': 'நோயாளிகளின் பெயர், தொலைபேசி எண் அல்லது நோயறிதலை உள்ளிட வேண்டாம். அடையாளம் தெரியாத மொத்தத் தகவல்களை மட்டும் தெரிவிக்கவும்।', 'worker.draftTitle': 'BUSHO புரிந்தது என்ன', 'worker.provisional': 'இந்தத் தகவல் தற்காலிகமானது। ஒவ்வொரு பகுதியையும் பாருங்கள்। உறுதி செய்யும் வரை எதுவும் பதிவு செய்யப்படாது।', 'worker.provisionalFlagged': 'தற்காலிக வரைவுக்கு மனித சரிபார்ப்பு தேவை। குறிக்கப்பட்ட பகுதிகள் தெளிவான பிறகே பதிவை உறுதி செய்யலாம்।', 'worker.provisionalVerified': 'அறிக்கை BUSHO-வில் சேமிக்கப்பட்டு மேற்பார்வையாளர் மதிப்பாய்விற்கு அனுப்பப்பட்டது।', 'worker.confidenceKey': 'நம்பிக்கை அதிகம் · சரிபார்ப்பு தேவை', 'worker.engineLabel': 'விதிமுறை அடிப்படையிலான டெமோ சோதனை · வடிவம் சரிபார்க்கப்பட்டது', 'worker.verifyPrompt': 'இது இன்றைய அறிக்கைக்கு சரியாக உள்ளதா?', 'worker.verifyNote': 'உறுதிப்படுத்தியதும் அறிக்கை உங்கள் மேற்பார்வையாளரின் மதிப்பாய்விற்கு அனுப்பப்படும்। BUSHO நோய் கண்டறியாது।', 'worker.seeSupervisor': 'மேற்பார்வையாளர் காண்பதைப் பாருங்கள்', 'worker.toast.edit': 'பகுதிகளைப் பார்த்து சரியான வரைவைக் குறிப்பிடுங்கள்',
      'draft.symptoms': 'தெரிவிக்கப்பட்ட அறிகுறிகள்', 'draft.orsStock': 'மீதமுள்ள இருப்பு / ORS', 'draft.ifaStock': 'மீதமுள்ள இருப்பு / இரும்பு மற்றும் ஃபோலிக் அமிலம்', 'draft.clinicalStatus': 'சுகாதார நிலை', 'draft.confidence.high': 'நம்பிக்கை அதிகம்', 'draft.confidence.review': 'சரிபார்ப்பு தேவை', 'draft.confidence.workerChecked': 'பணியாளர் சரிபார்த்தார்',
      'supervisor.subtitle': 'சரிபார்க்கப்பட்ட இருப்பு குறிப்புகளை தெளிவான சூழலுடனும் மனித ஒப்புதலுடனும் பாருங்கள்।', 'supervisor.priorityLabel': 'முக்கிய சரிபார்ப்பு', 'supervisor.priorityTitle': 'ராம்பூர் HWC-யில் காய்ச்சல் குறிப்பு', 'supervisor.priorityTrend': '+38% குறிப்பிடல்கள் / சுகாதாரப் போக்கு மட்டும்', 'supervisor.priorityState': 'சரிபார்ப்பு தேவை', 'supervisor.metric.reports': 'பெறப்பட்ட அறிக்கைகள்', 'supervisor.metric.pending': 'உறுதிக்காக காத்திருக்கிறது', 'supervisor.metric.lowStock': 'குறைந்த இருப்பு மருந்துகள்', 'supervisor.metric.stockout': 'இருப்பு தீரும் வாய்ப்பு', 'supervisor.metric.trend.positive': 'தற்போதைய சரிபார்க்கப்பட்ட அறிக்கை உள்ளது', 'supervisor.metric.trend.baseline': 'செயற்கை அடிப்படை', 'supervisor.metric.trend.warning': 'பணியாளர் சரிபார்ப்பு தேவை', 'supervisor.metric.trend.allReviewed': 'தற்போதைய அறிக்கைகள் அனைத்தும் பார்த்துவிட்டோம்', 'supervisor.metric.trend.critical': 'ராம்பூர் HWC-யில்', 'supervisor.metric.trend.stockout': 'ORS · தெரிவிக்கப்பட்ட பயன்பாட்டின் அடிப்படையில்', 'supervisor.trendLabel': 'சுகாதாரக் குறிப்பு சரிபார்ப்பு', 'supervisor.trendTitle': 'சூழலுடன் தெரிவிக்கப்பட்ட அறிகுறிகள்', 'supervisor.trendChip': 'சரிபார்ப்பு தேவை', 'supervisor.trendNumber': 'ராம்பூர் HWC-யில் காய்ச்சல் குறிப்பிடல்கள்', 'supervisor.trendDesc': 'முந்தைய ௭ நாள் அறிக்கையிடலுடன் ஒப்பீடு', 'supervisor.chartLabel': '௭ நாட்களுக்கு முன்', 'supervisor.chartToday': 'இன்று', 'supervisor.safetyCallout': 'இது தெரிவிக்கப்பட்ட சுகாதாரப் போக்கு। மனித சரிபார்ப்புக்கான குறிப்பு மட்டுமே। இதனால் நோய் அல்லது பரவல் உறுதி செய்யப்படாது।', 'supervisor.inventoryLabel': 'இருப்பு தகவல்', 'supervisor.inventoryTitle': 'கவனம் தேவைப்படும் இருப்பு', 'supervisor.viewAll': 'அனைத்தையும் பார்க்க', 'supervisor.inventory.ors': 'ORS பாக்கெட்டுகள்', 'supervisor.inventory.ifa': 'இரும்பு மற்றும் ஃபோலிக் அமிலம்', 'supervisor.inventory.zinc': 'துத்தநாக மாத்திரைகள்', 'supervisor.inventory.healthy': 'இருப்பு நன்றாக உள்ளது', 'supervisor.inventory.needsAttention': 'கவனம் தேவை', 'supervisor.severity.critical': 'மிகக் குறைவு', 'supervisor.severity.warning': 'குறைவு', 'supervisor.severity.safe': 'நன்று',
      'supervisor.responseTitle': 'சரிபார்க்கப்பட்ட அறிக்கை நிர்வாகப் பார்வைக்கு உள்ளது', 'supervisor.responseCopy': 'குறைந்த இருப்புள்ள பொருளைத் தேர்ந்தெடுத்து நிரப்பும் வரைவைக் காட்டு। இந்த டெமோ வாங்கும் ஆணை உருவாக்காது।', 'supervisor.responseTitleDraft': 'நிரப்பும் வரைவு ஒப்புதலுக்குத் தயாராக உள்ளது', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} வரை நிரப்பும் முன்மொழிவு। மூலம்: {source}।', 'supervisor.responseTitleApproved': 'டெமோவில் நிரப்பும் வரைவு ஒப்புதல் பெற்றது', 'supervisor.responseCopyApproved': '{name} / முன்மொழியப்பட்ட நிரப்பும் அளவு பார்வைக்காக பதிவு செய்யப்பட்டது। வாங்கும் ஆணை எதுவும் இடப்படவில்லை।', 'supervisor.statusAwaiting': 'நிர்வாக நடவடிக்கைக்காக காத்திருக்கிறது', 'supervisor.statusPending': 'ஒப்புதலுக்காக காத்திருக்கிறது', 'supervisor.statusApproved': 'டெமோவில் ஒப்புதல்', 'supervisor.approveBtn': 'வரைவுக்கு ஒப்புதல் அளிக்கவும்', 'supervisor.approvedBtn': 'வரைவு ஒப்புதல் பெற்றது', 'supervisor.drawerTitle': 'இருப்பு விவரம்', 'supervisor.drawerNote': 'இது டெமோ இருப்பு மட்டுமே। ஒரு பொருளின் வரைவு ஒப்புதல் பதிவைத் தயார் செய்கிறது; ஆணை இடாது।', 'supervisor.drawerDraftBtn': 'நிரப்பும் வரைவை உருவாக்கு', 'supervisor.drawerNoAction': 'நடவடிக்கை தேவையில்லை', 'supervisor.toast.draftCreated': '{name} நிரப்பும் வரைவு நிர்வாக ஒப்புதலுக்காக உருவாக்கப்பட்டது', 'supervisor.toast.approved': 'டெமோவில் வரைவு ஒப்புதல் பெற்றது। வாங்கும் ஆணை இடப்படவில்லை', 'supervisor.toast.confirmed': 'மேற்பார்வையாளர் பார்வையில் ஒரு குறிப்பு பணியாளர் உறுதிக்காக காத்திருக்கிறது',
      'safety.subtitle': 'தெளிவான நிலைகள் பொருளின் மீது நம்பிக்கையை உருவாக்குகின்றன।', 'safety.desc': 'BUSHO பணியாளர் அறிக்கை, மனித சரிபார்ப்பு மற்றும் நிர்வாக பதிலைத் தனித்தனி பதிவுகளாகக் காட்டுகிறது।', 'safety.state1.label': 'நிலை ௦௧', 'safety.state1.pill': 'சரிபார்க்கப்படவில்லை', 'safety.state1.title': 'தெரிவிக்கப்பட்ட சுகாதாரப் போக்கு', 'safety.state1.desc': 'மூலமும் சூழலும் இணைந்த மனித சரிபார்ப்புக்கான களக் குறிப்பு।', 'safety.state1.footer': 'மூலம்: அடையாளம் நீக்கப்பட்ட பணியாளர் அறிக்கைகள்', 'safety.state2.label': 'நிலை ௦௨', 'safety.state2.pill': 'ஆதாரம் தேவை', 'safety.state2.title': 'உறுதி செய்யப்பட்ட மருத்துவ நிகழ்வு', 'safety.state2.desc': 'மருத்துவ முடிவுக்கு அங்கீகரிக்கப்பட்ட சரிபார்ப்பு தேவை। BUSHO அந்த முடிவை வரைவு செயலிலிருந்து வெளியே வைத்திருக்கிறது।', 'safety.state2.footer': 'மருத்துவ சரிபார்ப்பு மனித வழிகாட்டுதலில் நடக்கும்', 'safety.state3.label': 'நிலை ௦௩', 'safety.state3.pill': 'ஒப்புதல் தேவை', 'safety.state3.title': 'நிர்வாக நடவடிக்கை', 'safety.state3.desc': 'சரிபார்க்கப்பட்ட இருப்பிலிருந்து நிரப்பும் வரைவு உருவாகலாம்। அங்கீகரிக்கப்பட்ட நிர்வாகியே கோரிக்கையை ஒப்புதல் அளிப்பார்।', 'safety.state3.footer': 'ஒப்புதலுக்காக காத்திருக்கும் வரைவு கோரிக்கை', 'footer.aiNote': 'மொழிபெயர்ப்புகள் டெமோவுக்காக உருவாக்கப்பட்டவை; உண்மையான பயன்பாட்டுக்கு முன் தாய்மொழி பேசுபவர் சரிபார்க்க வேண்டும்।',
      'worker.provisionalFlaggedTitle': 'வரைவுக்கு மனித சரிபார்ப்பு தேவை', 'worker.provisionalVerifiedTitle': 'அறிக்கை மதிப்பாய்விற்கு அனுப்பப்பட்டது', 'worker.emptyReport': 'இன்னும் அறிக்கை எழுதப்படவில்லை', 'worker.toast.save': 'உள்ளூர் மீட்பு வரைவைக் சேமிக்க முடியவில்லை. இந்தத் தாவலை திறந்தே வைத்திருங்கள்.', 'worker.toast.extractFirst': 'உறுதி செய்வதற்கு முன் வரைவை உருவாக்குங்கள்'
    },
    te: {
      'app.name': 'BUSHO', 'app.tagline': 'కిందిస్థాయి నుంచి పైస్థాయి వరకు స్మార్ట్ ఆరోగ్య సమన్వయకర్త', 'nav.howItWorks': 'ఇది ఎలా పనిచేస్తుంది', 'nav.tryDemo': 'డెమో ప్రయత్నించండి', 'nav.safety': 'భద్రత', 'header.demoBadge': 'డెమో: కృత్రిమ డేటా', 'header.langLabel': 'భాష', 'hero.headline': 'ఆరోగ్య కార్యకర్తలు తమ మాటల్లో నివేదిస్తారు। BUSHO సరైన వారు సురక్షితంగా చర్య తీసుకోవడంలో సహాయపడుతుంది।', 'hero.subtext': 'కాల్స్ మరియు రిజిస్టర్ల ద్వారా నివేదికలు నెమ్మదిగా వెళ్తాయి। BUSHO ఫీల్డ్ నోట్‌ను కార్యకర్త నిర్ధారించే తనిఖీ చేసిన డ్రాఫ్ట్‌గా మారుస్తుంది।', 'hero.tryDemo': 'డెమో ప్రయత్నించండి', 'hero.seeHow': 'ఎలా పనిచేస్తుందో చూడండి', 'hero.trust1': 'ప్రతి రికార్డును ఒక వ్యక్తి నిర్ధారిస్తారు', 'hero.trust2': 'రోగ నిర్ధారణ లేదు', 'hero.trust3': 'కృత్రిమ డెమో డేటా', 'how.title': 'ఇది ఎలా పనిచేస్తుంది', 'how.step1.title': 'నివేదిక', 'how.step2.title': 'డ్రాఫ్ట్', 'how.step2.by': 'BUSHO సూచన', 'how.step3.title': 'నిర్ధారణ', 'how.step4.title': 'చర్య', 'supervisor.title': 'పర్యవేక్షకుడు', 'safety.title': 'భద్రతా నియమాలు', 'footer.event': 'సామాజిక మేలుకోసం హ్యాక్, VBYLD 2027', 'footer.terms': 'నిబంధనలు', 'footer.privacy': 'గోప్యత', 'footer.reset': 'డెమో డేటాను రీసెట్ చేయండి', 'footer.prototype': 'ముందస్తు నమూనా: నిజమైన రోగి డేటా కోసం కాదు', 'glossary.hwc': 'ఆరోగ్యం మరియు సంక్షేమ కేంద్రం', 'glossary.cho': 'సమాజ ఆరోగ్య అధికారి', 'glossary.ors': 'నోటి ద్వారా నీరు-ఉప్పు ద్రావణం', 'unit.packets': 'ప్యాకెట్లు', 'unit.strips': 'స్ట్రిప్‌లు', 'unit.tablets': 'మాత్రలు', 'worker.title': 'ఆరోగ్య కార్యకర్త', 'how.step1.by': 'ఆరోగ్య కార్యకర్త', 'how.step3.by': 'ఆరోగ్య కార్యకర్త', 'how.step4.by': 'పర్యవేక్షకుడు', 'sample.routine': 'ఈ రోజు ౧౨ జ్వరం మరియు ౮ విరేచనాల రోగులు ఉన్నారు। ORS ప్యాకెట్లు ౨౦ మాత్రమే ఉన్నాయి; ఇనుము మాత్రలు దాదాపు అయిపోయాయి।', 'sample.ambiguous': 'ఈ రోజు కొన్ని జ్వరం కేసులు ఉన్నాయి। ORS దాదాపు అయిపోయింది।',
      'how.step1.desc': 'ఆరోగ్య కార్యకర్త తన మాటల్లో చిన్న ఫీల్డ్ అప్‌డేట్ రాస్తారు లేదా చెబుతారు।', 'how.step2.desc': 'BUSHO సులభమైన నోట్ నుంచి చూడగలిగే డ్రాఫ్ట్ తయారు చేస్తుంది।', 'how.step3.desc': 'ఆరోగ్య కార్యకర్త ప్రతి అంశాన్ని చూసి రికార్డును నిర్ధారిస్తారు।', 'how.step4.desc': 'తనిఖీ చేసిన సంకేతంతో సరఫరా నింపే డ్రాఫ్ట్ ఆమోదానికి సిద్ధమవుతుంది।',
      'worker.channel': 'టెక్స్ట్ / వాయిస్', 'worker.voiceBtn': 'వాయిస్ ఇన్‌పుట్ (డెమో)', 'worker.voiceNote': 'ఈ నమూనాలో వాయిస్ ఇన్‌పుట్ డెమోగా మాత్రమే ఉంది', 'worker.tryExample': 'ఒక ఉదాహరణ ప్రయత్నించండి', 'worker.sample.routine': 'సాధారణ నివేదిక', 'worker.sample.ambiguous': 'స్పష్టత లేని నివేదిక', 'worker.privacy': 'రోగుల పేర్లు, ఫోన్ నంబర్లు లేదా నిర్ధారణలను నమోదు చేయవద్దు. గుర్తించలేని సమగ్ర సమాచారాన్ని మాత్రమే ఇవ్వండి।', 'worker.draftTitle': 'BUSHO అర్థం చేసుకున్నది', 'worker.provisional': 'ఈ సమాచారం తాత్కాలికం। ప్రతి అంశాన్ని చూడండి। మీరు నిర్ధారించే వరకు ఏదీ నమోదు కాదు।', 'worker.provisionalFlagged': 'తాత్కాలిక డ్రాఫ్ట్‌కు మానవ తనిఖీ అవసరం। గుర్తించిన అంశాలు స్పష్టమైన తర్వాతే రికార్డును నిర్ధారించవచ్చు।', 'worker.provisionalVerified': 'నివేదిక BUSHOలో సేవ్ చేసి పర్యవేక్షక సమీక్షకు పంపబడింది।', 'worker.confidenceKey': 'నమ్మకం ఎక్కువ · తనిఖీ అవసరం', 'worker.engineLabel': 'నియమాల ఆధారిత డెమో తనిఖీ · రూపం తనిఖీ అయింది', 'worker.verifyPrompt': 'ఇది ఈ రోజు నివేదికకు సరైనదేనా?', 'worker.verifyNote': 'నిర్ధారించిన తర్వాత నివేదిక మీకు కేటాయించిన పర్యవేక్షకుడి సమీక్షకు పంపబడుతుంది। BUSHO రోగ నిర్ధారణ చేయదు।', 'worker.seeSupervisor': 'పర్యవేక్షకుడు చూసేది చూడండి', 'worker.toast.edit': 'అంశాలను చూసి సరిచేసిన డ్రాఫ్ట్‌ను నిర్ధారించండి',
      'draft.symptoms': 'తెలిపిన లక్షణాలు', 'draft.orsStock': 'మిగిలిన నిల్వ / ORS', 'draft.ifaStock': 'మిగిలిన నిల్వ / ఇనుము మరియు ఫోలిక్ ఆమ్లం', 'draft.clinicalStatus': 'ఆరోగ్య స్థితి', 'draft.confidence.high': 'నమ్మకం ఎక్కువ', 'draft.confidence.review': 'తనిఖీ అవసరం', 'draft.confidence.workerChecked': 'కార్యకర్త తనిఖీ చేశారు',
      'supervisor.subtitle': 'తనిఖీ చేసిన నిల్వ సంకేతాలను స్పష్టమైన సందర్భం మరియు మానవ ఆమోదంతో చూడండి।', 'supervisor.priorityLabel': 'ముఖ్య తనిఖీ', 'supervisor.priorityTitle': 'రాంపూర్ HWCలో జ్వరం సంకేతం', 'supervisor.priorityTrend': '+38% ప్రస్తావనలు / ఆరోగ్య ధోరణి మాత్రమే', 'supervisor.priorityState': 'తనిఖీ అవసరం', 'supervisor.metric.reports': 'అందిన నివేదికలు', 'supervisor.metric.pending': 'నిర్ధారణ కోసం వేచి ఉంది', 'supervisor.metric.lowStock': 'తక్కువ నిల్వ మందులు', 'supervisor.metric.stockout': 'నిల్వ అయిపోయే అవకాశం', 'supervisor.metric.trend.positive': 'ప్రస్తుత తనిఖీ చేసిన నివేదిక ఉంది', 'supervisor.metric.trend.baseline': 'కృత్రిమ ఆధారం', 'supervisor.metric.trend.warning': 'కార్యకర్త తనిఖీ అవసరం', 'supervisor.metric.trend.allReviewed': 'ప్రస్తుత నివేదికలన్నీ తనిఖీ అయ్యాయి', 'supervisor.metric.trend.critical': 'రాంపూర్ HWCలో', 'supervisor.metric.trend.stockout': 'ORS · తెలిపిన వినియోగం ఆధారంగా', 'supervisor.trendLabel': 'ఆరోగ్య సంకేతం తనిఖీ', 'supervisor.trendTitle': 'సందర్భంతో తెలిపిన లక్షణాలు', 'supervisor.trendChip': 'తనిఖీ అవసరం', 'supervisor.trendNumber': 'రాంపూర్ HWCలో జ్వరం ప్రస్తావనలు', 'supervisor.trendDesc': 'మునుపటి ౭ రోజుల నివేదికలతో పోలిక', 'supervisor.chartLabel': '౭ రోజుల క్రితం', 'supervisor.chartToday': 'ఈ రోజు', 'supervisor.safetyCallout': 'ఇది తెలిపిన ఆరోగ్య ధోరణి మాత్రమే। మానవ తనిఖీ కోసం సంకేతం। దీనితో వ్యాధి లేదా వ్యాప్తి నిర్ధారణ కాదు।', 'supervisor.inventoryLabel': 'నిల్వ సమాచారం', 'supervisor.inventoryTitle': 'శ్రద్ధ అవసరమైన నిల్వ', 'supervisor.viewAll': 'అన్నీ చూడండి', 'supervisor.inventory.ors': 'ORS ప్యాకెట్లు', 'supervisor.inventory.ifa': 'ఇనుము మరియు ఫోలిక్ ఆమ్లం', 'supervisor.inventory.zinc': 'జింక్ మాత్రలు', 'supervisor.inventory.healthy': 'నిల్వ బాగుంది', 'supervisor.inventory.needsAttention': 'శ్రద్ధ అవసరం', 'supervisor.severity.critical': 'చాలా తక్కువ', 'supervisor.severity.warning': 'తక్కువ', 'supervisor.severity.safe': 'బాగుంది',
      'supervisor.responseTitle': 'తనిఖీ చేసిన నివేదిక నిర్వాహకుడి పరిశీలనకు ఉంది', 'supervisor.responseCopy': 'తక్కువ నిల్వ ఉన్న వస్తువును ఎంచుకుని నింపే డ్రాఫ్ట్ చేయండి। ఈ డెమో కొనుగోలు ఆర్డర్ ఇవ్వదు।', 'supervisor.responseTitleDraft': 'నింపే డ్రాఫ్ట్ ఆమోదానికి సిద్ధంగా ఉంది', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} వరకు నింపే ప్రతిపాదన। మూలం: {source}।', 'supervisor.responseTitleApproved': 'డెమోలో నింపే డ్రాఫ్ట్ ఆమోదించబడింది', 'supervisor.responseCopyApproved': '{name} / ప్రతిపాదిత నింపే పరిమాణం పరిశీలన కోసం నమోదు అయింది। కొనుగోలు ఆర్డర్ ఇవ్వలేదు।', 'supervisor.statusAwaiting': 'నిర్వాహక చర్య కోసం వేచి ఉంది', 'supervisor.statusPending': 'ఆమోదం కోసం వేచి ఉంది', 'supervisor.statusApproved': 'డెమోలో ఆమోదం', 'supervisor.approveBtn': 'డ్రాఫ్ట్‌ను ఆమోదించండి', 'supervisor.approvedBtn': 'డ్రాఫ్ట్ ఆమోదించబడింది', 'supervisor.drawerTitle': 'నిల్వ వివరాలు', 'supervisor.drawerNote': 'ఇది డెమో నిల్వ మాత్రమే। వస్తువు డ్రాఫ్ట్ ఆమోద రికార్డు సిద్ధం చేస్తుంది; ఆర్డర్ ఇవ్వదు।', 'supervisor.drawerDraftBtn': 'నింపే డ్రాఫ్ట్ చేయండి', 'supervisor.drawerNoAction': 'చర్య అవసరం లేదు', 'supervisor.toast.draftCreated': '{name} నింపే డ్రాఫ్ట్ నిర్వాహక ఆమోదం కోసం తయారైంది', 'supervisor.toast.approved': 'డెమోలో డ్రాఫ్ట్ ఆమోదించబడింది। కొనుగోలు ఆర్డర్ ఇవ్వలేదు', 'supervisor.toast.confirmed': 'పర్యవేక్షకుడి చూపులో ఒక సంకేతం కార్యకర్త నిర్ధారణ కోసం వేచి ఉంది',
      'safety.subtitle': 'స్పష్టమైన స్థితులు ఉత్పత్తిపై నమ్మకాన్ని పెంచుతాయి।', 'safety.desc': 'BUSHO కార్యకర్త నివేదిక, మానవ తనిఖీ మరియు నిర్వాహక స్పందనను వేర్వేరు రికార్డులుగా చూపుతుంది।', 'safety.state1.label': 'స్థితి ౦౧', 'safety.state1.pill': 'తనిఖీ కాలేదు', 'safety.state1.title': 'తెలిపిన ఆరోగ్య ధోరణి', 'safety.state1.desc': 'మూలం మరియు సందర్భంతో మానవ తనిఖీ కోసం ఫీల్డ్ సంకేతం।', 'safety.state1.footer': 'మూలం: గుర్తింపు తొలగించిన కార్యకర్త నివేదికలు', 'safety.state2.label': 'స్థితి ౦౨', 'safety.state2.pill': 'ఆధారం అవసరం', 'safety.state2.title': 'నిర్ధారించిన వైద్య సంఘటన', 'safety.state2.desc': 'వైద్య నిర్ణయానికి అధికారిక తనిఖీ అవసరం। BUSHO ఆ నిర్ణయాన్ని డ్రాఫ్ట్ ప్రక్రియకు బయట ఉంచుతుంది।', 'safety.state2.footer': 'వైద్య తనిఖీ మానవుల ఆధ్వర్యంలో ఉంటుంది', 'safety.state3.label': 'స్థితి ౦౩', 'safety.state3.pill': 'ఆమోదం అవసరం', 'safety.state3.title': 'నిర్వాహక చర్య', 'safety.state3.desc': 'తనిఖీ చేసిన నిల్వతో నింపే డ్రాఫ్ట్ చేయవచ్చు। అధికారిక నిర్వాహకుడే అభ్యర్థనను ఆమోదిస్తారు।', 'safety.state3.footer': 'ఆమోదం కోసం వేచి ఉన్న డ్రాఫ్ట్ అభ్యర్థన', 'footer.aiNote': 'అనువాదాలు డెమో కోసం తయారు చేసినవి; నిజమైన ఉపయోగానికి ముందు స్థానిక భాష మాట్లాడే వ్యక్తి తనిఖీ చేయాలి।',
      'worker.provisionalFlaggedTitle': 'డ్రాఫ్ట్‌కు మానవ తనిఖీ అవసరం', 'worker.provisionalVerifiedTitle': 'సమీక్షకు నివేదిక సమర్పించబడింది', 'worker.emptyReport': 'ఇంకా నివేదిక రాయలేదు', 'worker.toast.save': 'స్థానిక రికవరీ డ్రాఫ్ట్‌ను సేవ్ చేయలేకపోయింది. ఈ ట్యాబ్‌ను తెరిచి ఉంచండి.', 'worker.toast.extractFirst': 'నిర్ధారించే ముందు డ్రాఫ్ట్ చేయండి'
    },
    bn: {
      'app.name': 'BUSHO', 'app.tagline': 'নিচের স্তর থেকে ওপরের স্তর পর্যন্ত স্মার্ট স্বাস্থ্য সমন্বয়কারী', 'nav.howItWorks': 'কীভাবে কাজ করে', 'nav.tryDemo': 'ডেমো চেষ্টা করুন', 'nav.safety': 'নিরাপত্তা', 'header.demoBadge': 'ডেমো: কৃত্রিম ডেটা', 'header.langLabel': 'ভাষা', 'hero.headline': 'স্বাস্থ্যকর্মীরা নিজেদের ভাষায় রিপোর্ট করেন। BUSHO সঠিক মানুষকে নিরাপদে কাজ করতে সাহায্য করে।', 'hero.subtext': 'কল ও রেজিস্টারের মাধ্যমে রিপোর্ট ধীরে পৌঁছায়। BUSHO মাঠের নোটকে কর্মীর যাচাই করা খসড়ায় বদলে দেয়।', 'hero.tryDemo': 'ডেমো চেষ্টা করুন', 'hero.seeHow': 'কীভাবে কাজ করে দেখুন', 'hero.trust1': 'প্রতিটি রেকর্ড একজন মানুষ যাচাই করেন', 'hero.trust2': 'কোনো রোগ নির্ণয় নয়', 'hero.trust3': 'কৃত্রিম ডেমো ডেটা', 'how.title': 'কীভাবে কাজ করে', 'how.step1.title': 'রিপোর্ট', 'how.step2.title': 'খসড়া', 'how.step2.by': 'BUSHO পরামর্শ', 'how.step3.title': 'নিশ্চিত করুন', 'how.step4.title': 'পদক্ষেপ', 'supervisor.title': 'তত্ত্বাবধায়ক', 'safety.title': 'নিরাপত্তার নিয়ম', 'footer.event': 'সামাজিক ভালোর জন্য হ্যাক, VBYLD 2027', 'footer.terms': 'শর্তাবলী', 'footer.privacy': 'গোপনীয়তা', 'footer.reset': 'ডেমো ডেটা রিসেট', 'footer.prototype': 'প্রোটোটাইপ: বাস্তব রোগীর ডেটার জন্য নয়', 'glossary.hwc': 'স্বাস্থ্য ও কল্যাণ কেন্দ্র', 'glossary.cho': 'কমিউনিটি স্বাস্থ্য কর্মকর্তা', 'glossary.ors': 'মুখে খাওয়ার পানিশূন্যতা লবণ', 'unit.packets': 'প্যাকেট', 'unit.strips': 'স্ট্রিপ', 'unit.tablets': 'ট্যাবলেট', 'worker.title': 'স্বাস্থ্যকর্মী', 'how.step1.by': 'স্বাস্থ্যকর্মী', 'how.step3.by': 'স্বাস্থ্যকর্মী', 'how.step4.by': 'তত্ত্বাবধায়ক', 'sample.routine': 'আজ ১২ জন জ্বর ও ৮ জন ডায়রিয়ার রোগী এসেছেন। ORS প্যাকেট মাত্র ২০টি আছে; আয়রনের ট্যাবলেট প্রায় শেষ।', 'sample.ambiguous': 'আজ কয়েকটি জ্বরের ঘটনা আছে। ORS প্রায় শেষ।',
      'how.step1.desc': 'স্বাস্থ্যকর্মী নিজের ভাষায় ছোট মাঠের আপডেট লেখেন বা বলেন।', 'how.step2.desc': 'BUSHO সহজ নোট থেকে দেখার মতো খসড়া তৈরি করে।', 'how.step3.desc': 'স্বাস্থ্যকর্মী প্রতিটি অংশ দেখে রেকর্ড নিশ্চিত করেন।', 'how.step4.desc': 'যাচাই করা সংকেত থেকে সরবরাহ পূরণের খসড়া অনুমোদনের জন্য তৈরি হয়।',
      'worker.channel': 'টেক্সট / ভয়েস', 'worker.voiceBtn': 'ভয়েস ইনপুট (ডেমো)', 'worker.voiceNote': 'এই প্রোটোটাইপে ভয়েস ইনপুট শুধু ডেমো', 'worker.tryExample': 'একটি উদাহরণ চেষ্টা করুন', 'worker.sample.routine': 'সাধারণ রিপোর্ট', 'worker.sample.ambiguous': 'অস্পষ্ট রিপোর্ট', 'worker.privacy': 'রোগীর নাম, ফোন নম্বর বা রোগনির্ণয় লিখবেন না। কেবল সমষ্টিগত, পরিচয়বিহীন তথ্য দিন।', 'worker.draftTitle': 'BUSHO কী বুঝেছে', 'worker.provisional': 'এই তথ্য অস্থায়ী। প্রতিটি অংশ দেখুন। আপনি নিশ্চিত না করা পর্যন্ত কিছুই নথিভুক্ত হবে না।', 'worker.provisionalFlagged': 'অস্থায়ী খসড়ায় মানুষের যাচাই দরকার। চিহ্নিত অংশ পরিষ্কার না হলে রেকর্ড নিশ্চিত করা যাবে না।', 'worker.provisionalVerified': 'রিপোর্ট BUSHO-তে সংরক্ষণ করে সুপারভাইজার পর্যালোচনার জন্য পাঠানো হয়েছে।', 'worker.confidenceKey': 'ভরসা বেশি · যাচাই দরকার', 'worker.engineLabel': 'নিয়মভিত্তিক ডেমো যাচাই · কাঠামো যাচাই করা হয়েছে', 'worker.verifyPrompt': 'এটি কি আজকের রিপোর্টের জন্য ঠিক?', 'worker.verifyNote': 'নিশ্চিত করলে রিপোর্টটি আপনার নির্ধারিত সুপারভাইজারের পর্যালোচনার জন্য পাঠানো হয়। BUSHO রোগ নির্ণয় করে না।', 'worker.seeSupervisor': 'তত্ত্বাবধায়ক কী দেখেন দেখুন', 'worker.toast.edit': 'অংশগুলি দেখুন এবং ঠিক করা খসড়া নিশ্চিত করুন',
      'draft.symptoms': 'জানানো লক্ষণ', 'draft.orsStock': 'বাকি মজুত / ORS', 'draft.ifaStock': 'বাকি মজুত / আয়রন ও ফোলিক অ্যাসিড', 'draft.clinicalStatus': 'স্বাস্থ্য অবস্থা', 'draft.confidence.high': 'ভরসা বেশি', 'draft.confidence.review': 'যাচাই দরকার', 'draft.confidence.workerChecked': 'কর্মী যাচাই করেছেন',
      'supervisor.subtitle': 'যাচাই করা মজুতের সংকেত স্পষ্ট তথ্য ও মানুষের অনুমোদনসহ দেখুন।', 'supervisor.priorityLabel': 'জরুরি যাচাই', 'supervisor.priorityTitle': 'রামপুর HWC-তে জ্বরের সংকেত', 'supervisor.priorityTrend': '+38% উল্লেখ / শুধু স্বাস্থ্য প্রবণতা', 'supervisor.priorityState': 'যাচাই দরকার', 'supervisor.metric.reports': 'পাওয়া রিপোর্ট', 'supervisor.metric.pending': 'নিশ্চিত করার অপেক্ষা', 'supervisor.metric.lowStock': 'কম মজুতের ওষুধ', 'supervisor.metric.stockout': 'মজুত শেষ হওয়ার সম্ভাবনা', 'supervisor.metric.trend.positive': 'বর্তমান যাচাই করা রিপোর্ট আছে', 'supervisor.metric.trend.baseline': 'কৃত্রিম ভিত্তি', 'supervisor.metric.trend.warning': 'কর্মীর যাচাই দরকার', 'supervisor.metric.trend.allReviewed': 'বর্তমান সব রিপোর্ট দেখা হয়েছে', 'supervisor.metric.trend.critical': 'রামপুর HWC-তে', 'supervisor.metric.trend.stockout': 'ORS · জানানো ব্যবহার অনুযায়ী', 'supervisor.trendLabel': 'স্বাস্থ্য সংকেত যাচাই', 'supervisor.trendTitle': 'প্রেক্ষাপটসহ জানানো লক্ষণ', 'supervisor.trendChip': 'যাচাই দরকার', 'supervisor.trendNumber': 'রামপুর HWC-তে জ্বরের উল্লেখ', 'supervisor.trendDesc': 'আগের ৭ দিনের রিপোর্টের সঙ্গে তুলনা', 'supervisor.chartLabel': '৭ দিন আগে', 'supervisor.chartToday': 'আজ', 'supervisor.safetyCallout': 'এটি জানানো স্বাস্থ্য প্রবণতা। মানুষের যাচাইয়ের জন্য সংকেত মাত্র। এতে রোগ বা প্রাদুর্ভাব নিশ্চিত হয় না।', 'supervisor.inventoryLabel': 'মজুতের তথ্য', 'supervisor.inventoryTitle': 'যে মজুতে নজর দরকার', 'supervisor.viewAll': 'সব দেখুন', 'supervisor.inventory.ors': 'ORS প্যাকেট', 'supervisor.inventory.ifa': 'আয়রন ও ফোলিক অ্যাসিড', 'supervisor.inventory.zinc': 'জিঙ্ক ট্যাবলেট', 'supervisor.inventory.healthy': 'মজুত ঠিক আছে', 'supervisor.inventory.needsAttention': 'নজর দিন', 'supervisor.severity.critical': 'খুব কম', 'supervisor.severity.warning': 'কম', 'supervisor.severity.safe': 'ঠিক আছে',
      'supervisor.responseTitle': 'যাচাই করা রিপোর্ট প্রশাসকের দেখার জন্য প্রস্তুত', 'supervisor.responseCopy': 'কম মজুতের জিনিস বেছে পূরণের খসড়া তৈরি করুন। এই ডেমো কোনো কেনার অর্ডার দেয় না।', 'supervisor.responseTitleDraft': 'পূরণের খসড়া অনুমোদনের জন্য প্রস্তুত', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} পর্যন্ত পূরণের প্রস্তাব। উৎস: {source}।', 'supervisor.responseTitleApproved': 'ডেমোতে পূরণের খসড়া অনুমোদিত', 'supervisor.responseCopyApproved': '{name} / প্রস্তাবিত পূরণের পরিমাণ দেখার জন্য নথিভুক্ত হয়েছে। কোনো কেনার অর্ডার দেওয়া হয়নি।', 'supervisor.statusAwaiting': 'প্রশাসনিক কাজের অপেক্ষা', 'supervisor.statusPending': 'অনুমোদনের অপেক্ষা', 'supervisor.statusApproved': 'ডেমোতে অনুমোদিত', 'supervisor.approveBtn': 'খসড়া অনুমোদন করুন', 'supervisor.approvedBtn': 'খসড়া অনুমোদিত', 'supervisor.drawerTitle': 'মজুতের বিবরণ', 'supervisor.drawerNote': 'এটি শুধু ডেমো মজুত। কোনো জিনিসের খসড়া অনুমোদনের নথি তৈরি করে; অর্ডার দেয় না।', 'supervisor.drawerDraftBtn': 'পূরণের খসড়া তৈরি করুন', 'supervisor.drawerNoAction': 'কাজের দরকার নেই', 'supervisor.toast.draftCreated': '{name}-এর পূরণের খসড়া প্রশাসকের অনুমোদনের জন্য তৈরি হয়েছে', 'supervisor.toast.approved': 'ডেমোতে খসড়া অনুমোদিত। কোনো কেনার অর্ডার দেওয়া হয়নি', 'supervisor.toast.confirmed': 'তত্ত্বাবধায়কের পাতায় একটি সংকেত কর্মীর নিশ্চিতকরণের অপেক্ষায় আছে',
      'safety.subtitle': 'স্পষ্ট অবস্থা পণ্যের ওপর ভরসা তৈরি করে।', 'safety.desc': 'BUSHO কর্মীর রিপোর্ট, মানুষের যাচাই এবং প্রশাসকের প্রতিক্রিয়াকে আলাদা নথি হিসেবে দেখায়।', 'safety.state1.label': 'অবস্থা ০১', 'safety.state1.pill': 'যাচাই হয়নি', 'safety.state1.title': 'জানানো স্বাস্থ্য প্রবণতা', 'safety.state1.desc': 'উৎস ও প্রেক্ষাপটসহ মানুষের যাচাইয়ের জন্য মাঠের সংকেত।', 'safety.state1.footer': 'উৎস: পরিচয়হীন কর্মী রিপোর্ট', 'safety.state2.label': 'অবস্থা ০২', 'safety.state2.pill': 'প্রমাণ দরকার', 'safety.state2.title': 'নিশ্চিত চিকিৎসা ঘটনা', 'safety.state2.desc': 'চিকিৎসার সিদ্ধান্তের জন্য অনুমোদিত যাচাই দরকার। BUSHO এই সিদ্ধান্ত খসড়ার বাইরে রাখে।', 'safety.state2.footer': 'চিকিৎসা যাচাই মানুষের নেতৃত্বে হয়', 'safety.state3.label': 'অবস্থা ০৩', 'safety.state3.pill': 'অনুমোদন দরকার', 'safety.state3.title': 'প্রশাসনিক কাজ', 'safety.state3.desc': 'যাচাই করা মজুত থেকে পূরণের খসড়া করা যায়। অনুমোদিত প্রশাসকই অনুরোধ মঞ্জুর করেন।', 'safety.state3.footer': 'অনুমোদনের অপেক্ষায় খসড়া অনুরোধ', 'footer.aiNote': 'অনুবাদগুলি ডেমোর জন্য তৈরি; বাস্তব ব্যবহারের আগে স্থানীয় ভাষাভাষীর যাচাই দরকার।',
      'worker.provisionalFlaggedTitle': 'খসড়ায় মানুষের যাচাই দরকার', 'worker.provisionalVerifiedTitle': 'রিপোর্ট পর্যালোচনার জন্য পাঠানো হয়েছে', 'worker.emptyReport': 'এখনও কোনো রিপোর্ট লেখা হয়নি', 'worker.toast.save': 'স্থানীয় পুনরুদ্ধার খসড়া সংরক্ষণ করা যায়নি। এই ট্যাবটি খোলা রাখুন।', 'worker.toast.extractFirst': 'নিশ্চিত করার আগে খসড়া তৈরি করুন'
    }
  };
  const localeLabels = { hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', bn: 'বাংলা', mr: 'मराठी' };
  const addedTranslations = {
    hi: {
      'worker.subtitle': 'स्वाभाविक रूप से लिखें। पुष्टि से पहले BUSHO ने जो समझा, उसे देखें।', 'worker.step1': 'चरण 1/2: रिपोर्ट', 'worker.step2': 'चरण 2/2: समीक्षा और पुष्टि', 'worker.step3': 'समीक्षा और पुष्टि', 'worker.sendUpdate': 'क्षेत्र अपडेट भेजें', 'worker.channel': 'टेक्स्ट / आवाज़', 'worker.placeholder': 'आज आपने क्या देखा लिखें: लक्षण, संख्या, स्टॉक...', 'worker.voiceBtn': 'आवाज़ इनपुट (डेमो)', 'worker.voiceNote': 'इस प्रोटोटाइप में आवाज़ से लिखना सिम्युलेटेड है', 'worker.tryExample': 'उदाहरण आज़माएँ', 'worker.extractBtn': 'रिपोर्ट का मसौदा बनाएँ', 'worker.privacy': 'रोगियों के नाम, फोन नंबर या निदान दर्ज न करें। केवल समेकित, पहचान-रहित जानकारी दें।', 'worker.draftTitle': 'BUSHO ने क्या समझा', 'worker.draftAwaiting': 'मसौदा बनने की प्रतीक्षा', 'worker.draftNeedsVerify': 'पुष्टि ज़रूरी', 'worker.draftVerified': 'कर्मी ने जाँचा', 'worker.provisionalTitle': 'मसौदा अस्थायी है', 'worker.provisionalDesc': 'हर क्षेत्र को देखें। पुष्टि तक कुछ भी दर्ज नहीं होता।', 'worker.provisionalFlaggedTitle': 'मसौदे की मानव जाँच ज़रूरी है', 'worker.provisionalVerifiedTitle': 'सत्यापित रिकॉर्ड', 'worker.verifyPrompt': 'क्या यह आज की रिपोर्ट के लिए सही है?', 'worker.verifyNote': 'पुष्टि करने पर रिपोर्ट आपके निर्धारित पर्यवेक्षक की समीक्षा के लिए भेजी जाती है। BUSHO निदान नहीं करता।', 'worker.editBtn': 'क्षेत्र बदलें', 'worker.confirmBtn': 'रिपोर्ट की पुष्टि करें', 'worker.seeSupervisor': 'पर्यवेक्षक का दृश्य देखें', 'worker.toast.empty': 'मसौदा बनाने से पहले क्षेत्र रिपोर्ट लिखें', 'worker.toast.extract': 'मसौदा बना। पुष्टि से पहले जाँचें', 'worker.toast.extractAmbiguous': 'मसौदा बना। चिन्हित क्षेत्र स्पष्ट करें', 'worker.toast.extractFirst': 'पहले मसौदा बनाएँ', 'worker.toast.validate': 'कुछ क्षेत्र अभी स्पष्ट करने हैं', 'worker.toast.confirm': 'रिपोर्ट पर्यवेक्षक की समीक्षा के लिए भेजी गई', 'worker.toast.edit': 'क्षेत्र जाँचें और सही मसौदे की पुष्टि करें', 'worker.toast.voice': 'आवाज़ से लिखना उपलब्ध नहीं है। टेक्स्ट या उदाहरण प्रयोग करें', 'worker.toast.routine': 'सामान्य उदाहरण लोड हुआ', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड हुआ', 'worker.toast.save': 'डेमो स्थिति सहेजी नहीं जा सकी', 'worker.emptyReport': 'अभी कोई रिपोर्ट नहीं लिखी गई', 'worker.draft': 'मसौदा', 'worker.emptyTitle': 'जाँच मसौदा बनाने के लिए रिपोर्ट का मसौदा बनाएँ', 'worker.emptyDesc': 'पुष्टि तक क्षेत्र अस्थायी रहेंगे', 'draft.symptomsValue': 'बुखार: {fever} उल्लेख; दस्त: {diarrhea} उल्लेख', 'draft.symptomsUnclear': 'लक्षण बताए गए; संख्या स्पष्ट नहीं', 'draft.quantityUnclear': 'मात्रा नहीं बताई गई', 'draft.almostFinished': 'लगभग खत्म', 'draft.source': 'रिपोर्ट से निकाला गया', 'draft.needsClarify': 'पुष्टि से पहले स्पष्ट करें', 'draft.quantityNeeded': 'मात्रा चाहिए', 'draft.safeByDesign': 'सुरक्षा के लिए', 'draft.clinicalStatus': 'स्वास्थ्य स्थिति', 'draft.clinicalValue': 'सिर्फ रिपोर्ट किया रुझान; निदान नहीं', 'supervisor.sourceVerified': 'सत्यापित कर्मी रिपोर्ट', 'supervisor.sourceSynthetic': 'कृत्रिम स्टॉक स्नैपशॉट'
    },
    ta: { 'worker.subtitle': 'இயல்பாக எழுதுங்கள். உறுதிப்படுத்தும் முன் BUSHO புரிந்ததைப் பாருங்கள்.', 'worker.step1': 'படி 1/2: அறிக்கை', 'worker.step2': 'படி 2/2: மதிப்பாய்வு மற்றும் உறுதிப்படுத்தல்', 'worker.step3': 'மதிப்பாய்வு மற்றும் உறுதிப்படுத்தல்', 'worker.sendUpdate': 'களப் புதுப்பிப்பை அனுப்புங்கள்', 'worker.placeholder': 'இன்று பார்த்ததை எழுதுங்கள்: அறிகுறிகள், எண்ணிக்கை, இருப்பு...', 'worker.extractBtn': 'வரைவை உருவாக்கு', 'worker.draftAwaiting': 'வரைவுக்காக காத்திருக்கிறது', 'worker.draftNeedsVerify': 'சரிபார்ப்பு தேவை', 'worker.draftVerified': 'பணியாளர் சரிபார்த்தது', 'worker.provisionalTitle': 'வரைவு தற்காலிகமானது', 'worker.provisionalDesc': 'உறுதி செய்யும் முன் ஒவ்வொரு பகுதியையும் பாருங்கள்.', 'worker.confirmBtn': 'அறிக்கையை உறுதி செய்', 'worker.editBtn': 'பகுதிகளை திருத்து', 'worker.toast.empty': 'வரைவு உருவாக்கும் முன் அறிக்கையை எழுதுங்கள்', 'worker.toast.extract': 'வரைவு உருவானது. உறுதி செய்யும் முன் சரிபாருங்கள்', 'worker.toast.extractAmbiguous': 'வரைவு உருவானது. குறிக்கப்பட்ட பகுதிகளை தெளிவுபடுத்துங்கள்', 'worker.toast.confirm': 'அறிக்கை மேற்பார்வையாளர் மதிப்பாய்விற்கு அனுப்பப்பட்டது', 'worker.toast.voice': 'குரல் உள்ளீடு இல்லை. உரை அல்லது உதாரணத்தைப் பயன்படுத்துங்கள்', 'worker.toast.routine': 'வழக்கமான உதாரணம் ஏற்றப்பட்டது', 'worker.toast.ambiguous': 'தெளிவில்லாத உதாரணம் ஏற்றப்பட்டது', 'worker.toast.validate': 'சில பகுதிகள் இன்னும் தெளிவாக வேண்டும்', 'worker.draft': 'வரைவு', 'worker.emptyTitle': 'சரிபார்ப்பு வரைவைக் காண அறிக்கையை உருவாக்குங்கள்', 'worker.emptyDesc': 'உறுதி செய்யும் வரை பகுதிகள் தற்காலிகமாக இருக்கும்', 'draft.symptomsValue': 'காய்ச்சல்: {fever}; வயிற்றுப்போக்கு: {diarrhea}', 'draft.symptomsUnclear': 'அறிகுறிகள் உள்ளன; எண்ணிக்கை தெளிவில்லை', 'draft.quantityUnclear': 'அளவு குறிப்பிடப்படவில்லை', 'draft.almostFinished': 'கிட்டத்தட்ட முடிந்தது', 'draft.source': 'அறிக்கையிலிருந்து எடுக்கப்பட்டது', 'draft.needsClarify': 'உறுதி முன் தெளிவுபடுத்துங்கள்', 'draft.quantityNeeded': 'அளவு தேவை', 'draft.safeByDesign': 'பாதுகாப்புக்காக', 'draft.clinicalValue': 'அறிக்கை செய்த போக்கு மட்டும்; நோய் கண்டறிதல் இல்லை', 'supervisor.sourceVerified': 'சரிபார்க்கப்பட்ட பணியாளர் அறிக்கை', 'supervisor.sourceSynthetic': 'செயற்கை இருப்பு snapshot' },
    te: { 'worker.subtitle': 'సహజంగా రాయండి. నిర్ధారించే ముందు BUSHO అర్థం చేసుకున్నది చూడండి.', 'worker.step1': 'దశ 1/2: నివేదిక', 'worker.step2': 'దశ 2/2: సమీక్షించి నిర్ధారించండి', 'worker.step3': 'సమీక్షించి నిర్ధారించండి', 'worker.sendUpdate': 'ఫీల్డ్ అప్‌డేట్ పంపండి', 'worker.placeholder': 'ఈ రోజు చూసినది రాయండి: లక్షణాలు, సంఖ్యలు, నిల్వ...', 'worker.extractBtn': 'డ్రాఫ్ట్ తయారు చేయండి', 'worker.draftAwaiting': 'డ్రాఫ్ట్ కోసం వేచి ఉంది', 'worker.draftNeedsVerify': 'నిర్ధారణ అవసరం', 'worker.draftVerified': 'కార్మికుడు తనిఖీ చేశారు', 'worker.provisionalTitle': 'డ్రాఫ్ట్ తాత్కాలికం', 'worker.provisionalDesc': 'నిర్ధారించే ముందు ప్రతి అంశాన్ని చూడండి.', 'worker.confirmBtn': 'నివేదికను నిర్ధారించండి', 'worker.editBtn': 'అంశాలను మార్చండి', 'worker.toast.empty': 'డ్రాఫ్ట్ చేయడానికి ముందు నివేదిక రాయండి', 'worker.toast.extract': 'డ్రాఫ్ట్ తయారైంది. నిర్ధారించే ముందు తనిఖీ చేయండి', 'worker.toast.extractAmbiguous': 'డ్రాఫ్ట్ తయారైంది. గుర్తించిన అంశాలను స్పష్టం చేయండి', 'worker.toast.confirm': 'నివేదిక పర్యవేక్షక సమీక్షకు పంపబడింది', 'worker.toast.voice': 'వాయిస్ ఇన్‌పుట్ లేదు. టెక్స్ట్ లేదా ఉదాహరణ వాడండి', 'worker.toast.routine': 'సాధారణ ఉదాహరణ లోడ్ అయింది', 'worker.toast.ambiguous': 'స్పష్టత లేని ఉదాహరణ లోడ్ అయింది', 'worker.toast.validate': 'కొన్ని అంశాలు ఇంకా స్పష్టంగా లేవు', 'worker.draft': 'డ్రాఫ్ట్', 'worker.emptyTitle': 'తనిఖీ డ్రాఫ్ట్ కోసం నివేదికను తయారు చేయండి', 'worker.emptyDesc': 'నిర్ధారించే వరకు అంశాలు తాత్కాలికంగా ఉంటాయి', 'draft.symptomsValue': 'జ్వరం: {fever}; విరేచనాలు: {diarrhea}', 'draft.symptomsUnclear': 'లక్షణాలు ఉన్నాయి; సంఖ్య తెలియదు', 'draft.quantityUnclear': 'పరిమాణం చెప్పలేదు', 'draft.almostFinished': 'దాదాపు అయిపోయింది', 'draft.source': 'నివేదిక నుంచి తీసుకున్నది', 'draft.needsClarify': 'నిర్ధారణకు ముందు స్పష్టం చేయండి', 'draft.quantityNeeded': 'పరిమాణం అవసరం', 'draft.safeByDesign': 'భద్రత కోసం', 'draft.clinicalValue': 'నివేదించిన ధోరణి మాత్రమే; రోగనిర్ధారణ లేదు', 'supervisor.sourceVerified': 'నిర్ధారించిన కార్మిక నివేదిక', 'supervisor.sourceSynthetic': 'కృత్రిమ నిల్వ snapshot' },
    bn: { 'worker.subtitle': 'স্বাভাবিকভাবে লিখুন। নিশ্চিত করার আগে BUSHO কী বুঝেছে দেখুন।', 'worker.step1': 'ধাপ ১/২: রিপোর্ট', 'worker.step2': 'ধাপ ২/২: পর্যালোচনা ও নিশ্চিতকরণ', 'worker.step3': 'পর্যালোচনা ও নিশ্চিতকরণ', 'worker.sendUpdate': 'ফিল্ড আপডেট পাঠান', 'worker.placeholder': 'আজ যা দেখেছেন লিখুন: লক্ষণ, সংখ্যা, মজুত...', 'worker.extractBtn': 'খসড়া তৈরি করুন', 'worker.draftAwaiting': 'খসড়ার অপেক্ষা', 'worker.draftNeedsVerify': 'যাচাই দরকার', 'worker.draftVerified': 'কর্মী যাচাই করেছেন', 'worker.provisionalTitle': 'খসড়াটি অস্থায়ী', 'worker.provisionalDesc': 'নিশ্চিত করার আগে প্রতিটি অংশ দেখুন।', 'worker.confirmBtn': 'রিপোর্ট নিশ্চিত করুন', 'worker.editBtn': 'অংশ সম্পাদনা করুন', 'worker.toast.empty': 'খসড়া তৈরির আগে রিপোর্ট লিখুন', 'worker.toast.extract': 'খসড়া তৈরি হয়েছে। নিশ্চিত করার আগে দেখুন', 'worker.toast.extractAmbiguous': 'খসড়া তৈরি হয়েছে। চিহ্নিত অংশ স্পষ্ট করুন', 'worker.toast.confirm': 'রিপোর্ট সুপারভাইজার পর্যালোচনার জন্য পাঠানো হয়েছে', 'worker.toast.voice': 'ভয়েস ইনপুট নেই। টেক্সট বা উদাহরণ ব্যবহার করুন', 'worker.toast.routine': 'সাধারণ উদাহরণ লোড হয়েছে', 'worker.toast.ambiguous': 'অস্পষ্ট উদাহরণ লোড হয়েছে', 'worker.toast.validate': 'কিছু অংশ এখনও স্পষ্ট করা দরকার', 'worker.draft': 'খসড়া', 'worker.emptyTitle': 'যাচাই খসড়া দেখতে রিপোর্ট তৈরি করুন', 'worker.emptyDesc': 'নিশ্চিত না হওয়া পর্যন্ত অংশগুলি অস্থায়ী', 'draft.symptomsValue': 'জ্বর: {fever}; ডায়রিয়া: {diarrhea}', 'draft.symptomsUnclear': 'লক্ষণ আছে; সংখ্যা স্পষ্ট নয়', 'draft.quantityUnclear': 'পরিমাণ বলা হয়নি', 'draft.almostFinished': 'প্রায় শেষ', 'draft.source': 'রিপোর্ট থেকে নেওয়া', 'draft.needsClarify': 'নিশ্চিত করার আগে স্পষ্ট করুন', 'draft.quantityNeeded': 'পরিমাণ দরকার', 'draft.safeByDesign': 'নিরাপত্তার জন্য', 'draft.clinicalValue': 'শুধু রিপোর্ট করা প্রবণতা; রোগ নির্ণয় নয়', 'supervisor.sourceVerified': 'যাচাই করা কর্মীর রিপোর্ট', 'supervisor.sourceSynthetic': 'কৃত্রিম মজুতের ছবি' },
    mr: { 'worker.subtitle': 'सहजपणे लिहा. पुष्टी करण्यापूर्वी BUSHO ने काय समजले ते पाहा.', 'worker.step1': 'पायरी १/२: अहवाल', 'worker.step2': 'पायरी २/२: पुनरावलोकन व पुष्टी', 'worker.step3': 'पुनरावलोकन व पुष्टी', 'worker.sendUpdate': 'क्षेत्र अहवाल पाठवा', 'worker.placeholder': 'आज काय पाहिले ते लिहा: लक्षणे, संख्या, साठा...', 'worker.extractBtn': 'मसुदा तयार करा', 'worker.draftAwaiting': 'मसुद्याची प्रतीक्षा', 'worker.draftNeedsVerify': 'तपासणी आवश्यक', 'worker.draftVerified': 'कर्मचाऱ्याने तपासले', 'worker.provisionalTitle': 'मसुदा तात्पुरता आहे', 'worker.provisionalDesc': 'पुष्टीपूर्वी प्रत्येक भाग तपासा.', 'worker.confirmBtn': 'अहवालाची पुष्टी करा', 'worker.editBtn': 'भाग बदला', 'worker.toast.empty': 'मसुदा तयार करण्यापूर्वी अहवाल लिहा', 'worker.toast.extract': 'मसुदा तयार झाला. पुष्टीपूर्वी तपासा', 'worker.toast.extractAmbiguous': 'मसुदा तयार झाला. चिन्हांकित भाग स्पष्ट करा', 'worker.toast.confirm': 'अहवाल पर्यवेक्षकाच्या पुनरावलोकनासाठी पाठवला', 'worker.toast.voice': 'आवाज इनपुट उपलब्ध नाही. मजकूर किंवा उदाहरण वापरा', 'worker.toast.routine': 'सामान्य उदाहरण लोड झाले', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड झाले', 'worker.toast.validate': 'काही भाग अजून स्पष्ट करणे आवश्यक आहे', 'worker.draft': 'मसुदा', 'worker.emptyTitle': 'तपासणीचा मसुदा पाहण्यासाठी अहवाल तयार करा', 'worker.emptyDesc': 'पुष्टी होईपर्यंत भाग तात्पुरते राहतील', 'draft.symptomsValue': 'ताप: {fever}; अतिसार: {diarrhea}', 'draft.symptomsUnclear': 'लक्षणे सांगितली; संख्या स्पष्ट नाही', 'draft.quantityUnclear': 'प्रमाण सांगितले नाही', 'draft.almostFinished': 'जवळजवळ संपले', 'draft.source': 'अहवालातून घेतले', 'draft.needsClarify': 'पुष्टीपूर्वी स्पष्ट करा', 'draft.quantityNeeded': 'प्रमाण आवश्यक', 'draft.safeByDesign': 'सुरक्षिततेसाठी', 'draft.clinicalValue': 'फक्त नोंदवलेला कल; निदान नाही', 'supervisor.sourceVerified': 'तपासलेला कर्मचाऱ्याचा अहवाल', 'supervisor.sourceSynthetic': 'कृत्रिम साठा नोंद' }
  };
  const uiTranslations = {
    hi: {
      'ui.skipLink': 'मुख्य सामग्री पर जाएँ', 'ui.mainNavigation': 'मुख्य नेविगेशन', 'ui.languageSelection': 'भाषा चुनें', 'ui.selectLanguage': 'भाषा चुनें', 'ui.trustIndicators': 'भरोसे के संकेत', 'ui.switchView': 'दृश्य बदलें', 'ui.progress': 'प्रगति: चरण 1/3', 'ui.verification': 'जाँच', 'ui.priorityAlert': 'ज़रूरी चेतावनी', 'ui.keyMetrics': 'मुख्य आँकड़े', 'ui.medicineStock': 'दवाओं का स्टॉक', 'ui.closeInventory': 'स्टॉक बंद करें', 'ui.chartAlt': '7 दिनों में बुखार के उल्लेख। दिन 1: 31%, दिन 2: 38%, दिन 3: 27%, दिन 4: 48%, दिन 5: 45%, दिन 6: 64%, दिन 7 (आज): 84%', 'ui.chartLegend': 'चार्ट संकेत', 'ui.facility': 'रामपुर HWC', 'ui.location': 'रामपुर ब्लॉक / कृत्रिम डेमो डेटा', 'ui.inventoryRecent': 'रामपुर HWC / 2 मिनट पहले रिपोर्ट', 'ui.inventoryYesterday': 'रामपुर HWC / कल की स्थानीय डेमो स्थिति', 'mock.fieldNote': 'आज हमने 12 बुखार और 8 दस्त के मरीज देखे। ORS के केवल 20 पैकेट बचे हैं और आयरन की गोलियाँ लगभग खत्म हैं।', 'mock.time': '10:42 AM', 'mock.symptomsLabel': 'लक्षण', 'mock.symptomsValue': 'बुखार: 12; दस्त: 8', 'mock.orsLabel': 'ORS', 'mock.orsValue': '20 पैकेट', 'mock.ironLabel': 'आयरन', 'mock.ironValue': 'लगभग खत्म', 'mock.verified': 'सत्यापित', 'chart.legendReported': 'बताया गया रुझान', 'chart.legendToday': 'आज', 'voice.seconds': '{seconds} सेकंड'
    },
    mr: {
      'ui.skipLink': 'मुख्य मजकुराकडे जा', 'ui.mainNavigation': 'मुख्य नेव्हिगेशन', 'ui.languageSelection': 'भाषा निवडा', 'ui.selectLanguage': 'भाषा निवडा', 'ui.trustIndicators': 'विश्वासाचे संकेत', 'ui.switchView': 'दृश्य बदला', 'ui.progress': 'प्रगती: पायरी 1/3', 'ui.verification': 'तपासणी', 'ui.priorityAlert': 'तातडीची सूचना', 'ui.keyMetrics': 'मुख्य आकडे', 'ui.medicineStock': 'औषधांचा साठा', 'ui.closeInventory': 'साठा बंद करा', 'ui.chartAlt': '7 दिवसांतील तापाच्या उल्लेखांचा कल। दिवस 1: 31%, दिवस 2: 38%, दिवस 3: 27%, दिवस 4: 48%, दिवस 5: 45%, दिवस 6: 64%, दिवस 7 (आज): 84%', 'ui.chartLegend': 'आलेखाची माहिती', 'ui.facility': 'रामपूर HWC', 'ui.location': 'रामपूर ब्लॉक / कृत्रिम डेमो डेटा', 'ui.inventoryRecent': 'रामपूर HWC / 2 मिनिटांपूर्वीचा अहवाल', 'ui.inventoryYesterday': 'रामपूर HWC / कालची स्थानिक डेमो स्थिती', 'mock.fieldNote': 'आज 12 तापाचे आणि 8 जुलाबाचे रुग्ण दिसले। ORS ची फक्त 20 पाकिटे उरली आहेत आणि लोहाच्या गोळ्या जवळजवळ संपल्या आहेत।', 'mock.time': '10:42 AM', 'mock.symptomsLabel': 'लक्षणे', 'mock.symptomsValue': 'ताप: 12; जुलाब: 8', 'mock.orsLabel': 'ORS', 'mock.orsValue': '20 पाकिटे', 'mock.ironLabel': 'लोह', 'mock.ironValue': 'जवळजवळ संपले', 'mock.verified': 'तपासलेले', 'chart.legendReported': 'नोंदवलेला कल', 'chart.legendToday': 'आज', 'voice.seconds': '{seconds} सेकंद'
    },
    ta: {
      'ui.skipLink': 'முக்கிய உள்ளடக்கத்திற்குச் செல்லவும்', 'ui.mainNavigation': 'முக்கிய வழிசெலுத்தல்', 'ui.languageSelection': 'மொழியைத் தேர்ந்தெடுக்கவும்', 'ui.selectLanguage': 'மொழியைத் தேர்ந்தெடுக்கவும்', 'ui.trustIndicators': 'நம்பிக்கை குறியீடுகள்', 'ui.switchView': 'காட்சியை மாற்றவும்', 'ui.progress': 'முன்னேற்றம்: படி 1/3', 'ui.verification': 'சரிபார்ப்பு', 'ui.priorityAlert': 'முக்கிய எச்சரிக்கை', 'ui.keyMetrics': 'முக்கிய அளவுகள்', 'ui.medicineStock': 'மருந்து இருப்பு', 'ui.closeInventory': 'இருப்பு விவரத்தை மூடவும்', 'ui.chartAlt': '7 நாட்களில் காய்ச்சல் குறிப்பிடல்கள். நாள் 1: 31%, நாள் 2: 38%, நாள் 3: 27%, நாள் 4: 48%, நாள் 5: 45%, நாள் 6: 64%, நாள் 7 (இன்று): 84%', 'ui.chartLegend': 'வரைபட விளக்கம்', 'ui.facility': 'ராம்பூர் HWC', 'ui.location': 'ராம்பூர் வட்டம் / செயற்கை டெமோ தரவு', 'ui.inventoryRecent': 'ராம்பூர் HWC / 2 நிமிடங்களுக்கு முன் தெரிவிக்கப்பட்டது', 'ui.inventoryYesterday': 'ராம்பூர் HWC / நேற்றைய உள்ளூர் டெமோ நிலை', 'mock.fieldNote': 'இன்று 12 காய்ச்சல் மற்றும் 8 வயிற்றுப்போக்கு நோயாளிகளைப் பார்த்தோம். ORS பாக்கெட்டுகள் 20 மட்டுமே உள்ளன; இரும்பு மாத்திரைகள் கிட்டத்தட்ட முடிந்துவிட்டன.', 'mock.time': '10:42 AM', 'mock.symptomsLabel': 'அறிகுறிகள்', 'mock.symptomsValue': 'காய்ச்சல்: 12; வயிற்றுப்போக்கு: 8', 'mock.orsLabel': 'ORS', 'mock.orsValue': '20 பாக்கெட்டுகள்', 'mock.ironLabel': 'இரும்பு', 'mock.ironValue': 'கிட்டத்தட்ட முடிந்தது', 'mock.verified': 'சரிபார்க்கப்பட்டது', 'chart.legendReported': 'தெரிவிக்கப்பட்ட போக்கு', 'chart.legendToday': 'இன்று', 'voice.seconds': '{seconds} வினாடிகள்'
    },
    te: {
      'ui.skipLink': 'ప్రధాన విషయానికి వెళ్లండి', 'ui.mainNavigation': 'ప్రధాన నావిగేషన్', 'ui.languageSelection': 'భాషను ఎంచుకోండి', 'ui.selectLanguage': 'భాషను ఎంచుకోండి', 'ui.trustIndicators': 'నమ్మక సూచనలు', 'ui.switchView': 'వీక్షణ మార్చండి', 'ui.progress': 'పురోగతి: దశ 1/3', 'ui.verification': 'తనిఖీ', 'ui.priorityAlert': 'ముఖ్య హెచ్చరిక', 'ui.keyMetrics': 'ముఖ్య కొలతలు', 'ui.medicineStock': 'మందుల నిల్వ', 'ui.closeInventory': 'నిల్వ వివరాలు మూసివేయండి', 'ui.chartAlt': '7 రోజుల్లో జ్వరం ప్రస్తావనలు. రోజు 1: 31%, రోజు 2: 38%, రోజు 3: 27%, రోజు 4: 48%, రోజు 5: 45%, రోజు 6: 64%, రోజు 7 (ఈ రోజు): 84%', 'ui.chartLegend': 'చార్ట్ వివరణ', 'ui.facility': 'రాంపూర్ HWC', 'ui.location': 'రాంపూర్ బ్లాక్ / కృత్రిమ డెమో డేటా', 'ui.inventoryRecent': 'రాంపూర్ HWC / 2 నిమిషాల క్రితం నివేదిక', 'ui.inventoryYesterday': 'రాంపూర్ HWC / నిన్నటి స్థానిక డెమో స్థితి', 'mock.fieldNote': 'ఈ రోజు 12 జ్వరం, 8 విరేచనాల రోగులను చూశాం. ORS ప్యాకెట్లు 20 మాత్రమే మిగిలాయి, ఇనుము మాత్రలు దాదాపు అయిపోయాయి.', 'mock.time': '10:42 AM', 'mock.symptomsLabel': 'లక్షణాలు', 'mock.symptomsValue': 'జ్వరం: 12; విరేచనాలు: 8', 'mock.orsLabel': 'ORS', 'mock.orsValue': '20 ప్యాకెట్లు', 'mock.ironLabel': 'ఇనుము', 'mock.ironValue': 'దాదాపు అయిపోయింది', 'mock.verified': 'తనిఖీ చేశారు', 'chart.legendReported': 'నివేదించిన ధోరణి', 'chart.legendToday': 'ఈ రోజు', 'voice.seconds': '{seconds} సెకన్లు'
    },
    bn: {
      'ui.skipLink': 'মূল বিষয়বস্তুতে যান', 'ui.mainNavigation': 'প্রধান নেভিগেশন', 'ui.languageSelection': 'ভাষা বেছে নিন', 'ui.selectLanguage': 'ভাষা বেছে নিন', 'ui.trustIndicators': 'বিশ্বাসের সংকেত', 'ui.switchView': 'দৃশ্য বদলান', 'ui.progress': 'অগ্রগতি: ধাপ ১/৩', 'ui.verification': 'যাচাই', 'ui.priorityAlert': 'জরুরি সতর্কতা', 'ui.keyMetrics': 'মূল পরিমাপ', 'ui.medicineStock': 'ওষুধের মজুত', 'ui.closeInventory': 'মজুতের বিবরণ বন্ধ করুন', 'ui.chartAlt': '7 দিনে জ্বরের উল্লেখ। দিন 1: 31%, দিন 2: 38%, দিন 3: 27%, দিন 4: 48%, দিন 5: 45%, দিন 6: 64%, দিন 7 (আজ): 84%', 'ui.chartLegend': 'চার্টের ব্যাখ্যা', 'ui.facility': 'রামপুর HWC', 'ui.location': 'রামপুর ব্লক / কৃত্রিম ডেমো ডেটা', 'ui.inventoryRecent': 'রামপুর HWC / 2 মিনিট আগে রিপোর্ট', 'ui.inventoryYesterday': 'রামপুর HWC / গতকালের স্থানীয় ডেমো অবস্থা', 'mock.fieldNote': 'আজ 12 জন জ্বর এবং 8 জন ডায়রিয়ার রোগী দেখেছি। ORS প্যাকেট মাত্র 20টি আছে, আর লোহার ট্যাবলেট প্রায় শেষ।', 'mock.time': '10:42 AM', 'mock.symptomsLabel': 'লক্ষণ', 'mock.symptomsValue': 'জ্বর: 12; ডায়রিয়া: 8', 'mock.orsLabel': 'ORS', 'mock.orsValue': '20 প্যাকেট', 'mock.ironLabel': 'লোহা', 'mock.ironValue': 'প্রায় শেষ', 'mock.verified': 'যাচাই করা হয়েছে', 'chart.legendReported': 'জানানো প্রবণতা', 'chart.legendToday': 'আজ', 'voice.seconds': '{seconds} সেকেন্ড'
    }
  };
  Object.entries(uiTranslations).forEach(([lang, values]) => Object.assign(locales[lang], values));
  Object.assign(locales.en, { 'voice.zeroSeconds': '0s' });
  Object.assign(locales.hi, { 'voice.zeroSeconds': '0 सेकंड' });
  Object.assign(locales.mr, { 'voice.zeroSeconds': '0 सेकंद' });
  Object.assign(locales.ta, { 'voice.zeroSeconds': '0 வினாடிகள்' });
  Object.assign(locales.te, { 'voice.zeroSeconds': '0 సెకన్లు' });
  Object.assign(locales.bn, { 'voice.zeroSeconds': '0 সেকেন্ড' });
  Object.assign(locales.hi, { 'voice.demo': 'आवाज़ इनपुट (डेमो)', 'voice.toast.voice': 'वॉइस इनपुट आपके ब्राउज़र की स्पीच रेकग्निशन सेवा का उपयोग करता है, जो ऑडियो को ब्राउज़र विक्रेता को भेज सकता है। BUSHO ऑडियो स्टोर नहीं करता। नाम, फोन नंबर या निदान न बोलें।', 'voice.listening': 'सुन रहे हैं...', 'voice.transcribed': 'लिखा हुआ पाठ जुड़ गया', 'voice.stop': 'रिकॉर्डिंग रोकें', 'voice.unsupported': 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया रिपोर्ट लिखें।', 'voice.notAllowed': 'माइक्रोफोन की अनुमति नहीं मिली। अनुमति दें या रिपोर्ट लिखें।', 'voice.audioCapture': 'माइक्रोफोन में समस्या है। उसे जाँचकर फिर कोशिश करें।', 'voice.noSpeech': 'आवाज़ नहीं मिली। फिर कोशिश करें या रिपोर्ट लिखें।', 'voice.error': 'आवाज़ पहचान में समस्या हुई।', 'voice.startFailed': 'आवाज़ शुरू नहीं हो सकी।' });
  Object.assign(locales.mr, { 'voice.demo': 'आवाज इनपुट (डेमो)', 'voice.toast.voice': 'व्हॉइस इनपुट तुमच्या ब्राउझरची स्पीच रेकग्निशन सेवा वापरते, जी ऑडियो ब्राउझर विक्रेत्याकडे पाठवू शकते. BUSHO ऑडियो साठवत नाही. नावे, फोन नंबर किंवा निदान बोलू नका.', 'voice.listening': 'ऐकत आहे...', 'voice.transcribed': 'लिहिलेला मजकूर जोडला', 'voice.stop': 'रेकॉर्डिंग थांबवा', 'voice.unsupported': 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही। कृपया अहवाल लिहा।', 'voice.notAllowed': 'मायक्रोफोनची परवानगी मिळाली नाही। परवानगी द्या किंवा अहवाल लिहा।', 'voice.audioCapture': 'मायक्रोफोनमध्ये समस्या आहे। तो तपासून पुन्हा प्रयत्न करा।', 'voice.noSpeech': 'आवाज ऐकू आला नाही। पुन्हा प्रयत्न करा किंवा अहवाल लिहा।', 'voice.error': 'आवाज ओळखण्यात समस्या आली।', 'voice.startFailed': 'आवाज सुरू करता आला नाही।' });
  Object.assign(locales.ta, { 'voice.demo': 'குரல் உள்ளீடு (டெமோ)', 'voice.toast.voice': 'குரல் உள்ளீடு உங்கள் உலாவியின் பேச்சு அங்கீகார சேவையைப் பயன்படுத்துகிறது, இது ஆடியோவை உலாவி விற்பனையாளருக்கு அனுப்பலாம். BUSHO ஆடியோவை சேமிக்காது. பெயர்கள், தொலைபேசி எண்கள் அல்லது நோயறிதல்களை சொல்லாதீர்கள்.', 'voice.listening': 'கேட்கிறது...', 'voice.transcribed': 'பேச்சு உரை சேர்க்கப்பட்டது', 'voice.stop': 'பதிவை நிறுத்தவும்', 'voice.unsupported': 'இந்த உலாவியில் குரல் அறிதல் இல்லை. அறிக்கையைத் தட்டச்சு செய்யவும்.', 'voice.notAllowed': 'ஒலிவாங்கி அனுமதி மறுக்கப்பட்டது. அனுமதி அளிக்கவும் அல்லது அறிக்கையைத் தட்டச்சு செய்யவும்.', 'voice.audioCapture': 'ஒலிவாங்கியில் சிக்கல். அதைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', 'voice.noSpeech': 'குரல் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது அறிக்கையைத் தட்டச்சு செய்யவும்.', 'voice.error': 'குரல் அறிதலில் சிக்கல் ஏற்பட்டது.', 'voice.startFailed': 'குரலைத் தொடங்க முடியவில்லை.' });
  Object.assign(locales.te, { 'voice.demo': 'వాయిస్ ఇన్‌పుట్ (డెమో)', 'voice.toast.voice': 'వాయిస్ ఇన్పుట్ మీ బ్రౌజర్ స్పీచ్ గుర్తింపు సేవను ఉపయోగిస్తుంది, ఇది ఆడియోను బ్రౌజర్ వెండార్‌కు పంపవచ్చు. BUSHO ఆడియోను నిల్వ చేయదు. పేర్లు, ఫోన్ నంబర్లు లేదా నిర్ధారణలు చెప్పవద్దు.', 'voice.listening': 'వింటోంది...', 'voice.transcribed': 'మాటల పాఠ్యం జోడించబడింది', 'voice.stop': 'రికార్డింగ్ ఆపండి', 'voice.unsupported': 'ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు. నివేదికను టైప్ చేయండి.', 'voice.notAllowed': 'మైక్రోఫోన్ అనుమతి లేదు. అనుమతి ఇవ్వండి లేదా నివేదికను టైప్ చేయండి.', 'voice.audioCapture': 'మైక్రోఫోన్‌లో సమస్య ఉంది. దాన్ని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.', 'voice.noSpeech': 'వాయిస్ వినిపించలేదు. మళ్లీ ప్రయత్నించండి లేదా నివేదికను టైప్ చేయండి.', 'voice.error': 'వాయిస్ గుర్తింపులో సమస్య వచ్చింది.', 'voice.startFailed': 'వాయిస్ ప్రారంభం కాలేదు.' });
  Object.assign(locales.bn, { 'voice.demo': 'ভয়েস ইনপুট (ডেমো)', 'voice.toast.voice': 'ভয়েস ইনপুট আপনার ব্রাউজারের স্পিচ রিকগনিশন সার্ভিস ব্যবহার করে, যা অডিও ব্রাউজার ভেন্ডরের কাছে পাঠাতে পারে। BUSHO অডিও সংরক্ষণ করে না। নাম, ফোন নম্বর বা রোগ নির্ণয় বলবেন না।', 'voice.listening': 'শোনা হচ্ছে...', 'voice.transcribed': 'কথার লেখা যোগ হয়েছে', 'voice.stop': 'রেকর্ডিং থামান', 'voice.unsupported': 'এই ব্রাউজারে ভয়েস শনাক্ত করা যায় না। রিপোর্ট লিখুন।', 'voice.notAllowed': 'মাইক্রোফোনের অনুমতি নেই। অনুমতি দিন বা রিপোর্ট লিখুন।', 'voice.audioCapture': 'মাইক্রোফোনে সমস্যা হয়েছে। পরীক্ষা করে আবার চেষ্টা করুন।', 'voice.noSpeech': 'কোনও কথা শোনা যায়নি। আবার চেষ্টা করুন বা রিপোর্ট লিখুন।', 'voice.error': 'ভয়েস শনাক্ত করতে সমস্যা হয়েছে।', 'voice.startFailed': 'ভয়েস শুরু করা যায়নি।' });

  Object.assign(locales.en, { 'ui.activeFacility': 'Active facility', 'ui.tryExample': 'Try an example', 'ui.fieldReport': 'Field report', 'ui.extractedFields': 'Extracted fields', 'glossary.title': 'Glossary' });
  Object.assign(locales.hi, { 'ui.activeFacility': 'सक्रिय केंद्र', 'ui.tryExample': 'एक उदाहरण आज़माएँ', 'ui.fieldReport': 'क्षेत्र रिपोर्ट', 'ui.extractedFields': 'निकाले गए खाने', 'glossary.title': 'शब्दावली' });
  Object.assign(locales.mr, { 'ui.activeFacility': 'सध्याचे केंद्र', 'ui.tryExample': 'एक उदाहरण वापरा', 'ui.fieldReport': 'क्षेत्र अहवाल', 'ui.extractedFields': 'काढलेले भाग', 'glossary.title': 'शब्दकोश' });
  Object.assign(locales.ta, { 'ui.activeFacility': 'செயலில் உள்ள மையம்', 'ui.tryExample': 'ஓர் உதாரணத்தை முயற்சிக்கவும்', 'ui.fieldReport': 'கள அறிக்கை', 'ui.extractedFields': 'பிரித்தெடுக்கப்பட்ட பகுதிகள்', 'glossary.title': 'சொற்களஞ்சியம்' });
  Object.assign(locales.te, { 'ui.activeFacility': 'ప్రస్తుతం ఉన్న కేంద్రం', 'ui.tryExample': 'ఒక ఉదాహరణ ప్రయత్నించండి', 'ui.fieldReport': 'ఫీల్డ్ నివేదిక', 'ui.extractedFields': 'తీసిన అంశాలు', 'glossary.title': 'పదకోశం' });
  Object.assign(locales.bn, { 'ui.activeFacility': 'সক্রিয় কেন্দ্র', 'ui.tryExample': 'একটি উদাহরণ চেষ্টা করুন', 'ui.fieldReport': 'ফিল্ড রিপোর্ট', 'ui.extractedFields': 'বের করা অংশ', 'glossary.title': 'শব্দকোষ' });

  const translationOverrides = {
    hi: {
      'app.name': 'BUSHO', 'app.tagline': 'नीचे से ऊपर तक स्मार्ट स्वास्थ्य समन्वयक',
      'nav.howItWorks': 'यह कैसे काम करता है', 'nav.tryDemo': 'डेमो आज़माएँ', 'nav.safety': 'सुरक्षा', 'header.langLabel': 'भाषा',
      'hero.tryDemo': 'डेमो आज़माएँ', 'hero.seeHow': 'काम करने का तरीका देखें', 'hero.trust1': 'हर रिकॉर्ड की पुष्टि व्यक्ति करता है', 'hero.trust2': 'कोई निदान नहीं', 'hero.trust3': 'कृत्रिम डेमो डेटा',
      'how.title': 'यह कैसे काम करता है', 'how.step1.title': 'रिपोर्ट', 'how.step1.by': 'स्वास्थ्य कार्यकर्ता', 'how.step1.desc': 'अपने शब्दों में छोटा क्षेत्र अपडेट लिखता या बोलता है।', 'how.step2.title': 'मसौदा', 'how.step3.title': 'पुष्टि', 'how.step3.by': 'स्वास्थ्य कार्यकर्ता', 'how.step3.desc': 'कार्यकर्ता हर खाने को देखकर रिकॉर्ड की पुष्टि करता है।', 'how.step4.title': 'कार्रवाई', 'how.step4.by': 'पर्यवेक्षक', 'how.step4.desc': 'सत्यापित संकेत से दवा भरने का मसौदा तैयार होता है।',
      'worker.title': 'स्वास्थ्य कार्यकर्ता', 'worker.sendUpdate': 'क्षेत्र अपडेट भेजें', 'worker.channel': 'टेक्स्ट / आवाज़', 'worker.voiceBtn': 'आवाज़ इनपुट (डेमो)', 'worker.voiceNote': 'इस प्रोटोटाइप में आवाज़ से लिखना केवल डेमो है', 'worker.tryExample': 'उदाहरण आज़माएँ', 'worker.sample.routine': 'सामान्य रिपोर्ट', 'worker.sample.ambiguous': 'अस्पष्ट रिपोर्ट', 'worker.extractBtn': 'रिपोर्ट का मसौदा बनाएँ', 'worker.privacy': 'नाम, फोन नंबर या निदान नहीं लिए जाते।', 'worker.draftAwaiting': 'मसौदा बनने की प्रतीक्षा', 'worker.draftNeedsVerify': 'पुष्टि ज़रूरी', 'worker.draftVerified': 'स्वास्थ्य कार्यकर्ता ने जाँचा',
      'worker.provisional': 'यह जानकारी अस्थायी है। हर खाने को देखें। पुष्टि से पहले कुछ भी दर्ज नहीं होगा।', 'worker.provisionalFlagged': 'अस्थायी मसौदे की मानव जाँच ज़रूरी है। चिन्हित खाने स्पष्ट करने के बाद ही रिकॉर्ड की पुष्टि होगी।', 'worker.provisionalVerified': 'रिपोर्ट BUSHO में सहेजी गई और पर्यवेक्षक की समीक्षा के लिए भेजी गई।', 'worker.confidenceKey': 'भरोसा अधिक · जाँच ज़रूरी', 'worker.engineLabel': 'नियम आधारित डेमो जाँच · ढाँचा जाँचा गया', 'worker.editBtn': 'खाने बदलें', 'worker.confirmBtn': 'रिपोर्ट की पुष्टि करें', 'worker.seeSupervisor': 'पर्यवेक्षक का दृश्य देखें',
      'worker.toast.routine': 'सामान्य उदाहरण लोड हुआ', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड हुआ', 'worker.toast.extract': 'मसौदा बना। पुष्टि से पहले जाँचें', 'worker.toast.extractAmbiguous': 'मसौदा बना। चिन्हित खाने स्पष्ट करें', 'worker.toast.empty': 'मसौदा बनाने से पहले क्षेत्र रिपोर्ट लिखें', 'worker.toast.confirm': 'सत्यापित रिपोर्ट इस ब्राउज़र में सहेजी गई', 'worker.toast.edit': 'खाने जाँचें और सही मसौदे की पुष्टि करें', 'worker.toast.validate': 'कुछ खाने अभी स्पष्ट करने हैं', 'worker.toast.voice': 'आवाज़ से लिखना उपलब्ध नहीं है। टेक्स्ट या उदाहरण प्रयोग करें',
      'draft.symptoms': 'बताए गए लक्षण', 'draft.orsStock': 'बचा हुआ स्टॉक / ORS', 'draft.ifaStock': 'बचा हुआ स्टॉक / आयरन और फोलिक एसिड', 'draft.clinicalStatus': 'स्वास्थ्य स्थिति', 'draft.source': 'रिपोर्ट से लिया गया', 'draft.confidence.high': 'भरोसा अधिक', 'draft.confidence.review': 'जाँच ज़रूरी', 'draft.confidence.workerChecked': 'कार्यकर्ता ने जाँचा', 'draft.needsClarify': 'पुष्टि से पहले स्पष्ट करें', 'draft.quantityNeeded': 'मात्रा चाहिए', 'draft.safeByDesign': 'सुरक्षा के लिए',
      'supervisor.title': 'पर्यवेक्षक', 'supervisor.subtitle': 'सत्यापित स्टॉक संकेतों को साफ संदर्भ और मानव मंज़ूरी के साथ देखें।', 'supervisor.priorityLabel': 'ज़रूरी जाँच', 'supervisor.priorityTitle': 'रामपुर HWC में बुखार का संकेत', 'supervisor.priorityTrend': '+38% उल्लेख / केवल स्वास्थ्य रुझान', 'supervisor.priorityState': 'जाँच ज़रूरी', 'supervisor.metric.reports': 'मिली रिपोर्ट', 'supervisor.metric.pending': 'पुष्टि की प्रतीक्षा', 'supervisor.metric.lowStock': 'कम स्टॉक वाली दवाएँ', 'supervisor.metric.stockout': 'स्टॉक खत्म होने की आशंका', 'supervisor.metric.trend.positive': 'मौजूदा सत्यापित रिपोर्ट शामिल है', 'supervisor.metric.trend.baseline': 'कृत्रिम आधार', 'supervisor.metric.trend.warning': 'कार्यकर्ता की जाँच ज़रूरी', 'supervisor.metric.trend.allReviewed': 'मौजूदा सभी रिपोर्ट जाँची गईं', 'supervisor.metric.trend.stockout': 'ORS · बताए गए इस्तेमाल के आधार पर', 'supervisor.trendLabel': 'स्वास्थ्य संकेत की जाँच', 'supervisor.trendTitle': 'संदर्भ सहित बताए गए लक्षण', 'supervisor.trendChip': 'जाँच ज़रूरी', 'supervisor.trendNumber': 'रामपुर HWC में बुखार के उल्लेख', 'supervisor.trendDesc': 'पिछले 7 दिनों की रिपोर्टिंग से तुलना', 'supervisor.chartLabel': '7 दिन पहले', 'supervisor.safetyCallout': 'यह बताया गया स्वास्थ्य रुझान है। मानव जाँच के लिए संकेत है। इससे बीमारी या प्रकोप की पुष्टि नहीं होती।', 'supervisor.inventoryLabel': 'स्टॉक की जानकारी', 'supervisor.inventoryTitle': 'ध्यान देने योग्य स्टॉक', 'supervisor.viewAll': 'सब देखें', 'supervisor.inventory.ifa': 'आयरन और फोलिक एसिड', 'supervisor.inventory.zinc': 'जिंक की गोलियाँ', 'supervisor.inventory.needsAttention': 'ध्यान दें',
      'supervisor.chartToday': 'आज', 'supervisor.metric.trend.critical': 'रामपुर HWC में', 'supervisor.inventory.ors': 'ORS पैकेट', 'supervisor.inventory.healthy': 'स्टॉक ठीक है', 'supervisor.severity.critical': 'बहुत कम', 'supervisor.severity.warning': 'कम', 'supervisor.severity.safe': 'ठीक',
      'safety.state1.label': 'अवस्था ०१', 'safety.state1.pill': 'असत्यापित', 'safety.state2.label': 'अवस्था ०२', 'safety.state3.label': 'अवस्था ०३',
      'supervisor.responseTitle': 'सत्यापित रिपोर्ट प्रशासनिक जाँच के लिए उपलब्ध है', 'supervisor.responseCopy': 'कम स्टॉक वाली वस्तु चुनकर भरपाई का मसौदा बनाएँ। यह डेमो कोई खरीद आदेश नहीं बनाता।', 'supervisor.responseTitleDraft': 'भरपाई का मसौदा मंज़ूरी के लिए तैयार है', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} तक भरपाई का प्रस्ताव। स्रोत: {source}।', 'supervisor.responseTitleApproved': 'डेमो में भरपाई का मसौदा मंज़ूर हुआ', 'supervisor.responseCopyApproved': '{name} / प्रस्तावित भरपाई की मात्रा जाँच के लिए दर्ज है। कोई खरीद आदेश नहीं दिया गया।', 'supervisor.statusAwaiting': 'प्रशासनिक कार्रवाई की प्रतीक्षा', 'supervisor.statusPending': 'मंज़ूरी की प्रतीक्षा', 'supervisor.statusApproved': 'डेमो में मंज़ूर', 'supervisor.approveBtn': 'मसौदा मंज़ूर करें', 'supervisor.approvedBtn': 'मसौदा मंज़ूर हुआ', 'supervisor.drawerTitle': 'स्टॉक का विवरण', 'supervisor.drawerNote': 'यह केवल डेमो स्टॉक है। वस्तु का मसौदा मंज़ूरी रिकॉर्ड बनाता है; कोई आदेश नहीं देता।', 'supervisor.drawerDraftBtn': 'भरपाई का मसौदा बनाएँ', 'supervisor.drawerNoAction': 'कार्रवाई की ज़रूरत नहीं', 'supervisor.toast.draftCreated': '{name} की भरपाई का मसौदा प्रशासनिक मंज़ूरी के लिए बना', 'supervisor.toast.approved': 'डेमो में मसौदा मंज़ूर किया गया। कोई खरीद आदेश नहीं दिया गया', 'supervisor.toast.confirmed': 'पर्यवेक्षक दृश्य में एक संकेत स्वास्थ्य कार्यकर्ता की पुष्टि की प्रतीक्षा कर रहा है',
      'safety.title': 'बनी हुई सुरक्षा सीमाएँ', 'safety.subtitle': 'साफ अवस्थाएँ उत्पाद पर भरोसा बढ़ाती हैं।', 'safety.desc': 'BUSHO कार्यकर्ता की रिपोर्ट, मानव जाँच और प्रशासनिक प्रतिक्रिया को अलग-अलग रिकॉर्ड के रूप में दिखाता है।', 'safety.state1.title': 'बताया गया स्वास्थ्य रुझान', 'safety.state1.desc': 'स्रोत और संदर्भ के साथ मानव जाँच के लिए क्षेत्र संकेत।', 'safety.state1.footer': 'स्रोत: पहचान हटाई गई कार्यकर्ता रिपोर्ट', 'safety.state2.pill': 'सबूत ज़रूरी', 'safety.state2.title': 'पुष्ट चिकित्सकीय घटना', 'safety.state2.desc': 'चिकित्सकीय निष्कर्ष के लिए अधिकृत जाँच ज़रूरी है। BUSHO यह निर्णय अपने मसौदा प्रवाह से बाहर रखता है।', 'safety.state2.footer': 'चिकित्सकीय जाँच मानव के नेतृत्व में', 'safety.state3.pill': 'मंज़ूरी ज़रूरी', 'safety.state3.title': 'प्रशासनिक कार्रवाई', 'safety.state3.desc': 'सत्यापित स्टॉक से भरपाई का मसौदा बन सकता है। अधिकृत प्रशासक ही अनुरोध मंज़ूर करता है।', 'safety.state3.footer': 'मंज़ूरी की प्रतीक्षा में मसौदा अनुरोध',
      'footer.terms': 'शर्तें', 'footer.privacy': 'गोपनीयता', 'footer.reset': 'डेमो डेटा रीसेट', 'footer.aiNote': 'अनुवाद डेमो के लिए तैयार किए गए हैं और वास्तविक उपयोग से पहले स्थानीय वक्ता की जाँच ज़रूरी है।', 'glossary.hwc': 'स्वास्थ्य और कल्याण केंद्र', 'glossary.cho': 'सामुदायिक स्वास्थ्य अधिकारी', 'glossary.ors': 'मौखिक पुनर्जलीकरण लवण', 'unit.packets': 'पैकेट', 'unit.strips': 'स्ट्रिप', 'unit.tablets': 'गोलियाँ',
      'worker.draft': 'मसौदा', 'worker.emptyTitle': 'जाँच मसौदा बनाने के लिए रिपोर्ट चलाएँ', 'worker.emptyDesc': 'पुष्टि तक खाने अस्थायी रहेंगे', 'worker.provisionalTitle': 'मसौदा जानकारी अस्थायी है', 'worker.provisionalDesc': 'हर खाने को देखें। पुष्टि तक कुछ भी दर्ज नहीं होगा।', 'worker.provisionalFlaggedTitle': 'मसौदे की मानव जाँच ज़रूरी है', 'worker.provisionalVerifiedTitle': 'रिपोर्ट समीक्षा के लिए भेजी गई', 'worker.emptyReport': 'अभी कोई रिपोर्ट नहीं लिखी गई', 'worker.toast.save': 'स्थानीय रिकवरी मसौदा सहेजा नहीं जा सका। इस टैब को खुला रखें।', 'worker.toast.extractFirst': 'पुष्टि से पहले मसौदा बनाएँ', 'draft.symptomsValue': 'बुखार: {fever} उल्लेख; दस्त: {diarrhea} उल्लेख', 'draft.quantityUnclear': 'मात्रा नहीं बताई गई', 'draft.almostFinished': 'लगभग खत्म', 'supervisor.sourceVerified': 'सत्यापित कार्यकर्ता रिपोर्ट', 'supervisor.sourceSynthetic': 'कृत्रिम स्टॉक विवरण'
    },
    mr: {
      'how.step1.desc': 'आरोग्य कार्यकर्ता स्वतःच्या शब्दांत छोटा क्षेत्र अहवाल लिहितो किंवा सांगतो।', 'how.step2.desc': 'BUSHO मोकळ्या मजकुरातून पाहण्यास सोपा मसुदा तयार करतो।', 'how.step3.desc': 'आरोग्य कार्यकर्ता प्रत्येक भाग तपासून अहवालाची पुष्टी करतो।', 'how.step4.desc': 'सत्यापित संकेतावरून भरपाईचा मसुदा मंजुरीसाठी तयार होतो।',
      'worker.channel': 'मजकूर / आवाज', 'worker.voiceBtn': 'आवाज नोंद (डेमो)', 'worker.voiceNote': 'या नमुन्यात आवाजातून लिहिणे फक्त डेमो आहे', 'worker.tryExample': 'उदाहरण वापरा', 'worker.sample.routine': 'नेहमीचा अहवाल', 'worker.sample.ambiguous': 'अस्पष्ट अहवाल', 'worker.privacy': 'रुग्णांची नावे, फोन क्रमांक किंवा निदान नोंदवू नका. फक्त एकत्रित, ओळख न पटणारी माहिती द्या।', 'worker.draftTitle': 'BUSHO ने काय समजले', 'worker.provisional': 'ही माहिती तात्पुरती आहे। प्रत्येक भाग तपासा। पुष्टी होईपर्यंत काहीही नोंदवले जाणार नाही।', 'worker.provisionalFlagged': 'तात्पुरत्या मसुद्याची मानवी तपासणी आवश्यक आहे। चिन्हांकित भाग स्पष्ट केल्यावरच अहवालाची पुष्टी करता येईल।', 'worker.provisionalVerified': 'अहवाल BUSHO मध्ये जतन करून पर्यवेक्षकाच्या पुनरावलोकनासाठी पाठवला आहे।', 'worker.confidenceKey': 'विश्वास जास्त · तपासणी आवश्यक', 'worker.engineLabel': 'नियमाधारित डेमो तपासणी · रचना तपासली', 'worker.verifyPrompt': 'आजच्या अहवालासाठी हे योग्य आहे का?', 'worker.verifyNote': 'पुष्टी केल्यावर अहवाल नियुक्त पर्यवेक्षकाच्या पुनरावलोकनासाठी पाठवला जातो। BUSHO निदान करत नाही।', 'worker.seeSupervisor': 'पर्यवेक्षकाचे दृश्य पहा', 'worker.toast.edit': 'भाग तपासा आणि दुरुस्त मसुद्याची पुष्टी करा',
      'draft.symptoms': 'सांगितलेली लक्षणे', 'draft.orsStock': 'उरलेला साठा / ORS', 'draft.ifaStock': 'उरलेला साठा / लोह आणि फॉलिक आम्ल', 'draft.clinicalStatus': 'आरोग्य स्थिती', 'draft.confidence.high': 'विश्वास जास्त', 'draft.confidence.review': 'तपासणी आवश्यक', 'draft.confidence.workerChecked': 'कार्यकर्त्याने तपासले',
      'supervisor.subtitle': 'सत्यापित साठा संकेत स्पष्ट संदर्भ आणि मानवी मंजुरीसह पाहा।', 'supervisor.priorityLabel': 'तातडीची तपासणी', 'supervisor.priorityTitle': 'रामपूर HWC मधील तापाचा संकेत', 'supervisor.priorityTrend': '+38% उल्लेख / फक्त आरोग्य कल', 'supervisor.priorityState': 'तपासणी आवश्यक', 'supervisor.metric.reports': 'मिळालेले अहवाल', 'supervisor.metric.pending': 'पुष्टीची प्रतीक्षा', 'supervisor.metric.lowStock': 'कमी साठ्याची औषधे', 'supervisor.metric.stockout': 'साठा संपण्याची शक्यता', 'supervisor.metric.trend.positive': 'सध्याचा सत्यापित अहवाल समाविष्ट', 'supervisor.metric.trend.baseline': 'कृत्रिम आधार', 'supervisor.metric.trend.warning': 'कार्यकर्त्याची तपासणी आवश्यक', 'supervisor.metric.trend.allReviewed': 'सध्याचे सर्व अहवाल तपासले', 'supervisor.metric.trend.critical': 'रामपूर HWC मध्ये', 'supervisor.metric.trend.stockout': 'ORS · सांगितलेल्या वापरावर आधारित', 'supervisor.trendLabel': 'आरोग्य संकेत तपासणी', 'supervisor.trendTitle': 'संदर्भासह सांगितलेली लक्षणे', 'supervisor.trendChip': 'तपासणी आवश्यक', 'supervisor.trendNumber': 'रामपूर HWC मधील तापाचे उल्लेख', 'supervisor.trendDesc': 'मागील ७ दिवसांच्या अहवालांशी तुलना', 'supervisor.chartLabel': '७ दिवसांपूर्वी', 'supervisor.chartToday': 'आज', 'supervisor.safetyCallout': 'हा सांगितलेला आरोग्य कल आहे। मानवी तपासणीसाठी संकेत आहे। यामुळे आजार किंवा उद्रेक सिद्ध होत नाही।', 'supervisor.inventoryLabel': 'साठ्याची माहिती', 'supervisor.inventoryTitle': 'लक्ष देण्यासारखा साठा', 'supervisor.viewAll': 'सर्व पहा', 'supervisor.inventory.ors': 'ORS पाकिटे', 'supervisor.inventory.ifa': 'लोह आणि फॉलिक आम्ल', 'supervisor.inventory.zinc': 'झिंकच्या गोळ्या', 'supervisor.inventory.healthy': 'साठा ठीक', 'supervisor.inventory.needsAttention': 'लक्ष द्या', 'supervisor.severity.critical': 'अत्यंत कमी', 'supervisor.severity.warning': 'कमी', 'supervisor.severity.safe': 'ठीक',
      'supervisor.responseTitle': 'सत्यापित अहवाल प्रशासनाच्या तपासणीसाठी उपलब्ध आहे', 'supervisor.responseCopy': 'कमी साठ्याची वस्तू निवडून भरपाईचा मसुदा तयार करा। हा डेमो खरेदी आदेश देत नाही।', 'supervisor.responseTitleDraft': 'भरपाईचा मसुदा मंजुरीसाठी तयार आहे', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} पर्यंत भरपाईचा प्रस्ताव। स्रोत: {source}।', 'supervisor.responseTitleApproved': 'डेमोमध्ये भरपाईचा मसुदा मंजूर झाला', 'supervisor.responseCopyApproved': '{name} / प्रस्तावित भरपाईची मात्रा तपासणीसाठी नोंदवली आहे। खरेदी आदेश दिला नाही।', 'supervisor.statusAwaiting': 'प्रशासकीय कृतीची प्रतीक्षा', 'supervisor.statusPending': 'मंजुरीची प्रतीक्षा', 'supervisor.statusApproved': 'डेमोमध्ये मंजूर', 'supervisor.approveBtn': 'मसुदा मंजूर करा', 'supervisor.approvedBtn': 'मसुदा मंजूर', 'supervisor.drawerTitle': 'साठ्याचा तपशील', 'supervisor.drawerNote': 'हा फक्त डेमो साठा आहे। वस्तूचा मसुदा मंजुरीची नोंद तयार करतो; आदेश देत नाही।', 'supervisor.drawerDraftBtn': 'भरपाईचा मसुदा तयार करा', 'supervisor.drawerNoAction': 'कृती आवश्यक नाही', 'supervisor.toast.draftCreated': '{name} साठी भरपाईचा मसुदा प्रशासनाच्या मंजुरीसाठी तयार झाला', 'supervisor.toast.approved': 'डेमोमध्ये मसुदा मंजूर केला। खरेदी आदेश दिला नाही', 'supervisor.toast.confirmed': 'पर्यवेक्षक दृश्यात एका संकेताची आरोग्य कार्यकर्त्याच्या पुष्टीसाठी प्रतीक्षा आहे',
      'safety.subtitle': 'स्वच्छ अवस्था उत्पादनावर विश्वास वाढवते।', 'safety.desc': 'BUSHO कार्यकर्त्याचा अहवाल, मानवी तपासणी आणि प्रशासनाची प्रतिक्रिया वेगवेगळ्या नोंदी म्हणून दाखवतो।', 'safety.state1.label': 'अवस्था ०१', 'safety.state1.pill': 'असत्यापित', 'safety.state1.title': 'सांगितलेला आरोग्य कल', 'safety.state1.desc': 'स्रोत आणि संदर्भासह मानवी तपासणीसाठी क्षेत्र संकेत।', 'safety.state1.footer': 'स्रोत: ओळख काढलेले कार्यकर्ता अहवाल', 'safety.state2.label': 'अवस्था ०२', 'safety.state2.pill': 'पुरावा आवश्यक', 'safety.state2.title': 'पुष्ट झालेली वैद्यकीय घटना', 'safety.state2.desc': 'वैद्यकीय निष्कर्षासाठी अधिकृत तपासणी आवश्यक आहे। BUSHO हा निर्णय मसुदा प्रक्रियेबाहेर ठेवतो।', 'safety.state2.footer': 'वैद्यकीय तपासणी मानवाच्या मार्गदर्शनाखाली', 'safety.state3.label': 'अवस्था ०३', 'safety.state3.pill': 'मंजुरी आवश्यक', 'safety.state3.title': 'प्रशासकीय कृती', 'safety.state3.desc': 'सत्यापित साठ्यावरून भरपाईचा मसुदा तयार होऊ शकतो। अधिकृत प्रशासकच विनंती मंजूर करतो।', 'safety.state3.footer': 'मंजुरीच्या प्रतीक्षेत मसुदा विनंती', 'footer.aiNote': 'अनुवाद डेमोसाठी तयार केले आहेत; प्रत्यक्ष वापरापूर्वी स्थानिक वक्त्याने तपासणे आवश्यक आहे।',
      'worker.provisionalFlaggedTitle': 'मसुद्याची मानवी तपासणी आवश्यक', 'worker.provisionalVerifiedTitle': 'अहवाल पुनरावलोकनासाठी पाठवला', 'worker.emptyReport': 'अजून अहवाल लिहिलेला नाही', 'worker.toast.save': 'स्थानिक पुनर्प्राप्ती मसुदा जतन करता आला नाही. हा टॅब उघडा ठेवा.', 'worker.toast.extractFirst': 'पुष्टीपूर्वी मसुदा तयार करा'
    }
  };
  Object.entries(addedTranslations).forEach(([lang, values]) => Object.assign(locales[lang], values));
  Object.entries(translationOverrides).forEach(([lang, values]) => Object.assign(locales[lang], values));
  Object.keys(locales.en).forEach(key => Object.keys(locales).filter(lang => lang !== 'en').forEach(lang => { if (!locales[lang][key]) console.warn(`Missing translation: ${lang}.${key}`); }));
  const enabledLanguages = ['en', 'hi', 'mr', 'ta', 'te', 'bn'];

  let currentLang = 'en';
  let listeners = [];

  function detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && locales[urlLang] && enabledLanguages.includes(urlLang)) return urlLang;

    const stored = localStorage.getItem('busho-lang');
    if (stored && locales[stored] && enabledLanguages.includes(stored)) return stored;

    const navLang = navigator.language || navigator.userLanguage || 'en';
    const short = navLang.split('-')[0];
    if (locales[short] && enabledLanguages.includes(short)) return short;

    return 'en';
  }

  function setLanguage(lang) {
    if (!locales[lang] || !enabledLanguages.includes(lang)) lang = 'en';
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('busho-lang', lang);

    const locale = locales[lang];
    const isLanding = document.body.classList.contains('landing-v3');
    document.title = isLanding
      ? `${westernizeDigits(locale['app.name'])} | ${westernizeDigits(locale['lp.hero.title'] || 'Frontline health reporting')}`
      : `${westernizeDigits(locale['app.name'])} | ${westernizeDigits(locale['hero.headline'].slice(0, 50))}...`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', westernizeDigits(isLanding ? locale['lp.hero.description'] : locale['hero.subtext']));

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (locale[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('data-i18n-attr')) {
            const attrs = el.getAttribute('data-i18n-attr').split(',');
            attrs.forEach(attr => {
              const [name, i18nKey] = attr.split(':');
              if (locale[i18nKey]) el.setAttribute(name, westernizeDigits(locale[i18nKey]));
            });
          } else if (el.placeholder !== undefined && locale[key]) {
            el.placeholder = westernizeDigits(locale[key]);
          }
        } else {
          el.textContent = westernizeDigits(locale[key]);
        }
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(',').forEach(attr => {
        const [name, i18nKey] = attr.split(':');
        if (locale[i18nKey]) el.setAttribute(name, westernizeDigits(locale[i18nKey]));
      });
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (locale[key]) el.innerHTML = westernizeDigits(locale[key]);
    });

    listeners.forEach(fn => fn(lang, locale));
  }

  function westernizeDigits(value) {
    const native = '०१२३४५६७८९০১২৩৪৫৬৭৮৯௦௧௨௩௪௫௬௭௮௯౦౧౨౩౪౫౬౭౮౯';
    return String(value).replace(/[०-९০-৯௦-௯౦-౯]/g, digit => String(native.indexOf(digit) % 10));
  }

  function t(key, vars = {}) {
    const locale = locales[currentLang] || locales.en;
    let str = locale[key] || locales.en[key];
    if (str === undefined) { console.warn(`Missing i18n key: ${key}`); str = key; }
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return westernizeDigits(str);
  }

  function onLanguageChange(fn) {
    listeners.push(fn);
  }

  function getLocales() {
    return enabledLanguages.slice();
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  Object.assign(locales.en, { 'voice.toast.voice': 'Voice input uses your browser\'s speech recognition service, which may send audio to the browser vendor. BUSHO does not store audio. Don\'t say names, phone numbers or diagnoses.' });
  Object.assign(locales.hi, { 'voice.toast.voice': 'वॉइस इनपुट आपके ब्राउज़र की स्पीच रेकग्निशन सेवा का उपयोग करता है, जो ऑडियो को ब्राउज़र विक्रेता को भेज सकता है। BUSHO ऑडियो स्टोर नहीं करता। नाम, फोन नंबर या निदान न बोलें।' });
  Object.assign(locales.mr, { 'voice.toast.voice': 'व्हॉइस इनपुट तुमच्या ब्राउझरची स्पीच रेकग्निशन सेवा वापरते, जी ऑडियो ब्राउझर विक्रेत्याकडे पाठवू शकते. BUSHO ऑडियो साठवत नाही. नावे, फोन नंबर किंवा निदान बोलू नका.' });
  Object.assign(locales.ta, { 'voice.toast.voice': 'குரல் உள்ளீடு உங்கள் உலாவியின் பேச்சு அங்கீகார சேவையைப் பயன்படுத்துகிறது, இது ஆடியோவை உலாவி விற்பனையாளருக்கு அனுப்பலாம். BUSHO ஆடியோவை சேமிக்காது. பெயர்கள், தொலைபேசி எண்கள் அல்லது நோயறிதல்களை சொல்லாதீர்கள்.' });
  Object.assign(locales.te, { 'voice.toast.voice': 'వాయిస్ ఇన్పుట్ మీ బ్రౌజర్ స్పీచ్ గుర్తింపు సేవను ఉపయోగిస్తుంది, ఇది ఆడియోను బ్రౌజర్ వెండార్‌కు పంపవచ్చు. BUSHO ఆడియోను నిల్వ చేయదు. పేర్లు, ఫోన్ నంబర్లు లేదా నిర్ధారణలు చెప్పవద్దు.' });
  Object.assign(locales.bn, { 'voice.toast.voice': 'ভয়েস ইনপুট আপনার ব্রাউজারের স্পিচ রিকগনিশন সার্ভিস ব্যবহার করে, যা অডিও ব্রাউজার ভেন্ডরের কাছে পাঠাতে পারে। BUSHO অডিও সংরক্ষণ করে না। নাম, ফোন নম্বর বা রোগ নির্ণয় বলবেন না।' });

  Object.assign(locales.en, { 'voice.demo': 'Start voice input', 'voice.secureContext': 'Voice input requires a secure HTTPS connection.' });
  Object.assign(locales.hi, { 'voice.demo': 'वॉइस इनपुट शुरू करें', 'voice.secureContext': 'वॉइस इनपुट के लिए सुरक्षित HTTPS कनेक्शन आवश्यक है।' });
  Object.assign(locales.mr, { 'voice.demo': 'आवाज इनपुट सुरू करा', 'voice.secureContext': 'आवाज इनपुटसाठी सुरक्षित HTTPS कनेक्शन आवश्यक आहे.' });
  Object.assign(locales.ta, { 'voice.demo': 'குரல் உள்ளீட்டைத் தொடங்கு', 'voice.secureContext': 'குரல் உள்ளீட்டிற்கு பாதுகாப்பான HTTPS இணைப்பு தேவை.' });
  Object.assign(locales.te, { 'voice.demo': 'వాయిస్ ఇన్‌పుట్ ప్రారంభించండి', 'voice.secureContext': 'వాయిస్ ఇన్‌పుట్‌కు సురక్షిత HTTPS కనెక్షన్ అవసరం.' });
  Object.assign(locales.bn, { 'voice.demo': 'ভয়েস ইনপুট শুরু করুন', 'voice.secureContext': 'ভয়েস ইনপুটের জন্য নিরাপদ HTTPS সংযোগ প্রয়োজন।' });

  Object.assign(locales.en, {
    'voice.network': 'Speech service network error. Check your connection, VPN or browser speech service.',
    'voice.languageUnsupported': 'Speech recognition does not support the selected language in this browser. Try English.',
    'voice.errorDetail': 'Speech recognition failed ({error}). Check the browser console for details.'
  });
  Object.assign(locales.hi, {
    'voice.network': 'स्पीच सेवा में नेटवर्क त्रुटि। इंटरनेट कनेक्शन, VPN या ब्राउज़र स्पीच सेवा जाँचें।',
    'voice.languageUnsupported': 'इस ब्राउज़र में चुनी गई भाषा के लिए स्पीच पहचान उपलब्ध नहीं है। अंग्रेज़ी आज़माएँ।',
    'voice.errorDetail': 'स्पीच पहचान विफल हुई ({error})। अधिक जानकारी के लिए ब्राउज़र कंसोल देखें।'
  });
  Object.assign(locales.en, {
    'voice.braveNetwork': 'Brave cannot reach its speech service here. Use Chrome for voice input, or continue by typing.',
    'voice.network': 'Speech service network error. Check your connection, VPN or browser speech service.',
    'voice.languageUnsupported': 'Speech recognition does not support this language in this browser. Try Chrome or select another language.'
  });
  Object.assign(locales.hi, {
    'voice.braveNetwork': 'इस Brave ब्राउज़र में स्पीच सेवा उपलब्ध नहीं है। वॉइस इनपुट के लिए Chrome इस्तेमाल करें या रिपोर्ट टाइप करें।',
    'voice.network': 'स्पीच सेवा में नेटवर्क त्रुटि। इंटरनेट कनेक्शन, VPN या ब्राउज़र स्पीच सेवा जाँचें।',
    'voice.languageUnsupported': 'इस ब्राउज़र में इस भाषा की स्पीच पहचान उपलब्ध नहीं है। Chrome आज़माएँ या दूसरी भाषा चुनें।'
  });
  Object.assign(locales.bn, {
    'voice.braveNetwork': 'এই Brave ব্রাউজারে স্পিচ পরিষেবা পৌঁছানো যাচ্ছে না। ভয়েস ইনপুটের জন্য Chrome ব্যবহার করুন অথবা রিপোর্ট টাইপ করুন।',
    'voice.network': 'স্পিচ পরিষেবায় নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ, VPN বা ব্রাউজারের স্পিচ পরিষেবা পরীক্ষা করুন।',
    'voice.languageUnsupported': 'এই ব্রাউজারে এই ভাষার স্পিচ শনাক্তকরণ সমর্থিত নয়। Chrome ব্যবহার করুন বা অন্য ভাষা বেছে নিন।'
  });
  Object.assign(locales.ta, {
    'voice.braveNetwork': 'இந்த Brave உலாவியில் பேச்சு சேவையை அணுக முடியவில்லை. குரல் உள்ளீட்டிற்கு Chrome பயன்படுத்தவும் அல்லது அறிக்கையைத் தட்டச்சு செய்யவும்.',
    'voice.network': 'பேச்சு சேவையில் நெட்வொர்க் பிழை. இணைய இணைப்பு, VPN அல்லது உலாவி பேச்சு சேவையைச் சரிபார்க்கவும்.',
    'voice.languageUnsupported': 'இந்த உலாவியில் இந்த மொழிக்கான பேச்சு அறிதல் ஆதரிக்கப்படவில்லை. Chrome முயற்சிக்கவும் அல்லது வேறு மொழியைத் தேர்ந்தெடுக்கவும்.'
  });
  Object.assign(locales.te, {
    'voice.braveNetwork': 'ఈ Brave బ్రౌజర్‌లో స్పీచ్ సేవను చేరుకోలేకపోయింది. వాయిస్ ఇన్‌పుట్ కోసం Chrome ఉపయోగించండి లేదా నివేదికను టైప్ చేయండి.',
    'voice.network': 'స్పీచ్ సేవలో నెట్‌వర్క్ లోపం. ఇంటర్నెట్ కనెక్షన్, VPN లేదా బ్రౌజర్ స్పీచ్ సేవను తనిఖీ చేయండి.',
    'voice.languageUnsupported': 'ఈ బ్రౌజర్‌లో ఈ భాషకు స్పీచ్ గుర్తింపు మద్దతు లేదు. Chrome ప్రయత్నించండి లేదా మరో భాష ఎంచుకోండి.'
  });
  Object.assign(locales.mr, {
    'voice.braveNetwork': 'या Brave ब्राउझरमध्ये स्पीच सेवा उपलब्ध नाही. व्हॉइस इनपुटसाठी Chrome वापरा किंवा अहवाल टाइप करा.',
    'voice.network': 'स्पीच सेवेत नेटवर्क त्रुटी. इंटरनेट कनेक्शन, VPN किंवा ब्राउझर स्पीच सेवा तपासा.',
    'voice.languageUnsupported': 'या ब्राउझरमध्ये या भाषेचे स्पीच ओळख समर्थित नाही. Chrome वापरा किंवा दुसरी भाषा निवडा.'
  });

  Object.assign(locales.en, { 'draft.reportedDetails': "Reported health details", 'draft.reportedMedicines': "Medicines and supplies mentioned", 'draft.reportedQuantities': "Numbers and quantities mentioned", 'draft.originalReport': "Original field report", 'draft.notDetected': "Not confidently detected — review the original report", 'voice.captureHint': "Voice capture started. Speak naturally; press the microphone again when finished." });
  Object.assign(locales.hi, { 'draft.reportedDetails': "बताई गई स्वास्थ्य संबंधी जानकारी", 'draft.reportedMedicines': "बताई गई दवाइयाँ और सामग्री", 'draft.reportedQuantities': "बताई गई संख्याएँ और मात्रा", 'draft.originalReport': "मूल फील्ड रिपोर्ट", 'draft.notDetected': "विश्वसनीय रूप से पहचान नहीं हुई — मूल रिपोर्ट जाँचें", 'voice.captureHint': "वॉइस रिकॉर्डिंग शुरू हो गई है। आराम से बोलें; समाप्त करने के लिए माइक्रोफ़ोन फिर दबाएँ।" });
  Object.assign(locales.bn, { 'draft.reportedDetails': "জানানো স্বাস্থ্য-সংক্রান্ত তথ্য", 'draft.reportedMedicines': "উল্লেখ করা ওষুধ ও সামগ্রী", 'draft.reportedQuantities': "উল্লেখ করা সংখ্যা ও পরিমাণ", 'draft.originalReport': "মূল ফিল্ড রিপোর্ট", 'draft.notDetected': "নির্ভরযোগ্যভাবে শনাক্ত হয়নি — মূল রিপোর্ট দেখুন", 'voice.captureHint': "ভয়েস রেকর্ডিং শুরু হয়েছে। স্বাভাবিকভাবে বলুন; শেষ করতে মাইক্রোফোন আবার চাপুন।" });
  Object.assign(locales.ta, { 'draft.reportedDetails': "தெரிவிக்கப்பட்ட உடல்நல விவரங்கள்", 'draft.reportedMedicines': "குறிப்பிடப்பட்ட மருந்துகள் மற்றும் பொருட்கள்", 'draft.reportedQuantities': "குறிப்பிடப்பட்ட எண்கள் மற்றும் அளவுகள்", 'draft.originalReport': "அசல் கள அறிக்கை", 'draft.notDetected': "நம்பகமாகக் கண்டறியப்படவில்லை — அசல் அறிக்கையைச் சரிபார்க்கவும்", 'voice.captureHint': "குரல் பதிவு தொடங்கியது. இயல்பாகப் பேசுங்கள்; முடிக்க மைக்ரோஃபோனை மீண்டும் அழுத்தவும்." });
  Object.assign(locales.te, { 'draft.reportedDetails': "తెలిపిన ఆరోగ్య వివరాలు", 'draft.reportedMedicines': "పేర్కొన్న మందులు మరియు సరఫరాలు", 'draft.reportedQuantities': "పేర్కొన్న సంఖ్యలు మరియు పరిమాణాలు", 'draft.originalReport': "అసలు ఫీల్డ్ నివేదిక", 'draft.notDetected': "నమ్మకంగా గుర్తించబడలేదు — అసలు నివేదికను పరిశీలించండి", 'voice.captureHint': "వాయిస్ రికార్డింగ్ ప్రారంభమైంది. సహజంగా మాట్లాడండి; ముగించడానికి మైక్రోఫోన్‌ను మళ్లీ నొక్కండి." });
  Object.assign(locales.mr, { 'draft.reportedDetails': "नोंदवलेली आरोग्यविषयक माहिती", 'draft.reportedMedicines': "नोंदवलेली औषधे आणि साहित्य", 'draft.reportedQuantities': "नोंदवलेले आकडे आणि प्रमाण", 'draft.originalReport': "मूळ क्षेत्रीय अहवाल", 'draft.notDetected': "विश्वासार्हपणे ओळखले नाही — मूळ अहवाल तपासा", 'voice.captureHint': "व्हॉइस रेकॉर्डिंग सुरू झाले आहे. नैसर्गिकपणे बोला; थांबवण्यासाठी मायक्रोफोन पुन्हा दाबा." });


  // Structured clinical review labels (catalog matching is independent of UI language).
  Object.assign(locales.en, {
    'draft.diseaseTable':'Reported diseases and patient counts',
    'draft.medicineTable':'Medicine stock and quantities'
  });
  Object.assign(locales.hi, {
    'draft.diseaseTable':'रिपोर्ट की गई बीमारियाँ और मरीजों की संख्या',
    'draft.medicineTable':'दवाइयों का स्टॉक और मात्रा'
  });
  Object.assign(locales.ta, {
    'draft.diseaseTable':'தெரிவிக்கப்பட்ட நோய்கள் மற்றும் நோயாளிகள் எண்ணிக்கை',
    'draft.medicineTable':'மருந்து இருப்பு மற்றும் அளவுகள்'
  });
  Object.assign(locales.te, {
    'draft.diseaseTable':'నివేదించిన వ్యాధులు మరియు రోగుల సంఖ్య',
    'draft.medicineTable':'మందుల నిల్వ మరియు పరిమాణాలు'
  });
  Object.assign(locales.bn, {
    'draft.diseaseTable':'রিপোর্ট করা রোগ ও রোগীর সংখ্যা',
    'draft.medicineTable':'ওষুধের মজুত ও পরিমাণ'
  });
  Object.assign(locales.mr, {
    'draft.diseaseTable':'नोंदवलेले आजार आणि रुग्णांची संख्या',
    'draft.medicineTable':'औषधांचा साठा आणि प्रमाण'
  });


  // Public landing page copy, translated for all six supported interface languages.
  Object.assign(locales.en, {
    "lp.nav.platform": "Platform",
    "lp.nav.workflow": "How it works",
    "lp.nav.principles": "Safety principles",
    "lp.nav.signin": "Sign in",
    "lp.hero.eyebrow": "A clearer first mile for public health operations",
    "lp.hero.title": "Field reports deserve a clearer path to action.",
    "lp.hero.description": "BUSHO helps frontline health workers turn everyday observations into structured drafts that people can review, correct and confirm.",
    "lp.hero.cta": "Explore the live demo",
    "lp.hero.secondary": "See the workflow",
    "lp.hero.proof": "Human review stays in the loop. BUSHO does not diagnose or place orders.",
    "lp.preview.label": "WORKFLOW PREVIEW",
    "lp.preview.synthetic": "SYNTHETIC EXAMPLE",
    "lp.preview.workspace": "Health worker workspace",
    "lp.preview.step": "STEP 01 / FIELD UPDATE",
    "lp.preview.heading": "A report in the worker’s words",
    "lp.preview.original": "ORIGINAL NOTE",
    "lp.preview.sample": "Sample report",
    "lp.preview.structured": "STRUCTURED FOR REVIEW",
    "lp.preview.field": "FIELD",
    "lp.preview.observation": "OBSERVATION",
    "lp.preview.state": "STATE",
    "lp.preview.condition": "Condition",
    "lp.preview.review": "Review",
    "lp.preview.stock": "Medicine stock",
    "lp.preview.source": "Source note",
    "lp.preview.kept": "Original kept",
    "lp.preview.linked": "Linked",
    "lp.preview.provisional": "Provisional draft",
    "lp.preview.human": "Awaiting worker confirmation",
    "lp.preview.caption": "From a spoken or written observation to a reviewable operational record.",
    "lp.hero.bottom": "BUILT AROUND THE FRONTLINE WORKFLOW",
    "lp.hero.stage1": "Capture",
    "lp.hero.stage2": "Structure",
    "lp.hero.stage3": "Verify",
    "lp.hero.stage4": "Review",
    "lp.statement.kicker": "THE PRINCIPLE",
    "lp.statement.title": "Better information starts with the people closest to the community.",
    "lp.statement.copy": "A practical reporting layer should preserve what was observed, make it easier to review and leave important decisions with people.",
    "lp.workflow.kicker": "FROM FIELD NOTE TO REVIEW",
    "lp.workflow.title": "One report. A more useful handoff.",
    "lp.workflow.intro": "BUSHO keeps the original observation close to the structured draft, so workers can check what the system understood before a supervisor sees it.",
    "lp.workflow.step1.title": "Capture the field update",
    "lp.workflow.step1.copy": "Workers describe what they observed in everyday language, through text or supported browser voice input.",
    "lp.workflow.step1.foot": "TEXT OR VOICE INPUT",
    "lp.workflow.step2.title": "Structure the observation",
    "lp.workflow.step2.copy": "BUSHO proposes condition and medicine fields while keeping the source report available for comparison.",
    "lp.workflow.step2.foot": "EDITABLE DRAFT",
    "lp.workflow.step3.title": "Verify before handoff",
    "lp.workflow.step3.copy": "The health worker corrects and confirms the draft. Supervisors review the resulting operational record.",
    "lp.workflow.step3.foot": "HUMAN CONFIRMATION",
    "lp.platform.kicker": "DESIGNED FOR TWO CONNECTED ROLES",
    "lp.platform.title": "A shared picture of the work. Clear responsibility at every step.",
    "lp.platform.copy": "Field workers and supervisors see different parts of the same reporting flow, with review and approval kept explicit.",
    "lp.platform.worker.title": "For health workers",
    "lp.platform.worker.copy": "A focused place to report an observation, inspect the draft and confirm what should be handed forward.",
    "lp.platform.worker.link": "Open worker workspace",
    "lp.platform.supervisor.title": "For supervisors",
    "lp.platform.supervisor.copy": "A consolidated view of confirmed field reports, operational signals and follow up that still needs review.",
    "lp.platform.supervisor.link": "Open supervisor workspace",
    "lp.platform.note": "All dashboard figures and records shown here are fictional examples from the prototype.",
    "lp.principles.kicker": "TRUST IS A WORKFLOW DECISION",
    "lp.principles.title": "Useful signals. Clear boundaries.",
    "lp.principles.copy": "Health reporting needs careful handling. BUSHO keeps observation, verification and administrative action as distinct steps.",
    "lp.principles.one.title": "A report is not a diagnosis",
    "lp.principles.one.copy": "The prototype organizes reported observations. It does not diagnose, triage or recommend treatment.",
    "lp.principles.two.title": "A draft is not a verified record",
    "lp.principles.two.copy": "Workers can review, correct and confirm the proposed fields before the record is treated as verified.",
    "lp.principles.three.title": "A stock signal is not an order",
    "lp.principles.three.copy": "The supervisor can review an illustrative replenishment draft. The demo does not place orders or connect to live inventory.",
    "lp.tagline.kicker": "THE BUSHO APPROACH",
    "lp.tagline.title": "Keep the human close to the information. Keep the decision with the human.",
    "lp.faq.kicker": "BEFORE YOU EXPLORE",
    "lp.faq.title": "A few important details.",
    "lp.faq.q1": "Is BUSHO a live government health platform?",
    "lp.faq.a1": "No. The current website is a synthetic data prototype. It is not connected to government health systems or facility databases.",
    "lp.faq.q2": "Does BUSHO diagnose diseases?",
    "lp.faq.a2": "No. It structures reported observations for human review. It does not make clinical decisions.",
    "lp.faq.q3": "Can workers report by voice?",
    "lp.faq.a3": "The prototype supports browser native speech input where available. Recognition depends on browser and language support.",
    "lp.faq.q4": "What data should I enter?",
    "lp.faq.a4": "Use synthetic examples only. Do not enter real patient names, phone numbers, identifiers or sensitive health information.",
    "lp.final.kicker": "EXPLORE THE PROTOTYPE",
    "lp.final.title": "See how a field report moves through BUSHO.",
    "lp.final.copy": "Explore the worker and supervisor views using synthetic demo data.",
    "lp.final.cta": "Enter the demo workspace",
    "lp.footer.note": "A workflow prototype designed around human review.",
    "lp.footer.status": "Prototype only. Synthetic data. Not for real patient information."
  });
  Object.assign(locales.hi, {
    "lp.nav.platform": "प्लेटफ़ॉर्म",
    "lp.nav.workflow": "कैसे काम करता है",
    "lp.nav.principles": "सुरक्षा सिद्धांत",
    "lp.nav.signin": "साइन इन",
    "lp.hero.eyebrow": "सार्वजनिक स्वास्थ्य कार्यों के लिए बेहतर शुरुआती व्यवस्था",
    "lp.hero.title": "मैदानी रिपोर्ट से सही कार्रवाई तक का रास्ता स्पष्ट होना चाहिए।",
    "lp.hero.description": "BUSHO फ्रंटलाइन स्वास्थ्यकर्मियों की रोज़मर्रा की टिप्पणियों को ऐसे व्यवस्थित ड्राफ़्ट में बदलने में मदद करता है जिन्हें लोग जाँच, सुधार और पुष्टि कर सकते हैं।",
    "lp.hero.cta": "डेमो देखें",
    "lp.hero.secondary": "कार्यप्रवाह देखें",
    "lp.hero.proof": "हर रिकॉर्ड में मानवीय समीक्षा शामिल है। BUSHO न तो बीमारी का निदान करता है और न ही ऑर्डर देता है।",
    "lp.preview.label": "कार्यप्रवाह का पूर्वावलोकन",
    "lp.preview.synthetic": "काल्पनिक उदाहरण",
    "lp.preview.workspace": "स्वास्थ्यकर्मी कार्यक्षेत्र",
    "lp.preview.step": "चरण 01 / मैदानी अपडेट",
    "lp.preview.heading": "कर्मचारी के अपने शब्दों में रिपोर्ट",
    "lp.preview.original": "मूल टिप्पणी",
    "lp.preview.sample": "नमूना रिपोर्ट",
    "lp.preview.structured": "समीक्षा के लिए व्यवस्थित",
    "lp.preview.field": "फ़ील्ड",
    "lp.preview.observation": "अवलोकन",
    "lp.preview.state": "स्थिति",
    "lp.preview.condition": "स्वास्थ्य स्थिति",
    "lp.preview.review": "समीक्षा करें",
    "lp.preview.stock": "दवा का स्टॉक",
    "lp.preview.source": "मूल टिप्पणी",
    "lp.preview.kept": "मूल सुरक्षित",
    "lp.preview.linked": "जुड़ा हुआ",
    "lp.preview.provisional": "अस्थायी ड्राफ़्ट",
    "lp.preview.human": "कर्मचारी की पुष्टि बाकी",
    "lp.preview.caption": "बोले या लिखे गए अवलोकन से समीक्षा योग्य रिकॉर्ड तक।",
    "lp.hero.bottom": "फ्रंटलाइन कार्यप्रवाह के अनुसार बनाया गया",
    "lp.hero.stage1": "दर्ज करें",
    "lp.hero.stage2": "व्यवस्थित करें",
    "lp.hero.stage3": "जाँचें",
    "lp.hero.stage4": "समीक्षा करें",
    "lp.statement.kicker": "मूल विचार",
    "lp.statement.title": "बेहतर जानकारी की शुरुआत समुदाय के सबसे करीब काम करने वाले लोगों से होती है।",
    "lp.statement.copy": "एक उपयोगी रिपोर्टिंग व्यवस्था को मूल अवलोकन सुरक्षित रखना चाहिए, समीक्षा आसान बनानी चाहिए और महत्वपूर्ण निर्णय लोगों के पास ही रहने देने चाहिए।",
    "lp.workflow.kicker": "मैदानी नोट से समीक्षा तक",
    "lp.workflow.title": "एक रिपोर्ट। बेहतर जानकारी का हस्तांतरण।",
    "lp.workflow.intro": "BUSHO मूल टिप्पणी को व्यवस्थित ड्राफ़्ट के साथ रखता है, ताकि पर्यवेक्षक तक पहुँचने से पहले कर्मचारी देख सके कि सिस्टम ने क्या समझा।",
    "lp.workflow.step1.title": "मैदानी अपडेट दर्ज करें",
    "lp.workflow.step1.copy": "कर्मचारी रोज़मर्रा की भाषा में टेक्स्ट या समर्थित ब्राउज़र वॉइस इनपुट से अपना अवलोकन बताते हैं।",
    "lp.workflow.step1.foot": "टेक्स्ट या वॉइस इनपुट",
    "lp.workflow.step2.title": "अवलोकन को व्यवस्थित करें",
    "lp.workflow.step2.copy": "BUSHO बीमारी और दवा से जुड़े फ़ील्ड सुझाता है और मूल रिपोर्ट को तुलना के लिए उपलब्ध रखता है।",
    "lp.workflow.step2.foot": "संपादन योग्य ड्राफ़्ट",
    "lp.workflow.step3.title": "आगे भेजने से पहले पुष्टि करें",
    "lp.workflow.step3.copy": "स्वास्थ्यकर्मी ड्राफ़्ट को सुधारकर पुष्टि करता है। इसके बाद पर्यवेक्षक परिचालन रिकॉर्ड की समीक्षा करता है।",
    "lp.workflow.step3.foot": "मानवीय पुष्टि",
    "lp.platform.kicker": "दो जुड़े हुए कार्यक्षेत्र",
    "lp.platform.title": "काम की साझा तस्वीर। हर चरण में स्पष्ट ज़िम्मेदारी।",
    "lp.platform.copy": "फील्ड कर्मचारी और पर्यवेक्षक एक ही रिपोर्टिंग प्रक्रिया के अलग हिस्से देखते हैं, जहाँ समीक्षा और अनुमोदन स्पष्ट रहते हैं।",
    "lp.platform.worker.title": "स्वास्थ्यकर्मियों के लिए",
    "lp.platform.worker.copy": "अवलोकन दर्ज करने, ड्राफ़्ट जाँचने और आगे भेजे जाने वाले रिकॉर्ड की पुष्टि करने के लिए केंद्रित कार्यक्षेत्र।",
    "lp.platform.worker.link": "कर्मचारी कार्यक्षेत्र खोलें",
    "lp.platform.supervisor.title": "पर्यवेक्षकों के लिए",
    "lp.platform.supervisor.copy": "पुष्ट रिपोर्ट, परिचालन संकेत और समीक्षा की प्रतीक्षा कर रहे मामलों का एकीकृत दृश्य।",
    "lp.platform.supervisor.link": "पर्यवेक्षक कार्यक्षेत्र खोलें",
    "lp.platform.note": "यहाँ दिखाए गए सभी आँकड़े और रिकॉर्ड प्रोटोटाइप के काल्पनिक उदाहरण हैं।",
    "lp.principles.kicker": "विश्वास भी कार्यप्रवाह का हिस्सा है",
    "lp.principles.title": "उपयोगी संकेत। स्पष्ट सीमाएँ।",
    "lp.principles.copy": "स्वास्थ्य रिपोर्टिंग में सावधानी आवश्यक है। BUSHO अवलोकन, पुष्टि और प्रशासनिक कार्रवाई को अलग चरणों में रखता है।",
    "lp.principles.one.title": "रिपोर्ट बीमारी का निदान नहीं है",
    "lp.principles.one.copy": "प्रोटोटाइप बताई गई जानकारी को व्यवस्थित करता है। यह निदान, प्राथमिकता तय या इलाज की सलाह नहीं देता।",
    "lp.principles.two.title": "ड्राफ़्ट पुष्ट रिकॉर्ड नहीं है",
    "lp.principles.two.copy": "रिकॉर्ड को सत्यापित मानने से पहले कर्मचारी सुझाए गए फ़ील्ड की समीक्षा, सुधार और पुष्टि कर सकता है।",
    "lp.principles.three.title": "स्टॉक संकेत ऑर्डर नहीं है",
    "lp.principles.three.copy": "पर्यवेक्षक नमूना रीस्टॉक ड्राफ़्ट की समीक्षा कर सकता है। डेमो कोई ऑर्डर नहीं देता और लाइव इन्वेंटरी से जुड़ा नहीं है।",
    "lp.tagline.kicker": "BUSHO का तरीका",
    "lp.tagline.title": "जानकारी के साथ इंसान को बनाए रखें। निर्णय भी इंसान के पास रहने दें।",
    "lp.faq.kicker": "डेमो देखने से पहले",
    "lp.faq.title": "कुछ ज़रूरी बातें।",
    "lp.faq.q1": "क्या BUSHO सरकारी स्वास्थ्य प्लेटफ़ॉर्म से जुड़ा है?",
    "lp.faq.a1": "नहीं। यह सिंथेटिक डेटा वाला प्रोटोटाइप है। यह सरकारी स्वास्थ्य प्रणालियों या स्वास्थ्य केंद्रों के डेटाबेस से जुड़ा नहीं है।",
    "lp.faq.q2": "क्या BUSHO बीमारियों का निदान करता है?",
    "lp.faq.a2": "नहीं। यह रिपोर्ट किए गए अवलोकनों को मानवीय समीक्षा के लिए व्यवस्थित करता है। यह नैदानिक निर्णय नहीं लेता।",
    "lp.faq.q3": "क्या कर्मचारी आवाज़ से रिपोर्ट कर सकते हैं?",
    "lp.faq.a3": "जहाँ ब्राउज़र समर्थन उपलब्ध है, वहाँ प्रोटोटाइप वॉइस इनपुट का उपयोग करता है। पहचान ब्राउज़र और भाषा समर्थन पर निर्भर करती है।",
    "lp.faq.q4": "मुझे कौन सा डेटा दर्ज करना चाहिए?",
    "lp.faq.a4": "केवल काल्पनिक उदाहरणों का उपयोग करें। वास्तविक मरीजों के नाम, फ़ोन नंबर, पहचान या संवेदनशील स्वास्थ्य जानकारी दर्ज न करें।",
    "lp.final.kicker": "प्रोटोटाइप देखें",
    "lp.final.title": "देखें कि मैदानी रिपोर्ट BUSHO में कैसे आगे बढ़ती है।",
    "lp.final.copy": "सिंथेटिक डेमो डेटा का उपयोग करके कर्मचारी और पर्यवेक्षक दृश्य देखें।",
    "lp.final.cta": "डेमो कार्यक्षेत्र में जाएँ",
    "lp.footer.note": "मानवीय समीक्षा पर आधारित कार्यप्रवाह प्रोटोटाइप।",
    "lp.footer.status": "केवल प्रोटोटाइप। सिंथेटिक डेटा। वास्तविक मरीजों की जानकारी के लिए नहीं।"
  });
  Object.assign(locales.bn, {
    "lp.nav.platform": "প্ল্যাটফর্ম",
    "lp.nav.workflow": "যেভাবে কাজ করে",
    "lp.nav.principles": "নিরাপত্তার নীতি",
    "lp.nav.signin": "সাইন ইন",
    "lp.hero.eyebrow": "জনস্বাস্থ্য ব্যবস্থাপনার জন্য আরও পরিষ্কার প্রথম ধাপ",
    "lp.hero.title": "মাঠের রিপোর্ট থেকে কাজের সিদ্ধান্তে পৌঁছানোর পথটি স্পষ্ট হওয়া দরকার।",
    "lp.hero.description": "BUSHO সামনের সারির স্বাস্থ্যকর্মীদের দৈনন্দিন পর্যবেক্ষণকে এমন খসড়ায় সাজাতে সাহায্য করে, যা মানুষ পর্যালোচনা, সংশোধন ও নিশ্চিত করতে পারেন।",
    "lp.hero.cta": "ডেমো দেখুন",
    "lp.hero.secondary": "কাজের ধাপ দেখুন",
    "lp.hero.proof": "প্রতিটি ধাপে মানুষের পর্যালোচনা থাকে। BUSHO রোগ নির্ণয় করে না বা অর্ডার দেয় না।",
    "lp.preview.label": "কাজের ধাপের নমুনা",
    "lp.preview.synthetic": "কাল্পনিক উদাহরণ",
    "lp.preview.workspace": "স্বাস্থ্যকর্মীর কর্মক্ষেত্র",
    "lp.preview.step": "ধাপ ০১ / মাঠের আপডেট",
    "lp.preview.heading": "কর্মীর নিজের ভাষায় রিপোর্ট",
    "lp.preview.original": "মূল নোট",
    "lp.preview.sample": "নমুনা রিপোর্ট",
    "lp.preview.structured": "পর্যালোচনার জন্য সাজানো",
    "lp.preview.field": "বিষয়",
    "lp.preview.observation": "পর্যবেক্ষণ",
    "lp.preview.state": "অবস্থা",
    "lp.preview.condition": "স্বাস্থ্য সমস্যা",
    "lp.preview.review": "পর্যালোচনা",
    "lp.preview.stock": "ওষুধের মজুত",
    "lp.preview.source": "মূল নোট",
    "lp.preview.kept": "মূল রাখা হয়েছে",
    "lp.preview.linked": "সংযুক্ত",
    "lp.preview.provisional": "অস্থায়ী খসড়া",
    "lp.preview.human": "স্বাস্থ্যকর্মীর নিশ্চিতকরণ বাকি",
    "lp.preview.caption": "মৌখিক বা লিখিত পর্যবেক্ষণ থেকে পর্যালোচনাযোগ্য রেকর্ডে।",
    "lp.hero.bottom": "মাঠপর্যায়ের কাজকে কেন্দ্র করে তৈরি",
    "lp.hero.stage1": "নথিভুক্ত",
    "lp.hero.stage2": "সাজানো",
    "lp.hero.stage3": "যাচাই",
    "lp.hero.stage4": "পর্যালোচনা",
    "lp.statement.kicker": "মূল ভাবনা",
    "lp.statement.title": "ভালো তথ্যের শুরু হয় সম্প্রদায়ের সবচেয়ে কাছের মানুষদের কাছ থেকে।",
    "lp.statement.copy": "একটি কার্যকর রিপোর্টিং ব্যবস্থায় মূল পর্যবেক্ষণ অক্ষুণ্ণ থাকা, পর্যালোচনা সহজ হওয়া এবং গুরুত্বপূর্ণ সিদ্ধান্ত মানুষের হাতেই থাকা উচিত।",
    "lp.workflow.kicker": "মাঠের নোট থেকে পর্যালোচনা",
    "lp.workflow.title": "একটি রিপোর্ট। আরও কার্যকর তথ্য হস্তান্তর।",
    "lp.workflow.intro": "BUSHO মূল পর্যবেক্ষণকে সাজানো খসড়ার পাশে রাখে, যাতে সুপারভাইজার দেখার আগে কর্মী বুঝতে পারেন সিস্টেম কী ধরেছে।",
    "lp.workflow.step1.title": "মাঠের আপডেট নথিভুক্ত করুন",
    "lp.workflow.step1.copy": "কর্মীরা সাধারণ ভাষায় লেখা বা সমর্থিত ব্রাউজার ভয়েস ইনপুটের মাধ্যমে পর্যবেক্ষণ জানান।",
    "lp.workflow.step1.foot": "লেখা বা ভয়েস ইনপুট",
    "lp.workflow.step2.title": "পর্যবেক্ষণ সাজান",
    "lp.workflow.step2.copy": "BUSHO রোগের উল্লেখ ও ওষুধের তথ্যের ক্ষেত্র প্রস্তাব করে এবং তুলনার জন্য মূল রিপোর্ট রেখে দেয়।",
    "lp.workflow.step2.foot": "সম্পাদনাযোগ্য খসড়া",
    "lp.workflow.step3.title": "হস্তান্তরের আগে নিশ্চিত করুন",
    "lp.workflow.step3.copy": "স্বাস্থ্যকর্মী খসড়া সংশোধন ও নিশ্চিত করেন। এরপর সুপারভাইজার কার্যক্রমের রেকর্ড পর্যালোচনা করেন।",
    "lp.workflow.step3.foot": "মানবীয় নিশ্চিতকরণ",
    "lp.platform.kicker": "দুটি সংযুক্ত ভূমিকার জন্য তৈরি",
    "lp.platform.title": "কাজের একটি যৌথ চিত্র। প্রতিটি ধাপে স্পষ্ট দায়িত্ব।",
    "lp.platform.copy": "মাঠকর্মী ও সুপারভাইজার একই রিপোর্টিং প্রক্রিয়ার আলাদা অংশ দেখেন, যেখানে পর্যালোচনা ও অনুমোদন স্পষ্ট থাকে।",
    "lp.platform.worker.title": "স্বাস্থ্যকর্মীদের জন্য",
    "lp.platform.worker.copy": "পর্যবেক্ষণ নথিভুক্ত করা, খসড়া দেখা এবং এগিয়ে পাঠানোর আগে নিশ্চিত করার জন্য নির্দিষ্ট কর্মক্ষেত্র।",
    "lp.platform.worker.link": "কর্মীর কর্মক্ষেত্র খুলুন",
    "lp.platform.supervisor.title": "সুপারভাইজারদের জন্য",
    "lp.platform.supervisor.copy": "নিশ্চিত রিপোর্ট, কার্যক্রমের সংকেত এবং পর্যালোচনার অপেক্ষায় থাকা বিষয়গুলির একত্রিত দৃশ্য।",
    "lp.platform.supervisor.link": "সুপারভাইজারের কর্মক্ষেত্র খুলুন",
    "lp.platform.note": "এখানে দেখানো সব সংখ্যা ও রেকর্ড প্রোটোটাইপের কাল্পনিক উদাহরণ।",
    "lp.principles.kicker": "বিশ্বাসও কাজের প্রক্রিয়ার অংশ",
    "lp.principles.title": "কার্যকর সংকেত। স্পষ্ট সীমা।",
    "lp.principles.copy": "স্বাস্থ্য রিপোর্টিংয়ে সতর্কতা জরুরি। BUSHO পর্যবেক্ষণ, যাচাই এবং প্রশাসনিক পদক্ষেপকে আলাদা ধাপে রাখে।",
    "lp.principles.one.title": "রিপোর্ট রোগ নির্ণয় নয়",
    "lp.principles.one.copy": "প্রোটোটাইপে জানানো পর্যবেক্ষণ সাজানো হয়। এটি রোগ নির্ণয়, ট্রায়াজ বা চিকিৎসার পরামর্শ দেয় না।",
    "lp.principles.two.title": "খসড়া যাচাইকৃত রেকর্ড নয়",
    "lp.principles.two.copy": "রেকর্ড যাচাইকৃত হওয়ার আগে কর্মীরা প্রস্তাবিত তথ্য পর্যালোচনা, সংশোধন ও নিশ্চিত করতে পারেন।",
    "lp.principles.three.title": "মজুতের সংকেত অর্ডার নয়",
    "lp.principles.three.copy": "সুপারভাইজার নমুনা পুনরায় সরবরাহের খসড়া পর্যালোচনা করতে পারেন। ডেমো অর্ডার দেয় না বা লাইভ মজুতের সঙ্গে যুক্ত নয়।",
    "lp.tagline.kicker": "BUSHO-র পদ্ধতি",
    "lp.tagline.title": "তথ্যের পাশে মানুষকে রাখুন। সিদ্ধান্তও মানুষের হাতেই রাখুন।",
    "lp.faq.kicker": "ডেমো দেখার আগে",
    "lp.faq.title": "কিছু গুরুত্বপূর্ণ তথ্য।",
    "lp.faq.q1": "BUSHO কি সরকারি স্বাস্থ্য প্ল্যাটফর্মের সঙ্গে যুক্ত?",
    "lp.faq.a1": "না। বর্তমান ওয়েবসাইটটি সিন্থেটিক ডেটার প্রোটোটাইপ। এটি সরকারি স্বাস্থ্য ব্যবস্থা বা স্বাস্থ্যকেন্দ্রের ডেটাবেসের সঙ্গে যুক্ত নয়।",
    "lp.faq.q2": "BUSHO কি রোগ নির্ণয় করে?",
    "lp.faq.a2": "না। এটি মানুষের পর্যালোচনার জন্য জানানো পর্যবেক্ষণ সাজায়। এটি চিকিৎসাগত সিদ্ধান্ত নেয় না।",
    "lp.faq.q3": "স্বাস্থ্যকর্মীরা কি কণ্ঠে রিপোর্ট করতে পারেন?",
    "lp.faq.a3": "যেখানে ব্রাউজার সমর্থন আছে, সেখানে প্রোটোটাইপ ভয়েস ইনপুট ব্যবহার করে। স্বীকৃতি ব্রাউজার ও ভাষার সমর্থনের ওপর নির্ভর করে।",
    "lp.faq.q4": "আমি কী ধরনের তথ্য দেব?",
    "lp.faq.a4": "শুধু কাল্পনিক উদাহরণ ব্যবহার করুন। আসল রোগীর নাম, ফোন নম্বর, পরিচয় বা সংবেদনশীল স্বাস্থ্য তথ্য দেবেন না।",
    "lp.final.kicker": "প্রোটোটাইপ দেখুন",
    "lp.final.title": "দেখুন মাঠের রিপোর্ট BUSHO-তে কীভাবে এগিয়ে যায়।",
    "lp.final.copy": "সিন্থেটিক ডেমো ডেটা ব্যবহার করে স্বাস্থ্যকর্মী ও সুপারভাইজারের দৃশ্য দেখুন।",
    "lp.final.cta": "ডেমো কর্মক্ষেত্রে প্রবেশ করুন",
    "lp.footer.note": "মানবীয় পর্যালোচনাকে কেন্দ্র করে তৈরি কাজের প্রোটোটাইপ।",
    "lp.footer.status": "শুধু প্রোটোটাইপ। সিন্থেটিক ডেটা। আসল রোগীর তথ্যের জন্য নয়।"
  });
  Object.assign(locales.ta, {
    "lp.nav.platform": "தளம்",
    "lp.nav.workflow": "எப்படி செயல்படுகிறது",
    "lp.nav.principles": "பாதுகாப்பு கொள்கைகள்",
    "lp.nav.signin": "உள்நுழை",
    "lp.hero.eyebrow": "பொது சுகாதார செயல்பாடுகளுக்கான தெளிவான முதல் படி",
    "lp.hero.title": "கள அறிக்கைகள் செயல்பாட்டை அடையும் பாதை தெளிவாக இருக்க வேண்டும்.",
    "lp.hero.description": "முன்கள சுகாதாரப் பணியாளர்களின் அன்றாடக் கவனிப்புகளை மக்கள் மதிப்பாய்வு செய்து திருத்தி உறுதிப்படுத்தக்கூடிய கட்டமைக்கப்பட்ட வரைவுகளாக மாற்ற BUSHO உதவுகிறது.",
    "lp.hero.cta": "டெமோவைப் பாருங்கள்",
    "lp.hero.secondary": "செயல்முறையைப் பாருங்கள்",
    "lp.hero.proof": "ஒவ்வொரு பதிவிலும் மனித மதிப்பாய்வு உள்ளது. BUSHO நோயறிதல் செய்யாது; ஆர்டர்களும் இடாது.",
    "lp.preview.label": "செயல்முறை முன்னோட்டம்",
    "lp.preview.synthetic": "கற்பனை எடுத்துக்காட்டு",
    "lp.preview.workspace": "சுகாதாரப் பணியாளர் பணியிடம்",
    "lp.preview.step": "படி 01 / களப் புதுப்பிப்பு",
    "lp.preview.heading": "பணியாளரின் சொற்களில் அறிக்கை",
    "lp.preview.original": "அசல் குறிப்பு",
    "lp.preview.sample": "மாதிரி அறிக்கை",
    "lp.preview.structured": "மதிப்பாய்வுக்காக ஒழுங்குபடுத்தப்பட்டது",
    "lp.preview.field": "புலம்",
    "lp.preview.observation": "கவனிப்பு",
    "lp.preview.state": "நிலை",
    "lp.preview.condition": "உடல்நிலை",
    "lp.preview.review": "மதிப்பாய்வு",
    "lp.preview.stock": "மருந்து இருப்பு",
    "lp.preview.source": "மூலக் குறிப்பு",
    "lp.preview.kept": "அசல் பாதுகாக்கப்பட்டது",
    "lp.preview.linked": "இணைக்கப்பட்டது",
    "lp.preview.provisional": "தற்காலிக வரைவு",
    "lp.preview.human": "பணியாளர் உறுதிப்படுத்தல் நிலுவையில்",
    "lp.preview.caption": "பேசப்பட்ட அல்லது எழுதப்பட்ட கவனிப்பிலிருந்து மதிப்பாய்வு செய்யக்கூடிய பதிவாக.",
    "lp.hero.bottom": "முன்களப் பணிச்சூழலை மையமாகக் கொண்டு உருவாக்கப்பட்டது",
    "lp.hero.stage1": "பதிவு",
    "lp.hero.stage2": "ஒழுங்குபடுத்து",
    "lp.hero.stage3": "சரிபார்",
    "lp.hero.stage4": "மதிப்பாய்வு",
    "lp.statement.kicker": "அடிப்படை நோக்கம்",
    "lp.statement.title": "சமூகத்திற்கு மிக அருகில் இருப்பவர்களிடமிருந்தே சிறந்த தகவல் தொடங்குகிறது.",
    "lp.statement.copy": "பயனுள்ள அறிக்கையிடல் முறை அசல் கவனிப்பைப் பாதுகாக்க வேண்டும், மதிப்பாய்வை எளிதாக்க வேண்டும், முக்கிய முடிவுகளை மனிதர்களிடமே விட வேண்டும்.",
    "lp.workflow.kicker": "களக் குறிப்பிலிருந்து மதிப்பாய்வுக்கு",
    "lp.workflow.title": "ஒரு அறிக்கை. பயனுள்ள தகவல் பரிமாற்றம்.",
    "lp.workflow.intro": "மேற்பார்வையாளர் பார்ப்பதற்கு முன், அமைப்பு எதைப் புரிந்துகொண்டது என்பதைப் பணியாளர் சரிபார்க்க, BUSHO அசல் கவனிப்பையும் கட்டமைக்கப்பட்ட வரைவையும் ஒன்றாக வைத்திருக்கிறது.",
    "lp.workflow.step1.title": "களப் புதுப்பிப்பைப் பதிவு செய்யுங்கள்",
    "lp.workflow.step1.copy": "பணியாளர்கள் அன்றாட மொழியில் உரை அல்லது ஆதரிக்கப்படும் உலாவி குரல் உள்ளீடு மூலம் கவனிப்பைப் பதிவு செய்கிறார்கள்.",
    "lp.workflow.step1.foot": "உரை அல்லது குரல் உள்ளீடு",
    "lp.workflow.step2.title": "கவனிப்பை ஒழுங்குபடுத்துங்கள்",
    "lp.workflow.step2.copy": "BUSHO நிலை மற்றும் மருந்து புலங்களை முன்மொழிகிறது; ஒப்பிடுவதற்காக அசல் அறிக்கையையும் வைத்திருக்கிறது.",
    "lp.workflow.step2.foot": "திருத்தக்கூடிய வரைவு",
    "lp.workflow.step3.title": "அனுப்புவதற்கு முன் உறுதிப்படுத்துங்கள்",
    "lp.workflow.step3.copy": "சுகாதாரப் பணியாளர் வரைவைக் திருத்தி உறுதிப்படுத்துகிறார். பின்னர் மேற்பார்வையாளர் செயல்பாட்டுப் பதிவை மதிப்பாய்வு செய்கிறார்.",
    "lp.workflow.step3.foot": "மனித உறுதிப்படுத்தல்",
    "lp.platform.kicker": "இணைக்கப்பட்ட இரண்டு பொறுப்புகளுக்காக",
    "lp.platform.title": "பணியின் ஒரே பார்வை. ஒவ்வொரு படியிலும் தெளிவான பொறுப்பு.",
    "lp.platform.copy": "களப் பணியாளர்களும் மேற்பார்வையாளர்களும் ஒரே அறிக்கையிடல் ஓட்டத்தின் வெவ்வேறு பகுதிகளைப் பார்க்கிறார்கள்; மதிப்பாய்வும் ஒப்புதலும் தெளிவாக இருக்கும்.",
    "lp.platform.worker.title": "சுகாதாரப் பணியாளர்களுக்கு",
    "lp.platform.worker.copy": "கவனிப்பைப் பதிவு செய்ய, வரைவைக் காண, அடுத்த கட்டத்துக்கு அனுப்ப வேண்டியதை உறுதிப்படுத்த ஒரு தெளிவான பணியிடம்.",
    "lp.platform.worker.link": "பணியாளர் பணியிடத்தைத் திறக்கவும்",
    "lp.platform.supervisor.title": "மேற்பார்வையாளர்களுக்கு",
    "lp.platform.supervisor.copy": "உறுதிப்படுத்தப்பட்ட கள அறிக்கைகள், செயல்பாட்டு குறிப்புகள் மற்றும் மதிப்பாய்வுக்காக காத்திருப்பவற்றின் ஒருங்கிணைந்த பார்வை.",
    "lp.platform.supervisor.link": "மேற்பார்வையாளர் பணியிடத்தைத் திறக்கவும்",
    "lp.platform.note": "இங்கே காட்டப்படும் அனைத்து எண்களும் பதிவுகளும் முன்மாதிரியின் கற்பனை எடுத்துக்காட்டுகள்.",
    "lp.principles.kicker": "நம்பிக்கையும் செயல்முறையின் ஒரு பகுதி",
    "lp.principles.title": "பயனுள்ள குறிப்புகள். தெளிவான வரம்புகள்.",
    "lp.principles.copy": "சுகாதார அறிக்கைகள் கவனமாக கையாளப்பட வேண்டும். BUSHO கவனிப்பு, சரிபார்ப்பு மற்றும் நிர்வாக நடவடிக்கையை தனித்தனி படிகளாக வைத்திருக்கிறது.",
    "lp.principles.one.title": "அறிக்கை என்பது நோயறிதல் அல்ல",
    "lp.principles.one.copy": "இந்த முன்மாதிரி தெரிவிக்கப்பட்ட கவனிப்புகளை ஒழுங்குபடுத்துகிறது. நோயறிதல், அவசர முன்னுரிமை அல்லது சிகிச்சை பரிந்துரை செய்யாது.",
    "lp.principles.two.title": "வரைவு என்பது சரிபார்க்கப்பட்ட பதிவு அல்ல",
    "lp.principles.two.copy": "பதிவு சரிபார்க்கப்பட்டதாக கருதப்படுவதற்கு முன் பணியாளர்கள் முன்மொழியப்பட்ட புலங்களை மதிப்பாய்வு செய்து திருத்தி உறுதிப்படுத்தலாம்.",
    "lp.principles.three.title": "இருப்பு குறிப்பு என்பது ஆர்டர் அல்ல",
    "lp.principles.three.copy": "மேற்பார்வையாளர் மாதிரி மறுநிரப்பு வரைவைக் மதிப்பாய்வு செய்யலாம். டெமோ ஆர்டர் இடாது; நேரடி இருப்புடன் இணைக்கப்படவில்லை.",
    "lp.tagline.kicker": "BUSHO அணுகுமுறை",
    "lp.tagline.title": "தகவலுக்கு அருகில் மனிதரை வைத்திருங்கள். முடிவையும் மனிதரிடமே விடுங்கள்.",
    "lp.faq.kicker": "பார்ப்பதற்கு முன்",
    "lp.faq.title": "சில முக்கிய விவரங்கள்.",
    "lp.faq.q1": "BUSHO நேரடி அரசு சுகாதாரத் தளமா?",
    "lp.faq.a1": "இல்லை. இது செயற்கை தரவைப் பயன்படுத்தும் முன்மாதிரி. அரசு சுகாதார அமைப்புகளுடனோ சுகாதார மைய தரவுத்தளங்களுடனோ இணைக்கப்படவில்லை.",
    "lp.faq.q2": "BUSHO நோய்களைக் கண்டறியுமா?",
    "lp.faq.a2": "இல்லை. இது தெரிவிக்கப்பட்ட கவனிப்புகளை மனித மதிப்பாய்வுக்காக ஒழுங்குபடுத்துகிறது. மருத்துவ முடிவுகளை எடுக்காது.",
    "lp.faq.q3": "பணியாளர்கள் குரல் மூலம் அறிக்கை செய்ய முடியுமா?",
    "lp.faq.a3": "உலாவி ஆதரவு உள்ள இடங்களில் முன்மாதிரி குரல் உள்ளீட்டை ஆதரிக்கிறது. அங்கீகாரம் உலாவி மற்றும் மொழி ஆதரவைப் பொறுத்தது.",
    "lp.faq.q4": "எந்தத் தரவை உள்ளிட வேண்டும்?",
    "lp.faq.a4": "கற்பனை எடுத்துக்காட்டுகளை மட்டும் பயன்படுத்துங்கள். உண்மையான நோயாளிகளின் பெயர், தொலைபேசி எண், அடையாளம் அல்லது முக்கியமான சுகாதாரத் தகவலை உள்ளிட வேண்டாம்.",
    "lp.final.kicker": "முன்மாதிரியைப் பாருங்கள்",
    "lp.final.title": "கள அறிக்கை BUSHO வழியாக எப்படிச் செல்கிறது என்பதைப் பாருங்கள்.",
    "lp.final.copy": "செயற்கை டெமோ தரவைப் பயன்படுத்தி பணியாளர் மற்றும் மேற்பார்வையாளர் காட்சிகளைப் பாருங்கள்.",
    "lp.final.cta": "டெமோ பணியிடத்திற்குச் செல்லுங்கள்",
    "lp.footer.note": "மனித மதிப்பாய்வை மையமாகக் கொண்ட செயல்முறை முன்மாதிரி.",
    "lp.footer.status": "முன்மாதிரி மட்டும். செயற்கை தரவு. உண்மையான நோயாளர் தகவலுக்கானது அல்ல."
  });
  Object.assign(locales.te, {
    "lp.nav.platform": "ప్లాట్‌ఫామ్",
    "lp.nav.workflow": "ఎలా పనిచేస్తుంది",
    "lp.nav.principles": "భద్రతా సూత్రాలు",
    "lp.nav.signin": "సైన్ ఇన్",
    "lp.hero.eyebrow": "ప్రజారోగ్య కార్యకలాపాలకు స్పష్టమైన తొలి అడుగు",
    "lp.hero.title": "క్షేత్ర నివేదికల నుంచి చర్య వరకు మార్గం స్పష్టంగా ఉండాలి.",
    "lp.hero.description": "ముందువరుస ఆరోగ్య కార్యకర్తల రోజువారీ పరిశీలనలను మనుషులు సమీక్షించి, సరిచేసి, ధృవీకరించగల నిర్మిత ముసాయిదాలుగా మార్చేందుకు BUSHO సహాయపడుతుంది.",
    "lp.hero.cta": "డెమోను చూడండి",
    "lp.hero.secondary": "పని విధానాన్ని చూడండి",
    "lp.hero.proof": "ప్రతి రికార్డులో మానవ సమీక్ష ఉంటుంది. BUSHO వ్యాధి నిర్ధారణ చేయదు, ఆర్డర్లు కూడా ఇవ్వదు.",
    "lp.preview.label": "పని విధానం ప్రివ్యూ",
    "lp.preview.synthetic": "కల్పిత ఉదాహరణ",
    "lp.preview.workspace": "ఆరోగ్య కార్యకర్త వర్క్‌స్పేస్",
    "lp.preview.step": "దశ 01 / క్షేత్ర నవీకరణ",
    "lp.preview.heading": "కార్యకర్త మాటల్లో నివేదిక",
    "lp.preview.original": "అసలు గమనిక",
    "lp.preview.sample": "నమూనా నివేదిక",
    "lp.preview.structured": "సమీక్ష కోసం క్రమబద్ధీకరణ",
    "lp.preview.field": "విభాగం",
    "lp.preview.observation": "పరిశీలన",
    "lp.preview.state": "స్థితి",
    "lp.preview.condition": "ఆరోగ్య పరిస్థితి",
    "lp.preview.review": "సమీక్ష",
    "lp.preview.stock": "మందుల నిల్వ",
    "lp.preview.source": "మూల గమనిక",
    "lp.preview.kept": "అసలు భద్రం",
    "lp.preview.linked": "లింక్ చేయబడింది",
    "lp.preview.provisional": "తాత్కాలిక ముసాయిదా",
    "lp.preview.human": "కార్యకర్త ధృవీకరణ కోసం వేచి ఉంది",
    "lp.preview.caption": "మాట్లాడిన లేదా రాసిన పరిశీలన నుంచి సమీక్షించగల రికార్డు వరకు.",
    "lp.hero.bottom": "ముందువరుస పని విధానాన్ని దృష్టిలో పెట్టుకుని నిర్మించబడింది",
    "lp.hero.stage1": "నమోదు",
    "lp.hero.stage2": "క్రమబద్ధీకరణ",
    "lp.hero.stage3": "ధృవీకరణ",
    "lp.hero.stage4": "సమీక్ష",
    "lp.statement.kicker": "మూల సూత్రం",
    "lp.statement.title": "సమాజానికి అత్యంత దగ్గరగా ఉన్నవారి నుంచే మెరుగైన సమాచారం మొదలవుతుంది.",
    "lp.statement.copy": "ఉపయోగకరమైన నివేదిక వ్యవస్థ అసలు పరిశీలనను కాపాడాలి, సమీక్షను సులభం చేయాలి, ముఖ్యమైన నిర్ణయాలను మనుషుల వద్దే ఉంచాలి.",
    "lp.workflow.kicker": "క్షేత్ర గమనిక నుంచి సమీక్ష వరకు",
    "lp.workflow.title": "ఒక నివేదిక. మరింత ఉపయోగకరమైన సమాచార బదిలీ.",
    "lp.workflow.intro": "పర్యవేక్షకుడు చూసే ముందు వ్యవస్థ ఏమి అర్థం చేసుకుందో కార్యకర్త తనిఖీ చేయడానికి BUSHO అసలు పరిశీలనను నిర్మిత ముసాయిదా పక్కనే ఉంచుతుంది.",
    "lp.workflow.step1.title": "క్షేత్ర నవీకరణను నమోదు చేయండి",
    "lp.workflow.step1.copy": "కార్యకర్తలు సాధారణ భాషలో టెక్స్ట్ లేదా మద్దతు ఉన్న బ్రౌజర్ వాయిస్ ఇన్‌పుట్ ద్వారా పరిశీలనను వివరిస్తారు.",
    "lp.workflow.step1.foot": "టెక్స్ట్ లేదా వాయిస్ ఇన్‌పుట్",
    "lp.workflow.step2.title": "పరిశీలనను క్రమబద్ధీకరించండి",
    "lp.workflow.step2.copy": "BUSHO పరిస్థితి మరియు మందుల వివరాల విభాగాలను సూచిస్తూ, పోల్చడానికి అసలు నివేదికను అందుబాటులో ఉంచుతుంది.",
    "lp.workflow.step2.foot": "సవరించగల ముసాయిదా",
    "lp.workflow.step3.title": "తదుపరి దశకు పంపే ముందు ధృవీకరించండి",
    "lp.workflow.step3.copy": "ఆరోగ్య కార్యకర్త ముసాయిదాను సరిచేసి ధృవీకరిస్తారు. తర్వాత పర్యవేక్షకులు కార్యాచరణ రికార్డును సమీక్షిస్తారు.",
    "lp.workflow.step3.foot": "మానవ ధృవీకరణ",
    "lp.platform.kicker": "అనుసంధానమైన రెండు బాధ్యతల కోసం",
    "lp.platform.title": "పని యొక్క ఉమ్మడి దృశ్యం. ప్రతి దశలో స్పష్టమైన బాధ్యత.",
    "lp.platform.copy": "క్షేత్ర కార్యకర్తలు, పర్యవేక్షకులు ఒకే నివేదిక ప్రక్రియలోని వేర్వేరు భాగాలను చూస్తారు; సమీక్ష మరియు ఆమోదం స్పష్టంగా ఉంటాయి.",
    "lp.platform.worker.title": "ఆరోగ్య కార్యకర్తల కోసం",
    "lp.platform.worker.copy": "పరిశీలనను నమోదు చేయడానికి, ముసాయిదాను చూడడానికి, ముందుకు పంపాల్సినదాన్ని ధృవీకరించడానికి ప్రత్యేక స్థలం.",
    "lp.platform.worker.link": "కార్యకర్త వర్క్‌స్పేస్ తెరవండి",
    "lp.platform.supervisor.title": "పర్యవేక్షకుల కోసం",
    "lp.platform.supervisor.copy": "ధృవీకరించిన క్షేత్ర నివేదికలు, కార్యాచరణ సంకేతాలు, సమీక్ష కోసం వేచి ఉన్న అంశాల సమగ్ర దృశ్యం.",
    "lp.platform.supervisor.link": "పర్యవేక్షక వర్క్‌స్పేస్ తెరవండి",
    "lp.platform.note": "ఇక్కడ చూపిన అన్ని సంఖ్యలు, రికార్డులు ప్రోటోటైప్‌లోని కల్పిత ఉదాహరణలు.",
    "lp.principles.kicker": "నమ్మకం కూడా పని విధానంలో భాగమే",
    "lp.principles.title": "ఉపయోగకరమైన సంకేతాలు. స్పష్టమైన పరిమితులు.",
    "lp.principles.copy": "ఆరోగ్య నివేదికలను జాగ్రత్తగా నిర్వహించాలి. BUSHO పరిశీలన, ధృవీకరణ, పరిపాలనా చర్యలను వేర్వేరు దశలుగా ఉంచుతుంది.",
    "lp.principles.one.title": "నివేదిక అనేది వ్యాధి నిర్ధారణ కాదు",
    "lp.principles.one.copy": "ఈ ప్రోటోటైప్ నివేదించిన పరిశీలనలను క్రమబద్ధీకరిస్తుంది. నిర్ధారణ, అత్యవసర ప్రాధాన్యత లేదా చికిత్స సూచన ఇవ్వదు.",
    "lp.principles.two.title": "ముసాయిదా ధృవీకరించిన రికార్డు కాదు",
    "lp.principles.two.copy": "రికార్డును ధృవీకరించినదిగా పరిగణించే ముందు కార్యకర్తలు సూచించిన విభాగాలను సమీక్షించి, సరిచేసి, నిర్ధారించవచ్చు.",
    "lp.principles.three.title": "నిల్వ సంకేతం ఆర్డర్ కాదు",
    "lp.principles.three.copy": "పర్యవేక్షకుడు నమూనా పునఃపూరణ ముసాయిదాను సమీక్షించవచ్చు. డెమో ఆర్డర్లు ఇవ్వదు, ప్రత్యక్ష నిల్వతో అనుసంధానించబడలేదు.",
    "lp.tagline.kicker": "BUSHO విధానం",
    "lp.tagline.title": "సమాచారానికి దగ్గరగా మనిషిని ఉంచండి. నిర్ణయాన్ని కూడా మనిషి చేతుల్లోనే ఉంచండి.",
    "lp.faq.kicker": "చూడటానికి ముందు",
    "lp.faq.title": "కొన్ని ముఖ్యమైన వివరాలు.",
    "lp.faq.q1": "BUSHO ప్రత్యక్ష ప్రభుత్వ ఆరోగ్య ప్లాట్‌ఫామా?",
    "lp.faq.a1": "కాదు. ప్రస్తుత వెబ్‌సైట్ సింథటిక్ డేటా ప్రోటోటైప్. ఇది ప్రభుత్వ ఆరోగ్య వ్యవస్థలు లేదా ఆరోగ్య కేంద్రాల డేటాబేస్‌లకు అనుసంధానించబడలేదు.",
    "lp.faq.q2": "BUSHO వ్యాధులను నిర్ధారిస్తుందా?",
    "lp.faq.a2": "కాదు. ఇది నివేదించిన పరిశీలనలను మానవ సమీక్ష కోసం క్రమబద్ధీకరిస్తుంది. వైద్య నిర్ణయాలు తీసుకోదు.",
    "lp.faq.q3": "కార్యకర్తలు వాయిస్ ద్వారా నివేదించగలరా?",
    "lp.faq.a3": "బ్రౌజర్ మద్దతు ఉన్న చోట ప్రోటోటైప్ వాయిస్ ఇన్‌పుట్‌ను ఉపయోగిస్తుంది. గుర్తింపు బ్రౌజర్ మరియు భాష మద్దతుపై ఆధారపడి ఉంటుంది.",
    "lp.faq.q4": "నేను ఎలాంటి డేటా నమోదు చేయాలి?",
    "lp.faq.a4": "కల్పిత ఉదాహరణలనే ఉపయోగించండి. నిజమైన రోగుల పేర్లు, ఫోన్ నంబర్లు, గుర్తింపు వివరాలు లేదా సున్నితమైన ఆరోగ్య సమాచారాన్ని నమోదు చేయవద్దు.",
    "lp.final.kicker": "ప్రోటోటైప్‌ను అన్వేషించండి",
    "lp.final.title": "క్షేత్ర నివేదిక BUSHO ద్వారా ఎలా ముందుకు వెళ్తుందో చూడండి.",
    "lp.final.copy": "సింథటిక్ డెమో డేటాతో కార్యకర్త మరియు పర్యవేక్షక వీక్షణలను అన్వేషించండి.",
    "lp.final.cta": "డెమో వర్క్‌స్పేస్‌లోకి వెళ్లండి",
    "lp.footer.note": "మానవ సమీక్ష చుట్టూ రూపొందించిన పని విధాన ప్రోటోటైప్.",
    "lp.footer.status": "ప్రోటోటైప్ మాత్రమే. సింథటిక్ డేటా. నిజమైన రోగి సమాచారానికి కాదు."
  });
  Object.assign(locales.mr, {
    "lp.nav.platform": "प्लॅटफॉर्म",
    "lp.nav.workflow": "कसे कार्य करते",
    "lp.nav.principles": "सुरक्षा तत्त्वे",
    "lp.nav.signin": "साइन इन",
    "lp.hero.eyebrow": "सार्वजनिक आरोग्य व्यवस्थापनासाठी अधिक स्पष्ट पहिली पायरी",
    "lp.hero.title": "क्षेत्रीय अहवालांपासून कृतीपर्यंतचा मार्ग स्पष्ट असायला हवा.",
    "lp.hero.description": "फ्रंटलाइन आरोग्य कर्मचाऱ्यांच्या दैनंदिन निरीक्षणांना लोक तपासू, दुरुस्त करू आणि निश्चित करू शकतील अशा संरचित मसुद्यांमध्ये बदलण्यास BUSHO मदत करते.",
    "lp.hero.cta": "डेमो पाहा",
    "lp.hero.secondary": "कार्यप्रवाह पाहा",
    "lp.hero.proof": "प्रत्येक नोंदीत मानवी पुनरावलोकन असते. BUSHO निदान करत नाही किंवा ऑर्डर देत नाही.",
    "lp.preview.label": "कार्यप्रवाह पूर्वदृश्य",
    "lp.preview.synthetic": "काल्पनिक उदाहरण",
    "lp.preview.workspace": "आरोग्य कर्मचारी कार्यक्षेत्र",
    "lp.preview.step": "पायरी 01 / क्षेत्रीय अपडेट",
    "lp.preview.heading": "कर्मचाऱ्याच्या शब्दांत अहवाल",
    "lp.preview.original": "मूळ नोंद",
    "lp.preview.sample": "नमुना अहवाल",
    "lp.preview.structured": "पुनरावलोकनासाठी संरचित",
    "lp.preview.field": "क्षेत्र",
    "lp.preview.observation": "निरीक्षण",
    "lp.preview.state": "स्थिती",
    "lp.preview.condition": "आरोग्य स्थिती",
    "lp.preview.review": "पुनरावलोकन",
    "lp.preview.stock": "औषध साठा",
    "lp.preview.source": "मूळ नोंद",
    "lp.preview.kept": "मूळ जतन केले",
    "lp.preview.linked": "जोडलेले",
    "lp.preview.provisional": "तात्पुरता मसुदा",
    "lp.preview.human": "कर्मचाऱ्याच्या पुष्टीची प्रतीक्षा",
    "lp.preview.caption": "बोललेल्या किंवा लिहिलेल्या निरीक्षणापासून तपासता येणाऱ्या नोंदीपर्यंत.",
    "lp.hero.bottom": "फ्रंटलाइन कार्यप्रवाह लक्षात घेऊन तयार केले",
    "lp.hero.stage1": "नोंद",
    "lp.hero.stage2": "रचना",
    "lp.hero.stage3": "पडताळणी",
    "lp.hero.stage4": "पुनरावलोकन",
    "lp.statement.kicker": "मूलभूत तत्त्व",
    "lp.statement.title": "चांगल्या माहितीची सुरुवात समुदायाच्या सर्वात जवळ असलेल्या लोकांकडून होते.",
    "lp.statement.copy": "उपयुक्त अहवाल प्रणालीने मूळ निरीक्षण जतन करावे, पुनरावलोकन सोपे करावे आणि महत्त्वाचे निर्णय लोकांकडेच ठेवावेत.",
    "lp.workflow.kicker": "क्षेत्रीय नोंदीपासून पुनरावलोकनापर्यंत",
    "lp.workflow.title": "एक अहवाल. अधिक उपयुक्त माहिती हस्तांतरण.",
    "lp.workflow.intro": "पर्यवेक्षक पाहण्यापूर्वी प्रणालीने काय समजले हे कर्मचाऱ्याला तपासता यावे म्हणून BUSHO मूळ निरीक्षण संरचित मसुद्याच्या जवळ ठेवते.",
    "lp.workflow.step1.title": "क्षेत्रीय अपडेट नोंदवा",
    "lp.workflow.step1.copy": "कर्मचारी दैनंदिन भाषेत मजकूर किंवा समर्थित ब्राउझर व्हॉइस इनपुटद्वारे निरीक्षण सांगतात.",
    "lp.workflow.step1.foot": "मजकूर किंवा व्हॉइस इनपुट",
    "lp.workflow.step2.title": "निरीक्षणाची रचना करा",
    "lp.workflow.step2.copy": "BUSHO स्थिती आणि औषधांची क्षेत्रे सुचवते आणि तुलना करण्यासाठी मूळ अहवाल उपलब्ध ठेवते.",
    "lp.workflow.step2.foot": "संपादनयोग्य मसुदा",
    "lp.workflow.step3.title": "पुढे पाठवण्यापूर्वी पुष्टी करा",
    "lp.workflow.step3.copy": "आरोग्य कर्मचारी मसुदा दुरुस्त करून पुष्टी करतो. त्यानंतर पर्यवेक्षक कार्यवाहीच्या नोंदीचे पुनरावलोकन करतो.",
    "lp.workflow.step3.foot": "मानवी पुष्टी",
    "lp.platform.kicker": "जोडलेल्या दोन भूमिकांसाठी तयार",
    "lp.platform.title": "कामाचे एकत्रित चित्र. प्रत्येक टप्प्यावर स्पष्ट जबाबदारी.",
    "lp.platform.copy": "क्षेत्रीय कर्मचारी आणि पर्यवेक्षक एकाच अहवाल प्रक्रियेचे वेगवेगळे भाग पाहतात; पुनरावलोकन आणि मंजुरी स्पष्ट राहते.",
    "lp.platform.worker.title": "आरोग्य कर्मचाऱ्यांसाठी",
    "lp.platform.worker.copy": "निरीक्षण नोंदवण्यासाठी, मसुदा पाहण्यासाठी आणि पुढे पाठवायच्या नोंदीची पुष्टी करण्यासाठी केंद्रित कार्यक्षेत्र.",
    "lp.platform.worker.link": "कर्मचारी कार्यक्षेत्र उघडा",
    "lp.platform.supervisor.title": "पर्यवेक्षकांसाठी",
    "lp.platform.supervisor.copy": "पुष्टी केलेले क्षेत्रीय अहवाल, कार्यवाहीचे संकेत आणि पुनरावलोकनाच्या प्रतीक्षेत असलेल्या बाबींचे एकत्रित दृश्य.",
    "lp.platform.supervisor.link": "पर्यवेक्षक कार्यक्षेत्र उघडा",
    "lp.platform.note": "येथे दाखवलेले सर्व आकडे आणि नोंदी प्रोटोटाइपमधील काल्पनिक उदाहरणे आहेत.",
    "lp.principles.kicker": "विश्वास हा देखील कार्यप्रवाहाचा भाग आहे",
    "lp.principles.title": "उपयुक्त संकेत. स्पष्ट मर्यादा.",
    "lp.principles.copy": "आरोग्य अहवाल काळजीपूर्वक हाताळणे आवश्यक आहे. BUSHO निरीक्षण, पडताळणी आणि प्रशासकीय कृती वेगवेगळ्या टप्प्यांत ठेवते.",
    "lp.principles.one.title": "अहवाल म्हणजे निदान नाही",
    "lp.principles.one.copy": "प्रोटोटाइप नोंदवलेली निरीक्षणे संरचित करतो. तो निदान, तातडीचे वर्गीकरण किंवा उपचार सुचवत नाही.",
    "lp.principles.two.title": "मसुदा म्हणजे पडताळलेली नोंद नाही",
    "lp.principles.two.copy": "नोंद पडताळलेली मानण्यापूर्वी कर्मचारी सुचवलेली क्षेत्रे तपासू, दुरुस्त करू आणि पुष्टी करू शकतात.",
    "lp.principles.three.title": "साठ्याचा संकेत म्हणजे ऑर्डर नाही",
    "lp.principles.three.copy": "पर्यवेक्षक नमुना पुनर्भरण मसुद्याचे पुनरावलोकन करू शकतो. डेमो ऑर्डर देत नाही आणि प्रत्यक्ष साठ्याशी जोडलेला नाही.",
    "lp.tagline.kicker": "BUSHO ची पद्धत",
    "lp.tagline.title": "माहितीच्या जवळ माणसाला ठेवा. निर्णयही माणसाकडेच ठेवा.",
    "lp.faq.kicker": "पाहण्यापूर्वी",
    "lp.faq.title": "काही महत्त्वाचे तपशील.",
    "lp.faq.q1": "BUSHO हे प्रत्यक्ष सरकारी आरोग्य प्लॅटफॉर्म आहे का?",
    "lp.faq.a1": "नाही. सध्याची वेबसाइट सिंथेटिक डेटावर आधारित प्रोटोटाइप आहे. ती सरकारी आरोग्य प्रणाली किंवा केंद्रांच्या डेटाबेसशी जोडलेली नाही.",
    "lp.faq.q2": "BUSHO रोगांचे निदान करते का?",
    "lp.faq.a2": "नाही. ते नोंदवलेली निरीक्षणे मानवी पुनरावलोकनासाठी संरचित करते. वैद्यकीय निर्णय घेत नाही.",
    "lp.faq.q3": "कर्मचारी आवाजाद्वारे अहवाल देऊ शकतात का?",
    "lp.faq.a3": "ब्राउझर समर्थन उपलब्ध असल्यास प्रोटोटाइप व्हॉइस इनपुट वापरतो. ओळख ब्राउझर आणि भाषेच्या समर्थनावर अवलंबून असते.",
    "lp.faq.q4": "मी कोणती माहिती नोंदवावी?",
    "lp.faq.a4": "फक्त काल्पनिक उदाहरणे वापरा. वास्तविक रुग्णांची नावे, फोन क्रमांक, ओळख किंवा संवेदनशील आरोग्य माहिती नोंदवू नका.",
    "lp.final.kicker": "प्रोटोटाइप पाहा",
    "lp.final.title": "क्षेत्रीय अहवाल BUSHO मधून कसा पुढे जातो ते पाहा.",
    "lp.final.copy": "सिंथेटिक डेमो डेटासह कर्मचारी आणि पर्यवेक्षक दृश्ये पाहा.",
    "lp.final.cta": "डेमो कार्यक्षेत्रात जा",
    "lp.footer.note": "मानवी पुनरावलोकनाभोवती तयार केलेला कार्यप्रवाह प्रोटोटाइप.",
    "lp.footer.status": "फक्त प्रोटोटाइप. सिंथेटिक डेटा. वास्तविक रुग्णांच्या माहितीसाठी नाही."
  });


  // Localized labels for the landing page product previews and safety FAQ.
  Object.assign(locales.en, {
    "lp.hero.cta": "Explore the prototype",
    "lp.faq.q5": "Does BUSHO store voice recordings?",
    "lp.faq.a5": "BUSHO does not store audio. Browser speech recognition may send audio to the browser provider, depending on its service.",
    "lp.faq.q6": "Can I use real patient information in the demo?",
    "lp.faq.a6": "No. The prototype is for synthetic examples only and has no production security or clinical data infrastructure.",
    "lp.mock.fieldReport": "Field report",
    "lp.mock.todaysUpdate": "Today’s update",
    "lp.mock.draft": "Draft",
    "lp.mock.original": "ORIGINAL REPORT",
    "lp.mock.report": "12 patients with fever. 20 ORS packets left.",
    "lp.mock.condition": "Condition",
    "lp.mock.fever": "Fever",
    "lp.mock.patients": "12 patients",
    "lp.mock.stock": "Stock",
    "lp.mock.packets": "20 packets",
    "lp.mock.reviewFields": "Review fields",
    "lp.mock.confirm": "Confirm report →",
    "lp.mock.operations": "OPERATIONS OVERVIEW",
    "lp.mock.demoData": "DEMO DATA",
    "lp.mock.reports": "REPORTS",
    "lp.mock.sampleRecords": "Sample records",
    "lp.mock.awaiting": "AWAITING REVIEW",
    "lp.mock.queue": "Illustrative queue",
    "lp.mock.stockAttention": "Stock attention",
    "lp.mock.sampleInventory": "ORS · sample inventory",
    "lp.mock.review": "Review",
    "lp.mock.confirmedByWorker": "Confirmed by worker",
    "lp.mock.received": "Received"
  });
  Object.assign(locales.hi, {
    "lp.hero.cta": "प्रोटोटाइप देखें",
    "lp.faq.q5": "क्या BUSHO वॉइस रिकॉर्डिंग सुरक्षित रखता है?",
    "lp.faq.a5": "BUSHO ऑडियो सुरक्षित नहीं रखता। ब्राउज़र की स्पीच सेवा के आधार पर ऑडियो ब्राउज़र प्रदाता को भेजा जा सकता है।",
    "lp.faq.q6": "क्या मैं डेमो में वास्तविक मरीजों की जानकारी डाल सकता हूँ?",
    "lp.faq.a6": "नहीं। यह प्रोटोटाइप केवल काल्पनिक उदाहरणों के लिए है और इसमें वास्तविक उपयोग के लिए आवश्यक सुरक्षा या नैदानिक डेटा व्यवस्था नहीं है।",
    "lp.mock.fieldReport": "मैदानी रिपोर्ट",
    "lp.mock.todaysUpdate": "आज का अपडेट",
    "lp.mock.draft": "ड्राफ़्ट",
    "lp.mock.original": "मूल रिपोर्ट",
    "lp.mock.report": "12 मरीजों को बुखार। 20 ORS पैकेट बचे हैं।",
    "lp.mock.condition": "स्वास्थ्य स्थिति",
    "lp.mock.fever": "बुखार",
    "lp.mock.patients": "12 मरीज",
    "lp.mock.stock": "स्टॉक",
    "lp.mock.packets": "20 पैकेट",
    "lp.mock.reviewFields": "फ़ील्ड जाँचें",
    "lp.mock.confirm": "रिपोर्ट की पुष्टि करें →",
    "lp.mock.operations": "परिचालन अवलोकन",
    "lp.mock.demoData": "डेमो डेटा",
    "lp.mock.reports": "रिपोर्ट",
    "lp.mock.sampleRecords": "नमूना रिकॉर्ड",
    "lp.mock.awaiting": "समीक्षा बाकी",
    "lp.mock.queue": "उदाहरण कतार",
    "lp.mock.stockAttention": "स्टॉक पर ध्यान दें",
    "lp.mock.sampleInventory": "ORS · नमूना स्टॉक",
    "lp.mock.review": "समीक्षा",
    "lp.mock.confirmedByWorker": "कर्मचारी ने पुष्टि की",
    "lp.mock.received": "प्राप्त"
  });
  Object.assign(locales.bn, {
    "lp.hero.cta": "প্রোটোটাইপ দেখুন",
    "lp.faq.q5": "BUSHO কি ভয়েস রেকর্ডিং সংরক্ষণ করে?",
    "lp.faq.a5": "BUSHO অডিও সংরক্ষণ করে না। ব্রাউজারের স্পিচ পরিষেবার ওপর নির্ভর করে অডিও ব্রাউজার প্রদানকারীর কাছে পাঠানো হতে পারে।",
    "lp.faq.q6": "আমি কি ডেমোতে আসল রোগীর তথ্য ব্যবহার করতে পারি?",
    "lp.faq.a6": "না। এই প্রোটোটাইপ শুধু কাল্পনিক উদাহরণের জন্য। এতে বাস্তব ব্যবহারের নিরাপত্তা বা ক্লিনিক্যাল ডেটা পরিকাঠামো নেই।",
    "lp.mock.fieldReport": "মাঠের রিপোর্ট",
    "lp.mock.todaysUpdate": "আজকের আপডেট",
    "lp.mock.draft": "খসড়া",
    "lp.mock.original": "মূল রিপোর্ট",
    "lp.mock.report": "১২ জনের জ্বর। ২০টি ORS প্যাকেট বাকি।",
    "lp.mock.condition": "স্বাস্থ্য সমস্যা",
    "lp.mock.fever": "জ্বর",
    "lp.mock.patients": "১২ জন রোগী",
    "lp.mock.stock": "মজুত",
    "lp.mock.packets": "২০টি প্যাকেট",
    "lp.mock.reviewFields": "তথ্য পর্যালোচনা",
    "lp.mock.confirm": "রিপোর্ট নিশ্চিত করুন →",
    "lp.mock.operations": "কার্যক্রমের সারাংশ",
    "lp.mock.demoData": "ডেমো ডেটা",
    "lp.mock.reports": "রিপোর্ট",
    "lp.mock.sampleRecords": "নমুনা রেকর্ড",
    "lp.mock.awaiting": "পর্যালোচনার অপেক্ষায়",
    "lp.mock.queue": "উদাহরণ তালিকা",
    "lp.mock.stockAttention": "মজুতের দিকে নজর",
    "lp.mock.sampleInventory": "ORS · নমুনা মজুত",
    "lp.mock.review": "পর্যালোচনা",
    "lp.mock.confirmedByWorker": "কর্মী নিশ্চিত করেছেন",
    "lp.mock.received": "গৃহীত"
  });
  Object.assign(locales.ta, {
    "lp.hero.cta": "முன்மாதிரியைப் பாருங்கள்",
    "lp.faq.q5": "BUSHO குரல் பதிவுகளைச் சேமிக்கிறதா?",
    "lp.faq.a5": "BUSHO ஒலியைச் சேமிப்பதில்லை. உலாவியின் பேச்சு சேவையைப் பொறுத்து ஒலி உலாவி வழங்குநருக்கு அனுப்பப்படலாம்.",
    "lp.faq.q6": "டெமோவில் உண்மையான நோயாளர் தகவலைப் பயன்படுத்தலாமா?",
    "lp.faq.a6": "முடியாது. இந்த முன்மாதிரி கற்பனை எடுத்துக்காட்டுகளுக்காக மட்டுமே. உண்மையான பயன்பாட்டிற்கான பாதுகாப்பு அல்லது மருத்துவத் தரவு அமைப்பு இதில் இல்லை.",
    "lp.mock.fieldReport": "கள அறிக்கை",
    "lp.mock.todaysUpdate": "இன்றைய புதுப்பிப்பு",
    "lp.mock.draft": "வரைவு",
    "lp.mock.original": "அசல் அறிக்கை",
    "lp.mock.report": "12 பேருக்கு காய்ச்சல். 20 ORS பொட்டலங்கள் மீதம்.",
    "lp.mock.condition": "உடல்நிலை",
    "lp.mock.fever": "காய்ச்சல்",
    "lp.mock.patients": "12 நோயாளிகள்",
    "lp.mock.stock": "இருப்பு",
    "lp.mock.packets": "20 பொட்டலங்கள்",
    "lp.mock.reviewFields": "புலங்களை மதிப்பாய்வு",
    "lp.mock.confirm": "அறிக்கையை உறுதிப்படுத்து →",
    "lp.mock.operations": "செயல்பாட்டு பார்வை",
    "lp.mock.demoData": "டெமோ தரவு",
    "lp.mock.reports": "அறிக்கைகள்",
    "lp.mock.sampleRecords": "மாதிரி பதிவுகள்",
    "lp.mock.awaiting": "மதிப்பாய்வு நிலுவையில்",
    "lp.mock.queue": "மாதிரி வரிசை",
    "lp.mock.stockAttention": "இருப்பைக் கவனிக்கவும்",
    "lp.mock.sampleInventory": "ORS · மாதிரி இருப்பு",
    "lp.mock.review": "மதிப்பாய்வு",
    "lp.mock.confirmedByWorker": "பணியாளர் உறுதிப்படுத்தினார்",
    "lp.mock.received": "பெறப்பட்டது"
  });
  Object.assign(locales.te, {
    "lp.hero.cta": "ప్రోటోటైప్‌ను చూడండి",
    "lp.faq.q5": "BUSHO వాయిస్ రికార్డింగ్‌లను నిల్వ చేస్తుందా?",
    "lp.faq.a5": "BUSHO ఆడియోను నిల్వ చేయదు. బ్రౌజర్ స్పీచ్ సేవను బట్టి ఆడియో బ్రౌజర్ ప్రొవైడర్‌కు పంపబడవచ్చు.",
    "lp.faq.q6": "డెమోలో నిజమైన రోగుల సమాచారాన్ని ఉపయోగించవచ్చా?",
    "lp.faq.a6": "కాదు. ఈ ప్రోటోటైప్ కల్పిత ఉదాహరణల కోసం మాత్రమే. నిజమైన వినియోగానికి అవసరమైన భద్రత లేదా క్లినికల్ డేటా మౌలిక సదుపాయాలు ఇందులో లేవు.",
    "lp.mock.fieldReport": "క్షేత్ర నివేదిక",
    "lp.mock.todaysUpdate": "నేటి నవీకరణ",
    "lp.mock.draft": "ముసాయిదా",
    "lp.mock.original": "అసలు నివేదిక",
    "lp.mock.report": "12 మందికి జ్వరం. 20 ORS ప్యాకెట్లు మిగిలి ఉన్నాయి.",
    "lp.mock.condition": "ఆరోగ్య పరిస్థితి",
    "lp.mock.fever": "జ్వరం",
    "lp.mock.patients": "12 మంది రోగులు",
    "lp.mock.stock": "నిల్వ",
    "lp.mock.packets": "20 ప్యాకెట్లు",
    "lp.mock.reviewFields": "విభాగాలను సమీక్షించండి",
    "lp.mock.confirm": "నివేదికను నిర్ధారించండి →",
    "lp.mock.operations": "కార్యకలాపాల అవలోకనం",
    "lp.mock.demoData": "డెమో డేటా",
    "lp.mock.reports": "నివేదికలు",
    "lp.mock.sampleRecords": "నమూనా రికార్డులు",
    "lp.mock.awaiting": "సమీక్ష కోసం వేచి ఉంది",
    "lp.mock.queue": "ఉదాహరణ క్యూ",
    "lp.mock.stockAttention": "నిల్వపై దృష్టి",
    "lp.mock.sampleInventory": "ORS · నమూనా నిల్వ",
    "lp.mock.review": "సమీక్ష",
    "lp.mock.confirmedByWorker": "కార్యకర్త ధృవీకరించారు",
    "lp.mock.received": "అందింది"
  });
  Object.assign(locales.mr, {
    "lp.hero.cta": "प्रोटोटाइप पाहा",
    "lp.faq.q5": "BUSHO व्हॉइस रेकॉर्डिंग साठवते का?",
    "lp.faq.a5": "BUSHO ऑडिओ साठवत नाही. ब्राउझरच्या स्पीच सेवेनुसार ऑडिओ ब्राउझर पुरवठादाराकडे पाठवला जाऊ शकतो.",
    "lp.faq.q6": "मी डेमोमध्ये खऱ्या रुग्णांची माहिती वापरू शकतो का?",
    "lp.faq.a6": "नाही. हा प्रोटोटाइप फक्त काल्पनिक उदाहरणांसाठी आहे. प्रत्यक्ष वापरासाठी आवश्यक सुरक्षा किंवा वैद्यकीय डेटा पायाभूत सुविधा यात नाहीत.",
    "lp.mock.fieldReport": "क्षेत्रीय अहवाल",
    "lp.mock.todaysUpdate": "आजचा अपडेट",
    "lp.mock.draft": "मसुदा",
    "lp.mock.original": "मूळ अहवाल",
    "lp.mock.report": "12 रुग्णांना ताप. 20 ORS पाकिटे शिल्लक.",
    "lp.mock.condition": "आरोग्य स्थिती",
    "lp.mock.fever": "ताप",
    "lp.mock.patients": "12 रुग्ण",
    "lp.mock.stock": "साठा",
    "lp.mock.packets": "20 पाकिटे",
    "lp.mock.reviewFields": "माहिती तपासा",
    "lp.mock.confirm": "अहवाल निश्चित करा →",
    "lp.mock.operations": "कार्यवाहीचा आढावा",
    "lp.mock.demoData": "डेमो डेटा",
    "lp.mock.reports": "अहवाल",
    "lp.mock.sampleRecords": "नमुना नोंदी",
    "lp.mock.awaiting": "पुनरावलोकन बाकी",
    "lp.mock.queue": "उदाहरण यादी",
    "lp.mock.stockAttention": "साठ्याकडे लक्ष द्या",
    "lp.mock.sampleInventory": "ORS · नमुना साठा",
    "lp.mock.review": "पुनरावलोकन",
    "lp.mock.confirmedByWorker": "कर्मचाऱ्याने पुष्टी केली",
    "lp.mock.received": "प्राप्त"
  });


  Object.assign(locales.ta, { 'voice.errorDetail': 'பேச்சு அறிதல் தோல்வியடைந்தது ({error}). விவரங்களுக்கு உலாவி கன்சோலைப் பார்க்கவும்.' });
  Object.assign(locales.te, { 'voice.errorDetail': 'వాయిస్ గుర్తింపు విఫలమైంది ({error}). వివరాల కోసం బ్రౌజర్ కన్సోల్ చూడండి.' });
  Object.assign(locales.bn, { 'voice.errorDetail': 'স্পিচ শনাক্তকরণ ব্যর্থ হয়েছে ({error})। বিস্তারিত জানতে ব্রাউজার কনসোল দেখুন।' });
  Object.assign(locales.mr, { 'voice.errorDetail': 'व्हॉइस ओळख अयशस्वी झाली ({error}). तपशीलांसाठी ब्राउझर कन्सोल पहा.' });

  // Expose locale dictionaries directly for scripts/check-untranslated.mjs
  const exposed = Object.assign({}, locales);
  exposed.t = t;
  exposed.setLanguage = setLanguage;
  exposed.onLanguageChange = onLanguageChange;
  exposed.getLocales = getLocales;
  exposed.getCurrentLanguage = getCurrentLanguage;
  exposed.enabledLanguages = enabledLanguages.slice();
  exposed.locales = locales;
  window.BUSHO_I18N = exposed;

  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(detectLanguage());

    const selects = document.querySelectorAll('#lang-select, #lang-select-footer');
    selects.forEach(select => {
      if (select) {
        select.querySelectorAll('option').forEach(option => { option.hidden = !enabledLanguages.includes(option.value); option.disabled = !enabledLanguages.includes(option.value); });
        select.value = currentLang;
        select.addEventListener('change', (e) => {
          setLanguage(e.target.value);
          selects.forEach(s => { if (s !== select) s.value = e.target.value; });
        });
      }
    });
  });
})();

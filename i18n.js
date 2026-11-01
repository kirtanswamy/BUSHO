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
      'worker.step1': 'Step 1 of 3: Report',
      'worker.step2': 'Step 2 of 3: Check',
      'worker.step3': 'Step 3 of 3: Confirm',
      'worker.sendUpdate': 'Send a field update',
      'worker.channel': 'Text / Voice',
      'worker.placeholder': 'Describe what you saw today: symptoms, counts, stock levels...',
      'worker.voiceBtn': 'Voice input (demo)',
      'worker.voiceNote': 'Voice transcription is simulated in this prototype',
      'worker.tryExample': 'Try an example',
      'worker.sample.routine': 'Routine report',
      'worker.sample.ambiguous': 'Ambiguous report',
      'worker.extractBtn': 'Extract report',
      'worker.privacy': 'No names, phone numbers or diagnoses are collected.',
      'worker.draftTitle': 'What BUSHO heard',
      'worker.draftAwaiting': 'Awaiting extraction',
      'worker.draftNeedsVerify': 'Needs verification',
      'worker.draftVerified': 'Verified by worker',
      'worker.provisional': 'AI-extracted information is provisional. Review each field. Nothing is committed until you confirm.',
      'worker.provisionalFlagged': 'Provisional draft needs human verification. Flagged fields must be clarified before the record can be confirmed.',
      'worker.provisionalVerified': 'Verified operational record. Confirmed by the health worker in this browser-local demo.',
      'worker.confidenceKey': 'High confidence · Needs review',
      'worker.engineLabel': 'Mock extraction engine · Schema validated',
      'worker.verifyPrompt': 'Does this look right for today\'s report?',
      'worker.verifyNote': 'Confirmation creates a verified operational record. BUSHO does not diagnose.',
      'worker.editBtn': 'Edit fields',
      'worker.confirmBtn': 'Confirm report',
      'worker.seeSupervisor': 'See what the supervisor sees',
      'worker.toast.routine': 'Routine sample loaded',
      'worker.toast.ambiguous': 'Ambiguous sample loaded',
      'worker.toast.extract': 'Draft created. Review before confirming',
      'worker.toast.extractAmbiguous': 'Draft created. Clarify the flagged fields',
      'worker.toast.empty': 'Enter a field report before extracting',
      'worker.toast.confirm': 'Verified report saved in browser-local demo state',
      'worker.toast.edit': 'Review the extracted fields, then confirm the corrected draft',
      'worker.toast.validate': 'Some extracted fields still need clarification',
      'worker.toast.voice': 'Voice transcription is not implemented. Use text input or a sample report',

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
      'worker.provisionalVerifiedTitle': 'Verified operational record',
      'worker.emptyReport': 'No report entered yet.',
      'worker.toast.save': 'Browser-local demo state could not be saved',
      'worker.toast.extractFirst': 'Extract a draft before confirming',
      'draft.symptomsValue': 'Fever: {fever} mentions; diarrhea: {diarrhea} mentions',
      'draft.symptomsUnclear': 'Symptoms mentioned; count unclear',
      'draft.quantityUnclear': 'Quantity not stated',
      'draft.almostFinished': 'Almost finished',
      'supervisor.sourceVerified': 'verified worker report',
      'supervisor.sourceSynthetic': 'synthetic inventory snapshot',
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
    }
  };
  const localeLabels = { hi: 'हिंदी', ta: 'தமிழ்', te: 'తెలుగు', bn: 'বাংলা', mr: 'मराठी' };
  const addedTranslations = {
    hi: {
      'worker.subtitle': 'स्वाभाविक रूप से लिखें। पुष्टि से पहले BUSHO ने जो समझा, उसे देखें।', 'worker.step1': 'चरण 1/3: रिपोर्ट', 'worker.step2': 'चरण 2/3: जाँच', 'worker.step3': 'चरण 3/3: पुष्टि', 'worker.sendUpdate': 'क्षेत्र अपडेट भेजें', 'worker.channel': 'टेक्स्ट / आवाज़', 'worker.placeholder': 'आज आपने क्या देखा लिखें: लक्षण, संख्या, स्टॉक...', 'worker.voiceBtn': 'आवाज़ इनपुट (डेमो)', 'worker.voiceNote': 'इस प्रोटोटाइप में आवाज़ से लिखना सिम्युलेटेड है', 'worker.tryExample': 'उदाहरण आज़माएँ', 'worker.extractBtn': 'रिपोर्ट का मसौदा बनाएँ', 'worker.privacy': 'नाम, फोन नंबर या निदान नहीं लिए जाते।', 'worker.draftTitle': 'BUSHO ने क्या समझा', 'worker.draftAwaiting': 'मसौदा बनने की प्रतीक्षा', 'worker.draftNeedsVerify': 'पुष्टि ज़रूरी', 'worker.draftVerified': 'कर्मी ने जाँचा', 'worker.provisionalTitle': 'मसौदा अस्थायी है', 'worker.provisionalDesc': 'हर क्षेत्र को देखें। पुष्टि तक कुछ भी दर्ज नहीं होता।', 'worker.provisionalFlaggedTitle': 'मसौदे की मानव जाँच ज़रूरी है', 'worker.provisionalVerifiedTitle': 'सत्यापित रिकॉर्ड', 'worker.verifyPrompt': 'क्या यह आज की रिपोर्ट के लिए सही है?', 'worker.verifyNote': 'पुष्टि से सत्यापित रिकॉर्ड बनता है। BUSHO निदान नहीं करता।', 'worker.editBtn': 'क्षेत्र बदलें', 'worker.confirmBtn': 'रिपोर्ट की पुष्टि करें', 'worker.seeSupervisor': 'पर्यवेक्षक का दृश्य देखें', 'worker.toast.empty': 'मसौदा बनाने से पहले क्षेत्र रिपोर्ट लिखें', 'worker.toast.extract': 'मसौदा बना। पुष्टि से पहले जाँचें', 'worker.toast.extractAmbiguous': 'मसौदा बना। चिन्हित क्षेत्र स्पष्ट करें', 'worker.toast.extractFirst': 'पहले मसौदा बनाएँ', 'worker.toast.validate': 'कुछ क्षेत्र अभी स्पष्ट करने हैं', 'worker.toast.confirm': 'सत्यापित रिपोर्ट इस ब्राउज़र में सहेजी गई', 'worker.toast.edit': 'क्षेत्र जाँचें और सही मसौदे की पुष्टि करें', 'worker.toast.voice': 'आवाज़ से लिखना उपलब्ध नहीं है। टेक्स्ट या उदाहरण प्रयोग करें', 'worker.toast.routine': 'सामान्य उदाहरण लोड हुआ', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड हुआ', 'worker.toast.save': 'डेमो स्थिति सहेजी नहीं जा सकी', 'worker.emptyReport': 'अभी कोई रिपोर्ट नहीं लिखी गई', 'worker.draft': 'मसौदा', 'worker.emptyTitle': 'जाँच मसौदा बनाने के लिए रिपोर्ट का मसौदा बनाएँ', 'worker.emptyDesc': 'पुष्टि तक क्षेत्र अस्थायी रहेंगे', 'draft.symptomsValue': 'बुखार: {fever} उल्लेख; दस्त: {diarrhea} उल्लेख', 'draft.symptomsUnclear': 'लक्षण बताए गए; संख्या स्पष्ट नहीं', 'draft.quantityUnclear': 'मात्रा नहीं बताई गई', 'draft.almostFinished': 'लगभग खत्म', 'draft.source': 'रिपोर्ट से निकाला गया', 'draft.needsClarify': 'पुष्टि से पहले स्पष्ट करें', 'draft.quantityNeeded': 'मात्रा चाहिए', 'draft.safeByDesign': 'सुरक्षा के लिए', 'draft.clinicalStatus': 'स्वास्थ्य स्थिति', 'draft.clinicalValue': 'सिर्फ रिपोर्ट किया रुझान; निदान नहीं', 'supervisor.sourceVerified': 'सत्यापित कर्मी रिपोर्ट', 'supervisor.sourceSynthetic': 'कृत्रिम स्टॉक स्नैपशॉट'
    },
    ta: { 'worker.subtitle': 'இயல்பாக எழுதுங்கள். உறுதிப்படுத்தும் முன் BUSHO புரிந்ததைப் பாருங்கள்.', 'worker.step1': 'படி 1/3: அறிக்கை', 'worker.step2': 'படி 2/3: சரிபார்ப்பு', 'worker.step3': 'படி 3/3: உறுதி', 'worker.sendUpdate': 'களப் புதுப்பிப்பை அனுப்புங்கள்', 'worker.placeholder': 'இன்று பார்த்ததை எழுதுங்கள்: அறிகுறிகள், எண்ணிக்கை, இருப்பு...', 'worker.extractBtn': 'வரைவை உருவாக்கு', 'worker.draftAwaiting': 'வரைவுக்காக காத்திருக்கிறது', 'worker.draftNeedsVerify': 'சரிபார்ப்பு தேவை', 'worker.draftVerified': 'பணியாளர் சரிபார்த்தது', 'worker.provisionalTitle': 'வரைவு தற்காலிகமானது', 'worker.provisionalDesc': 'உறுதி செய்யும் முன் ஒவ்வொரு பகுதியையும் பாருங்கள்.', 'worker.confirmBtn': 'அறிக்கையை உறுதி செய்', 'worker.editBtn': 'பகுதிகளை திருத்து', 'worker.toast.empty': 'வரைவு உருவாக்கும் முன் அறிக்கையை எழுதுங்கள்', 'worker.toast.extract': 'வரைவு உருவானது. உறுதி செய்யும் முன் சரிபாருங்கள்', 'worker.toast.extractAmbiguous': 'வரைவு உருவானது. குறிக்கப்பட்ட பகுதிகளை தெளிவுபடுத்துங்கள்', 'worker.toast.confirm': 'சரிபார்க்கப்பட்ட அறிக்கை இந்த உலாவியில் சேமிக்கப்பட்டது', 'worker.toast.voice': 'குரல் உள்ளீடு இல்லை. உரை அல்லது உதாரணத்தைப் பயன்படுத்துங்கள்', 'worker.toast.routine': 'வழக்கமான உதாரணம் ஏற்றப்பட்டது', 'worker.toast.ambiguous': 'தெளிவில்லாத உதாரணம் ஏற்றப்பட்டது', 'worker.toast.validate': 'சில பகுதிகள் இன்னும் தெளிவாக வேண்டும்', 'worker.draft': 'வரைவு', 'worker.emptyTitle': 'சரிபார்ப்பு வரைவைக் காண அறிக்கையை உருவாக்குங்கள்', 'worker.emptyDesc': 'உறுதி செய்யும் வரை பகுதிகள் தற்காலிகமாக இருக்கும்', 'draft.symptomsValue': 'காய்ச்சல்: {fever}; வயிற்றுப்போக்கு: {diarrhea}', 'draft.symptomsUnclear': 'அறிகுறிகள் உள்ளன; எண்ணிக்கை தெளிவில்லை', 'draft.quantityUnclear': 'அளவு குறிப்பிடப்படவில்லை', 'draft.almostFinished': 'கிட்டத்தட்ட முடிந்தது', 'draft.source': 'அறிக்கையிலிருந்து எடுக்கப்பட்டது', 'draft.needsClarify': 'உறுதி முன் தெளிவுபடுத்துங்கள்', 'draft.quantityNeeded': 'அளவு தேவை', 'draft.safeByDesign': 'பாதுகாப்புக்காக', 'draft.clinicalValue': 'அறிக்கை செய்த போக்கு மட்டும்; நோய் கண்டறிதல் இல்லை', 'supervisor.sourceVerified': 'சரிபார்க்கப்பட்ட பணியாளர் அறிக்கை', 'supervisor.sourceSynthetic': 'செயற்கை இருப்பு snapshot' },
    te: { 'worker.subtitle': 'సహజంగా రాయండి. నిర్ధారించే ముందు BUSHO అర్థం చేసుకున్నది చూడండి.', 'worker.step1': 'దశ 1/3: నివేదిక', 'worker.step2': 'దశ 2/3: తనిఖీ', 'worker.step3': 'దశ 3/3: నిర్ధారణ', 'worker.sendUpdate': 'ఫీల్డ్ అప్‌డేట్ పంపండి', 'worker.placeholder': 'ఈ రోజు చూసినది రాయండి: లక్షణాలు, సంఖ్యలు, నిల్వ...', 'worker.extractBtn': 'డ్రాఫ్ట్ తయారు చేయండి', 'worker.draftAwaiting': 'డ్రాఫ్ట్ కోసం వేచి ఉంది', 'worker.draftNeedsVerify': 'నిర్ధారణ అవసరం', 'worker.draftVerified': 'కార్మికుడు తనిఖీ చేశారు', 'worker.provisionalTitle': 'డ్రాఫ్ట్ తాత్కాలికం', 'worker.provisionalDesc': 'నిర్ధారించే ముందు ప్రతి అంశాన్ని చూడండి.', 'worker.confirmBtn': 'నివేదికను నిర్ధారించండి', 'worker.editBtn': 'అంశాలను మార్చండి', 'worker.toast.empty': 'డ్రాఫ్ట్ చేయడానికి ముందు నివేదిక రాయండి', 'worker.toast.extract': 'డ్రాఫ్ట్ తయారైంది. నిర్ధారించే ముందు తనిఖీ చేయండి', 'worker.toast.extractAmbiguous': 'డ్రాఫ్ట్ తయారైంది. గుర్తించిన అంశాలను స్పష్టం చేయండి', 'worker.toast.confirm': 'నిర్ధారించిన నివేదిక ఈ బ్రౌజర్‌లో సేవ్ అయింది', 'worker.toast.voice': 'వాయిస్ ఇన్‌పుట్ లేదు. టెక్స్ట్ లేదా ఉదాహరణ వాడండి', 'worker.toast.routine': 'సాధారణ ఉదాహరణ లోడ్ అయింది', 'worker.toast.ambiguous': 'స్పష్టత లేని ఉదాహరణ లోడ్ అయింది', 'worker.toast.validate': 'కొన్ని అంశాలు ఇంకా స్పష్టంగా లేవు', 'worker.draft': 'డ్రాఫ్ట్', 'worker.emptyTitle': 'తనిఖీ డ్రాఫ్ట్ కోసం నివేదికను తయారు చేయండి', 'worker.emptyDesc': 'నిర్ధారించే వరకు అంశాలు తాత్కాలికంగా ఉంటాయి', 'draft.symptomsValue': 'జ్వరం: {fever}; విరేచనాలు: {diarrhea}', 'draft.symptomsUnclear': 'లక్షణాలు ఉన్నాయి; సంఖ్య తెలియదు', 'draft.quantityUnclear': 'పరిమాణం చెప్పలేదు', 'draft.almostFinished': 'దాదాపు అయిపోయింది', 'draft.source': 'నివేదిక నుంచి తీసుకున్నది', 'draft.needsClarify': 'నిర్ధారణకు ముందు స్పష్టం చేయండి', 'draft.quantityNeeded': 'పరిమాణం అవసరం', 'draft.safeByDesign': 'భద్రత కోసం', 'draft.clinicalValue': 'నివేదించిన ధోరణి మాత్రమే; రోగనిర్ధారణ లేదు', 'supervisor.sourceVerified': 'నిర్ధారించిన కార్మిక నివేదిక', 'supervisor.sourceSynthetic': 'కృత్రిమ నిల్వ snapshot' },
    bn: { 'worker.subtitle': 'স্বাভাবিকভাবে লিখুন। নিশ্চিত করার আগে BUSHO কী বুঝেছে দেখুন।', 'worker.step1': 'ধাপ ১/৩: রিপোর্ট', 'worker.step2': 'ধাপ ২/৩: পরীক্ষা', 'worker.step3': 'ধাপ ৩/৩: নিশ্চিত', 'worker.sendUpdate': 'ফিল্ড আপডেট পাঠান', 'worker.placeholder': 'আজ যা দেখেছেন লিখুন: লক্ষণ, সংখ্যা, মজুত...', 'worker.extractBtn': 'খসড়া তৈরি করুন', 'worker.draftAwaiting': 'খসড়ার অপেক্ষা', 'worker.draftNeedsVerify': 'যাচাই দরকার', 'worker.draftVerified': 'কর্মী যাচাই করেছেন', 'worker.provisionalTitle': 'খসড়াটি অস্থায়ী', 'worker.provisionalDesc': 'নিশ্চিত করার আগে প্রতিটি অংশ দেখুন।', 'worker.confirmBtn': 'রিপোর্ট নিশ্চিত করুন', 'worker.editBtn': 'অংশ সম্পাদনা করুন', 'worker.toast.empty': 'খসড়া তৈরির আগে রিপোর্ট লিখুন', 'worker.toast.extract': 'খসড়া তৈরি হয়েছে। নিশ্চিত করার আগে দেখুন', 'worker.toast.extractAmbiguous': 'খসড়া তৈরি হয়েছে। চিহ্নিত অংশ স্পষ্ট করুন', 'worker.toast.confirm': 'নিশ্চিত রিপোর্ট এই ব্রাউজারে রাখা হয়েছে', 'worker.toast.voice': 'ভয়েস ইনপুট নেই। টেক্সট বা উদাহরণ ব্যবহার করুন', 'worker.toast.routine': 'সাধারণ উদাহরণ লোড হয়েছে', 'worker.toast.ambiguous': 'অস্পষ্ট উদাহরণ লোড হয়েছে', 'worker.toast.validate': 'কিছু অংশ এখনও স্পষ্ট করা দরকার', 'worker.draft': 'খসড়া', 'worker.emptyTitle': 'যাচাই খসড়া দেখতে রিপোর্ট তৈরি করুন', 'worker.emptyDesc': 'নিশ্চিত না হওয়া পর্যন্ত অংশগুলি অস্থায়ী', 'draft.symptomsValue': 'জ্বর: {fever}; ডায়রিয়া: {diarrhea}', 'draft.symptomsUnclear': 'লক্ষণ আছে; সংখ্যা স্পষ্ট নয়', 'draft.quantityUnclear': 'পরিমাণ বলা হয়নি', 'draft.almostFinished': 'প্রায় শেষ', 'draft.source': 'রিপোর্ট থেকে নেওয়া', 'draft.needsClarify': 'নিশ্চিত করার আগে স্পষ্ট করুন', 'draft.quantityNeeded': 'পরিমাণ দরকার', 'draft.safeByDesign': 'নিরাপত্তার জন্য', 'draft.clinicalValue': 'শুধু রিপোর্ট করা প্রবণতা; রোগ নির্ণয় নয়', 'supervisor.sourceVerified': 'যাচাই করা কর্মীর রিপোর্ট', 'supervisor.sourceSynthetic': 'কৃত্রিম মজুতের ছবি' },
    mr: { 'worker.subtitle': 'सहजपणे लिहा. पुष्टी करण्यापूर्वी BUSHO ने काय समजले ते पाहा.', 'worker.step1': 'पायरी १/३: अहवाल', 'worker.step2': 'पायरी २/३: तपासणी', 'worker.step3': 'पायरी ३/३: पुष्टी', 'worker.sendUpdate': 'क्षेत्र अहवाल पाठवा', 'worker.placeholder': 'आज काय पाहिले ते लिहा: लक्षणे, संख्या, साठा...', 'worker.extractBtn': 'मसुदा तयार करा', 'worker.draftAwaiting': 'मसुद्याची प्रतीक्षा', 'worker.draftNeedsVerify': 'तपासणी आवश्यक', 'worker.draftVerified': 'कर्मचाऱ्याने तपासले', 'worker.provisionalTitle': 'मसुदा तात्पुरता आहे', 'worker.provisionalDesc': 'पुष्टीपूर्वी प्रत्येक भाग तपासा.', 'worker.confirmBtn': 'अहवालाची पुष्टी करा', 'worker.editBtn': 'भाग बदला', 'worker.toast.empty': 'मसुदा तयार करण्यापूर्वी अहवाल लिहा', 'worker.toast.extract': 'मसुदा तयार झाला. पुष्टीपूर्वी तपासा', 'worker.toast.extractAmbiguous': 'मसुदा तयार झाला. चिन्हांकित भाग स्पष्ट करा', 'worker.toast.confirm': 'पुष्टी केलेला अहवाल या ब्राउझरमध्ये जतन झाला', 'worker.toast.voice': 'आवाज इनपुट उपलब्ध नाही. मजकूर किंवा उदाहरण वापरा', 'worker.toast.routine': 'सामान्य उदाहरण लोड झाले', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड झाले', 'worker.toast.validate': 'काही भाग अजून स्पष्ट करणे आवश्यक आहे', 'worker.draft': 'मसुदा', 'worker.emptyTitle': 'तपासणीचा मसुदा पाहण्यासाठी अहवाल तयार करा', 'worker.emptyDesc': 'पुष्टी होईपर्यंत भाग तात्पुरते राहतील', 'draft.symptomsValue': 'ताप: {fever}; अतिसार: {diarrhea}', 'draft.symptomsUnclear': 'लक्षणे सांगितली; संख्या स्पष्ट नाही', 'draft.quantityUnclear': 'प्रमाण सांगितले नाही', 'draft.almostFinished': 'जवळजवळ संपले', 'draft.source': 'अहवालातून घेतले', 'draft.needsClarify': 'पुष्टीपूर्वी स्पष्ट करा', 'draft.quantityNeeded': 'प्रमाण आवश्यक', 'draft.safeByDesign': 'सुरक्षिततेसाठी', 'draft.clinicalValue': 'फक्त नोंदवलेला कल; निदान नाही', 'supervisor.sourceVerified': 'तपासलेला कर्मचाऱ्याचा अहवाल', 'supervisor.sourceSynthetic': 'कृत्रिम साठा नोंद' }
  };
  const translationOverrides = {
    hi: {
      'app.name': 'BUSHO', 'app.tagline': 'नीचे से ऊपर तक स्मार्ट स्वास्थ्य समन्वयक',
      'nav.howItWorks': 'यह कैसे काम करता है', 'nav.tryDemo': 'डेमो आज़माएँ', 'nav.safety': 'सुरक्षा', 'header.langLabel': 'भाषा',
      'hero.tryDemo': 'डेमो आज़माएँ', 'hero.seeHow': 'काम करने का तरीका देखें', 'hero.trust1': 'हर रिकॉर्ड की पुष्टि व्यक्ति करता है', 'hero.trust2': 'कोई निदान नहीं', 'hero.trust3': 'कृत्रिम डेमो डेटा',
      'how.title': 'यह कैसे काम करता है', 'how.step1.title': 'रिपोर्ट', 'how.step1.by': 'स्वास्थ्य कार्यकर्ता', 'how.step1.desc': 'अपने शब्दों में छोटा क्षेत्र अपडेट लिखता या बोलता है।', 'how.step2.title': 'मसौदा', 'how.step3.title': 'पुष्टि', 'how.step3.by': 'स्वास्थ्य कार्यकर्ता', 'how.step3.desc': 'कार्यकर्ता हर खाने को देखकर रिकॉर्ड की पुष्टि करता है।', 'how.step4.title': 'कार्रवाई', 'how.step4.by': 'पर्यवेक्षक', 'how.step4.desc': 'सत्यापित संकेत से दवा भरने का मसौदा तैयार होता है।',
      'worker.title': 'स्वास्थ्य कार्यकर्ता', 'worker.sendUpdate': 'क्षेत्र अपडेट भेजें', 'worker.channel': 'टेक्स्ट / आवाज़', 'worker.voiceBtn': 'आवाज़ इनपुट (डेमो)', 'worker.voiceNote': 'इस प्रोटोटाइप में आवाज़ से लिखना केवल डेमो है', 'worker.tryExample': 'उदाहरण आज़माएँ', 'worker.sample.routine': 'सामान्य रिपोर्ट', 'worker.sample.ambiguous': 'अस्पष्ट रिपोर्ट', 'worker.extractBtn': 'रिपोर्ट का मसौदा बनाएँ', 'worker.privacy': 'नाम, फोन नंबर या निदान नहीं लिए जाते।', 'worker.draftAwaiting': 'मसौदा बनने की प्रतीक्षा', 'worker.draftNeedsVerify': 'पुष्टि ज़रूरी', 'worker.draftVerified': 'स्वास्थ्य कार्यकर्ता ने जाँचा',
      'worker.provisional': 'यह जानकारी अस्थायी है। हर खाने को देखें। पुष्टि से पहले कुछ भी दर्ज नहीं होगा।', 'worker.provisionalFlagged': 'अस्थायी मसौदे की मानव जाँच ज़रूरी है। चिन्हित खाने स्पष्ट करने के बाद ही रिकॉर्ड की पुष्टि होगी।', 'worker.provisionalVerified': 'सत्यापित कामकाजी रिकॉर्ड। इस ब्राउज़र के डेमो में स्वास्थ्य कार्यकर्ता ने इसकी पुष्टि की है।', 'worker.confidenceKey': 'भरोसा अधिक · जाँच ज़रूरी', 'worker.engineLabel': 'नियम आधारित डेमो जाँच · ढाँचा जाँचा गया', 'worker.editBtn': 'खाने बदलें', 'worker.confirmBtn': 'रिपोर्ट की पुष्टि करें', 'worker.seeSupervisor': 'पर्यवेक्षक का दृश्य देखें',
      'worker.toast.routine': 'सामान्य उदाहरण लोड हुआ', 'worker.toast.ambiguous': 'अस्पष्ट उदाहरण लोड हुआ', 'worker.toast.extract': 'मसौदा बना। पुष्टि से पहले जाँचें', 'worker.toast.extractAmbiguous': 'मसौदा बना। चिन्हित खाने स्पष्ट करें', 'worker.toast.empty': 'मसौदा बनाने से पहले क्षेत्र रिपोर्ट लिखें', 'worker.toast.confirm': 'सत्यापित रिपोर्ट इस ब्राउज़र में सहेजी गई', 'worker.toast.edit': 'खाने जाँचें और सही मसौदे की पुष्टि करें', 'worker.toast.validate': 'कुछ खाने अभी स्पष्ट करने हैं', 'worker.toast.voice': 'आवाज़ से लिखना उपलब्ध नहीं है। टेक्स्ट या उदाहरण प्रयोग करें',
      'draft.symptoms': 'बताए गए लक्षण', 'draft.orsStock': 'बचा हुआ स्टॉक / ORS', 'draft.ifaStock': 'बचा हुआ स्टॉक / आयरन और फोलिक एसिड', 'draft.clinicalStatus': 'स्वास्थ्य स्थिति', 'draft.source': 'रिपोर्ट से लिया गया', 'draft.confidence.high': 'भरोसा अधिक', 'draft.confidence.review': 'जाँच ज़रूरी', 'draft.confidence.workerChecked': 'कार्यकर्ता ने जाँचा', 'draft.needsClarify': 'पुष्टि से पहले स्पष्ट करें', 'draft.quantityNeeded': 'मात्रा चाहिए', 'draft.safeByDesign': 'सुरक्षा के लिए',
      'supervisor.title': 'पर्यवेक्षक', 'supervisor.subtitle': 'सत्यापित स्टॉक संकेतों को साफ संदर्भ और मानव मंज़ूरी के साथ देखें।', 'supervisor.priorityLabel': 'ज़रूरी जाँच', 'supervisor.priorityTitle': 'रामपुर HWC में बुखार का संकेत', 'supervisor.priorityTrend': '+38% उल्लेख / केवल स्वास्थ्य रुझान', 'supervisor.priorityState': 'जाँच ज़रूरी', 'supervisor.metric.reports': 'मिली रिपोर्ट', 'supervisor.metric.pending': 'पुष्टि की प्रतीक्षा', 'supervisor.metric.lowStock': 'कम स्टॉक वाली दवाएँ', 'supervisor.metric.stockout': 'स्टॉक खत्म होने की आशंका', 'supervisor.metric.trend.positive': 'मौजूदा सत्यापित रिपोर्ट शामिल है', 'supervisor.metric.trend.baseline': 'कृत्रिम आधार', 'supervisor.metric.trend.warning': 'कार्यकर्ता की जाँच ज़रूरी', 'supervisor.metric.trend.allReviewed': 'मौजूदा सभी रिपोर्ट जाँची गईं', 'supervisor.metric.trend.stockout': 'ORS · बताए गए इस्तेमाल के आधार पर', 'supervisor.trendLabel': 'स्वास्थ्य संकेत की जाँच', 'supervisor.trendTitle': 'संदर्भ सहित बताए गए लक्षण', 'supervisor.trendChip': 'जाँच ज़रूरी', 'supervisor.trendNumber': 'रामपुर HWC में बुखार के उल्लेख', 'supervisor.trendDesc': 'पिछले 7 दिनों की रिपोर्टिंग से तुलना', 'supervisor.chartLabel': '7 दिन पहले', 'supervisor.safetyCallout': 'यह बताया गया स्वास्थ्य रुझान है। मानव जाँच के लिए संकेत है। इससे बीमारी या प्रकोप की पुष्टि नहीं होती।', 'supervisor.inventoryLabel': 'स्टॉक की जानकारी', 'supervisor.inventoryTitle': 'ध्यान देने योग्य स्टॉक', 'supervisor.viewAll': 'सब देखें', 'supervisor.inventory.ifa': 'आयरन और फोलिक एसिड', 'supervisor.inventory.zinc': 'जिंक की गोलियाँ', 'supervisor.inventory.needsAttention': 'ध्यान दें',
      'supervisor.chartToday': 'आज', 'supervisor.inventory.ors': 'ORS पैकेट', 'supervisor.inventory.healthy': 'स्टॉक ठीक है', 'supervisor.severity.critical': 'बहुत कम', 'supervisor.severity.warning': 'कम', 'supervisor.severity.safe': 'ठीक',
      'safety.state1.label': 'अवस्था ०१', 'safety.state1.pill': 'असत्यापित', 'safety.state2.label': 'अवस्था ०२', 'safety.state3.label': 'अवस्था ०३',
      'supervisor.responseTitle': 'सत्यापित रिपोर्ट प्रशासनिक जाँच के लिए उपलब्ध है', 'supervisor.responseCopy': 'कम स्टॉक वाली वस्तु चुनकर भरपाई का मसौदा बनाएँ। यह डेमो कोई खरीद आदेश नहीं बनाता।', 'supervisor.responseTitleDraft': 'भरपाई का मसौदा मंज़ूरी के लिए तैयार है', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} तक भरपाई का प्रस्ताव। स्रोत: {source}।', 'supervisor.responseTitleApproved': 'डेमो में भरपाई का मसौदा मंज़ूर हुआ', 'supervisor.responseCopyApproved': '{name} / प्रस्तावित भरपाई की मात्रा जाँच के लिए दर्ज है। कोई खरीद आदेश नहीं दिया गया।', 'supervisor.statusAwaiting': 'प्रशासनिक कार्रवाई की प्रतीक्षा', 'supervisor.statusPending': 'मंज़ूरी की प्रतीक्षा', 'supervisor.statusApproved': 'डेमो में मंज़ूर', 'supervisor.approveBtn': 'मसौदा मंज़ूर करें', 'supervisor.approvedBtn': 'मसौदा मंज़ूर हुआ', 'supervisor.drawerTitle': 'स्टॉक का विवरण', 'supervisor.drawerNote': 'यह केवल डेमो स्टॉक है। वस्तु का मसौदा मंज़ूरी रिकॉर्ड बनाता है; कोई आदेश नहीं देता।', 'supervisor.drawerDraftBtn': 'भरपाई का मसौदा बनाएँ', 'supervisor.drawerNoAction': 'कार्रवाई की ज़रूरत नहीं', 'supervisor.toast.draftCreated': '{name} की भरपाई का मसौदा प्रशासनिक मंज़ूरी के लिए बना', 'supervisor.toast.approved': 'डेमो में मसौदा मंज़ूर किया गया। कोई खरीद आदेश नहीं दिया गया', 'supervisor.toast.confirmed': 'पर्यवेक्षक दृश्य में एक संकेत स्वास्थ्य कार्यकर्ता की पुष्टि की प्रतीक्षा कर रहा है',
      'safety.title': 'बनी हुई सुरक्षा सीमाएँ', 'safety.subtitle': 'साफ अवस्थाएँ उत्पाद पर भरोसा बढ़ाती हैं।', 'safety.desc': 'BUSHO कार्यकर्ता की रिपोर्ट, मानव जाँच और प्रशासनिक प्रतिक्रिया को अलग-अलग रिकॉर्ड के रूप में दिखाता है।', 'safety.state1.title': 'बताया गया स्वास्थ्य रुझान', 'safety.state1.desc': 'स्रोत और संदर्भ के साथ मानव जाँच के लिए क्षेत्र संकेत।', 'safety.state1.footer': 'स्रोत: पहचान हटाई गई कार्यकर्ता रिपोर्ट', 'safety.state2.pill': 'सबूत ज़रूरी', 'safety.state2.title': 'पुष्ट चिकित्सकीय घटना', 'safety.state2.desc': 'चिकित्सकीय निष्कर्ष के लिए अधिकृत जाँच ज़रूरी है। BUSHO यह निर्णय अपने मसौदा प्रवाह से बाहर रखता है।', 'safety.state2.footer': 'चिकित्सकीय जाँच मानव के नेतृत्व में', 'safety.state3.pill': 'मंज़ूरी ज़रूरी', 'safety.state3.title': 'प्रशासनिक कार्रवाई', 'safety.state3.desc': 'सत्यापित स्टॉक से भरपाई का मसौदा बन सकता है। अधिकृत प्रशासक ही अनुरोध मंज़ूर करता है।', 'safety.state3.footer': 'मंज़ूरी की प्रतीक्षा में मसौदा अनुरोध',
      'footer.terms': 'शर्तें', 'footer.privacy': 'गोपनीयता', 'footer.reset': 'डेमो डेटा रीसेट', 'footer.aiNote': 'अनुवाद डेमो के लिए तैयार किए गए हैं और वास्तविक उपयोग से पहले स्थानीय वक्ता की जाँच ज़रूरी है।', 'glossary.hwc': 'स्वास्थ्य और कल्याण केंद्र', 'glossary.cho': 'सामुदायिक स्वास्थ्य अधिकारी', 'glossary.ors': 'मौखिक पुनर्जलीकरण लवण', 'unit.packets': 'पैकेट', 'unit.strips': 'स्ट्रिप', 'unit.tablets': 'गोलियाँ',
      'worker.draft': 'मसौदा', 'worker.emptyTitle': 'जाँच मसौदा बनाने के लिए रिपोर्ट चलाएँ', 'worker.emptyDesc': 'पुष्टि तक खाने अस्थायी रहेंगे', 'worker.provisionalTitle': 'मसौदा जानकारी अस्थायी है', 'worker.provisionalDesc': 'हर खाने को देखें। पुष्टि तक कुछ भी दर्ज नहीं होगा।', 'worker.provisionalFlaggedTitle': 'मसौदे की मानव जाँच ज़रूरी है', 'worker.provisionalVerifiedTitle': 'सत्यापित कामकाजी रिकॉर्ड', 'worker.emptyReport': 'अभी कोई रिपोर्ट नहीं लिखी गई', 'worker.toast.save': 'ब्राउज़र में डेमो स्थिति सहेजी नहीं जा सकी', 'worker.toast.extractFirst': 'पुष्टि से पहले मसौदा बनाएँ', 'draft.symptomsValue': 'बुखार: {fever} उल्लेख; दस्त: {diarrhea} उल्लेख', 'draft.quantityUnclear': 'मात्रा नहीं बताई गई', 'draft.almostFinished': 'लगभग खत्म', 'supervisor.sourceVerified': 'सत्यापित कार्यकर्ता रिपोर्ट', 'supervisor.sourceSynthetic': 'कृत्रिम स्टॉक विवरण'
    },
    mr: {
      'how.step1.desc': 'आरोग्य कार्यकर्ता स्वतःच्या शब्दांत छोटा क्षेत्र अहवाल लिहितो किंवा सांगतो।', 'how.step2.desc': 'BUSHO मोकळ्या मजकुरातून पाहण्यास सोपा मसुदा तयार करतो।', 'how.step3.desc': 'आरोग्य कार्यकर्ता प्रत्येक भाग तपासून अहवालाची पुष्टी करतो।', 'how.step4.desc': 'सत्यापित संकेतावरून भरपाईचा मसुदा मंजुरीसाठी तयार होतो।',
      'worker.channel': 'मजकूर / आवाज', 'worker.voiceBtn': 'आवाज नोंद (डेमो)', 'worker.voiceNote': 'या नमुन्यात आवाजातून लिहिणे फक्त डेमो आहे', 'worker.tryExample': 'उदाहरण वापरा', 'worker.sample.routine': 'नेहमीचा अहवाल', 'worker.sample.ambiguous': 'अस्पष्ट अहवाल', 'worker.privacy': 'नावे, फोन क्रमांक किंवा निदान घेतले जात नाही।', 'worker.draftTitle': 'BUSHO ने काय समजले', 'worker.provisional': 'ही माहिती तात्पुरती आहे। प्रत्येक भाग तपासा। पुष्टी होईपर्यंत काहीही नोंदवले जाणार नाही।', 'worker.provisionalFlagged': 'तात्पुरत्या मसुद्याची मानवी तपासणी आवश्यक आहे। चिन्हांकित भाग स्पष्ट केल्यावरच अहवालाची पुष्टी करता येईल।', 'worker.provisionalVerified': 'सत्यापित कामकाजाचा अहवाल। या ब्राउझरमधील डेमोमध्ये आरोग्य कार्यकर्त्याने पुष्टी केली आहे।', 'worker.confidenceKey': 'विश्वास जास्त · तपासणी आवश्यक', 'worker.engineLabel': 'नियमाधारित डेमो तपासणी · रचना तपासली', 'worker.verifyPrompt': 'आजच्या अहवालासाठी हे योग्य आहे का?', 'worker.verifyNote': 'पुष्टी केल्यावर सत्यापित कामकाजाचा अहवाल तयार होतो। BUSHO निदान करत नाही।', 'worker.seeSupervisor': 'पर्यवेक्षकाचे दृश्य पहा', 'worker.toast.edit': 'भाग तपासा आणि दुरुस्त मसुद्याची पुष्टी करा',
      'draft.symptoms': 'सांगितलेली लक्षणे', 'draft.orsStock': 'उरलेला साठा / ORS', 'draft.ifaStock': 'उरलेला साठा / लोह आणि फॉलिक आम्ल', 'draft.clinicalStatus': 'आरोग्य स्थिती', 'draft.confidence.high': 'विश्वास जास्त', 'draft.confidence.review': 'तपासणी आवश्यक', 'draft.confidence.workerChecked': 'कार्यकर्त्याने तपासले',
      'supervisor.subtitle': 'सत्यापित साठा संकेत स्पष्ट संदर्भ आणि मानवी मंजुरीसह पाहा।', 'supervisor.priorityLabel': 'तातडीची तपासणी', 'supervisor.priorityTitle': 'रामपूर HWC मधील तापाचा संकेत', 'supervisor.priorityTrend': '+38% उल्लेख / फक्त आरोग्य कल', 'supervisor.priorityState': 'तपासणी आवश्यक', 'supervisor.metric.reports': 'मिळालेले अहवाल', 'supervisor.metric.pending': 'पुष्टीची प्रतीक्षा', 'supervisor.metric.lowStock': 'कमी साठ्याची औषधे', 'supervisor.metric.stockout': 'साठा संपण्याची शक्यता', 'supervisor.metric.trend.positive': 'सध्याचा सत्यापित अहवाल समाविष्ट', 'supervisor.metric.trend.baseline': 'कृत्रिम आधार', 'supervisor.metric.trend.warning': 'कार्यकर्त्याची तपासणी आवश्यक', 'supervisor.metric.trend.allReviewed': 'सध्याचे सर्व अहवाल तपासले', 'supervisor.metric.trend.critical': 'रामपूर HWC मध्ये', 'supervisor.metric.trend.stockout': 'ORS · सांगितलेल्या वापरावर आधारित', 'supervisor.trendLabel': 'आरोग्य संकेत तपासणी', 'supervisor.trendTitle': 'संदर्भासह सांगितलेली लक्षणे', 'supervisor.trendChip': 'तपासणी आवश्यक', 'supervisor.trendNumber': 'रामपूर HWC मधील तापाचे उल्लेख', 'supervisor.trendDesc': 'मागील ७ दिवसांच्या अहवालांशी तुलना', 'supervisor.chartLabel': '७ दिवसांपूर्वी', 'supervisor.chartToday': 'आज', 'supervisor.safetyCallout': 'हा सांगितलेला आरोग्य कल आहे। मानवी तपासणीसाठी संकेत आहे। यामुळे आजार किंवा उद्रेक सिद्ध होत नाही।', 'supervisor.inventoryLabel': 'साठ्याची माहिती', 'supervisor.inventoryTitle': 'लक्ष देण्यासारखा साठा', 'supervisor.viewAll': 'सर्व पहा', 'supervisor.inventory.ors': 'ORS पाकिटे', 'supervisor.inventory.ifa': 'लोह आणि फॉलिक आम्ल', 'supervisor.inventory.zinc': 'झिंकच्या गोळ्या', 'supervisor.inventory.healthy': 'साठा ठीक', 'supervisor.inventory.needsAttention': 'लक्ष द्या', 'supervisor.severity.critical': 'अत्यंत कमी', 'supervisor.severity.warning': 'कमी', 'supervisor.severity.safe': 'ठीक',
      'supervisor.responseTitle': 'सत्यापित अहवाल प्रशासनाच्या तपासणीसाठी उपलब्ध आहे', 'supervisor.responseCopy': 'कमी साठ्याची वस्तू निवडून भरपाईचा मसुदा तयार करा। हा डेमो खरेदी आदेश देत नाही।', 'supervisor.responseTitleDraft': 'भरपाईचा मसुदा मंजुरीसाठी तयार आहे', 'supervisor.responseCopyDraft': '{name} / {qty} {unit} पर्यंत भरपाईचा प्रस्ताव। स्रोत: {source}।', 'supervisor.responseTitleApproved': 'डेमोमध्ये भरपाईचा मसुदा मंजूर झाला', 'supervisor.responseCopyApproved': '{name} / प्रस्तावित भरपाईची मात्रा तपासणीसाठी नोंदवली आहे। खरेदी आदेश दिला नाही।', 'supervisor.statusAwaiting': 'प्रशासकीय कृतीची प्रतीक्षा', 'supervisor.statusPending': 'मंजुरीची प्रतीक्षा', 'supervisor.statusApproved': 'डेमोमध्ये मंजूर', 'supervisor.approveBtn': 'मसुदा मंजूर करा', 'supervisor.approvedBtn': 'मसुदा मंजूर', 'supervisor.drawerTitle': 'साठ्याचा तपशील', 'supervisor.drawerNote': 'हा फक्त डेमो साठा आहे। वस्तूचा मसुदा मंजुरीची नोंद तयार करतो; आदेश देत नाही।', 'supervisor.drawerDraftBtn': 'भरपाईचा मसुदा तयार करा', 'supervisor.drawerNoAction': 'कृती आवश्यक नाही', 'supervisor.toast.draftCreated': '{name} साठी भरपाईचा मसुदा प्रशासनाच्या मंजुरीसाठी तयार झाला', 'supervisor.toast.approved': 'डेमोमध्ये मसुदा मंजूर केला। खरेदी आदेश दिला नाही', 'supervisor.toast.confirmed': 'पर्यवेक्षक दृश्यात एका संकेताची आरोग्य कार्यकर्त्याच्या पुष्टीसाठी प्रतीक्षा आहे',
      'safety.subtitle': 'स्वच्छ अवस्था उत्पादनावर विश्वास वाढवते।', 'safety.desc': 'BUSHO कार्यकर्त्याचा अहवाल, मानवी तपासणी आणि प्रशासनाची प्रतिक्रिया वेगवेगळ्या नोंदी म्हणून दाखवतो।', 'safety.state1.label': 'अवस्था ०१', 'safety.state1.pill': 'असत्यापित', 'safety.state1.title': 'सांगितलेला आरोग्य कल', 'safety.state1.desc': 'स्रोत आणि संदर्भासह मानवी तपासणीसाठी क्षेत्र संकेत।', 'safety.state1.footer': 'स्रोत: ओळख काढलेले कार्यकर्ता अहवाल', 'safety.state2.label': 'अवस्था ०२', 'safety.state2.pill': 'पुरावा आवश्यक', 'safety.state2.title': 'पुष्ट झालेली वैद्यकीय घटना', 'safety.state2.desc': 'वैद्यकीय निष्कर्षासाठी अधिकृत तपासणी आवश्यक आहे। BUSHO हा निर्णय मसुदा प्रक्रियेबाहेर ठेवतो।', 'safety.state2.footer': 'वैद्यकीय तपासणी मानवाच्या मार्गदर्शनाखाली', 'safety.state3.label': 'अवस्था ०३', 'safety.state3.pill': 'मंजुरी आवश्यक', 'safety.state3.title': 'प्रशासकीय कृती', 'safety.state3.desc': 'सत्यापित साठ्यावरून भरपाईचा मसुदा तयार होऊ शकतो। अधिकृत प्रशासकच विनंती मंजूर करतो।', 'safety.state3.footer': 'मंजुरीच्या प्रतीक्षेत मसुदा विनंती', 'footer.aiNote': 'अनुवाद डेमोसाठी तयार केले आहेत; प्रत्यक्ष वापरापूर्वी स्थानिक वक्त्याने तपासणे आवश्यक आहे।',
      'worker.provisionalFlaggedTitle': 'मसुद्याची मानवी तपासणी आवश्यक', 'worker.provisionalVerifiedTitle': 'सत्यापित कामकाजाचा अहवाल', 'worker.emptyReport': 'अजून अहवाल लिहिलेला नाही', 'worker.toast.save': 'ब्राउझरमधील डेमो स्थिती जतन करता आली नाही', 'worker.toast.extractFirst': 'पुष्टीपूर्वी मसुदा तयार करा'
    }
  };
  Object.entries(addedTranslations).forEach(([lang, values]) => Object.assign(locales[lang], values));
  Object.entries(translationOverrides).forEach(([lang, values]) => Object.assign(locales[lang], values));
  Object.keys(locales.en).forEach(key => Object.keys(locales).filter(lang => lang !== 'en').forEach(lang => { if (!locales[lang][key]) console.warn(`Missing translation: ${lang}.${key}`); }));
  const enabledLanguages = ['en', 'hi', 'mr'];

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
    document.title = `${locale['app.name']} | ${locale['hero.headline'].slice(0, 50)}...`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', locale['hero.subtext']);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (locale[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('data-i18n-attr')) {
            const attrs = el.getAttribute('data-i18n-attr').split(',');
            attrs.forEach(attr => {
              const [name, i18nKey] = attr.split(':');
              if (locale[i18nKey]) el.setAttribute(name, locale[i18nKey]);
            });
          } else if (el.placeholder !== undefined && locale[key]) {
            el.placeholder = locale[key];
          }
        } else {
          el.textContent = locale[key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (locale[key]) el.innerHTML = locale[key];
    });

    listeners.forEach(fn => fn(lang, locale));
  }

  function t(key, vars = {}) {
    const locale = locales[currentLang] || locales.en;
    let str = locale[key] || locales.en[key];
    if (str === undefined) { console.warn(`Missing i18n key: ${key}`); str = key; }
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return str;
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

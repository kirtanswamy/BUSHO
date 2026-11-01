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
    },
    hi: {
      'app.name': 'BUSHO', 'app.tagline': 'नीचे से ऊपर - स्मार्ट हेल्थ ऑर्केस्ट्रेटर',
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
      'sample.routine': 'आज हमने 12 बुखार और 8 दस्त के मरीज देखे। ORS पैकेट केवल 20 बचे हैं।', 'sample.ambiguous': 'आज कुछ बुखार के मामले। ORS लगभग खत्म।',
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
      'sample.routine': 'இன்று 12 காய்ச்சல் மற்றும் 8 வயிற்றுப்போக்கு நோயாளிகள். ORS பாக்கெட்டுகள் 20 மட்டுமே உள்ளன.', 'sample.ambiguous': 'இன்று சில காய்ச்சல். ORS கிட்டத்தட்ட முடிந்துவிட்டது.',
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
      'sample.routine': 'నేటి రోజున 12 జ్వరం మరియు 8 విరేచనాలు. ORS ప్యాకెట్లు 20 మాత్రమే మిగిలి ఉన్నాయి.', 'sample.ambiguous': 'నేటి రోజున కొన్ని జ్వరం కేసులు. ORS దాదాపు ముగిసింది.',
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
      'sample.routine': 'আজ ১২ জ্বর এবং ৮ ডায়রিয়া। ORS প্যাকেট মাত্র ২০ বাকি আছে।', 'sample.ambiguous': 'আজ কিছু জ্বর। ORS প্রায় শেষ।',
      'glossary.hwc': 'স্বাস্থ্য ও কল্যাণ কেন্দ্র', 'glossary.cho': 'কমিউনিটি স্বাস্থ্য কর্মকর্তা', 'glossary.ors': 'ওরাল রিহাইড্রেশন সল্ট',
      'unit.packets': 'প্যাকেট', 'unit.strips': 'স্ট্রিপ', 'unit.tablets': 'ট্যাবলেট',
    },
    mr: {
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
      'sample.routine': 'आज १२ ताप आणि ८ अतिसार. ORS पॅकेट्स केवळ २० राहिले आहेत.', 'sample.ambiguous': 'आज काही ताप प्रकरणे. ORS जवळजवळ संपले.',
      'glossary.hwc': 'आरोग्य आणि कल्याण केंद्र', 'glossary.cho': 'समुदाय आरोग्य अधिकारी', 'glossary.ors': 'तोंडी पुनर्जलीकरण मीठ',
      'unit.packets': 'पॅकेट्स', 'unit.strips': 'स्ट्रिप्स', 'unit.tablets': 'गोळ्या',
    }
  };

  let currentLang = 'en';
  let listeners = [];

  function detectLanguage() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && locales[urlLang]) return urlLang;

    const stored = localStorage.getItem('busho-lang');
    if (stored && locales[stored]) return stored;

    const navLang = navigator.language || navigator.userLanguage || 'en';
    const short = navLang.split('-')[0];
    if (locales[short]) return short;

    return 'en';
  }

  function setLanguage(lang) {
    if (!locales[lang]) lang = 'en';
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
    let str = locale[key] || locales.en[key] || key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return str;
  }

  function onLanguageChange(fn) {
    listeners.push(fn);
  }

  function getLocales() {
    return Object.keys(locales);
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  window.BUSHO_I18N = {
    locales,
    t,
    setLanguage,
    onLanguageChange,
    getLocales,
    getCurrentLanguage,
  };

  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(detectLanguage());

    const selects = document.querySelectorAll('#lang-select, #lang-select-footer');
    selects.forEach(select => {
      if (select) {
        select.value = currentLang;
        select.addEventListener('change', (e) => {
          setLanguage(e.target.value);
          selects.forEach(s => { if (s !== select) s.value = e.target.value; });
        });
      }
    });
  });
})();
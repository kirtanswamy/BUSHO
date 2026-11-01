const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app-v2.js'), 'utf8');
const start = source.indexOf('function makeExtraction() {');
const end = source.indexOf('\nfunction renderExtraction()', start);
assert.notEqual(start, -1, 'makeExtraction() should exist in app-v2.js');
assert.notEqual(end, -1, 'makeExtraction() should have a clear end boundary');
const functionSource = source.slice(start, end);

function runExtraction(input) {
  const calls = { rendered: 0, saved: 0, toasts: [], focused: false };
  const i18nSource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
  const stubDoc = { documentElement: { lang: 'en', setAttribute() {}, getAttribute: () => null }, addEventListener: () => {}, querySelectorAll: () => [] };
  const stubStorage = { getItem: () => null, setItem: () => {} };
  const i18nCtx = { document: stubDoc, window: { document: stubDoc, localStorage: stubStorage, navigator: { language: 'en', userLanguage: 'en' }, console: { log: () => {}, error: () => {}, warn: () => {} } }, console: { log: () => {}, error: () => {}, warn: () => {} } };
  try { vm.runInNewContext(i18nSource, i18nCtx); } catch (e) { /* ignore i18n load errors in test */ }
  const bushoI18n = i18nCtx.BUSHO_I18N || (i18nCtx.window && i18nCtx.window.BUSHO_I18N) || {};
  const tFn = (typeof bushoI18n.t === 'function') ? bushoI18n.t : ((k) => (k));
  const context = {
    t: tFn,
    reportInput: { value: input, focus() { calls.focused = true; } },
    state: {
      rawReport: '', sample: 'routine', extracted: false, confirmed: false,
      draft: [], replenishment: { status: 'none', medicineId: null, source: null }
    },
    renderAll() { calls.rendered += 1; },
    saveState() { calls.saved += 1; },
    showToast(message) { calls.toasts.push(message); },
    calls
  };
  const fn = vm.runInNewContext('(' + functionSource + ')', context);
  fn();
  return { state: context.state, calls };
}

test('routine report extracts numeric fever, diarrhea and ORS fields as draft values', () => {
  const { state, calls } = runExtraction(
    'Today we saw 12 patients with fever and 8 with diarrhea. We have only 20 ORS packets left, and our iron tablets are almost finished.'
  );
  assert.equal(state.extracted, true);
  assert.equal(state.confirmed, false, 'extraction must not auto-confirm');
  assert.equal(state.sample, 'routine');
  assert.match(state.draft.find(x => x.id === 'symptoms').value, /Fever: 12 mentions; diarrhea: 8 mentions/);
  assert.equal(state.draft.find(x => x.id === 'ors-stock').value, '20 packets');
  assert.equal(state.draft.find(x => x.id === 'ifa-stock').value, 'Almost finished');
  assert.equal(state.draft.find(x => x.id === 'clinical-status').value, 'Reported trend only; no diagnosis');
  assert.equal(calls.saved, 1);
  assert.equal(calls.rendered, 1);
});

test('ambiguous report is flagged for human review rather than confirmed', () => {
  const { state } = runExtraction('A few fever cases today. ORS is almost finished.');
  assert.equal(state.sample, 'ambiguous');
  assert.equal(state.confirmed, false);
  assert.equal(state.draft.find(x => x.id === 'symptoms').confidence, 'review');
  assert.equal(state.draft.find(x => x.id === 'ors-stock').confidence, 'review');
});

test('empty report is rejected without creating a draft', () => {
  const { state, calls } = runExtraction('   ');
  assert.equal(state.extracted, false);
  assert.equal(state.draft.length, 0);
  assert.equal(calls.saved || 0, 0);
  assert.ok(calls.toasts.some(x => /Enter a field report/.test(x)));
  assert.equal(calls.focused, true);
});

test('numeric extraction stays provisional until the separate confirmation step', () => {
  const { state } = runExtraction('We saw 5 patients with fever and 3 with diarrhea; 14 ORS packets remain.');
  assert.equal(state.extracted, true);
  assert.equal(state.confirmed, false);
  assert.ok(state.draft.every(x => typeof x.value === 'string'));
});

test('localized routine samples extract the same facts', () => {
  const samples = {
    hi: 'आज १२ बुखार और ८ दस्त के मरीज हैं। ORS पैकेट २० बचे हैं और आयरन की गोलियाँ लगभग खत्म हैं।',
    ta: 'இன்று ௧௨ காய்ச்சல் மற்றும் ௮ வயிற்றுப்போக்கு. ORS பாக்கெட்டுகள் ௨௦ உள்ளன, இரும்பு மாத்திரைகள் கிட்டத்தட்ட முடிந்துவிட்டன.',
    te: 'ఈ రోజు ౧౨ జ్వరం మరియు ౮ విరేచనాలు. ORS ప్యాకెట్లు ౨౦ ఉన్నాయి, ఇనుము మాత్రలు దాదాపు ముగిశాయి.',
    bn: 'আজ ১২ জ্বর এবং ৮ ডায়রিয়া। ORS প্যাকেট ২০ বাকি, আয়রনের ট্যাবলেট প্রায় শেষ।',
    mr: 'आज १२ ताप आणि ८ अतिसार. ORS पॅकेट २० उरले, लोहाच्या गोळ्या जवळजवळ संपल्या.'
  };
  for (const [lang, sample] of Object.entries(samples)) {
    const { state } = runExtraction(sample);
    assert.equal(state.sample, 'routine', lang);
    assert.match(state.draft.find(x => x.id === 'symptoms').value, /12|१२|௧௨|౧౨/);
    assert.match(state.draft.find(x => x.id === 'ors-stock').value, /20/);
  }
});

test('localized ambiguous reports remain flagged for review', () => {
  const samples = ['कुछ बुखार। ORS लगभग खत्म।', 'சில காய்ச்சல். ORS கிட்டத்தட்ட முடிந்தது.', 'కొన్ని జ్వరం కేసులు. ORS దాదాపు ముగిసింది.', 'কিছু জ্বর। ORS প্রায় শেষ।', 'काही ताप. ORS जवळजवळ संपले.'];
  for (const sample of samples) {
    const { state } = runExtraction(sample);
    assert.equal(state.sample, 'ambiguous');
    assert.ok(state.draft.some(x => x.confidence === 'review'));
  }
});

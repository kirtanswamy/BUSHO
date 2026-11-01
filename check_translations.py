with open('BUSHO/i18n.js', 'r') as f:
    src = f.read()
for lang in ['en', 'hi', 'ta', 'te', 'bn', 'mr']:
    if f"'voice.toast.voice'" in src:
        # Find the value for this locale
        pattern = lang + ": {"
        # Just search for the voice.toast.voice key in the file and check the preceding locale context
        pass
# Simpler: check each locale by looking for the English disclosure text pattern
text = "Voice input uses your browser"
count = src.count(text)
if count > 0:
    print("English disclosure found:", count)
else:
    print("English disclosure MISSING")
# Check translations
for lang in ['hi', 'ta', 'te', 'bn', 'mr']:
    if lang == 'en': continue
    # Look for the new translated text in the file
    # The Hindi translation starts with "वॉइस इनपुट"
    if lang == 'hi' and 'वॉइस इनपुट' in src:
        print(lang, ': present')
    elif lang == 'ta' and 'குரல்' in src:
        print(lang, ': present')
    elif lang == 'te' and 'వాయిస్' in src:
        print(lang, ': present')
    elif lang == 'bn' and 'ভয়েস' in src:
        print(lang, ': present')
    elif lang == 'mr' and 'व्हॉइस' in src:
        print(lang, ': present')
    else:
        print(lang, ': MISSING')

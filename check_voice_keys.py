with open('BUSHO/i18n.js', 'r') as f:
    src = f.read()
for lang in ['en', 'hi', 'ta', 'te', 'bn', 'mr']:
    block_start = src.find("'" + lang + "':")
    if block_start < 0:
        print(lang + ': BLOCK MISSING')
        continue
    rest = src[block_start:]
    idx = rest.find('voice.toast.voice')
    if idx < 0:
        print(lang + ': MISSING key')
    else:
        snippet = rest[idx:idx+200]
        print(lang + ': FOUND -> ' + snippet[:120].replace('\n', ' '))

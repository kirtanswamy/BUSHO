with open('BUSHO/i18n.js', 'r') as f:
    src = f.read()
for lang in ['en', 'hi', 'ta', 'te', 'bn', 'mr']:
    marker = "'" + lang + "'"
    start = src.find(marker)
    if start < 0:
        print(lang, 'BLOCK MISSING')
        continue
    rest = src[start:]
    # Find the line containing voice.toast.voice
    for line in rest.split('\n'):
        if 'voice.toast.voice' in line:
            print(lang, 'HAS:', line[:100].replace('\n', ' '))
            break
    else:
        print(lang, 'MISSING')

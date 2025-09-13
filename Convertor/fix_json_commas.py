import json
import re

# Datei laden
with open('subbranchen.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Komma durch Punkt in allen value-Feldern ersetzen
for branche, eintraege in data.items():
    for eintrag in eintraege:
        if 'value' in eintrag:
            eintrag['value'] = re.sub(r',', '.', eintrag['value'])

# Datei überschreiben
with open('subbranchen.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

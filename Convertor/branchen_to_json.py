import json
import os

# Pfade
input_path = os.path.join(os.path.dirname(__file__), 'BranchenData.txt')
output_path = os.path.join(os.path.dirname(__file__), 'subbranchen.json')

import re

def parse_branchen_data(txt_path):
    data = {}
    current_section = None
    # Regex für Abschnittskennung (A), (B), ...
    section_re = re.compile(r'^([A-Z])\)')
    # Regex für Zeilen mit Zeitangabe
    entry_re = re.compile(r'^(.*?)\s*-\s*Gruppe\s*([IV]+)\s*-\s*([0-9],[05])\s*h$')

    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # Abschnitt erkennen
            section_match = section_re.match(line)
            if section_match:
                current_section = section_match.group(1)
                if current_section not in data:
                    data[current_section] = []
                continue
            # Subbranchen-Eintrag erkennen
            entry_match = entry_re.match(line)
            if entry_match and current_section:
                text = entry_match.group(1).strip()
                value = entry_match.group(3)
                data[current_section].append({"text": line, "value": value})
    return data

if __name__ == "__main__":
    branchen_data = parse_branchen_data(input_path)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(branchen_data, f, ensure_ascii=False, indent=2)
    print(f"Konvertierung abgeschlossen: {output_path}")

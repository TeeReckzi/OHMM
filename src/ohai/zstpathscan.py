import json
from pathlib import Path

# Project configuration path
ROOT = Path(r"C:\Users\tyr3x\OnceHumanCombatHaptics")
REPORT_PATH = ROOT / "bindict_candidates.json" # adjust filename to match your exact JSON report

if not REPORT_PATH.exists():
    # Automatically locate the JSON if the name varies slightly
    json_candidates = list(ROOT.glob("*.json"))
    print(f"[*] Report file not found at root. Available JSON files: {[j.name for j in json_candidates]}")
    if json_candidates:
        REPORT_PATH = json_candidates[0]

if REPORT_PATH.exists():
    print(f"[+] Found active report: {REPORT_PATH.name}")
    data = json.loads(REPORT_PATH.read_text(encoding='utf-8'))
    
    # We are iterating over candidates that the tool marked as successfully decoded
    candidates = data.get('candidates', data.get('entries', []))
    print(f"[*] Total entries in report: {len(candidates)}")
    
    combat_hits = 0
    for idx, c in enumerate(candidates):
        summary = c.get('summary', c)
        
        # Filter for verified payloads
        if not summary.get('unpacked_payload'):
            continue
            
        # Extract the cached text preview arrays mapped inside the JSON block
        previews = c.get('string_preview', [])
        preview_text = " ".join(previews).lower()
        
        # Let's run a targeted check for structural client data or weapon matrices
        combat_tokens = ['attr', 'skill', 'damage', 'node_id', 'bullet', 'weapon', 'node_name']
        matched_tokens = [t for t in combat_tokens if t in preview_text]
        
        if matched_tokens:
            combat_hits += 1
            print(f"\n========================================")
            print(f"COMBAT TARGET FOUND #{combat_hits}")
            print(f"Candidate ID: {c.get('candidate_id', idx)}")
            print(f"Name Hint:    {c.get('name_hint', 'Unknown')}")
            print(f"Module (NPK): {c.get('module_hint', 'script.npk')}")
            print(f"Matched Indicators: {', '.join(matched_tokens)}")
            print(f"----------------------------------------")
            print("EXTRACTED STRING MAP PREVIEW:")
            # Display clean segments of the decoded text structure
            for line in previews[:15]:
                if any(k in line.lower() for k in combat_tokens) or len(line) > 10:
                    print(f"  -> {line}")
                    
    print(f"\n[*] Scan complete. Identified {combat_hits} active combat tables embedded inside the report data.")
else:
    print("[-] Critical Error: Could not locate your json report archive inside the workspace.")
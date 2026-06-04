import json, os, re, glob
from collections import defaultdict, Counter

DIR = '/Users/umutcanacar/Desktop/AssistantDevs/gofor101/lib/data/seasons'
files = sorted(glob.glob(os.path.join(DIR, '*.json')))
seasons = {}
for f in files:
    b = os.path.basename(f)
    if b == 'index.json':
        index = json.load(open(f))
        continue
    seasons[b[:-5]] = json.load(open(f))

sids = sorted(seasons)
print(f"Loaded {len(sids)} seasons: {sids[0]} .. {sids[-1]}")
print("Missing 2006-07?", '2006-07' not in seasons)

FIFA_START = '2014-15'
def is_fifa(sid): return sid >= FIFA_START

# ---------- 1 & 2: Squad completeness + formation feasibility ----------
print("\n===== 1/2 SQUAD COMPLETENESS & FORMATION FEASIBILITY =====")
size_dist = Counter()
lt11 = []; lt14 = []
# formation = (GK,DEF,MID,FWD) min counts needed
formations = {
    '4-3-3': (1,4,3,3),
    '4-4-2': (1,4,4,2),
    '4-2-3-1': (1,4,5,1),  # 2DM+3AM treated as MID, 1 FWD
    '3-5-2': (1,3,5,2),
}
# baseline "fill a formation" = 1GK,4DEF,3MID,3FWD
baseline = (1,4,3,3)
formation_fail = defaultdict(list)  # formation -> list
no_gk = []; thin_def = []; thin_mid = []; thin_fwd = []
baseline_fail = []

for sid in sids:
    for c in seasons[sid]['clubs']:
        sq = c['squad']
        n = len(sq)
        size_dist[n]+=1
        grp = Counter(p['pos'] for p in sq)
        gk,de,mi,fw = grp.get('GK',0),grp.get('DEF',0),grp.get('MID',0),grp.get('FWD',0)
        tag = (sid, c['name'], n, f"GK{gk}/DEF{de}/MID{mi}/FWD{fw}")
        if n < 11: lt11.append(tag)
        if n < 14: lt14.append(tag)
        if gk == 0: no_gk.append(tag)
        if de < 4: thin_def.append(tag)
        if mi < 3: thin_mid.append(tag)
        if fw < 3: thin_fwd.append(tag)
        # baseline
        bgk,bde,bmi,bfw = baseline
        if not (gk>=bgk and de>=bde and mi>=bmi and fw>=bfw):
            baseline_fail.append(tag)
        for fname,(rgk,rde,rmi,rfw) in formations.items():
            if not (gk>=rgk and de>=rde and mi>=rmi and fw>=rfw):
                formation_fail[fname].append(tag)

print("Squad size distribution (size: #clubs):")
for s in sorted(size_dist): print(f"  {s}: {size_dist[s]}")
print(f"\nClubs with <11 players: {len(lt11)}")
for t in lt11: print("   ", t)
print(f"\nClubs with <14 players: {len(lt14)}")
for t in lt14[:30]: print("   ", t)
if len(lt14)>30: print(f"   ... and {len(lt14)-30} more")

print(f"\nBaseline (1GK,4DEF,3MID,3FWD) UNFILLABLE clubs: {len(baseline_fail)}")
for t in baseline_fail: print("   ", t)
print(f"\nClubs with NO GK: {len(no_gk)}")
for t in no_gk: print("   ", t)
print(f"Clubs with <4 DEF: {len(thin_def)}")
for t in thin_def: print("   ", t)
print(f"Clubs with <3 MID: {len(thin_mid)}")
for t in thin_mid: print("   ", t)
print(f"Clubs with <3 FWD: {len(thin_fwd)}")
for t in thin_fwd: print("   ", t)

print("\nFormation feasibility failures (count of clubs that CANNOT field):")
for fname in formations:
    print(f"  {fname}: {len(formation_fail[fname])} clubs")
    for t in formation_fail[fname][:8]: print("      ", t)
    if len(formation_fail[fname])>8: print(f"       ... +{len(formation_fail[fname])-8} more")

# ---------- 3: Rating sanity ----------
print("\n===== 3 RATING SANITY =====")
all_ratings = []
season_rating_stats = {}
out_low = []; out_high = []        # rating <46 or >95
gk_high_att = []                   # GK att>30
fwd_99 = []                        # FWD rating 99 (or >=98)
gk_att_off = []                    # GK att not ~12 (say >20)
cb_inconsistent = []               # DEF with att>def by a lot? heuristic
att_def_bad = []
for sid in sids:
    rs = [p['rating'] for c in seasons[sid]['clubs'] for p in c['squad']]
    all_ratings += rs
    rs_sorted = sorted(rs)
    n=len(rs)
    season_rating_stats[sid] = (min(rs), max(rs), round(sum(rs)/n,1), rs_sorted[n//2])
    for c in seasons[sid]['clubs']:
        for p in c['squad']:
            r=p['rating']; att=p['att']; df=p['def']; pos=p['pos']
            loc=(sid,c['name'],p['name'],pos,f"att{att}/def{df}/r{r}")
            if r < 46: out_low.append(loc)
            if r > 95: out_high.append(loc)
            if pos=='GK' and att>30: gk_high_att.append(loc)
            if pos=='GK' and att>20: gk_att_off.append(loc)
            if pos=='FWD' and r>=98: fwd_99.append(loc)
            # FWD with very low att, DEF/GK with very high att etc
            if pos=='FWD' and att<40: att_def_bad.append(('FWD low att',)+loc)
            if pos=='DEF' and att> df+25: att_def_bad.append(('DEF att>>def',)+loc)
            if pos=='GK' and df<30: att_def_bad.append(('GK low def',)+loc)

print("Per-season rating (min/max/mean/median):")
for sid in sids:
    print(f"  {sid}: {season_rating_stats[sid]}")
print(f"\nOverall rating range: {min(all_ratings)}..{max(all_ratings)}, mean {round(sum(all_ratings)/len(all_ratings),1)}")
print(f"\nRatings <46: {len(out_low)}")
for t in out_low[:15]: print("   ",t)
print(f"Ratings >95: {len(out_high)}")
for t in out_high[:15]: print("   ",t)
print(f"GK with att>30: {len(gk_high_att)}")
for t in gk_high_att[:15]: print("   ",t)
print(f"GK with att>20 (expected ~12): {len(gk_att_off)}")
for t in gk_att_off[:15]: print("   ",t)
print(f"FWD with rating>=98: {len(fwd_99)}")
for t in fwd_99[:15]: print("   ",t)
print(f"att/def consistency oddities: {len(att_def_bad)}")
for t in att_def_bad[:20]: print("   ",t)

# ---------- 4: Name quality ----------
print("\n===== 4 NAME QUALITY =====")
dup_in_club = []
empty_unknown = []
artifact_names = []
encoding_issues = []
artifact_re = re.compile(r'[0-9]|\(id\)|\(.*?id.*?\)', re.I)
for sid in sids:
    for c in seasons[sid]['clubs']:
        names = [p['name'] for p in c['squad']]
        cnt = Counter(names)
        for nm,k in cnt.items():
            if k>1: dup_in_club.append((sid,c['name'],nm,k))
        for p in c['squad']:
            nm = p['name']
            if not nm or nm.strip()=='' or nm.strip().lower() in ('unknown','n/a','?'):
                empty_unknown.append((sid,c['name'],repr(nm)))
            if re.search(r'\d', nm) or re.search(r'\(.*id.*\)', nm, re.I):
                artifact_names.append((sid,c['name'],nm))
            # encoding: mojibake / replacement char
            if any(ch in nm for ch in ('�','Ã','Â','�')) or 'â€' in nm:
                encoding_issues.append((sid,c['name'],nm))
print(f"Duplicate names within a club: {len(dup_in_club)}")
for t in dup_in_club[:30]: print("   ",t)
if len(dup_in_club)>30: print(f"   ... +{len(dup_in_club)-30} more")
print(f"Empty/Unknown names: {len(empty_unknown)}")
for t in empty_unknown[:20]: print("   ",t)
print(f"Names with digit/(id) artifacts: {len(artifact_names)}")
for t in artifact_names[:20]: print("   ",t)
print(f"Encoding issues: {len(encoding_issues)}")
for t in encoding_issues[:20]: print("   ",t)

# ---------- 5: Club name consistency across seasons ----------
print("\n===== 5 CLUB NAME CONSISTENCY ACROSS SEASONS =====")
# group by club id
id_to_names = defaultdict(set)
name_to_ids = defaultdict(set)
for sid in sids:
    for c in seasons[sid]['clubs']:
        id_to_names[c['id']].add(c['name'])
        name_to_ids[c['name']].add(c['id'])
multi_name = {cid:ns for cid,ns in id_to_names.items() if len(ns)>1}
print(f"Club IDs with >1 distinct display name (same club, different naming): {len(multi_name)}")
for cid,ns in sorted(multi_name.items()):
    # show which seasons use which
    print(f"  id={cid}: {sorted(ns)}")
# also detect names that normalize to same (strip FC/AFC) but different id
def norm(n): return re.sub(r'\b(FC|AFC|CF)\b','',n).replace('&','and').strip().lower().replace('  ',' ')
norm_map = defaultdict(set)
for nm in name_to_ids: norm_map[norm(nm)].add(nm)
print("\nNames that normalize to same club but differ in spelling:")
for k,v in sorted(norm_map.items()):
    if len(v)>1: print(f"  '{k}': {sorted(v)}")

# ---------- 6: winnerPts vs actual ----------
print("\n===== 6 winnerPts vs ACTUAL CHAMPION =====")
idx_by_id = {e['id']:e for e in index}
wp_mismatch = []; champ_pos_issue = []
for sid in sids:
    s = seasons[sid]
    clubs = s['clubs']
    top_by_pts = max(clubs, key=lambda c: c['pts'])
    pos1 = [c for c in clubs if c['pos']==1]
    wp = s.get('winnerPts')
    if wp != top_by_pts['pts']:
        wp_mismatch.append((sid, f"winnerPts={wp}", f"topPts={top_by_pts['pts']} ({top_by_pts['name']})"))
    # pos==1 should match top pts
    if pos1:
        if pos1[0]['pts'] != top_by_pts['pts']:
            champ_pos_issue.append((sid, f"pos1={pos1[0]['name']}({pos1[0]['pts']})", f"topPts={top_by_pts['name']}({top_by_pts['pts']})"))
    else:
        champ_pos_issue.append((sid,"NO club with pos==1",""))
    # index winnerPts consistency
    if sid in idx_by_id and idx_by_id[sid].get('winnerPts')!=wp:
        wp_mismatch.append((sid,'INDEX', f"index={idx_by_id[sid].get('winnerPts')} file={wp}"))
print(f"winnerPts != top club pts (or index mismatch): {len(wp_mismatch)}")
for t in wp_mismatch: print("   ",t)
print(f"pos==1 club not the top-pts club (or missing): {len(champ_pos_issue)}")
for t in champ_pos_issue: print("   ",t)

# ---------- 7: cross-season duplicates / same name twice in one season ----------
print("\n===== 7 SAME NAME TWICE IN A SINGLE SEASON =====")
same_name_season = []
for sid in sids:
    cnt = Counter()
    where = defaultdict(list)
    for c in seasons[sid]['clubs']:
        for p in c['squad']:
            cnt[p['name']]+=1
            where[p['name']].append(c['name'])
    for nm,k in cnt.items():
        if k>1:
            same_name_season.append((sid,nm,k,where[nm]))
print(f"Names appearing >1x within the same season (across clubs incl dup-in-club): {len(same_name_season)}")
for t in same_name_season[:40]: print("   ",t)
if len(same_name_season)>40: print(f"   ... +{len(same_name_season)-40} more")
# cross-season pool count (informational)
pool = Counter()
for sid in sids:
    seen=set()
    for c in seasons[sid]['clubs']:
        for p in c['squad']:
            if p['name'] not in seen:
                seen.add(p['name']); pool[p['name']]+=1
print(f"\nUnique player names in all-time pool: {len(pool)}; appearing in most seasons:")
for nm,k in pool.most_common(10): print(f"   {nm}: {k} seasons")

# ---------- 8: estimated flag ----------
print("\n===== 8 ESTIMATED FLAG =====")
print("Season | file.estimated | index.estimated | label | EXPECTED")
flag_issues=[]
for sid in sids:
    fe = seasons[sid].get('estimated', None)
    ie = idx_by_id.get(sid,{}).get('estimated', None)
    lbl = seasons[sid].get('label','')
    expected = (not is_fifa(sid))  # pre-2014-15 should be estimated
    print(f"  {sid} | file={fe} | index={ie} | expected_estimated={expected} | {lbl}")
    # file uses 'estimated?' optional; treat missing as False
    fe_bool = bool(fe)
    if fe_bool != expected: flag_issues.append((sid,'FILE',f"is={fe} expected={expected}"))
    if bool(ie) != expected: flag_issues.append((sid,'INDEX',f"is={ie} expected={expected}"))
print(f"\nEstimated-flag issues: {len(flag_issues)}")
for t in flag_issues: print("   ",t)

print("\n===== DONE =====")

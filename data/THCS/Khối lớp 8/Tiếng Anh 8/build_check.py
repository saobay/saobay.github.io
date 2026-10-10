# -*- coding: utf-8 -*-
"""Build 2 file bai tap tu template + kiem tra chat che."""
import json, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))

import gen_exercises as ge
import gen_u9b, gen_u10

BASE = pathlib.Path(__file__).parent
TPL = (BASE / ".." / "TEMPLATE_baitap.html").resolve().read_text(encoding="utf-8")

def build(fname, title, subtitle, sets):
    data = {"sets": sets}
    js = json.dumps(data, ensure_ascii=False, indent=2)
    html = TPL.replace("@@TITLE@@", title).replace("@@SUBTITLE@@", subtitle).replace("@@JSON@@", js)
    assert "@@TITLE@@" not in html and "@@JSON@@" not in html
    out = BASE / fname
    out.write_text(html, encoding="utf-8")
    return out, js

def check(out, js, label):
    errs = []
    # 1. parse JSON tu script tag trong HTML
    html = out.read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" class="saobay-exam10-data">\n(.*?)\n</script>',
                  html, re.S)
    if not m:
        errs.append("khong tim thay script JSON")
        return errs
    data = json.loads(m.group(1))
    sets = data["sets"]
    # 2. 10 sets x 10 cau
    if len(sets) != 10:
        errs.append(f"so set = {len(sets)}, can 10")
    for i, s in enumerate(sets, 1):
        qs = s["questions"]
        if len(qs) != 10:
            errs.append(f"{s.get('name')}: {len(qs)} cau (can 10)")
        for j, q in enumerate(qs, 1):
            if "level" not in q or q["level"] not in ("NB", "TH", "VD", "VDC"):
                errs.append(f"{s.get('name')} cau {j}: thieu/sai level")
            if "explain" not in q or not str(q["explain"]).strip():
                errs.append(f"{s.get('name')} cau {j}: thieu explain")
            t = q.get("type")
            if t == "mcq":
                if len(q.get("options", [])) != 4: errs.append(f"{s.get('name')} cau {j}: options != 4")
                if not re.fullmatch(r"[A-D]", str(q.get("answer", ""))): errs.append(f"{s.get('name')} cau {j}: answer sai dinh dang")
            elif t == "truefalse":
                if len(q.get("statements", [])) != 4: errs.append(f"{s.get('name')} cau {j}: statements != 4")
                if q.get("answer") not in (["T"]*4,) and (len(q.get("answer", [])) != 4 or any(v not in ("T","F") for v in q["answer"])):
                    errs.append(f"{s.get('name')} cau {j}: answer truefalse sai")
            elif t == "short":
                if not str(q.get("answer", "")).strip(): errs.append(f"{s.get('name')} cau {j}: short thieu answer")
            else:
                errs.append(f"{s.get('name')} cau {j}: type la {t}")
    # 3. khong chua < > &
    bad = re.findall(r"[<>&]", m.group(1))
    if bad:
        errs.append(f"JSON chua ky tu cam: {set(bad)}")
    # 4. thong ke level + loai cau
    lv = {"NB":0,"TH":0,"VD":0,"VDC":0}; ty = {}
    for s in sets:
        for q in s["questions"]:
            lv[q["level"]] += 1
            ty[q["type"]] = ty.get(q["type"], 0) + 1
    print(f"[{label}] sets={len(sets)} | level={lv} | type={ty}")
    # 5. trung lap cau hoi giua cac de (so sanh toan bo noi dung cau)
    seen = {}
    for s in sets:
        for q in s["questions"]:
            k = json.dumps(q, ensure_ascii=False, sort_keys=True)
            if k in seen: errs.append(f"trung cau nguyen van: {q['q'][:60]!r} ({seen[k]} / {s.get('name')})")
            seen[k] = s.get("name")
    return errs

U9_ALL = ge.U9 + gen_u9b.SETS
U10_ALL = gen_u10.SETS

o9, j9 = build("ANH_8_Unit_9_Natural_disasters_Bai_tap_none.html",
               "Bài tập Unit 9: Natural disasters",
               "Unit 9: Natural disasters • Tiếng Anh 8 (Global Success)", U9_ALL)
o10, j10 = build("ANH_8_Unit_10_Communication_in_the_future_Bai_tap_none.html",
                 "Bài tập Unit 10: Communication in the future",
                 "Unit 10: Communication in the future • Tiếng Anh 8 (Global Success)", U10_ALL)

ok = True
for out, js, label in ((o9, j9, "U9"), (o10, j10, "U10")):
    errs = check(out, js, label)
    if errs:
        ok = False
        print(f"[{label}] LOI:")
        for e in errs: print("  -", e)
    else:
        print(f"[{label}] PASS: {out.name} ({out.stat().st_size} bytes)")

print("KET QUA:", "TAT CA DAT" if ok else "CO LOI")

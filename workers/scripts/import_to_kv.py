#!/usr/bin/env python3
"""
Import Japan Post postal code data to Cloudflare KV.
Generates JSON files for bulk upload via wrangler.

Usage:
  python import_to_kv.py
  wrangler kv:bulk put --namespace-id=YOUR_NS_ID kv_data.json
"""

import csv
import json
import os
import sys
import zipfile
import tempfile
from pathlib import Path
from typing import Generator, Dict, Any, List
from datetime import datetime

try:
    import httpx
except ImportError:
    print("Please install httpx: pip install httpx")
    sys.exit(1)

# URLs
UTF_ALL_URL = "https://www.post.japanpost.jp/zipcode/dl/utf/zip/utf_ken_all.zip"
JIGYOSYO_URL = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/zip/jigyosyo.zip"

# Prefecture data
PREFECTURE_DATA = [
    ("01", "北海道", "ホッカイドウ"),
    ("02", "青森県", "アオモリケン"),
    ("03", "岩手県", "イワテケン"),
    ("04", "宮城県", "ミヤギケン"),
    ("05", "秋田県", "アキタケン"),
    ("06", "山形県", "ヤマガタケン"),
    ("07", "福島県", "フクシマケン"),
    ("08", "茨城県", "イバラキケン"),
    ("09", "栃木県", "トチギケン"),
    ("10", "群馬県", "グンマケン"),
    ("11", "埼玉県", "サイタマケン"),
    ("12", "千葉県", "チバケン"),
    ("13", "東京都", "トウキョウト"),
    ("14", "神奈川県", "カナガワケン"),
    ("15", "新潟県", "ニイガタケン"),
    ("16", "富山県", "トヤマケン"),
    ("17", "石川県", "イシカワケン"),
    ("18", "福井県", "フクイケン"),
    ("19", "山梨県", "ヤマナシケン"),
    ("20", "長野県", "ナガノケン"),
    ("21", "岐阜県", "ギフケン"),
    ("22", "静岡県", "シズオカケン"),
    ("23", "愛知県", "アイチケン"),
    ("24", "三重県", "ミエケン"),
    ("25", "滋賀県", "シガケン"),
    ("26", "京都府", "キョウトフ"),
    ("27", "大阪府", "オオサカフ"),
    ("28", "兵庫県", "ヒョウゴケン"),
    ("29", "奈良県", "ナラケン"),
    ("30", "和歌山県", "ワカヤマケン"),
    ("31", "鳥取県", "トットリケン"),
    ("32", "島根県", "シマネケン"),
    ("33", "岡山県", "オカヤマケン"),
    ("34", "広島県", "ヒロシマケン"),
    ("35", "山口県", "ヤマグチケン"),
    ("36", "徳島県", "トクシマケン"),
    ("37", "香川県", "カガワケン"),
    ("38", "愛媛県", "エヒメケン"),
    ("39", "高知県", "コウチケン"),
    ("40", "福岡県", "フクオカケン"),
    ("41", "佐賀県", "サガケン"),
    ("42", "長崎県", "ナガサキケン"),
    ("43", "熊本県", "クマモトケン"),
    ("44", "大分県", "オオイタケン"),
    ("45", "宮崎県", "ミヤザキケン"),
    ("46", "鹿児島県", "カゴシマケン"),
    ("47", "沖縄県", "オキナワケン"),
]


def download_and_extract(url: str, temp_dir: Path) -> Path:
    """Download and extract ZIP file."""
    print(f"Downloading {url}...")
    response = httpx.get(url, follow_redirects=True, timeout=120.0)
    response.raise_for_status()
    
    zip_path = temp_dir / "data.zip"
    zip_path.write_bytes(response.content)
    
    extract_dir = temp_dir / "extracted"
    extract_dir.mkdir(exist_ok=True)
    
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)
    
    print(f"Extracted to {extract_dir}")
    return extract_dir


def parse_utf_csv(directory: Path) -> Generator[Dict[str, Any], None, None]:
    """Parse UTF-8 postal code CSV files."""
    csv_files = list(directory.glob("*.csv")) + list(directory.glob("*.CSV"))
    
    for csv_file in csv_files:
        print(f"Parsing {csv_file}...")
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) < 15:
                    continue
                yield {
                    "local_gov_code": row[0],
                    "postal_code": row[2],
                    "prefecture_kana": row[3],
                    "city_kana": row[4],
                    "town_kana": row[5],
                    "prefecture": row[6],
                    "city": row[7],
                    "town": row[8],
                }


def parse_jigyosyo_csv(directory: Path) -> Generator[Dict[str, Any], None, None]:
    """Parse Shift-JIS office postal code CSV files."""
    csv_files = list(directory.glob("*.csv")) + list(directory.glob("*.CSV"))
    
    for csv_file in csv_files:
        print(f"Parsing {csv_file}...")
        for encoding in ["shift_jis", "cp932"]:
            try:
                with open(csv_file, "r", encoding=encoding) as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) < 13:
                            continue
                        yield {
                            "local_gov_code": row[0],
                            "office_kana": row[1],
                            "office_name": row[2],
                            "prefecture": row[3],
                            "city": row[4],
                            "town": row[5],
                            "address_detail": row[6],
                            "postal_code": row[7],
                        }
                return
            except UnicodeDecodeError:
                continue


def generate_kv_data(output_dir: Path):
    """Generate KV data files for bulk upload."""
    output_dir.mkdir(exist_ok=True)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Download and parse postal codes
        print("\n=== Processing Postal Codes ===")
        utf_dir = download_and_extract(UTF_ALL_URL, temp_path / "utf")
        
        postal_data: Dict[str, Dict] = {}
        pref_index: Dict[str, List[str]] = {}
        city_index: Dict[str, List[str]] = {}
        cities_data: Dict[str, Dict] = {}
        
        for record in parse_utf_csv(utf_dir):
            pc = record["postal_code"]
            pref = record["prefecture"]
            city = record["city"]
            
            if pc not in postal_data:
                postal_data[pc] = {
                    "prefecture": pref,
                    "prefecture_kana": record["prefecture_kana"],
                    "city": city,
                    "city_kana": record["city_kana"],
                    "towns": [],
                }
            postal_data[pc]["towns"].append({
                "name": record["town"],
                "name_kana": record["town_kana"],
            })
            
            # Build indexes
            if pref not in pref_index:
                pref_index[pref] = []
            if pc not in pref_index[pref]:
                pref_index[pref].append(pc)
            
            if city not in city_index:
                city_index[city] = []
            if pc not in city_index[city]:
                city_index[city].append(pc)
            
            # Collect cities
            city_code = record["local_gov_code"]
            if city_code not in cities_data:
                cities_data[city_code] = {
                    "code": city_code,
                    "name": city,
                    "name_kana": record["city_kana"],
                    "prefecture_code": city_code[:2],
                }
        
        # Download and parse office data
        print("\n=== Processing Office Data ===")
        jigyosyo_dir = download_and_extract(JIGYOSYO_URL, temp_path / "jigyosyo")
        
        office_data: Dict[str, Dict] = {}
        office_index: Dict[str, List[str]] = {}
        
        for record in parse_jigyosyo_csv(jigyosyo_dir):
            pc = record["postal_code"]
            office_name = record["office_name"]
            
            if pc not in office_data:
                office_data[pc] = {
                    "prefecture": record["prefecture"],
                    "city": record["city"],
                    "offices": [],
                }
            office_data[pc]["offices"].append({
                "name": office_name,
                "name_kana": record["office_kana"],
                "town": record["town"],
                "address_detail": record["address_detail"],
            })
            
            # Build office name index (first 2 chars)
            key = office_name[:2] if len(office_name) >= 2 else office_name
            if key not in office_index:
                office_index[key] = []
            if pc not in office_index[key]:
                office_index[key].append(pc)
        
        # Generate KV bulk upload file
        print("\n=== Generating KV Data ===")
        kv_entries: List[Dict] = []
        
        # Postal codes
        for pc, data in postal_data.items():
            kv_entries.append({
                "key": f"postal:{pc}",
                "value": json.dumps(data, ensure_ascii=False),
            })
        
        # Office codes
        for pc, data in office_data.items():
            kv_entries.append({
                "key": f"office:{pc}",
                "value": json.dumps(data, ensure_ascii=False),
            })
        
        # Prefecture index
        for pref, codes in pref_index.items():
            kv_entries.append({
                "key": f"index:pref:{pref}",
                "value": json.dumps(codes[:1000], ensure_ascii=False),  # Limit
            })
        
        # City index
        for city, codes in city_index.items():
            kv_entries.append({
                "key": f"index:city:{city}",
                "value": json.dumps(codes[:500], ensure_ascii=False),
            })
        
        # Office name index
        for name_prefix, codes in office_index.items():
            kv_entries.append({
                "key": f"index:office:{name_prefix}",
                "value": json.dumps(codes[:500], ensure_ascii=False),
            })
        
        # Prefectures list
        prefectures = [{"code": c, "name": n, "name_kana": k} for c, n, k in PREFECTURE_DATA]
        kv_entries.append({
            "key": "prefectures",
            "value": json.dumps(prefectures, ensure_ascii=False),
        })
        
        # Prefecture details with cities
        for code, name, kana in PREFECTURE_DATA:
            pref_cities = [c for c in cities_data.values() if c["prefecture_code"] == code]
            kv_entries.append({
                "key": f"pref:{code}",
                "value": json.dumps({
                    "code": code,
                    "name": name,
                    "name_kana": kana,
                    "cities": pref_cities,
                }, ensure_ascii=False),
            })
        
        # Stats
        kv_entries.append({
            "key": "meta:stats",
            "value": json.dumps({
                "postal_codes_count": len(postal_data),
                "offices_count": len(office_data),
                "last_sync": datetime.utcnow().isoformat(),
            }, ensure_ascii=False),
        })
        
        # Split into chunks (Wrangler has limits on bulk upload size)
        chunk_size = 5000
        for i in range(0, len(kv_entries), chunk_size):
            chunk = kv_entries[i:i + chunk_size]
            chunk_file = output_dir / f"kv_data_{i // chunk_size:03d}.json"
            with open(chunk_file, "w", encoding="utf-8") as f:
                json.dump(chunk, f, ensure_ascii=False)
            print(f"Wrote {len(chunk)} entries to {chunk_file}")
        
        print(f"\n=== Summary ===")
        print(f"Total postal codes: {len(postal_data)}")
        print(f"Total office codes: {len(office_data)}")
        print(f"Total KV entries: {len(kv_entries)}")
        print(f"\nOutput files in: {output_dir}")
        print(f"\nTo upload, run:")
        print(f"  cd workers")
        print(f"  for f in ../kv_data/*.json; do wrangler kv:bulk put --namespace-id=YOUR_NS_ID $f; done")


if __name__ == "__main__":
    output_dir = Path(__file__).parent.parent / "kv_data"
    generate_kv_data(output_dir)

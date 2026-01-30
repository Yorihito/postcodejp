#!/usr/bin/env python3
"""
Import Japan Post postal code data to Firestore.
Requires: pip install firebase-admin
"""

import csv
import os
import sys
import zipfile
import tempfile
from pathlib import Path
from typing import Generator, Dict, Any
from datetime import datetime

import httpx
import firebase_admin
from firebase_admin import credentials, firestore

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
                    "old_postal_code": row[1],
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
                            "old_postal_code": row[8],
                            "post_office": row[9],
                            "office_type": int(row[10]) if row[10] else 0,
                        }
                return
            except UnicodeDecodeError:
                continue


def import_to_firestore(db):
    """Import all data to Firestore."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Import postal codes
        print("\n=== Importing Postal Codes ===")
        utf_dir = download_and_extract(UTF_ALL_URL, temp_path / "utf")
        
        # Group by postal code
        postal_data: Dict[str, Dict] = {}
        cities_data: Dict[str, Dict] = {}
        
        for record in parse_utf_csv(utf_dir):
            pc = record["postal_code"]
            if pc not in postal_data:
                postal_data[pc] = {
                    "postal_code": pc,
                    "prefecture": record["prefecture"],
                    "prefecture_kana": record["prefecture_kana"],
                    "city": record["city"],
                    "city_kana": record["city_kana"],
                    "addresses": [],
                }
            postal_data[pc]["addresses"].append({
                "town": record["town"],
                "town_kana": record["town_kana"],
                "local_gov_code": record["local_gov_code"],
            })
            
            # Collect cities
            city_code = record["local_gov_code"]
            if city_code not in cities_data:
                cities_data[city_code] = {
                    "code": city_code,
                    "name": record["city"],
                    "name_kana": record["city_kana"],
                    "prefecture_code": city_code[:2],
                }
        
        # Batch write postal codes
        print(f"Writing {len(postal_data)} postal codes to Firestore...")
        batch = db.batch()
        count = 0
        for pc, data in postal_data.items():
            ref = db.collection("postal_codes").document(pc)
            batch.set(ref, data)
            count += 1
            if count % 500 == 0:
                batch.commit()
                batch = db.batch()
                print(f"  Written {count} records...")
        batch.commit()
        print(f"  Total: {count} postal codes")
        
        # Import offices
        print("\n=== Importing Offices ===")
        jigyosyo_dir = download_and_extract(JIGYOSYO_URL, temp_path / "jigyosyo")
        
        office_data: Dict[str, Dict] = {}
        for record in parse_jigyosyo_csv(jigyosyo_dir):
            pc = record["postal_code"]
            if pc not in office_data:
                office_data[pc] = {
                    "postal_code": pc,
                    "prefecture": record["prefecture"],
                    "city": record["city"],
                    "offices": [],
                }
            office_data[pc]["offices"].append({
                "office_name": record["office_name"],
                "office_kana": record["office_kana"],
                "town": record["town"],
                "address_detail": record["address_detail"],
                "office_type": record["office_type"],
            })
        
        # Batch write offices
        print(f"Writing {len(office_data)} office postal codes to Firestore...")
        batch = db.batch()
        count = 0
        for pc, data in office_data.items():
            ref = db.collection("offices").document(pc)
            batch.set(ref, data)
            count += 1
            if count % 500 == 0:
                batch.commit()
                batch = db.batch()
                print(f"  Written {count} records...")
        batch.commit()
        print(f"  Total: {count} office postal codes")
        
        # Import prefectures with cities
        print("\n=== Importing Prefectures ===")
        for code, name, kana in PREFECTURE_DATA:
            pref_cities = [c for c in cities_data.values() if c["prefecture_code"] == code]
            db.collection("prefectures").document(code).set({
                "code": code,
                "name": name,
                "name_kana": kana,
                "cities": pref_cities,
            })
        print(f"  Total: {len(PREFECTURE_DATA)} prefectures")
        
        # Update metadata
        print("\n=== Updating Metadata ===")
        db.collection("metadata").document("sync_status").set({
            "postal_codes_count": len(postal_data),
            "offices_count": len(office_data),
            "last_sync": datetime.utcnow(),
        })
        
        print("\n=== Import Complete ===")
        print(f"Postal codes: {len(postal_data)}")
        print(f"Office codes: {len(office_data)}")
        print(f"Prefectures: {len(PREFECTURE_DATA)}")


def main():
    """Main entry point."""
    # Initialize Firebase
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        print("Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
        print("Please set it to the path of your Firebase service account key JSON file")
        sys.exit(1)
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    import_to_firestore(db)


if __name__ == "__main__":
    main()

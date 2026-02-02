#!/usr/bin/env python3
"""
Import Japan Post postal code data to Azure Table Storage.
Requires: pip install azure-data-tables httpx
"""

import csv
import os
import sys
import zipfile
import tempfile
from pathlib import Path
from typing import Generator, Dict, Any
from datetime import datetime

try:
    import httpx
    from azure.data.tables import TableServiceClient, TableClient
except ImportError:
    print("Please install: pip install azure-data-tables httpx")
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
    temp_dir.mkdir(parents=True, exist_ok=True)
    response = httpx.get(url, follow_redirects=True, timeout=120.0)
    response.raise_for_status()
    
    zip_path = temp_dir / "data.zip"
    zip_path.write_bytes(response.content)
    
    extract_dir = temp_dir / "extracted"
    extract_dir.mkdir(exist_ok=True)
    
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)
    
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
        for encoding in ["shift_jis", "cp932"]:
            try:
                with open(csv_file, "r", encoding=encoding) as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) < 13:
                            continue
                        yield {
                            "postal_code": row[7],
                            "office_kana": row[1],
                            "office_name": row[2],
                            "prefecture": row[3],
                            "city": row[4],
                            "town": row[5],
                            "address_detail": row[6],
                        }
                return
            except UnicodeDecodeError:
                continue


def import_to_table_storage(connection_string: str):
    """Import data to Azure Table Storage."""
    service = TableServiceClient.from_connection_string(connection_string)
    
    # Create tables
    print("Creating tables...")
    try:
        service.create_table("PostalCodes")
    except Exception:
        pass
    try:
        service.create_table("Offices")
    except Exception:
        pass
    try:
        service.create_table("Prefectures")
    except Exception:
        pass
    
    postal_table = service.get_table_client("PostalCodes")
    offices_table = service.get_table_client("Offices")
    prefectures_table = service.get_table_client("Prefectures")
    

    
    # Helper for batch upsert
    def batch_upsert(table_client: TableClient, entities_generator: Generator[Dict, None, None], batch_size: int = 100):
        buffer = []
        current_pk = None
        count = 0
        
        for entity in entities_generator:
            pk = entity["PartitionKey"]
            
            # If PK changes, flush buffer
            if current_pk is not None and pk != current_pk:
                if buffer:
                    try:
                        table_client.submit_transaction(buffer)
                    except Exception:
                        for _, ent in buffer:
                            try:
                                table_client.upsert_entity(ent)
                            except Exception:
                                pass
                buffer = []
                count += 1 # Count batches approximately or update real count later
            
            current_pk = pk
            buffer.append(("upsert", entity))
            
            # If buffer full, flush (must be same PK)
            if len(buffer) >= batch_size:
                try:
                    table_client.submit_transaction(buffer)
                except Exception:
                    for _, ent in buffer:
                        try:
                            table_client.upsert_entity(ent)
                        except Exception:
                            pass
                buffer = []
        
        # Flush remaining
        if buffer:
            try:
                table_client.submit_transaction(buffer)
            except Exception:
                for _, ent in buffer:
                    try:
                        table_client.upsert_entity(ent)
                    except Exception:
                        pass

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Import postal codes
        print("\n=== Importing Postal Codes ===")
        utf_dir = download_and_extract(UTF_ALL_URL, temp_path / "utf")
        
        # Sort or assume sorted? Japan Post CSV is usually sorted by postal code.
        # But to be safe, we can rely on the fact that CSV comes sorted by postcode.
        # If not, we'd need to sort, but that's memory intensive. 
        # For now, assume sorted as per Japan Post spec.
        
        def postal_code_generator():
            seen = set()
            for record in parse_utf_csv(utf_dir):
                pc = record["postal_code"]
                if pc in seen:
                    continue
                seen.add(pc)
                
                yield {
                    "PartitionKey": pc[:3],
                    "RowKey": pc[3:],
                    "prefecture": record["prefecture"],
                    "prefectureKana": record["prefecture_kana"],
                    "city": record["city"],
                    "cityKana": record["city_kana"],
                    "town": record["town"],
                    "townKana": record["town_kana"],
                }

        batch_upsert(postal_table, postal_code_generator())
        print("  Postal Codes Import Finished")
        
        # Import offices
        print("\n=== Importing Offices ===")
        jigyosyo_dir = download_and_extract(JIGYOSYO_URL, temp_path / "jigyosyo")
        
        def office_generator():
            for record in parse_jigyosyo_csv(jigyosyo_dir):
                pc = record["postal_code"]
                yield {
                    "PartitionKey": pc[:3],
                    "RowKey": pc[3:],
                    "prefecture": record["prefecture"],
                    "city": record["city"],
                    "officeName": record["office_name"],
                    "officeKana": record["office_kana"],
                    "addressDetail": record["address_detail"],
                }

        batch_upsert(offices_table, office_generator())
        print("  Offices Import Finished")
        
        # Import prefectures
        print("\n=== Importing Prefectures ===")
        for code, name, kana in PREFECTURE_DATA:
            entity = {
                "PartitionKey": "JP",
                "RowKey": code,
                "name": name,
                "nameKana": kana,
            }
            prefectures_table.upsert_entity(entity)
        print(f"  Total: {len(PREFECTURE_DATA)} prefectures")
        
        print("\n=== Import Complete ===")


def main():
    connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        print("Error: AZURE_STORAGE_CONNECTION_STRING environment variable not set")
        print("Get it from: az storage account show-connection-string --name stpostcodejp --resource-group rg-postcodejp")
        sys.exit(1)
    
    import_to_table_storage(connection_string)


if __name__ == "__main__":
    main()

"""CSV parser for Japan Post postal code data files."""

import csv
import logging
from pathlib import Path
from typing import Generator, Dict, Any, List

logger = logging.getLogger(__name__)


class PostalCodeParser:
    """Parser for UTF-8 address postal code CSV files."""
    
    FIELD_NAMES = [
        "local_gov_code",      # 1. 全国地方公共団体コード
        "old_postal_code",     # 2. 旧郵便番号（5桁）
        "postal_code",         # 3. 郵便番号（7桁）
        "prefecture_kana",     # 4. 都道府県名（カナ）
        "city_kana",           # 5. 市区町村名（カナ）
        "town_kana",           # 6. 町域名（カナ）
        "prefecture",          # 7. 都道府県名
        "city",                # 8. 市区町村名
        "town",                # 9. 町域名
        "multi_postal_flag",   # 10. 複数郵便番号フラグ
        "koaza_banchi_flag",   # 11. 小字番地起番フラグ
        "chome_flag",          # 12. 丁目フラグ
        "multi_town_flag",     # 13. 複数町域フラグ
        "update_flag",         # 14. 更新表示
        "change_reason",       # 15. 変更理由
    ]
    
    def parse_file(self, filepath: Path) -> Generator[Dict[str, Any], None, None]:
        """Parse a UTF-8 postal code CSV file.
        
        Args:
            filepath: Path to CSV file
            
        Yields:
            Dictionary with field names as keys
        """
        logger.info(f"Parsing postal code file: {filepath}")
        
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            count = 0
            
            for row in reader:
                if len(row) < len(self.FIELD_NAMES):
                    logger.warning(f"Skipping row with insufficient fields: {row}")
                    continue
                
                record = {}
                for i, field_name in enumerate(self.FIELD_NAMES):
                    value = row[i].strip()
                    
                    # Convert numeric flags to integers
                    if field_name in (
                        "multi_postal_flag", "koaza_banchi_flag", 
                        "chome_flag", "multi_town_flag",
                        "update_flag", "change_reason"
                    ):
                        try:
                            value = int(value) if value else 0
                        except ValueError:
                            value = 0
                    
                    record[field_name] = value
                
                count += 1
                yield record
        
        logger.info(f"Parsed {count} records from {filepath}")
    
    def parse_directory(self, directory: Path) -> Generator[Dict[str, Any], None, None]:
        """Parse all CSV files in a directory.
        
        Args:
            directory: Directory containing CSV files
            
        Yields:
            Dictionary with field names as keys
        """
        csv_files = list(directory.glob("*.csv"))
        if not csv_files:
            csv_files = list(directory.glob("*.CSV"))
        
        for csv_file in csv_files:
            yield from self.parse_file(csv_file)


class OfficePostalCodeParser:
    """Parser for Shift-JIS business office postal code CSV files."""
    
    FIELD_NAMES = [
        "local_gov_code",      # 1. 全国地方公共団体コード
        "office_kana",         # 2. 事業所名（カナ）
        "office_name",         # 3. 事業所名
        "prefecture",          # 4. 都道府県名
        "city",                # 5. 市区町村名
        "town",                # 6. 町域名
        "address_detail",      # 7. 番地等
        "postal_code",         # 8. 郵便番号
        "old_postal_code",     # 9. 旧郵便番号
        "post_office",         # 10. 取扱郵便局
        "office_type",         # 11. 種別
        "multi_number",        # 12. 複数番号
        "change_reason",       # 13. 修正コード
    ]
    
    def parse_file(self, filepath: Path) -> Generator[Dict[str, Any], None, None]:
        """Parse a Shift-JIS office postal code CSV file.
        
        Args:
            filepath: Path to CSV file
            
        Yields:
            Dictionary with field names as keys
        """
        logger.info(f"Parsing office postal code file: {filepath}")
        
        # Try Shift-JIS first, fall back to CP932
        encodings = ["shift_jis", "cp932"]
        
        for encoding in encodings:
            try:
                with open(filepath, "r", encoding=encoding) as f:
                    reader = csv.reader(f)
                    count = 0
                    
                    for row in reader:
                        if len(row) < len(self.FIELD_NAMES):
                            logger.warning(f"Skipping row with insufficient fields: {row}")
                            continue
                        
                        record = {}
                        for i, field_name in enumerate(self.FIELD_NAMES):
                            value = row[i].strip()
                            
                            # Convert numeric flags to integers
                            if field_name in ("office_type", "multi_number", "change_reason"):
                                try:
                                    value = int(value) if value else 0
                                except ValueError:
                                    value = 0
                            
                            record[field_name] = value
                        
                        count += 1
                        yield record
                
                logger.info(f"Parsed {count} records from {filepath} with {encoding}")
                return
                
            except UnicodeDecodeError:
                continue
        
        logger.error(f"Failed to decode {filepath} with any supported encoding")
    
    def parse_directory(self, directory: Path) -> Generator[Dict[str, Any], None, None]:
        """Parse all CSV files in a directory.
        
        Args:
            directory: Directory containing CSV files
            
        Yields:
            Dictionary with field names as keys
        """
        csv_files = list(directory.glob("*.csv"))
        if not csv_files:
            csv_files = list(directory.glob("*.CSV"))
        
        for csv_file in csv_files:
            yield from self.parse_file(csv_file)


# Prefecture code mapping (derived from local_gov_code)
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

-- PostcodeJP Database Schema

-- 都道府県マスタ
CREATE TABLE IF NOT EXISTS prefectures (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    name_kana VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 市区町村マスタ
CREATE TABLE IF NOT EXISTS cities (
    code VARCHAR(5) PRIMARY KEY,
    prefecture_code VARCHAR(2) NOT NULL REFERENCES prefectures(code),
    name VARCHAR(50) NOT NULL,
    name_kana VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 住所郵便番号マスタ
CREATE TABLE IF NOT EXISTS postal_codes (
    id SERIAL PRIMARY KEY,
    local_gov_code VARCHAR(5) NOT NULL,
    old_postal_code VARCHAR(5),
    postal_code VARCHAR(7) NOT NULL,
    prefecture_kana VARCHAR(50) NOT NULL,
    city_kana VARCHAR(100) NOT NULL,
    town_kana TEXT NOT NULL,
    prefecture VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL,
    town TEXT NOT NULL,
    multi_postal_flag SMALLINT DEFAULT 0,
    koaza_banchi_flag SMALLINT DEFAULT 0,
    chome_flag SMALLINT DEFAULT 0,
    multi_town_flag SMALLINT DEFAULT 0,
    update_flag SMALLINT DEFAULT 0,
    change_reason SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 事業所郵便番号マスタ
CREATE TABLE IF NOT EXISTS office_postal_codes (
    id SERIAL PRIMARY KEY,
    local_gov_code VARCHAR(5) NOT NULL,
    office_kana TEXT NOT NULL,
    office_name TEXT NOT NULL,
    prefecture VARCHAR(10) NOT NULL,
    city VARCHAR(50) NOT NULL,
    town TEXT,
    address_detail TEXT,
    postal_code VARCHAR(7) NOT NULL,
    old_postal_code VARCHAR(5),
    post_office TEXT,
    office_type SMALLINT DEFAULT 0,
    multi_number SMALLINT DEFAULT 0,
    change_reason SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 同期履歴
CREATE TABLE IF NOT EXISTS sync_history (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(20) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    file_url TEXT,
    file_date TIMESTAMP WITH TIME ZONE,
    records_added INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_postal_codes_postal_code ON postal_codes(postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_prefecture ON postal_codes(prefecture);
CREATE INDEX IF NOT EXISTS idx_postal_codes_city ON postal_codes(city);
CREATE INDEX IF NOT EXISTS idx_postal_codes_town ON postal_codes(town);
CREATE INDEX IF NOT EXISTS idx_postal_codes_local_gov_code ON postal_codes(local_gov_code);

CREATE INDEX IF NOT EXISTS idx_office_postal_codes_postal_code ON office_postal_codes(postal_code);
CREATE INDEX IF NOT EXISTS idx_office_postal_codes_office_name ON office_postal_codes(office_name);
CREATE INDEX IF NOT EXISTS idx_office_postal_codes_prefecture ON office_postal_codes(prefecture);

CREATE INDEX IF NOT EXISTS idx_cities_prefecture_code ON cities(prefecture_code);

-- 全文検索用インデックス（PostgreSQL）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_postal_codes_town_trgm ON postal_codes USING gin(town gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_postal_codes_city_trgm ON postal_codes USING gin(city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_office_postal_codes_office_name_trgm ON office_postal_codes USING gin(office_name gin_trgm_ops);

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as wanakana from 'wanakana';

type Language = 'ja' | 'en';

type Translations = {
    [key: string]: {
        ja: string;
        en: string;
    }
};

const dictionary: Translations = {
    // Navbar
    home: { ja: 'ホーム', en: 'Home' },
    api_docs: { ja: 'APIドキュメント', en: 'API Docs' },

    // Landing Page - Hero
    hero_title: { ja: '日本で一番', en: 'Japan\'s Most' },
    hero_subtitle: { ja: '使いやすい', en: 'User-Friendly' },
    hero_suffix: { ja: '郵便番号検索API', en: 'Postal Code API' },
    hero_desc: {
        ja: '日本郵便の公式データを元に、毎月自動更新される最新の住所データを提供。高速なレスポンスと使いやすいAPIで、あなたのアプリケーション開発を加速させます。',
        en: 'Providing the latest address data automatically updated monthly based on Japan Post. Accelerate your app development with high-speed response and easy-to-use API.'
    },
    view_docs: { ja: 'APIドキュメントを見る', en: 'View API Docs' },
    try_demo: { ja: 'デモを試す', en: 'Try Demo' },

    // Features
    why_choose: { ja: '選ばれる理由', en: 'Why Choose Us' },
    why_desc: { ja: '開発者のための、シンプルで強力なツール', en: 'Simple and powerful tool for developers' },
    feature_fast: { ja: '驚速レスポンス', en: 'Blazing Fast' },
    feature_fast_desc: { ja: 'Azure Functionsと最適化されたデータ構造により、平均50ms以下の超高速レスポンスを実現。', en: 'Achieve ultra-fast response times averaging under 50ms with Azure Functions and optimized data structures.' },
    feature_update: { ja: '毎月自動更新', en: 'Monthly Updates' },
    feature_update_desc: { ja: '日本郵便のデータ更新に合わせて、GitHub Actionsが自動的に最新データを反映。常に正確です。', en: 'GitHub Actions automatically reflects the latest data in sync with Japan Post updates. Always accurate.' },
    feature_flexible: { ja: '柔軟な検索', en: 'Flexible Search' },
    feature_flexible_desc: { ja: '郵便番号はもちろん、住所からの逆引き、あいまい検索、スペース区切り検索にも完全対応。', en: 'Fully supports reverse lookup from address, fuzzy search, and space-delimited search, as well as postal codes.' },

    // CTA
    cta_title: { ja: 'すぐ始めよう', en: 'Get Started Now' },
    cta_desc: { ja: '面倒な登録は不要です。今すぐAPIを呼び出して、あなたが作りたいアプリケーションに集中しましょう。', en: 'No registration required. Call the API now and focus on the application you want to build.' },

    // Footer
    footer_rights: { ja: 'All rights reserved.', en: 'All rights reserved.' },
    footer_data: { ja: 'Data provided by Japan Post Co., Ltd.', en: 'Data provided by Japan Post Co., Ltd.' },

    // Search Interface
    search_placeholder: { ja: '住所から...', en: 'Search by address...' },
    search_placeholder_zip: { ja: '郵便番号から...', en: 'Search by postal code...' },
    search_tab_address: { ja: '住所から', en: 'By Address' },
    search_tab_zip: { ja: '郵便番号から', en: 'By Postal Code' },
    no_results: { ja: '該当する住所が見つかりませんでした', en: 'No matching addresses found' },

    // API Docs
    docs_title: { ja: 'APIドキュメント', en: 'API Documentation' },
    docs_desc: { ja: 'シンプルで直感的なREST APIエンドポイント', en: 'Simple and intuitive REST API endpoints' },
    docs_intro: { ja: 'PostcodeJP APIの仕様書です。すべてのエンドポイントはパブリックにアクセス可能で、認証キーは不要です。', en: 'Specification for PostcodeJP API. All endpoints are publicly accessible and require no authentication key.' },
    docs_base_url: { ja: 'ベースURL', en: 'Base URL' },
    docs_endpoints: { ja: 'エンドポイント', en: 'Endpoints' },
    docs_request_example: { ja: 'リクエスト例', en: 'Request Example' },
    docs_response_example: { ja: 'レスポンス例', en: 'Response Example' },
    docs_query_params: { ja: 'クエリパラメータ', en: 'Query Parameters' },
    docs_param_name: { ja: '名前', en: 'Name' },
    docs_param_required: { ja: '必須', en: 'Required' },
    docs_param_optional: { ja: '任意', en: 'Optional' },
    docs_param_desc: { ja: '説明', en: 'Description' },
    docs_error_handling: { ja: 'エラーハンドリング', en: 'Error Handling' },
    docs_error_desc: { ja: 'エラー発生時は標準的なHTTPステータスコードと共に、以下のJSONボディが返却されます。', en: 'In case of error, the following JSON body is returned along with standard HTTP status codes.' },

    // Endpoint Descriptions
    endpoint_postal: { ja: '郵便番号から住所を取得', en: 'Get address by postal code' },
    endpoint_postal_desc: { ja: '指定された郵便番号の住所情報を取得します。ハイフンはあってもなくても構いません。', en: 'Retrieves address information for the specified postal code. Hyphens are optional.' },
    endpoint_search: { ja: '住所から郵便番号を検索', en: 'Search postal code by address' },
    endpoint_search_desc: { ja: '住所（漢字・読み仮名）の一部から郵便番号を検索します。スペース区切りでAND検索が可能です。', en: 'Search postal codes by part of the address (Kanji/Kana). Space-delimited AND search is supported.' },
    endpoint_prefectures: { ja: '都道府県一覧を取得', en: 'Get list of prefectures' },
    endpoint_offices: { ja: '事業所郵便番号を取得', en: 'Get office postal code' },

    // Params descriptions
    param_q_desc: { ja: '検索クエリ（例: "千代田区", "新宿区 西新宿"）', en: 'Search query (e.g. "Chiyoda-ku", "Shinjuku-ku Nishi-Shinjuku")' },
    param_limit_desc: { ja: '取得件数（デフォルト: 20, 最大: 100）', en: 'Number of results (Default: 20, Max: 100)' },

    // Common
    updated: { ja: '更新', en: 'Updated' },
    updating: { ja: 'データ更新中...', en: 'Updating data...' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    toRomaji: (kana: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('ja');

    useEffect(() => {
        // Detect browser language
        const browserLang = navigator.language;
        if (browserLang.startsWith('en')) {
            setLanguage('en');
        } else {
            setLanguage('ja');
        }
    }, []);

    const t = (key: string): string => {
        const entry = dictionary[key];
        if (!entry) return key; // Fallback to key if not found
        return entry[language];
    };

    const toRomaji = (kana: string): string => {
        if (language === 'ja') return kana;
        // Convert to Romaji and Capitalize manually
        const romaji = wanakana.toRomaji(kana);
        return romaji.charAt(0).toUpperCase() + romaji.slice(1);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toRomaji }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

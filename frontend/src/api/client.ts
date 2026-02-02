export interface PostalCode {
    postal_code: string;
    prefecture: string;
    prefecture_kana: string;
    city: string;
    city_kana: string;
    town: string;
    town_kana: string;
}

export interface Office {
    postal_code: string;
    prefecture: string;
    city: string;
    office_name: string;
    office_kana: string;
    address_detail: string;
}

export interface Prefecture {
    code: string;
    name: string;
    name_kana: string;
}

export interface SearchResponse<T> {
    total: number;
    items: T[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://func-postcodejp.azurewebsites.net/api";

export async function getPostalCode(code: string): Promise<PostalCode> {
    const res = await fetch(`${API_BASE_URL}/postal-codes/${code}`);
    if (!res.ok) {
        if (res.status === 404) throw new Error("住所が見つかりません");
        throw new Error("APIエラーが発生しました");
    }
    return res.json();
}

export async function searchPostalCodes(query: string, limit = 20): Promise<SearchResponse<PostalCode>> {
    const res = await fetch(`${API_BASE_URL}/postal-codes/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("検索中にエラーが発生しました");
    return res.json();
}

export async function getPrefectures(): Promise<Prefecture[]> {
    const res = await fetch(`${API_BASE_URL}/prefectures`);
    if (!res.ok) throw new Error("都道府県データの取得に失敗しました");
    return res.json();
}


export async function getOffice(code: string): Promise<Office> {
    const res = await fetch(`${API_BASE_URL}/offices/${code}`);
    if (!res.ok) {
        if (res.status === 404) throw new Error("事業所が見つかりません");
        throw new Error("APIエラーが発生しました");
    }
    return res.json();
}

export async function getStats(): Promise<{ last_updated: string | null }> {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) return { last_updated: null };
    return res.json();
}

export async function getVisitorCount(): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE_URL}/counter`);
    if (!res.ok) throw new Error("カウンタの取得に失敗しました");
    return res.json();
}

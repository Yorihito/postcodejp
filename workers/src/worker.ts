/**
 * PostcodeJP API - Cloudflare Workers
 * 
 * KVストレージ構造:
 * - postal:{code} → 住所データJSON
 * - office:{code} → 事業所データJSON  
 * - pref:{code} → 都道府県データJSON
 * - meta:stats → 統計情報JSON
 * - index:city:{cityName} → 郵便番号リストJSON（検索用）
 */

export interface Env {
    POSTAL_CODES: KVNamespace;
}

// CORSヘッダー
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// JSONレスポンス
function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
        },
    });
}

// エラーレスポンス
function errorResponse(message: string, status = 400): Response {
    return jsonResponse({ error: message }, status);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // GET /api/postal-codes/:postalCode
            const postalMatch = path.match(/^\/api\/postal-codes\/([0-9-]+)$/);
            if (postalMatch && request.method === "GET") {
                const postalCode = postalMatch[1].replace(/-/g, "");

                if (postalCode.length !== 7) {
                    return errorResponse("郵便番号は7桁で指定してください");
                }

                const data = await env.POSTAL_CODES.get(`postal:${postalCode}`, "json");

                if (!data) {
                    return errorResponse(
                        `郵便番号 ${postalCode} に該当する住所が見つかりません`,
                        404
                    );
                }

                return jsonResponse(data);
            }

            // GET /api/postal-codes/search?q=...
            if (path === "/api/postal-codes/search" && request.method === "GET") {
                const query = url.searchParams.get("q");
                const limit = Math.min(
                    parseInt(url.searchParams.get("limit") || "20"),
                    100
                );

                if (!query || query.length < 2) {
                    return errorResponse("検索キーワードは2文字以上で指定してください");
                }

                // 都道府県インデックスから検索
                const prefIndex = await env.POSTAL_CODES.get(
                    `index:pref:${query}`,
                    "json"
                ) as string[] | null;

                if (prefIndex && prefIndex.length > 0) {
                    const results = await Promise.all(
                        prefIndex.slice(0, limit).map(async (code) => {
                            const data = await env.POSTAL_CODES.get(`postal:${code}`, "json");
                            return data ? { postal_code: code, ...data as object } : null;
                        })
                    );
                    return jsonResponse({
                        total: results.filter(Boolean).length,
                        items: results.filter(Boolean),
                    });
                }

                // 市区町村インデックスから検索（前方一致）
                const keys = await env.POSTAL_CODES.list({ prefix: `index:city:${query}` });
                const allCodes: string[] = [];

                for (const key of keys.keys.slice(0, 5)) {
                    const codes = await env.POSTAL_CODES.get(key.name, "json") as string[];
                    if (codes) {
                        allCodes.push(...codes);
                    }
                }

                const uniqueCodes = [...new Set(allCodes)].slice(0, limit);
                const results = await Promise.all(
                    uniqueCodes.map(async (code) => {
                        const data = await env.POSTAL_CODES.get(`postal:${code}`, "json");
                        return data ? { postal_code: code, ...data as object } : null;
                    })
                );

                return jsonResponse({
                    total: results.filter(Boolean).length,
                    items: results.filter(Boolean),
                });
            }

            // GET /api/prefectures
            if (path === "/api/prefectures" && request.method === "GET") {
                const prefectures = await env.POSTAL_CODES.get("prefectures", "json");
                return jsonResponse(prefectures || []);
            }

            // GET /api/prefectures/:code/cities
            const citiesMatch = path.match(/^\/api\/prefectures\/([0-9]{2})\/cities$/);
            if (citiesMatch && request.method === "GET") {
                const prefCode = citiesMatch[1];
                const data = await env.POSTAL_CODES.get(`pref:${prefCode}`, "json") as { cities?: unknown[] } | null;

                if (!data) {
                    return errorResponse("都道府県が見つかりません", 404);
                }

                return jsonResponse(data.cities || []);
            }

            // GET /api/offices/:postalCode
            const officeMatch = path.match(/^\/api\/offices\/([0-9-]+)$/);
            if (officeMatch && request.method === "GET") {
                const postalCode = officeMatch[1].replace(/-/g, "");

                if (postalCode.length !== 7) {
                    return errorResponse("郵便番号は7桁で指定してください");
                }

                const data = await env.POSTAL_CODES.get(`office:${postalCode}`, "json");

                if (!data) {
                    return errorResponse(
                        `郵便番号 ${postalCode} に該当する事業所が見つかりません`,
                        404
                    );
                }

                return jsonResponse(data);
            }

            // GET /api/offices/search?q=...
            if (path === "/api/offices/search" && request.method === "GET") {
                const query = url.searchParams.get("q");
                const limit = Math.min(
                    parseInt(url.searchParams.get("limit") || "20"),
                    100
                );

                if (!query || query.length < 2) {
                    return errorResponse("検索キーワードは2文字以上で指定してください");
                }

                // 事業所名インデックスから検索
                const keys = await env.POSTAL_CODES.list({ prefix: `index:office:${query}` });
                const allCodes: string[] = [];

                for (const key of keys.keys.slice(0, 5)) {
                    const codes = await env.POSTAL_CODES.get(key.name, "json") as string[];
                    if (codes) {
                        allCodes.push(...codes);
                    }
                }

                const uniqueCodes = [...new Set(allCodes)].slice(0, limit);
                const results = await Promise.all(
                    uniqueCodes.map(async (code) => {
                        const data = await env.POSTAL_CODES.get(`office:${code}`, "json");
                        return data ? { postal_code: code, ...data as object } : null;
                    })
                );

                return jsonResponse({
                    total: results.filter(Boolean).length,
                    items: results.filter(Boolean),
                });
            }

            // GET /api/stats
            if (path === "/api/stats" && request.method === "GET") {
                const stats = await env.POSTAL_CODES.get("meta:stats", "json");
                return jsonResponse(stats || { postal_codes_count: 0, offices_count: 0 });
            }

            // Root - API info
            if (path === "/" || path === "/api" || path === "/api/") {
                return jsonResponse({
                    name: "PostcodeJP API",
                    version: "1.0.0",
                    runtime: "Cloudflare Workers",
                    endpoints: [
                        "GET /api/postal-codes/:postalCode",
                        "GET /api/postal-codes/search?q=...",
                        "GET /api/prefectures",
                        "GET /api/prefectures/:code/cities",
                        "GET /api/offices/:postalCode",
                        "GET /api/offices/search?q=...",
                        "GET /api/stats",
                    ],
                });
            }

            return errorResponse("Not found", 404);
        } catch (error) {
            console.error("API error:", error);
            return errorResponse("Internal server error", 500);
        }
    },
};

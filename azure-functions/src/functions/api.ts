/**
 * PostcodeJP API - Azure Functions
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// Table Storage 接続 (Lazy Initialization)
let tables: {
    postalCodes: TableClient;
    offices: TableClient;
    prefectures: TableClient;
} | null = null;

function getTables() {
    if (tables) return tables;

    const accountName = process.env.STORAGE_ACCOUNT_NAME || "stpostcodejp";
    const accountKey = process.env.STORAGE_ACCOUNT_KEY;

    if (!accountKey) {
        throw new Error("STORAGE_ACCOUNT_KEY is not set");
    }

    const credential = new AzureNamedKeyCredential(accountName, accountKey);
    const baseUrl = `https://${accountName}.table.core.windows.net`;

    tables = {
        postalCodes: new TableClient(baseUrl, "PostalCodes", credential),
        offices: new TableClient(baseUrl, "Offices", credential),
        prefectures: new TableClient(baseUrl, "Prefectures", credential),
    };

    return tables;
}

// CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// JSON response helper
function jsonResponse(data: unknown, status = 200): HttpResponseInit {
    return {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
        body: JSON.stringify(data),
    };
}

// Error response helper
function errorResponse(message: string, status = 400): HttpResponseInit {
    return jsonResponse({ error: message }, status);
}

/**
 * GET /api/postal-codes/{postalCode}
 */
app.http("getPostalCode", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "postal-codes/{postalCode:regex(^[0-9].*)}",
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === "OPTIONS") {
            return { status: 204, headers: corsHeaders };
        }

        const postalCode = request.params.postalCode?.replace(/-/g, "");

        if (!postalCode || postalCode.length !== 7) {
            return errorResponse("郵便番号は7桁で指定してください");
        }

        try {
            // PartitionKey: 上3桁, RowKey: 下4桁
            const partitionKey = postalCode.substring(0, 3);
            const rowKey = postalCode.substring(3);

            const { postalCodes } = getTables();
            const entity = await postalCodes.getEntity(partitionKey, rowKey);

            return jsonResponse({
                postal_code: postalCode,
                prefecture: entity.prefecture,
                prefecture_kana: entity.prefectureKana,
                city: entity.city,
                city_kana: entity.cityKana,
                town: entity.town,
                town_kana: entity.townKana,
            });
        } catch (error: any) {
            if (error.statusCode === 404) {
                return errorResponse(`郵便番号 ${postalCode} に該当する住所が見つかりません`, 404);
            }
            context.error("Error fetching postal code:", error);
            return errorResponse("Internal server error", 500);
        }
    },
});

/**
 * GET /api/postal-codes/search?q=...
 */
app.http("searchPostalCodes", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "postal-codes/search",
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === "OPTIONS") {
            return { status: 204, headers: corsHeaders };
        }

        const query = request.query.get("q");
        const limit = Math.min(parseInt(request.query.get("limit") || "20"), 100);

        if (!query || query.length < 2) {
            return errorResponse("検索キーワードは2文字以上で指定してください");
        }

        try {
            const results: any[] = [];

            // スペース区切りで複数キーワードに対応 (AND検索)
            // 都道府県、市区町村、町域のいずれかに前方一致すればヒット (OR検索)
            const terms = query.trim().split(/\s+/).filter(t => t.length > 0);

            if (terms.length === 0) {
                return jsonResponse({ total: 0, items: [] });
            }

            // Validate terms to prevent injection
            const sanitizedTerms = terms.map(term => {
                // Allow only alphanumeric characters, Japanese characters, and common punctuation
                // Remove any potentially dangerous characters
                return term.replace(/[^\p{L}\p{N}\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\s\-]/gu, '');
            }).filter(t => t.length > 0);

            if (sanitizedTerms.length === 0) {
                return errorResponse("検索キーワードが無効です");
            }

            const termFilters = sanitizedTerms.map(term => {
                // シングルクォートをエスケープ (already sanitized but double-check)
                const t = term.replace(/'/g, "''");
                return `(
                    (prefecture ge '${t}' and prefecture lt '${t}\uffff') or 
                    (city ge '${t}' and city lt '${t}\uffff') or 
                    (town ge '${t}' and town lt '${t}\uffff')
                )`;
            });

            // 全てのキーワード条件を満たす (AND)
            const primaryFilter = termFilters.join(' and ');
            let finalFilter = primaryFilter;

            // 連結キーワード（例：町田市小山町）のヒューリスティック分割対応
            // スペースがなく、特定の接尾辞が含まれる場合に分割を試みる
            if (sanitizedTerms.length === 1) {
                const originalTerm = sanitizedTerms[0];
                // 接尾辞の後にスペースを挿入して分割
                // 少なくとも1文字以上の先行文字がある場合のみ分割（"市川市"の先頭"市"などを分割しないため）
                const splitQuery = originalTerm.replace(/(.{1,}[都道府県市区町村郡])(?=.)/g, "$1 ").trim();
                const splitTerms = splitQuery.split(/\s+/);

                // 分割結果が元の単語と異なり、かつ複数になった場合のみ追加条件を作成
                if (splitTerms.length > 1 && splitTerms.length < 6) { // 暴走防止のため制限
                    const splitFilters = splitTerms.map(term => {
                        const t = term.replace(/'/g, "''");
                        return `(
                            (prefecture ge '${t}' and prefecture lt '${t}\uffff') or 
                            (city ge '${t}' and city lt '${t}\uffff') or 
                            (town ge '${t}' and town lt '${t}\uffff')
                        )`;
                    });
                    const secondaryFilter = splitFilters.join(' and ');
                    finalFilter = `(${primaryFilter}) or (${secondaryFilter})`;
                }
            }

            const { postalCodes } = getTables();
            const entities = postalCodes.listEntities({
                queryOptions: { filter: finalFilter },
            });

            for await (const entity of entities) {
                if (results.length >= limit) break;
                results.push({
                    postal_code: `${entity.partitionKey}${entity.rowKey}`,
                    prefecture: entity.prefecture,
                    city: entity.city,
                    town: entity.town,
                });
            }

            return jsonResponse({
                total: results.length,
                items: results,
            });
        } catch (error) {
            context.error("Error searching postal codes:", error);
            return errorResponse("Internal server error", 500);
        }
    },
});

/**
 * GET /api/prefectures
 */
app.http("getPrefectures", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "prefectures",
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === "OPTIONS") {
            return { status: 204, headers: corsHeaders };
        }

        try {
            const results: any[] = [];
            const { prefectures } = getTables();
            const entities = prefectures.listEntities();

            for await (const entity of entities) {
                results.push({
                    code: entity.rowKey,
                    name: entity.name,
                    name_kana: entity.nameKana,
                });
            }

            results.sort((a, b) => a.code.localeCompare(b.code));
            return jsonResponse(results);
        } catch (error) {
            context.error("Error fetching prefectures:", error);
            return errorResponse("Internal server error", 500);
        }
    },
});

/**
 * GET /api/offices/{postalCode}
 */
app.http("getOffice", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "offices/{postalCode:regex(^[0-9].*)}",
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === "OPTIONS") {
            return { status: 204, headers: corsHeaders };
        }

        const postalCode = request.params.postalCode?.replace(/-/g, "");

        if (!postalCode || postalCode.length !== 7) {
            return errorResponse("郵便番号は7桁で指定してください");
        }

        try {
            const partitionKey = postalCode.substring(0, 3);
            const rowKey = postalCode.substring(3);

            const { offices } = getTables();
            const entity = await offices.getEntity(partitionKey, rowKey);

            return jsonResponse({
                postal_code: postalCode,
                prefecture: entity.prefecture,
                city: entity.city,
                office_name: entity.officeName,
                office_kana: entity.officeKana,
                address_detail: entity.addressDetail,
            });
        } catch (error: any) {
            if (error.statusCode === 404) {
                return errorResponse(`郵便番号 ${postalCode} に該当する事業所が見つかりません`, 404);
            }
            context.error("Error fetching office:", error);
            return errorResponse("Internal server error", 500);
        }
    },
});

/**
 * GET /api/stats
 */
app.http("getStats", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",
    route: "stats",
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        if (request.method === "OPTIONS") {
            return { status: 204, headers: corsHeaders };
        }

        return jsonResponse({
            name: "PostcodeJP API",
            version: "1.0.0",
            runtime: "Azure Functions",
            endpoints: [
                "GET /api/postal-codes/{postalCode}",
                "GET /api/postal-codes/search?q=...",
                "GET /api/prefectures",
                "GET /api/offices/{postalCode}",
                "GET /api/stats",
            ],
        });
    },
});

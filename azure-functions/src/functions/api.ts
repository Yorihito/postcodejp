/**
 * PostcodeJP API - Azure Functions
 */
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

// Table Storage 接続
const accountName = process.env.STORAGE_ACCOUNT_NAME || "stpostcodejp";
const accountKey = process.env.STORAGE_ACCOUNT_KEY || "";
const credential = new AzureNamedKeyCredential(accountName, accountKey);

const postalCodesTable = new TableClient(
    `https://${accountName}.table.core.windows.net`,
    "PostalCodes",
    credential
);

const officesTable = new TableClient(
    `https://${accountName}.table.core.windows.net`,
    "Offices",
    credential
);

const prefecturesTable = new TableClient(
    `https://${accountName}.table.core.windows.net`,
    "Prefectures",
    credential
);

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
    route: "postal-codes/{postalCode}",
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

            const entity = await postalCodesTable.getEntity(partitionKey, rowKey);

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

            // 都道府県または市区町村で検索
            const filter = `prefecture eq '${query}' or city eq '${query}'`;
            const entities = postalCodesTable.listEntities({
                queryOptions: { filter },
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
            const entities = prefecturesTable.listEntities();

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
    route: "offices/{postalCode}",
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

            const entity = await officesTable.getEntity(partitionKey, rowKey);

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

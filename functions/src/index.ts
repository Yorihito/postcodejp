/**
 * PostcodeJP API - Cloud Functions Entry Point
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// CORS middleware
const corsHandler = cors({ origin: true });

/**
 * Helper to wrap handlers with CORS
 */
function withCors(
    handler: (
        req: functions.https.Request,
        res: functions.Response
    ) => Promise<void>
) {
    return functions.https.onRequest((req, res) => {
        corsHandler(req, res, () => handler(req, res));
    });
}

/**
 * GET /api/postal-codes/:postalCode
 * 郵便番号から住所を取得
 */
export const getPostalCode = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const postalCode = req.path.split("/").pop()?.replace(/-/g, "");

    if (!postalCode || postalCode.length !== 7) {
        res.status(400).json({ error: "郵便番号は7桁で指定してください" });
        return;
    }

    try {
        const doc = await db.collection("postal_codes").doc(postalCode).get();

        if (!doc.exists) {
            res.status(404).json({
                error: `郵便番号 ${postalCode} に該当する住所が見つかりません`,
            });
            return;
        }

        res.json(doc.data());
    } catch (error) {
        console.error("Error fetching postal code:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/postal-codes/search?q=...
 * 住所から郵便番号を検索（前方一致）
 */
export const searchPostalCodes = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!query || query.length < 2) {
        res.status(400).json({ error: "検索キーワードは2文字以上で指定してください" });
        return;
    }

    try {
        // 都道府県での検索
        let snapshot = await db
            .collection("postal_codes")
            .where("prefecture", "==", query)
            .limit(limit)
            .get();

        // 市区町村での前方一致検索
        if (snapshot.empty) {
            snapshot = await db
                .collection("postal_codes")
                .where("city", ">=", query)
                .where("city", "<=", query + "\uf8ff")
                .limit(limit)
                .get();
        }

        const results = snapshot.docs.map((doc) => ({
            postal_code: doc.id,
            ...doc.data(),
        }));

        res.json({
            total: results.length,
            items: results,
        });
    } catch (error) {
        console.error("Error searching postal codes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/prefectures
 * 都道府県一覧を取得
 */
export const getPrefectures = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const snapshot = await db
            .collection("prefectures")
            .orderBy("code")
            .get();

        const prefectures = snapshot.docs.map((doc) => doc.data());
        res.json(prefectures);
    } catch (error) {
        console.error("Error fetching prefectures:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/prefectures/:code/cities
 * 市区町村一覧を取得
 */
export const getCities = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const prefCode = req.path.split("/")[2];

    if (!prefCode || prefCode.length !== 2) {
        res.status(400).json({ error: "都道府県コードは2桁で指定してください" });
        return;
    }

    try {
        const doc = await db.collection("prefectures").doc(prefCode).get();

        if (!doc.exists) {
            res.status(404).json({ error: "都道府県が見つかりません" });
            return;
        }

        const data = doc.data();
        res.json(data?.cities || []);
    } catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/offices/:postalCode
 * 事業所郵便番号から情報を取得
 */
export const getOffice = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const postalCode = req.path.split("/").pop()?.replace(/-/g, "");

    if (!postalCode || postalCode.length !== 7) {
        res.status(400).json({ error: "郵便番号は7桁で指定してください" });
        return;
    }

    try {
        const doc = await db.collection("offices").doc(postalCode).get();

        if (!doc.exists) {
            res.status(404).json({
                error: `郵便番号 ${postalCode} に該当する事業所が見つかりません`,
            });
            return;
        }

        res.json(doc.data());
    } catch (error) {
        console.error("Error fetching office:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/offices/search?q=...
 * 事業所名で検索
 */
export const searchOffices = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!query || query.length < 2) {
        res.status(400).json({ error: "検索キーワードは2文字以上で指定してください" });
        return;
    }

    try {
        // 事業所名での前方一致検索
        const snapshot = await db
            .collection("offices")
            .where("office_name", ">=", query)
            .where("office_name", "<=", query + "\uf8ff")
            .limit(limit)
            .get();

        const results = snapshot.docs.map((doc) => ({
            postal_code: doc.id,
            ...doc.data(),
        }));

        res.json({
            total: results.length,
            items: results,
        });
    } catch (error) {
        console.error("Error searching offices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * GET /api/stats
 * データ統計を取得
 */
export const getStats = withCors(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const metaDoc = await db.collection("metadata").doc("sync_status").get();
        const metadata = metaDoc.data() || {};

        res.json({
            postal_codes_count: metadata.postal_codes_count || 0,
            offices_count: metadata.offices_count || 0,
            last_sync: metadata.last_sync?.toDate?.() || null,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Combined API endpoint
 */
export const api = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        const path = req.path;

        try {
            // Route handling
            if (path.match(/^\/postal-codes\/search/)) {
                return searchPostalCodes.run(req, res, () => { });
            } else if (path.match(/^\/postal-codes\/[0-9-]+$/)) {
                return getPostalCode.run(req, res, () => { });
            } else if (path.match(/^\/prefectures\/[0-9]{2}\/cities$/)) {
                return getCities.run(req, res, () => { });
            } else if (path === "/prefectures") {
                return getPrefectures.run(req, res, () => { });
            } else if (path.match(/^\/offices\/search/)) {
                return searchOffices.run(req, res, () => { });
            } else if (path.match(/^\/offices\/[0-9-]+$/)) {
                return getOffice.run(req, res, () => { });
            } else if (path === "/stats") {
                return getStats.run(req, res, () => { });
            } else if (path === "/" || path === "") {
                res.json({
                    name: "PostcodeJP API",
                    version: "1.0.0",
                    endpoints: [
                        "GET /postal-codes/:postalCode",
                        "GET /postal-codes/search?q=...",
                        "GET /prefectures",
                        "GET /prefectures/:code/cities",
                        "GET /offices/:postalCode",
                        "GET /offices/search?q=...",
                        "GET /stats",
                    ],
                });
                return;
            }

            res.status(404).json({ error: "Not found" });
        } catch (error) {
            console.error("API error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});

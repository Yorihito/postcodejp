/**
 * PostcodeJP API - Cloud Functions Entry Point
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// CORS middleware
const corsMiddleware = cors({ origin: true });

/**
 * Combined API endpoint
 */
export const api = functions.https.onRequest((req, res) => {
    corsMiddleware(req, res, async () => {
        const path = req.path;

        try {
            // GET /postal-codes/:postalCode
            if (req.method === "GET" && path.match(/^\/postal-codes\/[0-9-]+$/)) {
                const postalCode = path.split("/").pop()?.replace(/-/g, "");

                if (!postalCode || postalCode.length !== 7) {
                    res.status(400).json({ error: "郵便番号は7桁で指定してください" });
                    return;
                }

                const doc = await db.collection("postal_codes").doc(postalCode).get();

                if (!doc.exists) {
                    res.status(404).json({
                        error: `郵便番号 ${postalCode} に該当する住所が見つかりません`,
                    });
                    return;
                }

                res.json(doc.data());
                return;
            }

            // GET /postal-codes/search?q=...
            if (req.method === "GET" && path.match(/^\/postal-codes\/search/)) {
                const query = req.query.q as string;
                const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

                if (!query || query.length < 2) {
                    res.status(400).json({
                        error: "検索キーワードは2文字以上で指定してください",
                    });
                    return;
                }

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
                return;
            }

            // GET /prefectures/:code/cities
            if (req.method === "GET" && path.match(/^\/prefectures\/[0-9]{2}\/cities$/)) {
                const prefCode = path.split("/")[2];

                const doc = await db.collection("prefectures").doc(prefCode).get();

                if (!doc.exists) {
                    res.status(404).json({ error: "都道府県が見つかりません" });
                    return;
                }

                const data = doc.data();
                res.json(data?.cities || []);
                return;
            }

            // GET /prefectures
            if (req.method === "GET" && path === "/prefectures") {
                const snapshot = await db
                    .collection("prefectures")
                    .orderBy("code")
                    .get();

                const prefectures = snapshot.docs.map((doc) => doc.data());
                res.json(prefectures);
                return;
            }

            // GET /offices/:postalCode
            if (req.method === "GET" && path.match(/^\/offices\/[0-9-]+$/)) {
                const postalCode = path.split("/").pop()?.replace(/-/g, "");

                if (!postalCode || postalCode.length !== 7) {
                    res.status(400).json({ error: "郵便番号は7桁で指定してください" });
                    return;
                }

                const doc = await db.collection("offices").doc(postalCode).get();

                if (!doc.exists) {
                    res.status(404).json({
                        error: `郵便番号 ${postalCode} に該当する事業所が見つかりません`,
                    });
                    return;
                }

                res.json(doc.data());
                return;
            }

            // GET /offices/search?q=...
            if (req.method === "GET" && path.match(/^\/offices\/search/)) {
                const query = req.query.q as string;
                const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

                if (!query || query.length < 2) {
                    res.status(400).json({
                        error: "検索キーワードは2文字以上で指定してください",
                    });
                    return;
                }

                const snapshot = await db
                    .collection("offices")
                    .where("offices", "array-contains-any", [])
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
                return;
            }

            // GET /stats
            if (req.method === "GET" && path === "/stats") {
                const metaDoc = await db.collection("metadata").doc("sync_status").get();
                const metadata = metaDoc.data() || {};

                res.json({
                    postal_codes_count: metadata.postal_codes_count || 0,
                    offices_count: metadata.offices_count || 0,
                    last_sync: metadata.last_sync?.toDate?.() || null,
                });
                return;
            }

            // Root endpoint - API info
            if (path === "/" || path === "") {
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

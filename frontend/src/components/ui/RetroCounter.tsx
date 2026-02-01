import { useEffect, useState } from 'react';
import { cn } from './Button';

export function RetroCounter() {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // API呼び出しでカウントを取得（本番環境ではAPIエンドポイントを使用）
        // ローカル開発時はモック動作または実際のエンドポイントへプロキシ
        const fetchCount = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://postcodejp.azurestaticapps.net/api";
                const res = await fetch(`${API_BASE_URL}/counter`);
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                } else {
                    // フォールバック（APIがない場合など）
                    console.error("Counter API error");
                    setCount(12345);
                }
            } catch (err) {
                console.error("Counter fetch failed", err);
                setCount(12345);
            } finally {
                setLoading(false);
            }
        };

        fetchCount();
    }, []);

    // 数字を6桁の文字列に変換（0埋め）
    const displayCount = (count || 0).toString().padStart(6, '0');

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="bg-black border-4 border-slate-600 rounded-lg p-3 shadow-2xl relative overflow-hidden group">
                {/* ガラスの光沢エフェクト */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-10 rounded-sm"></div>

                <div className="flex gap-1">
                    {displayCount.split('').map((digit, i) => (
                        <div key={i} className="relative w-8 h-12 bg-slate-900 flex items-center justify-center rounded">
                            {/* 7セグメント風のフォントまたはスタイル */}
                            <span className={cn(
                                "text-3xl font-mono font-bold tracking-widest z-0",
                                "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]",
                                loading && "animate-pulse"
                            )}>
                                {digit}
                            </span>
                            {/* 走査線エフェクト */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-sm text-slate-500 font-mono tracking-wider">VISITOR COUNT</p>
        </div>
    );
}

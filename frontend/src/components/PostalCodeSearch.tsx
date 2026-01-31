import { useState } from 'react';
import { Search } from 'lucide-react';
import { getPostalCode, type PostalCode } from '../api/client';
import { CopyButton } from './ui/CopyButton';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

export function PostalCodeSearch() {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<PostalCode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const normalizePostalCode = (input: string) => {
        return input
            .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/[－‐]/g, '-');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedCode = normalizePostalCode(code).replace(/-/g, '');

        if (normalizedCode.length < 7) {
            setError('郵便番号は7桁で入力してください');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await getPostalCode(normalizedCode);
            setResult(data);
        } catch (err: any) {
            setError(err.message || '検索に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="郵便番号 (例: 100-0001)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={8}
                    className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                    {loading ? '検索中...' : <><Search className="w-4 h-4 mr-2" /> 検索</>}
                </Button>
            </form>

            {error && (
                <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {result && (
                <Card className="p-6 animate-in fade-in slide-in-from-bottom-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-slate-400 dark:text-gray-400">郵便番号</dt>
                            <dd className="mt-1 text-lg font-semibold text-slate-50 dark:text-white">
                                〒{result.postal_code.slice(0, 3)}-{result.postal_code.slice(3)}
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-slate-400 dark:text-gray-400">住所</dt>
                            <dd className="mt-1 flex items-center gap-2 text-xl text-slate-50 dark:text-white">
                                <span>{result.prefecture} {result.city} {result.town}</span>
                                <CopyButton text={`${result.prefecture} ${result.city} ${result.town}`} />
                            </dd>
                            <dd className="text-sm text-slate-400 dark:text-gray-400">
                                {result.prefecture_kana} {result.city_kana} {result.town_kana}
                            </dd>
                        </div>
                    </dl>
                </Card>
            )}
        </div>
    );
}

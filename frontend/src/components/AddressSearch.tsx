import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchPostalCodes, type PostalCode } from '../api/client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

export function AddressSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PostalCode[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length < 2) {
            setError('検索ワードは2文字以上で入力してください');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await searchPostalCodes(query);
            setResults(data.items);
            if (data.items.length === 0) {
                setError('該当する住所が見つかりませんでした');
            }
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
                    placeholder="住所 (例: 東京都千代田区)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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

            <div className="grid gap-4">
                {results.map((item) => (
                    <Card key={item.postal_code} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    〒{item.postal_code.slice(0, 3)}-{item.postal_code.slice(3)}
                                </p>
                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                    {item.prefecture} {item.city} {item.town}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.prefecture_kana} {item.city_kana} {item.town_kana}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

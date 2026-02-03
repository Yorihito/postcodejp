import { CopyButton } from '../ui/CopyButton';
import { Card } from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

export function ApiDocsPage() {
    const BASE_URL = "https://postcodejp.ddns.net/api";
    const { t } = useLanguage();

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold">{t('docs_title')}</h1>
                <p className="text-slate-400 text-lg">
                    {t('docs_intro')}
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">{t('docs_base_url')}</h2>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-sm">
                    <span className="text-blue-400 truncate">{BASE_URL}</span>
                    <CopyButton text={BASE_URL} />
                </div>
            </section>

            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-slate-700 pb-2">{t('docs_endpoints')}</h2>

                {/* GET /postal-codes/:code */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-bold rounded">GET</span>
                        <code className="text-lg font-mono">/postal-codes/{'{code}'}</code>
                    </div>
                    <p className="text-slate-300">
                        {t('endpoint_postal_desc')}
                    </p>

                    <h3 className="text-lg font-semibold mt-4">{t('docs_request_example')}</h3>
                    <Card className="bg-slate-900 border-slate-800 p-4 font-mono text-sm overflow-x-auto text-slate-300">
                        GET {BASE_URL}/postal-codes/1000001
                    </Card>

                    <h3 className="text-lg font-semibold mt-4">{t('docs_response_example')}</h3>
                    <Card className="bg-slate-900 border-slate-800 p-4 font-mono text-sm overflow-x-auto text-blue-300">
                        {`{
  "postal_code": "1000001",
  "prefecture": "東京都",
  "prefecture_kana": "トウキョウト",
  "city": "千代田区",
  "city_kana": "チヨダク",
  "town": "千代田",
  "town_kana": "チヨダ"
}`}
                    </Card>
                </div>

                <div className="h-px bg-slate-800 my-8" />

                {/* GET /postal-codes/search */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm font-bold rounded">GET</span>
                        <code className="text-lg font-mono">/postal-codes/search</code>
                    </div>
                    <p className="text-slate-300">
                        {t('endpoint_search_desc')}
                    </p>

                    <h3 className="text-lg font-semibold mt-4">{t('docs_query_params')}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-700">
                                <tr>
                                    <th className="py-2 font-medium">{t('docs_param_name')}</th>
                                    <th className="py-2 font-medium">{t('docs_param_required')}</th>
                                    <th className="py-2 font-medium">{t('docs_param_desc')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                <tr>
                                    <td className="py-2 font-mono text-blue-400">q</td>
                                    <td className="py-2 text-red-400">{t('docs_param_required')}</td>
                                    <td className="py-2 text-slate-400">{t('param_q_desc')}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-mono text-blue-400">limit</td>
                                    <td className="py-2 text-slate-500">{t('docs_param_optional')}</td>
                                    <td className="py-2 text-slate-400">{t('param_limit_desc')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-lg font-semibold mt-4">{t('docs_request_example')}</h3>
                    <Card className="bg-slate-900 border-slate-800 p-4 font-mono text-sm overflow-x-auto text-slate-300">
                        GET {BASE_URL}/postal-codes/search?q=千代田区&limit=5
                    </Card>

                    <h3 className="text-lg font-semibold mt-4">{t('docs_response_example')}</h3>
                    <Card className="bg-slate-900 border-slate-800 p-4 font-mono text-sm overflow-x-auto text-blue-300">
                        {`{
  "total": 1,
  "items": [
    {
      "postal_code": "1000001",
      "prefecture": "東京都",
      // ...
    }
  ]
}`}
                    </Card>
                </div>
            </section>

            <section className="space-y-4 pt-8">
                <h2 className="text-2xl font-bold text-slate-100">{t('docs_error_handling')}</h2>
                <p className="text-slate-400">
                    {t('docs_error_desc')}
                </p>
                <Card className="bg-slate-900 border-slate-800 p-4 font-mono text-sm overflow-x-auto text-red-300">
                    {`{
  "error": "Error message content"
}`}
                </Card>
            </section>
        </div>
    );
}

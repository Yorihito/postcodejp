import { MapPin, Zap, Database, Smartphone, ArrowRight } from 'lucide-react';
import { SearchInterface } from '../SearchInterface';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Link } from 'react-router-dom';
import { RetroCounter } from '../ui/RetroCounter';
import { useEffect, useState } from 'react';

export function LandingPage() {
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.last_updated) {
                    const date = new Date(data.last_updated);
                    setLastUpdated(date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }));
                }
            })
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen pt-16 flex flex-col relative overflow-hidden">
            {/* Background decorations */}
            <div className="w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] absolute -top-40 -left-20 pointer-events-none animate-pulse-slow" />
            <div className="w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] absolute top-1/2 -right-20 pointer-events-none" />

            {/* Hero Section */}
            <section className="relative z-10 px-4 py-16 md:py-24 flex flex-col items-center text-center space-y-8">
                <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
                        <span className="flex w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                        {lastUpdated ? `${lastUpdated} 更新` : 'データ更新中...'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        日本で一番<br className="sm:hidden" />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">使いやすい</span>
                        <br className="sm:hidden" />郵便番号検索API
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        日本郵便の公式データを元に、毎月自動更新される最新の住所データを提供。<br className="hidden sm:block" />
                        高速なレスポンスと使いやすいAPIで、あなたのアプリケーション開発を加速させます。
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/docs">
                            <Button className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                                APIドキュメントを見る <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="h-12 px-8 text-base rounded-full border-slate-700 hover:bg-slate-800 transition-all"
                            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            デモを試す
                        </Button>
                    </div>
                </div>

                {/* Demo Section */}
                <div id="demo" className="w-full max-w-3xl mt-12 scroll-mt-24">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-800 p-6 md:p-8">
                            <SearchInterface />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-slate-900/50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">選ばれる理由</h2>
                        <p className="text-slate-400">開発者のための、シンプルで強力なツール</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                                title: "驚速レスポンス",
                                desc: "Azure Functionsと最適化されたデータ構造により、平均50ms以下の超高速レスポンスを実現。"
                            },
                            {
                                icon: <Database className="w-8 h-8 text-blue-400" />,
                                title: "毎月自動更新",
                                desc: "日本郵便のデータ更新に合わせて、GitHub Actionsが自動的に最新データを反映。常に正確です。"
                            },
                            {
                                icon: <Smartphone className="w-8 h-8 text-purple-400" />,
                                title: "柔軟な検索",
                                desc: "郵便番号はもちろん、住所からの逆引き、あいまい検索、スペース区切り検索にも完全対応。"
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 border border-slate-700">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-slate-400">{feature.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative">
                    <h2 className="text-4xl font-bold mb-6">すぐ始めよう</h2>
                    <p className="text-xl text-slate-400 mb-8">
                        面倒な登録は不要です。今すぐAPIを呼び出して、<br />あなたが作りたいアプリケーションに集中しましょう。
                    </p>
                    <div className="flex justify-center">
                        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 font-mono text-sm text-slate-300 shadow-xl max-w-full overflow-x-auto">
                            <span className="text-purple-400">curl</span> <span className="text-green-400">https://postcodejp.azurestaticapps.net/api/postal-codes/1000001</span>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-600 border-t border-slate-800 bg-slate-900">
                <div className="flex flex-col items-center gap-6 mb-8">
                    <RetroCounter />
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <MapPin className="w-5 h-5" />
                    <span className="font-bold text-slate-400">PostcodeJP</span>
                </div>
                <p className="text-sm">&copy; 2025 PostcodeJP. All rights reserved.</p>
                <p className="text-xs mt-2 opacity-50">Data provided by Japan Post Co., Ltd.</p>
            </footer>
        </div>
    );
}

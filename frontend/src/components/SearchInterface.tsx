import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { PostalCodeSearch } from './PostalCodeSearch';
import { AddressSearch } from './AddressSearch';
import { Button, cn } from './ui/Button';
import { Card } from './ui/Card';
import { useLanguage } from '../contexts/LanguageContext';

export function SearchInterface() {
    const [activeTab, setActiveTab] = useState<'postal' | 'address'>('address');
    const { t } = useLanguage();

    return (
        <div className="w-full max-w-xl mx-auto space-y-6">
            <Card className="p-1.5 bg-slate-900/60 backdrop-blur-xl border-slate-800">
                <div className="grid grid-cols-2 gap-1">
                    <Button
                        variant={activeTab === 'address' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('address')}
                        className={cn(
                            "w-full transition-all duration-300 h-10 rounded-xl",
                            activeTab === 'address' ? "bg-slate-800 text-white shadow-lg border-slate-700" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Search className="w-4 h-4 mr-1.5 md:mr-2" />
                        <span className="text-xs sm:text-sm md:text-base">{t('search_tab_address')}</span>
                    </Button>
                    <Button
                        variant={activeTab === 'postal' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveTab('postal')}
                        className={cn(
                            "w-full transition-all duration-300 h-10 rounded-xl",
                            activeTab === 'postal' ? "bg-slate-800 text-white shadow-lg border-slate-700" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <MapPin className="w-4 h-4 mr-1.5 md:mr-2" />
                        <span className="text-xs sm:text-sm md:text-base">{t('search_tab_zip')}</span>
                    </Button>
                </div>
            </Card>

            <main className="transition-all duration-500 ease-in-out transform">
                {activeTab === 'postal' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PostalCodeSearch />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AddressSearch />
                    </div>
                )}
            </main>
        </div>
    );
}

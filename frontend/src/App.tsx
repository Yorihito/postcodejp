import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { PostalCodeSearch } from './components/PostalCodeSearch';
import { AddressSearch } from './components/AddressSearch';
import { Button, cn } from './components/ui/Button';
import { Card } from './components/ui/Card';

function App() {
  const [activeTab, setActiveTab] = useState<'postal' | 'address'>('postal');

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] absolute -top-40 -left-20 pointer-events-none animate-pulse-slow" />
      <div className="w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] absolute -bottom-20 -right-20 pointer-events-none" />

      <div className="max-w-xl w-full space-y-6 md:space-y-8 relative z-10 px-4">
        <header className="text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl shadow-blue-900/20 mb-2 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MapPin className="w-8 h-8 md:w-10 md:h-10 text-blue-500 drop-shadow-lg" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
              PostcodeJP
            </h1>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg font-medium">
              日本郵便データを活用した<br className="sm:hidden" />高速な郵便番号検索
            </p>
          </div>
        </header>

        <Card className="p-1.5 bg-slate-900/60 backdrop-blur-xl border-slate-800">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={activeTab === 'postal' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('postal')}
              className={cn(
                "w-full transition-all duration-300 h-10 rounded-xl",
                activeTab === 'postal' ? "bg-slate-800 text-white shadow-lg border-slate-700" : "text-slate-400 hover:text-white"
              )}
            >
              <MapPin className="w-4 h-4 mr-1.5 md:mr-2" />
              <span className="text-xs sm:text-sm md:text-base">郵便番号</span>
              <span className="hidden sm:inline text-xs sm:text-sm md:text-base">から</span>
            </Button>
            <Button
              variant={activeTab === 'address' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('address')}
              className={cn(
                "w-full transition-all duration-300 h-10 rounded-xl",
                activeTab === 'address' ? "bg-slate-800 text-white shadow-lg border-slate-700" : "text-slate-400 hover:text-white"
              )}
            >
              <Search className="w-4 h-4 mr-1.5 md:mr-2" />
              <span className="text-xs sm:text-sm md:text-base">住所</span>
              <span className="hidden sm:inline text-xs sm:text-sm md:text-base">から</span>
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

        <footer className="text-center text-sm text-slate-600 py-8">
          <p>&copy; 2024 PostcodeJP. All rights reserved.</p>
          <p className="mt-2 text-xs opacity-50">Data provided by Japan Post Co., Ltd.</p>
        </footer>
      </div >
    </div >
  );
}

export default App;

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
      <div className="w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] absolute -top-20 -left-20 pointer-events-none" />
      <div className="w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] absolute -bottom-20 -right-20 pointer-events-none" />

      <div className="max-w-xl w-full space-y-8 relative z-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-tight">
            PostcodeJP
          </h1>
          <p className="text-gray-400 text-lg">
            日本郵便データを活用した<br className="sm:hidden" />高速な郵便番号検索
          </p>
        </header>

        <Card className="p-1.5 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border-white/10">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={activeTab === 'postal' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('postal')}
              className={cn(
                "w-full transition-all duration-300",
                activeTab === 'postal' ? "shadow-md" : "hover:bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <MapPin className="w-4 h-4 mr-2" />
              郵便番号から
            </Button>
            <Button
              variant={activeTab === 'address' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('address')}
              className={cn(
                "w-full transition-all duration-300",
                activeTab === 'address' ? "shadow-md" : "hover:bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <Search className="w-4 h-4 mr-2" />
              住所から
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

        <footer className="text-center text-sm text-gray-500 py-8">
          <p>データ提供: 日本郵便株式会社</p>
          <p className="mt-2 text-xs opacity-70">Powered by Azure Functions & Static Web Apps</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

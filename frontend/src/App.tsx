import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { PostalCodeSearch } from './components/PostalCodeSearch';
import { AddressSearch } from './components/AddressSearch';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';

function App() {
  const [activeTab, setActiveTab] = useState<'postal' | 'address'>('postal');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PostcodeJP
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            日本郵便データを活用した高速な郵便番号検索
          </p>
        </header>

        <Card className="p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={activeTab === 'postal' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('postal')}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              郵便番号から検索
            </Button>
            <Button
              variant={activeTab === 'address' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('address')}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              住所から検索
            </Button>
          </div>
        </Card>

        <main className="transition-all duration-300">
          {activeTab === 'postal' ? (
            <PostalCodeSearch />
          ) : (
            <AddressSearch />
          )}
        </main>

        <footer className="text-center text-xs text-gray-500 py-8">
          <p>データ提供: 日本郵便株式会社</p>
          <p className="mt-1">Powered by Azure Functions & Static Web Apps</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

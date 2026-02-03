import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './components/pages/LandingPage';
import { ApiDocsPage } from './components/pages/ApiDocsPage';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="bg-slate-950 min-h-screen text-slate-50 font-sans selection:bg-blue-500/30">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<ApiDocsPage />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;

import { Link, useLocation } from 'react-router-dom';
import { MapPin, BookOpen, Github } from 'lucide-react';
import { cn } from '../ui/Button';

import { useLanguage } from '../../contexts/LanguageContext';

export function Navbar() {
    const location = useLocation();
    const { t } = useLanguage();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                            <MapPin className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            PostcodeJP
                        </span>
                    </Link>

                    <div className="flex items-center space-x-1 sm:space-x-4">
                        <Link
                            to="/"
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                location.pathname === "/"
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            {t('home')}
                        </Link>
                        <Link
                            to="/docs"
                            className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                location.pathname === "/docs"
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('api_docs')}</span>
                            <span className="sm:hidden">Docs</span>
                        </Link>
                        <a
                            href="https://github.com/Yorihito/postcodejp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}

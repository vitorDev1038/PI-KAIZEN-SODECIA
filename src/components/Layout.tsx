import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Lightbulb, LogOut, LayoutDashboard, FileText, Users, Settings, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'kaizens' | 'users' | 'settings';
  onPageChange: (page: 'dashboard' | 'kaizens' | 'users' | 'settings') => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'kaizens', name: 'Kaizens', icon: FileText, show: isAdmin },
    { id: 'users', name: 'Usuários', icon: Users, show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sodecia Kaizen</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'Administrador' : 'Funcionário'}
                  {profile?.role === 'employee' && ` • ${profile.points} pts`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] ${
          isMobileMenuOpen ? 'fixed left-0 top-16 z-50 md:relative md:top-0' : 'hidden md:block'
        }`}>
          <nav className="p-4 space-y-1">
            {navigation
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id as typeof currentPage);
                      setIsMobileMenuOpen(false); // Close mobile menu on navigation
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

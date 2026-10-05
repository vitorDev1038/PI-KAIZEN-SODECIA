import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { Lightbulb, LogOut, LayoutDashboard, FileText, Users, Settings, Trophy } from 'lucide-react';

export type PageType = 'dashboard' | 'kaizens' | 'gamification' | 'users' | 'settings';

interface LayoutProps {
  children: ReactNode;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { settings } = useSettings();

  const isAdmin = profile?.role === 'admin';

  const navigation = [
    {
      id: 'dashboard' as PageType,
      name: isAdmin ? 'Dashboard' : 'Início',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'kaizens' as PageType,
      name: isAdmin ? 'Gestão de Kaizens' : 'Meus Kaizens',
      icon: FileText,
      show: true,
    },
    {
      id: 'gamification' as PageType,
      name: 'Conquistas & Prêmios',
      icon: Trophy,
      show: true,
    },
    {
      id: 'users' as PageType,
      name: 'Usuários',
      icon: Users,
      show: isAdmin,
    },
    {
      id: 'settings' as PageType,
      name: 'Configurações',
      icon: Settings,
      show: isAdmin,
    },
  ];

  const visibleNav = navigation.filter((item) => item.show);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onPageChange('dashboard')}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.institutionName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'Administrador / Gestão' : 'Colaborador Sodecia'}
                  {profile?.role === 'employee' && ` • ${profile.points} pts`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} title="Sair da Conta">
                <LogOut className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pb-16 md:pb-0">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-1.5">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around p-1.5 shadow-lg">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

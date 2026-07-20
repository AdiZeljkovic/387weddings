import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Image, Images, Package, Quote, Mail,
  Settings, LogOut, Menu, X, ChevronRight, FileEdit, Instagram
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/admin',              label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { path: '/admin/pages',        label: 'Stranice',    icon: FileEdit },
  { path: '/admin/images',       label: 'Fotografije', icon: Images },
  { path: '/admin/instagram',    label: 'Instagram',   icon: Instagram },
  { path: '/admin/gallery',      label: 'Galerija',    icon: Image },
  { path: '/admin/packages',     label: 'Paketi',      icon: Package },
  { path: '/admin/testimonials', label: 'Recenzije',   icon: Quote },
  { path: '/admin/submissions',  label: 'Upiti',       icon: Mail },
  { path: '/admin/settings',     label: 'Postavke',    icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-moody-950 border-r border-white/5">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/5">
        <Link to="/" target="_blank" className="flex flex-col group">
          <span className="text-2xl font-script text-white group-hover:text-gold-400 transition-colors">
            387 Cinematic
          </span>
          <span className="text-[9px] tracking-[0.5em] uppercase font-bold text-gold-600">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-gold-600/15 text-gold-400'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-gold-600" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gold-600/20 flex items-center justify-center">
            <span className="text-gold-400 text-xs font-bold uppercase">
              {admin?.username?.[0]}
            </span>
          </div>
          <span className="text-white/60 text-sm">{admin?.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>Odjava</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-moody-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-moody-950/50 border-b border-white/5 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/40 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-white/60 text-sm">
            {navItems.find(n => isActive(n))?.label || 'Admin'}
          </h1>
          <div className="ml-auto">
            <Link
              to="/"
              target="_blank"
              className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/20 hover:text-gold-400 transition-colors"
            >
              Pogledaj sajt →
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

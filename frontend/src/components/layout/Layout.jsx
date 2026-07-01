import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authStore } from '../../stores/authStore'
import { themeStore } from '../../stores/themeStore'
import NotificationBell from '../ui/NotificationBell'
import {
  Activity, Users, CreditCard, ShieldAlert,
  FileText, QrCode, ClipboardList, LogOut,
  Compass, CalendarRange, Sun, Moon, UserCircle, ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import logoTT from '../../assets/tt.png' 
import { ShieldCheck } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  // Auth store — individual primitive selectors (no infinite loop)
  const logout = authStore((state) => state.logout)
  const nom    = authStore((state) => state.user?.nom)
  const prenom = authStore((state) => state.user?.prenom)
  const email  = authStore((state) => state.user?.email)
  const role   = authStore((state) => state.user?.role)
  const photoUrl = authStore((state) => state.user?.photoUrl)

  // Theme store
  const theme       = themeStore((state) => state.theme)
  const toggleTheme = themeStore((state) => state.toggleTheme)

  // Apply dark class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Apply RTL direction for Arabic
  useEffect(() => {
    document.documentElement.setAttribute('dir', i18n.language === 'ar' ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', i18n.language)
    localStorage.setItem('tt-lang', i18n.language)
  }, [i18n.language])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang)
  }

  const isAdmin = role === 'ADMIN'
  const currentPath = location.pathname

  const employeeMenu = [
    { labelKey: 'catalogue',         path: '/activities',          Icon: Compass },
    { labelKey: 'my_registrations',  path: '/my-registrations',    Icon: CalendarRange },
    { labelKey: 'submit_ticket',     path: '/tickets/submit',      Icon: CreditCard },
    { labelKey: 'my_tickets',        path: '/tickets/my-tickets',  Icon: ClipboardList },
  ]

  const adminMenu = [
    { labelKey: 'dashboard',             path: '/admin/dashboard',       Icon: Activity,    group: 'Vue Générale' },
    { labelKey: 'manage_activities',     path: '/admin/activities',      Icon: CalendarRange, group: 'Gestion' },
    { labelKey: 'manage_registrations',  path: '/admin/registrations',   Icon: Users,       group: 'Gestion' },
    { labelKey: 'manage_tickets',        path: '/admin/tickets',         Icon: CreditCard,  group: 'Gestion' },
    { labelKey: 'activity_types',        path: '/admin/activity-types',  Icon: ClipboardList, group: 'Gestion' },
    { labelKey: 'qr_scanner',            path: '/admin/qr-scanner',      Icon: QrCode,      group: 'Outils' },
    { labelKey: 'reports',               path: '/admin/reports',         Icon: FileText,    group: 'Administration' },
    { labelKey: 'audit_log',             path: '/admin/audit',           Icon: ShieldAlert, group: 'Administration' },
     { labelKey: 'manage_roles', path: '/admin/roles', Icon: ShieldCheck, group: 'Administration' },{
  labelKey: 'manage_users',
  path: '/admin/users',
  Icon: Users,
  group: 'Administration'
},
  ]


  const fullName = `${prenom || ''} ${nom || ''}`.trim()
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || '?'

  const isActive = (path) =>
    currentPath === path || (path !== '/activities' && currentPath.startsWith(path + '/'))

  const NavLink = ({ item, accentColor = 'blue' }) => {
    const active = isActive(item.path)
    const Icon = item.Icon
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group
          ${active
            ? accentColor === 'emerald'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
        <span className="flex-1 truncate">{t(item.labelKey)}</span>
      </Link>
    )
  }

  // Group admin items
  const adminGroups = ['Vue Générale', 'Gestion', 'Outils', 'Administration']

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200">

      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col fixed top-0 bottom-0 left-0 z-30 shadow-sm transition-colors duration-200">

        {/* Brand Header */}
        <div className="h-16 border-b border-slate-100 dark:border-slate-700 flex items-center px-6 gap-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
          <div className="bg-white p-2 w-12 h-12 rounded-full flex items-center justify-center shadow-md">
                        <img src={logoTT} alt="Tunisie Telecom" className="w-8 h-8 object-contain" />
                      </div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-wide">Tunisie Telecom</p>
            <p className="text-[10px] text-blue-300 font-semibold tracking-wider uppercase">Social Portal</p>
          </div>
        </div>

        {/* User Profile */}
        <Link
          to="/profile"
          className={`p-4 border-b flex items-center gap-3 shrink-0 transition-all group
            ${isActive('/profile')
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900'
              : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        >
          <div className="relative shrink-0">
            <Avatar className={`w-10 h-10 rounded-xl transition-all ${isActive('/profile') ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800' : ''}`} size="lg">
              <AvatarImage src={photoUrl || undefined} alt={initials} className="rounded-xl" />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={fullName}>
              {fullName || email}
            </p>
            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mt-1
              ${isAdmin
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'}`}>
              {t(isAdmin ? 'role_admin' : 'role_employee')}
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 transition-all
            ${isActive('/profile') ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'}`} />
        </Link>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Admin Menu */}
          {isAdmin && adminGroups.map(group => {
            const items = adminMenu.filter(i => i.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => <NavLink key={item.path} item={item} />)}
                </div>
              </div>
            )
          })}

          {/* Admin: Employee section */}
          {isAdmin && (
            <div>
              <div className="border-t border-slate-100 dark:border-slate-700 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                {t('nav_employee')}
              </p>
              <div className="space-y-0.5">
                {employeeMenu.map((item) => <NavLink key={item.path} item={item} accentColor="emerald" />)}
              </div>
            </div>
          )}

          {/* Employee-only Menu */}
          {!isAdmin && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                {t('nav_menu')}
              </p>
              <div className="space-y-0.5">
                {employeeMenu.map((item) => <NavLink key={item.path} item={item} />)}
              </div>
            </div>
          )}
        </nav>

        {/* Profile + Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 shrink-0 space-y-2">
          <Link
            to="/profile"
            className={`w-full flex items-center gap-2.5 text-sm font-semibold py-2.5 px-4 rounded-xl border transition-all shadow-sm
              ${isActive('/profile')
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
          >
            <UserCircle className="w-4 h-4 shrink-0" />
            {t('profile_nav')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 text-sm font-semibold py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* ── Right Content Area ──────────────────────────────────────── */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm transition-colors duration-200">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Tunisie Telecom
            </p>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {t(isAdmin ? 'admin_space' : 'employee_space')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => switchLanguage('fr')}
                title="Français"
                className={`text-sm px-2 py-1 rounded-md font-semibold transition-all
                  ${i18n.language === 'fr'
                    ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >
                FR
              </button>
              <button
                onClick={() => switchLanguage('ar')}
                title="عربي"
                className={`text-sm px-2 py-1 rounded-md font-semibold transition-all
                  ${i18n.language === 'ar'
                    ? 'bg-white dark:bg-slate-600 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >
                AR
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />

            {/* Notification Bell */}
            <NotificationBell />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              {email}
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <Outlet />
        </main>
      </div>

    </div>
  )
}

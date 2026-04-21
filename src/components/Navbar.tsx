import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Home,
  Info,
  Languages,
  LayoutGrid,
  LogIn,
  MapPin,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Search,
  ShoppingBag,
  Star,
  Sun,
  Eye,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useSidebarLayout } from '../context/SidebarLayoutContext'
import { MobileDrawer } from './MobileDrawer'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-4 font-display text-base font-semibold uppercase tracking-[0.18em] transition-colors sm:py-3.5 sm:text-sm sm:tracking-[0.2em] ${
    isActive
      ? 'bg-burgundy-700 text-cream-50'
      : 'text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900'
  }`

export function Navbar() {
  const { t, lang, setLang, isAr } = useLanguage()
  const { theme, toggle } = useTheme()
  const { count } = useCart()
  const { isAdmin } = useAuth()
  const { desktopCollapsed, toggleDesktopSidebar } = useSidebarLayout()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-victorian-400/40 bg-cream-50 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md dark:border-victorian-700 dark:bg-victorian-950">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:max-w-none md:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
            <button
              type="button"
              className="inline-flex shrink-0 p-2.5 text-victorian-700 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
              onClick={() => setMobileOpen(true)}
              aria-label={t('navMenu')}
            >
              <Menu className="h-6 w-6" strokeWidth={2.25} />
            </button>

            <Link to="/" onClick={closeMobile} className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-center font-display text-xl font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50">
                {t('brand')}
              </span>
              {t('tagline') ? (
                <span className="truncate text-center font-body text-[11px] italic text-victorian-500">
                  {t('tagline')}
                </span>
              ) : null}
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden shrink-0 rounded-lg p-2.5 text-victorian-700 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900 md:inline-flex"
            title={desktopCollapsed ? t('sidebarExpand') : t('sidebarCollapse')}
            aria-label={desktopCollapsed ? t('sidebarExpand') : t('sidebarCollapse')}
            aria-expanded={!desktopCollapsed}
          >
            {desktopCollapsed ? (
              <PanelLeft className={`h-5 w-5 ${isAr ? 'scale-x-[-1]' : ''}`} strokeWidth={2.25} />
            ) : (
              <PanelLeftClose className={`h-5 w-5 ${isAr ? 'scale-x-[-1]' : ''}`} strokeWidth={2.25} />
            )}
          </button>

          <div className="hidden min-w-0 flex-1 md:block" aria-hidden />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 ms-auto md:ms-0">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hidden items-center gap-1 px-2 py-2 text-victorian-700 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900 md:inline-flex"
              title={t('lang')}
            >
              <Languages className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggle}
              className="hidden p-2 text-victorian-700 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900 md:inline-flex"
              title={theme === 'dark' ? t('light') : t('dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                `inline-flex p-2.5 text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900 ${
                  isActive ? 'text-burgundy-800 dark:text-victorian-300' : ''
                }`
              }
              aria-label={t('searchPageTitle')}
            >
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </NavLink>

            <Link
              to="/cart"
              className="relative inline-flex items-center gap-1.5 p-2.5 text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy-700 px-1 text-[10px] font-bold text-cream-50">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        title={t('navMenu')}
        closeLabel={t('closeMenu')}
      >
        <nav className="flex flex-col gap-1" onClick={closeMobile}>
          <p className="px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-victorian-400">
            {t('sidebarSectionMain')}
          </p>
          <NavLink to="/" className={linkClass} end>
            <Home className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('navHome')}
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            <LayoutGrid className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('navShop')}
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            <Search className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('searchPageTitle')}
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            <Info className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('navAbout')}
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            <ShoppingBag className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              {t('navCart')}
              {count > 0 ? (
                <span className="rounded-full bg-burgundy-700 px-2 py-0.5 text-xs text-cream-50">
                  {count}
                </span>
              ) : null}
            </span>
          </NavLink>
        </nav>

        <div className="mt-6 border-t border-victorian-200 pt-4 dark:border-victorian-800">
          <p className="mb-2 px-2 font-display text-xs font-semibold uppercase tracking-[0.25em] text-victorian-500">
            {t('settings')}
          </p>
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex w-full items-center gap-3 px-4 py-3 text-start font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
          >
            <Languages className="h-5 w-5 shrink-0" />
            {t('lang')}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="mt-1 flex w-full items-center gap-3 px-4 py-3 text-start font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
        </div>

        <div className="mt-4 border-t border-victorian-200 pt-4 dark:border-victorian-800" onClick={closeMobile}>
          <Link
            to="/track"
            className="flex w-full items-center gap-3 px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
          >
            <MapPin className="h-5 w-5 shrink-0" />
            {lang === 'ar' ? 'تتبع طلبي' : 'Track order'}
          </Link>
          <Link
            to={isAdmin ? '/admin' : '/login'}
            className="flex w-full items-center gap-3 px-4 py-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900"
          >
            {isAdmin ? <User className="h-5 w-5 shrink-0" /> : <LogIn className="h-5 w-5 shrink-0" />}
            {isAdmin ? (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard') : t('navLogin')}
          </Link>
          <div className="my-2 border-t border-victorian-200 dark:border-victorian-800" />
          <NavLink to="/reviews" className={linkClass}>
            <Star className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('navRatingsAndReviews')}
          </NavLink>
          <NavLink to="/visitors" className={linkClass}>
            <Eye className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
            {t('navVisitors')}
          </NavLink>
        </div>
      </MobileDrawer>
    </>
  )
}

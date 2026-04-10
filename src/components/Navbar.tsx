import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Languages, LogIn, MapPin, Menu, Moon, ShoppingBag, Sun, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { MobileDrawer } from './MobileDrawer'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
    isActive
      ? 'bg-classi-100 text-classi-800 dark:bg-classi-900/50 dark:text-classi-200'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
  }`

const linkClassDesktop = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-classi-100 text-classi-800 dark:bg-classi-900/50 dark:text-classi-200'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function Navbar() {
  const { t, lang, setLang } = useLanguage()
  const { theme, toggle } = useTheme()
  const { count } = useCart()
  const { isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:gap-4">
            <button
              type="button"
              className="inline-flex shrink-0 rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('navMenu')}
            >
              <Menu className="h-6 w-6" strokeWidth={2.25} />
            </button>

            <Link to="/" onClick={closeMobile} className="flex min-w-0 flex-1 flex-col leading-tight md:flex-none">
              <span className="truncate text-center text-xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-start">
                {t('brand')}
              </span>
              <span className="truncate text-center text-[11px] text-slate-400 md:text-start">
                {t('tagline')}
              </span>
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:gap-2 md:flex">
            <NavLink to="/" className={linkClassDesktop} end>{t('navHome')}</NavLink>
            <NavLink to="/products" className={linkClassDesktop}>{t('navShop')}</NavLink>
            <NavLink to="/about" className={linkClassDesktop}>{t('navAbout')}</NavLink>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hidden items-center gap-1 rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
              title={t('lang')}
            >
              <Languages className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggle}
              className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
              title={theme === 'dark' ? t('light') : t('dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <Link
              to="/cart"
              className="relative inline-flex items-center gap-1.5 rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
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
          <NavLink to="/" className={linkClass} end>{t('navHome')}</NavLink>
          <NavLink to="/products" className={linkClass}>{t('navShop')}</NavLink>
          <NavLink to="/about" className={linkClass}>{t('navAbout')}</NavLink>
          <NavLink to="/cart" className={linkClass}>
            {t('navCart')}
            {count > 0 && (
              <span className="ms-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-slate-900">
                {count}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('settings')}
          </p>
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Languages className="h-5 w-5 shrink-0" />
            {t('lang')}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800" onClick={closeMobile}>
          <Link
            to="/track"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <MapPin className="h-5 w-5 shrink-0" />
            {lang === 'ar' ? 'تتبع طلبي' : 'Track order'}
          </Link>
          <Link
            to={isAdmin ? '/admin' : '/login'}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isAdmin ? <User className="h-5 w-5 shrink-0" /> : <LogIn className="h-5 w-5 shrink-0" />}
            {isAdmin ? (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard') : t('navLogin')}
          </Link>
        </div>
      </MobileDrawer>
    </>
  )
}

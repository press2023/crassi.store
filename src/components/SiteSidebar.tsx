import { Link, NavLink } from 'react-router-dom'
import {
  Home,
  Info,
  LayoutGrid,
  PanelLeftClose,
  Search,
  ShoppingBag,
  Star,
  MapPin,
  Tag,
  Eye,
  LogIn,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useSidebarLayout } from '../context/SidebarLayoutContext'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
    isActive
      ? 'bg-burgundy-700 text-cream-50'
      : 'text-victorian-800 hover:bg-victorian-100 dark:text-cream-200 dark:hover:bg-victorian-900'
  }`

export function SiteSidebar() {
  const { t, lang, isAr } = useLanguage()
  const { count } = useCart()
  const { isAdmin } = useAuth()
  const { desktopCollapsed, collapseDesktopSidebar } = useSidebarLayout()

  if (desktopCollapsed) return null

  return (
    <aside className="sticky top-0 hidden h-screen w-[min(100%,16rem)] shrink-0 flex-col border-e-2 border-victorian-300/50 bg-cream-50/95 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-sm dark:border-victorian-800 dark:bg-victorian-950/95 sm:w-[17rem] md:flex">
      <div className="relative border-b border-victorian-200 px-3 py-4 dark:border-victorian-800">
        <Link
          to="/"
          className="block pe-10 text-center font-display text-sm font-bold uppercase tracking-[0.2em] text-victorian-900 dark:text-cream-50"
        >
          {t('brand')}
        </Link>
        <button
          type="button"
          onClick={collapseDesktopSidebar}
          className="absolute end-2 top-1/2 hidden -translate-y-1/2 rounded-lg p-2 text-victorian-600 hover:bg-victorian-100 dark:text-cream-300 dark:hover:bg-victorian-900 md:inline-flex"
          title={t('sidebarCollapse')}
          aria-label={t('sidebarCollapse')}
        >
          <PanelLeftClose className={`h-5 w-5 ${isAr ? 'scale-x-[-1]' : ''}`} strokeWidth={2} />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-3">
        <p className="px-2 pb-1 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-victorian-400">
          {t('sidebarSectionMain')}
        </p>
        <NavLink to="/" className={itemClass} end>
          <Home className="h-4 w-4 shrink-0" />
          {t('navHome')}
        </NavLink>
        <NavLink to="/products" className={itemClass}>
          <LayoutGrid className="h-4 w-4 shrink-0" />
          {t('navShop')}
        </NavLink>
        <NavLink to="/sale" className={itemClass}>
          <Tag className="h-4 w-4 shrink-0" />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            {isAr ? 'التخفيضات' : 'Sale'}
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {isAr ? 'حار' : 'HOT'}
            </span>
          </span>
        </NavLink>
        <NavLink to="/search" className={itemClass}>
          <Search className="h-4 w-4 shrink-0" />
          {t('searchPageTitle')}
        </NavLink>
        <NavLink to="/about" className={itemClass}>
          <Info className="h-4 w-4 shrink-0" />
          {t('navAbout')}
        </NavLink>
        <NavLink to="/cart" className={itemClass}>
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            {t('navCart')}
            {count > 0 ? (
              <span className="rounded-full bg-burgundy-700 px-1.5 py-0.5 text-[10px] text-cream-50">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </span>
        </NavLink>
        <NavLink to="/track" className={itemClass}>
          <MapPin className="h-4 w-4 shrink-0" />
          {lang === 'ar' ? 'تتبع طلبي' : 'Track order'}
        </NavLink>
        <NavLink to={isAdmin ? '/admin' : '/login'} className={itemClass}>
          {isAdmin ? <User className="h-4 w-4 shrink-0" /> : <LogIn className="h-4 w-4 shrink-0" />}
          {isAdmin ? (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard') : t('navLogin')}
        </NavLink>
        <div className="my-2 border-t border-victorian-200 dark:border-victorian-800" />
        <NavLink to="/reviews" className={itemClass}>
          <Star className="h-4 w-4 shrink-0" />
          {t('navRatingsAndReviews')}
        </NavLink>
        <NavLink to="/visitors" className={itemClass}>
          <Eye className="h-4 w-4 shrink-0" />
          {t('navVisitors')}
        </NavLink>
      </nav>
    </aside>
  )
}

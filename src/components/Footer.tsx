import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export function Footer() {
  const { isAr } = useLanguage()

  return (
    <footer className="border-t border-slate-100 py-8 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex gap-6 text-sm">
            <Link to="/products" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {isAr ? 'المتجر' : 'Shop'}
            </Link>
            <Link to="/track" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {isAr ? 'تتبع طلبي' : 'Track order'}
            </Link>
            <Link to="/about" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {isAr ? 'من نحن' : 'About'}
            </Link>
          </div>

          <div className="text-xs text-slate-400">
            <p>© {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
            <p className="mt-1">
              {isAr ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">{isAr ? 'حسين سعد' : 'Hussein Saad'}</span>
              {' '}{isAr ? 'ومدعوم من' : '· Powered by'}{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">Reno Codes</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

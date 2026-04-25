import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { SEO } from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export function Login() {
  const { t, isAr } = useLanguage()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch {
      setError(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <SEO
        title={isAr ? 'تسجيل دخول المشرف' : 'Admin Login'}
        lang={isAr ? 'ar' : 'en'}
        noindex
      />
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-classi-600 text-white">
            <Lock className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'تسجيل دخول المشرف' : 'Admin Login'}
          </h1>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isAr ? 'كلمة المرور' : 'Password'}
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-classi-600 py-3 font-bold text-white hover:bg-classi-700 disabled:opacity-50"
        >
          {loading ? '…' : isAr ? 'دخول' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

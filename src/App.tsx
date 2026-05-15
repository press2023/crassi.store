import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { PageLockGuard } from './components/PageLockGuard'
import { PageLockProvider } from './context/PageLockContext'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { AdminEditProduct } from './pages/AdminEditProduct'
import { AdminOrder } from './pages/AdminOrder'
import { AdminSalesProducts } from './pages/AdminSalesProducts'
import { Cart } from './pages/Cart'
import { CategoryPage } from './pages/CategoryPage'
import { Checkout } from './pages/Checkout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { ProductDetail } from './pages/ProductDetail'
import { Products } from './pages/Products'
import { Search } from './pages/Search'
import { TrackOrder } from './pages/TrackOrder'
import { Sale } from './pages/Sale'
import { VisitorsPage } from './pages/VisitorsPage'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { FAQ } from './pages/FAQ'
import { Coins } from './pages/Coins'

export default function App() {
  return (
    <PageLockProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<PageLockGuard><Products /></PageLockGuard>} />
          <Route path="sale" element={<PageLockGuard><Sale /></PageLockGuard>} />
          <Route path="search" element={<PageLockGuard><Search /></PageLockGuard>} />
          <Route path="category/:slug" element={<PageLockGuard><CategoryPage /></PageLockGuard>} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<PageLockGuard><Cart /></PageLockGuard>} />
          <Route path="checkout" element={<PageLockGuard><Checkout /></PageLockGuard>} />
          <Route path="about" element={<PageLockGuard><About /></PageLockGuard>} />
          <Route path="privacy" element={<PageLockGuard><Privacy /></PageLockGuard>} />
          <Route path="terms" element={<PageLockGuard><Terms /></PageLockGuard>} />
          <Route path="faq" element={<PageLockGuard><FAQ /></PageLockGuard>} />
          <Route path="visitors" element={<PageLockGuard><VisitorsPage /></PageLockGuard>} />
          <Route path="coins" element={<PageLockGuard><Coins /></PageLockGuard>} />
          <Route path="track" element={<PageLockGuard path="/track"><TrackOrder /></PageLockGuard>} />
          <Route path="order/:id" element={<PageLockGuard path="/track"><TrackOrder /></PageLockGuard>} />
          <Route path="login" element={<Login />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/sales/products" element={<AdminSalesProducts />} />
          <Route path="admin/orders/:id" element={<AdminOrder />} />
          <Route path="admin/product/new" element={<AdminEditProduct />} />
          <Route path="admin/product/:id" element={<AdminEditProduct />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PageLockProvider>
  )
}

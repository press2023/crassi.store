import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { AdminEditProduct } from './pages/AdminEditProduct'
import { AdminOrder } from './pages/AdminOrder'
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
import { ReviewsPage } from './pages/ReviewsPage'
import { Sale } from './pages/Sale'
import { VisitorsPage } from './pages/VisitorsPage'

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="sale" element={<Sale />} />
        <Route path="search" element={<Search />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="about" element={<About />} />
        <Route path="ratings" element={<Navigate to="/reviews" replace />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="order/:id" element={<TrackOrder />} />
        <Route path="login" element={<Login />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/orders/:id" element={<AdminOrder />} />
        <Route path="admin/product/new" element={<AdminEditProduct />} />
        <Route path="admin/product/:id" element={<AdminEditProduct />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  )
}

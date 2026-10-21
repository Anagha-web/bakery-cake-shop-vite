import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthProvider'
import { CategoriesPage } from './pages/CategoriesPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomRequestDetailPage } from './pages/CustomRequestDetailPage'
import { CustomRequestsPage } from './pages/CustomRequestsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductFormPage } from './pages/ProductFormPage'
import { ProductsPage } from './pages/ProductsPage'
import { RequireStaff } from './RequireStaff'
import { ToastProvider } from './ToastProvider'
import { buttonClass } from './ui-classes'

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-serif text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-cocoa-light">That admin page doesn't exist.</p>
      <Link to="/admin" className={`${buttonClass()} mt-6`}>
        Go to dashboard
      </Link>
    </div>
  )
}

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Admin | Sweet Crumbs Bakery'
    // Keep the admin out of search engines.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireStaff>
                  <AdminLayout />
                </RequireStaff>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="custom-requests" element={<CustomRequestsPage />} />
              <Route path="custom-requests/:id" element={<CustomRequestDetailPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/:id" element={<ProductFormPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:phoneKey" element={<CustomerDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

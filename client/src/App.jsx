import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/common/Toast';

// Pages
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RestaurantSetupPage from './pages/setup/RestaurantSetupPage';

// Dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import MenuItemsPage from './pages/dashboard/MenuItemsPage';
import CategoriesPage from './pages/dashboard/CategoriesPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import TablesPage from './pages/dashboard/TablesPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import BillingPage from './pages/dashboard/BillingPage';

// Public Customer Menu & Order Tracking
import PublicMenuPage from './pages/public/PublicMenuPage';
import OrderTrackingPage from './pages/public/OrderTrackingPage';
import MyOrdersPage from './pages/public/MyOrdersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                {/* Public Marketing & Auth */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/setup" element={<RestaurantSetupPage />} />

                {/* Customer Public Menu & Live Order Tracker */}
                <Route path="/menu/:slug" element={<PublicMenuPage />} />
                <Route path="/orders/:slug" element={<MyOrdersPage />} />
                <Route path="/order/:orderId" element={<OrderTrackingPage />} />

                {/* Protected Restaurant Owner Dashboard */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="menu" element={<MenuItemsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="tables" element={<TablesPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="billing" element={<BillingPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

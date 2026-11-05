import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api/axios';
import FoodLoading from '../../components/common/FoodLoading';

export default function DashboardLayout() {
  const { user, restaurant, loading } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path.includes('/menu')) return 'Menu Management';
    if (path.includes('/categories')) return 'Category Management';
    if (path.includes('/orders')) return 'Kitchen & Order Stream';
    if (path.includes('/tables')) return 'Tables & QR Codes';
    if (path.includes('/analytics')) return 'Performance & Analytics';
    if (path.includes('/settings')) return 'Restaurant Settings';
    if (path.includes('/profile')) return 'Account Profile';
    return 'Dashboard';
  };

  // Fetch pending orders count
  useEffect(() => {
    if (!restaurant) return;
    const fetchPendingOrders = async () => {
      try {
        const res = await api.get('/orders?status=pending');
        if (res.data.success) {
          setPendingCount(res.data.count);
        }
      } catch (err) {
        console.warn('Could not fetch pending orders count:', err);
      }
    };
    fetchPendingOrders();
  }, [restaurant]);

  // Listen for real-time incoming orders via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      setPendingCount((prev) => prev + 1);
      addToast(
        `🔔 New Order Received: ${order.orderNumber} for ${order.table?.tableNumber || 'Table'} ($${order.totalAmount})`,
        'success',
        6000
      );

      // Audio notification beep using Web Audio API (no external file needed)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (audioErr) {
        // audio context blocked until user gesture, safely ignore
      }
    };

    const handleStatusUpdated = () => {
      // Refresh count on status change
      api.get('/orders?status=pending')
        .then((res) => res.data.success && setPendingCount(res.data.count))
        .catch(() => {});
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdated);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdated);
    };
  }, [socket, addToast]);

  if (loading) {
    return (
      <FoodLoading message="Loading your restaurant workspace" />
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but hasn't created a restaurant yet, redirect to setup wizard
  if (!restaurant && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        pendingOrdersCount={pendingCount}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(true)}
          title={getPageTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

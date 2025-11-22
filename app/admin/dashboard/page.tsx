'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check Supabase authentication
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.push('/admin/login');
          return;
        }

        // Verify user is admin (check by email)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
        if (adminEmail && session.user.email !== adminEmail) {
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }

        // Authenticated - fetch orders
        setCheckingAuth(false);
        fetchOrders();
      } catch (err) {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!checkingAuth) {
      fetchOrders();
    }
  }, [selectedStatus, checkingAuth]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get session token for API request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/admin/orders?status=${selectedStatus}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.data);
      setTotal(data.total);
    } catch (err) {
      alert('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const statusColors: Record<OrderStatus, string> = {
    pending: '#f59e0b', // Amber
    payment_pending: '#ef4444', // Red
    payment_pending_verification: '#f97316', // Orange
    paid: '#3b82f6', // Blue
    design_file_pending: '#8b5cf6', // Purple
    design_file_received: '#a855f7', // Light purple
    in_production: '#6366f1', // Indigo
    order_shipped: '#06b6d4', // Cyan
    completed: '#10b981', // Green
    cancelled: '#6b7280', // Gray
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (checkingAuth || loading) {
    return (
      <div className="container section-padding">
        <div style={{ textAlign: 'center' }}>
          <div className="modern-spinner" style={{
            marginBottom: 'var(--space-4)',
            justifyContent: 'center'
          }}>
            <div className="modern-spinner-dot"></div>
            <div className="modern-spinner-dot"></div>
            <div className="modern-spinner-dot"></div>
          </div>
          <p style={{ color: 'var(--text-bright-secondary)' }}>
            {checkingAuth ? 'Checking authentication...' : 'Loading orders...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-8)'
        }}>
          <div>
            <h1 style={{ 
              fontSize: 'var(--text-4xl)', 
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-2)'
            }}>
              Order Management
            </h1>
            <p style={{ color: 'var(--text-bright-secondary)' }}>
              Total Orders: {total}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-bright-card)',
              color: 'var(--text-bright-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)'
            }}
          >
            Logout
          </button>
        </div>

        {/* Status Filter */}
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {['all', 'payment_pending', 'payment_pending_verification', 'paid', 'design_file_pending', 'design_file_received', 'in_production', 'order_shipped', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-xl)',
                  background: selectedStatus === status ? 'var(--color-black)' : 'var(--bg-bright-card)',
                  color: selectedStatus === status ? 'var(--color-white)' : 'var(--text-bright-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  textTransform: 'capitalize',
                  fontWeight: selectedStatus === status ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)'
                }}
              >
                {status === 'all' 
                  ? 'All' 
                  : status
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="card" style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <p style={{ color: 'var(--text-bright-secondary)' }}>No orders found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-gray-200)' }}>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Order #</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Customer</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Quantity</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Total</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Status</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Date</th>
                  <th style={{ 
                    padding: 'var(--space-3)', 
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr 
                    key={order.id}
                    style={{ 
                      borderBottom: '1px solid var(--color-gray-200)',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{ 
                        fontWeight: 'var(--font-weight-semibold)'
                      }}>
                        {order.order_number}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {order.customer_name}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--text-sm)', 
                          color: 'var(--text-bright-secondary)'
                        }}>
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {order.quantity} pcs
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {formatCurrency(order.total_price)}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        background: `${statusColors[order.status]}20`,
                        color: statusColors[order.status],
                        border: `1px solid ${statusColors[order.status]}40`,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap'
                      }}>
                        {order.status
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/orders/${order.id}`);
                        }}
                        className="btn-primary"
                        style={{ 
                          padding: 'var(--space-2) var(--space-4)',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


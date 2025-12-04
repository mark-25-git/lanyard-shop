'use client';

import { formatCurrency } from '@/lib/utils';

export default function FeatureTracking() {
  const order = {
    order_number: 'INV-2511255ZX50E',
    status: 'in_production',
    created_at: new Date().toISOString(),
    quantity: 150,
    unit_price: 2.90,
    total_price: 435.00, // 150 * 2.90
  };

  const statusSteps = [
    { status: 'in_production', label: 'In Production', description: 'Your lanyards are being manufactured.' },
  ];

  const currentStatus = statusSteps.find(s => s.status === order.status);

  return (
    <div className="track-preview-container" style={{ textAlign: 'left', width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <div className="preview-content-scaler">
        <h1 className="page-title" style={{ 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-8)',
          textAlign: 'left'
        }}>
          Track Your Order
        </h1>

        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-4)'
          }}>
            <h2 style={{ 
              fontSize: 'var(--text-xl)', // One tier down from 2xl for feature preview
              fontWeight: 'var(--font-weight-semibold)',
              margin: 0
            }}>
              Order Status
            </h2>
            <p style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--text-bright-secondary)',
              margin: 0
            }}>
              {order.order_number}
            </p>
          </div>
          {currentStatus && (
              <div style={{ 
              textAlign: 'center',
              background: 'var(--bg-bright-secondary)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)'
              }}>
              <h3 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-primary)',
                  marginBottom: 'var(--space-1)'
              }}>
                  {currentStatus.label}
              </h3>
              <p style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-bright-secondary)',
                  margin: 0
              }}>
                  {currentStatus.description}
              </p>
              </div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}>
            Order Details
          </h3>
          
          <div style={{ 
            marginBottom: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-gray-200)'
          }}>
            <p style={{ 
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-tertiary)',
              marginBottom: 'var(--space-2)'
            }}>
              Lanyard Specs
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-bright-secondary)'
            }}>
              <li style={{ marginBottom: 'var(--space-1)' }}>• 2cm width</li>
              <li style={{ marginBottom: 'var(--space-1)' }}>• 2-sided color printing</li>
              <li>• Single lobster hook</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>Order Number</p>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>{order.order_number}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>Order Date</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>
                      {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>Quantity</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>{order.quantity} pieces</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>Unit Price</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>{formatCurrency(order.unit_price)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-bright-secondary)', margin: 0 }}>Delivery</p>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-bright-primary)', margin: 0 }}>Free</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)', borderTop: '2px solid var(--color-gray-200)' }}>
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-bright-primary)', margin: 0 }}>Total</p>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-bright-primary)', margin: 0 }}>{formatCurrency(order.total_price)}</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}




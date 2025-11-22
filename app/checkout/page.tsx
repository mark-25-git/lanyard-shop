'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { BillingAddress, ShippingAddress } from '@/types/order';

const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu'
];

interface Review {
  id: number;
  rating: number;
  text: string;
  name: string;
  event: string;
}

const REVIEWS: Review[] = [
  {
    id: 1,
    rating: 5,
    text: "Big appreciation to our amazing merch supplier for bringing our ideas to life through high-quality TEDxUTAR Kampar 2025 merchandise",
    name: "TEDxUTAR Kampar 2025",
    event: "Universiti Tunku Abdul Rahman"
  },
  {
    id: 2,
    rating: 5,
    text: "Really impressed with the quality and affordability. Plus, outstanding customer care!",
    name: "Tong",
    event: "Universiti Tunku Abdul Rahman"
  },
  {
    id: 3,
    rating: 5,
    text: "Received the lanyards and they look very pretty! Will definitely promote Teevent on our coming event!",
    name: "AIESEC NILC 2025",
    event: "Universiti Kebangsaan Malaysia"
  },
  {
    id: 4,
    rating: 5,
    text: "The Teevent team is the best! Their response is super quick and they're always so helpful in answering all our questions and doubts. They even guided us through the design process! When we needed to order extra at the very last minute, they still came through with amazing after-sales service. Truly appreciate their professionalism and kindness!",
    name: "Suk Ting",
    event: "KL&P Family Doctor Club"
  }
];

export default function CheckoutPage() {
  const router = useRouter();
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billing, setBilling] = useState<BillingAddress>({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
  });
  const [shipping, setShipping] = useState<ShippingAddress>({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  } | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [eventOrOrganizationName, setEventOrOrganizationName] = useState('');

  // Randomly select a review on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * REVIEWS.length);
    setSelectedReview(REVIEWS[randomIndex]);
  }, []);

  useEffect(() => {
    // Get data from sessionStorage
    const storedQuantity = sessionStorage.getItem('orderQuantity');
    const storedUnitPrice = sessionStorage.getItem('orderUnitPrice');
    const storedTotalPrice = sessionStorage.getItem('orderTotalPrice');

    if (!storedQuantity || !storedUnitPrice || !storedTotalPrice) {
      router.push('/customize');
      return;
    }

    setOrderData({
      quantity: parseInt(storedQuantity, 10),
      unitPrice: parseFloat(storedUnitPrice),
      totalPrice: parseFloat(storedTotalPrice),
    });
  }, [router]);

  // Sync shipping with billing when checkbox is checked
  useEffect(() => {
    if (sameAsBilling) {
      setShipping({
        name: billing.name,
        phone: billing.phone,
        address_line1: billing.address_line1,
        address_line2: billing.address_line2,
        city: billing.city,
        state: billing.state,
        postal_code: billing.postal_code,
        country: billing.country,
      });
    }
  }, [sameAsBilling, billing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Billing validation
    if (!billing.name.trim()) {
      newErrors.billing_name = 'Billing name is required';
    }
    if (!billing.email.trim()) {
      newErrors.billing_email = 'Billing email is required';
    } else if (!isValidEmail(billing.email)) {
      newErrors.billing_email = 'Invalid billing email';
    }
    if (!billing.phone.trim()) {
      newErrors.billing_phone = 'Billing phone is required';
    } else if (!isValidPhone(billing.phone)) {
      newErrors.billing_phone = 'Invalid billing phone';
    }
    if (!billing.address_line1.trim()) {
      newErrors.billing_address_line1 = 'Address is required';
    }
    if (!billing.city.trim()) {
      newErrors.billing_city = 'City is required';
    }
    if (!billing.state.trim()) {
      newErrors.billing_state = 'State is required';
    }
    if (!billing.postal_code.trim()) {
      newErrors.billing_postal_code = 'Postal code is required';
    }

    // Shipping validation
    if (!shipping.name.trim()) {
      newErrors.shipping_name = 'Shipping name is required';
    }
    if (!shipping.phone.trim()) {
      newErrors.shipping_phone = 'Shipping phone is required';
    } else if (!isValidPhone(shipping.phone)) {
      newErrors.shipping_phone = 'Invalid shipping phone';
    }
    if (!shipping.address_line1.trim()) {
      newErrors.shipping_address_line1 = 'Shipping address is required';
    }
    if (!shipping.city.trim()) {
      newErrors.shipping_city = 'Shipping city is required';
    }
    if (!shipping.state.trim()) {
      newErrors.shipping_state = 'Shipping state is required';
    }
    if (!shipping.postal_code.trim()) {
      newErrors.shipping_postal_code = 'Shipping postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !orderData) {
      return;
    }

    setSubmitting(true);

    try {
      // Store only non-sensitive checkout data in sessionStorage
      // Price will be recalculated server-side on payment page for security
      const canvaLink = sessionStorage.getItem('canvaLink') || null;
      sessionStorage.setItem('checkoutData', JSON.stringify({
        quantity: orderData.quantity, // Only quantity - price recalculated server-side
        customer_name: billing.name,
        customer_email: billing.email,
        customer_phone: billing.phone,
        billing,
        shipping,
        design_file_url: canvaLink, // Canva link if provided
        event_or_organization_name: eventOrOrganizationName.trim() || null, // Event/org name if provided
      }));

      // Small delay to show loading spinner
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to payment page (order will be created after payment)
      router.push('/payment');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to proceed. Please try again.');
      setSubmitting(false);
    }
  };

  if (!orderData) {
    return null; // Will redirect
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: 'var(--text-4xl)', 
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)'
        }}>
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="responsive-grid">
            {/* Left Column: Forms */}
            <div>
              {/* Billing Address */}
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-6)'
                }}>
                  Billing Address
                </h2>

                {/* Event/Organization Name (Optional) */}
                <div className="floating-label-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
                  <input
                    type="text"
                    value={eventOrOrganizationName}
                    onChange={(e) => setEventOrOrganizationName(e.target.value)}
                    className={`floating-label-input ${eventOrOrganizationName ? 'has-value' : ''}`}
                    placeholder=" "
                  />
                  <label className="floating-label">
                    Event Title or Organization Name
                  </label>
                </div>

                <div className="floating-label-wrapper">
                  <input
                    type="text"
                    value={billing.name}
                    onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                    className={`floating-label-input ${billing.name ? 'has-value' : ''}`}
                    placeholder=" "
                    required
                  />
                  <label className="floating-label">
                    Full Name *
                  </label>
                  {errors.billing_name && (
                    <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      {errors.billing_name}
                    </p>
                  )}
                </div>

                <div className="floating-label-wrapper">
                  <input
                    type="email"
                    value={billing.email}
                    onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                    className={`floating-label-input ${billing.email ? 'has-value' : ''}`}
                    placeholder=" "
                    required
                  />
                  <label className="floating-label">
                    Email Address *
                  </label>
                  {errors.billing_email && (
                    <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      {errors.billing_email}
                    </p>
                  )}
                </div>

                <div className="floating-label-wrapper">
                  <input
                    type="tel"
                    value={billing.phone}
                    onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                    className={`floating-label-input ${billing.phone ? 'has-value' : ''}`}
                    placeholder=" "
                    required
                  />
                  <label className="floating-label">
                    Phone Number *
                  </label>
                  {errors.billing_phone && (
                    <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      {errors.billing_phone}
                    </p>
                  )}
                </div>

                <div className="floating-label-wrapper">
                  <input
                    type="text"
                    value={billing.address_line1}
                    onChange={(e) => setBilling({ ...billing, address_line1: e.target.value })}
                    className={`floating-label-input ${billing.address_line1 ? 'has-value' : ''}`}
                    placeholder=" "
                    required
                  />
                  <label className="floating-label">
                    Address Line 1 *
                  </label>
                  {errors.billing_address_line1 && (
                    <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      {errors.billing_address_line1}
                    </p>
                  )}
                </div>

                <div className="floating-label-wrapper">
                  <input
                    type="text"
                    value={billing.address_line2}
                    onChange={(e) => setBilling({ ...billing, address_line2: e.target.value })}
                    className={`floating-label-input ${billing.address_line2 ? 'has-value' : ''}`}
                    placeholder=" "
                  />
                  <label className="floating-label">
                    Address Line 2
                  </label>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: 'var(--space-4)', 
                  marginBottom: 'var(--space-4)' 
                }}>
                  <div className="floating-label-wrapper">
                    <input
                      type="text"
                      value={billing.city}
                      onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                      className={`floating-label-input ${billing.city ? 'has-value' : ''}`}
                      placeholder=" "
                      required
                    />
                    <label className="floating-label">
                      City *
                    </label>
                    {errors.billing_city && (
                      <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                        {errors.billing_city}
                      </p>
                    )}
                  </div>

                  <div className="floating-label-wrapper">
                    <select
                      value={billing.state}
                      onChange={(e) => setBilling({ ...billing, state: e.target.value })}
                      className={`floating-label-select ${billing.state ? 'has-value' : ''}`}
                      required
                    >
                      <option value=""></option>
                      {MALAYSIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <label className="floating-label">
                      State *
                    </label>
                    {errors.billing_state && (
                      <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                        {errors.billing_state}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="floating-label-wrapper">
                    <input
                      type="text"
                      value={billing.postal_code}
                      onChange={(e) => setBilling({ ...billing, postal_code: e.target.value })}
                      className={`floating-label-input ${billing.postal_code ? 'has-value' : ''}`}
                      placeholder=" "
                      required
                    />
                    <label className="floating-label">
                      Postal Code *
                    </label>
                    {errors.billing_postal_code && (
                      <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                        {errors.billing_postal_code}
                      </p>
                    )}
                  </div>

                  <div className="floating-label-wrapper">
                    <input
                      type="text"
                      value={billing.country}
                      readOnly
                      className={`floating-label-input ${billing.country ? 'has-value' : ''}`}
                      placeholder=" "
                      required
                    />
                    <label className="floating-label">
                      Country *
                    </label>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-6)'
                }}>
                  <h2 style={{ 
                    fontSize: 'var(--text-2xl)', 
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    Shipping Address
                  </h2>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)'
                  }}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Same as billing address
                  </label>
                </div>

                {!sameAsBilling && (
                  <>
                      <div className="floating-label-wrapper">
                        <input
                          type="text"
                          value={shipping.name}
                          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                          className={`floating-label-input ${shipping.name ? 'has-value' : ''}`}
                          placeholder=" "
                          required={!sameAsBilling}
                        />
                        <label className="floating-label">
                          Recipient Name *
                        </label>
                        {errors.shipping_name && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_name}
                          </p>
                        )}
                      </div>

                      <div className="floating-label-wrapper">
                        <input
                          type="tel"
                          value={shipping.phone}
                          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                          className={`floating-label-input ${shipping.phone ? 'has-value' : ''}`}
                          placeholder=" "
                          required={!sameAsBilling}
                        />
                        <label className="floating-label">
                          Phone Number *
                        </label>
                        {errors.shipping_phone && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_phone}
                          </p>
                        )}
                      </div>

                    <div className="floating-label-wrapper">
                      <input
                        type="text"
                        value={shipping.address_line1}
                        onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })}
                        className={`floating-label-input ${shipping.address_line1 ? 'has-value' : ''}`}
                        placeholder=" "
                        required={!sameAsBilling}
                      />
                      <label className="floating-label">
                        Address Line 1 *
                      </label>
                      {errors.shipping_address_line1 && (
                        <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                          {errors.shipping_address_line1}
                        </p>
                      )}
                    </div>

                    <div className="floating-label-wrapper">
                      <input
                        type="text"
                        value={shipping.address_line2}
                        onChange={(e) => setShipping({ ...shipping, address_line2: e.target.value })}
                        className={`floating-label-input ${shipping.address_line2 ? 'has-value' : ''}`}
                        placeholder=" "
                      />
                      <label className="floating-label">
                        Address Line 2
                      </label>
                    </div>

                    <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: 'var(--space-4)', 
                  marginBottom: 'var(--space-4)' 
                }}>
                      <div className="floating-label-wrapper">
                        <input
                          type="text"
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          className={`floating-label-input ${shipping.city ? 'has-value' : ''}`}
                          placeholder=" "
                          required={!sameAsBilling}
                        />
                        <label className="floating-label">
                          City *
                        </label>
                        {errors.shipping_city && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_city}
                          </p>
                        )}
                      </div>

                      <div className="floating-label-wrapper">
                        <select
                          value={shipping.state}
                          onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                          className={`floating-label-select ${shipping.state ? 'has-value' : ''}`}
                          required={!sameAsBilling}
                        >
                          <option value=""></option>
                          {MALAYSIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        <label className="floating-label">
                          State *
                        </label>
                        {errors.shipping_state && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_state}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                      <div className="floating-label-wrapper">
                        <input
                          type="text"
                          value={shipping.postal_code}
                          onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })}
                          className={`floating-label-input ${shipping.postal_code ? 'has-value' : ''}`}
                          placeholder=" "
                          required={!sameAsBilling}
                        />
                        <label className="floating-label">
                          Postal Code *
                        </label>
                        {errors.shipping_postal_code && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_postal_code}
                          </p>
                        )}
                      </div>

                      <div className="floating-label-wrapper">
                        <input
                          type="text"
                          value={shipping.country}
                          readOnly
                          className={`floating-label-input ${shipping.country ? 'has-value' : ''}`}
                          placeholder=" "
                          required={!sameAsBilling}
                        />
                        <label className="floating-label">
                          Country *
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {sameAsBilling && (
                  <div style={{ 
                    padding: 'var(--space-4)',
                    background: 'var(--bg-bright-secondary)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'var(--text-bright-secondary)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    Shipping address will be the same as billing address.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Review Card & Order Summary */}
            <div>
              {/* Random Review Card */}
              {selectedReview && (
                <div style={{ 
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'center'
                }}>
                  {/* Review Text */}
                  <blockquote style={{
                    fontSize: 'var(--text-sm)',
                    lineHeight: '1.6',
                    color: 'var(--text-bright-primary)',
                    margin: '0 0 var(--space-3) 0',
                    fontStyle: 'normal'
                  }}>
                    &ldquo;{selectedReview.text}&rdquo;
                  </blockquote>
                  
                  {/* Star Rating */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    gap: 'var(--space-1)',
                    marginBottom: 'var(--space-3)'
                  }}>
                    {[...Array(selectedReview.rating)].map((_, i) => (
                      <i 
                        key={i}
                        className="bi bi-star-fill" 
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-primary)'
                        }}
                      ></i>
                    ))}
                  </div>
                  
                  {/* Author Info */}
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-bright-secondary)'
                  }}>
                    <p style={{ 
                      margin: 0,
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {selectedReview.name}
                    </p>
                    <p style={{ 
                      margin: 'var(--space-1) 0 0 0',
                      color: 'var(--text-bright-tertiary)'
                    }}>
                      {selectedReview.event}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ 
                padding: 'var(--space-6)', 
                position: 'sticky', 
                top: 'var(--space-8)',
                background: '#f1f3f5',
                borderRadius: 'var(--radius-xl)'
              }}>
                <h2 style={{ 
                  fontSize: 'var(--text-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)'
                }}>
                  Order Summary
                </h2>
                
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <span style={{ color: 'var(--text-bright-secondary)' }}>Quantity</span>
                    <span>{orderData.quantity} pieces</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <span style={{ color: 'var(--text-bright-secondary)' }}>Unit Price</span>
                    <span>{formatCurrency(orderData.unitPrice)}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <span style={{ color: 'var(--text-bright-secondary)' }}>Delivery</span>
                    <span>Free</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)',
                    marginTop: 'var(--space-2)',
                    paddingTop: 'var(--space-2)',
                    borderTop: '1px solid var(--color-gray-200)'
                  }}>
                    <span style={{ color: 'var(--text-bright-secondary)' }}>Estimated delivery</span>
                    <span style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-bright-primary)'
                    }}>
                      {(() => {
                        const deliveryDate = new Date();
                        deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from today
                        return deliveryDate.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        });
                      })()}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--color-gray-200)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-bold)'
                  }}>
                    <span>Total Price</span>
                    <span style={{ color: 'var(--text-bright-primary)' }}>
                      {formatCurrency(orderData.totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    marginTop: 'var(--space-6)',
                    padding: 'var(--space-4)', 
                    fontSize: 'var(--text-lg)',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  {submitting ? (
                    <div className="modern-spinner">
                      <div className="modern-spinner-dot"></div>
                      <div className="modern-spinner-dot"></div>
                      <div className="modern-spinner-dot"></div>
                    </div>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Help Text */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 'var(--space-10)',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--color-gray-200)'
        }}>
          <p style={{ 
            fontSize: 'var(--text-base)',
            color: 'var(--text-bright-secondary)',
            margin: 0
          }}>
            Need more help?{' '}
            <a
              href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%20need%20help%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'underline'
              }}
            >
              Contact us
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

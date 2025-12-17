"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { BillingAddress, ShippingAddress } from "@/types/order";
import HelpSection from "@/components/HelpSection";
import CustomCheckbox from "@/components/CustomCheckbox";
import { trackEvent } from "@/lib/ga";
import { useTranslation } from "react-i18next";

const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Penang",
  "Perak",
  "Perlis",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
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
  const { t } = useTranslation();
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billing, setBilling] = useState<BillingAddress>({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Malaysia",
  });
  const [shipping, setShipping] = useState<ShippingAddress>({
    name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Malaysia",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  } | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [eventOrOrganizationName, setEventOrOrganizationName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeState, setPromoCodeState] = useState<
    "idle" | "valid" | "invalid" | "loading"
  >("idle");
  const [promoError, setPromoError] = useState("");
  const [showPromoCodeInput, setShowPromoCodeInput] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    discount_amount: number;
    final_total: number;
    code: string;
  } | null>(null);

  // Randomly select a review on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * REVIEWS.length);
    setSelectedReview(REVIEWS[randomIndex]);
  }, []);

  useEffect(() => {
    // Get data from sessionStorage
    const storedQuantity = sessionStorage.getItem("orderQuantity");
    const storedUnitPrice = sessionStorage.getItem("orderUnitPrice");
    const storedTotalPrice = sessionStorage.getItem("orderTotalPrice");

    if (!storedQuantity || !storedUnitPrice || !storedTotalPrice) {
      router.push("/customize");
      return;
    }

    setOrderData({
      quantity: parseInt(storedQuantity, 10),
      unitPrice: parseFloat(storedUnitPrice),
      totalPrice: parseFloat(storedTotalPrice),
    });

    // Load promo code from sessionStorage if exists
    const storedPromoCode = sessionStorage.getItem("promoCode");
    const storedDiscountInfo = sessionStorage.getItem("discountInfo");
    if (storedPromoCode && storedDiscountInfo) {
      try {
        setPromoCode(storedPromoCode);
        setDiscountInfo(JSON.parse(storedDiscountInfo));
        setPromoCodeState("valid");
        setShowPromoCodeInput(false); // Don't show input if code is already applied
      } catch (e) {
        // Ignore parse errors
      }
    }
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
      newErrors.billing_name = t("checkout.errors.billingNameRequired");
    }
    if (!billing.email.trim()) {
      newErrors.billing_email = t("checkout.errors.billingEmailRequired");
    } else if (!isValidEmail(billing.email)) {
      newErrors.billing_email = t("checkout.errors.billingEmailInvalid");
    }
    if (!billing.phone.trim()) {
      newErrors.billing_phone = t("checkout.errors.billingPhoneRequired");
    } else if (!isValidPhone(billing.phone)) {
      newErrors.billing_phone = t("checkout.errors.billingPhoneInvalid");
    }
    if (!billing.address_line1.trim()) {
      newErrors.billing_address_line1 = t("checkout.errors.billingAddressRequired");
    }
    if (!billing.city.trim()) {
      newErrors.billing_city = t("checkout.errors.billingCityRequired");
    }
    if (!billing.state.trim()) {
      newErrors.billing_state = t("checkout.errors.billingStateRequired");
    }
    if (!billing.postal_code.trim()) {
      newErrors.billing_postal_code = t("checkout.errors.billingPostalRequired");
    }

    // Shipping validation
    if (!shipping.name.trim()) {
      newErrors.shipping_name = t("checkout.errors.shippingNameRequired");
    }
    if (!shipping.phone.trim()) {
      newErrors.shipping_phone = t("checkout.errors.shippingPhoneRequired");
    } else if (!isValidPhone(shipping.phone)) {
      newErrors.shipping_phone = t("checkout.errors.shippingPhoneInvalid");
    }
    if (!shipping.address_line1.trim()) {
      newErrors.shipping_address_line1 = t("checkout.errors.shippingAddressRequired");
    }
    if (!shipping.city.trim()) {
      newErrors.shipping_city = t("checkout.errors.shippingCityRequired");
    }
    if (!shipping.state.trim()) {
      newErrors.shipping_state = t("checkout.errors.shippingStateRequired");
    }
    if (!shipping.postal_code.trim()) {
      newErrors.shipping_postal_code = t("checkout.errors.shippingPostalRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTranslatedPromoError = (errorMessage: string): string => {
    // Map API error messages to translation keys
    const errorMap: Record<string, string> = {
      "Invalid or inactive promo code.": t("checkout.promo.invalidOrInactive"),
      "This promo code is not available for your account.": t("checkout.promo.notAvailableForAccount"),
      "Promo code is required.": t("checkout.promo.codeRequired"),
      "Invalid promo code format.": t("checkout.promo.invalidFormat"),
    };
    
    return errorMap[errorMessage] || errorMessage || t("checkout.promo.invalidCode");
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !orderData) {
      return;
    }

    setPromoCodeState("loading");
    setPromoError("");

    try {
      const response = await fetch("/api/validate-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          total_price: orderData.totalPrice,
          customer_email: billing.email ? billing.email.trim().toLowerCase() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPromoCodeState("invalid");
        setPromoError(getTranslatedPromoError(data.error || ""));
        setDiscountInfo(null);
        sessionStorage.removeItem("promoCode");
        sessionStorage.removeItem("discountInfo");
        return;
      }

      // Valid promo code
      setPromoCodeState("valid");
      setPromoError("");
      setDiscountInfo(data.data);
      sessionStorage.setItem("promoCode", data.data.code);
      sessionStorage.setItem("discountInfo", JSON.stringify(data.data));
    } catch (err) {
      setPromoCodeState("invalid");
      setPromoError(t("checkout.promo.validateFailed"));
      setDiscountInfo(null);
      sessionStorage.removeItem("promoCode");
      sessionStorage.removeItem("discountInfo");
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setPromoCodeState("idle");
    setPromoError("");
    setDiscountInfo(null);
    setShowPromoCodeInput(false);
    sessionStorage.removeItem("promoCode");
    sessionStorage.removeItem("discountInfo");
  };

  const handleCancelPromoCode = () => {
    setShowPromoCodeInput(false);
    if (promoCodeState !== "valid") {
      setPromoCode("");
      setPromoError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !orderData) {
      return;
    }

    setSubmitting(true);
    trackEvent("checkout_continue_to_payment_click", {
      location: "checkout_page",
      quantity: orderData.quantity,
      has_promo: !!discountInfo,
    });

    try {
      // Store only non-sensitive checkout data in sessionStorage
      // Price will be recalculated server-side on payment page for security
      const canvaLink = sessionStorage.getItem("canvaLink") || null;
      sessionStorage.setItem("checkoutData", JSON.stringify({
        quantity: orderData.quantity, // Only quantity - price recalculated server-side
        customer_name: billing.name,
        customer_email: billing.email,
        customer_phone: billing.phone,
        billing,
        shipping,
        design_file_url: canvaLink, // Canva link if provided
        event_or_organization_name: eventOrOrganizationName.trim() || null, // Event/org name if provided
        promo_code: discountInfo?.code || null, // Include promo code if valid
      }));

      // Small delay to show loading spinner
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to payment page (order will be created after payment)
      router.push("/payment");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : t("checkout.errors.proceedFailed")
      );
      setSubmitting(false);
    }
  };

  if (!orderData) {
    return null; // Will redirect
  }

  return (
    <div className="container section-padding">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 className="page-title" style={{ 
          fontWeight: "var(--font-weight-bold)",
          marginBottom: "var(--space-6)",
        }}>
          {t("checkout.title")}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="responsive-grid">
            {/* Left Column: Forms */}
            <div>
              {/* Billing Address */}
              <div className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                <h2 style={{ 
                  fontSize: "var(--text-2xl)", 
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--space-6)",
                }}>
                  {t("checkout.billing.title")}
                </h2>

                {/* Event/Organization Name (Optional) */}
                <div className="floating-label-wrapper" style={{ marginBottom: "var(--space-4)" }}>
                  <input
                    type="text"
                    value={eventOrOrganizationName}
                    onChange={(e) => setEventOrOrganizationName(e.target.value)}
                    className={`floating-label-input ${eventOrOrganizationName ? 'has-value' : ''}`}
                    placeholder=" "
                  />
                  <label className="floating-label">
                    {t("checkout.billing.eventOrOrg")}
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
                    {t("checkout.billing.fullName")}
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
                    {t("checkout.billing.email")}
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
                    {t("checkout.billing.phone")}
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
                    {t("checkout.billing.address1")}
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
                    {t("checkout.billing.address2")}
                  </label>
                </div>

                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "var(--space-4)", 
                  marginBottom: "var(--space-4)", 
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
                      {t("checkout.billing.city")}
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
                      {t("checkout.billing.state")}
                    </label>
                    {errors.billing_state && (
                      <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                        {errors.billing_state}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
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
                      {t("checkout.billing.postalCode")}
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
                      {t("checkout.billing.country")}
                    </label>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-6)",
                }}>
                  <h2 style={{ 
                    fontSize: "var(--text-2xl)", 
                    fontWeight: "var(--font-weight-semibold)",
                  }}>
                    {t("checkout.shipping.title")}
                  </h2>
                  <CustomCheckbox
                    id="same-as-billing"
                    checked={sameAsBilling}
                    onChange={setSameAsBilling}
                    label={t("checkout.shipping.sameAsBilling")}
                  />
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
                          {t("checkout.shipping.recipientName")}
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
                          {t("checkout.shipping.phone")}
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
                        {t("checkout.shipping.address1")}
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
                        {t("checkout.shipping.address2")}
                      </label>
                    </div>

                    <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "var(--space-4)", 
                  marginBottom: "var(--space-4)", 
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
                          {t("checkout.shipping.city")}
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
                          {t("checkout.shipping.state")}
                        </label>
                        {errors.shipping_state && (
                          <p style={{ color: '#dc2626', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                            {errors.shipping_state}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
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
                          {t("checkout.shipping.postalCode")}
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
                          {t("checkout.shipping.country")}
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {sameAsBilling && (
                  <div style={{ 
                    padding: "var(--space-4)",
                    background: "var(--bg-bright-secondary)",
                    borderRadius: "var(--radius-xl)",
                    color: "var(--text-bright-secondary)",
                    fontSize: "var(--text-sm)",
                  }}>
                    {t("checkout.shipping.sameAsBillingInfo")}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Review Card & Order Summary */}
            <div>
              {/* Random Review Card */}
              {selectedReview && (
                <div style={{ 
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-4)",
                  textAlign: "center",
                }}>
                  {/* Review Text */}
                  <blockquote style={{
                    fontSize: "var(--text-base)",
                    lineHeight: "1.6",
                    color: "var(--text-bright-primary)",
                    margin: "0 0 var(--space-3) 0",
                    fontStyle: "normal",
                  }}>
                    &ldquo;{selectedReview.text}&rdquo;
                  </blockquote>
                  
                  {/* Star Rating */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "center",
                    gap: "var(--space-1)",
                    marginBottom: "var(--space-3)",
                  }}>
                    {[...Array(selectedReview.rating)].map((_, i) => (
                      <i 
                        key={i}
                        className="bi bi-star-fill" 
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--color-primary)",
                        }}
                      ></i>
                    ))}
                  </div>
                  
                  {/* Author Info */}
                  <div style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-bright-secondary)",
                  }}>
                    <p style={{ 
                      margin: 0,
                      fontWeight: "var(--font-weight-medium)",
                    }}>
                      {selectedReview.name}
                    </p>
                    <p style={{ 
                      margin: "var(--space-1) 0 0 0",
                      color: "var(--text-bright-tertiary)",
                    }}>
                      {selectedReview.event}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ 
                padding: "var(--space-6)", 
                position: "sticky", 
                top: "var(--space-8)",
                background: "#f1f3f5",
                borderRadius: "var(--radius-xl)",
              }}>
                <h2 style={{ 
                  fontSize: "var(--text-2xl)", 
                  fontWeight: "var(--font-weight-semibold)",
                  marginBottom: "var(--space-4)",
                }}>
                  {t("checkout.summary.title")}
                </h2>
                
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "var(--space-2)",
                  }}>
                    <span style={{ color: "var(--text-bright-secondary)" }}>{t("pricingPreview.labelQuantity")}</span>
                    <span>
                      {orderData.quantity} {t("pricingPreview.pieces")}
                    </span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "var(--space-2)",
                  }}>
                    <span style={{ color: "var(--text-bright-secondary)" }}>{t("pricingPreview.labelUnitPrice")}</span>
                    <span>{formatCurrency(orderData.unitPrice)}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "var(--space-2)",
                  }}>
                    <span style={{ color: "var(--text-bright-secondary)" }}>{t("pricingPreview.labelDelivery")}</span>
                    <span>{t("pricingPreview.valueFree")}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "var(--space-2)",
                    marginTop: "var(--space-2)",
                    paddingTop: "var(--space-2)",
                    borderTop: "1px solid var(--color-gray-200)",
                  }}>
                    <span style={{ color: "var(--text-bright-secondary)" }}>
                      {t("checkout.summary.estimatedDeliveryLabel")}
                    </span>
                    <span style={{ 
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--text-bright-primary)",
                    }}>
                      {(() => {
                        const deliveryDate = new Date();
                        deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from today
                        return deliveryDate.toLocaleDateString("en-US", { 
                          month: "long", 
                          day: "numeric", 
                          year: "numeric", 
                        });
                      })()}
                    </span>
                  </div>
                  {/* Promo Code Section */}
                  <div style={{ 
                    marginTop: "var(--space-4)",
                    paddingTop: "var(--space-4)",
                    borderTop: "1px solid var(--color-gray-200)",
                  }}>
                    <div style={{ 
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                      marginBottom: showPromoCodeInput ? "var(--space-3)" : 0,
                    }}>
                      <span style={{ color: "var(--text-bright-secondary)" }}>
                        {t("checkout.promo.sectionLabel")}
                      </span>
                      {!showPromoCodeInput && (
                        <button
                          type="button"
                          onClick={() => setShowPromoCodeInput(true)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-primary)",
                            fontSize: "var(--text-base)",
                            cursor: "pointer",
                            textDecoration: "underline",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-1)",
                            padding: 0,
                            alignSelf: "flex-start",
                          }}
                        >
                          {t("checkout.promo.openButton")}
                          <i className="bi bi-chevron-down" style={{ fontSize: "var(--text-sm)" }}></i>
                        </button>
                      )}
                    </div>
                    {showPromoCodeInput && (
                      <div style={{ marginTop: "var(--space-3)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                          <div className="floating-label-wrapper" style={{ flex: 1, position: "relative", marginBottom: 0 }}>
                            <input
                              type="text"
                              value={
                                promoCodeState === "valid" && discountInfo 
                                ? `${discountInfo.code} (-${formatCurrency(discountInfo.discount_amount)})`
                                : promoCode
                              }
                              onChange={(e) => {
                                if (promoCodeState !== "valid") {
                                  setPromoCode(e.target.value.toUpperCase());
                                  if (promoCodeState === "invalid") {
                                    setPromoCodeState("idle");
                                    setPromoError("");
                                  }
                                }
                              }}
                              className={`floating-label-input ${
                                promoCode || (promoCodeState === "valid" && discountInfo)
                                  ? "has-value"
                                  : ""
                              }`}
                              placeholder=" "
                              readOnly={promoCodeState === "valid"}
                              style={{
                                paddingRight:
                                  promoCodeState === "valid" ? "var(--space-4)" : "70px",
                                color:
                                  promoCodeState === "valid"
                                    ? "var(--color-primary)"
                                    : undefined,
                                borderColor:
                                  promoCodeState === "valid"
                                    ? "var(--color-primary)"
                                    : undefined,
                              }}
                              onKeyPress={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  promoCode.trim() &&
                                  promoCodeState !== "valid"
                                ) {
                                  e.preventDefault();
                                  handleApplyPromoCode();
                                }
                              }}
                            />
                            <label className="floating-label">
                              {t("checkout.promo.inputLabel")}
                            </label>
                            {promoCodeState !== "valid" && (
                              <button
                                type="button"
                                onClick={handleApplyPromoCode}
                                disabled={
                                  promoCodeState === "loading" || !promoCode.trim()
                                }
                                style={{
                                  position: "absolute",
                                  right: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "transparent",
                                  border: "none",
                                  color:
                                    promoCodeState === "loading" || !promoCode.trim()
                                      ? "var(--text-bright-tertiary)"
                                      : "var(--color-primary)",
                                  fontSize: "var(--text-base)",
                                  cursor:
                                    promoCodeState === "loading" || !promoCode.trim()
                                      ? "not-allowed"
                                      : "pointer",
                                  padding: "var(--space-2)",
                                  textDecoration:
                                    promoCodeState === "loading" ? "none" : "underline",
                                  zIndex: 1,
                                }}
                              >
                                {promoCodeState === "loading"
                                  ? "..."
                                  : t("checkout.promo.applyButton")}
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={
                              promoCodeState === "valid"
                                ? handleRemovePromoCode
                                : handleCancelPromoCode
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--color-primary)",
                              fontSize: "var(--text-base)",
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                              whiteSpace: "nowrap",
                              alignSelf: "center",
                            }}
                          >
                            {promoCodeState === "valid"
                              ? t("checkout.promo.removeButton")
                              : t("checkout.promo.cancelButton")}
                          </button>
                        </div>
                        {promoError && (
                          <p style={{ 
                            color: "#dc2626", 
                            fontSize: "var(--text-sm)", 
                            marginTop: "var(--space-2)", 
                          }}>
                            {promoError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Subtotal (Price before discount) */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginTop: "var(--space-4)",
                    paddingTop: "var(--space-4)",
                    borderTop: "1px solid var(--color-gray-200)",
                  }}>
                    <span style={{ color: "var(--text-bright-secondary)" }}>
                      {t("checkout.summary.subtotal")}
                    </span>
                    <span style={{ color: "var(--text-bright-primary)" }}>
                      {formatCurrency(orderData.totalPrice)}
                    </span>
                  </div>
                  {/* Discount (if promo code applied) */}
                  {discountInfo && discountInfo.discount_amount > 0 && (
                    <div style={{ 
                      marginTop: "var(--space-3)",
                    }}>
                      <p style={{ 
                        fontSize: "var(--text-sm)", 
                        color: "var(--text-bright-secondary)", 
                        margin: 0, 
                        marginBottom: "var(--space-2)", 
                      }}>
                        {t("checkout.summary.promoApplied")}
                      </p>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <span style={{ 
                          fontSize: "var(--text-base)", 
                          color: "var(--text-bright-primary)", 
                        }}>
                          {discountInfo.code}
                        </span>
                        <span style={{ 
                          fontSize: "var(--text-base)", 
                          color: "var(--text-bright-primary)", 
                        }}>
                          -{formatCurrency(discountInfo.discount_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Final Total */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginTop: "var(--space-4)",
                    paddingTop: "var(--space-4)",
                    borderTop: "1px solid var(--color-gray-200)",
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-bold)",
                  }}>
                    <span>{t("pricingPreview.labelTotal")}</span>
                    <span style={{ color: "var(--text-bright-primary)" }}>
                      {formatCurrency(discountInfo?.final_total ?? orderData.totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ 
                    width: "100%", 
                    marginTop: "var(--space-6)",
                    padding: "var(--space-4)", 
                    fontSize: "var(--text-lg)",
                    borderRadius: "var(--radius-xl)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  {submitting ? (
                    <div className="modern-spinner">
                      <div className="modern-spinner-dot"></div>
                      <div className="modern-spinner-dot"></div>
                      <div className="modern-spinner-dot"></div>
                    </div>
                  ) : (
                    t("checkout.summary.continueButton")
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <HelpSection />
      </div>
    </div>
  );
}

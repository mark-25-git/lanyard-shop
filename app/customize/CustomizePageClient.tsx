"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import QuantitySelector from "@/components/QuantitySelector";
import PriceDisplay from "@/components/PriceDisplay";
import TemplateDownload from "@/components/TemplateDownload";
import LanyardCarousel from "@/components/LanyardCarousel";
import HelpSection from "@/components/HelpSection";
import FloatingCustomerService from "@/components/FloatingCustomerService";
import TalkToExpert from "@/components/TalkToExpert";
import CustomCheckbox from "@/components/CustomCheckbox";
import QuotationModal from "@/components/QuotationModal";
import { trackEvent } from "@/lib/ga";
import { useTranslation } from "react-i18next";

interface SocialProofStats {
  text: string;
}

interface CustomizePageClientProps {
  initialStats: {
    unique_events: number;
    lanyards_delivered: number;
    complaints: number;
  };
}

export default function CustomizePageClient({ initialStats }: CustomizePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  
  // Initialize quantity from URL param if available, otherwise default to 100
  const initialQuantity = searchParams.get('quantity');
  const [quantity, setQuantity] = useState(
    initialQuantity ? parseInt(initialQuantity, 10) : 100
  );
  
  const [priceData, setPriceData] = useState<{
    unitPrice: number;
    totalPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvaLink, setCanvaLink] = useState("");
  const [freeDesignReview, setFreeDesignReview] = useState(true);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationSentEmail, setQuotationSentEmail] = useState<string | null>(null);

  // Stats data kept for future use on product landing page
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Use initial stats from server (no fetch needed)
  // Kept for future use on product landing page
  const socialProofStats: SocialProofStats[] = [
    {
      text: `Trusted by ${formatNumber(initialStats.unique_events)} Events`
    },
    {
      text: `${formatNumber(initialStats.lanyards_delivered)} Lanyards Delivered`
    },
    {
      text: `${formatNumber(initialStats.complaints)} Complaints`
    }
  ];

  useEffect(() => {
    calculatePrice();
  }, [quantity]);

  const calculatePrice = async () => {
    if (quantity < 50) {
      setPriceData(null);
      setError(null);
      return;
    }

    if (quantity >= 600) {
      setPriceData(null);
      setError(null); // No error, just show contact message in PriceDisplay
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate price");
      }

      setPriceData({
        unitPrice: data.data.unit_price,
        totalPrice: data.data.total_price,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate price");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (priceData && quantity >= 50) {
      trackEvent("customize_checkout_click", {
        location: "customize_page",
        quantity,
        has_canva_link: !!canvaLink.trim(),
      });
      // Store quantity and price in sessionStorage for checkout
      sessionStorage.setItem("orderQuantity", quantity.toString());
      sessionStorage.setItem("orderUnitPrice", priceData.unitPrice.toString());
      sessionStorage.setItem("orderTotalPrice", priceData.totalPrice.toString());
      // Store Canva link if provided
      if (canvaLink.trim()) {
        sessionStorage.setItem("canvaLink", canvaLink.trim());
      }
      router.push("/checkout");
    }
  };

  return (
    <>
      <div className="container section-padding">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 className="page-title" style={{ 
            fontWeight: "var(--font-weight-bold)",
            marginBottom: "var(--space-8)"
          }}>
            {t("customize.title")}
          </h1>


          <div style={{ marginBottom: "var(--space-8)" }}>
            {/* Your lanyard will have */}
            <div style={{ marginBottom: "5rem" }}>
              <h2 style={{ 
                fontSize: "var(--text-2xl)", 
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-4)"
              }}>
                {t("pricingPreview.sectionTitle")}
              </h2>
              <div className="card" style={{ padding: "var(--space-6)" }}>
                <div style={{
                  display: "flex",
                  gap: "var(--space-6)",
                  alignItems: "stretch"
                }}>
                  <ul style={{ 
                    listStyle: "none", 
                    padding: 0,
                    color: "var(--text-bright-secondary)",
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start"
                  }}>
                    <li style={{ marginBottom: "var(--space-2)" }}>{t("pricingPreview.spec2cm")}</li>
                    <li style={{ marginBottom: "var(--space-2)" }}>{t("pricingPreview.spec2sided")}</li>
                    <li style={{ marginBottom: "var(--space-2)" }}>{t("pricingPreview.specHook")}</li>
                  </ul>
                  <div style={{
                    flex: "1",
                    position: "relative",
                    display: "flex",
                    alignItems: "stretch",
                    justifyContent: "flex-end"
                  }}>
                    <LanyardCarousel />
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: "5rem" }}>
              <h2 style={{ 
                fontSize: "var(--text-2xl)", 
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-4)"
              }}>
                {t("pricingPreview.quantityTitle")}{" "}
                <span style={{ color: "var(--text-bright-tertiary)" }}>
                  {t("pricingPreview.quantitySubtitle")}
                </span>
              </h2>
              <div className="card" style={{ padding: "var(--space-6)" }}>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={50}
                  max={undefined}
                />
                {quantity > 0 && quantity < 50 && (
                  <div style={{
                    marginTop: "var(--space-4)",
                    padding: "var(--space-4)",
                    background: "var(--bg-bright-secondary)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-bright-primary)"
                  }}>
                    <p style={{ marginBottom: "var(--space-2)" }}>
                      {t("customize.lowQuantity.priceLine")}{" "}
                      <button
                        type="button"
                        onClick={() => setQuantity(50)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-primary)",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: 0,
                          font: "inherit"
                        }}
                      >
                        {t("customize.lowQuantity.order50Button")}
                      </button>
                    </p>
                    <p style={{ marginTop: "var(--space-2)" }}>
                      {t("customize.lowQuantity.contactText")}{" "}
                      <a
                        href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%27d%20like%20to%20order%20less%20than%2050%20lanyards."
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--color-primary)",
                          textDecoration: "underline"
                        }}
                      >
                        {t("customize.lowQuantity.contactLink")}
                      </a>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Design Template */}
            <div style={{ marginBottom: "5rem" }}>
              <h2 style={{ 
                fontSize: "var(--text-2xl)", 
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-4)"
              }}>
                {t("canvaPreview.title")}{" "}
                <span style={{ color: "var(--text-bright-tertiary)" }}>
                  {t("canvaPreview.subtitle")}
                </span>
              </h2>
              <TemplateDownload />
              <p style={{
                marginTop: "var(--space-4)",
                fontSize: "var(--text-sm)",
                color: "var(--text-bright-secondary)",
                lineHeight: "1.6"
              }}>
                {t("customize.templateInfo.line1")}
              </p>
              <p style={{
                marginTop: "var(--space-2)",
                fontSize: "var(--text-sm)",
                color: "var(--text-bright-secondary)",
                lineHeight: "1.6"
              }}>
                {t("customize.templateInfo.line2")}
              </p>
            </div>

            {/* Canva Link Input */}
            <div style={{ marginBottom: "5rem" }}>
              <h2 style={{ 
                fontSize: "var(--text-2xl)", 
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-4)"
              }}>
                {t("customize.canva.designedWith")}{" "}
                <span style={{
                  background: "linear-gradient(135deg, #01c3cc 0%, #7c2be8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: "var(--font-weight-semibold)"
                }}>
                  Canva
                </span>
                ?{" "}
                <span style={{ color: "var(--text-bright-tertiary)" }}>
                  {t("customize.canva.shareOptional")}
                </span>
              </h2>
              <div className="card" style={{ padding: "var(--space-6)" }}>
                <div className="floating-label-wrapper">
                  <input
                    type="url"
                    value={canvaLink}
                    onChange={(e) => setCanvaLink(e.target.value)}
                    className={`floating-label-input ${canvaLink ? 'has-value' : ''}`}
                    placeholder=" "
                  />
                  <label className="floating-label">
                    {t("customize.canva.inputLabel")}
                  </label>
                </div>
                <p style={{
                  marginTop: "var(--space-3)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-bright-tertiary)"
                }}>
                  {t("customize.canva.helper")}
                </p>
              </div>
              <div style={{
                marginTop: "var(--space-4)"
              }}>
                <CustomCheckbox
                  checked={freeDesignReview}
                  onChange={() => setFreeDesignReview(true)}
                  label={t("customize.canva.reviewCheckbox")}
                  id="free-design-review"
                  labelStyle={{ fontSize: "var(--text-base)" }}
                />
              </div>
            </div>

            {/* Other Design File Instruction */}
            <div style={{ marginBottom: "5rem" }}>
              <h2 style={{ 
                fontSize: "var(--text-2xl)", 
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-4)"
              }}>
                {t("customize.otherToolsHeading")}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width price section - breaks out of container */}
      <div style={{ 
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        marginBottom: 0,
        background: "#f1f3f5"
      }}>
        <div style={{ 
          maxWidth: "800px", 
          margin: "0 auto",
          paddingLeft: "var(--space-4)",
          paddingRight: "var(--space-4)"
        }}>
          <PriceDisplay
            quantity={quantity}
            unitPrice={priceData?.unitPrice || 0}
            totalPrice={priceData?.totalPrice || 0}
            isLoading={loading}
          />

          {/* Estimated Delivery Date */}
          {priceData && quantity >= 50 && (
            <div style={{
              marginTop: "var(--space-6)",
              padding: "var(--space-4)",
              textAlign: "center"
            }}>
              <i className="bi bi-calendar" style={{
                fontSize: "var(--text-2xl)",
                color: "var(--text-bright-primary)",
                marginBottom: "var(--space-2)",
                display: "block"
              }}></i>
              <p style={{
                fontSize: "var(--text-base)",
                lineHeight: "1.6",
                color: "var(--text-bright-secondary)",
                margin: "0"
              }}>
                {t("customize.delivery.estimatedLabel")}{" "}
                <span style={{
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--text-bright-primary)"
                }}>
                  {(() => {
                    const deliveryDate = new Date();
                    deliveryDate.setDate(deliveryDate.getDate() + 14); // 2 weeks from today
                    return deliveryDate.toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    });
                  })()}
                </span>
              </p>
              <p style={{
                fontSize: "var(--text-sm)",
                lineHeight: "1.5",
                color: "var(--text-bright-tertiary)",
                margin: "var(--space-2) 0 0 0"
              }}>
                {t("customize.delivery.note")}
              </p>
            </div>
          )}


          {/* Checkout Button - Moved inside price section */}
          {error && (
            <div style={{
              marginTop: "var(--space-6)",
              marginBottom: "var(--space-4)",
              padding: "var(--space-3)",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "var(--radius-xl)",
              fontSize: "var(--text-sm)",
            }}>
              {error}
            </div>
          )}

          {priceData && quantity >= 50 && quantity < 600 && (
            <div style={{ 
              marginTop: "var(--space-6)",
              paddingBottom: "var(--space-6)"
            }}>
              {/* Primary placement: Talk to Expert and Checkout buttons side by side */}
              <div style={{
                display: "flex",
                gap: "var(--space-4)",
                flexDirection: "row"
              }} className="talk-to-expert-checkout-buttons">
                <div style={{ flex: 1 }}>
                  <TalkToExpert
                    quantity={quantity}
                    unitPrice={priceData.unitPrice}
                    totalPrice={priceData.totalPrice}
                    variant="primary"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <button
                    onClick={handleCheckout}
                    className="btn-primary"
                    style={{ 
                      width: "100%", 
                      padding: "var(--space-4)",
                      fontSize: "var(--text-lg)",
                      borderRadius: "var(--radius-xl)"
                    }}
                  >
                    {t("customize.checkoutButton")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {quantity >= 600 && (
            <div style={{ 
              marginTop: "var(--space-6)",
              paddingBottom: "var(--space-6)"
            }}>
              <button
                disabled
                className="btn-primary"
                style={{ 
                  width: "100%", 
                  padding: "var(--space-4)",
                  fontSize: "var(--text-lg)",
                  opacity: 0.5,
                  cursor: "not-allowed",
                  borderRadius: "var(--radius-xl)"
                }}
              >
                {t("customize.checkoutButton")}
              </button>
              <p style={{
                marginTop: "var(--space-3)",
                textAlign: "center",
                fontSize: "var(--text-sm)",
                color: "var(--text-bright-tertiary)"
              }}>
                {t("customize.largeOrderNote")}
              </p>
            </div>
          )}
          {quantity > 0 && quantity < 50 && (
            <div style={{ 
              marginTop: "var(--space-6)",
              paddingBottom: "var(--space-6)"
            }}>
              <button
                disabled
                className="btn-primary"
                style={{ 
                  width: "100%", 
                  padding: "var(--space-4)",
                  fontSize: "var(--text-lg)",
                  opacity: 0.5,
                  cursor: "not-allowed",
                  borderRadius: "var(--radius-xl)"
                }}
              >
                {t("customize.checkoutButton")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quotation CTA Section */}
      {priceData && quantity >= 50 && quantity < 600 && (
        <div className="container section-padding">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{
              textAlign: "center",
              padding: "var(--space-8) 0"
            }}>
              <p style={{
                fontSize: "var(--text-lg)",
                color: "var(--text-bright-secondary)",
                marginBottom: "var(--space-4)"
              }}>
                Need a formal quotation for approval?
              </p>
              <button
                onClick={() => setShowQuotationModal(true)}
                className="btn-secondary"
                style={{
                  padding: "var(--space-3) var(--space-6)",
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--font-weight-semibold)",
                  borderRadius: "var(--radius-full)",
                  border: "2px solid var(--color-primary)",
                  color: "var(--color-primary)",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all var(--transition-base)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-primary)";
                  e.currentTarget.style.color = "var(--color-white)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
              >
                Email me the PDF
              </button>
              {quotationSentEmail && (
                <p
                  style={{
                    marginTop: "var(--space-4)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-bright-secondary)",
                  }}
                >
                  We’ve emailed your quotation to{" "}
                  <span
                    style={{
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--text-bright-primary)",
                    }}
                  >
                    {quotationSentEmail}
                  </span>
                  . Please check your inbox (and spam/junk folder).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue with rest of content */}
      <div className="container section-padding">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <HelpSection />
        </div>
      </div>

      {priceData && (
        <QuotationModal 
          isOpen={showQuotationModal} 
          onClose={() => setShowQuotationModal(false)} 
          quantity={quantity}
          unitPrice={priceData.unitPrice}
          totalPrice={priceData.totalPrice}
          onSent={(email) => setQuotationSentEmail(email)}
        />
      )}
      <FloatingCustomerService />
    </>
  );
}



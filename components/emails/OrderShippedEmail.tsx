import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
  Img,
} from '@react-email/components';
import { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';

interface OrderShippedEmailProps {
  order: Order;
  trackingUrl: string;
  courier?: string | null;
}

export function OrderShippedEmail({
  order,
  trackingUrl,
  courier,
}: OrderShippedEmailProps) {
  // Use production URL for logo (emails should always use production URLs)
  // Use teevent.my domain to match Resend sending domain
  // This ensures logo works even when testing from localhost
  const logoUrl = 'https://teevent.my/images/teevent-logo.png';

  // Format order date
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate expected delivery dates (today + 1 day and today + 2 days)
  const today = new Date();
  const deliveryDate1 = new Date(today);
  deliveryDate1.setDate(today.getDate() + 1);
  const deliveryDate2 = new Date(today);
  deliveryDate2.setDate(today.getDate() + 2);

  const expectedDeliveryRange = `${deliveryDate1.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} - ${deliveryDate2.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  // Extract order number without INV- prefix for tracking number
  const trackingNumberFromOrder = order.order_number.replace(/^INV-/i, '');

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={logoUrl}
              alt="Teevent"
              width="120"
              height="auto"
              style={logoImage}
            />
          </Section>

          {/* Greeting */}
          <Text style={text}>
            Hi {order.customer_name},
          </Text>
          <Text style={text}>
            Your order #{order.order_number} is on its way to you. They are expected to be delivered on {expectedDeliveryRange}.
          </Text>

          {/* Order Details - Matching payment confirmed email layout for consistency */}
          <Section style={summarySection}>
            <Text style={sectionTitle}>Order Details</Text>
            
            {/* Lanyard Specs Subsection */}
            <Section style={specsSubSection}>
              <Text style={specsLabel}>Lanyard Specs</Text>
              <Text style={specsText}>
                • 2cm width<br />
                • 2-sided color printing<br />
                • Single lobster hook
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Order Information - Matching payment confirmed email style */}
            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Order Number</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValueBold}>{order.order_number}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Order Date</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValue}>{orderDate}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Quantity</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValue}>{order.quantity} pieces</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Unit Price</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValue}>{formatCurrency(order.unit_price)}</Text>
              </Column>
            </Row>

            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Delivery</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValue}>Free</Text>
              </Column>
            </Row>

            {/* Promo Code Section */}
            {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
              <>
                <Hr style={divider} />
                <Row style={detailRow}>
                  <Column>
                    <Text style={detailLabel}>Subtotal</Text>
                  </Column>
                  <Column style={detailValueColumn}>
                    <Text style={detailValueMedium}>{formatCurrency(order.unit_price * order.quantity)}</Text>
                  </Column>
                </Row>
                <Row style={promoCodeRow}>
                  <Column>
                    <Text style={promoCodeLabel}>Promo Code Applied</Text>
                  </Column>
                </Row>
                <Row style={detailRow}>
                  <Column>
                    <Text style={detailValue}>{order.promo_code}</Text>
                  </Column>
                  <Column style={detailValueColumn}>
                    <Text style={detailValue}>-{formatCurrency(order.discount_amount)}</Text>
                  </Column>
                </Row>
              </>
            )}

            {/* Total */}
            <Hr style={totalDivider} />
            <Row style={detailRow}>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={totalValue}>{formatCurrency(order.total_price)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Shipping Information */}
          <Section style={shippingInfoSection}>
            <Text style={sectionTitle}>Shipping Information</Text>
            <Row style={detailRow}>
              <Column>
                <Text style={detailLabel}>Tracking Number</Text>
              </Column>
              <Column style={detailValueColumn}>
                <Text style={detailValueBold}>{trackingNumberFromOrder}</Text>
              </Column>
            </Row>
            {courier && (
              <Row style={detailRow}>
                <Column>
                  <Text style={detailLabel}>Courier</Text>
                </Column>
                <Column style={detailValueColumn}>
                  <Text style={detailValue}>{courier}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {/* Shipping Address - Separate section */}
          {order.shipping_address_line1 && (
            <Section style={addressSection}>
              <Text style={sectionTitle}>Shipping Address</Text>
              <Text style={addressText}>
                {order.shipping_name && (
                  <>
                    <strong>{order.shipping_name}</strong>
                    <br />
                  </>
                )}
                {order.shipping_phone && (
                  <>
                    {order.shipping_phone}
                    <br />
                  </>
                )}
                {order.shipping_address_line1}
                {order.shipping_address_line2 && <>, {order.shipping_address_line2}</>}
                {order.shipping_city && <>, {order.shipping_city}</>}
                {order.shipping_state && <>, {order.shipping_state}</>}
                {order.shipping_postal_code && <> {order.shipping_postal_code}</>}
                {order.shipping_country && <>, {order.shipping_country}</>}
              </Text>
            </Section>
          )}

          {/* Action Buttons */}
          <Section style={buttonSection}>
            <Button href={trackingUrl} style={primaryButton}>
              Track Your Order
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              Need more help?{' '}
              <a href="https://wa.me/60137482481?text=Hi%20Teevent!%20I%20need%20help%20with%20my%20order." style={link}>
                Contact us
              </a>
              .
            </Text>
            <Text style={footerText}>
              Visit us at{' '}
              <a href="https://teevent.my" style={link}>
                teevent.my
              </a>
            </Text>
            <Text style={footerSmall}>
              This is an automated email. Please do not reply to this address.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Email styles (matching PaymentConfirmedEmail for consistency)
const main = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  backgroundColor: '#f6f6f6',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px',
};

const header = {
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const logoImage = {
  margin: '0 auto',
  display: 'block',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 16px 0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const summarySection = {
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#000000',
  marginBottom: '16px',
  marginTop: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const specsSubSection = {
  marginBottom: '16px',
  paddingBottom: '16px',
};

const specsLabel = {
  fontSize: '14px',
  color: '#6c757d',
  marginBottom: '8px',
  marginTop: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const specsText = {
  fontSize: '14px',
  lineHeight: '1.8',
  color: '#495057',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
  borderWidth: '1px',
  borderStyle: 'solid',
};

const totalDivider = {
  borderColor: '#e5e7eb',
  margin: '8px 0',
  borderWidth: '2px',
  borderStyle: 'solid',
};

const detailRow = {
  marginBottom: '12px',
};

const detailLabel = {
  fontSize: '14px',
  color: '#495057',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const detailValueColumn = {
  textAlign: 'right' as const,
};

const detailValue = {
  fontSize: '14px',
  color: '#000000',
  fontWeight: '400',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const detailValueBold = {
  fontSize: '14px',
  color: '#000000',
  fontWeight: '600',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const detailValueMedium = {
  fontSize: '14px',
  color: '#000000',
  fontWeight: '500',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const promoCodeRow = {
  marginTop: '12px',
  marginBottom: '8px',
};

const promoCodeLabel = {
  fontSize: '14px',
  color: '#495057',
  margin: '0',
  marginBottom: '8px',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#000000',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const totalValue = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#000000',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const shippingInfoSection = {
  marginBottom: '32px',
};

const addressSection = {
  marginBottom: '32px',
};

const addressText = {
  fontSize: '14px',
  lineHeight: '1.8',
  color: '#000000',
  margin: '0',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const nextStepsSection = {
  marginBottom: '32px',
};

const buttonSection = {
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#007AFF',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '9999px',
  textDecoration: 'none',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  border: 'none',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  color: '#007AFF',
  padding: '12px 24px',
  borderRadius: '9999px',
  textDecoration: 'none',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  margin: '8px',
  border: '2px solid #007AFF',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const footer = {
  marginTop: '32px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0',
  lineHeight: '1.6',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const footerSmall = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '16px 0 0 0',
  lineHeight: '1.6',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const link = {
  color: '#007AFF',
  textDecoration: 'underline',
};


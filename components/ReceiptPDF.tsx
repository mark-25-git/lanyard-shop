import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { Order } from '@/types/order';

// Define styles matching the Invoice template
// React-PDF supports built-in fonts: Helvetica, Times-Roman, Courier
// Using Helvetica as it's closest to system sans-serif fonts
// Reduced sizes for more compact layout
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.4,
    color: '#000',
    backgroundColor: '#fff',
    padding: 30,
  },
  container: {
    maxWidth: 800,
  },
  // Header Section
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    textAlign: 'right',
  },
  receiptHeader: {
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  receiptDetails: {
    textAlign: 'left',
  },
  receiptDetailText: {
    fontSize: 10,
    color: '#000',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  receiptDetailStrong: {
    fontWeight: 600,
  },
  companyLogo: {
    maxWidth: 100,
    height: 'auto',
  },
  // Company and Recipient Section
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  companyInfoSection: {
    width: '40%',
  },
  recipientInfoSection: {
    flex: 1,
    paddingLeft: 15,
    textAlign: 'left',
  },
  companyInfo: {
    textAlign: 'left',
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  companyText: {
    fontSize: 10,
    color: '#000',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  recipientInfo: {
    textAlign: 'left',
  },
  recipientTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  recipientText: {
    fontSize: 10,
    color: '#000',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  // Items Table
  itemsSection: {
    marginBottom: 20,
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 600,
    color: '#000',
    paddingHorizontal: 6,
  },
  tableHeaderCellFirst: {
    paddingLeft: 0,
  },
  tableHeaderCellLast: {
    paddingRight: 0,
    textAlign: 'right',
  },
  tableHeaderCellCenter: {
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 10,
    paddingBottom: 10,
  },
  tableCell: {
    fontSize: 10,
    color: '#000',
    paddingHorizontal: 6,
  },
  tableCellFirst: {
    paddingLeft: 0,
  },
  tableCellLast: {
    paddingRight: 0,
    textAlign: 'right',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellDescription: {
    flex: 2,
  },
  tableCellQty: {
    width: 50,
  },
  tableCellPrice: {
    width: 80,
  },
  tableCellTotal: {
    width: 80,
  },
  itemDescription: {
    fontSize: 10,
    color: '#000',
    marginBottom: 3,
  },
  itemSpecs: {
    fontSize: 9,
    color: '#000',
  },
  // Summary Section
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 25,
  },
  summaryTable: {
    width: 250,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#000',
    textAlign: 'left',
    paddingRight: 15,
  },
  summaryValue: {
    fontSize: 10,
    color: '#000',
    fontWeight: 500,
    textAlign: 'right',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#1f2937',
    paddingTop: 8,
    marginTop: 6,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    paddingRight: 15,
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
  },
});

interface ReceiptPDFProps {
  order: Order;
  logoDataUri: string;
}

// Format date for receipt
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ order, logoDataUri }) => {
  // Invoice number is the same as order number (keep as is)
  const invoiceNumber = order.order_number;
  // Use payment_confirmed_at for Date Paid
  const datePaid = order.payment_confirmed_at ? formatDate(order.payment_confirmed_at) : '';
  
  // Format prices with 2 decimal places
  const unitPrice = parseFloat(order.unit_price.toFixed(2));
  const subtotal = parseFloat((order.unit_price * order.quantity).toFixed(2)); // Original price before discount
  const totalPrice = parseFloat(order.total_price.toFixed(2)); // Final price after discount
  const discountAmount = order.discount_amount || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header Section: Receipt Title/Date (Left) + Logo (Right) */}
          <View style={styles.headerSection}>
            <View style={styles.leftSection}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>Receipt</Text>
              </View>
              <View style={styles.receiptDetails}>
                <Text style={styles.receiptDetailText}>
                  <Text style={styles.receiptDetailStrong}>Invoice number:</Text> {invoiceNumber}
                </Text>
                {datePaid && (
                  <Text style={styles.receiptDetailText}>
                    <Text style={styles.receiptDetailStrong}>Date Paid:</Text> {datePaid}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.rightSection}>
              {logoDataUri && (
                <Image src={logoDataUri} style={styles.companyLogo} />
              )}
            </View>
          </View>

          {/* Company Info and Recipient Section */}
          <View style={styles.infoSection}>
            {/* Left: Company Info (40% width) */}
            <View style={styles.companyInfoSection}>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>Teevent Enterprise</Text>
                <Text style={styles.companyText}>Registration No. 202503285823 (SA0644498-D)</Text>
                <Text style={styles.companyText}>No. 12, Taman Perdana</Text>
                <Text style={styles.companyText}>Jalan Bakri, 84000 Muar</Text>
                <Text style={styles.companyText}>Johor</Text>
                <Text style={styles.companyText}>team.teevent@gmail.com</Text>
                <Text style={styles.companyText}>+60 13-748 2481</Text>
              </View>
            </View>

            {/* Right: Recipient Info */}
            <View style={styles.recipientInfoSection}>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientTitle}>Bill to</Text>
                {order.event_or_organization_name && (
                  <Text style={styles.recipientText}>{order.event_or_organization_name}</Text>
                )}
                <Text style={styles.recipientText}>{order.customer_name || ''}</Text>
                <Text style={styles.recipientText}>{order.billing_address_line1 || ''}</Text>
                {order.billing_address_line2 && (
                  <Text style={styles.recipientText}>{order.billing_address_line2}</Text>
                )}
                <Text style={styles.recipientText}>
                  {[order.billing_city, order.billing_state, order.billing_postal_code]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
                {order.billing_country && (
                  <Text style={styles.recipientText}>{order.billing_country}</Text>
                )}
                {order.customer_phone && (
                  <Text style={styles.recipientText}>{order.customer_phone}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.itemsSection}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellFirst, styles.tableCellDescription]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellCenter, styles.tableCellQty]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLast, styles.tableCellPrice]}>
                Unit price
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLast, styles.tableCellTotal]}>
                Total price
              </Text>
            </View>

            {/* Table Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellDescription]}>
                <Text style={styles.itemDescription}>Custom Lanyard</Text>
                <Text style={styles.itemSpecs}>2cm width, 2-sided color printing, Single lobster hook</Text>
              </View>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellQty]}>
                {order.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellPrice]}>
                RM {unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellTotal]}>
                RM {subtotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>RM {subtotal.toFixed(2)}</Text>
              </View>
              {order.promo_code && discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Promo Code Applied ({order.promo_code})</Text>
                  <Text style={styles.summaryValue}>-RM {discountAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.finalTotalRow}>
                <Text style={styles.finalTotalLabel}>Total</Text>
                <Text style={styles.finalTotalValue}>RM {totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF;


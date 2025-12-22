import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

// Quotation data interface
interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  contactName: string;
  email: string;
  companyName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Define styles matching the Invoice template
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
  quotationHeader: {
    marginBottom: 12,
  },
  quotationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  quotationDetails: {
    textAlign: 'left',
  },
  quotationDetailText: {
    fontSize: 10,
    color: '#000',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  quotationDetailStrong: {
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
    marginBottom: 15,
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
  // Banking Section
  bankingSection: {
    marginTop: 15,
    paddingTop: 0,
    marginBottom: 12,
  },
  bankingTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#000',
    marginBottom: 8,
  },
  bankingText: {
    fontSize: 9,
    color: '#000',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  // Terms Section
  termsSection: {
    marginTop: 12,
    paddingTop: 0,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#000',
    marginBottom: 8,
  },
  termsList: {
    marginLeft: 0,
    paddingLeft: 0,
  },
  termsItem: {
    fontSize: 9,
    color: '#000',
    lineHeight: 1.3,
    marginBottom: 3,
  },
});

interface QuotationPDFProps {
  quotation: QuotationData;
  logoDataUri: string;
  bankAccount: string;
}

// Format date for quotation
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation, logoDataUri, bankAccount }) => {
  const quotationNumber = quotation.quotationNumber;
  const quotationDate = formatDate(quotation.quotationDate);
  
  // Calculate Valid Until date (Quotation Date + 30 days)
  const validUntilDate = (() => {
    const date = typeof quotation.quotationDate === 'string' ? new Date(quotation.quotationDate) : quotation.quotationDate;
    const validUntil = new Date(date);
    validUntil.setDate(validUntil.getDate() + 30);
    return formatDate(validUntil);
  })();
  
  // Format prices with 2 decimal places
  const unitPrice = parseFloat(quotation.unitPrice.toFixed(2));
  const subtotal = parseFloat((quotation.unitPrice * quotation.quantity).toFixed(2));
  const totalPrice = parseFloat(quotation.totalPrice.toFixed(2));
  
  // Dynamic payment terms based on quantity
  const paymentTermText = quotation.quantity < 600
    ? "100% Full Payment is required to commence production."
    : "Volume Order Arrangement: Payment terms to be finalized upon order confirmation. Please contact us to discuss.";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header Section: Quotation Title/Date (Left) + Logo (Right) */}
          <View style={styles.headerSection}>
            <View style={styles.leftSection}>
              <View style={styles.quotationHeader}>
                <Text style={styles.quotationTitle}>Quotation</Text>
              </View>
              <View style={styles.quotationDetails}>
                <Text style={styles.quotationDetailText}>
                  <Text style={styles.quotationDetailStrong}>Quotation number:</Text> {quotationNumber}
                </Text>
                <Text style={styles.quotationDetailText}>
                  <Text style={styles.quotationDetailStrong}>Quotation Date:</Text> {quotationDate}
                </Text>
                <Text style={styles.quotationDetailText}>
                  <Text style={styles.quotationDetailStrong}>Valid Until:</Text> {validUntilDate}
                </Text>
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
                <Text style={styles.recipientTitle}>Quotation for</Text>
                {quotation.companyName && (
                  <Text style={styles.recipientText}>{quotation.companyName}</Text>
                )}
                <Text style={styles.recipientText}>{quotation.contactName}</Text>
                <Text style={styles.recipientText}>{quotation.email}</Text>
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

            {/* Table Row - Custom Lanyard */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellDescription]}>
                <Text style={styles.itemDescription}>Custom Lanyard</Text>
                <Text style={styles.itemSpecs}>2cm width, 2-sided color printing, Single lobster hook</Text>
              </View>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellQty]}>
                {quotation.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellPrice]}>
                RM {unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellTotal]}>
                RM {subtotal.toFixed(2)}
              </Text>
            </View>
            
            {/* Table Row - Delivery (FOC) */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellFirst, styles.tableCellDescription]}>
                <Text style={styles.itemDescription}>Delivery (FOC)</Text>
              </View>
              <Text style={[styles.tableCell, styles.tableCellCenter, styles.tableCellQty]}>
                1
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellPrice]}>
                RM 0.00
              </Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.tableCellTotal]}>
                RM 0.00
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
              <View style={styles.finalTotalRow}>
                <Text style={styles.finalTotalLabel}>Total</Text>
                <Text style={styles.finalTotalValue}>RM {totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Banking Information */}
          <View style={styles.bankingSection}>
            <Text style={styles.bankingTitle}>PAYMENT METHOD</Text>
            <Text style={styles.bankingText}>Bank: MAYBANK</Text>
            <Text style={styles.bankingText}>Account Name: Teevent Enterprise</Text>
            <Text style={styles.bankingText}>Account No: {bankAccount}</Text>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>
            <View style={styles.termsList}>
              <Text style={styles.termsItem}>1. This quotation is valid for 30 days from the date of issue.</Text>
              <Text style={styles.termsItem}>2. Prices quoted are final and locked within the validity period.</Text>
              <Text style={styles.termsItem}>3. Production takes 10-18 working days upon design confirmation and payment receipt.</Text>
              <Text style={styles.termsItem}>4. Payment: {paymentTermText}</Text>
              <Text style={styles.termsItem}>5. Invoicing: Official Receipt/Invoice will be issued upon payment.</Text>
            </View>
            <Text style={[styles.termsItem, { marginTop: 15, fontStyle: 'italic' }]}>
              This is a computer-generated document. No signature is required.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default QuotationPDF;
export type { QuotationData };



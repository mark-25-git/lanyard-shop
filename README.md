# Lanyard Shop - Next.js Ecommerce Application

A complete lanyard ordering system built with Next.js, Supabase, and Vercel.

## Features

- **Quantity Selection**: Choose quantity with real-time pricing
- **Design Upload**: Upload design files (PNG, JPG, PDF, SVG)
- **Order Management**: Complete checkout flow with customer information
- **Payment**: Bank transfer payment instructions
- **Order Tracking**: Track order status in real-time
- **Order Confirmation**: Email confirmation and order details

## Setup Instructions

### 1. Install Dependencies

```bash
cd lanyard-shop
npm install
```

### 2. Set Up Supabase

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create tables
4. Go to Storage and create a bucket named `lanyard-designs`
   - Set it to public (or configure appropriate policies)
   - Allow uploads from authenticated and anonymous users

### 3. Environment Variables

Create a `.env.local` file in the `lanyard-shop` directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BANK_NAME=MAYBANK
NEXT_PUBLIC_BANK_ACCOUNT=your_bank_account_number
NEXT_PUBLIC_BANK_ACCOUNT_NAME=Teevent Enterprise
ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Google Drive integration for file uploads
GOOGLE_SERVICE_ACCOUNT_PATH=config/google-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
lanyard-shop/
├── app/                    # Next.js App Router pages
│   ├── customize/          # Quantity selection & pricing
│   ├── upload/             # Design upload
│   ├── checkout/           # Customer information
│   ├── payment/            # Payment instructions
│   ├── confirmation/       # Order confirmation
│   ├── track/              # Order tracking
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Utilities & helpers
├── types/                  # TypeScript types
└── styles/                 # CSS styles
```

## Database Schema

- **orders**: Stores all order information
- **pricing_tiers**: Defines quantity-based pricing

## API Routes

- `POST /api/calculate-price`: Calculate price for quantity
- `POST /api/create-order`: Create new order
- `POST /api/upload-design`: Upload design file to Supabase Storage
- `GET /api/get-order`: Fetch order by ID or order number

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app will be available at your Vercel domain.

## Next Steps

- Add email notifications (using Supabase Edge Functions or Resend)
- Create admin dashboard for order management
- Add payment gateway integration
- Implement order status updates





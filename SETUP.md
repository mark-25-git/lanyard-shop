# Setup Guide - Lanyard Shop

## Quick Start Checklist

### ✅ Step 1: Install Dependencies

```bash
cd lanyard-shop
npm install
```

### ✅ Step 2: Create Environment File

Create `.env.local` file in the `lanyard-shop` folder with your credentials:

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

### ✅ Step 3: Set Up Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `orders` table
- `pricing_tiers` table
- Sample pricing data

### ✅ Step 4: Set Up Supabase Storage

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name it: `lanyard-designs`
4. Set to **Public bucket** (or configure policies)
5. Click **Create bucket**

### ✅ Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Flow

1. Go to `/customize` - Select quantity, see pricing
2. Go to `/upload` - Download template, upload design
3. Go to `/checkout` - Enter customer information
4. Go to `/payment` - See bank transfer details
5. Go to `/confirmation/[orderId]` - View order confirmation
6. Go to `/track/[orderId]` - Track order status

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and keys in `.env.local`
- Check that tables were created successfully in Supabase

### File Upload Issues
- Ensure the `lanyard-designs` bucket exists in Supabase Storage
- Check bucket permissions (should allow public uploads or configure policies)

### Pricing Not Showing
- Verify `pricing_tiers` table has data
- Check that pricing tiers are active (`is_active = true`)

## Next Steps

- Add email notifications
- Create admin dashboard
- Add payment gateway
- Customize design template file





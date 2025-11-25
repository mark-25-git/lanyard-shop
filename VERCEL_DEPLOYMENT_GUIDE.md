# Vercel Deployment Guide for Lanyard Shop

## 🎯 Goal
Deploy the lanyard shop to `lanyard.teevent.my` on Vercel

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Domain access to `teevent.my` (for DNS configuration)
- [ ] Supabase project set up with all tables created

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Ensure all code is committed to Git:**
   ```bash
   cd lanyard-shop
   git status
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Push to GitHub:**
   - If you haven't created a repo yet:
     ```bash
     # Create a new repo on GitHub, then:
     git remote add origin https://github.com/yourusername/lanyard-shop.git
     git push -u origin main
     ```
   - Or push to existing repo:
     ```bash
     git push origin main
     ```

---

### Step 2: Create Vercel Project

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in (or create account - it's free)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Select your GitHub repository (lanyard-shop)
   - If repo not showing, click "Adjust GitHub App Permissions"

3. **Configure Project:**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `lanyard-shop` (if repo is at root, leave blank)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Click "Deploy"** (don't add environment variables yet - we'll do that next)

---

### Step 3: Configure Environment Variables

**After first deployment, go to Project Settings:**

1. **Navigate to Settings → Environment Variables**

2. **Add these variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_MAIN_SITE_URL=https://teevent.my
   NEXT_PUBLIC_SITE_URL=https://lanyard.teevent.my
   NEXT_PUBLIC_BANK_ACCOUNT=your_bank_account_number
   ```

   **Where to find Supabase values:**
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Important:** 
   - Add variables for **Production**, **Preview**, and **Development**
   - Or at minimum, add to **Production**

4. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment → "Redeploy"
   - Or push a new commit to trigger redeploy

---

### Step 4: Configure Custom Domain

1. **Go to Project Settings → Domains**

2. **Add Domain:**
   - Enter: `lanyard.teevent.my`
   - Click "Add"

3. **Vercel will show DNS instructions:**
   - You'll see something like:
     ```
     Type: CNAME
     Name: lanyard
     Value: cname.vercel-dns.com
     ```
   - **Copy these values** (you'll need them for Step 5)

---

### Step 5: Configure DNS (At Your Domain Registrar)

1. **Log in to your domain registrar** (where you bought `teevent.my`)
   - Common registrars: Namecheap, GoDaddy, Cloudflare, etc.

2. **Find DNS Management:**
   - Look for "DNS Settings", "DNS Management", or "Name Servers"

3. **Add CNAME Record:**
   - **Type:** CNAME
   - **Name/Host:** `lanyard`
   - **Value/Target:** `cname.vercel-dns.com` (or what Vercel provided)
   - **TTL:** 3600 (or default)

4. **Save the record**

5. **Wait for DNS propagation:**
   - Usually takes 5-60 minutes
   - Can check status in Vercel dashboard
   - Vercel will show "Valid Configuration" when ready

---

### Step 6: Verify Deployment

1. **Check Vercel Dashboard:**
   - Deployment should show "Ready"
   - Domain should show "Valid Configuration"

2. **Test the site:**
   - Visit `https://lanyard.teevent.my`
   - Should load your lanyard shop

3. **Test functionality:**
   - [ ] Homepage loads
   - [ ] Can navigate to customize page
   - [ ] Pricing calculator works
   - [ ] Can create an order
   - [ ] Header logo links back to `teevent.my`

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Check:**
- All environment variables are set
- Node version matches (Vercel uses Node 18+ by default)
- All dependencies in `package.json`

**Solution:**
- Check build logs in Vercel dashboard
- Fix errors and redeploy

### Issue: Domain Not Working

**Check:**
- DNS record is correct
- CNAME value matches Vercel's instructions
- DNS has propagated (can take up to 24 hours)

**Solution:**
- Verify DNS record at your registrar
- Check Vercel domain settings
- Wait for DNS propagation

### Issue: Supabase Connection Errors

**Check:**
- Environment variables are correct
- Supabase project is active
- RLS (Row Level Security) is configured correctly

**Solution:**
- Double-check environment variable values
- Verify Supabase project settings
- Check Supabase logs

### Issue: Images Not Loading

**Check:**
- Images exist in `public/images/` folder
- Image paths are correct

**Solution:**
- Verify image files are committed to Git
- Check image paths in code

---

## ✅ Post-Deployment Checklist

- [ ] Site loads at `lanyard.teevent.my`
- [ ] All pages work (customize, checkout, payment, etc.)
- [ ] Pricing calculator works
- [ ] Can create test order
- [ ] Header logo links to `teevent.my`
- [ ] Environment variables are set
- [ ] DNS is configured correctly
- [ ] SSL certificate is active (Vercel provides automatically)

---

## 🔄 Future Updates

**To update the site:**
1. Make changes to code
2. Commit and push to GitHub
3. Vercel automatically deploys (if connected to GitHub)
4. Or manually trigger deployment in Vercel dashboard

---

## 📞 Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support:** Available in dashboard
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## 🎉 You're Done!

Once deployed, your lanyard shop will be live at:
**https://lanyard.teevent.my**

Users can now:
- Visit `teevent.my` → Click "Start Your Order"
- Go directly to `lanyard.teevent.my/customize`
- Complete the ordering flow

---

**Last Updated:** 2025-01-21



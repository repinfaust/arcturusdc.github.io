# DNS Configuration Fix for Root Domain

## Problem
- Google crawler indexes `arcturusdc.com` (root domain)
- Root domain has A record pointing to `216.198.79.1` which doesn't serve the site
- Requests to root domain fail before reaching Vercel
- Middleware redirect only works if requests reach Vercel

## Solution

### Option 1: Configure Root Domain in Vercel (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Ensure both `arcturusdc.com` and `www.arcturusdc.com` are added
   - Vercel will provide DNS configuration for the root domain

2. **Update DNS Records in Namecheap:**
   
   **Remove the current A record:**
   - Delete: `A Record` for `@` pointing to `216.198.79.1`
   
   **Add Vercel's A records for root domain:**
   - Add A record: `@` → `76.76.21.21` (Vercel IP 1)
   - Add A record: `@` → `76.223.126.88` (Vercel IP 2)
   
   **Keep the CNAME for www:**
   - Keep: `CNAME` for `www` → `4cdc7610bec203c5.vercel-dns-017.com.`

### Option 2: Use Vercel's DNS (Easier)

1. **In Vercel Dashboard:**
   - Go to Settings → Domains
   - Click "Add Domain" and add `arcturusdc.com`
   - Vercel will show you the exact DNS records to add

2. **Update Namecheap DNS:**
   - Replace the A record with Vercel's provided A records
   - Usually 2-4 A records pointing to Vercel IPs

### Option 3: Redirect at DNS Level (If Namecheap supports it)

Some DNS providers support ALIAS or ANAME records that act like CNAME for root domains:
- Change `@` A record to use Namecheap's redirect feature (if available)
- Or use a DNS provider that supports ALIAS records (Cloudflare, etc.)

## Current DNS Setup (What to Change)

**Current (Broken):**
```
Type: A Record
Host: @
Value: 216.198.79.1  ← This doesn't work
TTL: Automatic
```

**Should Be (Vercel A Records):**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic

Type: A Record  
Host: @
Value: 76.223.126.88
TTL: Automatic
```

**Keep (Already Correct):**
```
Type: CNAME Record
Host: www
Value: 4cdc7610bec203c5.vercel-dns-017.com.
TTL: Automatic
```

## Verification

After updating DNS:
1. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)
2. Test: `curl -I http://arcturusdc.com` should redirect to `https://www.arcturusdc.com`
3. Check in browser: `arcturusdc.com` should redirect to `www.arcturusdc.com`
4. Verify in Google Search Console that both domains are accessible

## Notes

- The middleware already handles the redirect from root to www (see `middleware.js` line 23-26)
- Once DNS is fixed, requests will reach Vercel and the redirect will work
- Google will eventually re-crawl and index the www version
- You can submit both domains in Google Search Console and set www as preferred


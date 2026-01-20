# Fix DNS Configuration for Root Domain

## Problem
- Google indexes `arcturusdc.com` (root domain) but it doesn't load
- Root domain A record points to `216.198.79.1` which doesn't serve the site
- Requests fail before reaching Vercel, so middleware redirect never runs

## Solution: Update DNS A Record

### Step 1: Get Vercel's IP Addresses

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click on `arcturusdc.com` domain
3. Vercel will show you the DNS records needed, including A records for the root domain

### Step 2: Update DNS in Namecheap

**Current (Broken):**
```
Type: A Record
Host: @
Value: 216.198.79.1  ← DELETE THIS
TTL: Automatic
```

**Replace with Vercel's A Records:**

Vercel typically uses these IPs (but check your Vercel dashboard for the exact ones):

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

### Step 3: Verify Configuration

After updating DNS (wait 1-2 hours for propagation):

1. Test root domain: `curl -I http://arcturusdc.com`
   - Should return 308 redirect to `https://www.arcturusdc.com`

2. Test in browser: Visit `http://arcturusdc.com`
   - Should redirect to `https://www.arcturusdc.com`

3. Check Google Search Console:
   - Submit both `arcturusdc.com` and `www.arcturusdc.com`
   - Set `www.arcturusdc.com` as the preferred domain

## Alternative: Use Vercel's DNS

If Namecheap doesn't work well, you can:
1. Transfer DNS management to Vercel (free)
2. Or use Cloudflare DNS (free) which supports better root domain handling

## Current Setup

- ✅ Middleware redirects root → www (already configured)
- ✅ Sitemap uses www domain (already configured)  
- ✅ Robots.txt uses www domain (already configured)
- ❌ DNS A record points to wrong IP (needs fixing)

Once DNS is fixed, everything will work correctly!


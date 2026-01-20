# DNS Verification Guide

## Step 1: Check DNS Propagation

### Using Online Tools:
1. **DNS Checker** (https://dnschecker.org/)
   - Enter: `arcturusdc.com`
   - Select: "NS" (Nameserver) record type
   - Check if `ns1.vercel-dns.com` and `ns2.vercel-dns.com` appear globally
   - Wait until most locations show Vercel nameservers (can take 1-24 hours)

2. **What's My DNS** (https://www.whatsmydns.net/)
   - Enter: `arcturusdc.com`
   - Select: "NS" record type
   - Verify Vercel nameservers are showing

### Using Command Line:
```bash
# Check nameservers
dig NS arcturusdc.com +short

# Should return:
# ns1.vercel-dns.com
# ns2.vercel-dns.com

# Check if root domain resolves
dig A arcturusdc.com +short

# Check if www resolves
dig CNAME www.arcturusdc.com +short
```

## Step 2: Test Domain Accessibility

### Test Root Domain (should redirect to www):
```bash
# Test HTTP redirect
curl -I http://arcturusdc.com

# Should return:
# HTTP/1.1 308 Permanent Redirect
# Location: https://www.arcturusdc.com

# Test HTTPS redirect
curl -I https://arcturusdc.com

# Should return:
# HTTP/1.1 308 Permanent Redirect
# Location: https://www.arcturusdc.com
```

### Test WWW Domain (should load):
```bash
# Test www domain
curl -I https://www.arcturusdc.com

# Should return:
# HTTP/1.1 200 OK
```

### Browser Tests:
1. **Root Domain:**
   - Visit: `http://arcturusdc.com`
   - Should automatically redirect to `https://www.arcturusdc.com`
   - Check browser address bar shows `www.arcturusdc.com`

2. **WWW Domain:**
   - Visit: `https://www.arcturusdc.com`
   - Should load the site normally
   - Check SSL certificate is valid (green padlock)

3. **Test Both:**
   - Open incognito/private window
   - Visit both `arcturusdc.com` and `www.arcturusdc.com`
   - Both should work (root redirects, www loads)

## Step 3: Verify in Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Project → Settings → Domains
   - Check `arcturusdc.com` domain status

2. **Check DNS Records:**
   - Click on `arcturusdc.com` domain
   - Should see DNS records managed by Vercel:
     - ALIAS record for root domain (`@`)
     - CNAME record for `www`
     - CAA records for SSL

3. **Verify Status:**
   - Should see "Valid Configuration" ✅
   - No orange warnings about nameservers
   - SSL certificate should be active

## Step 4: Test Specific Pages

Test that pages load correctly:

```bash
# Homepage
curl -I https://www.arcturusdc.com/

# Apps page
curl -I https://www.arcturusdc.com/apps

# STEa explore page
curl -I https://www.arcturusdc.com/apps/stea/explore

# All should return HTTP 200 OK
```

## Step 5: Google Search Console

1. **Verify Both Domains:**
   - Go to Google Search Console (https://search.google.com/search-console)
   - Add both properties:
     - `https://arcturusdc.com`
     - `https://www.arcturusdc.com`

2. **Set Preferred Domain:**
   - Go to Settings → Site Settings
   - Set preferred domain to: `www.arcturusdc.com`
   - This tells Google to index the www version

3. **Request Re-indexing:**
   - Use URL Inspection tool
   - Test `https://www.arcturusdc.com`
   - Click "Request Indexing" for important pages

4. **Submit Sitemap:**
   - Go to Sitemaps section
   - Submit: `https://www.arcturusdc.com/sitemap.xml`

## Step 6: Check SSL Certificate

```bash
# Check SSL for root domain
openssl s_client -connect arcturusdc.com:443 -servername arcturusdc.com

# Check SSL for www domain
openssl s_client -connect www.arcturusdc.com:443 -servername www.arcturusdc.com

# Both should show valid Let's Encrypt certificates
```

Or use online tool:
- **SSL Labs** (https://www.ssllabs.com/ssltest/)
  - Enter: `arcturusdc.com`
  - Should show valid SSL certificate

## Step 7: Test Redirect Chain

Verify the redirect works correctly:

```bash
# Follow redirects
curl -L -I http://arcturusdc.com

# Should show:
# 1. HTTP → HTTPS redirect (if any)
# 2. arcturusdc.com → www.arcturusdc.com redirect
# 3. Final destination: https://www.arcturusdc.com
```

## Step 8: Check DNS Records in Vercel

Once nameservers propagate, check Vercel's DNS management:

1. **In Vercel Dashboard:**
   - Settings → Domains → `arcturusdc.com`
   - Click to view DNS records
   - Should see:
     - ALIAS record for `@` (root)
     - CNAME record for `www`
     - CAA records for SSL

## Quick Verification Checklist

- [ ] Nameservers show `ns1.vercel-dns.com` and `ns2.vercel-dns.com` in DNS checker
- [ ] `arcturusdc.com` redirects to `www.arcturusdc.com` (308 redirect)
- [ ] `www.arcturusdc.com` loads correctly
- [ ] SSL certificates are valid for both domains
- [ ] Vercel dashboard shows "Valid Configuration"
- [ ] No orange warnings in Vercel
- [ ] Pages load correctly (homepage, apps, etc.)
- [ ] Both domains added to Google Search Console
- [ ] Preferred domain set to `www.arcturusdc.com` in Search Console

## Troubleshooting

### If Root Domain Still Doesn't Work:

1. **Wait Longer:**
   - DNS propagation can take up to 48 hours
   - Check DNS propagation status with dnschecker.org

2. **Clear DNS Cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. **Check Vercel Configuration:**
   - Ensure both domains are added in Vercel
   - Check domain status in Vercel dashboard
   - Verify SSL certificates are issued

4. **Test from Different Locations:**
   - Use VPN or different network
   - DNS propagation varies by location

## Expected Timeline

- **Immediate:** Nameservers start updating
- **1-2 hours:** Most locations updated
- **24-48 hours:** Full global propagation
- **After propagation:** Root domain redirects work correctly


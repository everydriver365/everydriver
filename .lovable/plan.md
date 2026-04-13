

## Plan: Mini-Website SEO Without Cloudflare

Since `drive365.co.uk` is on SiteGround, we'll skip the Cloudflare Worker approach and use a simpler method that still gets SEO working for social sharing and search engines.

### Approach: Edge Function for Social/Bot Previews + Dynamic Sitemap

**How it works:**
1. I build a `mini-website-ssr` edge function that returns a full HTML page with correct meta tags for any instructor slug
2. The `og:url` and canonical tags in the client-side app will point to the actual `/i/{slug}` URL (unchanged)
3. For **social sharing** (Facebook, Twitter, LinkedIn, WhatsApp), we update the share links to go through the edge function URL — these platforms will then see the correct title, description, and image
4. For **Google SEO**, I also build a dynamic `sitemap.xml` edge function listing all instructor pages, which helps Google discover and index them. Google's crawler is good enough to execute JavaScript and will pick up the client-side meta tags from `useMiniWebsiteSEO`
5. No DNS changes or extra accounts needed

### What I'll Build

| File | Action |
|------|--------|
| `supabase/functions/mini-website-ssr/index.ts` | **Create** — returns HTML with injected SEO meta tags for a given slug |
| `supabase/functions/mini-website-sitemap/index.ts` | **Create** — generates sitemap.xml of all instructor pages |
| `public/robots.txt` | **Modify** — add Sitemap directive |
| `src/hooks/useMiniWebsiteSEO.ts` | **Modify** — ensure og:url uses the correct drive365 subdomain |

### What You'd Need To Do On SiteGround (Optional, Later)

If you want the `{slug}.drive365.co.uk` subdomains to serve SEO-friendly pages directly to bots, you could add a simple `.htaccess` rewrite rule on SiteGround that redirects bot user-agents to the edge function. I can provide the exact rule — it's a copy-paste into SiteGround's file manager. But this is optional; the sitemap + Google's JS rendering handles most SEO needs.

### Result
- Social sharing previews show correct instructor name, description, and logo
- Google can discover all instructor pages via sitemap
- No new accounts or services needed


# Vercel Deployment Guide for verifyX

## Quick Deploy Steps

### 1. Prepare Your Repository

Make sure all changes are committed and pushed:
```bash
git add .
git commit -m "Migrate to Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Via Vercel Dashboard (Easiest):

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Click "Import Project"
4. Select your `verifyX` repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`

6. Add Environment Variables:
   ```
   VITE_CONTRACT_ID=CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J
   VITE_RPC_URL=https://soroban-testnet.stellar.org
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-key>
   ```

7. Click **Deploy**

#### Via Vercel CLI:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy from project root
vercel

# Add environment variables
vercel env add VITE_CONTRACT_ID production
# Enter: CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J

vercel env add VITE_RPC_URL production
# Enter: https://soroban-testnet.stellar.org

vercel env add VITE_SUPABASE_URL production
# Enter: <your-supabase-url>

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: <your-supabase-key>

# Deploy to production
vercel --prod
```

### 3. Verify Deployment

Once deployed, Vercel will give you a URL like:
- Production: `https://verify-x.vercel.app`
- Preview: `https://verify-x-git-branch.vercel.app`

Test the following:
1. ✅ App loads correctly
2. ✅ Wallet connection works (Freighter)
3. ✅ Can register products
4. ✅ Can verify products
5. ✅ Transaction history displays

### 4. Update README

Once deployed, update the live URL in README.md:
```markdown
**Live Demo:** [https://your-app.vercel.app](https://your-app.vercel.app)
```

## Configuration Files

### vercel.json
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration:
- Sets the build command to install and build from the `frontend` directory
- Specifies the output directory as `frontend/dist`
- Configures SPA routing (all routes serve index.html)

## Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request gets a unique preview URL

## Environment Variables

Required environment variables (set in Vercel dashboard):

| Variable | Value | Description |
|---|---|---|
| `VITE_CONTRACT_ID` | `CDRF3WAWOYS6YQFHLYE3PYIMURYMTV6NXSB4OUQISFTITYB2D3UB2U6J` | Soroban contract address |
| `VITE_RPC_URL` | `https://soroban-testnet.stellar.org` | Stellar RPC endpoint |
| `VITE_SUPABASE_URL` | Your Supabase URL | User database |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase key | Database access |

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Solution: Check `frontend/package.json` has all dependencies
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Solution: Add missing env vars in Vercel dashboard under Settings → Environment Variables

### App Loads But Doesn't Work

**Wallet won't connect:**
- Check browser console for errors
- Verify Freighter extension is installed
- Ensure Freighter is on Testnet (not Mainnet)

**Contract calls fail:**
- Verify `VITE_CONTRACT_ID` is correct
- Check `VITE_RPC_URL` is accessible
- Test contract on Stellar Expert

**Database errors:**
- Verify Supabase credentials
- Check Supabase project is active
- Review Supabase logs

### Performance Issues

Vercel automatically optimizes:
- Static asset caching
- Edge network distribution
- Automatic compression

If issues persist:
- Check Vercel Analytics dashboard
- Review build logs for warnings
- Optimize bundle size if needed

## Comparison: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---|---|---|
| Free tier | 100 GB bandwidth | 100 GB bandwidth |
| Build minutes | 300/month | 6000/month |
| Deployments | Unlimited | Unlimited |
| Custom domains | ✅ | ✅ |
| Auto SSL | ✅ | ✅ |
| Preview deploys | ✅ | ✅ |
| Edge functions | ✅ | ✅ |
| Analytics | Paid | Free (basic) |

Both platforms work great for this project. Vercel was chosen due to:
- More generous build minutes
- Excellent Vite integration
- Fast global CDN
- No credit limit issues

## Next Steps

After successful deployment:

1. ✅ Update README.md with new live URL
2. ✅ Test all features on production
3. ✅ Share new URL with users
4. ✅ Update any external links (social media, etc.)
5. ✅ Monitor Vercel dashboard for errors
6. ✅ Set up custom domain (optional)

## Custom Domain (Optional)

To use a custom domain:

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g., `verifyx.com`)
3. Update DNS records as instructed by Vercel
4. Vercel automatically provisions SSL certificate

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Community: https://github.com/vercel/vercel/discussions

---

**Deployment Status:** Ready to deploy ✅

Push your changes and follow the steps above to get your app live on Vercel!

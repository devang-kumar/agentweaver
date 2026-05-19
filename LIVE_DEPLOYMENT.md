# 🌐 Get Your Live Link - Quick Deployment Guide

## 🚀 **Fastest Options (5 minutes)**

### **Option 1: Vercel (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your `agentweaver` repository
5. **Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click "Deploy"
7. **You'll get a live link like:** `https://agentweaver-xyz.vercel.app`

### **Option 2: Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Choose your `agentweaver` repository
5. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"
7. **You'll get a live link like:** `https://amazing-name-123456.netlify.app`

### **Option 3: GitHub Pages (Free)**
1. Go to your GitHub repository settings
2. Scroll to "Pages" section
3. Source: "GitHub Actions"
4. The workflow file is already created in `.github/workflows/deploy.yml`
5. Push changes to trigger deployment
6. **You'll get a live link like:** `https://devang-kumar.github.io/agentweaver`

---

## 🔧 **Full Stack Deployment (Frontend + Backend)**

### **Option A: Railway (Easiest Full Stack)**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. **For Frontend:**
   - Root Directory: `/` (leave empty)
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
6. **For Backend:**
   - Root Directory: `generated`
   - Start Command: `python api_app/main.py`
7. Add MongoDB database service
8. **You'll get live links for both frontend and backend**

### **Option B: Render**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create **Web Service** for frontend:
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
4. Create **Web Service** for backend:
   - Root Directory: `generated`
   - Start Command: `python api_app/main.py`
5. Add **PostgreSQL** or use **MongoDB Atlas**

---

## ⚡ **Quick Commands for Local Testing**

```bash
# Test your build locally
npm run build
npm run preview

# This will show you a local preview at http://localhost:4173
```

---

## 🎯 **Recommended Approach**

**For Demo/Portfolio:** Use **Vercel** or **Netlify** (frontend only)
- ✅ Free
- ✅ Instant deployment
- ✅ Custom domain support
- ✅ Automatic deployments on git push

**For Full Application:** Use **Railway** or **Render**
- ✅ Frontend + Backend + Database
- ✅ Environment variables
- ✅ Scaling options
- ✅ Professional deployment

---

## 🔗 **Expected Live Links**

After deployment, you'll get URLs like:
- **Vercel:** `https://agentweaver-devang.vercel.app`
- **Netlify:** `https://agentweaver-ml.netlify.app`
- **GitHub Pages:** `https://devang-kumar.github.io/agentweaver`
- **Railway:** `https://agentweaver-production.up.railway.app`

---

## 🛠️ **Need Help?**

1. **Build Issues:** Run `npm run build` locally first
2. **Environment Variables:** Add `VITE_API_URL` in deployment settings
3. **Routing Issues:** Make sure SPA redirects are configured
4. **API Issues:** Deploy backend separately or use serverless functions

**Choose your preferred option and you'll have a live link in minutes!** 🚀
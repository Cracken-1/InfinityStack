# InfinityStack Deployment Guide

Complete deployment instructions for production environments.

## 🚀 Quick Deploy

### Vercel (Recommended)

1. **Connect Repository**
```bash
npm i -g vercel
vercel --prod
```

2. **Environment Variables**
Set in Vercel dashboard:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXTAUTH_SECRET=your_secret
```

### Docker Deployment

1. **Build and Run**
```bash
docker-compose up -d
```

2. **Scale Services**
```bash
docker-compose up -d --scale app=3
```

## 🔧 Production Configuration

### Environment Setup
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
```

### Database Migration
```bash
# Run schema
psql $DATABASE_URL -f database/schema.sql

# Verify tables
psql $DATABASE_URL -c "\dt"
```

### SSL Configuration
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring

### Health Checks
```bash
curl https://yourdomain.com/health
```

### Logs
```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs infinitystack
```

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Security headers enabled

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v1
```

## 📈 Performance Optimization

### Caching Strategy
- Static assets: 1 year
- API responses: 5 minutes
- Database queries: Redis cache

### CDN Configuration
- Images: CloudFront/Cloudflare
- Static files: Edge locations
- API: Geographic distribution

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache
npm run clean
rm -rf .next node_modules
npm install
```

**Database Connection**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Memory Issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## 📞 Support

- **Monitoring**: Set up alerts for 5xx errors
- **Backup**: Daily database backups
- **Updates**: Weekly dependency updates
- **Security**: Monthly security audits
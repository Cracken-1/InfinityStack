# InfinityStack Setup Guide

Complete setup instructions for the InfinityStack multi-tenant enterprise cloud management platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### 1. Clone and Install

```bash
git clone <repository-url>
cd InfinityStack
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure your `.env.local` file with the following variables:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Multi-tenant Configuration
TENANT_ISOLATION_ENABLED=true
DEFAULT_TENANT_LIMITS_USERS=100
DEFAULT_TENANT_LIMITS_LOCATIONS=5
DEFAULT_TENANT_LIMITS_PRODUCTS=1000

# Security
ENCRYPTION_KEY=your_encryption_key_for_sensitive_data
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### 3. Database Setup

#### Option A: Supabase (Recommended)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run the database schema:

```bash
# Copy the schema.sql content and run it in Supabase SQL Editor
cat database/schema.sql
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database
3. Run the schema:

```bash
psql -d your_database -f database/schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗 Architecture Overview

### Multi-Tenant Design

InfinityStack uses a **shared database, separate schemas** approach:

- **Row Level Security (RLS)** for data isolation
- **Tenant-based routing** and context switching
- **Role-based access control** (RBAC)
- **Audit logging** for compliance

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom design system

## 🔧 Configuration

### Tenant Settings

Each tenant can be configured with:

```typescript
interface TenantSettings {
  branding: {
    logo?: string
    primaryColor: string
    secondaryColor: string
  }
  features: {
    websiteAnalyzer: boolean
    aiInsights: boolean
    advancedReporting: boolean
  }
  limits: {
    users: number
    locations: number
    products: number
  }
}
```

### User Roles

- **SUPERADMIN**: Platform-wide access
- **ORG_ADMIN**: Tenant administration
- **USER**: Standard user access
- **STAFF**: Limited operational access
- **CUSTOMER**: Customer portal access

## 📊 Features

### Core Platform
- Multi-tenant architecture with secure isolation
- Enterprise security with SOC2 compliance
- AI-powered insights and analytics
- Website analyzer for business intelligence

### Admin Dashboard
- Real-time business metrics and KPIs
- Product and inventory management
- Customer relationship management
- Order processing and tracking

### Superadmin Dashboard
- Platform-wide system monitoring
- Tenant management and onboarding
- Security and compliance oversight
- Performance analytics

## 🔐 Security

### Authentication Flow

1. User submits credentials
2. Supabase Auth validates and returns JWT
3. Middleware validates JWT and sets tenant context
4. RLS policies enforce data isolation

### Data Protection

- **Encryption at rest** for sensitive data
- **HTTPS enforcement** for all communications
- **Rate limiting** to prevent abuse
- **Audit logging** for compliance tracking

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
# Build the image
docker build -t infinitystack .

# Run the container
docker run -p 3000:3000 infinitystack
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Test Data

The platform includes sample data for development:
- 3 sample tenants
- Mock products, orders, and customers
- Sample website analyses

## 📈 Monitoring

### Performance Monitoring

- **Core Web Vitals** tracking
- **API response times** monitoring
- **Database query performance** analysis

### Error Tracking

Configure Sentry for error tracking:

```env
SENTRY_DSN=your_sentry_dsn
```

## 🔄 Database Migrations

### Adding New Tables

1. Create migration file in `database/migrations/`
2. Update TypeScript types in `src/types/`
3. Add RLS policies for tenant isolation
4. Update API routes as needed

### Example Migration

```sql
-- Add new feature table
CREATE TABLE feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Add tenant isolation policy
CREATE POLICY tenant_isolation_feature_requests ON feature_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

- **Documentation**: Check the inline code comments
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ for enterprise-scale business management.
export interface BrandingConfig {
  id: string;
  tenantId: string;
  logo: {
    primary: string;
    secondary?: string;
    favicon: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  customCss?: string;
  domain?: string;
  companyName: string;
  tagline?: string;
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class WhiteLabelingService {
  private brandingConfigs: Map<string, BrandingConfig> = new Map();

  createBrandingConfig(config: Omit<BrandingConfig, 'id' | 'createdAt' | 'updatedAt'>): BrandingConfig {
    const newConfig: BrandingConfig = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.brandingConfigs.set(newConfig.tenantId, newConfig);
    return newConfig;
  }

  getBrandingConfig(tenantId: string): BrandingConfig | null {
    return this.brandingConfigs.get(tenantId) || null;
  }

  updateBrandingConfig(tenantId: string, updates: Partial<BrandingConfig>): BrandingConfig | null {
    const config = this.brandingConfigs.get(tenantId);
    if (!config) return null;

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.brandingConfigs.set(tenantId, updatedConfig);
    return updatedConfig;
  }

  generateCustomCSS(tenantId: string): string {
    const config = this.getBrandingConfig(tenantId);
    if (!config) return '';

    return `
      :root {
        --primary-color: ${config.colors.primary};
        --secondary-color: ${config.colors.secondary};
        --accent-color: ${config.colors.accent};
        --background-color: ${config.colors.background};
        --text-color: ${config.colors.text};
        --font-family: ${config.typography.fontFamily};
        --heading-font: ${config.typography.headingFont || config.typography.fontFamily};
        --font-size-small: ${config.typography.fontSize.small};
        --font-size-medium: ${config.typography.fontSize.medium};
        --font-size-large: ${config.typography.fontSize.large};
      }

      body {
        font-family: var(--font-family);
        color: var(--text-color);
        background-color: var(--background-color);
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--heading-font);
        color: var(--primary-color);
      }

      .btn-primary {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }

      .btn-secondary {
        background-color: var(--secondary-color);
        border-color: var(--secondary-color);
      }

      .navbar-brand img {
        max-height: 40px;
      }

      ${config.customCss || ''}
    `;
  }

  generateManifest(tenantId: string): any {
    const config = this.getBrandingConfig(tenantId);
    if (!config) return null;

    return {
      name: config.companyName,
      short_name: config.companyName,
      description: config.tagline || `${config.companyName} - Powered by InfinityStack`,
      start_url: '/',
      display: 'standalone',
      background_color: config.colors.background,
      theme_color: config.colors.primary,
      icons: [
        {
          src: config.logo.favicon,
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    };
  }

  validateDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  getDefaultBrandingConfig(tenantId: string, companyName: string): BrandingConfig {
    return {
      id: crypto.randomUUID(),
      tenantId,
      logo: {
        primary: '/default-logo.png',
        favicon: '/default-favicon.ico'
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          small: '14px',
          medium: '16px',
          large: '18px'
        }
      },
      companyName,
      contactInfo: {
        email: 'contact@example.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  previewBranding(config: Partial<BrandingConfig>): string {
    // Generate preview HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${config.companyName} - Preview</title>
        <style>${this.generatePreviewCSS(config)}</style>
      </head>
      <body>
        <header>
          <img src="${config.logo?.primary}" alt="${config.companyName}" />
          <h1>${config.companyName}</h1>
          <p>${config.tagline || ''}</p>
        </header>
        <main>
          <h2>Sample Content</h2>
          <p>This is how your branded platform will look.</p>
          <button class="btn-primary">Primary Button</button>
          <button class="btn-secondary">Secondary Button</button>
        </main>
      </body>
      </html>
    `;
  }

  private generatePreviewCSS(config: Partial<BrandingConfig>): string {
    if (!config.colors || !config.typography) return '';

    return `
      body { 
        font-family: ${config.typography.fontFamily}; 
        color: ${config.colors.text}; 
        background: ${config.colors.background}; 
      }
      h1, h2 { color: ${config.colors.primary}; }
      .btn-primary { 
        background: ${config.colors.primary}; 
        color: white; 
        padding: 10px 20px; 
        border: none; 
        border-radius: 4px; 
      }
      .btn-secondary { 
        background: ${config.colors.secondary}; 
        color: white; 
        padding: 10px 20px; 
        border: none; 
        border-radius: 4px; 
      }
    `;
  }
}
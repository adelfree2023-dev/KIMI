# 🚀 Template System: Complete Implementation Roadmap
*Phased Delivery Plan with Security-First Approach*

---

## 📐 Executive Summary

This roadmap breaks down the template system implementation into **5 phases**, each deliverable and testable independently. Every phase builds upon the previous, following `.agent/rules` compliance.

---

## 🎯 North Star Objectives

| Metric | Target | Enforcement |
|:-------|:-------|:------------|
| **Security Score** | 100/100 | OWASP ZAP + custom scanners |
| **Test Coverage** | 95%+ | Vitest + CI gate |
| **Penetration Resistance** | 0 critical vulnerabilities | Automated attack simulation |
| **Installation Time** | < 5 minutes | End-to-end workflow test |
| **Template Matrix** | 1000+ templates | Scalable architecture |

---

## 📋 Phase Matrix

```mermaid
graph TD
    A[Phase 1: Security Infrastructure] --> B[Phase 2: Core Package Development]
    B --> C[Phase 3: Template Registry System]
    C --> D[Phase 4: Installation & Activation]
    D --> E[Phase 5: Production Hardening]
    
    A1[S1-S9 Validators] --> A
    A2[Penetration Tests] --> A
    A3[CI/CD Pipeline] --> A
    
    B1[@apex/template-validator] --> B
    B2[@apex/template-loader] --> B
    B3[@apex/template-config] --> B
    
    C1[Template Registry DB] --> C
    C2[Upload & Review System] --> C
    C3[Version Control] --> C
    
    D1[CLI: template:install] --> D
    D2[Dynamic Loading] --> D
    D3[Tenant Assignment] --> D
    
    E1[Performance Audit] --> E
    E2[Security Re-scan] --> E
    E3[Load Testing] --> E
```

---

## 🔷 Phase 1: Security Validation Infrastructure
**Duration:** 3 days  
**Status:** ✅ SPECIFICATION COMPLETE

### Deliverables

| Item | Type | Location |
|:-----|:-----|:---------|
| Security Validators | Package | `packages/template-security/` |
| Penetration Test Framework | Package | `packages/template-security/tests/` |
| CI/CD Security Pipeline | GitHub Action | `.github/workflows/template-security.yml` |
| Security Documentation | Docs | `docs/template-system/08-security-validation-infrastructure.md` |

### Definition of Done

- [ ] All S1-S9 automated checkers functional
- [ ] Penetration tests cover OWASP Top 10
- [ ] CI/CD pipeline integrated with PR workflow
- [ ] Manual validation of first 3 test templates
- [ ] Performance: scan completes in < 5 minutes

### Critical Implementation Notes

```typescript
// Key architectural decision:
// Security validation runs in ISOLATED sandbox

import { VM } from 'vm2';

class TemplateSandbox {
  async runSecurityTests(templatePath: string) {
    const sandbox = new VM({
      timeout: 300000, // 5 min max
      sandbox: {
        // Only expose safe APIs
        console: this.createSafeConsole(),
        fetch: this.createMonitoredFetch(),
      },
    });
    
    // Template CANNOT escape sandbox
    return sandbox.run(await this.loadTemplate(templatePath));
  }
}
```

---

## 🔷 Phase 2: Core Package Development
**Duration:** 5 days  
**Status:** ✅ IMPLEMENTED

### Package 1: @apex/template-validator

**Purpose:** Validate template.config.json and file structure.

```typescript
// packages/template-validator/src/index.ts

export class TemplateValidator {
  validate(templatePath: string): ValidationResult {
    const results = [
      this.validateConfig(templatePath),
      this.validateStructure(templatePath),
      this.validateDependencies(templatePath),
      this.validateNaming(templatePath),
    ];
    
    return this.aggregate(results);
  }
  
  private validateConfig(path: string): ConfigValidation {
    const config = JSON.parse(
      fs.readFileSync(`${path}/template.config.json`, 'utf-8')
    );
    
    // Validate against JSON schema
    const result = TemplateConfigSchema.safeParse(config);
    
    if (!result.success) {
      throw new ValidationError('Invalid template.config.json', {
        errors: result.error.flatten(),
      });
    }
    
    // Business rules validation
    if (!config.features.pages.home) {
      throw new ValidationError('Home page is mandatory');
    }
    
    return { passed: true, config: result.data };
  }
}
```

### Package 2: @apex/template-loader

**Purpose:** Dynamic template loading with tenant context.

```typescript
// packages/template-loader/src/index.ts

export class TemplateLoader {
  private cache = new Map<string, TemplateComponent>();
  
  async loadTemplate(
    templateName: string, 
    tenantConfig: TenantConfig
  ): Promise<TemplateComponent> {
    const cacheKey = `${templateName}:${tenantConfig.tenantId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Security: Validate template is approved
    const isApproved = await this.registry.isApproved(templateName);
    if (!isApproved) {
      throw new SecurityError('Template not approved for production');
    }
    
    // Load template with tenant context injected
    const template = await import(`@templates/${templateName}`);
    const boundTemplate = this.bindTenantContext(template, tenantConfig);
    
    this.cache.set(cacheKey, boundTemplate);
    return boundTemplate;
  }
  
  private bindTenantContext(
    template: TemplateComponent, 
    config: TenantConfig
  ): TemplateComponent {
    // Inject tenant config as context provider
    return (props) => (
      <TenantProvider config={config}>
        <template {...props} />
      </TenantProvider>
    );
  }
}
```

### Package 3: @apex/template-config

**Purpose:** TypeScript types and Zod schemas for template system.

```typescript
// packages/template-config/src/schemas.ts

export const TemplateConfigSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  category: z.enum(['fashion', 'tech', 'food', 'general']),
  
  features: z.object({
    pages: z.object({
      home: z.literal(true), // Mandatory
      productListing: z.literal(true),
      productDetails: z.literal(true),
      cart: z.literal(true),
      checkout: z.literal(true),
      // ... rest optional
    }),
  }),
  
  requirements: z.object({
    apexVersion: z.string(),
    packages: z.record(z.string()),
  }),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
```

### Definition of Done

- [ ] All 3 packages published to workspace
- [ ] Unit tests: 95%+ coverage
- [ ] Integration tests pass
- [ ] Documentation complete
- [ ] Security scan: 0 critical issues

---

## 🔷 Phase 3: Template Registry System
**Duration:** 7 days  
**Dependencies:** Phases 1-2 complete

### Database Schema

```sql
-- New tables in public schema

CREATE TABLE template_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, approved, rejected
  
  -- Metadata
  category VARCHAR(50) NOT NULL,
  description TEXT,
  author_email VARCHAR(255) NOT NULL,
  
  -- Storage
  storage_path TEXT NOT NULL, -- MinIO path
  config JSONB NOT NULL, -- template.config.json
  
  -- Security
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  last_security_scan_at TIMESTAMPTZ,
  security_report JSONB,
  
  -- Stats
  install_count INTEGER DEFAULT 0,
  active_tenant_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_template_registry_status ON template_registry(status);
CREATE INDEX idx_template_registry_category ON template_registry(category);

CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES template_registry(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  storage_path TEXT NOT NULL,
  changelog TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, version)
);

-- Tenant template assignment (extends existing tenant_config)
CREATE TABLE tenant_templates (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES template_registry(id),
  version VARCHAR(20) NOT NULL,
  customization JSONB NOT NULL DEFAULT '{}',
  activated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Super Admin Template Review UI

```typescript
// apps/super-admin/src/app/templates/pending/page.tsx

export default async function PendingTemplatesPage() {
  const templates = await getPendingTemplates();
  
  return (
    <div>
      <h1>Template Review Queue</h1>
      {templates.map(template => (
        <TemplateReviewCard
          key={template.id}
          template={template}
          onApprove={async () => {
            await approveTemplate(template.id);
            await runSecurityScan(template.id);
          }}
          onReject={async (reason) => {
            await rejectTemplate(template.id, reason);
          }}
        />
      ))}
    </div>
  );
}
```

### Definition of Done

- [ ] Registry database tables created
- [ ] Super Admin review UI functional
- [ ] Template upload API working
- [ ] Version control system operational
- [ ] Security: Only approved templates loadable

---

## 🔷 Phase 4: Installation & Activation System
**Duration:** 5 days  
**Dependencies:** Phases 1-3 complete

### CLI Command

```typescript
// packages/cli/src/commands/template.ts

export class TemplateCommand {
  @Command('template:install <name>')
  async install(name: string) {
    console.log(`📦 Installing template: ${name}`);
    
    // 1. Fetch from registry
    const template = await this.registry.fetch(name);
    
    if (template.status !== 'approved') {
      throw new Error('❌ Template not approved for use');
    }
    
    // 2. Security check
    console.log('🔐 Running security validation...');
    const securityResult = await this.validator.validate(template.path);
    
    if (!securityResult.passed) {
      throw new Error('❌ Security validation failed');
    }
    
    // 3. Install dependencies
    console.log('📥 Installing dependencies...');
    await this.installDependencies(template.path);
    
    // 4. Copy to templates directory
    console.log('📂 Copying template files...');
    await this.copyTemplate(template.path, `templates/${name}`);
    
    // 5. Register in system
    await this.registerTemplate(name, template.version);
    
    console.log(`✅ Template installed: ${name}@${template.version}`);
  }
}
```

### Dynamic Template Loading in Storefront

```typescript
// apps/storefront/src/app/layout.tsx

import { getTemplate } from '@apex/template-loader';
import { getTenantConfig } from '@apex/config';

export default async function RootLayout({ children }) {
  const tenant = await getTenantConfig();
  
  // Load tenant's assigned template
  const Template = await getTemplate(tenant.templateName);
  
  return (
    <html lang={tenant.locale.defaultLanguage}>
      <body>
        <Template tenantConfig={tenant}>
          {children}
        </Template>
      </body>
    </html>
  );
}
```

### Definition of Done

- [ ] CLI command functional
- [ ] Template installation tested end-to-end
- [ ] Dynamic loading works correctly
- [ ] Tenant assignment tested
- [ ] Cache invalidation verified

---

## 🔷 Phase 5: Production Hardening
**Duration:** 3 days  
**Dependencies:** Phases 1-4 complete

### Performance Audit

```typescript
// packages/template-security/src/performance.auditor.ts

export class PerformanceAuditor {
  async audit(templatePath: string): Promise<PerformanceReport> {
    // 1. Build template
    const buildTime = await this.measureBuildTime(templatePath);
    
    // 2. Measure bundle size
    const bundleSize = await this.analyzeBundleSize(templatePath);
    
    // 3. Lighthouse audit
    const lighthouse = await this.runLighthouse(templatePath);
    
    // 4. Load testing
    const loadTest = await this.runLoadTest(templatePath);
    
    return {
      buildTime,
      bundleSize,
      lighthouse,
      loadTest,
      passed: 
        buildTime < 60000 && // < 1 min
        bundleSize.total < 500000 && // < 500KB
        lighthouse.performance > 90 &&
        loadTest.successRate > 99,
    };
  }
}
```

### Definition of Done

- [ ] Performance benchmarks met
- [ ] Security re-scan: 100/100
- [ ] Load test: 1000 RPS sustained
- [ ] Documentation complete
- [ ] First 3 templates in production

---

## ✅ Acceptance Criteria (Overall)

| Phase | Gate | Status |
|:------|:-----|:-------|
| Phase 1 | Security infrastructure operational | 📝 Spec complete |
| Phase 2 | Core packages functional | ⏳ Pending |
| Phase 3 | Registry system live | ⏳ Pending |
| Phase 4 | Installation workflow tested | ⏳ Pending |
| Phase 5 | Production-ready | ⏳ Pending |

---

*Roadmap Version: 1.0.0 | Compliance: .agent/rules verified*

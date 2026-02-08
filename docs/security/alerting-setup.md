# 🚨 Security Alerting Setup Guide

This guide explains how to configure automated security alerting for the KIMI CI/CD pipeline.

## Overview

The security alerting system automatically notifies the team when security gates fail in the CI pipeline.

### Features

- **Slack Notifications**: Real-time alerts to team channels
- **PagerDuty Integration**: Critical alerts for penetration test failures
- **GitHub Issues**: Automatic issue creation for tracking
- **Severity Classification**: CRITICAL vs HIGH based on failure type

## Configuration

### 1. Slack Integration

1. Create a Slack App:
   ```bash
   # Go to https://api.slack.com/apps
   # Click "Create New App" → "From scratch"
   # Name: "KIMI Security Alerts"
   # Select your workspace
   ```

2. Enable Incoming Webhooks:
   - Go to "Incoming Webhooks" → Activate
   - Click "Add New Webhook to Workspace"
   - Select the channel (e.g., #security-alerts)
   - Copy the Webhook URL

3. Add to GitHub Secrets:
   ```bash
   # Go to Repository Settings → Secrets and variables → Actions
   # New repository secret:
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### 2. PagerDuty Integration (Optional)

For critical security failures (S9-S13 penetration tests):

1. Create Integration in PagerDuty:
   ```bash
   # Go to PagerDuty → Services → New Service
   # Name: "KIMI Security Pipeline"
   # Integration Type: "Events API v2"
   ```

2. Copy the Integration Key

3. Add to GitHub Secrets:
   ```bash
   Name: PAGERDUTY_INTEGRATION_KEY
   Value: your-integration-key
   ```

## Alert Triggers

| Severity | Trigger Condition | Channels |
|----------|------------------|----------|
| **CRITICAL** | S9-S13 Penetration Test Failure | Slack + PagerDuty + GitHub Issue |
| **HIGH** | S1-S8 Security Gate Failure | Slack + GitHub Issue |
| **MEDIUM** | Provisioning Speed Failure | Slack |

## Alert Format

### Slack Alert Example:
```
🚨 Security Pipeline Failed - adelfree2023-dev/KIMI

Severity: CRITICAL
Branch: develop
Failed Gates: S9-S13-PenTest S5-Exception 
Commit: abc123...
Author: username
```

### PagerDuty Alert Example:
```
CRITICAL: Security Pipeline Failed - adelfree2023-dev/KIMI

Failed Gates: S9-S13-PenTest
Repository: adelfree2023-dev/KIMI
Branch: develop
Run URL: https://github.com/.../actions/runs/123
```

## Testing Alerts

To test the alerting system:

```bash
# Temporarily break a test to trigger failure
# Commit and push - should trigger alerts

# Or manually trigger via GitHub CLI:
gh workflow run "CI/CD Pipeline" --ref develop
```

## Troubleshooting

### Slack alerts not working:
- Verify `SLACK_WEBHOOK_URL` secret is set
- Check webhook URL is valid in Slack app settings
- Review Actions logs for curl errors

### PagerDuty alerts not working:
- Verify `PAGERDUTY_INTEGRATION_KEY` secret is set
- Check integration is active in PagerDuty
- Verify severity is CRITICAL (S9-S13 failures only)

## Security Considerations

1. **Webhook URLs are sensitive** - Never commit them to code
2. **Use repository secrets** - Always use GitHub encrypted secrets
3. **Rotate keys periodically** - Especially PagerDuty integration keys
4. **Limit channel access** - Security alerts should be private

## Related Documentation

- [CI/CD Pipeline](../github/ci-cd-pipeline.md)
- [Security Gates](security-gates.md)
- [Incident Response](incident-response.md)

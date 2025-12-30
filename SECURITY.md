# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

We take the security of javascriptgantt seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via GitHub Security Advisories:

1. Navigate to the [Security tab](https://github.com/Sunilsolankiji/javascriptgantt/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

Alternatively, you can report vulnerabilities by opening a new issue with the label `security` (for non-critical issues) or contact the maintainers directly for critical issues.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. XSS, CSRF, SQL injection, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- You should receive a response within 48 hours acknowledging your report
- We will investigate the issue and determine its impact and severity
- We will work on a fix and release a security patch as soon as possible
- We will keep you informed about the progress of the fix
- Once the issue is resolved, we will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## Security Best Practices

When using javascriptgantt in your projects:

1. **Keep Updated**: Always use the latest version of the library
2. **Validate Input**: Sanitize all user input before passing it to the Gantt chart
3. **CSP Headers**: Implement Content Security Policy headers in your application
4. **Regular Audits**: Regularly audit your dependencies using `npm audit`
5. **Secure Configuration**: Review and secure your Gantt chart configuration

## Known Security Considerations

- **XSS Prevention**: When using custom templates or HTML content, ensure all user-provided data is properly sanitized
- **Data Validation**: Validate task data structure before passing to the library
- **Event Handlers**: Be cautious with custom event handlers that execute user-provided code

## Security Updates

Security updates will be released as patch versions and documented in the [CHANGELOG](CHANGELOG.md) with the `[SECURITY]` prefix.

Subscribe to releases on GitHub to receive notifications about security updates.

Thank you for helping keep javascriptgantt and its users safe!

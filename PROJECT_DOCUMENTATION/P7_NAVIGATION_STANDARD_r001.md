# Protocol 7 Navigation Standard r001

**Status:** Project-wide navigation requirement  
**Applies to:** current and future Protocol 7 public HTML, Adventure Path GM files, Player Briefings, campaign dashboards, and project landing pages.

## Required Navigation Chain

Every public Adventure Path HTML page must provide visible navigation that allows the reader to move upward without relying on browser Back:

**Adventure / Briefing → The Continuance Files Current Page → Protocol 7 Project Home → Jade Lion Studios**

### Adventure and Briefing Pages
Must visibly provide:
- **Adventure Path Home** → `continuance-files/current.html`
- **Protocol 7 Home** → repository/project landing page
- **Jade Lion Studios** → `https://jnarquitt.github.io/`

### Continuance Files Landing Pages
Must visibly provide:
- **Protocol 7 Home**
- **Jade Lion Studios**

### Protocol 7 Project Landing Page
Must visibly provide:
- **Jade Lion Studios**

## Permanent Enforcement

`.github/workflows/navigation-guard.yml` is the automated navigation guard. When current or future public HTML is added or changed under the Continuance Files tree, the guard injects the required navigation bar if it is missing. It also ensures the Protocol 7 project landing page retains a Jade Lion Studios return link.

The guard is intentionally idempotent: pages already carrying the navigation marker are not changed again.

## Release / Audit Requirement

Every mission promotion, ecosystem audit, Style & Balance Audit, and release-candidate audit must verify:
- no current public Adventure or Player Briefing is a navigation dead end;
- all upward links resolve correctly;
- the stable current-review page remains the canonical Adventure Path home;
- Protocol 7 Home remains reachable from the campaign layer;
- Jade Lion Studios remains reachable from Protocol 7 Home;
- navigation remains usable on mobile and hidden when printing.

Navigation failure is a release-blocking defect for public HTML.

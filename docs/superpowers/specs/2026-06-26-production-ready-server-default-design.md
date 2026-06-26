# Design Specification - Production-Ready Server Defaults and Security

## Goal

Make DocForge ready for public distribution by setting the production server URL as the default in the CLI and securing the server's production deployment configurations against credential leaks.

## Proposed Changes

### Client Config

#### [MODIFY] [config.js](file:///home/putra/Projects/docforge/client/src/utils/config.js)
- Update `DEFAULT_SERVER_URL` to point to the production server: `http://ip.lubu.biz.id:45557`.

### Docker Configuration

#### [MODIFY] [docker-compose.prod.yml](file:///home/putra/Projects/docforge/docker-compose.prod.yml)
- Replace the hardcoded `AI_API_KEY` value with an environment variable interpolation: `AI_API_KEY=${AI_API_KEY:-}`.

### Package Versioning

#### [MODIFY] [package.json](file:///home/putra/Projects/docforge/package.json)
- Bump version to `0.1.7`.

#### [MODIFY] [package.json](file:///home/putra/Projects/docforge/client/package.json)
- Bump version to `0.1.7`.

#### [MODIFY] [index.js](file:///home/putra/Projects/docforge/client/src/index.js)
- Bump CLI program version to `0.1.7`.

## Verification Plan

### Automated Tests
- Run `npm publish --dry-run` to ensure all packaging criteria are correct.
- Verify CLI server URL resolver defaults correctly to the production endpoint.

### Manual Verification
- Check that the production `docker-compose.prod.yml` file no longer exposes the developer's API key.

# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-04-08

### Added
- Support for automatic handling of manager accounts (MCC)
- Better logging for API queries and responses
- Detailed error messages to help with troubleshooting
- Improved campaign listing across client accounts

### Fixed
- Fixed issue with querying metrics from manager accounts
- Resolved "PROHIBITED_FIELD_IN_SELECT_CLAUSE" errors in Google Ads queries
- Addressed issue with UPDATE operations not supported in the REST Beta API
- Improved error handling across all API methods
- Added better handling for campaign discovery across client accounts

### Changed
- Updated controller methods to use standard function syntax for better compatibility
- Modified budget update method to use simulation due to API limitations
- Enhanced performance when searching for campaigns across multiple accounts

## [1.0.0] - 2025-03-25

### Added
- Initial release
- Basic Google Ads API integration
- Endpoints for bid and budget control
- Campaign and creative performance analysis
- Client account management
- Integration with n8n workflow platform 
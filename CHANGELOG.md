# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2020-05-25
### Added
- Multiple catalog filters can now be used
- Simulation retries to guarantee items quantity in each order
- Payment data is now customized based in payment group

### Changed
- Configuration file moved to .vtexrc **BREAKING CHANGE**

### Fixed
- Bug fixes for edge cases
- Payment system set in config file is now used everywhere
- Validation for catalog filters now works as expected
- Catalog is now filtered correctly to avoid unavailable items in simulations
- Removed side effect affecting the options object

## [0.1.1] - 2020-05-25
### Fixed
- Added sha bang to enable correct CLI execution

## [0.1.0] - 2020-05-25
### Added
- First package version with multiple orders creation and some configurations
- Lots of bugs due to missing data validation
- Process logging during creation and orders report at the end

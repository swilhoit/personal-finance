fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build and upload to TestFlight

### ios setup_certs

```sh
[bundle exec] fastlane ios setup_certs
```

Setup certificates and provisioning profiles

### ios register_devices

```sh
[bundle exec] fastlane ios register_devices
```

Register devices for development

### ios push_certs

```sh
[bundle exec] fastlane ios push_certs
```

Create push notification certificates

### ios build

```sh
[bundle exec] fastlane ios build
```

Build for local testing

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

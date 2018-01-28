# The browser JSON schema

This document helps you to understand the structure of the [browser JSON](https://github.com/mdn/browser-compat-data/tree/master/browsers) files.

#### Browser identifiers

The currently accepted browser identifiers are [defined in the compat-data schema](https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#browser-identifiers). They are re-used for the browser data scheme. No other identifiers are allowed and the file names should also use the browser identifiers.

For example, for the browser identifier `firefox`, the file name is `firefox.json`.

#### File structure

The file `firefox.json` is structured like this:

```json
{
  "browsers": {
    "firefox": {
      "releases": {
        "1.5": {
          "release_date": "2005-11-29",
          "release_notes": "https://developer.mozilla.org/Firefox/Releases/1.5",
          "status": "retired"
        },
      }
    }
  }
}
```
It contains an object with the property `browsers` which then contains an object with the browser identifier as the property name (`firefox`).

Underneath, there is a `releases` object which will hold the various releases of a given browser by their release version number (`"1.5"`).

### Release objects
The release objects consist of the following properties:

* A mandatory `status` property indicating where in the lifetime cycle this release is in. It's an enum accepting these values:
  * `retired`: This release is no longer supported (EOL)
  * `current`: This release is the official latest release.
  * `beta`: This release will the next official release.
  * `nightly`: This release is the current alpha / experimental release (like Firefox Nightly, Chrome Canary).
  * `esr`: This release is an Extended Support Release.
  * `planned`: This release is planned in the future.

* An optional `release_date` property with the `YYYY-MM-DD` release date of the browser's release.

* An optional `release_notes` property which points to release notes. It needs to be a valid URL.

### Exports

This structure is exported for consumers of `mdn-browser-compat-data`:

```js
> const compat = require('mdn-browser-compat-data');
> compat.browsers.firefox.releases['1.5'].status;
// "retired"
```

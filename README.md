# BarcodeDetector Polyfill
Polyfill for BarcodeDetector, part of [shape detection api](https://wicg.github.io/shape-detection-api/)

## Implementation
This is basically a Promise wrapper around DecoderWorker from the [JOB](https://github.com/EddieLa/JOB) barcode decoding library.

Note that currently this polyfill enables detection and decoding of 1D barcodes only, 2D barcodes (EG QR-code) might be added in the future using an additional library.

## Usage
### In the browser
Install:
```
bower install barcode-detector-polyfill
```

Use:
```
<script>
  (function () {
    function loadScript(src, done) {
      var $script = document.createElement('script');
      $script.src = src;
      $script.onload = function() {
        done();
      };
      $script.onerror = function() {
        done(new Error('Failed to load script ' + src));
      };
      document.head.appendChild($script);
    }
    if (BarcodeDetector in window) {
      continueToStartTheApp();
    } else {
      loadScript(
        "bower_components/barcode-detector-polyfill/BarcodeDetector.min.js", 
        continueToStartTheApp
      );
    }
  })()
  // ...
</script>
```

### With webpack
Install:
```
npm install --save barcode-detector-polyfill
```

Use:
```
if ('BarcodeDetector' in window) {
  continueToStartTheApp();
} else {
  require.ensure(['barcode-detector-polyfill'], function(require) {
    const BarcodeDetector = require('barcode-detector-polyfill');
    window.BarcodeDetector = BarcodeDetector;
    continueToStartTheApp();
  }, function(err) {
    console.log('Failed to load BarcodeDetector', err);
  });
}
```

See [demo](https://www.webpackbin.com/bins/-KlO--0RBOGYZXP0wyrl)

## Examples
See the examples folder, or [live demo](https://giladaya.github.io/barcode-detector-polyfill/)

## Browser support
Requires Promises (can also be [polyfilled](https://github.com/stefanpenner/es6-promise)) and typed arrays which are [supported in all modern browsers](http://caniuse.com/#feat=typedarrays), down to IE11.

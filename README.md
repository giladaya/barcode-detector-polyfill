# BarcodeDetector Polyfill
Polyfill for BarcodeDetector, part of [shape detection api](https://wicg.github.io/shape-detection-api/)

## Implementation
This is basically a Promise wrapper around DecoderWorker from the [JOB](https://github.com/EddieLa/JOB) barcode decoding library.

Note that this polyfill enables detection and decoding of 1D barcodes only, 2D barcodes (EG QR-code) might be added in the future using an additional library.

## Usage
See the examples folder

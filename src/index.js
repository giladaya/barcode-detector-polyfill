var Worker = require('worker-loader?inline!./DecoderWorker')

const worker = new Worker();

const DECODE_FORMATS = ['Code128', 'Code93', 'Code39', 'EAN-13', '2Of5', 'Inter2Of5', 'Codabar']

let lastMsgId = 0
const resolves = {}
const rejects = {}

const BarcodeReaderImageCallback = (e) => {
  if (e.data.success === 'localization') {
    // console.log('Localization', e.data.result)
    return;
  }
  if (e.data.success === 'orientationData') {
    // console.log('Orientation', e.data.result)
    return;
  }

  // transform results in e.data.result
  const id = e.data.id
  const resolve = resolves[id]
  // const results = [
  //   {
  //     boundingBox: {
  //       x: 10,
  //       y: 20,
  //       width: 30,
  //       height: 40,
  //     },
  //     cornerPoints: [
  //       {x: 10, y: 10},
  //       {x: 20, y: 10},
  //       {x: 20, y: 20},
  //       {x: 10, y: 20},
  //     ],
  //     rawValue: '1234567890'
  //   }
  // ]

  if (resolve !== undefined) {
    const results = e.data.result.map(res => ({
      boundingBox: res.bBox,
      cornerPoints: [
        {x: res.bBox.x, y: res.bBox.y},
        {x: res.bBox.x + res.bBox.width, y: res.bBox.y},
        {x: res.bBox.x + res.bBox.width, y: res.bBox.y + res.bBox.height},
        {x: res.bBox.x, y: res.bBox.y + res.bBox.height},
      ],
      rawValue: res.Value,
    }))

    resolve(results)
  }

  // cleanup
  delete resolves[id]
  delete rejects[id]
}

let scanCanvas, scanContext

export default class Library {
  constructor() {
    worker.onmessage = BarcodeReaderImageCallback
    scanCanvas = document.createElement('canvas')
    scanCanvas.width = 640
    scanCanvas.height = 480
    scanContext = scanCanvas.getContext('2d')
  }

  detect(image) {
    return new Promise((resolve, reject) => {
      const msgId = lastMsgId++

      // book keeping
      resolves[msgId] = resolve
      rejects[msgId] = reject
      
      scanContext.drawImage(image, 0, 0, scanCanvas.width, scanCanvas.height);

      let msg = {
        scan: scanContext.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data,
        scanWidth: scanCanvas.width,
        scanHeight: scanCanvas.height,
        multiple: true,
        decodeFormats: DECODE_FORMATS,
        cmd: 'normal',
        rotation: 1,
        postOrientation: false,
        id: msgId
      }

      worker.postMessage(msg)

      msg = null
    });
  }
}

(function () {

const TimeKeeper = (function() {
  var startTime;

  return {
    start: function() {
      startTime = Date.now();
    },
    end: function() {
      return (Date.now() - startTime)
    }
  }
})()

const ASPECT_RATIO = 0.5 // aspect ratio of view canvas
const PADDING_V = 0.15    // vertical padding pct between view and work frame
const PADDING_H = 0.25   // horizontal padding pct between view and work frame

// refs
var $video = document.getElementById('camera');
var $viewCanvas = document.getElementById('viewCanvas');
var $workCanvas = document.createElement('canvas');
var $resolution = document.getElementById('resolution');
var $time = document.getElementById('time');
var $result = document.getElementById('result');
var $btnScan = document.getElementById('scan');

var raf = null; //requestAnimationFrame handle
var found = false;
var wwReady = true;

// Inits
attachEvents();
var barcodeDetector = new BarcodeDetector();
initCamera($video, startApp);
initResults();

//---------------
// Functions
//---------------

function attachEvents() {
  $resolution.onchange = function(ev) {
    var width = $resolution.value;
    initCanvasSize(width, $video.videoWidth, ASPECT_RATIO);
  }

  // scan initiated
  $btnScan.onclick = function() {
    found = false;
    if (raf === null) drawFrame(); //start drawing
    initResults();
    doScan();
  }
}

// var constraints = { 
//   video: { 
//     facingMode: ("environment") ,
//     width: 600, 
//     height: 800
//   } 
// };

function initCamera($video, cb) {
  // create constraints for back camera from devices list
  function getBackCamConstraints(devices) {
    devices = devices.filter(function(d) {
      return d.kind === 'videoinput';
    });
    var back = devices.find(function(d) {
      return d.label.toLowerCase().indexOf('back') !== -1;
    }) || (devices.length && devices[devices.length - 1]);
    var constraints = {video: true}
    if (back) {
      constraints.video = {deviceId: back.deviceId};
      // constraints.video = {mandatory: {deviceId: back.deviceId}};
    }
    return constraints;
  }

  // initialize back camera
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
      var constraints = getBackCamConstraints(devices);
      return navigator.mediaDevices.getUserMedia(constraints);
  })
  .then(function(mediaStream) {
    $video.srcObject = mediaStream;
    $video.onloadedmetadata = function(e) {
      $video.play();
      cb();
    };
  })
  .catch(function(err) { 
    alert(err.name);
    console.log(err.name + ": " + err.message); 
  }); // always check for errors at the end.
}

function startApp() {
  initCanvasSize($resolution.value, Math.max($video.videoWidth, 600), ASPECT_RATIO);
  drawFrame();
  doScan();
}

function showResults(result, timeMs) {
  $time.innerText = (timeMs / 1000);
  $result.innerText = result;
}
function initResults() {
  showResults('...', 0);
}

function doScan() {
  TimeKeeper.start();
  var ctx = $workCanvas.getContext("2d");
  var imgData = ctx.getImageData(0, 0, $workCanvas.width, $workCanvas.height);

  barcodeDetector.detect($workCanvas).then(handleDecodeResult)

  //Debarcode.decode(imgData, handleDecodeResult)
}

function drawFrame() {
  if (wwReady) {
    var ctx = $viewCanvas.getContext("2d");
    drawVideo($video, $viewCanvas, ctx);

    var wCtx = $workCanvas.getContext("2d");

    // copy from view to work canvas - before crawing overlays
    var dw = $workCanvas.width,
      dh = $workCanvas.height,
      sw = dw,
      sh = dh,
      sx = $viewCanvas.width * PADDING_H, 
      sy = $viewCanvas.height * PADDING_V;
    wCtx.drawImage($viewCanvas, sx, sy, sw, sh, 0, 0, dw, dh);

    drawLine($viewCanvas, ctx);
    drawMask($viewCanvas, ctx, sx, sy, sw, sh);
  }
  // keep the cycle going
  raf = requestAnimationFrame(drawFrame);
}

function drawVideo($video, $canvas, ctx) {
  var dw = $canvas.width,
    dh = $canvas.height,
    sw = $video.videoWidth,
    sh = Math.ceil(dh / dw * sw)
    sx = Math.floor(($video.videoWidth - sw) / 2);
    sy = Math.floor(($video.videoHeight - sh) / 2);

  // ctx.drawImage(video, 0, 0);
  ctx.drawImage($video, sx, sy, sw, sh, 0, 0, dw, dh);
}

function drawLine($canvas, ctx) {
  var dw = $canvas.width,
    dh = $canvas.height
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)'
  ctx.beginPath();
  ctx.moveTo(dw*PADDING_H, dh*0.5);
  ctx.lineTo(dw*(1 - PADDING_H), dh*0.5);
  ctx.stroke();
}

function drawMask($canvas, ctx, x, y, w, h) {
  const ow = $canvas.width, //outer width
    oh = $canvas.height, // outer height
    vd = (oh - h) / 2, //vertical delta
    hd = (ow - w) /2; // horizontal delta
    ;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, ow, vd);
  ctx.fillRect(0, oh - vd, ow, vd);
  ctx.fillRect(0, vd, hd, h);
  ctx.fillRect(ow - hd, vd, hd, h);
}

function initCanvasSize(width, maxWidth, aspectRatio) {
  var newWidth = Math.min(width, maxWidth);
  $viewCanvas.width = newWidth;
  $viewCanvas.height = Math.ceil(newWidth * aspectRatio);
  $workCanvas.width = $viewCanvas.width * (1 - 2 * PADDING_H);
  $workCanvas.height = $viewCanvas.height * (1 - 2 * PADDING_V);  
}

function handleDecodeResult(results) {
  if (found) {
    return;
  }
  if (results.length > 0) {
    found = true;

    var resStr = results.map(function(result) {return result.rawValue}).join(', ');
    showResults(resStr, TimeKeeper.end())

    // TODO: draw bounding box

    //cancel next scan
    if (raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  } else {
    showResults('...', TimeKeeper.end())
    doScan();
  }
}
})()
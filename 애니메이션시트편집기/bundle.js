(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/js-binary-schema-parser/lib/index.js
  var require_lib = __commonJS({
    "node_modules/js-binary-schema-parser/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.loop = exports.conditional = exports.parse = void 0;
      var parse = function parse2(stream, schema) {
        var result = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        var parent = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : result;
        if (Array.isArray(schema)) {
          schema.forEach(function(partSchema) {
            return parse2(stream, partSchema, result, parent);
          });
        } else if (typeof schema === "function") {
          schema(stream, result, parent, parse2);
        } else {
          var key = Object.keys(schema)[0];
          if (Array.isArray(schema[key])) {
            parent[key] = {};
            parse2(stream, schema[key], result, parent[key]);
          } else {
            parent[key] = schema[key](stream, result, parent, parse2);
          }
        }
        return result;
      };
      exports.parse = parse;
      var conditional = function conditional2(schema, conditionFunc) {
        return function(stream, result, parent, parse2) {
          if (conditionFunc(stream, result, parent)) {
            parse2(stream, schema, result, parent);
          }
        };
      };
      exports.conditional = conditional;
      var loop = function loop2(schema, continueFunc) {
        return function(stream, result, parent, parse2) {
          var arr = [];
          var lastStreamPos = stream.pos;
          while (continueFunc(stream, result, parent)) {
            var newParent = {};
            parse2(stream, schema, result, newParent);
            if (stream.pos === lastStreamPos) {
              break;
            }
            lastStreamPos = stream.pos;
            arr.push(newParent);
          }
          return arr;
        };
      };
      exports.loop = loop;
    }
  });

  // node_modules/js-binary-schema-parser/lib/parsers/uint8.js
  var require_uint8 = __commonJS({
    "node_modules/js-binary-schema-parser/lib/parsers/uint8.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.readBits = exports.readArray = exports.readUnsigned = exports.readString = exports.peekBytes = exports.readBytes = exports.peekByte = exports.readByte = exports.buildStream = void 0;
      var buildStream = function buildStream2(uint8Data) {
        return {
          data: uint8Data,
          pos: 0
        };
      };
      exports.buildStream = buildStream;
      var readByte = function readByte2() {
        return function(stream) {
          return stream.data[stream.pos++];
        };
      };
      exports.readByte = readByte;
      var peekByte = function peekByte2() {
        var offset = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
        return function(stream) {
          return stream.data[stream.pos + offset];
        };
      };
      exports.peekByte = peekByte;
      var readBytes = function readBytes2(length) {
        return function(stream) {
          return stream.data.subarray(stream.pos, stream.pos += length);
        };
      };
      exports.readBytes = readBytes;
      var peekBytes = function peekBytes2(length) {
        return function(stream) {
          return stream.data.subarray(stream.pos, stream.pos + length);
        };
      };
      exports.peekBytes = peekBytes;
      var readString = function readString2(length) {
        return function(stream) {
          return Array.from(readBytes(length)(stream)).map(function(value) {
            return String.fromCharCode(value);
          }).join("");
        };
      };
      exports.readString = readString;
      var readUnsigned = function readUnsigned2(littleEndian) {
        return function(stream) {
          var bytes = readBytes(2)(stream);
          return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
        };
      };
      exports.readUnsigned = readUnsigned;
      var readArray = function readArray2(byteSize, totalOrFunc) {
        return function(stream, result, parent) {
          var total = typeof totalOrFunc === "function" ? totalOrFunc(stream, result, parent) : totalOrFunc;
          var parser = readBytes(byteSize);
          var arr = new Array(total);
          for (var i = 0; i < total; i++) {
            arr[i] = parser(stream);
          }
          return arr;
        };
      };
      exports.readArray = readArray;
      var subBitsTotal = function subBitsTotal2(bits, startIndex, length) {
        var result = 0;
        for (var i = 0; i < length; i++) {
          result += bits[startIndex + i] && Math.pow(2, length - i - 1);
        }
        return result;
      };
      var readBits = function readBits2(schema) {
        return function(stream) {
          var _byte = readByte()(stream);
          var bits = new Array(8);
          for (var i = 0; i < 8; i++) {
            bits[7 - i] = !!(_byte & 1 << i);
          }
          return Object.keys(schema).reduce(function(res, key) {
            var def = schema[key];
            if (def.length) {
              res[key] = subBitsTotal(bits, def.index, def.length);
            } else {
              res[key] = bits[def.index];
            }
            return res;
          }, {});
        };
      };
      exports.readBits = readBits;
    }
  });

  // node_modules/js-binary-schema-parser/lib/schemas/gif.js
  var require_gif = __commonJS({
    "node_modules/js-binary-schema-parser/lib/schemas/gif.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports["default"] = void 0;
      var _ = require_lib();
      var _uint = require_uint8();
      var subBlocksSchema = {
        blocks: function blocks(stream) {
          var terminator = 0;
          var chunks = [];
          var streamSize = stream.data.length;
          var total = 0;
          for (var size = (0, _uint.readByte)()(stream); size !== terminator; size = (0, _uint.readByte)()(stream)) {
            if (!size) break;
            if (stream.pos + size >= streamSize) {
              var availableSize = streamSize - stream.pos;
              chunks.push((0, _uint.readBytes)(availableSize)(stream));
              total += availableSize;
              break;
            }
            chunks.push((0, _uint.readBytes)(size)(stream));
            total += size;
          }
          var result = new Uint8Array(total);
          var offset = 0;
          for (var i = 0; i < chunks.length; i++) {
            result.set(chunks[i], offset);
            offset += chunks[i].length;
          }
          return result;
        }
      };
      var gceSchema = (0, _.conditional)({
        gce: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          byteSize: (0, _uint.readByte)()
        }, {
          extras: (0, _uint.readBits)({
            future: {
              index: 0,
              length: 3
            },
            disposal: {
              index: 3,
              length: 3
            },
            userInput: {
              index: 6
            },
            transparentColorGiven: {
              index: 7
            }
          })
        }, {
          delay: (0, _uint.readUnsigned)(true)
        }, {
          transparentColorIndex: (0, _uint.readByte)()
        }, {
          terminator: (0, _uint.readByte)()
        }]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 249;
      });
      var imageSchema = (0, _.conditional)({
        image: [{
          code: (0, _uint.readByte)()
        }, {
          descriptor: [{
            left: (0, _uint.readUnsigned)(true)
          }, {
            top: (0, _uint.readUnsigned)(true)
          }, {
            width: (0, _uint.readUnsigned)(true)
          }, {
            height: (0, _uint.readUnsigned)(true)
          }, {
            lct: (0, _uint.readBits)({
              exists: {
                index: 0
              },
              interlaced: {
                index: 1
              },
              sort: {
                index: 2
              },
              future: {
                index: 3,
                length: 2
              },
              size: {
                index: 5,
                length: 3
              }
            })
          }]
        }, (0, _.conditional)({
          lct: (0, _uint.readArray)(3, function(stream, result, parent) {
            return Math.pow(2, parent.descriptor.lct.size + 1);
          })
        }, function(stream, result, parent) {
          return parent.descriptor.lct.exists;
        }), {
          data: [{
            minCodeSize: (0, _uint.readByte)()
          }, subBlocksSchema]
        }]
      }, function(stream) {
        return (0, _uint.peekByte)()(stream) === 44;
      });
      var textSchema = (0, _.conditional)({
        text: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          blockSize: (0, _uint.readByte)()
        }, {
          preData: function preData(stream, result, parent) {
            return (0, _uint.readBytes)(parent.text.blockSize)(stream);
          }
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 1;
      });
      var applicationSchema = (0, _.conditional)({
        application: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          blockSize: (0, _uint.readByte)()
        }, {
          id: function id(stream, result, parent) {
            return (0, _uint.readString)(parent.blockSize)(stream);
          }
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 255;
      });
      var commentSchema = (0, _.conditional)({
        comment: [{
          codes: (0, _uint.readBytes)(2)
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 254;
      });
      var schema = [
        {
          header: [{
            signature: (0, _uint.readString)(3)
          }, {
            version: (0, _uint.readString)(3)
          }]
        },
        {
          lsd: [{
            width: (0, _uint.readUnsigned)(true)
          }, {
            height: (0, _uint.readUnsigned)(true)
          }, {
            gct: (0, _uint.readBits)({
              exists: {
                index: 0
              },
              resolution: {
                index: 1,
                length: 3
              },
              sort: {
                index: 4
              },
              size: {
                index: 5,
                length: 3
              }
            })
          }, {
            backgroundColorIndex: (0, _uint.readByte)()
          }, {
            pixelAspectRatio: (0, _uint.readByte)()
          }]
        },
        (0, _.conditional)({
          gct: (0, _uint.readArray)(3, function(stream, result) {
            return Math.pow(2, result.lsd.gct.size + 1);
          })
        }, function(stream, result) {
          return result.lsd.gct.exists;
        }),
        // content frames
        {
          frames: (0, _.loop)([gceSchema, applicationSchema, commentSchema, imageSchema, textSchema], function(stream) {
            var nextCode = (0, _uint.peekByte)()(stream);
            return nextCode === 33 || nextCode === 44;
          })
        }
      ];
      var _default = schema;
      exports["default"] = _default;
    }
  });

  // node_modules/gifuct-js/lib/deinterlace.js
  var require_deinterlace = __commonJS({
    "node_modules/gifuct-js/lib/deinterlace.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.deinterlace = void 0;
      var deinterlace = function deinterlace2(pixels, width) {
        var newPixels = new Array(pixels.length);
        var rows = pixels.length / width;
        var cpRow = function cpRow2(toRow2, fromRow2) {
          var fromPixels = pixels.slice(fromRow2 * width, (fromRow2 + 1) * width);
          newPixels.splice.apply(newPixels, [toRow2 * width, width].concat(fromPixels));
        };
        var offsets = [0, 4, 2, 1];
        var steps = [8, 8, 4, 2];
        var fromRow = 0;
        for (var pass = 0; pass < 4; pass++) {
          for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
            cpRow(toRow, fromRow);
            fromRow++;
          }
        }
        return newPixels;
      };
      exports.deinterlace = deinterlace;
    }
  });

  // node_modules/gifuct-js/lib/lzw.js
  var require_lzw = __commonJS({
    "node_modules/gifuct-js/lib/lzw.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.lzw = void 0;
      var lzw = function lzw2(minCodeSize, data, pixelCount) {
        var MAX_STACK_SIZE = 4096;
        var nullCode = -1;
        var npix = pixelCount;
        var available, clear, code_mask, code_size, end_of_information, in_code, old_code, bits, code, i, datum, data_size, first, top, bi, pi;
        var dstPixels = new Array(pixelCount);
        var prefix = new Array(MAX_STACK_SIZE);
        var suffix = new Array(MAX_STACK_SIZE);
        var pixelStack = new Array(MAX_STACK_SIZE + 1);
        data_size = minCodeSize;
        clear = 1 << data_size;
        end_of_information = clear + 1;
        available = clear + 2;
        old_code = nullCode;
        code_size = data_size + 1;
        code_mask = (1 << code_size) - 1;
        for (code = 0; code < clear; code++) {
          prefix[code] = 0;
          suffix[code] = code;
        }
        var datum, bits, count, first, top, pi, bi;
        datum = bits = count = first = top = pi = bi = 0;
        for (i = 0; i < npix; ) {
          if (top === 0) {
            if (bits < code_size) {
              datum += data[bi] << bits;
              bits += 8;
              bi++;
              continue;
            }
            code = datum & code_mask;
            datum >>= code_size;
            bits -= code_size;
            if (code > available || code == end_of_information) {
              break;
            }
            if (code == clear) {
              code_size = data_size + 1;
              code_mask = (1 << code_size) - 1;
              available = clear + 2;
              old_code = nullCode;
              continue;
            }
            if (old_code == nullCode) {
              pixelStack[top++] = suffix[code];
              old_code = code;
              first = code;
              continue;
            }
            in_code = code;
            if (code == available) {
              pixelStack[top++] = first;
              code = old_code;
            }
            while (code > clear) {
              pixelStack[top++] = suffix[code];
              code = prefix[code];
            }
            first = suffix[code] & 255;
            pixelStack[top++] = first;
            if (available < MAX_STACK_SIZE) {
              prefix[available] = old_code;
              suffix[available] = first;
              available++;
              if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
                code_size++;
                code_mask += available;
              }
            }
            old_code = in_code;
          }
          top--;
          dstPixels[pi++] = pixelStack[top];
          i++;
        }
        for (i = pi; i < npix; i++) {
          dstPixels[i] = 0;
        }
        return dstPixels;
      };
      exports.lzw = lzw;
    }
  });

  // node_modules/gifuct-js/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/gifuct-js/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.decompressFrames = exports.decompressFrame = exports.parseGIF = void 0;
      var _gif = _interopRequireDefault(require_gif());
      var _jsBinarySchemaParser = require_lib();
      var _uint = require_uint8();
      var _deinterlace = require_deinterlace();
      var _lzw = require_lzw();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { "default": obj };
      }
      var parseGIF2 = function parseGIF3(arrayBuffer) {
        var byteData = new Uint8Array(arrayBuffer);
        return (0, _jsBinarySchemaParser.parse)((0, _uint.buildStream)(byteData), _gif["default"]);
      };
      exports.parseGIF = parseGIF2;
      var generatePatch = function generatePatch2(image) {
        var totalPixels = image.pixels.length;
        var patchData = new Uint8ClampedArray(totalPixels * 4);
        for (var i = 0; i < totalPixels; i++) {
          var pos = i * 4;
          var colorIndex = image.pixels[i];
          var color = image.colorTable[colorIndex] || [0, 0, 0];
          patchData[pos] = color[0];
          patchData[pos + 1] = color[1];
          patchData[pos + 2] = color[2];
          patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
        }
        return patchData;
      };
      var decompressFrame = function decompressFrame2(frame, gct, buildImagePatch) {
        if (!frame.image) {
          console.warn("gif frame does not have associated image.");
          return;
        }
        var image = frame.image;
        var totalPixels = image.descriptor.width * image.descriptor.height;
        var pixels = (0, _lzw.lzw)(image.data.minCodeSize, image.data.blocks, totalPixels);
        if (image.descriptor.lct.interlaced) {
          pixels = (0, _deinterlace.deinterlace)(pixels, image.descriptor.width);
        }
        var resultImage = {
          pixels,
          dims: {
            top: frame.image.descriptor.top,
            left: frame.image.descriptor.left,
            width: frame.image.descriptor.width,
            height: frame.image.descriptor.height
          }
        };
        if (image.descriptor.lct && image.descriptor.lct.exists) {
          resultImage.colorTable = image.lct;
        } else {
          resultImage.colorTable = gct;
        }
        if (frame.gce) {
          resultImage.delay = (frame.gce.delay || 10) * 10;
          resultImage.disposalType = frame.gce.extras.disposal;
          if (frame.gce.extras.transparentColorGiven) {
            resultImage.transparentIndex = frame.gce.transparentColorIndex;
          }
        }
        if (buildImagePatch) {
          resultImage.patch = generatePatch(resultImage);
        }
        return resultImage;
      };
      exports.decompressFrame = decompressFrame;
      var decompressFrames2 = function decompressFrames3(parsedGif, buildImagePatches) {
        return parsedGif.frames.filter(function(f) {
          return f.image;
        }).map(function(f) {
          return decompressFrame(f, parsedGif.gct, buildImagePatches);
        });
      };
      exports.decompressFrames = decompressFrames2;
    }
  });

  // main.js
  var import_gifuct_js = __toESM(require_lib2());
  var dropZone = document.getElementById("drop-zone");
  var fileInput = document.getElementById("file-input");
  var fileInfo = document.getElementById("file-info");
  var infoDim = document.getElementById("info-dim");
  var infoFrames = document.getElementById("info-frames");
  var convertBtn = document.getElementById("convert-btn");
  var columnsInput = document.getElementById("columns-input");
  var widthInput = document.getElementById("width-input");
  var heightInput = document.getElementById("height-input");
  var resultSection = document.getElementById("result-section");
  var resultCanvas = document.getElementById("result-canvas");
  var downloadBtn = document.getElementById("download-btn");
  var currentGif = null;
  var frames = [];
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
  convertBtn.addEventListener("click", convertToSpriteSheet);
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `sprite_sheet_${Date.now()}.png`;
    link.href = resultCanvas.toDataURL("image/png");
    link.click();
  });
  async function handleFile(file) {
    if (file.type !== "image/gif") {
      alert("GIF \uD30C\uC77C\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const gif = (0, import_gifuct_js.parseGIF)(arrayBuffer);
      const rawFrames = (0, import_gifuct_js.decompressFrames)(gif, true);
      const width = rawFrames[0].dims.width;
      const height = rawFrames[0].dims.height;
      const frameCount = rawFrames.length;
      infoDim.textContent = `${width} x ${height}`;
      infoFrames.textContent = frameCount;
      fileInfo.classList.remove("hidden");
      convertBtn.disabled = false;
      resultSection.classList.add("hidden");
      currentGif = { width, height, frameCount };
      frames = rawFrames;
      const suggestedCols = Math.ceil(Math.sqrt(frameCount));
      const suggestedRows = Math.ceil(frameCount / suggestedCols);
      columnsInput.value = suggestedCols;
      const rawWidth = width * suggestedCols;
      const rawHeight = height * suggestedRows;
      const suggestedSize = nextPowerOfTwo(Math.max(rawWidth, rawHeight));
      widthInput.value = suggestedSize;
      heightInput.value = suggestedSize;
    } catch (error) {
      console.error("Error parsing GIF:", error);
      alert("GIF \uD30C\uC77C\uC744 \uCC98\uB9AC\uD558\uB294 \uC911\uC5D0 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }
  function coalesceFrames(rawFrames, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const processedFrames = [];
    const patchCanvas = document.createElement("canvas");
    const patchCtx = patchCanvas.getContext("2d");
    rawFrames.forEach((frame, index) => {
      const { dims, patch, disposalType } = frame;
      patchCanvas.width = dims.width;
      patchCanvas.height = dims.height;
      const patchData = patchCtx.createImageData(dims.width, dims.height);
      patchData.data.set(patch);
      patchCtx.putImageData(patchData, 0, 0);
      ctx.drawImage(patchCanvas, dims.left, dims.top);
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = width;
      frameCanvas.height = height;
      frameCanvas.getContext("2d").drawImage(canvas, 0, 0);
      processedFrames.push(frameCanvas);
      if (disposalType === 2) {
        ctx.clearRect(dims.left, dims.top, dims.width, dims.height);
      }
    });
    return processedFrames;
  }
  function nextPowerOfTwo(n) {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
  async function convertToSpriteSheet() {
    if (!currentGif || frames.length === 0) return;
    const originalText = convertBtn.textContent;
    convertBtn.textContent = "\uBCC0\uD658 \uC911...";
    convertBtn.disabled = true;
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const { width, height, frameCount } = currentGif;
      const cols = parseInt(columnsInput.value) || 1;
      const finalWidth = parseInt(widthInput.value) || 1024;
      const finalHeight = parseInt(heightInput.value) || 1024;
      if (cols < 1 || finalWidth < 1 || finalHeight < 1) {
        alert("\uBAA8\uB4E0 \uC785\uB825\uAC12\uC740 \uCD5C\uC18C 1 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
        return;
      }
      const renderedFrames = coalesceFrames(frames, width, height);
      resultCanvas.width = finalWidth;
      resultCanvas.height = finalHeight;
      const ctx = resultCanvas.getContext("2d");
      ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      renderedFrames.forEach((frameCanvas, index) => {
        const x = index % cols * width;
        const y = Math.floor(index / cols) * height;
        ctx.drawImage(frameCanvas, x, y);
      });
      document.getElementById("info-dim").textContent = `${width} x ${height} \u2794 ${finalWidth} x ${finalHeight} px`;
      resultSection.classList.remove("hidden");
      resultSection.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("\uBCC0\uD658 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      convertBtn.textContent = originalText;
      convertBtn.disabled = false;
    }
  }
})();

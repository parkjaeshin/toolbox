import { parseGIF, decompressFrames } from 'gifuct-js';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const infoDim = document.getElementById('info-dim');
const infoFrames = document.getElementById('info-frames');
const convertBtn = document.getElementById('convert-btn');
const columnsInput = document.getElementById('columns-input');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const resultSection = document.getElementById('result-section');
const resultCanvas = document.getElementById('result-canvas');
const downloadBtn = document.getElementById('download-btn');

let currentGif = null;
let frames = [];

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

convertBtn.addEventListener('click', convertToSpriteSheet);

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `sprite_sheet_${Date.now()}.png`;
    link.href = resultCanvas.toDataURL('image/png');
    link.click();
});

// File Handling
async function handleFile(file) {
    if (file.type !== 'image/gif') {
        alert('GIF 파일만 업로드할 수 있습니다.');
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const gif = parseGIF(arrayBuffer);
        const rawFrames = decompressFrames(gif, true);

        // Metadata extraction
        const width = rawFrames[0].dims.width;
        const height = rawFrames[0].dims.height;
        const frameCount = rawFrames.length;

        // Display info
        infoDim.textContent = `${width} x ${height}`;
        infoFrames.textContent = frameCount;
        fileInfo.classList.remove('hidden');
        convertBtn.disabled = false;
        resultSection.classList.add('hidden');

        // Store frames for conversion
        currentGif = { width, height, frameCount };
        frames = rawFrames;

        // Suggest column count (sqrt of frames)
        const suggestedCols = Math.ceil(Math.sqrt(frameCount));
        const suggestedRows = Math.ceil(frameCount / suggestedCols);

        columnsInput.value = suggestedCols;

        // Suggest optimal power-of-two square size based on frames and columns
        const rawWidth = width * suggestedCols;
        const rawHeight = height * suggestedRows;
        const suggestedSize = nextPowerOfTwo(Math.max(rawWidth, rawHeight));

        widthInput.value = suggestedSize;
        heightInput.value = suggestedSize;

    } catch (error) {
        console.error('Error parsing GIF:', error);
        alert('GIF 파일을 처리하는 중에 오류가 발생했습니다.');
    }
}

/**
 * Coalesce frames to handle transparency and disposal methods correctly
 * This is important for many GIFs that only store 'patches' for subsequent frames.
 */
function coalesceFrames(rawFrames, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // To store rendered frames
    const processedFrames = [];

    // Patch canvas for individual frame chunks
    const patchCanvas = document.createElement('canvas');
    const patchCtx = patchCanvas.getContext('2d');

    rawFrames.forEach((frame, index) => {
        const { dims, patch, disposalType } = frame;

        // Setup patch canvas
        patchCanvas.width = dims.width;
        patchCanvas.height = dims.height;
        const patchData = patchCtx.createImageData(dims.width, dims.height);
        patchData.data.set(patch);
        patchCtx.putImageData(patchData, 0, 0);

        // Before drawing this frame, handle disposal of previous frame if necessary
        // disposalType 2: Restore to background color
        // disposalType 3: Restore to previous frame (complex, usually not fully supported in simple parsers)

        // Draw patch to main canvas
        ctx.drawImage(patchCanvas, dims.left, dims.top);

        // Capture result
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = width;
        frameCanvas.height = height;
        frameCanvas.getContext('2d').drawImage(canvas, 0, 0);
        processedFrames.push(frameCanvas);

        // Handle disposal for NEXT frame
        if (disposalType === 2) {
            ctx.clearRect(dims.left, dims.top, dims.width, dims.height);
        }
    });

    return processedFrames;
}

/**
 * Calculates the next power of 2 for a given number.
 * @param {number} n 
 * @returns {number}
 */
function nextPowerOfTwo(n) {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

async function convertToSpriteSheet() {
    if (!currentGif || frames.length === 0) return;

    const originalText = convertBtn.textContent;
    convertBtn.textContent = '변환 중...';
    convertBtn.disabled = true;

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const { width, height, frameCount } = currentGif;

        // Use user defined columns and manual PNG dimensions
        const cols = parseInt(columnsInput.value) || 1;
        const finalWidth = parseInt(widthInput.value) || 1024;
        const finalHeight = parseInt(heightInput.value) || 1024;

        if (cols < 1 || finalWidth < 1 || finalHeight < 1) {
            alert('모든 입력값은 최소 1 이상이어야 합니다.');
            return;
        }

        // 1. Coalesce frames first to look correct
        const renderedFrames = coalesceFrames(frames, width, height);

        // 2. Set up result canvas
        resultCanvas.width = finalWidth;
        resultCanvas.height = finalHeight;
        const ctx = resultCanvas.getContext('2d');

        // Clear canvas with transparent black (default)
        ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);

        // 3. Draw frames onto grid starting from top-left (0,0)
        // Note: Arrangement depends ONLY on 'cols'
        renderedFrames.forEach((frameCanvas, index) => {
            const x = (index % cols) * width;
            const y = Math.floor(index / cols) * height;
            ctx.drawImage(frameCanvas, x, y);
        });

        // Update info display with final dimensions
        document.getElementById('info-dim').textContent = `${width} x ${height} ➔ ${finalWidth} x ${finalHeight} px`;

        // 6. Show result
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error(err);
        alert('변환 중 오류가 발생했습니다.');
    } finally {
        convertBtn.textContent = originalText;
        convertBtn.disabled = false;
    }
}

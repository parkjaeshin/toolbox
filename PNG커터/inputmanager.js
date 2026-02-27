// inputManager.js
// Handles mouse interactions, drawing the crop selection UI, and cropping the original image.

const InputManager = (() => {
    let canvas, ctx, originalImage, renderContext;

    // State
    let boxWidth = 100;
    let boxHeight = 100;
    let boxX = 0;
    let boxY = 0;

    let isDraggingBox = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    let activeHandle = null; // 'tl', 'tr', 'bl', 'br'
    const HANDLE_RADIUS = 5;
    const HIT_RADIUS = 12; // Larger area for easier clicking
    const MIN_SIZE = 10;

    let widthInput, heightInput;

    // Call this after image is loaded to setup interaction
    function init(targetCanvas, sourceImage, contextObj) {
        canvas = targetCanvas;
        ctx = canvas.getContext('2d');
        originalImage = sourceImage;
        renderContext = contextObj;

        // Setup inputs
        widthInput = document.getElementById('cropWidthInput');
        heightInput = document.getElementById('cropHeightInput');

        if (widthInput && !widthInput.dataset.bound) {
            widthInput.addEventListener('input', (e) => {
                boxWidth = Math.max(parseInt(e.target.value, 10) || MIN_SIZE, MIN_SIZE);
                draw();
            });
            widthInput.dataset.bound = 'true';
        }

        if (heightInput && !heightInput.dataset.bound) {
            heightInput.addEventListener('input', (e) => {
                boxHeight = Math.max(parseInt(e.target.value, 10) || MIN_SIZE, MIN_SIZE);
                draw();
            });
            heightInput.dataset.bound = 'true';
        }

        // Initialize box dimensions and position
        boxWidth = parseInt(widthInput.value, 10) || 100;
        boxHeight = parseInt(heightInput.value, 10) || 100;

        boxX = canvas.width / 2 - boxWidth / 2;
        boxY = canvas.height / 2 - boxHeight / 2;

        // Clean up old events if re-initializing
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        // Bind new events
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        const cropBtn = document.getElementById('doCropBtn');
        if (cropBtn && !cropBtn.dataset.bound) {
            cropBtn.addEventListener('click', extractCrop);
            cropBtn.dataset.bound = 'true';
        }

        // Draw initially to show the box
        draw();
    }

    // Called by general.js on window resize
    function updateCanvasGeometry(contextObj = renderContext) {
        renderContext = window.General ? window.General.getRenderContext() : contextObj;
        draw();
    }

    function reset() {
        isDraggingBox = false;
        activeHandle = null;
        canvas = null;
        originalImage = null;
        renderContext = null;
        if (canvas) {
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mousemove', onMouseMove);
        }
        window.removeEventListener('mouseup', onMouseUp);
    }

    function getMousePos(evt) {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function getDistance(x1, y1, x2, y2) {
        return Math.hypot(x1 - x2, y1 - y2);
    }

    function getHandleHit(pos) {
        if (getDistance(pos.x, pos.y, boxX, boxY) <= HIT_RADIUS) return 'tl';
        if (getDistance(pos.x, pos.y, boxX + boxWidth, boxY) <= HIT_RADIUS) return 'tr';
        if (getDistance(pos.x, pos.y, boxX, boxY + boxHeight) <= HIT_RADIUS) return 'bl';
        if (getDistance(pos.x, pos.y, boxX + boxWidth, boxY + boxHeight) <= HIT_RADIUS) return 'br';
        return null;
    }

    function syncInputs() {
        if (widthInput) widthInput.value = Math.round(boxWidth);
        if (heightInput) heightInput.value = Math.round(boxHeight);
    }

    function onMouseDown(evt) {
        if (!originalImage || !renderContext) return;

        const pos = getMousePos(evt);

        // Check handle hit first
        activeHandle = getHandleHit(pos);
        if (activeHandle) {
            isDraggingBox = false;
            return;
        }

        // Check box hit
        if (pos.x >= boxX && pos.x <= boxX + boxWidth &&
            pos.y >= boxY && pos.y <= boxY + boxHeight) {
            isDraggingBox = true;
            dragOffsetX = pos.x - boxX;
            dragOffsetY = pos.y - boxY;
        }
    }

    function onMouseMove(evt) {
        const pos = getMousePos(evt);

        if (!isDraggingBox && !activeHandle) {
            // Update cursor based on position
            if (canvas) {
                const hit = getHandleHit(pos);
                if (hit === 'tl' || hit === 'br') canvas.style.cursor = 'nwse-resize';
                else if (hit === 'tr' || hit === 'bl') canvas.style.cursor = 'nesw-resize';
                else if (pos.x >= boxX && pos.x <= boxX + boxWidth && pos.y >= boxY && pos.y <= boxY + boxHeight) {
                    canvas.style.cursor = 'move';
                } else {
                    canvas.style.cursor = 'default';
                }
            }
            return;
        }

        if (activeHandle) {
            const right = boxX + boxWidth;
            const bottom = boxY + boxHeight;

            if (activeHandle === 'tl') {
                boxX = Math.min(pos.x, right - MIN_SIZE);
                boxY = Math.min(pos.y, bottom - MIN_SIZE);
                boxWidth = right - boxX;
                boxHeight = bottom - boxY;
            } else if (activeHandle === 'tr') {
                boxWidth = Math.max(pos.x - boxX, MIN_SIZE);
                boxY = Math.min(pos.y, bottom - MIN_SIZE);
                boxHeight = bottom - boxY;
            } else if (activeHandle === 'bl') {
                boxX = Math.min(pos.x, right - MIN_SIZE);
                boxWidth = right - boxX;
                boxHeight = Math.max(pos.y - boxY, MIN_SIZE);
            } else if (activeHandle === 'br') {
                boxWidth = Math.max(pos.x - boxX, MIN_SIZE);
                boxHeight = Math.max(pos.y - boxY, MIN_SIZE);
            }
            syncInputs();
        } else if (isDraggingBox) {
            boxX = pos.x - dragOffsetX;
            boxY = pos.y - dragOffsetY;
        }

        // Redraw base image + selection box
        draw();
    }

    function onMouseUp(evt) {
        if (!isDraggingBox && !activeHandle) return;

        isDraggingBox = false;
        activeHandle = null;

        // Redraw one last time
        draw();


    }

    function draw() {
        if (!window.General || typeof window.General.renderImageToCanvas !== 'function' || !canvas) return;

        window.General.renderImageToCanvas();

        // 1. 반투명 배경 (구멍 뚫기 방식)
        // 전체 캔버스를 덮지만, 우리가 그리는 경로(Path)를 뺀 나머지를 채우는 방법(evenodd) 사용
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 0.5 정도의 반투명
        ctx.beginPath();
        // 전체 바깥 테두리
        ctx.rect(0, 0, canvas.width, canvas.height);
        // 잘라낼 구멍 (드래그 박스 영역)
        ctx.rect(boxX, boxY, boxWidth, boxHeight);
        // 전체 박스에서 안쪽 구멍을 잘라내서 칠함
        ctx.fill("evenodd");

        // 2. 테두리(초록 선) 그리기
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // 3. 십자선(Crosshair) 그리기
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // 흰색 반투명 선
        ctx.lineWidth = 1;

        const centerX = boxX + boxWidth / 2;
        const centerY = boxY + boxHeight / 2;

        ctx.beginPath();
        // 수직선 그리기 (박스의 세로축 중심선)
        ctx.moveTo(centerX, boxY);
        ctx.lineTo(centerX, boxY + boxHeight);
        // 수평선 그리기 (박스의 가로축 중심선)
        ctx.moveTo(boxX, centerY);
        ctx.lineTo(boxX + boxWidth, centerY);
        ctx.stroke();

        // 4. 조절점(4개 모서리 점) 그리기
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;

        function drawHandle(x, y) {
            ctx.beginPath();
            ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        drawHandle(boxX, boxY);
        drawHandle(boxX + boxWidth, boxY);
        drawHandle(boxX, boxY + boxHeight);
        drawHandle(boxX + boxWidth, boxY + boxHeight);
    }

    function extractCrop() {
        const rectX = boxX;
        const rectY = boxY;
        const rectW = boxWidth;
        const rectH = boxHeight;

        if (!renderContext) return;

        const { scale, offsetX, offsetY } = renderContext;

        // Map Canvas UI coordinates back to Original Image Pixel coordinates
        const sourceX = (rectX - offsetX) / scale;
        const sourceY = (rectY - offsetY) / scale;
        const sourceW = rectW / scale;
        const sourceH = rectH / scale;

        // Restrict bounds so we don't crop outside the actual image boundary
        const cx = Math.max(0, sourceX);
        const cy = Math.max(0, sourceY);

        // Adjust width/height if starting point was negative (off-image left/top)
        const leftAdjust = cx - sourceX;
        const topAdjust = cy - sourceY;

        let cw = sourceW - leftAdjust;
        let ch = sourceH - topAdjust;

        // Restrict width/height so we don't go past the right/bottom edge
        if (cx + cw > originalImage.width) {
            cw = originalImage.width - cx;
        }
        if (cy + ch > originalImage.height) {
            ch = originalImage.height - cy;
        }

        // If selection is entirely outside image bounds, abort
        if (cw <= 0 || ch <= 0) {
            console.log("Crop area out of image bounds");
            return;
        }

        // Create an off-screen canvas to capture the raw pixels
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cw;
        tempCanvas.height = ch;
        const tCtx = tempCanvas.getContext('2d');

        // Draw ONLY the selected slice from the raw image onto tempCanvas
        tCtx.drawImage(
            originalImage,
            cx, cy, cw, ch,        // Source rect
            0, 0, cw, ch           // Dest rect on temp canvas
        );

        // Convert slice to data URL
        const dataUrl = tempCanvas.toDataURL('image/png');

        // Pass it to General.js to display
        if (typeof window.displayCroppedResult === 'function') {
            window.displayCroppedResult(dataUrl);
        }
    }

    // Expose public API
    return {
        init,
        updateCanvasGeometry,
        reset
    };
})();

// Attach to global scope to allow general.js to find it
window.InputManager = InputManager;

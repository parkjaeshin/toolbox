// inputManager.js
// Handles mouse interactions, drawing the crop selection UI, and cropping the original image.

const InputManager = (() => {
    let canvas, ctx, originalImage, renderContext;

    // State
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    // Call this after image is loaded to setup interaction
    function init(targetCanvas, sourceImage, contextObj) {
        canvas = targetCanvas;
        ctx = canvas.getContext('2d');
        originalImage = sourceImage;
        renderContext = contextObj;

        // Clean up old events if re-initializing
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        // Bind new events
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        // Bind mouseup to window to catch drags ending outside canvas
        window.addEventListener('mouseup', onMouseUp);
    }

    // Called by general.js on window resize
    function updateCanvasGeometry(contextObj = renderContext) {
        // Just refresh stored render context if needed
        renderContext = window.General ? window.General.getRenderContext() : contextObj;
    }

    function reset() {
        isDragging = false;
        canvas = null;
        originalImage = null;
        renderContext = null;
        if (canvas) {
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mousemove', onMouseMove);
        }
        window.removeEventListener('mouseup', onMouseUp);
    }

    // Utility: Get exact mouse coordinates relative to the canvas
    function getMousePos(evt) {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function onMouseDown(evt) {
        if (!originalImage || !renderContext) return;

        isDragging = true;
        const pos = getMousePos(evt);
        startX = pos.x;
        startY = pos.y;
        endX = pos.x;
        endY = pos.y;
    }

    function onMouseMove(evt) {
        if (!isDragging) return;

        const pos = getMousePos(evt);
        endX = pos.x;
        endY = pos.y;

        // Redraw base image + selection box
        draw();
    }

    function onMouseUp(evt) {
        if (!isDragging) return;
        isDragging = false;

        // Redraw one last time
        draw();

        // Handle Crop extraction if area is large enough
        if (Math.abs(endX - startX) > 5 && Math.abs(endY - startY) > 5) {
            extractCrop();
        }

        // Clear selection box from Main Canvas UI after crop operation ends
        // setTimeout(() => {
        //     window.General.renderImageToCanvas();
        // }, 500); // Visual delay optional
    }

    function draw() {
        if (!window.General || typeof window.General.renderImageToCanvas !== 'function') return;

        // Let general.js redraw the base image cleanly
        window.General.renderImageToCanvas();

        if (isDragging) {
            // Draw dark overlay everywhere EXCEPT the selected box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Full dim

            const boxWidth = endX - startX;
            const boxHeight = endY - startY;

            // "Cut out" the selected area (make it bright again)
            ctx.clearRect(startX, startY, boxWidth, boxHeight);

            // Re-draw only that slice of the original image to simulate the transparent window
            // Since clearRect just shows the background color of the container,
            // we actually need to composite or re-draw the image slice.
            // A simpler approach using canvas globalCompositeOperation:

            // Draw selection box border
            ctx.strokeStyle = '#4CAF50'; // Using accent color
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, boxWidth, boxHeight);
        }
    }

    function extractCrop() {
        // Calculate the bounding box of the selection
        const rectX = Math.min(startX, endX);
        const rectY = Math.min(startY, endY);
        const rectW = Math.abs(startX - endX);
        const rectH = Math.abs(startY - endY);

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
            window.General.renderImageToCanvas(); // clear overlay
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

        // Clear selection overlay on main display
        window.General.renderImageToCanvas();
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

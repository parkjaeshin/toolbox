// general.js
// Handles file upload, image rendering, and displaying cropped results.

const General = (() => {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const resetBtn = document.getElementById('resetBtn');
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultsContainer = document.getElementById('croppedImagesContainer');

    // State
    let currentImage = null; // Store the original Image object
    let imageScale = 1;      // Ratio to convert display coordinates to original image coordinates
    let drawOffsetX = 0;     // X offset where image is drawn on canvas
    let drawOffsetY = 0;     // Y offset where image is drawn on canvas

    // Initialize Event Listeners
    function init() {
        imageInput.addEventListener('change', handleImageUpload);
        resetBtn.addEventListener('click', resetApp);

        // Handle window resize to re-render the canvas correctly
        window.addEventListener('resize', () => {
            if (currentImage) {
                renderImageToCanvas();
                // inputManager needs to know about geometry changes
                if (window.InputManager && window.InputManager.updateCanvasGeometry) {
                    window.InputManager.updateCanvasGeometry();
                }
            }
        });
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.type !== 'image/png') {
            alert('Please upload a PNG image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                renderImageToCanvas();

                // Initialize input manager once the image is loaded
                if (window.InputManager) {
                    window.InputManager.init(canvas, currentImage, getRenderContext());
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderImageToCanvas() {
        if (!currentImage) return;

        const container = canvas.parentElement;

        // Set canvas internal resolution to match its container's actual size
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to fit the image inside the canvas while maintaining aspect ratio
        const scaleX = canvas.width / currentImage.width;
        const scaleY = canvas.height / currentImage.height;
        imageScale = Math.min(scaleX, scaleY); // Fit entirely inside the area

        const drawWidth = currentImage.width * imageScale;
        const drawHeight = currentImage.height * imageScale;

        // Center the image
        drawOffsetX = (canvas.width - drawWidth) / 2;
        drawOffsetY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(currentImage, drawOffsetX, drawOffsetY, drawWidth, drawHeight);
    }

    // Helper to provide context data to inputManager
    function getRenderContext() {
        return {
            scale: imageScale,
            offsetX: drawOffsetX,
            offsetY: drawOffsetY
        };
    }

    // Called by inputManager to trigger a UI update with the new image
    function displayCroppedResult(dataUrl) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cropped-item';

        const img = document.createElement('img');
        img.src = dataUrl;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `cropped_${Date.now()}.png`;
        link.className = 'download-link';
        link.textContent = 'Download';

        itemDiv.appendChild(img);
        itemDiv.appendChild(link);

        // Prepend to show newest first
        resultsContainer.prepend(itemDiv);
    }

    function resetApp() {
        currentImage = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        imageInput.value = '';
        resultsContainer.innerHTML = '';
        if (window.InputManager && window.InputManager.reset) {
            window.InputManager.reset();
        }
    }

    // Expose public API
    return {
        init,
        displayCroppedResult,
        renderImageToCanvas, // Allow re-rendering from inputManager if needed
        getRenderContext
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', General.init);

// Expose slightly globally the callback for inputManager
window.displayCroppedResult = General.displayCroppedResult;

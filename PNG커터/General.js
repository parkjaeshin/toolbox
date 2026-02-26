// general.js
// Handles file upload (Drag & Drop + File Input), UI state toggling, and displaying results

const General = (() => {
    // DOM Elements
    const uploadZone = document.getElementById('uploadZone');
    const canvasZone = document.getElementById('canvasZone');
    const fileInput = document.getElementById('fileInput');
    const resetBtn = document.getElementById('resetImageBtn');
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    const resultsContainer = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyResultsState');
    const itemsCountEl = document.getElementById('itemsCount');

    // State
    let currentImage = null;
    let imageScale = 1;
    let drawOffsetX = 0;
    let drawOffsetY = 0;
    let croppedCount = 0;

    function init() {
        // 1. File Input handling
        fileInput.addEventListener('change', handleFileInput);

        // 2. Drag & Drop handling
        setupDragAndDrop();

        // 3. Reset handling
        resetBtn.addEventListener('click', resetApp);

        // 4. Resize handling
        window.addEventListener('resize', handleResize);
    }

    function setupDragAndDrop() {
        // Prevent default drag behaviors to allow drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Add visual cues when dragging files over
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => uploadZone.classList.add('drag-active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('drag-active'), false);
        });

        // Handle the actual drop
        uploadZone.addEventListener('drop', handleDrop, false);
    }

    function handleDrop(e) {
        const file = e.dataTransfer.files[0];
        processFile(file);
    }

    function handleFileInput(e) {
        const file = e.target.files[0];
        processFile(file);
    }

    function processFile(file) {
        if (!file) return;

        // Check if the file is a PNG
        if (file.type !== 'image/png') {
            alert('에러: PNG 파일만 업로드 가능합니다. (Error: Only PNG files are allowed)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;

                // Switch UI from Upload Zone to Canvas Zone
                uploadZone.classList.add('hidden');
                canvasZone.classList.remove('hidden');

                const divider = document.getElementById('cropActionDivider');
                if (divider) divider.classList.remove('hidden');

                // Give DOM a tiny moment to render the new unhidden container sizes
                setTimeout(() => {
                    renderImageToCanvas();
                    // Initialize or reset InputManager
                    if (window.InputManager) {
                        window.InputManager.init(canvas, currentImage, getRenderContext());
                    }
                }, 10);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleResize() {
        if (currentImage && !canvasZone.classList.contains('hidden')) {
            renderImageToCanvas();
            if (window.InputManager && window.InputManager.updateCanvasGeometry) {
                window.InputManager.updateCanvasGeometry();
            }
        }
    }

    function renderImageToCanvas() {
        if (!currentImage) return;

        // Get the parent wrapper's size
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling (fit inside canvas, maintaining aspect ratio)
        const scaleX = canvas.width / currentImage.width;
        const scaleY = canvas.height / currentImage.height;
        imageScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 to leave a tiny bit of breathing room/margin

        const drawWidth = currentImage.width * imageScale;
        const drawHeight = currentImage.height * imageScale;

        // Center on canvas
        drawOffsetX = (canvas.width - drawWidth) / 2;
        drawOffsetY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(currentImage, drawOffsetX, drawOffsetY, drawWidth, drawHeight);
    }

    function getRenderContext() {
        return {
            scale: imageScale,
            offsetX: drawOffsetX,
            offsetY: drawOffsetY
        };
    }

    // Called by inputManager to inject the result HTML
    function displayCroppedResult(dataUrl) {
        // Hide empty state on first crop
        if (emptyState && !emptyState.classList.contains('hidden')) {
            emptyState.classList.add('hidden');
        }

        croppedCount++;
        itemsCountEl.textContent = croppedCount;

        // Create card layout
        const card = document.createElement('div');
        card.className = 'result-card';

        // Image Frame
        const imgFrame = document.createElement('div');
        imgFrame.className = 'result-image-frame';
        const img = document.createElement('img');
        img.src = dataUrl;
        imgFrame.appendChild(img);

        // Actions Frame
        const actionsFrame = document.createElement('div');
        actionsFrame.className = 'result-actions';
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `crop_${Date.now()}.png`;
        link.className = 'btn btn-download';

        // Add SVG icon to download button
        link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Save PNG`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-icon-only';
        deleteBtn.title = 'Delete item';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        deleteBtn.addEventListener('click', () => {
            card.remove();
            croppedCount--;
            itemsCountEl.textContent = croppedCount;
            // Show empty state again if list is empty
            if (croppedCount === 0 && emptyState) {
                emptyState.classList.remove('hidden');
            }
        });

        actionsFrame.appendChild(link);
        actionsFrame.appendChild(deleteBtn);

        card.appendChild(imgFrame);
        card.appendChild(actionsFrame);

        // Add to the top of the list
        resultsContainer.prepend(card);
    }

    function resetApp() {
        currentImage = null;
        fileInput.value = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // UI reset
        canvasZone.classList.add('hidden');
        uploadZone.classList.remove('hidden');

        const divider = document.getElementById('cropActionDivider');
        if (divider) divider.classList.add('hidden');

        if (window.InputManager && window.InputManager.reset) {
            window.InputManager.reset();
        }
    }

    return {
        init,
        displayCroppedResult,
        renderImageToCanvas,
        getRenderContext
    };
})();

// Wait for DOM
document.addEventListener('DOMContentLoaded', General.init);

// Expose globally for inputManager
window.displayCroppedResult = General.displayCroppedResult;
window.General = General;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const mergeBtn = document.getElementById('merge-btn');
const downloadBtn = document.getElementById('download-btn');
const directionSelect = document.getElementById('merge-direction');
const columnsGroup = document.getElementById('columns-group');
const maxColumnsInput = document.getElementById('max-columns');
const spacingInput = document.getElementById('spacing');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');

let uploadedFiles = [];

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'));
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

directionSelect.addEventListener('change', () => {
    columnsGroup.style.display = directionSelect.value === 'grid' ? 'flex' : 'none';
});

mergeBtn.addEventListener('click', mergeImages);

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'merged-sprite-sheet.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => file.type === 'image/png');
    
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const id = Date.now() + Math.random();
                uploadedFiles.push({ id, img, name: file.name });
                renderFileList();
                updateMergeButton();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderFileList() {
    fileList.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <img src="${file.img.src}" title="${file.name}">
            <button class="remove-btn" onclick="removeFile(${index})">&times;</button>
        `;
        fileList.appendChild(item);
    });
}

window.removeFile = (index) => {
    uploadedFiles.splice(index, 1);
    renderFileList();
    updateMergeButton();
};

function updateMergeButton() {
    mergeBtn.disabled = uploadedFiles.length === 0;
}

async function mergeImages() {
    if (uploadedFiles.length === 0) return;

    const direction = directionSelect.value;
    const spacing = parseInt(spacingInput.value) || 0;
    const maxCols = parseInt(maxColumnsInput.value) || 1;

    let totalWidth = 0;
    let totalHeight = 0;
    const positions = [];

    if (direction === 'horizontal') {
        totalHeight = Math.max(...uploadedFiles.map(f => f.img.height));
        let currentX = 0;
        uploadedFiles.forEach(f => {
            positions.push({ x: currentX, y: 0 });
            currentX += f.img.width + spacing;
        });
        totalWidth = currentX - spacing;
    } else if (direction === 'vertical') {
        totalWidth = Math.max(...uploadedFiles.map(f => f.img.width));
        let currentY = 0;
        uploadedFiles.forEach(f => {
            positions.push({ x: 0, y: currentY });
            currentY += f.img.height + spacing;
        });
        totalHeight = currentY - spacing;
    } else if (direction === 'grid') {
        const rowHeights = [];
        const colWidths = [];
        
        // 간단한 그리드 계산 (모든 이미지 크기가 같다고 가정 시 유리하지만, 달라도 대응 가능하도록 계산)
        for (let i = 0; i < uploadedFiles.length; i++) {
            const row = Math.floor(i / maxCols);
            const col = i % maxCols;
            
            rowHeights[row] = Math.max(rowHeights[row] || 0, uploadedFiles[i].img.height);
            colWidths[col] = Math.max(colWidths[col] || 0, uploadedFiles[i].img.width);
        }

        totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * spacing;
        totalHeight = rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * spacing;

        for (let i = 0; i < uploadedFiles.length; i++) {
            const row = Math.floor(i / maxCols);
            const col = i % maxCols;
            
            let x = 0;
            for (let c = 0; c < col; c++) x += colWidths[c] + spacing;
            
            let y = 0;
            for (let r = 0; r < row; r++) y += rowHeights[r] + spacing;
            
            positions.push({ x, y });
        }
    }

    canvas.width = totalWidth;
    canvas.height = totalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    uploadedFiles.forEach((f, i) => {
        ctx.drawImage(f.img, positions[i].x, positions[i].y);
    });

    downloadBtn.style.display = 'block';
    canvas.scrollIntoView({ behavior: 'smooth' });
}

console.log("Game script loaded");

// Oyun değişkenleri
let tokens = 0;
let energy = 3;
let clicksRemaining = 300;

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dinozor resmi
const dinoImage = new Image();
dinoImage.src = 'dino1.png';

let dinoX, dinoY, dinoWidth, dinoHeight; // Dinozorun konumu ve boyutu

function startGame() {
    console.log("Starting game");
    resizeCanvas();
    dinoImage.onload = () => {
        drawDino();
        setupClickHandler(); // Resim yüklendikten sonra tıklama olayını ayarla
    };
}

function resizeCanvas() {
    const scale = window.devicePixelRatio; // Cihazın piksel oranını al
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(scale, scale); // Çizim bağlamını ölçekle
    drawDino();
}

function drawDino() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dinoImage.complete && dinoImage.naturalWidth > 0) {
        const scale = Math.min(window.innerWidth / dinoImage.naturalWidth, window.innerHeight / dinoImage.naturalHeight) * 0.8;
        dinoWidth = Math.round(dinoImage.naturalWidth * scale);
        dinoHeight = Math.round(dinoImage.naturalHeight * scale);
        dinoX = Math.round((window.innerWidth - dinoWidth) / 2);
        dinoY = Math.round((window.innerHeight - dinoHeight) / 2);
        
        // Geçici canvas oluştur
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = dinoWidth * 2;
        tempCanvas.height = dinoHeight * 2;
        
        // Resmi geçici canvas'a büyük boyutta çiz
        tempCtx.drawImage(dinoImage, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Geçici canvas'ı ana canvas'a küçülterek çiz
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(tempCanvas, dinoX, dinoY, dinoWidth, dinoHeight);
        
        console.log("Dino drawn at:", dinoX, dinoY, dinoWidth, dinoHeight);
    } else {
        console.log("Dino image not ready, drawing placeholder");
        ctx.fillStyle = 'green';
        ctx.fillRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
    }
}

function setupClickHandler() {
    canvas.addEventListener('click', handleClick);
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * window.devicePixelRatio;
    const y = (event.clientY - rect.top) * window.devicePixelRatio;

    console.log(`Click at: (${x}, ${y})`);
    console.log(`Dino bounds: x=${dinoX}, y=${dinoY}, width=${dinoWidth}, height=${dinoHeight}`);

    if (x >= dinoX && x <= dinoX + dinoWidth && y >= dinoY && y <= dinoY + dinoHeight) {
        console.log("Dino clicked!");
        if (energy > 0) {
            if (clicksRemaining <= 0) {
                energy--;
                clicksRemaining = 300;
            }
            tokens++;
            clicksRemaining--;
            createClickEffect(event.clientX, event.clientY);
            updateUI();
        }
    }
}

function createClickEffect(x, y) {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'clickEffect';
    clickEffect.style.left = `${x}px`;
    clickEffect.style.top = `${y}px`;
    clickEffect.textContent = '+1';
    document.body.appendChild(clickEffect);

    setTimeout(() => {
        clickEffect.remove();
    }, 1000);
}

function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/3`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: 1`;
}

window.addEventListener('resize', resizeCanvas);

window.onload = function() {
    startGame();
};

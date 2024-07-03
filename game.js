// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let energyRefillsToday = 0;
let clicksRemaining = 30; // Her enerji için 10 tıklama hakkı

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');

// Resimleri yükleme
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];

function loadImages() {
    return Promise.all(dinoImagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path;
        });
    }));
}

// Canvas boyutlandırma
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Enerji yenileme
function refillEnergy() {
    const now = Date.now();
    const hoursPassed = (now - lastEnergyRefillTime) / (1000 * 60 * 60);
    const energyToAdd = Math.floor(hoursPassed / 4);
    
    if (energyToAdd > 0) {
        energy = Math.min(maxEnergy, energy + energyToAdd);
        lastEnergyRefillTime = now;
        clicksRemaining = energy * 10;
        updateUI();
    }
}

// Tıklama işlemi
boostButton.addEventListener('click', function() {
    if (energy > 0 && clicksRemaining > 0) {
        tokens++;
        clicksRemaining--;
        if (clicksRemaining === 0) {
            energy--;
            clicksRemaining = 10;
        }
        updateUI();
    }
});

// UI güncelleme
function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
    boostButton.disabled = energy === 0 || clicksRemaining === 0;
}

// Dinozor çizme
function drawDino() {
    const dinoIndex = Math.min(level - 1, dinoImages.length - 1);
    const img = dinoImages[dinoIndex];
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// Oyun döngüsü
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDino();
    refillEnergy();
    requestAnimationFrame(gameLoop);
}

// Oyunu başlatma
function startGame() {
    resizeCanvas();
    updateUI();
    gameLoop();
}

// Event listener'lar
window.addEventListener('resize', resizeCanvas);

// Oyunu yükleme ve başlatma
loadImages().then(loadedImages => {
    dinoImages = loadedImages;
    startGame();
}).catch(error => {
    console.error("Error loading images:", error);
});
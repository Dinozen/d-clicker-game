// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300; // Her enerji için 100 tıklama hakkı
let telegramId = '';

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// Verileri yükleme
function loadUserData() {
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens;
        level = data.level;
        energy = data.energy;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime);
        clicksRemaining = data.clicksRemaining;
    }
    updateUI();
}

// Verileri kaydetme
function saveUserData() {
    const data = {
        tokens,
        level,
        energy,
        lastEnergyRefillTime,
        clicksRemaining
    };
    localStorage.setItem(telegramId, JSON.stringify(data));
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
        clicksRemaining = energy * 100;
        updateUI();
        saveUserData();
    }
}

// Tıklama işlemi
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isClickOnDino(x, y) && energy > 0 && clicksRemaining > 0) {
        tokens++;
        clicksRemaining--;
        if (clicksRemaining === 0) {
            energy--;
            clicksRemaining = 100;
        }
        showClickEffect(x, y);
        updateUI();
        saveUserData();
    }
});

// Dinozora tıklama kontrolü
function isClickOnDino(x, y) {
    const dinoIndex = Math.min(level - 1, dinoImages.length - 1);
    const img = dinoImages[dinoIndex];
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
    const dinoX = (canvas.width - img.width * scale) / 2;
    const dinoY = (canvas.height - img.height * scale) / 2;
    const dinoWidth = img.width * scale;
    const dinoHeight = img.height * scale;

    return x >= dinoX && x <= dinoX + dinoWidth && y >= dinoY && y <= dinoY + dinoHeight;
}

// Tıklama efekti
function showClickEffect(x, y) {
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText("+1", x, y);
    setTimeout(() => updateUI(), 100);
}

// UI güncelleme
function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
    
    const nextRefill = new Date(lastEnergyRefillTime.getTime() + 4 * 60 * 60 * 1000);
    const timeUntilRefill = nextRefill - Date.now();
    const minutesUntilRefill = Math.ceil(timeUntilRefill / (60 * 1000));
    document.getElementById('refillTimer').textContent = `Next energy in: ${minutesUntilRefill} min`;
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
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Oyunu başlatma
function startGame(userTelegramId) {
    telegramId = userTelegramId;
    loadUserData();
    resizeCanvas();
    gameLoop();
}

// Event listener'lar
window.addEventListener('resize', resizeCanvas);

// Oyunu yükleme ve başlatma
loadImages().then(loadedImages => {
    dinoImages = loadedImages;
    // startGame fonksiyonu Telegram bot'unuzdan gelen telegramId ile çağrılacak
}).catch(error => {
    console.error("Error loading images:", error);
});
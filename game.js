console.log("Game script loaded");

// Hata yakalama
window.onerror = function(message, source, lineno, colno, error) {
    console.log("Error: " + message);
    console.log("Source: " + source);
    console.log("Line: " + lineno);
    console.log("Column: " + colno);
    console.log("Error object: ", error);
    return true;
};

// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = '';

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resimleri yükleme
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];

function loadImages() {
    console.log("Loading images...");
    return Promise.all(dinoImagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Image loaded: ${path}`);
                resolve(img);
            };
            img.onerror = (e) => {
                console.error(`Error loading image: ${path}`, e);
                reject(e);
            };
            img.src = path;
        });
    }));
}

// Verileri yükleme
function loadUserData() {
    console.log("Loading user data for telegramId:", telegramId);
    const savedData = localStorage.getItem(telegramId);
    if (savedData) {
        const data = JSON.parse(savedData);
        tokens = data.tokens;
        level = data.level;
        energy = data.energy;
        lastEnergyRefillTime = new Date(data.lastEnergyRefillTime);
        clicksRemaining = data.clicksRemaining;
        console.log("User data loaded:", data);
    } else {
        console.log("No saved data found for this user");
    }
    updateUI();
}

// Oyunu başlatma
function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    resizeCanvas();
    setupGameUI();
    gameLoop();
}

// Canvas'ı yeniden boyutlandırma
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Oyun arayüzünü kurma
function setupGameUI() {
    // Oyun arayüzü elemanlarını oluştur
    const gameInfo = document.createElement('div');
    gameInfo.id = 'gameInfo';
    gameInfo.innerHTML = `
        <span id="tokenDisplay">Tokens: ${tokens}</span>
        <span id="energyDisplay">Energy: ${energy}/${maxEnergy}</span>
        <span id="clicksDisplay">Clicks: ${clicksRemaining}</span>
        <span id="levelDisplay">Level: ${level}</span>
    `;
    document.body.appendChild(gameInfo);

    // Tıklama olayını ekle
    canvas.addEventListener('click', handleClick);
}

// Tıklama işleme
function handleClick(event) {
    if (energy > 0 && clicksRemaining > 0) {
        tokens++;
        clicksRemaining--;
        if (clicksRemaining % 100 === 0) {
            energy--;
        }
        updateUI();
    }
}

// Oyun döngüsü
function gameLoop() {
    // Oyun mantığı ve çizim işlemleri
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dino resmini çiz
    if (dinoImages.length > 0) {
        ctx.drawImage(dinoImages[level - 1], canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
    }
    requestAnimationFrame(gameLoop);
}

// UI güncelleme
function updateUI() {
    document.getElementById('tokenDisplay').textContent = `Tokens: ${tokens}`;
    document.getElementById('energyDisplay').textContent = `Energy: ${energy}/${maxEnergy}`;
    document.getElementById('clicksDisplay').textContent = `Clicks: ${clicksRemaining}`;
    document.getElementById('levelDisplay').textContent = `Level: ${level}`;
}

// Event listener'lar
window.addEventListener('resize', resizeCanvas);

// Oyunu yükleme ve başlatma
console.log("Initializing game...");
loadImages().then(loadedImages => {
    console.log("Images loaded successfully");
    dinoImages = loadedImages;
    const urlParams = new URLSearchParams(window.location.search);
    const telegramId = urlParams.get('telegramId');
    console.log("URL parameters:", urlParams.toString());
    console.log("Telegram ID from URL:", telegramId);
    
    if (telegramId) {
        console.log("Telegram ID found in URL:", telegramId);
        startGame(telegramId);
    } else {
        console.log('No Telegram ID provided in URL, using default');
        startGame('default_user');
    }
}).catch(error => {
    console.error("Error loading game:", error);
    document.body.innerHTML = `<h1>Error loading game: ${error.message}</h1>`;
});

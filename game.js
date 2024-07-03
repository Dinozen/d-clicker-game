console.log("Game script loaded");

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
let clicksRemaining = 300; // Her enerji için 100 tıklama hakkı
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

// ... (diğer fonksiyonlar aynı kalabilir)

// Oyunu başlatma
function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    resizeCanvas();
    gameLoop();
}

// Event listener'lar
window.addEventListener('resize', resizeCanvas);

// Oyunu yükleme ve başlatma
console.log("Initializing game...");
loadImages().then(loadedImages => {
    console.log("Images loaded successfully");
    dinoImages = loadedImages;
    // URL'den Telegram ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    const telegramId = urlParams.get('telegramId');
    if (telegramId) {
        console.log("Telegram ID found in URL:", telegramId);
        startGame(telegramId);
    } else {
        console.error('No Telegram ID provided in URL');
    }
}).catch(error => {
    console.error("Error loading images:", error);
});

console.log("Game script loaded");

// Oyun değişkenleri
let tokens = 0;
let level = 1;
let energy = 3;
let maxEnergy = 3;
let lastEnergyRefillTime = Date.now();
let clicksRemaining = 300;
let telegramId = '';
let boostAvailable = true;
const boostCooldown = 3 * 60 * 60 * 1000; // 3 saat

// DOM elementleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
const boostTimer = document.getElementById('boostTimer');

// Resimleri yükleme
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];
let shadowImage = new Image();
shadowImage.src = 'shadow.png';

function loadImages() {
    console.log("Loading images...");
    return Promise.all(dinoImagePaths.map(path => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Image loaded successfully: ${path}`);
                resolve(img);
            };
            img.onerror = (e) => {
                console.error(`Error loading image: ${path}`, e);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
        });
    })).then(images => {
        console.log("All images loaded:", images);
        dinoImages = images;
        console.log("dinoImages array:", dinoImages);
        drawDino(); // Try to draw immediately after loading
        return images;
    });
}

// ... (diğer fonksiyonlar aynı kalacak)

function drawDino() {
    console.log("drawDino called");
    console.log("Canvas dimensions:", canvas.width, canvas.height);
    console.log("Current level:", level);
    console.log("dinoImages array:", dinoImages);

    if (dinoImages.length > 0 && dinoImages[level - 1] && dinoImages[level - 1].complete) {
        const dinoImage = dinoImages[level - 1];
        console.log("Selected dino image:", dinoImage);

        const scale = Math.min(canvas.width / dinoImage.width, canvas.height / dinoImage.height) * 0.8;
        const dinoWidth = dinoImage.width * scale;
        const dinoHeight = dinoImage.height * scale;
        const dinoX = (canvas.width - dinoWidth) / 2;
        const dinoY = (canvas.height - dinoHeight) / 2;
        
        console.log("Drawing dino at:", dinoX, dinoY, dinoWidth, dinoHeight);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(dinoImage, dinoX, dinoY, dinoWidth, dinoHeight);
        ctx.restore();
        
        if (shadowImage.complete) {
            const shadowWidth = dinoWidth;
            const shadowHeight = shadowImage.height * (shadowWidth / shadowImage.width);
            ctx.drawImage(shadowImage, dinoX, dinoY + dinoHeight - shadowHeight / 2, shadowWidth, shadowHeight);
        }
    } else {
        console.log("Dino image not ready or not found");
        console.log("dinoImages length:", dinoImages.length);
        if (dinoImages[level - 1]) {
            console.log("Image complete:", dinoImages[level - 1].complete);
        }
    }
}

function gameLoop() {
    drawDino();
    requestAnimationFrame(gameLoop);
}

function startGame(userTelegramId) {
    console.log("Starting game for telegramId:", userTelegramId);
    telegramId = userTelegramId;
    loadUserData();
    loadImages().then(() => {
        console.log("Images loaded, setting up game");
        resizeCanvas();
        setupGameUI();
        gameLoop();
        boostButton.addEventListener('click', handleBoost);
    }).catch(error => {
        console.error("Error loading images:", error);
    });
}

// ... (diğer fonksiyonlar aynı kalacak)

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded");
    const urlParams = new URLSearchParams(window.location.search);
    const userTelegramId = urlParams.get('id');
    if (userTelegramId) {
        startGame(userTelegramId);
    } else {
        console.error("No Telegram ID provided");
    }
});
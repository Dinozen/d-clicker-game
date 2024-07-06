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
let boostEndTime = 0; // Boost bitiş zamanı
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

// ... (Diğer fonksiyonlar - loadImages, loadUserData, saveUserData, startGame)

function drawDino() {
  if (dinoImages.length > 0 && dinoImages[level - 1] && dinoImages[level - 1].complete && shadowImage.complete) {
    const dinoImage = dinoImages[level - 1];
    const scale = Math.min(canvas.width / dinoImage.width, canvas.height / dinoImage.height) * 0.8; // %80 ölçeklendirme
    const dinoWidth = dinoImage.width * scale;
    const dinoHeight = dinoImage.height * scale;

    // Dinozoru ortala ve biraz aşağıya kaydır
    const dinoX = (canvas.width - dinoWidth) / 2;
    const dinoY = canvas.height * 0.6 - dinoHeight; // %60 yükseklikte konumlandır

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(dinoImage, dinoX, dinoY, dinoWidth, dinoHeight);

    // Gölgeyi dinozorun altına yerleştir
    const shadowWidth = dinoWidth;
    const shadowHeight = shadowImage.height * (shadowWidth / shadowImage.width);
    ctx.drawImage(shadowImage, dinoX, dinoY + dinoHeight, shadowWidth, shadowHeight);
  } else {
    console.log("Dinozor veya gölge resmi henüz yüklenmedi.");
  }
}

// ... (Diğer fonksiyonlar - gameLoop, updateUI, handleBoost, updateBoostButton, updateBoostTimer)

// Oyunu başlatırken kullanıcı verilerini URL'den al
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userTelegramId = urlParams.get('telegramId');
  if (userTelegramId) {
    // Diğer kullanıcı verilerini de URL'den al
    tokens = parseInt(urlParams.get('tokens')) || 0; 
    energy = parseInt(urlParams.get('energy')) || 3;
    clicksRemaining = parseInt(urlParams.get('clicksRemaining')) || 300;
    level = parseInt(urlParams.get('level')) || 1;
    boostAvailable = parseInt(urlParams.get('boostAvailable')) || 1;
    boostEndTime = parseInt(urlParams.get('boostEndTime')) || 0;

    startGame(userTelegramId);
  } else {
    console.error("Telegram ID sağlanmadı");
  }
});

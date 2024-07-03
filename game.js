// Resimleri yükleme işlemi
let dinoImages = [];
let dinoImagePaths = ["dino1.png", "dino2.png", "dino3.png", "dino4.png", "dino5.png"];

for (let i = 0; i < dinoImagePaths.length; i++) {
    let img = new Image();
    img.src = dinoImagePaths[i];
    dinoImages.push(img);
}

// Token sayısı ve seviye başlangıç değerleri
let tokens = 0;
let level = 1;

// Boost butonu ve canvas elementlerini seçme
const boostButton = document.getElementById('boostButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Boost butonuna tıklama işlemi
boostButton.addEventListener('click', function() {
    tokens++;
    updateTokensUI();
});

// Token sayısını güncelleme işlemi
function updateTokensUI() {
    boostButton.innerHTML = `Boost (${tokens} tokens)`;
}

// Oyun döngüsü
function gameLoop() {
    // Oyun durumu güncelleme işlemleri burada olacak
}

// Oyunu başlatma
function startGame() {
    // Oyun döngüsünü başlatma
    gameLoop();
}

// Oyunu başlat
startGame();

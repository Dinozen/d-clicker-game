const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let dinoStage = 1;
let dinoImages = [];
let clicks = 0;
let boostActive = false;
const boostButton = document.getElementById('boostButton');

function loadImages() {
    for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `dino${i}.png`;
        dinoImages.push(img);
    }
}

function drawDino() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(dinoImages[dinoStage - 1], canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
}

function evolveDino() {
    clicks++;
    if (boostActive) {
        clicks += 2; // Double clicks during boost
    }
    if (clicks >= 10) {
        dinoStage++;
        clicks = 0;
    }
    if (dinoStage > 5) {
        dinoStage = 1;
    }
    drawDino();
}

function activateBoost() {
    if (!boostActive) {
        boostActive = true;
        boostButton.classList.add('disabled');
        setTimeout(() => {
            boostActive = false;
            boostButton.classList.remove('disabled');
        }, 5000); // Boost lasts for 5 seconds
    }
}

canvas.addEventListener('click', evolveDino);
boostButton.addEventListener('click', activateBoost);

loadImages();
drawDino();

const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const boostButton = document.getElementById('boostButton');
let coins = 0;
let dinoImage = new Image();
dinoImage.src = 'images/dino1.png'; // Dinozor resmini değiştirin

let lastBoostTime = 0;
const BOOST_INTERVAL = 8 * 3600 * 1000; // 8 saat

function drawDino() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(dinoImage, (canvas.width - dinoImage.width) / 2, (canvas.height - dinoImage.height) / 2);
    context.fillStyle = '#fff';
    context.font = '20px Arial';
    context.fillText(`Coins: ${coins}`, 20, 30);
}

function onCanvasClick() {
    coins += 1;
    drawDino();
    checkDinoStage();
}

function checkDinoStage() {
    if (coins >= 100000 && coins < 250000) {
        dinoImage.src = 'images/dino2.png';
    } else if (coins >= 250000 && coins < 500000) {
        dinoImage.src = 'images/dino3.png';
    } else if (coins >= 500000 && coins < 1000000) {
        dinoImage.src = 'images/dino4.png';
    } else if (coins >= 1000000) {
        dinoImage.src = 'images/dino5.png';
    }
}

function updateBoostButton() {
    const currentTime = Date.now();
    if (currentTime - lastBoostTime >= BOOST_INTERVAL) {
        boostButton.classList.remove('disabled');
    } else {
        boostButton.classList.add('disabled');
        const remainingTime = BOOST_INTERVAL - (currentTime - lastBoostTime);
        boostButton.innerText = `Boost (${Math.ceil(remainingTime / 1000 / 60)} min)`;
    }
}

function onBoostClick() {
    if (Date.now() - lastBoostTime >= BOOST_INTERVAL) {
        coins += 10000;
        lastBoostTime = Date.now();
        boostButton.classList.add('disabled');
        drawDino();
        updateBoostButton();
    }
}

canvas.addEventListener('click', onCanvasClick);
boostButton.addEventListener('click', onBoostClick);

setInterval(updateBoostButton, 1000);
drawDino();

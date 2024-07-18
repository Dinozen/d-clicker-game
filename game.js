<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DinoZen Clicker Game</title>
    <link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Poppins&display=swap" rel="stylesheet">
    <style>
        @font-face {
            font-family: 'BlockheadTypeface';
            src: url('menufont.otf') format('opentype');
        }
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #000;
            color: #ffffff;
            font-family: 'Lilita One', cursive;
            overflow: hidden;
        }
        #backgroundGif {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: -1;
        }
        #gameCanvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        #gameInfo {
            position: fixed;
            top: 5px;
            left: 5px;
            font-size: 14px;
            z-index: 10;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 5px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .clickEffect {
            position: absolute;
            color: white;
            font-size: 20px;
            font-weight: bold;
            animation: fadeOut 1s forwards;
            pointer-events: none;
            z-index: 1000;
        }
        @keyframes fadeOut {
            0% {
                opacity: 1;
                transform: translateY(0);
            }
            100% {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        .button {
            font-family: 'BlockheadTypeface', sans-serif;
            text-transform: uppercase;
            font-size: 16px;
            padding: 10px 20px;
            background-color: #61dafb;
            color: #000;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            margin: 5px;
            z-index: 10;
        }
        .button:hover {
            background-color: #21a1f1;
        }
        .button.disabled {
            background-color: #999;
            cursor: not-allowed;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
        }
        .modal-content {
            background-color: #333;
            color: #fff;
            border: 2px solid #61dafb;
            box-shadow: 0 0 10px #61dafb;
            margin: 15% auto;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 300px;
            text-align: center;
        }
        .close-btn {
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .close-btn:hover {
            background-color: #d32f2f;
        }
        .referral-link-container {
            display: flex;
            justify-content: center;
            margin: 10px 0;
        }
        #referralLink {
            width: 70%;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 5px 0 0 5px;
        }
        #copyButton {
            padding: 5px 10px;
            background-color: #61dafb;
            color: #000;
            border: none;
            border-radius: 0 5px 5px 0;
            cursor: pointer;
        }
        #dailyRewardDisplay {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            z-index: 10;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 5px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.5);
            text-align: center;
        }
        #randomGiftButton {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            width: 100%;
        }
        #buttonsContainer {
            position: fixed;
            bottom: 10px;
            width: 100%;
            display: flex;
            justify-content: space-around;
            z-index: 10;
        }
        #randomGiftButton img {
            width: 40px;
            margin-bottom: 5px;
        }
        .daily-streak {
            width: 90%;
            max-width: 250px;
            background-color: #000;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
            position: relative;
            color: #fff;
            margin: 20px auto;
            font-family: 'Poppins', sans-serif;
            font-size: 12px;
        }
        .daily-streak .close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: #ff5e57;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .daily-streak .close-btn::before {
            content: "X";
            font-size: 16px;
            line-height: 1;
        }
        .daily-streak table {
            border-collapse: collapse;
            margin: 0 auto;
            width: 100%;
        }
        .daily-streak th, .daily-streak td {
            border: 1px solid #fff;
            padding: 3px;
            text-align: center;
            color: #fff;
        }
        .daily-streak th {
            background-color: #4CAF50;
            color: white;
        }
        .daily-streak td {
            background-color: #222;
        }
        #dinoTokenDisplay {
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            font-size: 36px;
            display: flex;
            align-items: center;
        }
        #dinoTokenDisplay img {
            width: 36px;
            height: 36px;
            margin-right: 10px;
        }
        #tokenDisplay {
            color: white;
            text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
        }
        #dailyRewardsButton {
            position: fixed;
            top: 10px;
            right: 10px;
            font-size: 14px;
            padding: 5px 10px;
            background-color: #61dafb;
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            z-index: 10;
        }
        #dailyRewardsButton:hover {
            background-color: #21a1f1;
        }
        #giftCooldownDisplay {
            text-align: center;
            margin-top: 10px;
        }
        .reward-item img {
            width: 16px;
            height: 16px;
            vertical-align: middle;
        }
        #closeRewardTableButton {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: #f44336;
            color: white;
            border: none;
            font-size: 20px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .reward-item.claimed .claim-btn {
            background-color: #4CAF50;
            cursor: not-allowed;
        }
        .claim-btn {
            padding: 5px 10px;
            background-color: #61dafb;
            color: black;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .claim-btn:hover {
            background-color: #21a1f1;
        }
        .reward-page {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .nav-btn {
            background-color: #61dafb;
            color: #000;
            border: none;
            border-radius: 5px;
            padding: 5px 10px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .nav-btn:hover {
            background-color: #21a1f1;
        }
        #debugOverlay {
            position: fixed;
            top: 0;
            left: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            max-height: 50%;
            overflow-y: auto;
            z-index: 9999;
            display: none;
            font-family: monospace;
            font-size: 12px;
        }
        #mobileDebug {
            position: fixed;
            bottom: 0;
            left: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            max-height: 30%;
            overflow-y: auto;
            z-index: 9999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <img id="backgroundGif" src="background.gif" alt="background gif">
    <canvas id="gameCanvas"></canvas>
    <div id="gameInfo">
        <div class="counter"><span>Energy:</span><span id="energyDisplay">3/3</span></div>
        <div class="counter"><span>Clicks:</span><span id="clicksDisplay">300</span></div>
        <div class="counter"><span>Level:</span><span id="levelDisplay">1</span></div>
    </div>
    <div id="dinoTokenDisplay">
        <img src="token.png" alt="token">
        <span id="tokenDisplay">0</span>
    </div>
    <div id="buttonsContainer">
        <button id="earnButton" class="button">EARN</button>
        <button id="tasksButton" class="button">TASKS</button>
        <button id="boostButton" class="button">BOOST</button>
        <button id="dailyRewardsButton" class="button">DAILY REWARDS</button>
    </div>
    <div id="tasksModal" class="modal">
        <div class="modal-content">
            <h3>Tasks</h3>
            <div class="task-item">
                <p>1. Follow us on X!</p>
                <button id="followUsButton" class="button">START</button>
            </div>
            <div class="task-item">
                <p>2. Visit our official website!</p>
                <button id="visitWebsiteButton" class="button">START</button>
            </div>
            <button id="closeTasksModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="rewardTableModal" class="modal">
        <div class="modal-content daily-streak">
            <button id="closeRewardTableButton" class="close-btn"></button>
            <h3>Daily Streak Rewards</h3>
            <div id="rewardPages">
                <div class="reward-page" id="rewardPage1"></div>
                <div class="reward-page" id="rewardPage2" style="display:none;"></div>
            </div>
            <div class="reward-navigation">
                <button id="prevRewardPage" class="nav-btn" disabled>◀</button>
                <button id="nextRewardPage" class="nav-btn">▶</button>
            </div>
        </div>
    </div>
    <div id="menuModal" class="modal">
        <div class="modal-content">
            <h2>Menu</h2>
            <button id="randomGiftButton" class="button">
                <img src="gift-box.png" alt="Gift">
                Random Gift
            </button>
            <div id="giftCooldownDisplay"></div>
            <button id="referralButton" class="button">Invite Friends</button>
            <p>Your Referrals: <span id="referralCount">0</span></p>
            <button id="closeMenuButton" class="button close-btn">X</button>
        </div>
    </div>
    <div id="boostersModal" class="modal">
        <div class="modal-content">
            <h3>Boosters</h3>
            <div id="energyBoostContainer" style="display: flex; flex-direction: column; align-items: center;">
                <h3>🚀Energy Filler</h3>
                <button id="energyBoostButton" class="button">Restore Full Energy</button>
                <div id="energyBoostCooldownDisplay"></div>
            </div>
           <div id="autoBotContainer" style="display: flex; flex-direction: column; align-items: center;">
                <img src="autobot.png" alt="AutoBot" id="autoBotImage" style="width: 100px; height: 100px;">
                <div id="autoBotInfo">
                    <h3>AutoBot</h3>
                    <p>(10,000 tokens)</p>
                </div>
                <button id="autoBotButton" class="button">Activate AutoBot</button>
            </div>
            <button id="closeBoostersModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="referralModal" class="modal">
        <div class="modal-content">
            <h3>Your Referral Link</h3>
            <div class="referral-link-container">
                <input type="text" id="referralLink" readonly>
                <button id="copyButton">Copy</button>
            </div>
            <div id="referralRewards">
                <h4>Referral Rewards:</h4>
                <p>1 Referral: 3,000 tokens</p>
                <p>5 Referrals: 15,000 tokens</p>
                <p>10 Referrals: 30,000 tokens</p>
                <p>20 Referrals: 75,000 tokens</p>
                <p>50 Referrals: 300,000 tokens</p>
                <p>100 Referrals: 600,000 tokens</p>
                <p>500 Referrals: 3M tokens</p>
                <p>1000 Referrals: 10M tokens</p>
            </div>
            <button id="closeReferralModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="loginStreakModal" class="modal">
        <div class="modal-content">
            <h3>Daily Login Reward</h3>
            <p id="loginStreakMessage"></p>
            <button id="claimDailyReward" class="button">Claim Reward</button>
            <button id="closeLoginStreakModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="wheelResultModal" class="modal">
        <div class="modal-content">
            <h3>Wheel Result</h3>
            <p id="wheelResultMessage"></p>
            <button id="closeWheelResultModal" class="button">Awesome!</button>
        </div>
    </div>
    <div id="autoBotSuccessModal" class="modal">
        <div class="modal-content">
            <h3>AutoBot Purchased</h3>
            <p>You have successfully purchased AutoBot!</p>
            <button id="closeAutoBotSuccessModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="autoBotEarningsModal" class="modal">
        <div class="modal-content">
            <h3>AutoBot Earnings</h3>
            <img src="autobot.png" alt="AutoBot" id="autoBotEarningsImage" style="width: 100px; height: 100px; margin-bottom: 10px;">
            <p>Tokens Collected: <span id="autoBotTokensCollected">0</span></p>
            <button id="claimAutoBotTokens" class="button">Claim Tokens</button>
            <button id="closeAutoBotEarningsModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="levelUpModal" class="modal">
        <div class="modal-content">
            <h3>Level Up!</h3>
            <p id="levelUpMessage"></p>
            <table id="levelUpStats">
                <tr>
                    <th>Stat</th>
                    <th>Previous</th>
                    <th>New</th>
                </tr>
                <!-- Level up stats will be dynamically inserted here -->
            </table>
            <button id="closeLevelUpModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="randomGiftResultModal" class="modal">
        <div class="modal-content">
            <h3>Random Gift</h3>
            <p id="randomGiftResult"></p>
            <button id="closeRandomGiftResultModal" class="close-btn">X</button>
        </div>
    </div>
    <div id="messageModal" class="modal">
        <div class="modal-content">
            <p id="messageText"></p>
            <button id="closeMessageModal" class="button">OK</button>
        </div>
    </div>
    <div id="debugOverlay"></div>
    <script src="game.js"></script>
</body>
</html>

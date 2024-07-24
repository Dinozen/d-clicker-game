<<<<<<< HEAD
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackContext
import os

API_KEY = '7232543351:AAEIEL74ZB6Zpls30bbMamnd_-G-w7OQigk'
WEB_APP_URL = 'https://dinozen.github.io/d-clicker-game/'

application = Application.builder().token(API_KEY).build()

async def start(update: Update, context: CallbackContext):
    keyboard = [[InlineKeyboardButton("🚀 Launch Game 🚀", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "Get ready to dive into the dino-tastic world of Dino Farm! Click the button below to start farming your $DINOZ fortune! 🦖💰",
        reply_markup=reply_markup
    )

async def help_command(update: Update, context: CallbackContext):
    await update.message.reply_text("Just type /start to begin your dino-mite adventure! 🦕")

def main():
    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', help_command))
    application.run_polling()

if __name__ == '__main__':
=======
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackContext

API_KEY = os.environ.get('TELEGRAM_BOT_TOKEN')
WEB_APP_URL = 'https://dinozen.github.io/d-clicker-game/'
WEBHOOK_URL = os.environ.get('HEROKU_URL')
PORT = int(os.environ.get('PORT', 5000))


async def start(update: Update, context: CallbackContext):
    keyboard = [[InlineKeyboardButton("🚀 Launch Game 🚀", url=f"{WEB_APP_URL}?id={update.effective_user.id}")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "Get ready to dive into the dino-tastic world of Dino Farm! Click the button below to start farming your $DINOZ fortune! 🦖💰",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: CallbackContext):
    await update.message.reply_text("Just type /start to begin your dino-mite adventure! 🦕")


def main():
    application = Application.builder().token(API_KEY).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('help', help_command))

    # Set up the webhook
    application.run_webhook(
        listen="0.0.0.0",
        port=PORT,
        url_path=f"bot{API_KEY}",
        webhook_url=f"{WEBHOOK_URL}/bot{API_KEY}"
    )


if __name__ == '__main__':
>>>>>>> 5159573db64709d3a8eb68dbf6c0fa8301e36a8a
    main()
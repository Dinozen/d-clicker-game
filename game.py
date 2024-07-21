from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebhookInfo
from telegram.ext import Application, CommandHandler, CallbackContext

API_KEY = '7232543351:AAEIEL74ZB6Zpls30bbMamnd_-G-w7OQigk'
WEB_APP_URL = 'https://dinozen.github.io/d-clicker-game/'

application = Application.builder().token(API_KEY).build()

async def start(update: Update, context: CallbackContext):
    # WebhookInfo yerine URL'yi doğrudan kullanmak zorunda kalıyoruz
    keyboard = [[InlineKeyboardButton("🚀 Launch Game 🚀", url=WEB_APP_URL)]]
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
    main()

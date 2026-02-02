AI Email Automator ✉️
A full-stack web application that uses Google's Gemini API to generate professional emails and sends them to multiple recipients using SMTP.

✨ Features
AI-Powered Generation: Write a short prompt, choose a tone, and let Gemini craft the perfect email.
Interactive Editor: Review and edit the generated subject and body before sending.
Multi-Recipient Support: Add multiple email addresses using a dynamic chip-based interface.
Premium Design: Modern, glassmorphism UI with responsive layouts and smooth animations.
SMTP Integration: Sends emails through a default configured sender.
🛠️ Stack
Backend: FastAPI (Python)
AI: Google Generative AI (Gemini 1.5 Flash)
Frontend: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
Email: SMTP (smtplib)
🚀 Setup
Configure Environment: Create a .env file in the root (a template is provided) and fill in your credentials:

GEMINI_API_KEY=your_api_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
Install Dependencies:

pip install -r requirements.txt
Run the App:

python run.py
Open http://127.0.0.1:8001 in your browser.

⚠️ Important Note for Gmail Users
If you are using Gmail, you must use an App Password instead of your regular password. You can generate one in your Google Account security settings under "App Passwords".

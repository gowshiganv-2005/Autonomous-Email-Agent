import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv(override=True)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 465))
        self.username = os.getenv("SMTP_USERNAME")
        self.password = os.getenv("SMTP_PASSWORD")
        self.sender_name = os.getenv("DEFAULT_SENDER_NAME", "AI Email Automator")

    def send_to_multiple(self, subject, body, recipients, attachments=None):
        """
        Sends emails to multiple recipients with optional attachments.
        attachments: List of tuples (filename, content, content_type)
        """
        if not self.username or not self.password:
            return False, "SMTP credentials missing in .env"

        try:
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=15) as server:
                server.login(self.username, self.password)
                
                for recipient in recipients:
                    msg = EmailMessage()
                    msg.set_content(body)
                    msg["Subject"] = subject
                    msg["From"] = f"{self.sender_name} <{self.username}>"
                    msg["To"] = recipient
                    
                    # Add attachments
                    if attachments:
                        for filename, content, content_type in attachments:
                            maintype, subtype = content_type.split('/', 1)
                            msg.add_attachment(
                                content,
                                maintype=maintype,
                                subtype=subtype,
                                filename=filename
                            )
                    
                    server.send_message(msg)
                    
            return True, "Emails sent successfully"
        except Exception as e:
            print(f"SMTP Error: {e}")
            return False, str(e)

email_service = EmailService()

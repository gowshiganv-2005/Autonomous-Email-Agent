import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv(override=True)

class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found in .env")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def generate_email(self, user_prompt, tone="Professional"):
        system_prompt = f"""
        You are an expert email copywriter.
        Write a highly professional and effective email based on the user's prompt.
        Tone: {tone}
        
        Return ONLY a JSON object with two fields:
        1. "subject": A catchy and relevant subject line.
        2. "body": The complete email body including placeholders like [Name] if needed.
        
        Prompt: {user_prompt}
        """
        
        try:
            response = self.model.generate_content(system_prompt)
            # Try to parse JSON from the response text
            text = response.text.strip()
            # Handle potential markdown code blocks
            if text.startswith("```json"):
                text = text.replace("```json", "").replace("```", "").strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return {
                "subject": "Email Generation Failed",
                "body": f"Sorry, I couldn't generate the email. Error: {str(e)}"
            }

ai_service = AIService()

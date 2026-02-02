import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv(override=True)
    print("Starting AI Email Automator...")
    print("URL: http://127.0.0.1:8001")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)

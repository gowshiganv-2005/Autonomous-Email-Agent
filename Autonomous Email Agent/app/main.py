from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import os
import json
import pandas as pd
import re
from .ai_service import ai_service
from .email_service import email_service

app = FastAPI(title="AI Email Automator")

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Models
class GenerateRequest(BaseModel):
    prompt: str
    tone: str = "Professional"

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/generate")
async def generate_email_api(request: GenerateRequest):
    try:
        result = await ai_service.generate_email(request.prompt, request.tone)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-emails")
async def extract_emails_api(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Only Excel or CSV files are supported")
    
    try:
        content = await file.read()
        from io import BytesIO
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))
        
        # Flatten and regex search for emails
        all_text = " ".join(df.astype(str).values.flatten())
        email_regex = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        emails = list(set(re.findall(email_regex, all_text)))
        
        return {"emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/api/send")
async def send_email_api(
    subject: str = Form(...),
    body: str = Form(...),
    recipients: str = Form(...), # JSON string of recipients list
    attachments: list[UploadFile] = File(None)
):
    try:
        recipient_list = json.loads(recipients)
    except:
        raise HTTPException(status_code=400, detail="Invalid recipients format")

    if not recipient_list:
        raise HTTPException(status_code=400, detail="No recipients provided")
    
    # Prepare attachments for email service
    processed_attachments = []
    if attachments:
        for file in attachments:
            content = await file.read()
            processed_attachments.append((file.filename, content, file.content_type))
    
    success, message = email_service.send_to_multiple(
        subject, 
        body, 
        recipient_list,
        attachments=processed_attachments
    )
    
    if success:
        return {"message": message}
    else:
        raise HTTPException(status_code=500, detail=message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)

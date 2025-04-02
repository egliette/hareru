import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend/public", html=True), name="static")
@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("frontend/public/index.html") as f:
        return HTMLResponse(content=f.read())

# Configure CORS
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/transcripts/{video_id}")
async def get_transcripts(video_id: str):
    try:
        # Get the transcript for the video
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        # Extract text from each transcript
        captions = [transcript['text'] for transcript in transcript_list]
        return JSONResponse(content={"transcript_list": transcript_list})
    except Exception as e:
        return JSONResponse(content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)





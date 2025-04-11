from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from youtube_transcript_api import YouTubeTranscriptApi


app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("templates/index.html")

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
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return JSONResponse(content={"transcript_list": transcript_list})
    except Exception as e:
        return JSONResponse(content={"error": str(e)})






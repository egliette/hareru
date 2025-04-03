const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const urlInput = $("#url-input")
const iframe = document.querySelector("#youtube-player")

let player

function extractVideoId(url) {
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/
    let match = url.match(regExp)
    if (match && match[1]) {
        return match[1]
    } else {
        return null
    }
}

async function fetchTranscripts(videoId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/transcripts/${videoId}`);
        const data = await response.json();
        
        if (data.transcript_list) {
            return data.transcript_list
        } else {
            console.error("Error:", data.error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
  
    return null
}
  
async function getVideo() {
    const videoUrl = urlInput.value.trim()
    let videoId = extractVideoId(videoUrl)
    if (videoId) {
        player = new YT.Player("youtube-player", {
            videoId: videoId,
            events: {
                "onReady": onPlayerReady
            }
        })
        originaltranscriptList = await fetchTranscripts(videoId);
        console.log(originaltranscriptList)
    } else {
        alert("Invalid Youtube url.")
    }
}

function onPlayerReady() {
    player.playVideo()
}

urlInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        getVideo();
    }
});




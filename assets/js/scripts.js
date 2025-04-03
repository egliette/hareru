const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const urlInput = $("#url-input")
const searchBtn = $("#search-btn")
const replayBtn = $("#replay-btn")

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

const transcriptManager = {
    player: null,
    transcriptList: [],
    currIdx: 0,
    intervalIdList: [],

    onPlayerReady: function () {
        this.player.pauseVideo()
    },

    initPlayer: async function() {
        const videoUrl = urlInput.value.trim()
        let videoId = extractVideoId(videoUrl)
        if (videoId) {
            this.player = new YT.Player("youtube-player", {
                videoId: videoId,
                events: {
                    "onReady": () => this.onPlayerReady()
                }
            })
            this.transcriptList = await fetchTranscripts(videoId)
            this.currIdx = 0
            this.replay()
        } else {
            alert("Invalid Youtube url.")
        }
    },

    stopSegment: function() {
        let currentTime = this.player.getCurrentTime();

        if (currentTime >= this.transcriptList[this.currIdx].start + this.transcriptList[this.currIdx].duration) {
            this.player.pauseVideo();
            for (let i=0; i < this.intervalIdList.length; i++) {
                clearInterval(this.intervalIdList[i])
            }
        }
    },

    replay: function() {
        let start = 0
        if (this.currIdx > 0) {
            start = this.transcriptList[this.currIdx-1].start
        }
        this.player.seekTo(start, true)
        this.player.playVideo()
        let intervalId = setInterval(() => this.stopSegment(), 100)
        this.intervalIdList.push(intervalId);
    },

    handleEvents: function() {
        searchBtn.onclick = () => this.initPlayer()
        urlInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.initPlayer()
            }
        });
        replayBtn.onclick = () => this.replay()
        
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey) {
                this.replay()
            }
        });
        
    },

    start: function() {
        this.handleEvents()
    }
}


transcriptManager.start()
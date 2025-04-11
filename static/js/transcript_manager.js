import { 
    urlInput,  
    replayBtn, 
    completeBar, 
    completeNumber,
    loadingContainer,
} from './dom_elements.js';


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
        this.replay()
    },

    initPlayer: async function() {
        loadingContainer.style.display = "flex"
        const videoUrl = urlInput.value.trim()
        let videoId = extractVideoId(videoUrl)
        if (!videoId) {
            alert("Invalid Youtube url.")
            loadingContainer.style.display = "none"
            return
        }

        this.transcriptList = await fetchTranscripts(videoId)
        if (!this.transcriptList) {
            this.checkTranscriptList()
            loadingContainer.style.display = "none"
            return
        }

        this.currIdx = 0

        if (this.player) {
            this.player.destroy();
            for (let i=0; i < this.intervalIdList.length; i++) {
                clearInterval(this.intervalIdList[i])
            }
        }

        this.player = new YT.Player("youtube-player", {
            videoId: videoId,
            events: {
                "onReady": () => this.onPlayerReady()
            }
        })

        loadingContainer.style.display = "none"
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

    checkTranscriptList: function() {
        if (!this.transcriptList) {
            alert("Cannot get transcripts of this video.");
            return false;
        }
        return true;
    },

    updateProgressBar: function() {
        if (!this.transcriptList || this.transcriptList.length === 0)
        {
            completeBar.style.width = "6%";
            completeNumber.textContent = `0/0`;
            return
        } 

        let progressPercentage =  Math.floor((this.currIdx / this.transcriptList.length) * 100);
        progressPercentage = Math.max(progressPercentage, 6);
        completeBar.style.width = progressPercentage + "%";
        completeNumber.textContent = `${this.currIdx}/${this.transcriptList.length}`;
    },

    replay: function() {
        if (!this.checkTranscriptList()) return;
        this.updateProgressBar()
        let start = 0
        if (this.currIdx > 0) {
            start = this.transcriptList[this.currIdx-1].start + this.transcriptList[this.currIdx-1].duration
        }
        this.player.seekTo(start, true)
        this.player.playVideo()
        let intervalId = setInterval(() => this.stopSegment(), 100)
        this.intervalIdList.push(intervalId);
    },

    nextSegment: async function() {
        if (!this.checkTranscriptList()) return;

        if (this.currIdx >= this.transcriptList.length) {
            return
        }
        this.currIdx += 1
        this.replay()
    },

    backSegment: async function() {
        if (!this.checkTranscriptList()) return;

        if (this.currIdx == 0) {
            return
        }
        this.currIdx -= 1
        this.replay()
    },

    updateMaxSeconds: function () {
        const numSegments = this.transcriptList.length;
        let concatenatedList = [];
        let parts = [];
        let totalDuration = 0;
    
        for (let i = 0; i < numSegments; i++) {
            parts.push(paragraphs[i]);
            totalDuration += paragraphs[i].duration;
            if (totalDuration > secondsPerPart) {
                newPart = mergeParts(parts);
                concatenatedList.push(newPart);
                parts = [];
                totalDuration = 0;
            }
        }
    
        if (parts.length > 0) {
            newPart = mergeParts(parts);
            concatenatedList.push(newPart);
        }
    
        return concatenatedList;
    },

    handleEvents: function() {
        replayBtn.onclick = () => this.replay()
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey) {
                this.replay()
            }
        });
    },

    getCurrInfo: function() {
        if (this.transcriptList === null)
            return null
        return this.transcriptList[this.currIdx]
    },

    start: function() {
        this.handleEvents()
    }
}


export default transcriptManager
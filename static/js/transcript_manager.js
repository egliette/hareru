import { 
    $,
    urlInput, 
    userInput, 
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
        const response = await fetch(`https://hareru.egliette.io.vn/transcripts/${videoId}`);
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

function mergeSegments(parts) {
    let newSegment = {
        start: parts[0].start,
        duration: parts[0].duration,
        text: parts[0].text,
    };
    for (let partId = 1; partId < parts.length; partId++) {
        newSegment.duration += parts[partId].duration;
        newSegment.text += " " + parts[partId].text;
    }

    return newSegment;
}
  

const transcriptManager = {
    player: null,
    transcriptList: [],
    currIdx: 0,
    intervalIdList: [],
    secondsPerSegment: 0,

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
        
        this.updateMaxSeconds()
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
        if (this.transcriptList.length === 0) {
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
        const maxSecondsInput = $("#max-seconds")
        let newSecondsPerSegment = maxSecondsInput.value
        
        if (newSecondsPerSegment == this.secondsPerSegment) {
            return
        }
        this.secondsPerSegment = newSecondsPerSegment

        const numSegments = this.transcriptList.length;
        let concatenatedList = [];
        let segments = [];
        let totalDuration = 0;
    
        for (let i = 0; i < numSegments; i++) {
            segments.push(this.transcriptList[i]);
            totalDuration += this.transcriptList[i].duration;
            if (totalDuration > this.secondsPerSegment) {
                let newSegment = mergeSegments(segments);
                concatenatedList.push(newSegment);
                segments = [];
                totalDuration = 0;
            }
        }
    
        if (segments.length > 0) {
            newPart = mergeSegments(segments);
            concatenatedList.push(newPart);
        }
    
        this.transcriptList = concatenatedList;
        this.currIdx = 0
    },

    handleEvents: function() {
        replayBtn.onclick = () => this.replay()
        userInput.addEventListener('keydown', (event) => {
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
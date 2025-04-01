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

function getVideo() {
    const videoUrl = urlInput.value.trim()
    let videoId = extractVideoId(videoUrl)
    if (videoId) {
        // iframe.src = `https://www.youtube.com/embed/${videoId}`;
        // player = new YT.Player(iframe, {
        player = new YT.Player("youtube-player", {
            videoId: videoId,
            events: {
                "onReady": onPlayerReady
            }
        })

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




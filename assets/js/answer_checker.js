import { 
    $,
    $$,
    urlInput, 
    searchBtn, 
    replayBtn, 
    nextBtn, 
    backBtn, 
    completeBar, 
    completeNumber 
} from './dom_elements.js';
import transcriptManager from './transcript_manager.js'




const answerChecker = {
    transManager: transcriptManager,

    handleEvents: function() {
        searchBtn.onclick = () => this.transManager.initPlayer()
        urlInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.transManager.initPlayer()
            }
        });

    },

    start: function() {
        this.transManager.start()
        this.handleEvents()
    }
} 

answerChecker.start()
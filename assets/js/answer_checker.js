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


transcriptManager.start()

const answerChecker = {
    
    handleEvents: function() {
    
    },

    start: function() {
        this.handleEvents()
    }
} 

answerChecker.start
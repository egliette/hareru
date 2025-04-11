import { 
    urlInput, 
    searchBtn, 
    replayBtn, 
    nextBtn, 
    backBtn, 
    completeBar, 
    completeNumber,
    checkBtn,
    showBtn,
    userInput,
    hintContainer,
    correctAnswerText,
    incorrectWordText,
    hiddenAnswerText,
    settingBtn,
    applyBtn,
    popupOverlay,
    popupContent,

} from './dom_elements.js';
import transcriptManager from './transcript_manager.js'



function cleanText(text) {
    text = text.replace(/\u2013|\u2014/g, "-")
    return text
        .replace(/^[\s.,;'"`-]+|[\s.,;'"`-]+$/g, '')
        .toLowerCase();
}

function trimSymbols(text) {
    return text.replace(/^[`";,.\-?{}\\|]+|[`";,.\-?{}\\|]+$/g, '')
}

function splitWords(text) {
    let words = text.split(/[\s\n]+/)
    words = words.map(word => trimSymbols(word))
    words = words.filter(word => word.trim() !== '')
    return words
}

function cleanAndSplit(text) {
    return splitWords(cleanText(text))
}

function naiveCleanText(text) {
    text = text.replace(/\u2013|\u2014/g, "-")
    return text.replace(/^[\s.,;'"`-]+|[\s.,;'"`-]+$/g, '')
}

function naiveCleanAndSplit(text) {
    return splitWords(naiveCleanText(text))
}

function findSimilarSublist(list1, list2) {
    let intersection = [];
    let i = 0;
    
    while (i < list1.length && i < list2.length && list1[i] === list2[i]) {
        intersection.push(list1[i]);
        i++;
    }

    return intersection;
}

function convertToAsterisks(text) {
    return '*'.repeat(text.length);
}


const answerChecker = {
    transManager: transcriptManager,
    isCorrect: false,

    checkAnswer: function() {
        let userAnswer = userInput.value
        let transInfo = this.transManager.getCurrInfo()

        if (!transInfo) {  
            return false
        } 

        let correctAnswer = transInfo["text"]

        userAnswer = cleanAndSplit(userAnswer)
        correctAnswer = cleanAndSplit(correctAnswer)

        if (userAnswer.length !== correctAnswer.length) {
            return false
        }
        
        return userAnswer.every((item, index) => item === correctAnswer[index]);
    },

    updateHint: function() {
        let userAnswer = userInput.value
        let transInfo = this.transManager.getCurrInfo()

        if (!transInfo) {  
            return false
        } 

        let correctAnswer = transInfo["text"]
        let rawCorrectAnswer = naiveCleanAndSplit(correctAnswer)

        userAnswer = cleanAndSplit(userAnswer)
        correctAnswer = cleanAndSplit(correctAnswer)

        let similarAnswer = findSimilarSublist(userAnswer, correctAnswer)
        
        let remainAnswer = correctAnswer.slice(similarAnswer.length)
        let nextWord = remainAnswer[0]
        remainAnswer = remainAnswer.slice(1)
        remainAnswer = remainAnswer.map(word => convertToAsterisks(word))

        rawCorrectAnswer = rawCorrectAnswer.slice(0, similarAnswer.length)
        
        correctAnswerText.textContent = rawCorrectAnswer.join(" ")
        incorrectWordText.textContent = nextWord
        hiddenAnswerText.textContent = remainAnswer.join(" ")
    },

    resetHint: function() {
        userInput.value = ""
        let transInfo = this.transManager.getCurrInfo()
  
        if (!transInfo) {  
            return 
        } 

        let correctAnswer = transInfo["text"]
        correctAnswer = cleanAndSplit(correctAnswer)
        
        let hiddenAnswer = correctAnswer.map(word => convertToAsterisks(word))
        
        correctAnswerText.textContent = ""
        incorrectWordText.textContent = ""
        hiddenAnswerText.textContent = hiddenAnswer.join(" ")   
    },

    compareAnswer: function() {
        this.updateHint()
        this.isCorrect = this.checkAnswer()
        if (this.isCorrect) {
            checkBtn.textContent  = "NEXT"
        }
    },

    initPlayerAndTrans: async function() {
        await this.transManager.initPlayer()
        this.resetHint()
    },

    compareAnswerOrNext: async function() {
        if (!this.isCorrect) {
            this.compareAnswer()
        } else {
            await this.transManager.nextSegment()
            checkBtn.textContent = "CHECK"
            this.isCorrect = false
            this.resetHint()
        }
    },

    showAnswer: function() {
        let transInfo = this.transManager.getCurrInfo()

        if (!transInfo) {  
            return
        } 
        correctAnswerText.textContent = ""
        incorrectWordText.textContent = ""
        hiddenAnswerText.textContent = transInfo["text"]
    },

    nextSegment: async function() {
        await this.transManager.nextSegment()
        this.resetHint()
    },

    backSegment: async function() {
        await this.transManager.backSegment()
        this.resetHint()
    },

    displaySetting: function() {
        popupOverlay.style.display = "flex"
        popupContent.style.display = "flex"
    },

    applyAndhideSetting: function() {
        popupOverlay.style.display = "none"
        popupContent.style.display = "none"
        if (!this.transManager.checkTranscriptList()) {
            return
        }
        this.transManager.updateMaxSeconds()
        this.transManager.replay()
        this.resetHint()
    },

    handleEvents: function() {
        searchBtn.onclick = () => this.initPlayerAndTrans()
        urlInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                this.initPlayerAndTrans()
            }
        })
        
        checkBtn.onclick = () => this.compareAnswerOrNext()
        userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.compareAnswerOrNext()
            }
        })

        showBtn.onclick = () => this.showAnswer()

        nextBtn.onclick = () => this.nextSegment()
        backBtn.onclick = () => this.backSegment()
        
        applyBtn.onclick = () => this.applyAndhideSetting()
        settingBtn.onclick = () => this.displaySetting()
        popupOverlay.addEventListener('click', () => {
            this.applyAndhideSetting()
        });
        
        popupContent.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    },

    start: function() {
        this.transManager.start()
        this.handleEvents()
    }
} 

answerChecker.start()
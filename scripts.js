var player;
var currentId = 0;
var originaltranscriptList;
var transcriptList;
var intervalIdList = [];

var nextWord = $("nextWord");
var answerInput = $("answerInput"); 
var identicalText = $("identicalText");
var hiddenWords = $("hiddenWords");
var checkAnswerButton = $("checkAnswer");
var currentPart = $("currentPart");
var videoUrl = $("videoUrl");
var progress = $("transcriptProgress");

var paragraphsMethodRadioButton = $("paragraphsMethodRadioButton");
var secondsMethodRadioButton = $("secondsMethodRadioButton");
var paragraphsPerPart = $("paragraphsPerPart");
var secondsPerPart = $("secondsPerPart");

paragraphsMethodRadioButton.checked = true;

function $(id) {
  return document.getElementById(id);
}

function showPopup(id) {
	$(id).style.display ='block';
  $("overlay").style.display = 'block';
}

function hidePopup(id) {
	$(id).style.display ='none';
  $("overlay").style.display = 'none';
}

videoUrl.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    playVideo();
  }
})

answerInput.addEventListener("keydown", enterToCheck);

answerInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
      event.preventDefault(); 
  }
});

async function playVideo() {
  const videoId = extractVideoId(videoUrl.value);
  
  if (player == null) {
    player = new YT.Player('videoContainer', {
        height: '390',
        width: '640',
        videoId: videoId,
        playerVars: {
        'playsinline': 1
        },
    });
  } else {
    player.loadVideoById(videoId);
    player.pauseVideo();

  }

  originaltranscriptList = await fetchTranscripts(videoId);
  transcriptList = concatenateParagraphsByNumber(originaltranscriptList, paragraphsPerPart.value);
  currentId = 0;

  currentPart.textContent = `${currentId + 1}/${transcriptList.length}`;

  // console.log(originaltranscriptList);
  // console.log(transcriptList);

  if (transcriptList != null) {
    replay();
    hiddenWords.textContent = convertToAsterisks(transcriptList[0].text);
    answerInput.focus();
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

function pauseVideo() {
  player.pauseVideo();
}

function replay(){
  player.seekTo(transcriptList[currentId].start, true);

  player.playVideo();

  let intervalId = setInterval(checkTime, 100);

  intervalIdList.push(intervalId);

  currentPart.textContent = `${currentId + 1}/${transcriptList.length}`;
  let currentProgressValue = (currentId + 1)/transcriptList.length * 100;

  progress.style.width = Math.max(currentProgressValue, 5) + "%";
}

function checkTime() {
  let currentTime = player.getCurrentTime();

  if (currentTime >= transcriptList[currentId].start + transcriptList[currentId].duration) {
      player.pauseVideo();
      for (let i=0; i < intervalIdList.length; i++) {
        clearInterval(intervalIdList[i]);
      }
  }
}

function resetAnswer() {
  hiddenWords.textContent = convertToAsterisks(transcriptList[currentId].text);
  identicalText.textContent = "";
  nextWord.textContent = "";
  answerInput.value = "";
  replay();
}

function skipBackward() {
  if (currentId - 1 >= 0) {
    currentId -= 1;
  }
  resetAnswer();
}

function skipForward() {
  if (currentId + 1 < transcriptList.length) {
    currentId += 1;
  }
  resetAnswer();
}

function extractVideoId(url) {
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
  let match = url.match(regExp);
  if (match && match[1]) {
      return match[1];
  } else {
      return null;
  }
}

function enterToCheck(event) {
  if (event.key === "Enter") {
    checkAnswer();
  } else if (event.key === "Control") {
    replay();
  }
}

function enterToNext(event) {
  if (event.key === "Enter") {
    goNextScript();
  } else if (event.key === "Control") {
    replay();
  }
}

function cleanText(text) {
  return text.replace(/[^\w\s-]/gi, '').toLowerCase().trim(); 
}

function splitText(text) {
  return text.replace(/\s+/g, ' ').trim().split(" ");
}

function convertToAsterisks(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
      if (text[i] !== ' ') {
          result += '*';
      } else {
          result += ' ';
      }
  }
  return result;
}

function generateAsteriskList(inputList) {
  let asteriskList = [];
  for (let i = 0; i < inputList.length; i++) {
      let asteriskString = '*'.repeat(inputList[i].length);
      asteriskList.push(asteriskString);
  }
  return asteriskList;
}

function getIdenticalSubString(userAnswer, correctAnswer){
  let originalCorrectWords = splitText(correctAnswer)

  let cleanedUserAnswer = cleanText(userAnswer);
  let cleanedCorrectAnswer = cleanText(correctAnswer);

  let userWords = cleanedUserAnswer.split(/[\s\n]+/);
  let correctWords = cleanedCorrectAnswer.split(/[\s\n]+/);

  let minLength = Math.min(userWords.length, correctWords.length);
  let i = 0;

  for (; i < minLength; i++) {
    if (userWords[i] != correctWords[i]) {
      break;
    }
  }

  let identicalWords = originalCorrectWords.slice(0, i);
  let nextWordValue = originalCorrectWords[i];
  let otherWords = originalCorrectWords.slice(i+1, originalCorrectWords.length);

  return [identicalWords, nextWordValue, otherWords];
}

function findFirstDifferenceLocation(str1, str2) {
  const len = Math.min(str1.length, str2.length);
  for (let i = 0; i < len; i++) {
      if (str1[i] !== str2[i]) {
          return i;
      }
  }

  return len;
}

function checkAnswer() {
  let identicalWords;
  let nextWordValue;
  let otherWords;
  let userAnswer = answerInput.value;
  let correctAnswer = transcriptList[currentId].text;

  [identicalWords, nextWordValue, otherWords] = getIdenticalSubString(userAnswer, correctAnswer);

  identicalText.textContent = identicalWords.join(" ");
  nextWord.textContent = nextWordValue;
  hiddenWords.textContent = generateAsteriskList(otherWords).join(" ");
  
  let correctWords = splitText(correctAnswer);
  let userWords = splitText(userAnswer);
  let correctLocation = identicalWords.length;
  let correctUserWords = correctWords.slice(0, correctLocation);
  let newUserWords;
  
  let nextUserWords = userWords.slice(correctLocation, userWords.length)
  if (nextWordValue === undefined) {
    checkAnswerButton.textContent = "Next [Enter]"
    answerInput.removeEventListener("keydown", enterToCheck);
    answerInput.addEventListener("keydown", enterToNext);
  } else {
    newUserWords = correctUserWords.concat(nextUserWords);
  }
  
  let newUserAnswer = newUserWords.join(" ");
  let newCursorLocation = correctUserWords.join(" ").length + 1; 

  // Add space and relocate the cursor when user doesn't write any next words
  if (
    nextUserWords.length === 0 
    && userWords.length === correctUserWords.length 
    && correctUserWords.length != correctWords.length
  ) {
    newUserAnswer += " ";
    newCursorLocation = newUserAnswer.length;
  }

  if (nextUserWords.length > 0 && nextWordValue != undefined) {
    let firstErrorWord = nextUserWords[0];
    let nextWordLocation = findFirstDifferenceLocation(firstErrorWord, cleanText(nextWordValue));
    newCursorLocation += nextWordLocation;
  } 

  answerInput.value = newUserAnswer;
  
  answerInput.selectionStart = newCursorLocation; 
  answerInput.selectionEnd = newCursorLocation;
}

function goNextScript() { 
  checkAnswerButton.textContent = "Check [Enter]"
  answerInput.removeEventListener("keydown", enterToNext);
  answerInput.addEventListener("keydown", enterToCheck);
  skipForward();
}

function skipAnswer() {
  answerInput.value =  transcriptList[currentId].text;
  checkAnswer();
}

function mergeParts(parts) {
  let newPart = {
    start: parts[0].start,
    duration: parts[0].duration,
    text: parts[0].text,
  };
  for (let partId = 1; partId < parts.length; partId++)
  {
    newPart.duration += parts[partId].duration;
    newPart.text += " " + parts[partId].text;
  }

  return newPart;
}

function concatenateParagraphsByNumber(paragraphs, paragraphsPerPart) {
  let concatenatedList = [];
  const numParagraphs = paragraphs.length;
  const numParts = Math.floor(numParagraphs / paragraphsPerPart);
  
  for (let i = 0; i < numParts; i++) {
      const startIdx = i * paragraphsPerPart;
      const endIdx = (i + 1) * paragraphsPerPart;
      const parts = paragraphs.slice(startIdx, endIdx);
      newPart = mergeParts(parts);
      concatenatedList.push(newPart);
  }
  
  // Handling the remaining paragraphs
  const remainingParagraphs = numParagraphs % paragraphsPerPart;
  if (remainingParagraphs > 0) {
      const parts = paragraphs.slice(-remainingParagraphs);
      newPart = mergeParts(parts);
      concatenatedList.push(newPart);
  }
  
  return concatenatedList;
}

function concatenateParagraphsBySecond(paragraphs, secondsPerPart) {
  const numParagraphs = paragraphs.length;
  let concatenatedList = [];
  let parts = [];
  let totalDuration = 0;

  for (let i = 0; i < numParagraphs; i++) {
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
}


function updateSetting() {
  if (originaltranscriptList != undefined) {
    if (paragraphsMethodRadioButton.checked == true) {
      transcriptList = concatenateParagraphsByNumber(originaltranscriptList, paragraphsPerPart.value);
    } else {
      transcriptList = concatenateParagraphsBySecond(originaltranscriptList, secondsPerPart.value);
    }
  }
  currentId = 0;
  resetAnswer();
  hidePopup('settingPopup')
}
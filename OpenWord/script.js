const MIN_KEY = 65;
const MAX_KEY = 90;
const ENTER_KEYCODE = 13;
const BACKSPACE_KEYCODE = 8;
const WORD_LEN = 5;
const NUM_GUESS = 6;

const COLOR_CODES = {
    "Wrong": "#3a3a3c",
    "Partial": "#b59f3b",
    "Correct": "#538d4e"
};


let grid = [];
let keyboard = {};
let keyboardColors = {};
let mainContainer = document.getElementById("main");
let resetButton = document.getElementById("reset-button");
let debugP = document.getElementById("debug");

let currentRowIndex = 0;
let currentColIndex = 0;
let currentWord;

let gameRunning;

makeCells();
makeKeyboard();
newGame();

//Make grid cells
function makeCells(){
    for(let i = 0; i < NUM_GUESS; i++){
        let row = [];
        let rowElement = Object.assign(document.createElement("div"), {id: `row${i}`});
        rowElement.classList.add("row")
        mainContainer.append(rowElement);
    
        for(let j = 0; j < WORD_LEN; j++){
            //let cell = document.getElementById(`cell${i}-${j}`);
            let cell = Object.assign(document.createElement("div"), {id: `cell${i}-${j}`});
            cell.classList.add("cell", "box")
            rowElement.append(cell);
            row.push(cell);
        }
    
        grid.push(row);
    }
}

function makeKeyboard(){
    let keyboardInfo = [];

    for(const row of "QWERTYUIOP\nASDFGHJKL\nZXCVBNM".split("\n")){
        keyboardInfo.push(row.split(""));
    }

    let keyboardContainer = Object.assign(document.createElement("div"), {id: "keyboard-container"});
    keyboardContainer.classList.add("keyboard");
    mainContainer.append(keyboardContainer);

    for(const row of keyboardInfo){
        let keyrow = Object.assign(document.createElement("div"));
        keyrow.classList.add("key-row");
        keyboardContainer.append(keyrow);
        
        for(const key of row){
            keyboardColors[key] = "Unassigned";
            let keycap = Object.assign(document.createElement("div"), {id: `${key}-keycap`, innerHTML: `${key}`});
            keycap.classList.add("key");
            keyrow.append(keycap);
            keyboard[key] = keycap
        }
    }
}

//Convert an array of <div> to a string
function rowToWord(row){
    let word = "";

    for(const cell of row){
        word += cell.textContent;
    }
    
    return word;
}

function getRandomWord(){
    return wordList[Math.floor(Math.random() * wordList.length)];
}

//Check if a word is in the word list
function isWordValid(word){
    return wordList.includes(word);
}

function createPopup(text){
    let popup = Object.assign(document.createElement("button"), {id: "popup", innerHTML: text})
    popup.classList.add("popup");
    popup.onclick = function(){
        popup.remove();
    }
    document.body.append(popup);

    return popup;
}

function checkResults(input){
    let colorInfo = Array(input.length);
    let matches = Array(input.length); //Has the corresponding letter index been matched already
    for(let i = 0; i < input.length; i++){
        let currentKey = input[i];

        grid[currentRowIndex][i].className = "cell box darkGrey";
        if(keyboardColors[currentKey] == "Unassigned"){
            keyboardColors[currentKey] = COLOR_CODES.Wrong;
            keyboard[currentKey].className = "key darkGrey";
        }
    }

    //Check for perfect matches
    for(let i = 0; i < input.length; i++){
        let inputLetter = input[i];
        let correctLetter = currentWord[i];

        if(inputLetter == correctLetter){
            colorInfo[i] = "Correct";
            keyboardColors[inputLetter] = colorInfo.Correct;

            matches[i] = true;

            grid[currentRowIndex][i].className = "cell box green";
            keyboard[inputLetter].className = "key green";
        }
    }

    //Check for partial matches
    for(let i = 0; i < input.length; i++){
        if(colorInfo[i] == "Correct") { continue; } //If it is a perfect match, skip
        let inputLetter = input[i];
        
        for(let j = 0; j < currentWord.length; j++){
            if(matches[j]) { continue; } //This letter has already been matched

            let wordLetter = currentWord[j];
            if(inputLetter == wordLetter){
                colorInfo[i] = "Partial";
                matches[j] = true;

                grid[currentRowIndex][i].className = "cell box yellow";

                if(keyboardColors[inputLetter] != "Correct"){
                    keyboard[inputLetter].className = "key yellow";
                    keyboardColors[inputLetter] = colorInfo.Partial;
                }

                break;
            }
        }
    }

    //Did the player win
    if(input == currentWord){
        gameRunning = false;
        createPopup("You won!!!!!");
    }
}

function onKeydown(event){
    if(!gameRunning) { return; }

    if(event.keyCode >= MIN_KEY && event.keyCode <= MAX_KEY){
        if(currentColIndex >= WORD_LEN){
            return;
        }
        
        let keyName = event.key.toUpperCase();
        grid[currentRowIndex][currentColIndex].innerHTML = keyName;

        currentColIndex++;
    } else if(event.keyCode == BACKSPACE_KEYCODE){
        if(currentColIndex <= 0){
            return;
        }
        
        currentColIndex--;
        grid[currentRowIndex][currentColIndex].innerHTML = "";
    } else if(event.keyCode == ENTER_KEYCODE){
        let wordInput = rowToWord(grid[currentRowIndex]);
        
        if(!isWordValid(wordInput)){
            let rowElement = document.getElementById(`row${currentRowIndex}`);

            if(!rowElement.classList.contains("wrongShake")){
                rowElement.classList.add("wrongShake");
                setTimeout(function(){
                    rowElement.classList.remove("wrongShake");
                }, 1000);
            }
            return;
        }
        
        checkResults(wordInput);

        currentRowIndex++;
        currentColIndex = 0;

        if(currentRowIndex == NUM_GUESS && gameRunning){ //Player used all of their guesses and they didn't win
            gameRunning = false;
            createPopup(`You lost. The word was ${currentWord}`);
        }
    }
}

function newGame(){
    //Reset grid
    currentRowIndex = 0;
    currentColIndex = 0;

    for(let i = 0; i < grid.length; i++){
        for(let j = 0; j < grid[i].length; j++){
            let cell = grid[i][j];
            cell.innerHTML = "";
            cell.className = "cell box";
        }
    }

    //Reset keyboard
    for(const [key, element] of Object.entries(keyboard)){
        element.className = "key";
        keyboardColors[key] = "Unassigned";
    }

    currentWord = getRandomWord();
    gameRunning = true;
    console.log(currentWord);
}

resetButton.addEventListener("click", function(event){
    newGame();
    event.target.blur();
});
document.addEventListener("keydown", onKeydown);
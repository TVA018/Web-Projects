const CONTAINER = document.getElementById("tile-container");
const FLAG_COUNTER = document.getElementById("flag-counter");
const TILE_NUM_INPUT = document.getElementById("tiles-num-input");
const BOMB_RATIO_INPUT = document.getElementById("bomb-ratio-input");
const INIT_SAFE_INPUT = document.getElementById("safe-tile-ratio-input");
const GENERATE_BUTTON = document.getElementById("generate");
const CLEAR_BUTTON = document.getElementById("clear");

const DEFAULT_NUM_TILES = 15;
const DEFAULT_BOMB_PERCENT = 0.2;
const DEFAULT_INIT_SAFE_RATIO = 0.2;

let numSafeTilesActivated;
let numTilesPerSide;
let bombRatio;
let initialSafeRatio;
let freeTilesStart;
let maxBombs;
let grid = [];
let bombGrid = [];
let startingX;
let startingY;
let numFlagsPlaced;
let gameEnded;

TILE_NUM_INPUT.addEventListener("blur", () => {
    numTilesPerSide = parseInt(TILE_NUM_INPUT.value);
    clampBombInput();
    updateInitSafeTiles();
});

BOMB_RATIO_INPUT.addEventListener("blur", clampBombInput);

INIT_SAFE_INPUT.addEventListener("blur", updateInitSafeTiles)

GENERATE_BUTTON.onclick = () => {
    newGame();
}

CLEAR_BUTTON.onclick = () => {
    resetSettings();
    newGame();
}

function resetSettings(){
    numTilesPerSide = DEFAULT_NUM_TILES;
    bombRatio = DEFAULT_BOMB_PERCENT;
    initialSafeRatio = DEFAULT_INIT_SAFE_RATIO;
    maxBombs = Math.floor((numTilesPerSide ** 2) * bombRatio);
    
    TILE_NUM_INPUT.value = numTilesPerSide;
    BOMB_RATIO_INPUT.value = bombRatio;
    INIT_SAFE_INPUT.value = initialSafeRatio;

    updateInitSafeTiles();
}

function clampBombInput(){
    bombRatio = clamp(parseFloat(BOMB_RATIO_INPUT.value), 0, 1);
    BOMB_RATIO_INPUT.value = bombRatio;
    maxBombs = Math.min(Math.floor((numTilesPerSide ** 2) * bombRatio), numTilesPerSide ** 2 - 9);
    updateInitSafeTiles();
}

function updateInitSafeTiles(){
    initialSafeRatio = clamp(parseFloat(INIT_SAFE_INPUT.value), 0, 1);
    INIT_SAFE_INPUT.value = initialSafeRatio;
    freeTilesStart = Math.max(Math.floor(((numTilesPerSide ** 2) - maxBombs) * initialSafeRatio), 9);
}

function clamp(x, min, max){
    return Math.min(Math.max(x, min), max);
}

function randomPos(){
    return Math.floor(Math.random() * numTilesPerSide);
}

function isValidTile(x, y){
    return x >= 0 && x < numTilesPerSide && y >= 0 && y < numTilesPerSide;
}

function getBombsAround(x, y){
    let numBombs = 0;
    
    for(let i = x - 1; i < x + 2; i++){
        for(let j = y - 1; j < y + 2; j++){
            if(isValidTile(i, j) && !(i == x && j == y) && bombGrid[j][i] == "💣"){
                numBombs++;
            }
        }
    }

    return numBombs;
}

function moveBomb(initialX, initialY, blacklist){
    let bombX = randomPos();
    let bombY = randomPos();
    let i = 1;

    while(bombGrid[bombY][bombX] || blacklist.indexOf(`${bombX}-${bombY}`) > -1 || getBombsAround(bombX, bombY) > 3){

        bombX = randomPos();
        bombY = randomPos();
    }

    bombGrid[bombY][bombX] = bombGrid[initialY][initialX];
    bombGrid[initialY][initialX] = null;
}

function startSpread(){
    let checkedTiles = [];

    function spreadCross(x, y, probability){
        const DIRECTIONS = [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0},
            {x: 0, y: -1}
        ]

        for(const offset of DIRECTIONS){
            let currentX = x + offset.x;
            let currentY = y + offset.y;

            let rolledChance = Math.random();
            if(!isValidTile(currentX, currentY) || rolledChance > probability || checkedTiles.includes(`${currentX}-${currentY}`)){
                continue;
            }
            if(checkedTiles.length == freeTilesStart){return;}

            checkedTiles.push(`${currentX}-${currentY}`);
            if(bombGrid[currentY][currentX]){
                moveBomb(currentX, currentY, checkedTiles);
            }
        }
    }

    function spreadSquare(x, y, probability){
        for(let currentX = x - 1; currentX < x + 2; currentX++){
            for(let currentY = y - 1; currentY < y + 2; currentY++){
                let rolledChance = Math.random();
                if(!isValidTile(currentX, currentY) || rolledChance > probability || checkedTiles.includes(`${currentX}-${currentY}`)){
                    continue;
                }

                if(checkedTiles.length == freeTilesStart){return;}

                checkedTiles.push(`${currentX}-${currentY}`);
                if(bombGrid[currentY][currentX]){
                    moveBomb(currentX, currentY, checkedTiles);
                }
            }
        }
    }

    //Initial patch
    spreadSquare(startingX, startingY, 1);

    while(checkedTiles.length < freeTilesStart){
        for(const tile of checkedTiles){
            let listVersion = tile.split("-");
            let x = parseInt(listVersion[0], 10);
            let y = parseInt(listVersion[1], 10);
            spreadCross(x, y, Math.random()*Math.random()+Math.random());
        }
    }

    activateTile(grid[startingY][startingX], startingX, startingY);
}

function activateTile(tile, x, y){
    function activateSurroundingTiles(){
        const DIRECTIONS = [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0},
            {x: 0, y: -1}
        ]

        for(let currentX = x - 1; currentX < x + 2; currentX++){
            for(let currentY = y - 1; currentY < y + 2; currentY++){
                if(!isValidTile(currentX, currentY)){continue;}

                activateTile(grid[currentY][currentX], currentX, currentY);
            }
        }
    }

    if(tile.classList.contains("active")){return;} //Tile is already active

    if(!startingX){ //First tile
        startingX = x;
        startingY = y;
        
        startSpread();
        
        /*Shows the grid, used for debugging
        for(let x = 0; x < numTilesPerSide; x++){
            for(let y = 0; y < numTilesPerSide; y++){
                activateTile(grid[y][x], x, y);
            }
        }*/
        return;
    }
    
    tile.classList.remove("inactive");
    tile.classList.remove("variant0");
    tile.classList.remove("variant1");
    tile.classList.add("active");

    if(bombGrid[y][x]){ //Is a bomb tile
        gameEnded = true;
        
        tile.classList.add("bomb-variant");
        tile.innerHTML = bombGrid[y][x];

        //Show game grid
        for(let x = 0; x < numTilesPerSide; x++){
            for(let y = 0; y < numTilesPerSide; y++){
                let tileToCheck = grid[y][x];
                let flag = tileToCheck.getElementsByClassName("flag")[0];

                if(flag && bombGrid[y][x]){ continue; }

                activateTile(tileToCheck, x, y);
            }
        }
    } else { //Is a safe tile
        numSafeTilesActivated++;
        tile.classList.add(`variant${(x+y)%2 + 2}`);

        if(numSafeTilesActivated == (numTilesPerSide ** 2 - maxBombs) && !gameEnded){ //game won
            gameEnded = true;

            for(let x = 0; x < numTilesPerSide; x++){
                for(let y = 0; y < numTilesPerSide; y++){
                    if(!bombGrid[y][x]){ continue; } //not a bomb
                    let tileToFlag = grid[y][x];

                    let flag = tileToFlag.getElementsByClassName("flag")[0];

                    if(flag){
                        flagToggle(tileToFlag, x, y); //remove the flag
                    }

                    flagToggle(tileToFlag, x, y); //add the flag
                }
            }

            return;
        }

        let bombsAround = getBombsAround(x, y);
        if(bombsAround){
            tile.innerHTML = getBombsAround(x, y);
        } else {
            activateSurroundingTiles();
        }

        
    }
}

function flagToggle(tile, x, y){
    let flag = tile.getElementsByClassName("flag")[0]

    if(flag){
        flag.remove();
        numFlagsPlaced--;
    } else {
        flag = Object.assign(document.createElement("img"), {
            src: "flag.png", 
            alt:`Flag at (${x}, ${y})`
        });
        flag.style.width = `${tile.offsetWidth * 0.8}px`;
        flag.style.height = `${tile.offsetHeight * 0.8}px`;
        flag.classList.add("flag");
        tile.append(flag);
        numFlagsPlaced++;
    }
    
    FLAG_COUNTER.innerText = `🚩:${maxBombs - numFlagsPlaced}`;
}

function createGrid(){
    for(const row of grid){
        for(const tile of row){
            tile.remove();
        }
    }

    grid = [];
    const tileSize = `${(60/numTilesPerSide)}vh`;

    for(let y = 0; y < numTilesPerSide; y++){
        let row = [];
    
        for(let x = 0; x < numTilesPerSide; x++){
            CONTAINER.style["grid-template-rows"] = "1fr ".repeat(numTilesPerSide);
            CONTAINER.style["grid-template-columns"] = "1fr ".repeat(numTilesPerSide);

            let tile = Object.assign(document.createElement("button"), {id: `tile${x}-${y}`});
            tile.classList.add("tile", `inactive`, `variant${(x + y) % 2}`);
            tile.style["grid-column-start"] = x + 1;
            tile.style["grid-column-end"] = x + 2;
            tile.style["grid-row-start"] = y + 2;
            tile.style["grid-row-end"] = y + 1;

            //Prevent context menu from opening
            tile.addEventListener("contextmenu", (event) => {
                event.preventDefault();

                if(gameEnded){ return; };

                if(tile.classList.contains("inactive")){
                    flagToggle(tile, x, y);
                }
            });
            tile.addEventListener("click", (event) => {
                if(gameEnded){ return; };

                if(event.button == 0 && tile.classList.contains("inactive") && tile.getElementsByClassName("flag").length == 0){
                    activateTile(tile, x, y);
                }
            })

            row.push(tile);
            CONTAINER.append(tile);
        }

        grid.push(row);
    }
}

function generateGame(){
    bombGrid = [];
    for(let i = 0; i < numTilesPerSide; i++){
        bombGrid.push(Array(numTilesPerSide));
    }

    let bombsPlaced = 0;
    
    while(bombsPlaced < maxBombs){
        let y = randomPos();
        let x = randomPos();
        let attemptPos = bombGrid[y][x];

        if(!attemptPos && getBombsAround(x, y) < 4){
            bombGrid[y][x] = "💣";
            bombsPlaced++;
        }
    }
}

function newGame(){
    numSafeTilesActivated = 0;
    numFlagsPlaced = 0;
    gameEnded = false;
    CONTAINER.style.setProperty("--length", numTilesPerSide);
    startingX = null;
    startingY = null;
    generateGame();
    createGrid();
    FLAG_COUNTER.innerText = `🚩:${maxBombs}`;
}

resetSettings();
newGame();
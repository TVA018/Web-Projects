let CONTAINER = document.getElementById("tile-container");
let FLAG_COUNTER = document.getElementById("flag-counter");

let numTilesPerSide = 15;
let freeTilesStart = 50;
let maxBombs = Math.floor((numTilesPerSide ** 2) * 0.2);
let grid = [];
let bombGrid = [];
let startingX;
let startingY;
let numFlagsPlaced;

function sleep(delay){
    return new Promise((resolve) => setTimeout(resolve, delay));
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

    while(bombGrid[bombY][bombX] || blacklist.indexOf(`${bombX}-${bombY}`) != -1 || getBombsAround(bombX, bombY) > 3){
        bombX = randomPos();
        bombY = randomPos();
    }

    bombGrid[bombY][bombX] = bombGrid[initialY][initialX];
    bombGrid[initialY][initialX] = null;
}

function startSpread(){
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
                console.log(1);
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

    let checkedTiles = [];

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

    console.log(checkedTiles);
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

    if(startingX == undefined){ //First tile
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
        tile.classList.add("bomb-variant");
        tile.innerHTML = bombGrid[y][x];

        //Show game grid
        for(let x = 0; x < numTilesPerSide; x++){
            for(let y = 0; y < numTilesPerSide; y++){
                activateTile(grid[y][x], x, y);
            }
        }
    } else { //Is a safe tile
        tile.classList.add(`variant${(x+y)%2 + 2}`);
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
    let tileSize = CONTAINER.clientWidth/numTilesPerSide;

    for(const row of grid){
        for(const tile of row){
            tile.remove();
        }
    }

    grid = [];

    for(let y = 0; y < numTilesPerSide; y++){
        let row = [];
    
        for(let x = 0; x < numTilesPerSide; x++){
            let tile = Object.assign(document.createElement("button"), {id: `tile${x}-${y}`});
            tile.classList.add("tile", `inactive`, `variant${(x + y) % 2}`);
            tile.style["grid-column-start"] = x + 1;
            tile.style["grid-column-end"] = x + 2;
            tile.style["grid-row-start"] = y + 2;
            tile.style["grid-row-end"] = y + 1;
            tile.style.width = `${tileSize}px`;
            tile.style.height = `${tileSize}px`;

            //Prevent context menu from opening
            tile.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                if(tile.classList.contains("inactive")){
                    flagToggle(tile, x, y);
                }
            });
            tile.addEventListener("click", (event) => {
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
    numFlagsPlaced = 0;
    CONTAINER.style.setProperty("--length", numTilesPerSide);
    generateGame();
    createGrid();
    FLAG_COUNTER.innerText = `🚩:${maxBombs}`;
}

newGame();
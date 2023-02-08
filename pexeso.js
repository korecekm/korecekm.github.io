var pexgrid;
var gamespan;
const GRIDSIZE = 4;
const SVG_INIT = '<svg viewbox="0 0 120 120" width="100%" height="100%">';
var tileBack, tileEmpty;
const full = "#008000";
const grey = "#e6e6e6";

/// GAME DATA
var takeLock;
var unfoundCount;
// 2D array of how tiles are paired up
var pairingArray;
// Generated images:
var tileImages;
// Was the pair with this index already found?
var foundArray;
// Position of the previously chosen image (if state is ChosingSecond, otherwise null)
var csFirstPos;

window.onload = function() {
    pexgrid = document.getElementById("pexgrid");
    gamespan = document.getElementById("gamespan");
    genFirst();
}

function randInt(low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
}

function wait(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

function position(sym, size, x, y, order, which) {
    let sqSize = 60 / size;
    x *= sqSize;
    y *= sqSize;
    switch (sym) {
        case 0:
            if (order == 0) {
                if (which == 0) {
                    return [x, y];
                } else {
                    return [x + 60, y];
                }
            } else {
                if (which == 0) {
                    return [120 - sqSize - x, 120 - sqSize - y];
                } else {
                    return [60 - sqSize - x, 120 - sqSize - y];
                }
            }
        case 1:
            if (order == 0) {
                if (which == 0) {
                    return [x, y];
                } else {
                    return [x + 60, y];
                }
            } else {
                if (which == 0) {
                    return [x, 120 - sqSize - y];
                } else {
                    return [x + 60, 120 - sqSize - y];
                }
            }
        default:
            if (order == 0) {
                if (which == 0) {
                    return [x, y];
                } else {
                    return [x, y + 60];
                }
            } else {
                if (which == 0) {
                    return [120 - sqSize - x, y];
                } else {
                    return [120 - sqSize - x, y + 60];
                }
            }
    }
}

function drawSquare(pos, size, col) {
    x = pos[0];
    y = pos[1];
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${col}" stroke="${col}"/>`;
}

function genImg() {
    var size = randInt(3, 4);
    var symm = randInt(0, 2);
    var final = SVG_INIT + drawSquare([0, 0], 120, grey);

    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            var fi = Math.random() > .5;
            var se = Math.random() > .5;

            if (fi)
                final += drawSquare(position(symm, size, i, j, 0, 0), 60 / size, full);
            if (fi)
                final += drawSquare(position(symm, size, i, j, 1, 0), 60 / size, full);
            if (se)
                final += drawSquare(position(symm, size, i, j, 0, 1), 60 / size, full);
            if (se)
                final += drawSquare(position(symm, size, i, j, 1, 1), 60 / size, full);
        }
    }

    return final + '</svg>';
}

function genFirst() {
    tileBack = SVG_INIT
        + drawSquare([0,0], 120, full)
        + drawSquare([20,20], 80, grey)
        + '</svg>';
    tileEmpty = SVG_INIT + drawSquare([0,0], 120, grey) + '</svg>';

    genGrid();
}

function genAgain() {
    gamespan.innerHTML = SPAN_AGAIN;

    genGrid();
}

function genGrid() {
    // Generate the trivial game data:
    takeLock = false;
    csFirstPos = null;
    let pairCount = GRIDSIZE * GRIDSIZE / 2
    unfoundCount = pairCount;
    foundArray = new Array(pairCount).fill(false);
    tileImages = [];
    for (let i = 0; i < pairCount; ++i) {
        tileImages.push(genImg());
    }
    // Generate pairing array:
    // Init:
    pairingArray = [];
    for (let i = 0; i < GRIDSIZE; ++i) {
        pairingArray.push(new Array(GRIDSIZE).fill(-1));
    }
    // Populate
    let toGo = pairCount;
    while (toGo > 0) {
        let pairWith = randInt(1, 2 * toGo - 1);
        let order = 0;
        for (let i = 0; i < GRIDSIZE; ++i) {
            for (let j = 0; j < GRIDSIZE; ++j) {
                if (pairingArray[i][j] != -1) {
                    continue;
                }
                if (order == 0) {
                    pairingArray[i][j] = toGo - 1;
                } else if (order == pairWith) {
                    pairingArray[i][j] = toGo - 1;
                    i = GRIDSIZE;
                    j = GRIDSIZE;
                }
                ++order;
            }
        }
        --toGo;
    }
    // Finally, populate the visual grid itself:
    let innerGrid = '';
    for (let i = 0; i < GRIDSIZE; ++i) {
        for (let j = 0; j < GRIDSIZE; ++j) {
            innerGrid += `<div id="tile${i}-${j}" class="pextile" onclick="tileClick(${i}, ${j})">`
                + tileBack
                + '</div>';
        }
    }
    pexgrid.innerHTML = innerGrid;
    let colAuto = 'auto';
    for (let i = 1; i < GRIDSIZE; ++i) {
        colAuto += ' auto';
    }
    pexgrid.style["grid-template-columns"] = colAuto;
}

const SPAN_NEXT_MOVE = 'Kde má karta dvojici?';
const SPAN_CORRECT = 'Správně!';
const SPAN_INCORRECT = 'Tady dvojice není.';
const SPAN_DONE = 'Výborně! <button onclick="genAgain()">Hrát znovu.</button>';
const SPAN_AGAIN = 'Nová hra.';

async function tileClick(x, y) {
    if (takeLock || foundArray[pairingArray[x][y]]) {
        return;
    }
    takeLock = true;
    if (csFirstPos == null) {
        document.getElementById(`tile${x}-${y}`).innerHTML = tileImages[pairingArray[x][y]];
        csFirstPos = [x, y];
        gamespan.innerHTML = SPAN_NEXT_MOVE;
        takeLock = false;
    } else {
        if (x == csFirstPos[0] && y == csFirstPos[1]) {
            takeLock = false;
            return;
        }
        let firstIdx = pairingArray[csFirstPos[0]][csFirstPos[1]];
        document.getElementById(`tile${x}-${y}`).innerHTML = tileImages[pairingArray[x][y]];
        if (firstIdx == pairingArray[x][y]) {
            gamespan.innerHTML = SPAN_CORRECT;
            await wait(1000);
            foundArray[firstIdx] = true;
            document.getElementById(`tile${csFirstPos[0]}-${csFirstPos[1]}`).innerHTML = tileEmpty;
            document.getElementById(`tile${x}-${y}`).innerHTML = tileEmpty;
            --unfoundCount;
            if (unfoundCount == 0) {
                gamespan.innerHTML = SPAN_DONE;
            }
            takeLock = false;
        } else {
            gamespan.innerHTML = SPAN_INCORRECT;
            await wait(1000);
            document.getElementById(`tile${csFirstPos[0]}-${csFirstPos[1]}`).innerHTML = tileBack;
            document.getElementById(`tile${x}-${y}`).innerHTML = tileBack;
            takeLock = false;
        }
        csFirstPos = null;
    }
}

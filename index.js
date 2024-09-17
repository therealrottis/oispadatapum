const boardSize = 4;
const slotSize = 80;
const marginSize = 10;
const moveSlotLength = 150;

const keyPressed = (event) => {
  let inputDir;

  if (event.key == "w" || event.key == "ArrowUp") {
    inputDir = [0, -1];
  } else if (event.key == "s" || event.key == "ArrowDown") {
    inputDir = [0, 1];
  } else if (event.key == "a" || event.key == "ArrowLeft") {
    inputDir = [-1, 0];
  } else if (event.key == "d" || event.key == "ArrowRight") {
    inputDir = [1, 0];
  }
  if (inputDir === undefined) {
    return;
  }

  clearAnimationBoard();
  executeAction(inputDir);
}

const executeAction = (inputDir) => {
  if (inputDir[0] === -1) {
    flip = true;
    transpose = false;
  } else if (inputDir[0] === 1) {
    flip = false;
    transpose = false;
  } else if (inputDir[1] === -1) {
    flip = true;
    transpose = true;
  } else if (inputDir[1] === 1) {
    flip = false;
    transpose = true;
  }

  // fake the board being transformed, by transforming the coordinates
  const at = (x, y) => {
    if (!flip) {
      x = 3 - x
    }
    if (!transpose) {
      let tmp = x;
      x = y;
      y = tmp;
    }
    return document.getElementById(slotId(x, y));
  }
  
  let moved = false;
  // imagine row is x && col is y
  for (let col = 0; col < boardSize; col++) {
    for (let originalX = 0; originalX < boardSize; originalX++) {
      let row = originalX;
      const canMergeWith = [true, true, true, true]
      let shouldPlayMove = true;

      let moveTo = originalX;
      while (row > 0) {
        if (isEmpty(at(row - 1, col))) {
          at(row-1, col).className = at(row, col).className;
          setSlotEmpty(at(row, col));

          moveTo = row - 1;
        } else if (getSlotValue(at(row - 1, col)) === getSlotValue(at(row, col)) && canMergeWith[row-1]) {
          moveTo = row - 1;
          
          fakeMergerAnimation(at(row - 1, col), at(row, col), 
              transpose ? "Y" : "X",
              flip ? -1 : 1,
              (originalX - moveTo));
          fakeMergerAnimation(at(row - 1, col), at(originalX, col), 
              transpose ? "Y" : "X",
              (originalX - moveTo) * (flip ? -1 : 1),
              (originalX - moveTo));
          const s = document.getElementById("animation-" + at(row -  1, col).id);
          const value = getSlotValue(at(row, col)) * 2;
          setTimeout(() => { setSlotValue(s, value); 
            playMergeAnimation(s); }, moveSlotLength);
          
          at(row-1, col).className = numToSlotClass(getSlotValue(at(row, col)) * 2) + " hidden";
          setSlotEmpty(at(row, col))
          
          incrementScore(getSlotValue(at(row - 1, col)));
          
          canMergeWith[row] = false;

          row = 0; // stop moving, we merged
          shouldPlayMove = false;
        } else {
          row = 0; // stop moving, can't move anymore

        }
        row--;
      }

      if (shouldPlayMove && originalX != moveTo) {
        playMoveAnimation( at(moveTo, col), transpose ? "Y" : "X", (flip ? -1 : 1) *(originalX - moveTo));
        moved = true;
      }
    }
  }

  if (!moved) {
    return; // move that does nothing? just return
  }
  
  if (gameFinished()) {
    return gameOver();
  }

  placeRandom()
}

// goes into infinite loop if no slots are empty :)
const placeRandom = () => {
  if (!hasFreeSpace()) {
    return gameOver();
  }

  let randPlaced = false;
  
  const rand_value = (Math.random() > 0.75) ? 4 : 2
  
  while (!randPlaced) {
    const rand_x = Math.floor(Math.random() * 4)
    const rand_y = Math.floor(Math.random() * 4)
    const slot = document.getElementById(slotId(rand_x, rand_y));
    if (isEmpty(slot)) {
      slot.className = numToSlotClass(rand_value)
      playPopAnimation(slot);
      randPlaced = true;
    }
  }
}

const slotId = (x, y) => {
  return "" + (x) + ";" + (y);
}

const resetBoard = () => {
  let x, y;
  for (x = 0; x < boardSize; x++) {
    for (y = 0; y < boardSize; y++) {
      const curSlot = document.getElementById(slotId(x, y));
      setSlotEmpty(curSlot);
    }
  }
}

// execute once!
const buildBoard = () => {
  let x, y;
  const board = document.getElementById("board");
  const anim_board = document.getElementById("anim-board");
  
  for (x = 0; x < boardSize; x++) {
    const row = document.createElement("div");
    board.appendChild(row);
    row.className = "board-row"
    for (y = 0; y < boardSize; y++) {
      const slot = makeNewSlot(slotId(x, y));
      row.appendChild(slot);
      if (4*x+y == 0) {
        setSlotEmpty(slot);
      } else {
        setSlotValue(slot, 2**(4*x+y));
      }
    }

    const anim_row = document.createElement("div");
    anim_board.appendChild(anim_row);
    anim_row.className = "board-row"
    for (y = 0; y < boardSize; y++) {
      const slot = makeNewSlot("animation-" + slotId(x, y));
      anim_row.appendChild(slot);
      setSlotEmpty(slot);
    }
  }
}

const makeNewSlot = (id) => {
  const slot = document.createElement("div");
  const numDisplay = document.createElement("p");
  slot.appendChild(numDisplay);
  slot.id = id;
  
  return slot;
}

const isEmpty = (slot) => {
  return slot.className.split(" ").slice(0, 2).join(" ") === "slot slot-empty";
}

const getSlotValue = (slot) => {
  const cName = slot.className;
  return cName.substring(cName.indexOf("-") + 1).split(" ")[0];
}

const numToSlotClass = (number) => {
  return "slot slot-" + number
}

const setSlotEmpty = (slot) => {
  slot.className = "slot slot-empty";
  slot.children[0].value = "";
}

const setSlotValue = (slot, value) => {
  slot.className = numToSlotClass(value);
  slot.children[0].value = value;
}

const playPopAnimation = (slot) => {
  slot.animate(
    [
      // keyframes
      { transform: "scale(0)" },
      { transform: "scale(0)", offset: 0.3 },
      { transform: "scale(1.15)" },
      { transform: "scale(1)" }
    ],
    {
      // timing options
      duration: 250,
      iterations: 1,
    },
  );
}

const playMergeAnimation = (slot) => {
  slot.animate(
    [
      // keyframes
      { transform: "scale(1)" },
      { transform: "scale(1.2)" },
      { transform: "scale(1)" }
    ],
    {
      // timing options
      duration: 250,
      iterations: 1,
    },
  );
  setTimeout(() => { setSlotEmpty(slot); }, 250)
}

const playMoveAnimation = (slot, dir, delta) => {
  slot.animate(
    [
      // keyframes
      { transform: "translate" + dir + "(" + -(delta * slotSize + (delta-1) * marginSize) + "px)" },
      { transform: "translate" + dir + "(0px)" }
    ],
    {
      // timing options
      duration: 50 * Math.abs(delta),
      iterations: 1,
      easing: "ease-in-out"
    },
  );
}

const fakeMergerAnimation = (slot, originalSlot, dir, delta, length) => {
  const animSlot = document.getElementById("animation-" + originalSlot.id);
  setSlotValue(animSlot, getSlotValue(slot));
  const animLength = moveSlotLength;
  animSlot.animate(
    [
      // keyframes
      { transform: "translate" + dir + "(0px)" },
      { transform: "translate" + dir + "(" + (delta * slotSize + (delta-1) * marginSize) + "px)" }
    ],
    {
      // timing options
      duration: animLength,
      iterations: 1,
      easing: "ease-in-out"
    },
  );
  setTimeout(() => {setSlotEmpty(animSlot)}, animLength);
}

const gameFinished = () => {
  return !(hasFreeSpace() || hasMerge());
}

const hasFreeSpace = () =>  {
  for (x = 0; x < boardSize; x++) {
    for (y = 0; y < boardSize; y++) {
      if (isEmpty(document.getElementById(slotId(x, y)))) {
        return true;
      }
    }
  }
  return false;
}

// getSlotValue returns "empty" when slot is empty, i think
// shouldn't affect hasMerge
const hasMerge = () => {
  // horizontal
  for (x = 0; x < boardSize - 1; x++) {
    for (y = 0; y < boardSize; y++) {
      if (
        getSlotValue(document.getElementById(slotId(x, y))) === getSlotValue(document.getElementById(slotId(x + 1, y)))
      ) {
        return true;
      }
    }
  }
  // vertical
  for (x = 0; x < boardSize; x++) {
    for (y = 0; y < boardSize - 1; y++) {
      if (
        getSlotValue(document.getElementById(slotId(x, y))) === getSlotValue(document.getElementById(slotId(x, y + 1)))
      ) {
        return true;
      }
    }
  }
  return false;
}

const clearAnimationBoard = () => {
  for (x = 0; x < boardSize; x++) {
    for (y = 0; y < boardSize; y++) {
      setSlotEmpty(document.getElementById("animation-" + slotId(x, y)));
    }
  } 
}

const incrementScore = (score) => {
  document.getElementById("score").textContent = (parseInt(score) + parseInt(document.getElementById("score").textContent));
}

const gameOver = () => {
}

addEventListener("keydown", keyPressed);
buildBoard();

const boardSize = 4;
const slotSize = 80;
const marginSize = 10;
const moveSlotLength = 75;


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
          setSlotValue(at(row-1, col), getSlotValue(at(row, col)));
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
          
          setSlotValue(at(row-1, col), getSlotValue(at(row, col)) * 2);
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
    gameOver();
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
      setSlotValue(slot, rand_value);
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

const key = "जय दातापुम!"

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
      setSlotEmpty(slot);
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

  for (i = 0; i < 2; i++) {
    placeRandom();
  }
}

const makeNewSlot = (id) => {
  const slot = document.createElement("div");
  const numDisplay = document.createElement("p");
  numDisplay.class = ""
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

const setSlotValueNotEmpty = (slot, value) => {
  slot.className = numToSlotClass(value);
  slot.children[0].textContent = "" + value;
}

const setSlotEmpty = (slot) => {
  slot.className = "slot slot-empty";
  slot.children[0].textContent = "";
}

const setSlotValue = (slot, value) => {
  if (value === "empty") {
    setSlotEmpty(slot);
  } else {
    setSlotValueNotEmpty(slot, value);
  }
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
      duration: 125,
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
      duration: 125,
      iterations: 1,
    },
  );
  setTimeout(() => { setSlotEmpty(slot); }, 125)
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
  updateHighScore();
}

function gameOver(){
  console.log("jai");
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

async function setEncryptedCookie(score) {
  const hash = await sha256(score + key);
  setCookie("highscore", score, 365);
  setCookie("hscore", hash, 365);
}

function getCookie(name) {
  const cname = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for(let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cname) === 0) {
          return cookie.substring(cname.length, cookie.length);
      }
  }
  return "";
}

async function getVerifiedScore() {
  const score = getCookie("highscore");
  const storedHash = getCookie("hscore");

  if (score !== "" && storedHash !== "") {
      const computedHash = await sha256(score + key);
      if (computedHash === storedHash) {
          return parseInt(score);
      }
  }
  return 0;
}


async function updateHighScore() {
  const currentScore = parseInt(document.getElementById("score").textContent);
  let highscore = await getVerifiedScore();

  if (currentScore > highscore) {
      await setEncryptedCookie(currentScore);
      highscore = currentScore;
  }

  document.getElementById("highscore").textContent = highscore;
}

async function loadHighScore() {
  const highscore = await getVerifiedScore();
  document.getElementById("highscore").textContent = highscore;
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


addEventListener("keydown", keyPressed);
buildBoard();
loadHighScore();
// SortQuest - Tile Puzzle Algorithm Visualiser
import {
    computeBfsOrder as buildBfsOrder,
    findFirstInversion,
    findMinimumIndex,
    computeHeapTrace as buildHeapTrace,
    computeMergeTrace as buildMergeTrace,
    computeQuickTrace as buildQuickTrace,
    generateBfsGraph as buildBfsGraph,
    generateBfsLabels as buildBfsLabels,
    sortedCopy,
} from "./js/algorithms.js";
import {
    getDailyChallengeDefinition as buildDailyChallenge,
    getTileCountForLevel as resolveTileCount,
    parsePuzzleParams,
    parseStoredRecords,
    validateCustomPuzzleInput as validatePuzzleInput,
} from "./js/puzzle-utils.js";

let originalTiles = [];
let tiles = [];

let selectedIndex = null;
let moves = 0;
let score = 100;
let hintsUsed = 0;
let hintStage = 0;
let selectionPassIndex = 0;
let insertionIndex = 1;
let insertionCurrentPosition = 1;
let seconds = 0;
let timerInterval = null;
let timerStartedAt = null;
let gameStarted = false;
let gameFinished = false;
let isCustomPuzzle = false;
let draggedTileIndex = null;
let isDailyChallenge = false;
let dailyDate = "";
let dailySeed = "";
let dailyOriginalTiles = [];
let pendingLeaderboardRecord = null;

// Merge Sort state
let mergeTrace = [];
let mergeTraceIndex = 0;

// Quick Sort state
let quickTrace = [];
let quickTraceIndex = 0;

// Heap Sort state
let heapTrace = [];
let heapTraceIndex = 0;

// Binary Search state
let binaryTarget = null;
let binaryLow = 0;
let binaryHigh = 0;
let binaryMid = 0;
let binaryFoundIndex = null;

// BFS Graph state
let bfsGraph = {};
let bfsOrder = [];
let bfsTraceIndex = 0;
let bfsVisitedNodes = [];

const algorithmSelect = document.getElementById("algorithmSelect");
const levelSelect = document.getElementById("levelSelect");
const levelText = document.getElementById("levelText");
const tileBoard = document.getElementById("tileBoard");
const moveCount = document.getElementById("moveCount");
const timerText = document.getElementById("timer");
const passInfo = document.getElementById("passInfo");
const scoreText = document.getElementById("score");
const messageBox = document.getElementById("messageBox");
const resultPanel = document.getElementById("resultPanel");
const finalMoves = document.getElementById("finalMoves");
const finalTime = document.getElementById("finalTime");
const finalScore = document.getElementById("finalScore");
const finalHints = document.getElementById("finalHints");
const finalStars = document.getElementById("finalStars");
const hintBtn = document.getElementById("hintBtn");
const resetBtn = document.getElementById("resetBtn");
const newPuzzleBtn = document.getElementById("newPuzzleBtn");
const clearLeaderboardBtn = document.getElementById("clearLeaderboardBtn");
const leaderboardBody = document.getElementById("leaderboardBody");
const dailyChallengeBtn = document.getElementById("dailyChallengeBtn");
const dailyChallengeStatus = document.getElementById("dailyChallengeStatus");
const clearDailyLeaderboardBtn = document.getElementById("clearDailyLeaderboardBtn");
const dailyLeaderboardBody = document.getElementById("dailyLeaderboardBody");
const customArrayInput = document.getElementById("customArrayInput");
const loadCustomBtn = document.getElementById("loadCustomBtn");
const generateShareBtn = document.getElementById("generateShareBtn");
const shareLinkInput = document.getElementById("shareLinkInput");
const hintsUsedText = document.getElementById("hintsUsed");
const leaderboardDialog = document.getElementById("leaderboardDialog");
const leaderboardForm = document.getElementById("leaderboardForm");
const playerNameInput = document.getElementById("playerNameInput");
const skipLeaderboardBtn = document.getElementById("skipLeaderboardBtn");
const phaseBadge = document.getElementById("phaseBadge");
const learningTitle = document.getElementById("learningTitle");
const algorithmSummary = document.getElementById("algorithmSummary");
const algorithmMeta = document.getElementById("algorithmMeta");
const stepProgress = document.getElementById("stepProgress");
const visualState = document.getElementById("visualState");
const bfsGraphPanel = document.getElementById("bfsGraphPanel");
const bfsGraphElement = document.getElementById("bfsGraph");
const bfsQueue = document.getElementById("bfsQueue");
const replayBtn = document.getElementById("replayBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const changeAlgorithmBtn = document.getElementById("changeAlgorithmBtn");
const resultDailyBtn = document.getElementById("resultDailyBtn");
const leaderboardStorageKey = "sortquestLeaderboard";
const dailyLeaderboardStorageKey = "sortquestDailyLeaderboard";
const algorithmLearning = {
    bubble: ["Bubble Sort objective", "Repeatedly compare neighboring values and move larger values to the right.", "Average/Worst: O(n²) · Focus: adjacent comparisons"],
    selection: ["Selection Sort objective", "Find the smallest remaining value and lock it into the next position.", "All cases: O(n²) · Focus: minimum selection"],
    insertion: ["Insertion Sort objective", "Grow a sorted prefix by moving the current key left into place.", "Average/Worst: O(n²) · Best: O(n) · Focus: sorted prefix"],
    merge: ["Merge Sort objective", "Combine two sorted halves by repeatedly choosing their smallest front value.", "All cases: O(n log n) · Focus: divide and merge"],
    quick: ["Quick Sort objective", "Partition the active range around a pivot, then solve each side.", "Average: O(n log n) · Worst: O(n²) · Focus: partitioning"],
    heap: ["Heap Sort objective", "Use a max heap to move the largest remaining value into the sorted tail.", "All cases: O(n log n) · Focus: heap property"],
    binary: ["Binary Search objective", "Discard half of a sorted search range after each midpoint check.", "Worst: O(log n) · Focus: range elimination"],
    bfs: ["Breadth-First Search objective", "Visit nodes level by level using a first-in, first-out queue.", "O(V + E) · Focus: queue-based traversal"],
};

function renderTiles() {
    tileBoard.innerHTML = "";

    tiles.forEach((value, index) => {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        let stateLabel = "Ready";

        if (selectedIndex === index) {
            tile.classList.add("selected");
            stateLabel = "Selected";
        }

        if (
            algorithmSelect.value === "selection" &&
            !gameFinished &&
            index === selectionPassIndex
        ) {
            tile.classList.add("current-pass");
            stateLabel = "Target";
        }

        if (
            algorithmSelect.value === "insertion" &&
            !gameFinished &&
            index === insertionCurrentPosition
        ) {
            tile.classList.add("current-key");
            stateLabel = "Current key";
        }

        if (algorithmSelect.value === "merge" && !gameFinished && mergeTraceIndex < mergeTrace.length) {
            const step = mergeTrace[mergeTraceIndex];
            if (index >= step.rangeStart && index <= step.rangeEnd) {
                tile.classList.add("algorithm-active");
                stateLabel = "Active range";
            }
            if (value === step.value) {
                tile.classList.add("merge-active", "trace-expected");
                stateLabel = "Compared next";
            }
        }

        if (algorithmSelect.value === "quick" && !gameFinished && quickTraceIndex < quickTrace.length) {
            const step = quickTrace[quickTraceIndex];
            if (index >= step.low && index <= step.high) {
                tile.classList.add("algorithm-active");
                stateLabel = "Active partition";
            } else {
                tile.classList.add("algorithm-complete");
                stateLabel = "Outside partition";
            }
            if (value === step.pivot) {
                tile.classList.add("quick-pivot");
                stateLabel = "Pivot";
            }
            if (value === step.value) tile.classList.add("trace-expected");
        }

        if (algorithmSelect.value === "heap" && !gameFinished && heapTraceIndex < heapTrace.length) {
            const step = heapTrace[heapTraceIndex];
            if (index < step.heapSize) {
                tile.classList.add("algorithm-active");
                stateLabel = "Active heap";
            } else {
                tile.classList.add("algorithm-sorted");
                stateLabel = "Sorted tail";
            }
            if (value === step.value) {
                tile.classList.add("heap-root", "trace-expected");
                stateLabel = "Heap maximum";
            }
        }

        if (algorithmSelect.value === "binary") {
            if (!gameFinished && index >= binaryLow && index <= binaryHigh) {
                tile.classList.add("binary-range");
                stateLabel = "Search range";
            }

            if (!gameFinished && index === binaryMid) {
                tile.classList.add("binary-mid");
                stateLabel = "Middle";
            }

            if (gameFinished && index === binaryFoundIndex) {
                tile.classList.add("binary-found");
                stateLabel = "Found";
            }
        }

        if (algorithmSelect.value === "bfs") {
            if (bfsVisitedNodes.includes(value)) {
                tile.classList.add("bfs-visited");
                stateLabel = "Visited";
            }

            if (
                !gameFinished &&
                bfsTraceIndex < bfsOrder.length &&
                value === bfsOrder[bfsTraceIndex]
            ) {
                tile.classList.add("bfs-next");
                stateLabel = "Queue front";
            }
        }

        tile.textContent = value;
        tile.tabIndex = index === 0 ? 0 : -1;
        tile.setAttribute("role", "button");
        tile.dataset.state = stateLabel;
        tile.setAttribute("aria-label", `Tile ${value}, position ${index + 1}, ${stateLabel}`);
        tile.setAttribute("aria-pressed", selectedIndex === index ? "true" : "false");
        tile.draggable = true;
        tile.addEventListener("click", () => handleTileClick(index));
        tile.addEventListener("dragstart", (event) => handleTileDragStart(event, index));
        tile.addEventListener("dragover", handleTileDragOver);
        tile.addEventListener("dragleave", (event) => handleTileDragLeave(event));
        tile.addEventListener("drop", (event) => handleTileDrop(event, index));
        tile.addEventListener("dragend", handleTileDragEnd);
        tile.addEventListener("keydown", (event) => handleTileKeydown(event, index));

        tileBoard.appendChild(tile);
    });

    updatePassInfo();
    renderLearningState();
}

function handleTileKeydown(event, index) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTileClick(index);
        return;
    }

    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const nextIndex = (index + direction + tiles.length) % tiles.length;
    const tileElements = tileBoard.querySelectorAll(".tile");
    tileElements.forEach((element, tileIndex) => { element.tabIndex = tileIndex === nextIndex ? 0 : -1; });
    tileElements[nextIndex]?.focus();
}

function handleTileDragStart(event, index) {
    if (gameFinished) {
        event.preventDefault();
        return;
    }

    draggedTileIndex = index;
    event.currentTarget.classList.add("dragging");

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
    }
}

function handleTileDragOver(event) {
    if (draggedTileIndex === null || gameFinished) {
        return;
    }

    event.preventDefault();
    event.currentTarget.classList.add("drag-over");

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
}

function handleTileDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
}

function handleTileDrop(event, dropIndex) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    if (draggedTileIndex === null || gameFinished) {
        draggedTileIndex = null;
        return;
    }

    const dragIndex = draggedTileIndex;
    draggedTileIndex = null;
    handleTileDragAction(dragIndex, dropIndex);
}

function handleTileDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
    document.querySelectorAll(".tile.drag-over").forEach((tile) => {
        tile.classList.remove("drag-over");
    });
    draggedTileIndex = null;
}

function handleTileDragAction(dragIndex, dropIndex) {
    selectedIndex = null;

    if (algorithmSelect.value === "binary") {
        validateBinarySearchMove(dragIndex);
        return;
    }

    if (algorithmSelect.value === "bfs") {
        validateBfsMove(dragIndex);
        return;
    }

    startTimer();

    if (algorithmSelect.value === "merge") {
        validateMergeSortMove(dragIndex);
        return;
    }

    if (algorithmSelect.value === "quick") {
        validateQuickSortMove(dragIndex);
        return;
    }

    if (algorithmSelect.value === "heap") {
        validateHeapSortMove(dragIndex);
        return;
    }

    if (algorithmSelect.value === "bubble") {
        validateBubbleSortMove(dragIndex, dropIndex);
    } else if (algorithmSelect.value === "selection") {
        validateSelectionSortMove(dragIndex, dropIndex);
    } else {
        validateInsertionSortMove(dragIndex, dropIndex);
    }
}

function handleTileClick(index) {
    if (gameFinished) {
        return;
    }

    if (algorithmSelect.value === "binary") {
        validateBinarySearchMove(index);
        return;
    }

    if (algorithmSelect.value === "bfs") {
        validateBfsMove(index);
        return;
    }

    startTimer();

    if (algorithmSelect.value === "merge") {
        validateMergeSortMove(index);
        return;
    }

    if (algorithmSelect.value === "quick") {
        validateQuickSortMove(index);
        return;
    }

    if (algorithmSelect.value === "heap") {
        validateHeapSortMove(index);
        return;
    }

    if (selectedIndex === null) {
        selectedIndex = index;

        if (algorithmSelect.value === "bubble") {
            setMessage("Now select an adjacent tile.", "normal");
        } else if (algorithmSelect.value === "selection") {
            setMessage(
                `Now select the tile to complete Selection Sort pass ${selectionPassIndex + 1}.`,
                "normal"
            );
        } else {
            setMessage(
                `Now move the current key left while previous tiles are larger.`,
                "normal"
            );
        }

        renderTiles();
        return;
    }

    if (selectedIndex === index) {
        if (algorithmSelect.value === "selection") {
            validateSelectionSortMove(selectedIndex, index);
            return;
        }

        if (algorithmSelect.value === "insertion") {
            validateInsertionSortMove(selectedIndex, index);
            return;
        }

        selectedIndex = null;
        setMessage("Selection cancelled.", "normal");
        renderTiles();
        return;
    }

    if (algorithmSelect.value === "bubble") {
        validateBubbleSortMove(selectedIndex, index);
    } else if (algorithmSelect.value === "selection") {
        validateSelectionSortMove(selectedIndex, index);
    } else {
        validateInsertionSortMove(selectedIndex, index);
    }
}

function validateBubbleSortMove(firstIndex, secondIndex) {
    const isAdjacent = Math.abs(firstIndex - secondIndex) === 1;

    if (!isAdjacent) {
        selectedIndex = null;
        setMessage("Invalid move: Bubble Sort can only compare adjacent tiles.", "error");
        renderTiles();
        return;
    }

    const leftIndex = Math.min(firstIndex, secondIndex);
    const rightIndex = Math.max(firstIndex, secondIndex);

    const leftValue = tiles[leftIndex];
    const rightValue = tiles[rightIndex];

    if (leftValue > rightValue) {
        swapTiles(leftIndex, rightIndex);
        moves++;
        updateStats();

        selectedIndex = null;
        setMessage("Valid Bubble Sort move!", "success");
        renderTiles();

        checkWin();
    } else {
        selectedIndex = null;
        setMessage(
            "Invalid move: Bubble Sort only swaps when the left tile is greater than the right tile.",
            "error"
        );
        renderTiles();
    }
}

function swapTiles(indexA, indexB) {
    const temp = tiles[indexA];
    tiles[indexA] = tiles[indexB];
    tiles[indexB] = temp;
}

function validateSelectionSortMove(firstIndex, secondIndex) {
    const minIndex = findMinIndex(selectionPassIndex);
    const passPosition = selectionPassIndex;

    if (firstIndex === secondIndex) {
        if (firstIndex === passPosition && minIndex === passPosition) {
            moves++;
            updateStats();
            selectionPassIndex++;
            selectedIndex = null;
            setMessage(
                `Position ${passPosition + 1} already contains the minimum value.`,
                "success"
            );
            renderTiles();
            checkWin();
            return;
        }
    }

    const isCorrectSwap =
        (firstIndex === passPosition && secondIndex === minIndex) ||
        (secondIndex === passPosition && firstIndex === minIndex);

    if (isCorrectSwap && minIndex !== passPosition) {
        swapTiles(passPosition, minIndex);
        moves++;
        selectionPassIndex++;
        updateStats();
        selectedIndex = null;
        setMessage("Valid Selection Sort move!", "success");
        renderTiles();
        checkWin();
        return;
    }

    selectedIndex = null;
    setMessage(
        "Invalid move: Selection Sort must place the minimum remaining tile into the current position.",
        "error"
    );
    renderTiles();
}

function validateInsertionSortMove(firstIndex, secondIndex) {
    const keyPosition = insertionCurrentPosition;
    const keyValue = tiles[keyPosition];

    if (firstIndex === secondIndex) {
        const leftIndex = keyPosition - 1;
        if (
            keyPosition > 0 &&
            tiles[leftIndex] <= keyValue &&
            keyPosition === insertionCurrentPosition
        ) {
            insertionIndex++;
            insertionCurrentPosition = insertionIndex;
            selectedIndex = null;
            moves++;
            updateStats();
            setMessage("Current key confirmed in position.", "success");
            renderTiles();
            checkWin();
            return;
        }
    }

    const isAdjacent = Math.abs(firstIndex - secondIndex) === 1;
    const leftIndex = Math.min(firstIndex, secondIndex);
    const rightIndex = Math.max(firstIndex, secondIndex);

    if (!isAdjacent) {
        selectedIndex = null;
        setMessage(
            "Invalid move: Insertion Sort moves the current key left while previous tiles are larger.",
            "error"
        );
        renderTiles();
        return;
    }

    if (rightIndex !== keyPosition || leftIndex !== keyPosition - 1) {
        selectedIndex = null;
        setMessage(
            "Invalid move: Insertion Sort moves the current key left while previous tiles are larger.",
            "error"
        );
        renderTiles();
        return;
    }

    if (tiles[leftIndex] > tiles[rightIndex]) {
        swapTiles(leftIndex, rightIndex);
        insertionCurrentPosition--;
        moves++;
        updateStats();
        selectedIndex = null;
        setMessage("Valid Insertion Sort move!", "success");

        if (
            insertionCurrentPosition === 0 ||
            tiles[insertionCurrentPosition - 1] <= tiles[insertionCurrentPosition]
        ) {
            insertionIndex++;
            insertionCurrentPosition = insertionIndex;
        }

        renderTiles();
        checkWin();
        return;
    }

    selectedIndex = null;
    setMessage(
        "Invalid move: Insertion Sort moves the current key left while previous tiles are larger.",
        "error"
    );
    renderTiles();
}

function findMinIndex(startIndex) {
    return findMinimumIndex(tiles, startIndex);
}

function validateMergeSortMove(clickedIndex) {
    if (mergeTraceIndex >= mergeTrace.length) {
        setMessage("Merge trace already completed.", "error");
        return;
    }

    const step = mergeTrace[mergeTraceIndex];
    const expectedValue = step.value;
    const clickedValue = tiles[clickedIndex];

    if (clickedValue === expectedValue) {
        mergeTraceIndex++;
        moves++;
        updateStats();

        if (mergeTraceIndex >= mergeTrace.length) {
            tiles = sortedCopy(originalTiles);
        }

        selectedIndex = null;
        setMessage("Valid Merge Sort step!", "success");
        renderTiles();
        checkWin();
        return;
    }

    selectedIndex = null;
    setMessage(
        `Invalid move: ${getMergeStepMessage(step)}`,
        "error"
    );
    renderTiles();
}

function validateQuickSortMove(clickedIndex) {
    if (quickTraceIndex >= quickTrace.length) {
        setMessage("Quick Sort already completed.", "error");
        return;
    }

    const step = quickTrace[quickTraceIndex];
    const expectedValue = step.value;
    const clickedValue = tiles[clickedIndex];

    if (clickedValue === expectedValue) {
        quickTraceIndex++;
        moves++;
        updateStats();

        if (quickTraceIndex >= quickTrace.length) {
            tiles = sortedCopy(originalTiles);
        }

        selectedIndex = null;
        setMessage("Valid Quick Sort step!", "success");
        renderTiles();
        checkWin();
        return;
    }

    selectedIndex = null;
    setMessage(
        `Invalid move: ${getQuickStepMessage(step)}`,
        "error"
    );
    renderTiles();
}

function validateHeapSortMove(clickedIndex) {
    if (heapTraceIndex >= heapTrace.length) {
        setMessage("Heap Sort already completed.", "error");
        return;
    }

    const step = heapTrace[heapTraceIndex];
    const expectedValue = step.value;
    const clickedValue = tiles[clickedIndex];

    if (clickedValue === expectedValue) {
        heapTraceIndex++;
        moves++;
        updateStats();

        if (heapTraceIndex >= heapTrace.length) {
            tiles = sortedCopy(originalTiles);
        }

        selectedIndex = null;
        setMessage("Valid Heap Sort step!", "success");
        renderTiles();
        checkWin();
        return;
    }

    selectedIndex = null;
    setMessage(
        `Invalid move: ${getHeapStepMessage(step)}`,
        "error"
    );
    renderTiles();
}

function getMergeStepMessage(step) {
    return `Merge Sort must take ${step.value} from the ${step.source} half while merging positions ${step.rangeStart + 1}-${step.rangeEnd + 1}.`;
}

function getQuickStepMessage(step) {
    if (step.action === "choose-pivot") {
        return `Quick Sort must choose pivot ${step.value} for positions ${step.low + 1}-${step.high + 1}.`;
    }

    if (step.action === "place-pivot") {
        return `Quick Sort must place pivot ${step.value} after partitioning positions ${step.low + 1}-${step.high + 1}.`;
    }

    return `Quick Sort must move ${step.value}, which is smaller than pivot ${step.pivot}, before the pivot.`;
}

function getHeapStepMessage(step) {
    return `Heap Sort must extract max value ${step.value} to sorted position ${step.sortedPosition + 1}.`;
}

// ===== BINARY SEARCH HELPERS =====
function prepareBinarySearch() {
    tiles = [...originalTiles].sort((a, b) => a - b);
    binaryLow = 0;
    binaryHigh = tiles.length - 1;
    binaryMid = getBinaryMidpoint();
    binaryFoundIndex = null;
    binaryTarget = tiles[Math.floor((tiles.length - 1) * 0.75)];
}

function getBinaryMidpoint() {
    return Math.floor((binaryLow + binaryHigh) / 2);
}

function validateBinarySearchMove(clickedIndex) {
    if (clickedIndex !== binaryMid) {
        setMessage("Binary Search must check the current middle element first.", "error");
        renderTiles();
        return;
    }

    startTimer();

    const clickedValue = tiles[clickedIndex];
    moves++;
    updateStats();

    if (clickedValue === binaryTarget) {
        binaryFoundIndex = clickedIndex;
        setMessage("Target found with Binary Search!", "success");
        renderTiles();
        checkWin();
        return;
    }

    if (clickedValue > binaryTarget) {
        binaryHigh = clickedIndex - 1;
    } else {
        binaryLow = clickedIndex + 1;
    }

    binaryMid = getBinaryMidpoint();
    setMessage("Valid Binary Search step!", "success");
    renderTiles();
}

// ===== BFS GRAPH HELPERS =====
function prepareBfsGraph() {
    const nodeCount = resolveTileCount(levelSelect.value);
    tiles = buildBfsLabels(nodeCount);
    bfsGraph = buildBfsGraph(tiles);
    bfsOrder = buildBfsOrder("A", bfsGraph);
    bfsTraceIndex = 0;
    bfsVisitedNodes = [];
}

function validateBfsMove(clickedIndex) {
    if (bfsTraceIndex >= bfsOrder.length) {
        setMessage("BFS traversal already completed.", "error");
        return;
    }

    const clickedNode = tiles[clickedIndex];
    const expectedNode = bfsOrder[bfsTraceIndex];

    if (clickedNode !== expectedNode) {
        setMessage(
            "BFS visits nodes level by level using a queue. Select the next node in the BFS order.",
            "error"
        );
        renderTiles();
        return;
    }

    startTimer();
    bfsVisitedNodes.push(clickedNode);
    bfsTraceIndex++;
    moves++;
    updateStats();

    setMessage("Valid BFS step!", "success");
    renderTiles();
    checkWin();
}

function updateInstructionMessage() {
    if (algorithmSelect.value === "bubble") {
        setMessage("Select two adjacent tiles to make a Bubble Sort move.", "normal");
    } else if (algorithmSelect.value === "selection") {
        setMessage(
            `Selection Sort: find the minimum from position ${selectionPassIndex + 1} onward and place it at position ${selectionPassIndex + 1}.`,
            "normal"
        );
    } else if (algorithmSelect.value === "insertion") {
        setMessage(
            `Insertion Sort: move the current key left while previous tiles are larger.`,
            "normal"
        );
    } else if (algorithmSelect.value === "merge") {
        setMessage(
            "Merge Sort: Select the value chosen by the current merge comparison.",
            "normal"
        );
    } else if (algorithmSelect.value === "quick") {
        setMessage(
            "Quick Sort: Follow the pivot selection and partition steps.",
            "normal"
        );
    } else if (algorithmSelect.value === "heap") {
        setMessage(
            "Heap Sort: Extract the current max value from the heap.",
            "normal"
        );
    } else if (algorithmSelect.value === "binary") {
        setMessage(
            `Binary Search: find target ${binaryTarget} by checking the current middle tile.`,
            "normal"
        );
    } else if (algorithmSelect.value === "bfs") {
        setMessage(
            "BFS Graph: visit nodes level by level from A using the queue order.",
            "normal"
        );
    }
}

function updatePassInfo() {
    if (gameFinished) {
        passInfo.textContent = "Algorithm complete.";
        return;
    }

    if (algorithmSelect.value === "bubble") {
        passInfo.textContent = "Compare adjacent tiles.";
    } else if (algorithmSelect.value === "selection") {
        passInfo.textContent = `Current target position: ${selectionPassIndex + 1}`;
    } else if (algorithmSelect.value === "insertion") {
        passInfo.textContent = `Current key position: ${insertionCurrentPosition + 1}`;
    } else if (algorithmSelect.value === "merge") {
        if (mergeTraceIndex < mergeTrace.length) {
            passInfo.textContent = `${mergeTraceIndex + 1}/${mergeTrace.length} | ${getMergeStepMessage(mergeTrace[mergeTraceIndex])}`;
        } else {
            passInfo.textContent = `Merge Step: ${mergeTrace.length}/${mergeTrace.length}`;
        }
    } else if (algorithmSelect.value === "quick") {
        if (quickTraceIndex < quickTrace.length) {
            passInfo.textContent = `${quickTraceIndex + 1}/${quickTrace.length} | ${getQuickStepMessage(quickTrace[quickTraceIndex])}`;
        } else {
            passInfo.textContent = `Quick Sort Step: ${quickTrace.length}/${quickTrace.length}`;
        }
    } else if (algorithmSelect.value === "heap") {
        if (heapTraceIndex < heapTrace.length) {
            passInfo.textContent = `${heapTraceIndex + 1}/${heapTrace.length} | ${getHeapStepMessage(heapTrace[heapTraceIndex])}`;
        } else {
            passInfo.textContent = `Heap Sort Step: ${heapTrace.length}/${heapTrace.length}`;
        }
    } else if (algorithmSelect.value === "binary") {
        passInfo.textContent = `Target: ${binaryTarget} | Range: ${binaryLow + 1}-${binaryHigh + 1} | Middle: ${tiles[binaryMid]}`;
    } else if (algorithmSelect.value === "bfs") {
        if (bfsTraceIndex < bfsOrder.length) {
            passInfo.textContent = `BFS Progress: ${bfsTraceIndex}/${bfsOrder.length} | Next: ${bfsOrder[bfsTraceIndex]}`;
        } else {
            passInfo.textContent = `BFS Progress: ${bfsOrder.length}/${bfsOrder.length}`;
        }
    }
}

function checkWin() {
    let isSolved = false;

    if (algorithmSelect.value === "binary") {
        isSolved = binaryFoundIndex !== null;
    } else if (algorithmSelect.value === "bfs") {
        isSolved = bfsTraceIndex >= bfsOrder.length;
    } else {
        const sorted = [...tiles].sort((a, b) => a - b);
        isSolved = tiles.every((value, index) => value === sorted[index]);
    }

    if (isSolved) {
        gameFinished = true;
        selectedIndex = null;
        stopTimer();

        const stars = calculateStars();

        finalMoves.textContent = moves;
        finalTime.textContent = timerText.textContent;
        finalScore.textContent = score;
        finalHints.textContent = hintsUsed;
        finalStars.textContent = stars;

        resultPanel.classList.remove("hidden");

        setMessage(`Completed! Your rating: ${stars}`, "success");
        renderTiles();
        updatePassInfo();
        promptAndSaveLeaderboard();
    }
}

function promptAndSaveLeaderboard() {
    pendingLeaderboardRecord = {
        playerName: "Anonymous",
        algorithm: algorithmSelect.options[algorithmSelect.selectedIndex].text,
        level: levelSelect.value,
        score,
        moves,
        time: timerText.textContent,
        stars: calculateStars(),
        hintsUsed,
        dateTime: new Date().toISOString(),
    };

    if (isDailyChallenge) {
        pendingLeaderboardRecord.date = dailyDate;
        pendingLeaderboardRecord.dailySeed = dailySeed;
    }

    if (typeof leaderboardDialog.showModal === "function") {
        playerNameInput.value = "Anonymous";
        leaderboardDialog.showModal();
        playerNameInput.select();
    } else {
        savePendingLeaderboardRecord();
    }
}

function renderLearningState() {
    const mode = algorithmSelect.value;
    const [title, summary, meta] = algorithmLearning[mode];
    learningTitle.textContent = title;
    algorithmSummary.textContent = summary;
    algorithmMeta.textContent = meta;
    visualState.replaceChildren();

    let phase = "Compare";
    let progress = `Moves: ${moves}`;
    let details = "Choose the next step using the highlighted state.";

    if (mode === "selection") {
        phase = "Select minimum";
        progress = `Pass ${Math.min(selectionPassIndex + 1, tiles.length)}/${tiles.length - 1}`;
        details = `Target position ${selectionPassIndex + 1}; the earlier positions are complete.`;
    } else if (mode === "insertion") {
        phase = "Insert key";
        progress = `Key ${Math.min(insertionIndex + 1, tiles.length)}/${tiles.length}`;
        details = `Sorted prefix: positions 1–${Math.max(1, insertionCurrentPosition)}. Compare the key with its left neighbor.`;
    } else if (mode === "merge") {
        phase = "Merge halves";
        progress = `Step ${Math.min(mergeTraceIndex + 1, mergeTrace.length)}/${mergeTrace.length}`;
        const step = mergeTrace[mergeTraceIndex];
        if (step) details = `Active range ${step.rangeStart + 1}–${step.rangeEnd + 1}. Left remaining [${step.leftRemaining.join(", ") || "empty"}] · Right remaining [${step.rightRemaining.join(", ") || "empty"}]. Compare ${step.comparedValues.join(" and ")}.`;
    } else if (mode === "quick") {
        const step = quickTrace[quickTraceIndex];
        phase = step?.action === "choose-pivot" ? "Choose pivot" : step?.action === "place-pivot" ? "Place pivot" : "Partition";
        progress = `Step ${Math.min(quickTraceIndex + 1, quickTrace.length)}/${quickTrace.length}`;
        if (step) details = `Active range ${step.low + 1}–${step.high + 1}; pivot ${step.pivot}. Values smaller than the pivot belong on its left.`;
    } else if (mode === "heap") {
        phase = "Extract maximum";
        progress = `Extraction ${Math.min(heapTraceIndex + 1, heapTrace.length)}/${heapTrace.length}`;
        const step = heapTrace[heapTraceIndex];
        if (step) details = `Heap [${step.heapSnapshot.join(", ")}]. Root ${step.value}${step.children.length ? ` is ≥ children ${step.children.join(" and ")}` : " has no children"}, so it moves to sorted position ${step.sortedPosition + 1}.`;
    } else if (mode === "binary") {
        phase = gameFinished ? "Target found" : "Check midpoint";
        progress = `Range ${Math.max(0, binaryHigh - binaryLow + 1)} values`;
        details = gameFinished ? `Target ${binaryTarget} was found.` : `Target ${binaryTarget}; compare it with midpoint ${tiles[binaryMid]} at position ${binaryMid + 1}.`;
    } else if (mode === "bfs") {
        phase = gameFinished ? "Traversal complete" : "Dequeue next";
        progress = `Visited ${bfsTraceIndex}/${bfsOrder.length}`;
        const queue = getBfsQueue();
        details = queue.length ? `Queue front: ${queue[0]}. Visit it before the nodes behind it.` : "The queue is empty; traversal is complete.";
    }

    phaseBadge.textContent = phase;
    stepProgress.textContent = progress;
    const detailText = document.createElement("p");
    detailText.textContent = details;
    visualState.appendChild(detailText);

    bfsGraphPanel.classList.toggle("hidden", mode !== "bfs");
    if (mode === "bfs") renderBfsGraph();
}

function getBfsQueue() {
    const queue = ["A"];
    for (let index = 0; index < bfsTraceIndex; index++) {
        const node = queue.shift();
        if (node) queue.push(...(bfsGraph[node] || []));
    }
    return queue;
}

function renderBfsGraph() {
    const namespace = "http://www.w3.org/2000/svg";
    const width = 800;
    const levels = Math.max(1, Math.ceil(Math.log2(tiles.length + 1)));
    const height = Math.max(220, levels * 90);
    const positions = new Map();
    bfsGraphElement.replaceChildren();
    bfsGraphElement.setAttribute("viewBox", `0 0 ${width} ${height}`);

    tiles.forEach((label, index) => {
        const level = Math.floor(Math.log2(index + 1));
        const firstAtLevel = 2 ** level - 1;
        const offset = index - firstAtLevel;
        const count = 2 ** level;
        positions.set(label, { x: ((offset + 1) * width) / (count + 1), y: 45 + level * 88 });
    });

    Object.entries(bfsGraph).forEach(([parent, children]) => {
        children.forEach((child) => {
            const line = document.createElementNS(namespace, "line");
            line.setAttribute("x1", positions.get(parent).x);
            line.setAttribute("y1", positions.get(parent).y);
            line.setAttribute("x2", positions.get(child).x);
            line.setAttribute("y2", positions.get(child).y);
            line.setAttribute("class", bfsVisitedNodes.includes(parent) ? "graph-edge visited" : "graph-edge");
            bfsGraphElement.appendChild(line);
        });
    });

    const queue = getBfsQueue();
    tiles.forEach((label) => {
        const group = document.createElementNS(namespace, "g");
        const position = positions.get(label);
        const state = bfsVisitedNodes.includes(label) ? "visited" : queue[0] === label ? "current" : "pending";
        group.setAttribute("class", `graph-node ${state}`);
        group.setAttribute("transform", `translate(${position.x} ${position.y})`);
        const circle = document.createElementNS(namespace, "circle");
        circle.setAttribute("r", "24");
        const text = document.createElementNS(namespace, "text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", ".35em");
        text.textContent = label;
        group.append(circle, text);
        bfsGraphElement.appendChild(group);
    });
    bfsQueue.textContent = `Queue: ${queue.join(" → ") || "empty"}`;
}

function savePendingLeaderboardRecord() {
    if (!pendingLeaderboardRecord) return;

    if (pendingLeaderboardRecord.date) {
        saveDailyLeaderboardRecord(pendingLeaderboardRecord);
        renderDailyLeaderboard();
    } else {
        saveLeaderboardRecord(pendingLeaderboardRecord);
        renderLeaderboard();
    }
    pendingLeaderboardRecord = null;
}

function getPerfectMoveLimit() {
    if (algorithmSelect.value === "selection") {
        return getSelectionPerfectMoves(originalTiles);
    }

    if (algorithmSelect.value === "insertion") {
        return getInsertionPerfectMoves(originalTiles);
    }

    if (algorithmSelect.value === "merge") {
        return mergeTrace.length;
    }

    if (algorithmSelect.value === "quick") {
        return quickTrace.length;
    }

    if (algorithmSelect.value === "heap") {
        return heapTrace.length;
    }

    if (algorithmSelect.value === "binary") {
        return getBinaryPerfectMoves();
    }

    if (algorithmSelect.value === "bfs") {
        return bfsOrder.length;
    }

    return getInversionCount(originalTiles);
}

function getBinaryPerfectMoves() {
    let low = 0;
    let high = tiles.length - 1;
    let movesCount = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        movesCount++;

        if (tiles[mid] === binaryTarget) {
            return movesCount;
        }

        if (tiles[mid] > binaryTarget) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    return movesCount;
}

function getInversionCount(array) {
    let count = 0;

    for (let i = 0; i < array.length; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i] > array[j]) {
                count++;
            }
        }
    }

    return count;
}

function getSelectionPerfectMoves(array) {
    const tilesCopy = [...array];
    let movesCount = 0;

    for (let i = 0; i < tilesCopy.length - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < tilesCopy.length; j++) {
            if (tilesCopy[j] < tilesCopy[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex === i) {
            movesCount++;
        } else {
            const temp = tilesCopy[i];
            tilesCopy[i] = tilesCopy[minIndex];
            tilesCopy[minIndex] = temp;
            movesCount++;
        }

        const sorted = [...tilesCopy].sort((a, b) => a - b);
        if (tilesCopy.every((value, index) => value === sorted[index])) {
            break;
        }
    }

    return movesCount;
}

function getInsertionPerfectMoves(array) {
    let movesCount = 0;

    for (let i = 1; i < array.length; i++) {
        const key = array[i];
        let greaterCount = 0;

        for (let j = 0; j < i; j++) {
            if (array[j] > key) {
                greaterCount++;
            }
        }

        movesCount += greaterCount > 0 ? greaterCount : 1;
    }

    return movesCount;
}

function calculateStars() {
    const perfectLimit = getPerfectMoveLimit();
    const tileCount = tiles.length;
    const parTimeLimit = getParTimeLimit(
        algorithmSelect.value,
        levelSelect.value,
        tileCount
    );

    if (moves <= perfectLimit && hintsUsed === 0 && seconds <= parTimeLimit) {
        return "★★★";
    } else if (
        moves <= perfectLimit + 3 &&
        hintsUsed <= 1 &&
        seconds <= parTimeLimit * 1.5
    ) {
        return "★★";
    } else {
        return "★";
    }
}

function getParTimeLimit(mode, level, tileCount) {
    const modeMultiplier = getParTimeModeMultiplier(mode);
    const levelMultiplier = 1 + (Number(level) - 1) * 0.15;

    return Math.round(Math.max(5, tileCount * modeMultiplier * levelMultiplier));
}

function getParTimeModeMultiplier(mode) {
    switch (mode) {
        case "bubble":
            return 6;
        case "selection":
            return 4;
        case "insertion":
            return 5;
        case "merge":
        case "quick":
            return 3;
        case "heap":
            return 3.5;
        case "binary":
            return 1;
        case "bfs":
            return 2;
        default:
            return 3;
    }
}

function getLeaderboardRecords() {
    return readStoredRecords(leaderboardStorageKey);
}

function saveLeaderboardRecords(records) {
    writeStoredRecords(leaderboardStorageKey, records);
}

function timeStringToSeconds(timeString) {
    const [minutes, secondsStr] = timeString.split(":");
    return Number(minutes) * 60 + Number(secondsStr);
}

function saveLeaderboardRecord(record) {
    const records = getLeaderboardRecords();
    records.push(record);
    records.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }
        return timeStringToSeconds(a.time) - timeStringToSeconds(b.time);
    });
    saveLeaderboardRecords(records);
}

function getDailyLeaderboardRecords() {
    return readStoredRecords(dailyLeaderboardStorageKey);
}

function saveDailyLeaderboardRecords(records) {
    writeStoredRecords(dailyLeaderboardStorageKey, records);
}

function readStoredRecords(storageKey) {
    try {
        return parseStoredRecords(localStorage.getItem(storageKey));
    } catch (error) {
        return [];
    }
}

function writeStoredRecords(storageKey, records) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(records));
    } catch (error) {
        setMessage("Leaderboard could not be saved in this browser.", "error");
    }
}

function removeStoredRecords(storageKey, showErrorMessage = true) {
    try {
        localStorage.removeItem(storageKey);
    } catch (error) {
        if (showErrorMessage) {
            setMessage("Leaderboard could not be cleared in this browser.", "error");
        }
    }
}

function saveDailyLeaderboardRecord(record) {
    const records = getDailyLeaderboardRecords();
    records.push(record);
    records.sort((a, b) => {
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }

        return timeStringToSeconds(a.time) - timeStringToSeconds(b.time);
    });
    saveDailyLeaderboardRecords(records);
}

function renderLeaderboard() {
    const records = getLeaderboardRecords();
    const topRecords = records.slice(0, 10);

    leaderboardBody.replaceChildren();

    if (topRecords.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.textContent = "No leaderboard records yet.";
        row.appendChild(cell);
        leaderboardBody.appendChild(row);
        return;
    }

    topRecords.forEach((record, index) => {
        const row = document.createElement("tr");
        const cells = [
            index + 1,
            record.playerName,
            record.algorithm,
            record.level,
            record.score,
            record.moves,
            record.time,
            record.stars,
        ];

        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        leaderboardBody.appendChild(row);
    });
}

function renderDailyLeaderboard() {
    const records = getDailyLeaderboardRecords();
    const activeDate = dailyDate || getDailyDateString();
    const todayRecords = records.filter((record) => record.date === activeDate);
    const topRecords = [...todayRecords]
        .sort((a, b) => {
            if (a.moves !== b.moves) {
                return a.moves - b.moves;
            }

            return timeStringToSeconds(a.time) - timeStringToSeconds(b.time);
        })
        .slice(0, 10);

    dailyLeaderboardBody.replaceChildren();

    if (topRecords.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.textContent = "No daily records yet.";
        row.appendChild(cell);
        dailyLeaderboardBody.appendChild(row);
        return;
    }

    topRecords.forEach((record, index) => {
        const row = document.createElement("tr");
        const cells = [
            index + 1,
            record.playerName,
            record.date,
            record.algorithm,
            record.level,
            record.moves,
            record.time,
            record.stars,
        ];

        cells.forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        dailyLeaderboardBody.appendChild(row);
    });
}

function clearLeaderboard() {
    if (confirm("Clear leaderboard?")) {
        removeStoredRecords(leaderboardStorageKey);
        renderLeaderboard();
    }
}

function clearDailyLeaderboard() {
    if (confirm("Clear daily leaderboard?")) {
        removeStoredRecords(dailyLeaderboardStorageKey);
        renderDailyLeaderboard();
    }
}

function updateStats() {
    score = Math.max(0, 100 - moves * 5 - hintsUsed * 10);
    setHudValue(moveCount, moves);
    setHudValue(hintsUsedText, hintsUsed);
    setHudValue(scoreText, score);
}

function setHudValue(element, value) {
    if (element.textContent === String(value)) return;
    element.textContent = value;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.animate(
            [{ transform: "translateY(3px)", opacity: 0.55 }, { transform: "translateY(0)", opacity: 1 }],
            { duration: 180, easing: "ease-out" }
        );
    }
}

function setMessage(message, type) {
    messageBox.textContent = message;

    messageBox.classList.remove("success", "error");

    if (type === "success") {
        messageBox.classList.add("success");
    }

    if (type === "error") {
        messageBox.classList.add("error");
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        messageBox.animate(
            type === "error"
                ? [{ transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }]
                : [{ opacity: 0.55, transform: "translateY(2px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: type === "error" ? 170 : 190, easing: "ease-out" }
        );
    }
}

function startTimer() {
    if (gameStarted) {
        return;
    }

    gameStarted = true;
    timerStartedAt = Date.now() - seconds * 1000;

    timerInterval = setInterval(() => {
        seconds = Math.floor((Date.now() - timerStartedAt) / 1000);
        updateTimerText();
    }, 1000);
}

function stopTimer() {
    if (timerStartedAt !== null && gameStarted) {
        seconds = Math.floor((Date.now() - timerStartedAt) / 1000);
        updateTimerText();
    }
    clearInterval(timerInterval);
    timerInterval = null;
    timerStartedAt = null;
}

function updateTimerText() {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    const formattedMin = String(min).padStart(2, "0");
    const formattedSec = String(sec).padStart(2, "0");

    timerText.textContent = `${formattedMin}:${formattedSec}`;
}

function startDailyChallenge() {
    const challenge = getDailyChallengeDefinition();

    isDailyChallenge = true;
    dailyDate = challenge.date;
    dailySeed = challenge.seed;
    dailyOriginalTiles = [...challenge.tiles];

    algorithmSelect.value = challenge.mode;
    levelSelect.value = challenge.level;
    originalTiles = [...dailyOriginalTiles];
    isCustomPuzzle = false;
    customArrayInput.value = "";

    resetGame();
    renderDailyLeaderboard();
    setMessage("Daily Challenge started. Hints are disabled.", "normal");
}

function exitDailyChallenge(showMessage) {
    if (!isDailyChallenge) {
        return;
    }

    isDailyChallenge = false;
    dailyOriginalTiles = [];
    updateDailyChallengeStatus();

    if (showMessage) {
        setMessage("Daily Challenge ended. Normal puzzle started.", "normal");
    }
}

function getDailyChallengeDefinition() {
    return buildDailyChallenge(getDailyDateString());
}

function getDailyDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateDailyChallengeStatus() {
    if (!dailyChallengeStatus) {
        return;
    }

    const challenge = dailyDate ? { date: dailyDate, seed: dailySeed } : getDailyChallengeDefinition();

    if (isDailyChallenge) {
        dailyChallengeStatus.textContent =
            `Active: ${challenge.date} | Seed: ${challenge.seed} | Mode: ${algorithmSelect.options[algorithmSelect.selectedIndex].text} | Level ${levelSelect.value}`;
        dailyChallengeStatus.parentElement.classList.add("daily-active");
        hintBtn.classList.add("button-disabled");
        hintBtn.disabled = true;
        hintBtn.setAttribute("aria-disabled", "true");
        return;
    }

    dailyChallengeStatus.textContent = `Today: ${challenge.date} | Seed: ${challenge.seed}`;
    dailyChallengeStatus.parentElement.classList.remove("daily-active");
    hintBtn.classList.remove("button-disabled");
    hintBtn.disabled = false;
    hintBtn.removeAttribute("aria-disabled");
}

function resetGame() {
    tiles = [...originalTiles];
    selectedIndex = null;
    moves = 0;
    score = 100;
    hintsUsed = 0;
    hintStage = 0;
    selectionPassIndex = 0;
    insertionIndex = 1;
    insertionCurrentPosition = 1;
    seconds = 0;
    gameStarted = false;
    timerStartedAt = null;
    gameFinished = false;

    // Reset new mode states
    mergeTrace = buildMergeTrace(originalTiles);
    mergeTraceIndex = 0;

    quickTrace = buildQuickTrace(originalTiles);
    quickTraceIndex = 0;

    heapTrace = buildHeapTrace(originalTiles);
    heapTraceIndex = 0;

    binaryTarget = null;
    binaryLow = 0;
    binaryHigh = 0;
    binaryMid = 0;
    binaryFoundIndex = null;

    bfsGraph = {};
    bfsOrder = [];
    bfsTraceIndex = 0;
    bfsVisitedNodes = [];

    if (algorithmSelect.value === "binary") {
        prepareBinarySearch();
    }

    if (algorithmSelect.value === "bfs") {
        prepareBfsGraph();
    }

    stopTimer();

    levelText.textContent = isCustomPuzzle ? "Custom" : levelSelect.value;
    moveCount.textContent = "0";
    scoreText.textContent = "100";
    timerText.textContent = "00:00";
    hintsUsedText.textContent = "0";

    resultPanel.classList.add("hidden");
    updateDailyChallengeStatus();
    updateInstructionMessage();
    updatePassInfo();
    renderTiles();
}

function newPuzzle() {
    const wasDailyChallenge = isDailyChallenge;
    exitDailyChallenge(false);
    isCustomPuzzle = false;
    originalTiles = generateRandomTiles();
    resetGame();

    if (wasDailyChallenge) {
        setMessage("Daily Challenge ended. Normal puzzle started.", "normal");
    }
}

function loadCustomPuzzle(inputValue) {
    const validation = validatePuzzleInput(inputValue);

    if (!validation.valid) {
        setMessage(validation.message, "error");
        return;
    }

    exitDailyChallenge(false);
    originalTiles = [...validation.numbers];
    isCustomPuzzle = true;
    customArrayInput.value = originalTiles.join(",");
    resetGame();
    setMessage("Custom puzzle loaded successfully.", "success");
}

function generateShareLink() {
    if (!originalTiles || originalTiles.length < 3) {
        setMessage("No valid puzzle is loaded to share.", "error");
        return;
    }

    const baseUrl = window.location.href.split("?")[0];
    const url = new URL(baseUrl);
    url.searchParams.set("custom", originalTiles.join(","));
    url.searchParams.set("mode", algorithmSelect.value);
    url.searchParams.set("level", levelSelect.value);

    shareLinkInput.value = url.toString();
    setMessage("Share link generated successfully.", "success");
}

function loadPuzzleFromUrl() {
    const parsed = parsePuzzleParams(window.location.search);
    if (!parsed.hasPuzzle) {
        return;
    }

    if (!parsed.valid) {
        setMessage(`Shared puzzle could not be loaded: ${parsed.message}`, "error");
        return;
    }

    originalTiles = [...parsed.numbers];
    exitDailyChallenge(false);
    isCustomPuzzle = true;
    customArrayInput.value = originalTiles.join(",");

    algorithmSelect.value = parsed.mode;
    levelSelect.value = parsed.level;

    resetGame();
    setMessage(parsed.usedFallback
        ? "Shared puzzle loaded. Unsupported options were reset to safe defaults."
        : "Shared puzzle loaded successfully.", "success");
}

function findFirstBubbleSwapHint() {
    return findFirstInversion(tiles);
}

function handleHintClick() {
    if (isDailyChallenge) {
        setMessage("Hints are disabled in Daily Challenge.", "error");
        return;
    }

    if (gameFinished) {
        setMessage("Game complete. Start a new puzzle to get more hints.", "normal");
        return;
    }

    hintsUsed += 1;
    hintStage = Math.min(3, hintStage + 1);
    updateStats();

    if (algorithmSelect.value === "bubble") {
        const hint = findFirstBubbleSwapHint();

        if (!hint) {
            setMessage("No hint available: the current tiles are already in sorted adjacent order.", "normal");
            return;
        }

        setMessage(hintStage === 1
            ? "Hint 1/3: Bubble Sort only swaps adjacent values that are out of order."
            : hintStage === 2
                ? "Hint 2/3: Scan from the left for the first neighboring pair where the left value is larger."
                : `Hint 3/3: Try swapping ${hint.left} and ${hint.right}.`, "normal");
        return;
    }

    if (algorithmSelect.value === "selection") {
        setMessage(
            hintStage === 1
                ? "Hint 1/3: Selection Sort fixes one position per pass by finding the smallest remaining value."
                : hintStage === 2
                    ? `Hint 2/3: Search positions ${selectionPassIndex + 1} through ${tiles.length}.`
                    : `Hint 3/3: Place ${tiles[findMinIndex(selectionPassIndex)]} at position ${selectionPassIndex + 1}.`,
            "normal"
        );
        return;
    }

    if (algorithmSelect.value === "insertion") {
        const leftIndex = insertionCurrentPosition - 1;
        const needsSwap = insertionCurrentPosition > 0 && tiles[leftIndex] > tiles[insertionCurrentPosition];
        setMessage(hintStage === 1
            ? "Hint 1/3: Insertion Sort grows a sorted prefix one key at a time."
            : hintStage === 2
                ? `Hint 2/3: Compare key ${tiles[insertionCurrentPosition]} with the value immediately to its left.`
                : needsSwap
                    ? `Hint 3/3: Swap ${tiles[insertionCurrentPosition]} with ${tiles[leftIndex]}.`
                    : `Hint 3/3: The key is placed; select ${tiles[insertionCurrentPosition]} twice to confirm.`, "normal");
        return;
    }

    if (algorithmSelect.value === "merge") {
        if (mergeTraceIndex < mergeTrace.length) {
            const step = mergeTrace[mergeTraceIndex];
            setMessage(
                hintStage === 1
                    ? "Hint 1/3: Merge by comparing the first unmerged value in each sorted half."
                    : hintStage === 2
                        ? `Hint 2/3: Work only inside positions ${step.rangeStart + 1}–${step.rangeEnd + 1}; compare the left and right halves.`
                        : `Hint 3/3: Select ${step.value} from the ${step.source} half.`,
                "normal"
            );
        } else {
            setMessage("Merge trace already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "quick") {
        if (quickTraceIndex < quickTrace.length) {
            const step = quickTrace[quickTraceIndex];
            setMessage(
                hintStage === 1
                    ? "Hint 1/3: Quick Sort partitions one active range around a pivot."
                    : hintStage === 2
                        ? `Hint 2/3: Focus on positions ${step.low + 1}–${step.high + 1}; pivot is ${step.pivot}.`
                        : `Hint 3/3: ${getQuickStepMessage(step)}`,
                "normal"
            );
        } else {
            setMessage("Quick Sort already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "heap") {
        if (heapTraceIndex < heapTrace.length) {
            const step = heapTrace[heapTraceIndex];
            setMessage(
                hintStage === 1
                    ? "Hint 1/3: A max heap keeps the largest active value at its root."
                    : hintStage === 2
                        ? `Hint 2/3: The active heap contains ${step.heapSize} values; the rest is the sorted tail.`
                        : `Hint 3/3: Select root value ${step.value} for position ${step.sortedPosition + 1}.`,
                "normal"
            );
        } else {
            setMessage("Heap Sort already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "binary") {
        setMessage(hintStage === 1
            ? "Hint 1/3: Binary Search always checks the middle of the remaining sorted range."
            : hintStage === 2
                ? `Hint 2/3: The active range is positions ${binaryLow + 1}–${binaryHigh + 1}.`
                : `Hint 3/3: Check value ${tiles[binaryMid]} at position ${binaryMid + 1}.`, "normal");
        return;
    }

    if (algorithmSelect.value === "bfs") {
        if (bfsTraceIndex < bfsOrder.length) {
            const queue = getBfsQueue();
            setMessage(hintStage === 1
                ? "Hint 1/3: BFS visits the oldest discovered node first using a queue."
                : hintStage === 2
                    ? `Hint 2/3: Read the queue from left to right; it currently contains ${queue.join(", ")}.`
                    : `Hint 3/3: Visit node ${bfsOrder[bfsTraceIndex]} next.`, "normal");
        } else {
            setMessage("BFS traversal already completed.", "normal");
        }
        return;
    }
}

function generateRandomTiles() {
    const tileCount = resolveTileCount(levelSelect.value);
    const numbers = Array.from({ length: tileCount }, (_, index) => index + 1);

    const puzzle = [...numbers].sort(() => Math.random() - 0.5);
    const sortedPuzzle = [...puzzle].sort((a, b) => a - b);
    const alreadySorted = puzzle.every((value, index) => value === sortedPuzzle[index]);

    if (alreadySorted) {
        return generateRandomTiles();
    }

    return puzzle;
}

algorithmSelect.addEventListener("change", () => {
    exitDailyChallenge(false);
    resetGame();
});

levelSelect.addEventListener("change", () => {
    exitDailyChallenge(false);
    isCustomPuzzle = false;
    originalTiles = generateRandomTiles();
    resetGame();
});

dailyChallengeBtn.addEventListener("click", startDailyChallenge);
hintBtn.addEventListener("click", handleHintClick);
resetBtn.addEventListener("click", resetGame);
newPuzzleBtn.addEventListener("click", newPuzzle);
loadCustomBtn.addEventListener("click", () => loadCustomPuzzle(customArrayInput.value));
generateShareBtn.addEventListener("click", generateShareLink);
clearLeaderboardBtn.addEventListener("click", clearLeaderboard);
clearDailyLeaderboardBtn.addEventListener("click", clearDailyLeaderboard);
leaderboardForm.addEventListener("submit", () => {
    pendingLeaderboardRecord.playerName = playerNameInput.value.trim() || "Anonymous";
    savePendingLeaderboardRecord();
});
skipLeaderboardBtn.addEventListener("click", () => {
    pendingLeaderboardRecord = null;
    leaderboardDialog.close();
});
replayBtn.addEventListener("click", resetGame);
nextLevelBtn.addEventListener("click", () => {
    exitDailyChallenge(false);
    isCustomPuzzle = false;
    const nextLevel = Math.min(5, Number(levelSelect.value) + 1);
    levelSelect.value = String(nextLevel);
    originalTiles = generateRandomTiles();
    resetGame();
});
changeAlgorithmBtn.addEventListener("click", () => {
    resultPanel.classList.add("hidden");
    algorithmSelect.focus();
});
resultDailyBtn.addEventListener("click", startDailyChallenge);

document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;
    if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        handleHintClick();
    } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetGame();
    }
});

levelText.textContent = levelSelect.value;
loadPuzzleFromUrl();
if (!isCustomPuzzle) {
    originalTiles = generateRandomTiles();
    resetGame();
}
renderLeaderboard();
updateDailyChallengeStatus();
renderDailyLeaderboard();

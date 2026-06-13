// SortQuest - Tile Puzzle Algorithm Visualiser

let originalTiles = [];
let tiles = [];

let selectedIndex = null;
let moves = 0;
let score = 100;
let hintsUsed = 0;
let selectionPassIndex = 0;
let insertionIndex = 1;
let insertionCurrentPosition = 1;
let seconds = 0;
let timerInterval = null;
let gameStarted = false;
let gameFinished = false;
let isCustomPuzzle = false;
let draggedTileIndex = null;
let isDailyChallenge = false;
let dailyDate = "";
let dailySeed = "";
let dailyOriginalTiles = [];

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
const leaderboardStorageKey = "sortquestLeaderboard";
const dailyLeaderboardStorageKey = "sortquestDailyLeaderboard";
const dailyModes = ["bubble", "selection", "insertion", "merge", "quick", "heap", "binary", "bfs"];

function renderTiles() {
    tileBoard.innerHTML = "";

    tiles.forEach((value, index) => {
        const tile = document.createElement("div");
        tile.classList.add("tile");

        if (selectedIndex === index) {
            tile.classList.add("selected");
        }

        if (
            algorithmSelect.value === "selection" &&
            !gameFinished &&
            index === selectionPassIndex
        ) {
            tile.classList.add("current-pass");
        }

        if (
            algorithmSelect.value === "insertion" &&
            !gameFinished &&
            index === insertionCurrentPosition
        ) {
            tile.classList.add("current-key");
        }

        if (
            algorithmSelect.value === "merge" &&
            !gameFinished &&
            value === getTraceExpectedValue(mergeTrace, mergeTraceIndex)
        ) {
            tile.classList.add("merge-active", "trace-expected");
        }

        if (
            algorithmSelect.value === "quick" &&
            !gameFinished &&
            value === getTraceExpectedValue(quickTrace, quickTraceIndex)
        ) {
            tile.classList.add("quick-pivot", "trace-expected");
        }

        if (
            algorithmSelect.value === "heap" &&
            !gameFinished &&
            value === getTraceExpectedValue(heapTrace, heapTraceIndex)
        ) {
            tile.classList.add("heap-root", "trace-expected");
        }

        if (algorithmSelect.value === "binary") {
            if (!gameFinished && index >= binaryLow && index <= binaryHigh) {
                tile.classList.add("binary-range");
            }

            if (!gameFinished && index === binaryMid) {
                tile.classList.add("binary-mid");
            }

            if (gameFinished && index === binaryFoundIndex) {
                tile.classList.add("binary-found");
            }
        }

        if (algorithmSelect.value === "bfs") {
            if (bfsVisitedNodes.includes(value)) {
                tile.classList.add("bfs-visited");
            }

            if (
                !gameFinished &&
                bfsTraceIndex < bfsOrder.length &&
                value === bfsOrder[bfsTraceIndex]
            ) {
                tile.classList.add("bfs-next");
            }
        }

        tile.textContent = value;
        tile.draggable = true;
        tile.addEventListener("click", () => handleTileClick(index));
        tile.addEventListener("dragstart", (event) => handleTileDragStart(event, index));
        tile.addEventListener("dragover", handleTileDragOver);
        tile.addEventListener("dragleave", (event) => handleTileDragLeave(event));
        tile.addEventListener("drop", (event) => handleTileDrop(event, index));
        tile.addEventListener("dragend", handleTileDragEnd);

        tileBoard.appendChild(tile);
    });

    updatePassInfo();
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
    let minIndex = startIndex;

    for (let i = startIndex + 1; i < tiles.length; i++) {
        if (tiles[i] < tiles[minIndex]) {
            minIndex = i;
        }
    }

    return minIndex;
}

// ===== MERGE SORT HELPERS =====
function computeMergeTrace(arr) {
    const trace = [];

    function sortRange(values, startIndex) {
        if (values.length <= 1) {
            return values;
        }

        const middle = Math.floor(values.length / 2);
        const left = sortRange(values.slice(0, middle), startIndex);
        const right = sortRange(values.slice(middle), startIndex + middle);
        const merged = [];
        let leftIndex = 0;
        let rightIndex = 0;

        while (leftIndex < left.length && rightIndex < right.length) {
            const takeLeft = left[leftIndex] <= right[rightIndex];
            const value = takeLeft ? left[leftIndex] : right[rightIndex];

            trace.push({
                value,
                action: "merge",
                rangeStart: startIndex,
                rangeEnd: startIndex + values.length - 1,
                leftValues: [...left],
                rightValues: [...right],
                source: takeLeft ? "left" : "right",
            });

            merged.push(value);

            if (takeLeft) {
                leftIndex++;
            } else {
                rightIndex++;
            }
        }

        while (leftIndex < left.length) {
            const value = left[leftIndex];
            trace.push({
                value,
                action: "merge",
                rangeStart: startIndex,
                rangeEnd: startIndex + values.length - 1,
                leftValues: [...left],
                rightValues: [...right],
                source: "left",
            });
            merged.push(value);
            leftIndex++;
        }

        while (rightIndex < right.length) {
            const value = right[rightIndex];
            trace.push({
                value,
                action: "merge",
                rangeStart: startIndex,
                rangeEnd: startIndex + values.length - 1,
                leftValues: [...left],
                rightValues: [...right],
                source: "right",
            });
            merged.push(value);
            rightIndex++;
        }

        return merged;
    }

    sortRange([...arr], 0);

    return trace;
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
            tiles = getSortedTiles(originalTiles);
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

// ===== QUICK SORT HELPERS =====
function computeQuickTrace(arr) {
    const trace = [];
    const working = [...arr];

    function partition(low, high) {
        const pivot = working[high];
        let smallerBoundary = low;

        trace.push({
            value: pivot,
            action: "choose-pivot",
            low,
            high,
            pivot,
        });

        for (let scan = low; scan < high; scan++) {
            if (working[scan] < pivot) {
                trace.push({
                    value: working[scan],
                    action: "move-before-pivot",
                    low,
                    high,
                    pivot,
                });
                swapArrayValues(working, smallerBoundary, scan);
                smallerBoundary++;
            }
        }

        trace.push({
            value: pivot,
            action: "place-pivot",
            low,
            high,
            pivot,
        });
        swapArrayValues(working, smallerBoundary, high);

        return smallerBoundary;
    }

    function quickSort(low, high) {
        if (low >= high) {
            return;
        }

        const pivotIndex = partition(low, high);
        quickSort(low, pivotIndex - 1);
        quickSort(pivotIndex + 1, high);
    }

    quickSort(0, working.length - 1);

    return trace;
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
            tiles = getSortedTiles(originalTiles);
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

// ===== HEAP SORT HELPERS =====
function computeHeapTrace(arr) {
    const trace = [];
    const heap = [...arr];

    function heapify(heapSize, rootIndex) {
        let largest = rootIndex;
        const leftChild = rootIndex * 2 + 1;
        const rightChild = rootIndex * 2 + 2;

        if (leftChild < heapSize && heap[leftChild] > heap[largest]) {
            largest = leftChild;
        }

        if (rightChild < heapSize && heap[rightChild] > heap[largest]) {
            largest = rightChild;
        }

        if (largest !== rootIndex) {
            swapArrayValues(heap, rootIndex, largest);
            heapify(heapSize, largest);
        }
    }

    for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
        heapify(heap.length, i);
    }

    for (let endIndex = heap.length - 1; endIndex > 0; endIndex--) {
        trace.push({
            value: heap[0],
            action: "extract-max",
            sortedPosition: endIndex,
            heapSize: endIndex + 1,
        });
        swapArrayValues(heap, 0, endIndex);
        heapify(endIndex, 0);
    }

    return trace;
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
            tiles = getSortedTiles(originalTiles);
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

function getTraceExpectedValue(trace, index) {
    if (index >= trace.length) {
        return null;
    }

    return trace[index].value;
}

function swapArrayValues(array, indexA, indexB) {
    const temp = array[indexA];
    array[indexA] = array[indexB];
    array[indexB] = temp;
}

function getSortedTiles(array) {
    return [...array].sort((a, b) => a - b);
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
    const nodeCount = getTileCountForLevel(levelSelect.value);
    tiles = generateBfsLabels(nodeCount);
    bfsGraph = generateBfsGraph(tiles);
    bfsOrder = computeBfsOrder("A", bfsGraph);
    bfsTraceIndex = 0;
    bfsVisitedNodes = [];
}

function generateBfsLabels(count) {
    return Array.from({ length: count }, (_, index) => {
        return getBfsLabel(index);
    });
}

function getBfsLabel(index) {
    let label = "";
    let value = index;

    do {
        label = String.fromCharCode(65 + (value % 26)) + label;
        value = Math.floor(value / 26) - 1;
    } while (value >= 0);

    return label;
}

function generateBfsGraph(labels) {
    const graph = {};

    labels.forEach((label, index) => {
        graph[label] = [];

        const leftChildIndex = index * 2 + 1;
        const rightChildIndex = index * 2 + 2;

        if (leftChildIndex < labels.length) {
            graph[label].push(labels[leftChildIndex]);
        }

        if (rightChildIndex < labels.length) {
            graph[label].push(labels[rightChildIndex]);
        }
    });

    return graph;
}

function computeBfsOrder(startNode, graph) {
    const visited = new Set([startNode]);
    const queue = [startNode];
    const order = [];

    while (queue.length > 0) {
        const currentNode = queue.shift();
        order.push(currentNode);

        graph[currentNode].forEach((neighbor) => {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        });
    }

    return order;
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
    let playerName = prompt("Enter your name for the leaderboard:", "Anonymous");

    if (!playerName || !playerName.trim()) {
        playerName = "Anonymous";
    }

    const record = {
        playerName,
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
        record.date = dailyDate;
        record.dailySeed = dailySeed;
        saveDailyLeaderboardRecord(record);
        renderDailyLeaderboard();
        return;
    }

    saveLeaderboardRecord(record);
    renderLeaderboard();
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

function getTileCountForLevel(levelValue) {
    switch (levelValue) {
        case "1":
            return 4;
        case "2":
            return 8;
        case "3":
            return 16;
        case "4":
            return 32;
        case "5":
            return 64;
        default:
            return 4;
    }
}

function isValidLevelValue(levelValue) {
    return ["1", "2", "3", "4", "5"].includes(levelValue);
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
        const stored = localStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        removeStoredRecords(storageKey, false);
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
    moveCount.textContent = moves;
    hintsUsedText.textContent = hintsUsed;

    score = Math.max(0, 100 - moves * 5 - hintsUsed * 10);
    scoreText.textContent = score;
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
}

function startTimer() {
    if (gameStarted) {
        return;
    }

    gameStarted = true;

    timerInterval = setInterval(() => {
        seconds++;
        updateTimerText();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
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
    const date = getDailyDateString();
    const seed = `sortquest-${date}`;
    const seedNumber = getSeedNumber(seed);
    const mode = dailyModes[seedNumber % dailyModes.length];
    const level = seedNumber % 2 === 0 ? "2" : "3";
    const tileCount = getTileCountForLevel(level);

    return {
        date,
        seed,
        mode,
        level,
        tiles: generateSeededTiles(tileCount, seedNumber),
    };
}

function getDailyDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getSeedNumber(seedText) {
    let hash = 0;

    for (let i = 0; i < seedText.length; i++) {
        hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
    }

    return hash;
}

function seededRandom(seed) {
    let value = seed >>> 0;

    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

function generateSeededTiles(tileCount, seed) {
    const random = seededRandom(seed);
    const puzzle = Array.from({ length: tileCount }, (_, index) => index + 1);

    for (let i = puzzle.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp = puzzle[i];
        puzzle[i] = puzzle[j];
        puzzle[j] = temp;
    }

    const alreadySorted = puzzle.every((value, index) => value === index + 1);

    if (alreadySorted && puzzle.length > 1) {
        const temp = puzzle[0];
        puzzle[0] = puzzle[1];
        puzzle[1] = temp;
    }

    return puzzle;
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
        return;
    }

    dailyChallengeStatus.textContent = `Today: ${challenge.date} | Seed: ${challenge.seed}`;
    dailyChallengeStatus.parentElement.classList.remove("daily-active");
    hintBtn.classList.remove("button-disabled");
}

function resetGame() {
    tiles = [...originalTiles];
    selectedIndex = null;
    moves = 0;
    score = 100;
    hintsUsed = 0;
    selectionPassIndex = 0;
    insertionIndex = 1;
    insertionCurrentPosition = 1;
    seconds = 0;
    gameStarted = false;
    gameFinished = false;

    // Reset new mode states
    mergeTrace = computeMergeTrace(originalTiles);
    mergeTraceIndex = 0;

    quickTrace = computeQuickTrace(originalTiles);
    quickTraceIndex = 0;

    heapTrace = computeHeapTrace(originalTiles);
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
    const validation = validateCustomPuzzleInput(inputValue);

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
    const params = new URLSearchParams(window.location.search);
    const custom = params.get("custom");
    const mode = params.get("mode");
    const level = params.get("level");

    if (!custom) {
        return;
    }

    const validation = validateCustomPuzzleInput(custom);

    if (!validation.valid) {
        setMessage(validation.message, "error");
        return;
    }

    originalTiles = [...validation.numbers];
    exitDailyChallenge(false);
    isCustomPuzzle = true;
    customArrayInput.value = originalTiles.join(",");

    const validModes = ["bubble", "selection", "insertion", "merge", "quick", "heap", "binary", "bfs"];
    if (mode && validModes.includes(mode)) {
        algorithmSelect.value = mode;
    }

    if (level && isValidLevelValue(level)) {
        levelSelect.value = level;
    }

    resetGame();
    setMessage("Custom puzzle loaded successfully.", "success");
}

function findFirstBubbleSwapHint() {
    for (let i = 0; i < tiles.length - 1; i++) {
        if (tiles[i] > tiles[i + 1]) {
            return { left: tiles[i], right: tiles[i + 1] };
        }
    }
    return null;
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
    updateStats();

    if (algorithmSelect.value === "bubble") {
        const hint = findFirstBubbleSwapHint();

        if (!hint) {
            setMessage("No hint available: the current tiles are already in sorted adjacent order.", "normal");
            return;
        }

        setMessage(`Hint: Try swapping ${hint.left} and ${hint.right}.`, "normal");
        return;
    }

    if (algorithmSelect.value === "selection") {
        setMessage(
            `Hint: Find the minimum from position ${selectionPassIndex + 1} onward and place it at position ${selectionPassIndex + 1}.`,
            "normal"
        );
        return;
    }

    if (algorithmSelect.value === "insertion") {
        const leftIndex = insertionCurrentPosition - 1;
        if (
            insertionCurrentPosition > 0 &&
            tiles[leftIndex] > tiles[insertionCurrentPosition]
        ) {
            setMessage(
                "Hint: Move the current key left by swapping it with the larger tile before it.",
                "normal"
            );
        } else {
            setMessage(
                "Hint: The current key is already in the correct position. Click it twice to confirm.",
                "normal"
            );
        }
        return;
    }

    if (algorithmSelect.value === "merge") {
        if (mergeTraceIndex < mergeTrace.length) {
            setMessage(
                `Hint: ${getMergeStepMessage(mergeTrace[mergeTraceIndex])}`,
                "normal"
            );
        } else {
            setMessage("Merge trace already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "quick") {
        if (quickTraceIndex < quickTrace.length) {
            setMessage(
                `Hint: ${getQuickStepMessage(quickTrace[quickTraceIndex])}`,
                "normal"
            );
        } else {
            setMessage("Quick Sort already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "heap") {
        if (heapTraceIndex < heapTrace.length) {
            setMessage(
                `Hint: ${getHeapStepMessage(heapTrace[heapTraceIndex])}`,
                "normal"
            );
        } else {
            setMessage("Heap Sort already completed.", "normal");
        }
        return;
    }

    if (algorithmSelect.value === "binary") {
        setMessage(`Hint: Check the middle value ${tiles[binaryMid]}.`, "normal");
        return;
    }

    if (algorithmSelect.value === "bfs") {
        if (bfsTraceIndex < bfsOrder.length) {
            setMessage(`Hint: Visit node ${bfsOrder[bfsTraceIndex]} next.`, "normal");
        } else {
            setMessage("BFS traversal already completed.", "normal");
        }
        return;
    }
}

function generateRandomTiles() {
    const tileCount = getTileCountForLevel(levelSelect.value);
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

levelText.textContent = levelSelect.value;
loadPuzzleFromUrl();
if (!isCustomPuzzle) {
    originalTiles = generateRandomTiles();
    resetGame();
}
updateInstructionMessage();
renderTiles();
renderLeaderboard();
updateDailyChallengeStatus();
renderDailyLeaderboard();

function validateCustomPuzzleInput(inputValue) {
    const raw = inputValue.trim();

    if (raw === "") {
        return {
            valid: false,
            message: "Custom puzzle cannot be empty."
        };
    }

    const parts = raw.split(",").map((part) => part.trim());

    if (parts.length < 3) {
        return {
            valid: false,
            message: "Custom puzzle must contain at least 3 numbers."
        };
    }

    if (parts.length > 64) {
        return {
            valid: false,
            message: "Custom puzzle can contain at most 64 numbers."
        };
    }

    const numbers = [];

    for (const part of parts) {
        if (!/^[1-9][0-9]*$/.test(part)) {
            return {
                valid: false,
                message: "Custom puzzle must contain only positive integers."
            };
        }

        numbers.push(Number(part));

        if (!Number.isSafeInteger(numbers[numbers.length - 1])) {
            return {
                valid: false,
                message: "Custom puzzle numbers are too large."
            };
        }
    }

    const uniqueNumbers = new Set(numbers);

    if (uniqueNumbers.size !== numbers.length) {
        return {
            valid: false,
            message: "Custom puzzle cannot contain duplicate numbers."
        };
    }

    const alreadySorted = numbers.every((value, index, array) => {
        return index === 0 || array[index - 1] < value;
    });

    if (alreadySorted) {
        return {
            valid: false,
            message: "Custom puzzle cannot already be sorted."
        };
    }

    return {
        valid: true,
        numbers
    };
}

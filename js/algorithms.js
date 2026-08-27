export function swapValues(array, indexA, indexB) {
    const temp = array[indexA];
    array[indexA] = array[indexB];
    array[indexB] = temp;
}

export function sortedCopy(array) {
    return [...array].sort((a, b) => a - b);
}

export function findFirstInversion(array) {
    for (let index = 0; index < array.length - 1; index++) {
        if (array[index] > array[index + 1]) return { index, left: array[index], right: array[index + 1] };
    }
    return null;
}

export function findMinimumIndex(array, startIndex = 0) {
    if (startIndex < 0 || startIndex >= array.length) return -1;
    let minimumIndex = startIndex;
    for (let index = startIndex + 1; index < array.length; index++) {
        if (array[index] < array[minimumIndex]) minimumIndex = index;
    }
    return minimumIndex;
}

export function getInsertionAction(array, keyIndex) {
    if (keyIndex <= 0 || keyIndex >= array.length) return { action: "confirm", keyIndex };
    return array[keyIndex - 1] > array[keyIndex]
        ? { action: "swap-left", keyIndex, leftIndex: keyIndex - 1 }
        : { action: "confirm", keyIndex };
}

export function computeBinarySearchTrace(sortedArray, target) {
    const trace = [];
    let low = 0;
    let high = sortedArray.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        trace.push({ low, high, mid, value: sortedArray[mid] });
        if (sortedArray[mid] === target) return { foundIndex: mid, trace };
        if (sortedArray[mid] > target) high = mid - 1;
        else low = mid + 1;
    }
    return { foundIndex: -1, trace };
}

export function computeMergeTrace(array) {
    const trace = [];

    function sortRange(values, startIndex) {
        if (values.length <= 1) return values;

        const middle = Math.floor(values.length / 2);
        const left = sortRange(values.slice(0, middle), startIndex);
        const right = sortRange(values.slice(middle), startIndex + middle);
        const merged = [];
        let leftIndex = 0;
        let rightIndex = 0;

        while (leftIndex < left.length || rightIndex < right.length) {
            const leftRemaining = left.slice(leftIndex);
            const rightRemaining = right.slice(rightIndex);
            const takeLeft = rightIndex >= right.length ||
                (leftIndex < left.length && left[leftIndex] <= right[rightIndex]);
            const value = takeLeft ? left[leftIndex++] : right[rightIndex++];
            trace.push({
                value,
                action: "merge",
                rangeStart: startIndex,
                rangeEnd: startIndex + values.length - 1,
                leftValues: [...left],
                rightValues: [...right],
                leftRemaining,
                rightRemaining,
                comparedValues: [leftRemaining[0], rightRemaining[0]].filter((item) => item !== undefined),
                source: takeLeft ? "left" : "right",
            });
            merged.push(value);
        }

        return merged;
    }

    sortRange([...array], 0);
    return trace;
}

export function computeQuickTrace(array) {
    const trace = [];
    const working = [...array];

    function partition(low, high) {
        const pivot = working[high];
        let smallerBoundary = low;
        trace.push({ value: pivot, action: "choose-pivot", low, high, pivot });

        for (let scan = low; scan < high; scan++) {
            if (working[scan] < pivot) {
                trace.push({
                    value: working[scan], action: "move-before-pivot", low, high, pivot,
                });
                swapValues(working, smallerBoundary, scan);
                smallerBoundary++;
            }
        }

        trace.push({ value: pivot, action: "place-pivot", low, high, pivot });
        swapValues(working, smallerBoundary, high);
        return smallerBoundary;
    }

    function quickSort(low, high) {
        if (low >= high) return;
        const pivotIndex = partition(low, high);
        quickSort(low, pivotIndex - 1);
        quickSort(pivotIndex + 1, high);
    }

    quickSort(0, working.length - 1);
    return trace;
}

export function computeHeapTrace(array) {
    const trace = [];
    const heap = [...array];

    function heapify(heapSize, rootIndex) {
        let largest = rootIndex;
        const leftChild = rootIndex * 2 + 1;
        const rightChild = rootIndex * 2 + 2;
        if (leftChild < heapSize && heap[leftChild] > heap[largest]) largest = leftChild;
        if (rightChild < heapSize && heap[rightChild] > heap[largest]) largest = rightChild;
        if (largest !== rootIndex) {
            swapValues(heap, rootIndex, largest);
            heapify(heapSize, largest);
        }
    }

    for (let index = Math.floor(heap.length / 2) - 1; index >= 0; index--) {
        heapify(heap.length, index);
    }
    for (let endIndex = heap.length - 1; endIndex > 0; endIndex--) {
        trace.push({
            value: heap[0],
            action: "extract-max",
            sortedPosition: endIndex,
            heapSize: endIndex + 1,
            heapSnapshot: heap.slice(0, endIndex + 1),
            children: heap.slice(1, Math.min(3, endIndex + 1)),
        });
        swapValues(heap, 0, endIndex);
        heapify(endIndex, 0);
    }
    return trace;
}

export function generateBfsLabels(count) {
    return Array.from({ length: count }, (_, index) => {
        let label = "";
        let value = index;
        do {
            label = String.fromCharCode(65 + (value % 26)) + label;
            value = Math.floor(value / 26) - 1;
        } while (value >= 0);
        return label;
    });
}

export function generateBfsGraph(labels) {
    const graph = {};
    labels.forEach((label, index) => {
        graph[label] = [];
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        if (left < labels.length) graph[label].push(labels[left]);
        if (right < labels.length) graph[label].push(labels[right]);
    });
    return graph;
}

export function computeBfsOrder(startNode, graph) {
    if (!graph[startNode]) return [];
    const visited = new Set([startNode]);
    const queue = [startNode];
    const order = [];
    while (queue.length) {
        const node = queue.shift();
        order.push(node);
        graph[node].forEach((neighbor) => {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        });
    }
    return order;
}

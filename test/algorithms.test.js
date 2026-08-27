import test from "node:test";
import assert from "node:assert/strict";
import { computeBfsOrder, computeBinarySearchTrace, computeHeapTrace, computeMergeTrace, computeQuickTrace, findFirstInversion, findMinimumIndex, generateBfsGraph, generateBfsLabels, getInsertionAction } from "../js/algorithms.js";

for (const values of [[4, 1, 3, 2], [5, 4, 3, 2, 1], [1, 2, 3], [2, 1], [3, 1, 3, 2]]) {
    test(`algorithm traces are deterministic for ${values}`, () => {
        const merge = computeMergeTrace(values);
        const quick = computeQuickTrace(values);
        const heap = computeHeapTrace(values);
        const sorted = [...values].sort((a, b) => a - b);
        assert.deepEqual(merge.slice(-values.length).map((step) => step.value), sorted);
        assert.deepEqual(computeMergeTrace(values), merge);
        assert.deepEqual(computeQuickTrace(values), quick);
        assert.deepEqual(heap.map((step) => step.value), sorted.slice(1).reverse());
        assert.ok(quick.every((step) => step.action !== "move-before-pivot" || step.value < step.pivot));
    });
}

test("BFS follows level order", () => {
    const labels = generateBfsLabels(8);
    assert.deepEqual(computeBfsOrder("A", generateBfsGraph(labels)), labels);
});

test("comparison helpers cover sorted, reverse, duplicate, and negative values", () => {
    assert.equal(findFirstInversion([-2, -1, 0]), null);
    assert.deepEqual(findFirstInversion([3, 2, 1]), { index: 0, left: 3, right: 2 });
    assert.equal(findMinimumIndex([4, -2, -2, 8], 1), 1);
    assert.deepEqual(getInsertionAction([1, 3, 2], 2), { action: "swap-left", keyIndex: 2, leftIndex: 1 });
    assert.deepEqual(getInsertionAction([1, 2, 3], 2), { action: "confirm", keyIndex: 2 });
});

test("binary search reports found and not-found traces", () => {
    assert.equal(computeBinarySearchTrace([-3, 0, 4, 9], 4).foundIndex, 2);
    const missing = computeBinarySearchTrace([1, 2, 3, 4], 7);
    assert.equal(missing.foundIndex, -1);
    assert.deepEqual(missing.trace.map((step) => step.value), [2, 3, 4]);
});

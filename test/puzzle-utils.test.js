import test from "node:test";
import assert from "node:assert/strict";
import { getDailyChallengeDefinition, parsePuzzleParams, parseStoredRecords, validateCustomPuzzleInput } from "../js/puzzle-utils.js";

test("validates custom puzzle edge cases", () => {
    for (const input of ["", "1", "1,2", "1,2,3", "1,1,2", "1,-2,3", "1,2.5,3", "1,x,3"]) {
        assert.equal(validateCustomPuzzleInput(input).valid, false, input);
    }
    assert.deepEqual(validateCustomPuzzleInput(" 3, 1, 2 ").numbers, [3, 1, 2]);
});

test("URL parsing applies safe fallbacks", () => {
    assert.equal(parsePuzzleParams("").hasPuzzle, false);
    assert.equal(parsePuzzleParams("?custom=broken").valid, false);
    assert.deepEqual(parsePuzzleParams("?custom=3,1,2&mode=nope&level=99"), {
        hasPuzzle: true, valid: true, numbers: [3, 1, 2], mode: "bubble", level: "1", usedFallback: true,
    });
});

test("daily challenge is stable for a calendar date", () => {
    assert.deepEqual(getDailyChallengeDefinition("2026-08-27"), getDailyChallengeDefinition("2026-08-27"));
    assert.notDeepEqual(getDailyChallengeDefinition("2026-08-27"), getDailyChallengeDefinition("2026-08-28"));
});

test("stored records recover from malformed and old data", () => {
    assert.deepEqual(parseStoredRecords("not-json"), []);
    assert.deepEqual(parseStoredRecords('{"old":true}'), []);
    assert.deepEqual(parseStoredRecords('[null,{"score":10}]'), [{ score: 10 }]);
});

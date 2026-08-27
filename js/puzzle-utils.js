export const VALID_MODES = ["bubble", "selection", "insertion", "merge", "quick", "heap", "binary", "bfs"];
export const VALID_LEVELS = ["1", "2", "3", "4", "5"];

export function getTileCountForLevel(level) {
    return ({ "1": 4, "2": 8, "3": 16, "4": 32, "5": 64 })[level] || 4;
}

export function validateCustomPuzzleInput(inputValue) {
    const raw = String(inputValue ?? "").trim();
    if (!raw) return { valid: false, message: "Custom puzzle cannot be empty." };

    const parts = raw.split(",").map((part) => part.trim());
    if (parts.length < 3) return { valid: false, message: "Custom puzzle must contain at least 3 numbers." };
    if (parts.length > 64) return { valid: false, message: "Custom puzzle can contain at most 64 numbers." };

    const numbers = [];
    for (const part of parts) {
        if (!/^[1-9][0-9]*$/.test(part)) {
            return { valid: false, message: "Use comma-separated positive whole numbers only." };
        }
        const number = Number(part);
        if (!Number.isSafeInteger(number)) {
            return { valid: false, message: "Custom puzzle numbers are too large." };
        }
        numbers.push(number);
    }
    if (new Set(numbers).size !== numbers.length) {
        return { valid: false, message: "Custom puzzle cannot contain duplicate numbers." };
    }
    if (numbers.every((value, index) => index === 0 || numbers[index - 1] < value)) {
        return { valid: false, message: "Custom puzzle cannot already be sorted." };
    }
    return { valid: true, numbers };
}

export function parsePuzzleParams(search) {
    const params = new URLSearchParams(search);
    const custom = params.get("custom");
    if (!custom) return { hasPuzzle: false };

    const validation = validateCustomPuzzleInput(custom);
    if (!validation.valid) return { hasPuzzle: true, valid: false, message: validation.message };

    const rawMode = params.get("mode");
    const rawLevel = params.get("level");
    return {
        hasPuzzle: true,
        valid: true,
        numbers: validation.numbers,
        mode: VALID_MODES.includes(rawMode) ? rawMode : "bubble",
        level: VALID_LEVELS.includes(rawLevel) ? rawLevel : "1",
        usedFallback: (rawMode && !VALID_MODES.includes(rawMode)) || (rawLevel && !VALID_LEVELS.includes(rawLevel)),
    };
}

export function getSeedNumber(text) {
    let hash = 0;
    for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    return hash;
}

export function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

export function generateSeededTiles(tileCount, seed) {
    const random = seededRandom(seed);
    const puzzle = Array.from({ length: tileCount }, (_, index) => index + 1);
    for (let index = puzzle.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [puzzle[index], puzzle[swapIndex]] = [puzzle[swapIndex], puzzle[index]];
    }
    if (puzzle.length > 1 && puzzle.every((value, index) => value === index + 1)) {
        [puzzle[0], puzzle[1]] = [puzzle[1], puzzle[0]];
    }
    return puzzle;
}

export function getDailyChallengeDefinition(date) {
    const seed = `sortquest-${date}`;
    const seedNumber = getSeedNumber(seed);
    const mode = VALID_MODES[seedNumber % VALID_MODES.length];
    const level = seedNumber % 2 === 0 ? "2" : "3";
    return { date, seed, mode, level, tiles: generateSeededTiles(getTileCountForLevel(level), seedNumber) };
}

export function parseStoredRecords(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((record) => record && typeof record === "object") : [];
    } catch {
        return [];
    }
}

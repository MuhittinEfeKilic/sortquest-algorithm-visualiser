import { expect, test } from "@playwright/test";

test("core puzzle, hints, custom input, URL fallback and keyboard work", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/?custom=3,1,2&mode=invalid&level=99");
    await expect(page.getByRole("heading", { name: "SortQuest" })).toBeVisible();
    await expect(page.locator("#algorithmSelect")).toHaveValue("bubble");
    await expect(page.locator("#levelSelect")).toHaveValue("1");
    await expect(page.locator("#messageBox")).toContainText("safe defaults");
    await page.locator(".tile").first().press("h");
    await expect(page.locator("#messageBox")).toContainText("Hint 1/3");
    await page.locator(".tile").first().press("r");
    await expect(page.locator("#moveCount")).toHaveText("0");
    await page.locator("#algorithmSelect").selectOption("heap");
    await expect(page.locator("#learningTitle")).toContainText("Heap Sort");
    await page.locator("#customArrayInput").fill("3,1,2");
    await page.locator("#loadCustomBtn").click();
    await page.getByRole("button", { name: /^Tile 3,/ }).click();
    await page.getByRole("button", { name: /^Tile 2,/ }).click();
    await expect(page.locator("#resultPanel")).toBeVisible();
    await expect(page.locator("#leaderboardDialog")).toBeVisible();
    await page.locator("#skipLeaderboardBtn").click();
    expect(errors).toEqual([]);
});

test("BFS graph and mobile layout remain contained", async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.locator("#algorithmSelect").selectOption("bfs");
    await expect(page.locator("#bfsGraph")).toBeVisible();
    await expect(page.locator(".graph-node")).toHaveCount(4);
    await expect(page.locator("#bfsQueue")).toContainText("Queue: A");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${testInfo.project.name} has page-level horizontal overflow`).toBe(false);
    expect(errors).toEqual([]);
});

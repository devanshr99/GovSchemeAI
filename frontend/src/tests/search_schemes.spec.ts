import { test, expect } from '@playwright/test';

test.describe('Scheme Search and Browsing UI Tests', () => {
  test('should load scheme list page and perform query filtering', async ({ page }) => {
    // 1. Navigate to Schemes Search page
    await page.goto('/schemes');

    // 2. Verify search header and input exist
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]');
    await expect(searchInput.first()).toBeVisible();

    // 3. Verify page lists schemes cards or tables
    const schemesContainer = page.locator('.scheme-card, table, .list-container, .grid');
    await expect(schemesContainer.first()).toBeVisible();

    // 4. Type query and trigger search autocomplete/suggestions
    await searchInput.first().fill('kisan');
    await page.keyboard.press('Enter');
    
    // Results container should still display filtered results
    await expect(schemesContainer.first()).toBeVisible();
  });

  test('should display and toggle categories and state filter selectors', async ({ page }) => {
    await page.goto('/schemes');

    // Verify filter dropdowns/tabs are loaded
    const categorySelect = page.locator('select, button:has-text("Category"), button:has-text("Filters")');
    if (await categorySelect.first().isVisible()) {
      await categorySelect.first().click();
      
      // Select option if dropdown is a native HTML select
      const selectTag = page.locator('select').first();
      if (await selectTag.isVisible()) {
        await selectTag.selectOption({ index: 1 });
        // The list should reload or request new data
        await expect(page.locator('table, .grid').first()).toBeVisible();
      }
    }
  });

  test('should navigate paginated search results', async ({ page }) => {
    await page.goto('/schemes');
    
    const nextBtn = page.locator('button:has-text("Next"), button[aria-label="Next page"]');
    if (await nextBtn.isVisible() && !(await nextBtn.isDisabled())) {
      await nextBtn.click();
      // Expect page index URL query to increase or change
      await expect(page).toHaveURL(/.*page=.*/);
    }
  });
});

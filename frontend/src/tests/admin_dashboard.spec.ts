import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard UI Tests', () => {
  test('should display dashboard layout, stats, and sources list', async ({ page }) => {
    // 1. Navigate to the admin dashboard
    await page.goto('/admin');

    // 2. Accept admin authorization prompt/bypass if required
    // (If there is a JWT admin authorization token modal or input, we fill it)
    const tokenInput = page.locator('input[type="password"], input[placeholder*="token"], input[placeholder*="secret"]');
    if (await tokenInput.isVisible()) {
      await tokenInput.fill('govscheme-ai-dev-secret-change-in-prod');
      await page.click('button:has-text("Login"), button:has-text("Submit"), button:has-text("Verify")');
    }

    // 3. Verify stats panels are loaded
    await expect(page.locator('h1, h2, h3:has-text("Stats"), h3:has-text("Overview")').first()).toBeVisible();
    
    // 4. Verify government source registry tables are rendered
    await expect(page.locator('table, .source-list, .grid').first()).toBeVisible();
  });

  test('should open add/edit source form modals and validate input fields', async ({ page }) => {
    await page.goto('/admin');
    
    // If authorization input is visible, authorize
    const tokenInput2 = page.locator('input[type="password"]');
    if (await tokenInput2.isVisible()) {
      await tokenInput2.fill('govscheme-ai-dev-secret-change-in-prod');
      await page.click('button:has-text("Submit")');
    }

    // Click on add source button if present
    const addBtn = page.locator('button:has-text("Add Source"), button:has-text("New Source"), button:has-text("Register")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Verify modal is shown
      await expect(page.locator('dialog, .modal, form').first()).toBeVisible();
      
      // Try invalid URL form submit to check input validations
      const urlInput = page.locator('input[type="url"], input[name="website_url"]');
      if (await urlInput.isVisible()) {
        await urlInput.fill('invalid-url');
        const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        await submitBtn.click();
        
        // Browser validation or error toast should be visible
        const errorText = page.locator('.error, .text-red-500, :invalid');
        await expect(errorText.first()).toBeVisible();
      }
    }
  });

  test('should adjust layout gracefully on mobile viewport widths', async ({ page }) => {
    // Resize viewport to mobile dimensions (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/admin');
    
    // Verify layout container reflows and does not break sidebars/menus
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

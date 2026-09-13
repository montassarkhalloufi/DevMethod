const pause=ms=>new Promise(r=>setTimeout(r,ms));
exports.prepare=async page=>{
 await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.locator('#demo-button').click();
 await page.locator('.workspace').scrollIntoViewIfNeeded();
};
exports.perform=async page=>{
 await pause(1000);
 await page.locator('#task-title').pressSequentially('Préparer ma prochaine idée',{delay:42});
 await page.locator('#task-note').fill('Un premier pas concret, aujourd’hui.');
 await page.locator('.add-button').click();await pause(1000);
 await page.locator('.task-check').first().click();await pause(850);
 await page.locator('[data-filter="done"]').click();await pause(1000);
 await page.locator('[data-filter="all"]').click();await pause(850);
 await page.reload();await page.locator('.workspace').scrollIntoViewIfNeeded();
};

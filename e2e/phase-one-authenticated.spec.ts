import {test,expect} from "./fixtures";
test("candidate history and saved-list navigation",async({page})=>{
 test.skip(!process.env.E2E_CANDIDATE_EMAIL || !process.env.E2E_CANDIDATE_PASSWORD,"Requires disposable confirmed staging candidate");
 await page.goto("/auth/login");
 await page.getByLabel("Email",{exact:true}).fill(process.env.E2E_CANDIDATE_EMAIL!);
 await page.getByLabel("Password",{exact:true}).fill(process.env.E2E_CANDIDATE_PASSWORD!);
 await page.getByRole("button",{name:"Sign in",exact:true}).click();
 await expect(page).toHaveURL(/\/app/);
 await page.goto("/app/activity");
 await expect(page.getByLabel("Show saved jobs only")).toBeChecked();
 await expect(page.locator('footer[aria-label="Account support"]')).toBeVisible();
});

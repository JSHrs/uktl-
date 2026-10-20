import {test,expect} from './fixtures';
for(const width of [375,768,1440]){
 test(`sample analytics and menus fit ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/simulation?role=admin&view=analytics');
  await expect(page.getByRole('heading',{name:'Business operations',exact:true})).toBeVisible();
  await expect(page.getByText('CV task queue',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByText('View activity data as a table',{exact:true}).click();
  await expect(page.getByRole('columnheader',{name:'CVs received',exact:true})).toBeVisible();
 });
}

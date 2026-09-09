import {chromium} from 'playwright';
import {createServer} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);await page.getByRole('button',{name:'Create trench test fixture',exact:true}).click();await page.getByLabel('Scenario title',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Add activity',exact:true}).click();await page.getByLabel('Activity 1 prompt',{exact:true}).fill('Inspect referenced task');
 await page.getByText('Structured reference bindings',{exact:true}).click();
 const hotspot=await page.getByLabel('Selected hotspot',{exact:true}).inputValue();
 for(let i=1;i<=3;i++){
  await page.getByRole('button',{name:'Add reference binding',exact:true}).click();
  if(i===2)await page.getByLabel('Reference 2 target',{exact:true}).selectOption('hotspot:'+hotspot);
  if(i===3){const value=await page.getByLabel('Reference 3 target',{exact:true}).locator('option').evaluateAll(options=>options.find(o=>o.value.startsWith('activity:')).value);await page.getByLabel('Reference 3 target',{exact:true}).selectOption(value);}
  await page.getByLabel(`Reference ${i} module kind`,{exact:true}).selectOption(['KM','PM','WM'][i-1]);await page.getByLabel(`Reference ${i} Module reference`,{exact:true}).fill('Module '+i);await page.getByLabel(`Reference ${i} Source/page citation`,{exact:true}).fill('Manual page '+i);
 }
 await page.getByRole('button',{name:'Apply composition',exact:true}).click();await page.getByText('KM Module 1 · Manual page 1',{exact:true}).waitFor();await page.getByText('WM Module 3 · Manual page 3',{exact:true}).waitFor();await page.getByRole('button',{name:'PPE station',exact:true}).click();await page.getByText('PM Module 2 · Manual page 2',{exact:true}).waitFor();
 async function exportPackage(){const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export package + media',exact:true}).click();return readFile(await (await download).path(),'utf8');}
 const exported=await exportPackage(),envelope=JSON.parse(exported),manifest=JSON.parse(envelope.manifest);assert.equal(envelope.formatVersion,9);assert.equal(manifest.references.length,3);await mkdir('Artifacts/references',{recursive:true});await writeFile('Artifacts/references-browser.milzet-package.json',exported);
 await page.getByLabel('Open playable package',{exact:true}).setInputFiles({name:'references.json',mimeType:'application/json',buffer:Buffer.from(exported)});await page.getByRole('status').filter({hasText:'Package and all media saved'}).waitFor();await page.getByText('Structured reference bindings',{exact:true}).click();assert.equal(await page.getByLabel('Reference 3 Module reference',{exact:true}).inputValue(),'Module 3');
 await page.setViewportSize({width:375,height:812});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);await page.screenshot({path:'Artifacts/references/authoring-phone.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});
 await page.getByLabel('Reference 2 target',{exact:true}).selectOption('scenario:');await page.getByRole('button',{name:'Apply composition',exact:true}).click();await page.getByText('KM Module 1 · Manual page 1\nPM Module 2 · Manual page 2',{exact:true}).waitFor();
 await page.getByText('Structured reference bindings',{exact:true}).click();await page.getByLabel('Reference 2 target',{exact:true}).selectOption('hotspot:'+hotspot);await page.getByRole('button',{name:'Delete selected hotspot',exact:true}).click();await page.getByRole('button',{name:'Remove activity',exact:true}).click();await page.getByRole('button',{name:'Apply composition',exact:true}).click();
 const cleaned=JSON.parse(JSON.parse(await exportPackage()).manifest);assert.equal(cleaned.references.length,1);assert.equal(cleaned.references[0].scope,'scenario');assert.equal(cleaned.activities.length,0);assert.equal(cleaned.hotspots.length,3);
 await page.getByText('Structured reference bindings',{exact:true}).click();await page.getByRole('button',{name:'Remove reference 1',exact:true}).click();await page.getByRole('button',{name:'Apply composition',exact:true}).click();assert.deepEqual(JSON.parse(JSON.parse(await exportPackage()).manifest).references,[]);assert.deepEqual(errors,[]);
 console.log('PASS: browser authors all reference scopes, displays scoped citations, exports/reimports, rebinds and cleans deleted targets; 375px layout and zero page errors.');
}finally{await browser?.close();await server.close();}

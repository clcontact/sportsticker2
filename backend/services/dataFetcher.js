//	services/dataFetcher.js

import fs from "fs";
import path from "path";
import fetch from "node-fetch"; //	You	will	need	to	install	this	package:	npm	install	node-fetch

//	Set	the	polling	interval	to	5	minutes	(300,000	milliseconds)
const POLLING_INTERVAL_MS = 5 * 60 * 1000;

/**
 *	Downloads	data	from	a	URL	and	saves	it	to	a	file.
 *	@param	{string}	url	-	The	external	URL	to	fetch	the	data	from.
 *	@param	{string}	fileName	-	The	name	of	the	file	to	save	(e.g.,	'nfl_data.json').
 *	@param	{string}	dataDir	-	The	absolute	path	to	the	data	directory.
 */
async function fetchDataAndSave(url, fileName, dataDir) {
  const filePath = path.join(dataDir, fileName);
  const feedName = fileName.split("_")[0].toUpperCase();

  try {
    console.log(`\n⏳	Fetching	${feedName}	data	from:	${url}`);

    //	1.	Fetch	data	from	the	external	URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP	error!	status:	${response.status}`);
    }

    //	2.	Read	the	response	body	as	text	(assuming	it's	JSON)
    const data = await response.text();

    //	3.	Ensure	the	data	directory	exists	before	writing
    //	This	is	necessary	if	the	'data'	directory	hasn't	been	created	yet.
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    //	4.	Write	the	raw	data	to	the	specified	absolute	file	path
    fs.writeFileSync(filePath, data);

    console.log(
      `✅	Successfully	updated	${fileName}	at	${new Date().toLocaleTimeString()}`
    );
  } catch (error) {
    console.error(`\n❌	Error	fetching	or	saving	${fileName}:	${error.message}`);
  }
}

/**
 *	🔹	Starts	the	periodic	data	polling	for	a	single	feed.
 *	@param	{string}	url	-	The	URL	to	fetch	data	from.
 *	@param	{string}	file	-	The	file	name	to	save	the	data	as.
 *	@param	{string}	dataDir	-	The	absolute	path	to	the	data	directory	(e.g.,	/path/to/project/data).
 */
export function startDataPolling(url, file, dataDir) {
  //	Perform	the	initial	fetch	immediately
  fetchDataAndSave(url, file, dataDir);

  //	Set	up	the	recurring	interval
  setInterval(() => {
    fetchDataAndSave(url, file, dataDir);
  }, POLLING_INTERVAL_MS);

  console.log(`⏰	Polling	started	for	${file}	every	5	minutes.`);
}

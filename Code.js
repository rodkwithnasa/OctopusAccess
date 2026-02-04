/**
 * Checks if time part of given Date object is between start.hours:start.mins (inclusive) & stop.hours:stop.mins (exclusive).
 * 
 * Null change to commit to git
 *
 * @param {Date} date - The Date object to check.
 * @param {Object} start - start time for check range
 * @param {number} start.hours - start time hours portion
 * @param {number} start.mins - start time minutes portion
 * @param {Object} stop - stop time for check range
 * @param {number} stop.hours - stop time hours portion
 * @param {number} stop.mins - stop time minutes portion
 * @returns {boolean} - True if time portion of input date is in range, false otherwise.
 */
function isTimeBetweenSpecificRange(date,start,stop) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // The condition covers 00:30:00.000 up to (but not including) 05:30:00.000

    // Condition 1: Time is exactly 00:30 or later in the 00:xx hour
    const isAfterStartTime = (hours === start.hours && minutes >= start.mins) || hours > start.hours ;

    // Condition 2: Time is before 05:30 in the 05:xx hour, or earlier
    const isBeforeEndTime = (hours < stop.hours) || (hours === stop.hours && minutes < stop.mins);

    return isAfterStartTime && isBeforeEndTime;
}
/**
 * simulate Python range function
 * 
 * @param {number} start - initial value in range
 * @param {number} end - final value in range (non-incl)
 * @param {number} [step=1] - steps to count
 */

function* pRange(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}
/**
 * Turns ISO date string into Google Sheets compatible date
 * 
 * @param {string} ISOdateString - the string to convert
 * @returns {number} a number in Google Sheets 1900 format that represents the date
 * 
 */
function gSheetDate(ISOdateString) {
    const date1 = new Date("30 December 1899 UTC");
    const dateGoogleVal = date1.valueOf()/(24*60*60*1000);
    return Date.parse(ISOdateString).valueOf()/(24*60*60*1000)-dateGoogleVal;
}
/**
 * Wrapper function for gSheetDate that returns a gSheet formula mapped to a date
 * @param {number} gSheetDateNum - a number in Google Sheets 1900 format that represents the date
 * @returns {string} a gSheet formula mapped to a date
 */
 function gSheetToDate(gSheetDateNum) {
	 return `=to_date(${gSheetDate(gSheetDateNum)})`;
 }
/**
 * Maps ISO date string to the elec import rate for that time period
 * @param ISOdatestring - the date for which to get the rate
 * @returns - the pounds sterling for that time and a string for the type of rate
 */
function getElecImportRate(ISOdateString) {
  const theStart = Date.parse(ISOdateString);
  const testDate = new Date(theStart);
  const cheapStart={hours:0,mins:30}
  const cheapStop={hours:5,mins:30}
  return isTimeBetweenSpecificRange(testDate,cheapStart,cheapStop)? {"rate":0.0849975,"type": "ECheap"} :
    {"rate":0.29138445,"type": "EStandard"} ;
}
/**
 * Returns if this is the start time period in a day
 * @param ISOdatestring - the date to check
 * @returns {boolean} - true if this is the first time period in a day
 */
function checkDayStart(ISOdateString) {
  const theStart = Date.parse(ISOdateString);
  const testDate = new Date(theStart);
  const dayStart={hours:0,mins:0}
  const dayStop={hours:0,mins:1}
  return isTimeBetweenSpecificRange(testDate,dayStart,dayStop);  
}
const eITariffCode = 'ElecImportTariff';
const eIqueryString = `query(myTable,"SELECT Col1 where datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' < Col3 and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2 and Col6 = '${eITariffCode}'")/100`;
const eIStTariffCode = 'ElecImportTariffST';
const eIStqueryString = `query(myTable,"SELECT Col1 where Col6 = '${eIStTariffCode}' and ((datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' < Col3 and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2) or ( Col3 is null and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2))")/100`;
/**
 * Returns the formatted rows for ElecImport
 * @param row
 * @returns formatted row
 */
const elecImportFormat = row => {
            const formattedRow = [row[0],gSheetToDate(row[1]),gSheetToDate(row[2]),eIqueryString,'(R[0]C[-4]*R[0]C[-1])',getElecImportRate(row[1]).type];
            const outputRows = [formattedRow];
            if (checkDayStart(row[1])) {
              const extraRow = [1,gSheetToDate(row[1]),gSheetToDate(row[1]),eIStqueryString,'(R[0]C[-4]*R[0]C[-1])',"EStanding"]
              outputRows.push(extraRow);
            }
            return outputRows;
          }

const gasTariffCode = 'GasTariff';
const dd = 'DIRECT_DEBIT';
const gasQueryString = `query(myTable,"SELECT Col1 where Col6 = '${gasTariffCode}' and Col4 = '${dd}' and ((datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' < Col3 and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2) or ( Col3 is null and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2))")/100`;
const gasStTariffCode = 'GasTariffST';
const gasStQueryString = `query(myTable,"SELECT Col1 where Col6 = '${gasStTariffCode}' and Col4 = '${dd}' and ((datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' < Col3 and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2) or ( Col3 is null and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2))")/100`;
/**
 * Returns the formatted rows for Gas
 * @param row
 * @returns formatted row
 */
const gasFormat = row => {
            const formattedRow = [row[0],gSheetToDate(row[1]),gSheetToDate(row[2]),gasQueryString,'(((R[0]C[-4] * 1.02264 * AvCalValueNew)/3.6)*R[0]C[-1])',"Gas"];
            const outputRows = [formattedRow];
            if (checkDayStart(row[1])) {
              const extraRow = [1,gSheetToDate(row[1]),gSheetToDate(row[1]),gasStQueryString,'(R[0]C[-4]*R[0]C[-1])',"GStanding"];
              outputRows.push(extraRow);
            }
            return outputRows;
          }
const eETariffCode = 'ElecExportTariff';
const eEqueryString = `query(myTable,"SELECT Col1 where Col6 = '${eETariffCode}' and ( Col3 is null and datetime '" & TEXT(R[0]C[-2], "yyyy-mm-dd HH:mm:ss.000") & "' >= Col2)")*-1/100`;
/**
 * Returns the formatted rows for Export
 * @param row
 * @returns formatted row
 */
const exportFormat = row => {
            const formattedRow = [row[0],gSheetToDate(row[1]),gSheetToDate(row[2]),eEqueryString,'(R[0]C[-4]*R[0]C[-1])',"Export"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Gas Tariff
 * @param row
 * @returns formatted row
 */
const gasTariffFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"GasTariff"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Gas Tariff Standing Charges
 * @param row
 * @returns formatted row
 */
const gasTariffSTFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"GasTariffST"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Elec Import Tariff Standing Charges
 * @param row
 * @returns formatted row
 */
const elecImportTariffSTFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"ElecImportTariffST"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Elec Export Tariff Standing Charges
 * @param row
 * @returns formatted row
 */
const elecExportTariffSTFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"ElecExportTariffST"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Elec Import Tariff
 * @param row
 * @returns formatted row
 */
const elecImportTariffFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"ElecImportTariff"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Returns the formatted rows for Elec Export Tariff
 * @param row
 * @returns formatted row
 */
const elecExportTariffFormat = row => {
            const formattedRow = [row[1],gSheetToDate(row[2]),(row[3])? gSheetToDate(row[3]):null,row[4],0,"ElecExportTariff"];
            const outputRows = [formattedRow];
            return outputRows;
          }
/**
 * Parses a date in UK format 
 * @param {string} value - the date string to be parsed delimited by slash characters
 * @returns {date} - the date corresponding to the string or null if invalid
 */
function parseDMY(value) {
    var date = value.split("/");
    var d = parseInt(date[0], 10),
        m = parseInt(date[1], 10),
        y = parseInt(date[2], 10);
    return (Number.isNaN(d) || Number.isNaN(m)|| Number.isNaN(y))?  null : new Date(y, m - 1, d);
}
/**
 * Returns the formatted rows for calorific value
 * @param row
 * @returns formatted row
 */
const calorificFormat = row => {
            const event = parseDMY(row[2]);
            const formattedRow = [row[0],gSheetToDate(event.toISOString()),gSheetToDate(event.toISOString()),0,0,row[5]];
            const outputRows = [formattedRow];
            return outputRows;
          }
		  
const accountFormat = (row,idx) => {
  return row.map(({mpan,is_export,meters,agreements,mprn}) => idx === 0 ? 
  [[mpan,gSheetToDate(Date()),null,0,0,is_export ? "ExportMPAN":"ImportMPAN"],
  [meters[is_export ? 0 :1].serial_number,gSheetToDate(Date()),null,0,0,"eMeter"],
  ...agreements.map(({tariff_code:tc,valid_from:vf,valid_to:vt})=> [tc,gSheetToDate(vf),vt ? gSheetToDate(vt): null,0,0,is_export ? "exTariff" : "inTariff"] )] :
  [[mprn,gSheetToDate(Date()),null,0,0,"GasMPRN"],
  [meters[1].serial_number,gSheetToDate(Date()),null,0,0,"gMeter"],
  ...agreements.map(({tariff_code:tc,valid_from:vf,valid_to:vt})=> [tc,gSheetToDate(vf),vt ? gSheetToDate(vt): null,0,0,"gasTariff"] )]).flat()};

function fetchAccountDataFromApi() {
  // --- CUSTOMIZE THESE THREE VARIABLES ---
  const ps = PropertiesService.getScriptProperties();
  const sp = ps.getProperties();

  const apiUsername = sp.api_usernameProp;
  const apiPassword = ''; 
  // ---------------------------------------
  // Combine credentials into the required Basic Auth format
  const credentials = apiUsername + ':' + apiPassword;
  // Use the built-in Apps Script function to Base64 encode the credentials
  const encodedCredentials = Utilities.base64Encode(credentials);
  const authHeader = 'Basic ' + encodedCredentials;

  // Define the options object for UrlFetchApp.fetch()
  const options = {
    'headers': {
      'Authorization': authHeader
    }
  };
  let headers;
  let values;
  let dataToInsertNoHeaders = [];
  const processingSteps = [
    {"apiURLType":"Account","apiUrl":`api.octopus.energy/v1/accounts/${sp.myAccount}/`,"formatFunc":accountFormat,"fetchOptions":options},
  ];
  try {
    for (const step of processingSteps ){
      let apiUrl = step.apiUrl;
      while (apiUrl) {
        // Pass both the URL and the options object to the fetch method
        const response = UrlFetchApp.fetch(apiUrl, step.fetchOptions);
        const json_data = response.getContentText();
        const data = JSON.parse(json_data);

        if (!data || data.length === 0 || data.properties.length === 0) {
          SpreadsheetApp.getUi().alert("API returned no data, empty array or no results.");
          return;
        }

        // --- Data processing logic (same as before) ---
        headers = Object.keys(data.properties[0]).slice(-2);
//        values = data.properties.map(item => headers.map(header => item[header]));
        values = Object.values(data.properties[0]).slice(-2);
//        headers.push("Rate","Cost","Rate Type")
        dataToInsertNoHeaders.push(...values.flatMap(step.formatFunc));
        apiUrl = null;
      }
    }
    const substituteHeaders = ["consumption","interval_start","interval_end","Rate","Cost","Rate Type"];
    const dataToInsert = [substituteHeaders, ...dataToInsertNoHeaders];
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('account');
    sheet.clearContents(); 
    const range = sheet.getRange(1, 1, dataToInsert.length, substituteHeaders.length);
    range.setValues(dataToInsert);
    sheet.autoResizeColumns(1, substituteHeaders.length);
  } catch (error) {
    // Error handling might now include 401 Unauthorized errors
    SpreadsheetApp.getUi().alert(`Failed to fetch data: ${error.message}`);
  }
}
/**
 * New wrapper function fetchDataFromApi that holds start and stop time plus sheet to use
 * The original function (now called fetchDataFromApiStartStop) will accept times as parameters, plus sheet
 */
function fetchDataFromApi(){
  const now = new Date();
  const startTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 14);
  const stopTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 1,0,-15);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('consumption');
  fetchDataFromApiStartStop(startTime,stopTime,sheet);
}
/**
 * Fetches data from an external API using Basic Authorization 
 * and populates the current Google Sheet.
 * 
 * @param startTime {Date} start time for data fetch from Octopus
 * @param stopTime {Date} stop time for data fetch from Octopus
 * @param sheet {Sheet} the sheet in which to store the results
 */
function fetchDataFromApiStartStop(startTime,stopTime,sheet) {
  const startTimeT= startTime.toISOString();
  const stopTimeT = stopTime.toISOString();
  
  // --- CUSTOMIZE THESE THREE VARIABLES ---
  const ps = PropertiesService.getScriptProperties();
  const sp = ps.getProperties();

  const apiUsername = sp.api_usernameProp;
  const apiPassword = ''; 
  // ---------------------------------------
  // Combine credentials into the required Basic Auth format
  const credentials = apiUsername + ':' + apiPassword;
  // Use the built-in Apps Script function to Base64 encode the credentials
  const encodedCredentials = Utilities.base64Encode(credentials);
  const authHeader = 'Basic ' + encodedCredentials;

  // Define the options object for UrlFetchApp.fetch()
  const options = {
    'headers': {
      'Authorization': authHeader
    }
  };
  let headers;
  let values;
  let dataToInsert;
  let dataToInsertNoHeaders = [];
  const processingSteps = [
    {"apiURLType":"ElecImport","apiUrl":`api.octopus.energy/v1/electricity-meter-points/${sp.eIMpan}/meters/${sp.eMeter}/consumption/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":elecImportFormat,"fetchOptions":options},
    {"apiURLType":"Gas","apiUrl":`api.octopus.energy/v1/gas-meter-points/${sp.gMPRN}/meters/${sp.gMeter}/consumption/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":gasFormat,"fetchOptions":options},
    {"apiURLType":"Export","apiUrl":`api.octopus.energy/v1/electricity-meter-points/${sp.eEMpan}/meters/${sp.eMeter}/consumption/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":exportFormat,"fetchOptions":options}
  ]

  try {
    for (const step of processingSteps ){
      let apiUrl = step.apiUrl;
      while (apiUrl) {
        // Pass both the URL and the options object to the fetch method
        const response = UrlFetchApp.fetch(apiUrl, step.fetchOptions);
        const json_data = response.getContentText();
        const data = JSON.parse(json_data);

        if (!data || data.length === 0 || data.results.length === 0) {
          SpreadsheetApp.getUi().alert("API returned no data, empty array or no results.");
          return;
        }

        // --- Data processing logic (same as before) ---
        headers = Object.keys(data.results[0]);
        values = data.results.map(item => headers.map(header => item[header]));
        headers.push("Rate","Cost","Rate Type")
        dataToInsertNoHeaders.push(...values.flatMap(step.formatFunc));
        apiUrl = data.next;
      }
    }
    dataToInsert = [headers, ...dataToInsertNoHeaders]
    sheet.clearContents(); 
    const range = sheet.getRange(1, 1, dataToInsert.length, headers.length);
    range.setValues(dataToInsert);
    const formulas = dataToInsertNoHeaders.map(row=>["="+row[3],"="+row[4]]);
    const formulaRange = sheet.getRange(2,4,formulas.length,formulas[0].length);
    formulaRange.setFormulasR1C1(formulas);
    sheet.autoResizeColumns(1, headers.length);
    
    //SpreadsheetApp.getUi().alert(`Successfully fetched ${data.results.length} records with authorization.`);

  } catch (error) {
    // Error handling might now include 401 Unauthorized errors
    SpreadsheetApp.getUi().alert(`Failed to fetch data: ${error.message}`);
  }
}
/**
 * New wrapper function for fetchPostData which can be triggered
 * Original function now has start, stop times and sheet to update passed in
 */
function fetchPostDataFromApi() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('CF');

  const now = new Date();
  const startTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 14);
  const stopTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 1,0,-15);
  fetchPostDataFromApiStartStop(startTime,stopTime,sheet);
}
/**
 * Fetches post data from an external API using Basic Authorization 
 * and populates the current Google Sheet.
 */
function fetchPostDataFromApiStartStop(startTime,stopTime,sheet) {

  const startTimeT = startTime.toISOString();
  const stopTimeT = stopTime.toISOString();

  let headers;
  let values;
  let dataToInsertNoHeaders = [];
  const ps = PropertiesService.getScriptProperties();
  const myIds = ps.getProperty('nationalgasdata_ids'); 
  
// Make a POST request with a JSON payload.
  const payloadData = {
    "latestFlag": "Y",
    "applicableFor": "Y",
    "dateTo": stopTimeT.split('T')[0],
    "dateFrom": startTimeT.split('T')[0],
    "dateType": "GASDAY",
    "ids": myIds
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    // Convert the JavaScript object to a JSON string.
    payload: JSON.stringify(payloadData),
  };
  const apiUrl = 'https://data.nationalgas.com/api/find-gas-data'

  try {

        // Pass both the URL and the options object to the fetch method
        const response = UrlFetchApp.fetch(apiUrl, options);
        const json_data = response.getContentText();
        const data = JSON.parse(json_data);

        if (!data || data.length === 0 || data.data.length === 0) {
          SpreadsheetApp.getUi().alert("API returned no data, empty array or no results.");
          return;
        }

        // --- Data processing logic (same as before) ---
        headers = Object.keys(data.data[0]);
        values = data.data.map(item => headers.map(header => item[header]));
        let substituteHeaders = ["consumption","interval_start","interval_end","Rate","Cost","Rate Type"];
        dataToInsertNoHeaders.push(...values.flatMap(calorificFormat));



    dataToInsert = [substituteHeaders, ...dataToInsertNoHeaders];
    sheet.clearContents(); 
    const range = sheet.getRange(1, 1, dataToInsert.length, substituteHeaders.length);
    range.setValues(dataToInsert);
    sheet.autoResizeColumns(1, substituteHeaders.length);
    
    //SpreadsheetApp.getUi().alert(`Successfully fetched ${data.results.length} records with authorization.`);

  } catch (error) {
    // Error handling might now include 401 Unauthorized errors
    SpreadsheetApp.getUi().alert(`Failed to fetch data: ${error.message}`);
  }
}
/**
 * New wrapper function fetchTariffDataFromApi that holds start and stop time and sheet to update
 * The original function (now called fetchTariffDataFromApiStartStop) will accept times as parameters, plus sheet
 */
function fetchTariffDataFromApi(){
  const now = new Date();
  const startTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 14);
  const stopTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 1,0,-15);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('tariffs');
  fetchTariffDataFromApiStartStop(startTime,stopTime,sheet);
}
/**
 * Fetches Tariff data from an external API using Basic Authorization 
 * and populates the current Google Sheet.
 * 
 * @param startTime {Date} start time for data fetch from Octopus
 * @param stopTime {Date} stop time for data fetch from Octopus
 * @param sheet {Sheet} sheet in which to store results
 */
function fetchTariffDataFromApiStartStop(startTime,stopTime,sheet) {

  const startTimeT= startTime.toISOString();
  const stopTimeT = stopTime.toISOString();

  // --- CUSTOMIZE THESE THREE VARIABLES ---
  const ps = PropertiesService.getScriptProperties();
  const sp = ps.getProperties();

  const apiUsername = sp.api_usernameProp; 
  const apiPassword = ''; 
  // ---------------------------------------
  // Combine credentials into the required Basic Auth format
  const credentials = apiUsername + ':' + apiPassword;
  // Use the built-in Apps Script function to Base64 encode the credentials
  const encodedCredentials = Utilities.base64Encode(credentials);
  const authHeader = 'Basic ' + encodedCredentials;

  // Define the options object for UrlFetchApp.fetch()
  const options = {
    'headers': {
      'Authorization': authHeader
    }
  };
  let headers;
  let values;
  let dataToInsert;
  let dataToInsertNoHeaders = [];

  const processingSteps = [
    {"apiURLType":"ElecImport","apiUrl":`api.octopus.energy/v1/products/${sp.elecImport_product}/electricity-tariffs/${sp.elecImport_tariff}/standard-unit-rates/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":elecImportTariffFormat,"fetchOptions":options},
    {"apiURLType":"ElecImportSt","apiUrl":`api.octopus.energy/v1/products/${sp.elecImport_product}/electricity-tariffs/${sp.elecImport_tariff}/standing-charges/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":elecImportTariffSTFormat,"fetchOptions":options},
    {"apiURLType":"Gas","apiUrl":`api.octopus.energy/v1/products/${sp.gas_product}/gas-tariffs/${sp.gas_tariff}/standard-unit-rates/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":gasTariffFormat,"fetchOptions":options},
    {"apiURLType":"GasSt","apiUrl":`api.octopus.energy/v1/products/${sp.gas_product}/gas-tariffs/${sp.gas_tariff}/standing-charges/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":gasTariffSTFormat,"fetchOptions":options},
    {"apiURLType":"Export","apiUrl":`api.octopus.energy/v1/products/${sp.elecExport_product}/electricity-tariffs/${sp.elecExport_tariff}/standard-unit-rates/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":elecExportTariffFormat,"fetchOptions":options},
    {"apiURLType":"ExportSt","apiUrl":`api.octopus.energy/v1/products/${sp.elecExport_product}/electricity-tariffs/${sp.elecExport_tariff}/standing-charges/?period_from=${startTimeT}${stopTimeT !== null ? `&period_to=${stopTimeT}`:``}&order_by=period`,"formatFunc":elecExportTariffSTFormat,"fetchOptions":options},
  ]

  try {
    for (const step of processingSteps ){
      let apiUrl = step.apiUrl;
      while (apiUrl) {
        // Pass both the URL and the options object to the fetch method
        const response = UrlFetchApp.fetch(apiUrl, step.fetchOptions);
        const json_data = response.getContentText();
        const data = JSON.parse(json_data);

        if (!data || data.length === 0 || data.results.length === 0) {
          SpreadsheetApp.getUi().alert("API returned no data, empty array or no results.");
          return;
        }

        // --- Data processing logic (same as before) ---
        headers = Object.keys(data.results[0]);
        values = data.results.map(item => headers.map(header => item[header]));
        headers.push("Rate","Cost","Rate Type")
        dataToInsertNoHeaders.push(...values.flatMap(step.formatFunc));
        apiUrl = data.next;
      }
    }
    let substituteHeaders = ["consumption","interval_start","interval_end","Rate","Cost","Rate Type"];
    dataToInsert = [substituteHeaders, ...dataToInsertNoHeaders]
    sheet.clearContents(); 
    const range = sheet.getRange(1, 1, dataToInsert.length, substituteHeaders.length);
    range.setValues(dataToInsert);
    sheet.autoResizeColumns(1, headers.length);
    
    //SpreadsheetApp.getUi().alert(`Successfully fetched ${data.results.length} records with authorization.`);

  } catch (error) {
    // Error handling might now include 401 Unauthorized errors
    SpreadsheetApp.getUi().alert(`Failed to fetch data: ${error.message}`);
  }
}
/**
 * gets Weather data into date per row string array
 * 
 * @param {string} url - URL containing weather data
 * @returns {string[]} weather data: one row per date
 */
function getWeather(url){
  const response = UrlFetchApp.fetch(url);
  const text = response.getContentText();
  var regex = /<pre>([\s\S]*?)<\/pre>/gi;
  var matches = [];
  var match;

  while ((match = regex.exec(text)) !== null) {
      // The captured group (index 1) contains the text inside the tags
    matches.push(match[1].trim());
  }
  let vals = matches[0].split('\n');
  vals.splice(0,2); // Delete the header rows as these aren't formatted usefully
  return vals;
}
/**
 * New wrapper function for testGetWeather which will call original function
 * - passes in the start, stop times and sheet to update
 */
function testGetWeather(){
  const now = new Date();
  const startTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 14);
  const stopTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 1,0,-15);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('Weather');
  testGetWeatherStartStop(startTime,stopTime,sheet);
}
/**
 * Renamed testGetWeather function which accepts parameters
 * @param startTime {Date} start time for weather
 * @param stopTime {Date} stop time for weather
 * @param sheet {Sheet} sheet to update with results
 */
function testGetWeatherStartStop(startTime,stopTime,sheet){
  let accum = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const ps = PropertiesService.getScriptProperties();
  const weatherHost = ps.getProperty('weatherurl_host');  
  const currentBase = `${weatherHost}/webpages/vws/dailyrep.html`;
  const fromYear = startTime.getFullYear();
  const toYear = stopTime.getFullYear();
  for ( const year of pRange(fromYear,toYear+1)){
    const base = `${weatherHost}/archive/${year}dayr.html`;
    accum.push(...getWeather(year == currentYear ? currentBase : base));
  }
  let outVals = [];
  const outValsH = [["Consumption","IntervalStart","IntervalEnd","Rate","Cost","Rate Type"]]
  for (const val of accum) {
    const [theDate,,,,,,,,,,,,,aveTemp,hiTemp,loTemp] = val.match(/\S+/g) || [];  
    outVals.push([aveTemp,parseDMY(theDate),0,0,0,"Average Temp"]);
    outVals.push([hiTemp,parseDMY(theDate),0,0,0,"Hi Temp"]);
    outVals.push([loTemp,parseDMY(theDate),0,0,0,"Lo Temp"]);
  }
  const outVals2 = outVals.filter(arg => (arg[1]>=startTime) && (arg[1]<=stopTime)).map(row1=>
    [row1[0],gSheetToDate(row1[1].toISOString()),row1[2],row1[3],row1[4],row1[5]]
  );

  const outVals4 = [outValsH[0],...outVals2]; 
  sheet.clearContents(); 
  const range = sheet.getRange(1, 1, outVals4.length, outVals4[0].length);
  range.setValues(outVals4);
  sheet.autoResizeColumns(1, outVals4[0].length);
}
/**
 * New wrapper function fetchAllDataFromApi that holds start and stop time and sheets to update, and calls
 * all four data getting functions from the various APIs.
 */
function fetchAllDataFromApi(){
  const now = new Date();
  const startTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 14);
  const stopTime = new Date(now.getFullYear(),now.getMonth(),now.getDate() - 1,0,-15);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const tsheet = spreadsheet.getSheetByName('tariffs');
  fetchTariffDataFromApiStartStop(startTime,stopTime,tsheet);
  const csheet = spreadsheet.getSheetByName('CF');
  fetchPostDataFromApiStartStop(startTime,stopTime,csheet);
  const wsheet = spreadsheet.getSheetByName('Weather');
  testGetWeatherStartStop(startTime,stopTime,wsheet);
  const sheet = spreadsheet.getSheetByName('consumption');
  fetchDataFromApiStartStop(startTime,stopTime,sheet);
}
class octopusBill {

  constructor (billName,billStart,billStop) {
    this._billName = billName;
    this._billStart = parseDMY(billStart);
    this._billStop = parseDMY(billStop);
  }

}
/**
 * New wrapper function that will take the start and stop dates from UK formatted strings
 * It will then call the four individual API functions
 * 
 */
function tryBill () {
  const myBill = new octopusBill("H Bill","01/01/2026","07/01/2026");
  const extract = myBill._billName;
  const temp = 5;

}

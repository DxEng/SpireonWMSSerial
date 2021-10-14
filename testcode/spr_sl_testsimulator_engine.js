/**
 * spr_sl_testsimulator_engine.js
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * Author: Sathish
 * Created: 06/01/2021
 */

define(['N/search', 'N/record','N/transaction', 'N/log', 'N/runtime', 'N/error', 'N/format','N/https','N/encode','N/email', 'N/ui/serverWidget','N/render','N/file',
	'SuiteScripts/DevLibrary/Spireon-Utils'],
function(search, record,transaction, log, runtime, error, format,https,encode,email,serverWidget,render,file, Utils){
    var url_DeviseProvision = 'https://deviceprovisioningservice.spireon.com/rest/deviceProvisioningOrders';
	var url_identitytoken = 'https://identity.spireon.com/identity/token';
	function execute(context){
		var request  = context.request;
		var transactionId = request.parameters.transId;
		var requestType = request.parameters.requestType;
		log.debug(request.parameters.JSONInput);
		var jsonStringReq = request.parameters.JSONInput;
		var JSONstring;
		var rec ;
		log.debug({title: 'Test Simulator Engine',details: "requestType -  "+requestType});
		log.debug({title: 'Test Simulator Engine',details: "transactionId -  "+transactionId});	
		if ( requestType == 'SOToFFJSON'){
			rec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.SALES_ORDER   ){
				log.debug('Record is a Sales Order ');
				JSONstring = generateJSONstringFromSO(rec);
				log.debug(JSONstring);
				//var ffreq = JSON.parse(JSONstring);		
			}
		}		
		if ( requestType == 'FFFROMSO'){
			rec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.SALES_ORDER   ){
				log.debug('Record is a Sales Order ');
				var ffrec = createFFfromSO(rec);
				var ffid = ffrec.id
				log.debug('Record type after FF conversion is : ' + ffid);
				addItemsToFF(ffrec);
				JSONstring = '' + ffid;
				//var ffreq = JSON.parse(JSONstring);		
			}
		}
		if ( requestType == 'FFFROMSOWITHDEVICECSV'){
			var deviceCSV = request.parameters.deviceCSV;
			var parentArray = parseCSV(deviceCSV);
		    var devArrray = parentArray[0];
			log.debug({title: 'FFFROMSOWITHDEVICECSV',details:  'Device Quantity- ' +  devArrray.length});
			rec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.SALES_ORDER   ){
				log.debug('Record is a Sales Order ');
				var ffrec = createFFfromSOGivenQuantity(rec,devArrray.length);
				var ffid = ffrec.id
				log.debug('Record type after FF conversion is : ' + ffid);
				addItemsToFFWithDeviceCSV(ffrec,deviceCSV);
				JSONstring = '' + ffid;
				//var ffreq = JSON.parse(JSONstring);		
			}
		}
      	if ( requestType == 'APPENDDEVICES'){
			var deviceCSV = request.parameters.deviceCSV;
			var parentArray = parseCSV(deviceCSV);
		    var devArrray = parentArray[0];
			log.debug({title: 'APPENDDEVICES',details:  'Device Quantity- ' +  devArrray.length});
			ffrec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: transactionId});
			if(ffrec.type == record.Type.ITEM_FULFILLMENT   ){
				var ffid = ffrec.id
				addItemsToFFWithDeviceCSV(ffrec,deviceCSV,'SUCCESS');
				JSONstring = '' + ffid;
				//var ffreq = JSON.parse(JSONstring);		
			}
		}
		if ( requestType == 'POPULATEFFDEVICEDATES'){
			rec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.ITEM_FULFILLMENT   ){
				rec.save(); // See if there is a better way to do this.
				log.debug({title: 'Simulator Engine',details: 'Context ' + 'POPULATEFFDEVICEDATES' + ' After Populate the Device dates calling ff save is finished' });			              
			}
			JSONstring = '' + transactionId;
		}
		if ( requestType == 'BILLLFROMSO'){
			rec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.SALES_ORDER   ){
				log.debug('Record is a Sales Order ');
				var invrec = createInvfromSO(rec);
				var invid = invrec.id
				log.debug('Record id after INV conversion is : ' + invid);
				
				var time = new Date();
				var fileName = String.format('Invoice_{0}_{1}_{2}', invrec.getValue('tranid'), Utils.printDate(time, false, '-'), time.getTime());

				var pdfFileId = generateInvoicePDF(fileName + '.pdf', 22547627, invrec); 
				var csvFileId = generateCSVDetails(fileName + '.csv', 22547627, invrec); // get ff as only ff is parent of the device
				var pdfFile = file.load({id: pdfFileId});
				var pdfFileURL = pdfFile.url;
				var csvFile = file.load({id: csvFileId});
				var csvFileURL = csvFile.url;					
				var recipientEmail = 'smadhi@spireon.com';
				email.send({
					author: 5855344,
					recipients: recipientEmail, 
					subject: String.format('Spireon, Inc.: Invoice #{0}',invrec.getValue('tranid')),
					body: "Please open the attached file to view your Invoice.\n \n To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site http://www.adobe.com/products/acrobat/readstep.html to download it.",
					attachments: [pdfFile,csvFile],
					relatedRecords: {
						entityId: invrec.getValue('entity'),
						transactionId: invrec.id
					}
				});
			
				JSONstring = '' + invid;
				//var ffreq = JSON.parse(JSONstring);		
			}
		}		
		if ( requestType == 'EMAILINVOICE'){
			//folder 22311180
			var invoiceNumber = transactionId;
			var invoiceRecord = record.load({type: record.Type.INVOICE, id: transactionId});
			var time = new Date();
	        var fileName = String.format('Invoice_{0}_{1}_{2}', invoiceNumber, Utils.printDate(time, false, '-'), time.getTime());

	        var pdfFileId = generateInvoicePDF(fileName + '.pdf', 22547627, invoiceRecord); 
			var csvFileId = generateCSVDetails(fileName + '.csv', 22547627, invoiceRecord); // get ff as only ff is parent of the device
			var pdfFile = file.load({id: pdfFileId});
			var pdfFileURL = pdfFile.url;
			var csvFile = file.load({id: csvFileId});
			var csvFileURL = csvFile.url;					
			var recipientEmail =  invoiceRecord.getValue('email');
          	email.send({
				author: 5855344,
				recipients: recipientEmail, 
				subject: String.format('Spireon, Inc.: Invoice #{0}',invoiceRecord.getValue('tranid')),
				body: "Please open the attached file to view your Invoice.\n \n To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site http://www.adobe.com/products/acrobat/readstep.html to download it.",
				attachments: [pdfFile,csvFile],
				relatedRecords: {
					entityId: invoiceRecord.getValue('entity'),
					transactionId: invoiceRecord.id
				}
			});
			JSONstring = '' + pdfFileURL;
		}		
		if ( requestType == 'FFFROMSOWITHDEVICECSVFULLONLY'){// this is not used, but the original worked one.
			var deviceCSV = request.parameters.deviceCSV;
			rec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.SALES_ORDER   ){
				log.debug('Record is a Sales Order ');
				var ffrec = createFFfromSO(rec);
				var ffid = ffrec.id
				log.debug('Record type after FF conversion is : ' + ffid);
				addItemsToFFWithDeviceCSV(ffrec,deviceCSV);
				JSONstring = '' + ffid;
				//var ffreq = JSON.parse(JSONstring);		
			}
		}
		if ( requestType == 'OBINITJSON'){
			rec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.ITEM_FULFILLMENT   ){
				log.debug('Record is Item Fulfillment ');
				JSONstring = generateJSONstringFromFF(rec);
				log.debug(JSONstring);
				
				log.debug('nspire initial json parsed successfully');
				              
			}
		}
		if(requestType == 'SUBMITOUTBOUND'){		
			var data = jsonStringReq;
			log.debug({title: 'SUBMITOUTBOUND - jsonStringReq',details: jsonStringReq});
			// due to some issue the OB request is not coming in properly. 
			/*
			rec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: transactionId});
			if(rec.type == record.Type.ITEM_FULFILLMENT   ){
				log.debug('Record is Item Fulfillment ');
				data = generateJSONstringFromFF(rec);			
              log.debug('data ' - data);
			}
			*/
			var headers = [];
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = '*/*';
			headers['Content-Length']  = data.length;
			headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();

			var response = https.post({
				url: url_DeviseProvision,
				body: data,
				headers: headers
				});
			JSONstring = response.body;	
			log.debug(response.body);
			log.debug({title: 'SUBMITOUTBOUND - response bod',details: JSONstring});
			var nspireresponse = JSON.parse(JSONstring);
			updateNspireResoponse(nspireresponse);
		}
		if(requestType == 'FINDBYID'){		

			var headers = [];
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = '*/*';
			headers['Content-Length']  = 0;
			headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();

			var response = https.get({
				url: url_DeviseProvision + '/' +transactionId,
				headers: headers
				});
			JSONstring = response.body;	
			log.debug({title: 'FINDBYID - response bod',details: JSONstring});
			var nspireresponse = JSON.parse(JSONstring);
			updateNspireResoponse(nspireresponse);
		}
		if(requestType == 'RETRYWHOLE'){	
		
			var data = '{"overallStatus": "PENDING_RETRY"}';
			log.debug({title: 'RETRYWHOLE - jsonStringReq',details: jsonStringReq});
			var headers = [];
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = '*/*';
			headers['Content-Length']  = data.length;
			headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();
///rest/deviceProvisioningOrders/{id}/retry
			var response = https.post({
				url: url_DeviseProvision + '/'+transactionId+'/retry',
				body: data,
				headers: headers
				});
			JSONstring = response.body;	
			log.debug(response.body);
			log.debug({title: 'RETRYWHOLE - response bod',details: JSONstring});
			var nspireresponse = JSON.parse(JSONstring);
			updateNspireResoponse(nspireresponse);
		}
		if(requestType == 'RETRYSINGLE'){		
			var data = '{"id": "72476103","devices": [{"serialNumber" : "TST_LG_ORD_FKS_0085937116", "status": {"processingStatus": "PENDING_RETRY"}}]}';
			var headers = [];
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = '*/*';
			headers['Content-Length']  = 0;
			headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();

			var response = https.post({
				url: url_DeviseProvision + '/' +transactionId+'/retry',
				headers: headers
				});
			JSONstring = response.body;	
			log.debug({title: 'FINDBYID - response bod',details: JSONstring});
			var nspireresponse = JSON.parse(JSONstring);
			updateNspireResoponse(nspireresponse);
		}
      context.response.write(JSONstring); 
	} 
	function generateJSONstringFromFF(nsFFRec){
		var customer = search.lookupFields({
			type: search.Type.CUSTOMER,
			id: nsFFRec.getValue('entity'),
			columns: ['custentity_nspireaccountid']
		});
		var ffJsonString = '{"id":"' + nsFFRec.id + '","orderType" : "SALE",' ;
      	ffJsonString = ffJsonString+ '"targetAccount" : { "nSpireId": ' +  customer['custentity_nspireaccountid'] + '},"devices":[';
		var lineCount= nsFFRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" });
		var hasDevices = false;
		for(var loop_i = 0; loop_i < lineCount; loop_i++) {

			if ( loop_i > 0)	
				ffJsonString = ffJsonString + ','; 

			ffJsonString = ffJsonString + '{"serialNumber":"' + nsFFRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_devsrno"})  ;
			ffJsonString = ffJsonString +'","instructions": {'+ addJsonDateNodeIfNotNull("shipDate",nsFFRec, "recmachcustrecord_spr_srno_transno",loop_i,"custrecord_spr_srno_shipdate",true)       
          		+ addJsonDateNodeIfNotNull("renewalDate",nsFFRec, "recmachcustrecord_spr_srno_transno",loop_i,"custrecord_spr_srno_rendate")	
				+ addJsonDateNodeIfNotNull("warrantyDate",nsFFRec, "recmachcustrecord_spr_srno_transno",loop_i,"custrecord_spr_srno_wardate")	
				+ addJsonDateNodeIfNotNull ("activeDate",nsFFRec, "recmachcustrecord_spr_srno_transno",loop_i,"custrecord_spr_srno_shipdate")	+ '}}';
		}	
		ffJsonString = ffJsonString +  ']}';
		return ffJsonString;
	}
	function addJsonDateNodeIfNotNull(nodeName,nsRec, subListId, rowNum, field, isfirstnode){
        var nodeValue = convertDateToNspireFormatFromSubList (nsRec, subListId,rowNum,field);
        var strCommaSeperator = ', ';
        if (isfirstnode)
          strCommaSeperator = '';
        if(nodeValue != '')
          return  strCommaSeperator + '"' +  nodeName + '": "' + nodeValue + '"';
        else{
          return strCommaSeperator + '"' +  nodeName + '": ' + null;
        }
        return ''; // if the date is blank, just retrun blank not to add any node.
	}
  	function generateCSVDetails(fileName, folderId, _invoiceRecord){
		//var transactionId = 72485663;
		//var nsInvoice = record.load({type: record.Type.INVOICE  , isDynamic: false, id: transactionId});
		var nsInvoice = _invoiceRecord;
		var csvFile;
		//log.debug(nsInvoice.getValue('tranid')); //G-
		log.debug(nsInvoice.id);
		var sotransid = nsInvoice.getValue('createdfrom');
		var sorec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: sotransid});
		var ffid = 0;
		var linksCount= sorec.getLineCount({ sublistId: "links" });
		for(var loop_i = 0; loop_i < linksCount; loop_i++) {
			if ( sorec.getSublistValue({sublistId: "links", line: loop_i, fieldId: "type"}) == 'Item Fulfillment'){
				ffid = sorec.getSublistValue({sublistId: "links", line: loop_i, fieldId: "id"})
			}
		}	
		
		if ( ffid > 0){
			var nsFFRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: ffid});
			var serialDevCount= nsFFRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" });
			if ( serialDevCount > 0){
			   csvFile = file.create({
					name: fileName,
					fileType: file.Type.CSV,
					description: 'Invoice details for ' + _invoiceRecord.getText({fieldId: 'tranid'}),
					contents: '"Serial Number"\n'
				});
			}
			for(var loop_i = 0; loop_i < serialDevCount; loop_i++) {
				csvFile.appendLine({value: nsFFRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_devsrno"})});
			}
			
		}
		csvFile.name = fileName;
		csvFile.folder = folderId;
		return csvFile.save();
	}
	function generateInvoicePDF(fileName, folderId, _invoiceRecord) 
	{
		var pdfFile = render.transaction({
            entityId: _invoiceRecord.id,
            printMode: render.PrintMode.PDF
            });
		pdfFile.name = fileName;
	    pdfFile.folder = folderId;
	    return pdfFile.save();
	}
	function convertDateToNspireFormatFromSubList(nsRec, subListId, rowNum, field){
		//return ( format.format({value:nsRec.getSublistValue({sublistId: subListId, line: rowNum, fieldId: field}),type: format.Type.DATE}));
		var dateValue = nsRec.getSublistValue({sublistId: subListId, line: rowNum, fieldId: field});
		//yyyy-mm-dd
		log.audit( 'dateValue - ' + dateValue);
		if ( dateValue == '')
			return '';
		var monthValue = dateValue.getMonth() + 1;
		if ( monthValue <10)
			monthValue = '0'+monthValue;
		return 	dateValue.getFullYear()   + '-' + monthValue  + '-' + dateValue.getDate(); 
	}
	function generateJSONstringFromSO(nsSORec){
		var ffJsonString = '{"orderId":"' + nsSORec.id + '","lineItems":[';
		var lineCount= nsSORec.getLineCount({ sublistId: "item" });
		var hasDevices = false;
		for(var loop_i = 0; loop_i < lineCount; loop_i++) {
			var isSCSyncSOItem = nsSORec.getSublistValue({sublistId: "item", fieldId: "custcol21", line:loop_i});
			var itemid = nsSORec.getSublistValue({sublistId: "item", fieldId: "item", line:loop_i});
			if ( isSCSyncSOItem && itemid >0 ) // not sure why the end of the group is coming as an is sync to sc
			{
				hasDevices = true;
				
				//var isItemFulfilled = nsSORec.getSublistValue({sublistId: "item", fieldId: "itemisfulfilled", line:loop_i});
				var lineNumber = nsSORec.getSublistValue({sublistId: "item", fieldId: "line", line:loop_i});
				var linetransactionId = nsSORec.getSublistValue({sublistId: "item", fieldId: "lineuniquekey", line:loop_i});
				var itemid = nsSORec.getSublistValue({sublistId: "item", fieldId: "item", line:loop_i});
				var qty = nsSORec.getSublistValue({sublistId: "item", fieldId: "quantity", line:loop_i});
				var sku = nsSORec.getSublistValue({sublistId: "item", fieldId: "custcol_ava_item", line:loop_i});
				ffJsonString = ffJsonString + '{"lineNumber":' + lineNumber + ',"nsItemId":"' + itemid + '","SKU":"' + sku + '", "quantity":' + qty +   ', "soLinetransactId":' + linetransactionId + ',"sprDevSerials":[';
				ffJsonString = ffJsonString + gnerateSpireonDeviceSerialJson(qty) + ']';
				ffJsonString = ffJsonString + '}';
			}
		}	
		ffJsonString = ffJsonString + ']}';
		return ffJsonString;
	}
	function gnerateSpireonDeviceSerialJson(numberOfItems){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var newSeq = 0;
		var sprDevSerJson = "";
		var mySearch = search.create({
				type: 'customrecord_spr_cust_app_config',
				columns: ['custrecord_spr_cust_app_config_key','custrecord_spr_cust_app_config_value'],
				filters: ['custrecord_spr_cust_app_config_key','startswith','Serial']
				});

			var result = mySearch.run().getRange(0, 20);
			for (var i = 0; i < result.length; i++) {
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialCurrentSeq'){
					serialCurrentSeq = parseInt(result[i].getValue('custrecord_spr_cust_app_config_value'));
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialAutoIncrement'){
					if (parseInt(result[i].getValue('custrecord_spr_cust_app_config_value')) ==0){
						serialAutoIncrementFlag = false;
					}
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialLength'){
					serialLength = parseInt(result[i].getValue('custrecord_spr_cust_app_config_value'));
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialPrefix'){
					serialPrefix = result[i].getValue('custrecord_spr_cust_app_config_value');
				}
			}
			for(var i = 0; i < numberOfItems; i++) {
				sprDevSerJson = sprDevSerJson + '{"sprSerialNumber":"'+	serialPrefix+ FormatNumberLength( serialCurrentSeq+i,serialLength-serialPrefix.length ) + '"},';
				newSeq++;
			}
			if(serialAutoIncrementFlag)
			{
				var recid = record.submitFields({
							  type: 'customrecord_spr_cust_app_config',
							  id: 8,
							  values: {
								  'custrecord_spr_cust_app_config_value':  serialCurrentSeq+ newSeq
							  },
							  options: {
								  enableSourcing: false,
								  ignoreMandatoryFields : true
							  }
							}); 
			}
			return sprDevSerJson;
	}
	function createFFfromSOGivenQuantity(nsSORec, qty){
		log.debug({title: 'createFFfromSO - handle partial',details: ' Qty - ' + qty});
		var nsFFRec = record.transform({fromType: record.Type.SALES_ORDER, fromId: nsSORec.id, toType: record.Type.ITEM_FULFILLMENT});
		log.debug('SO is transformed into Fulfillment  ');     

		//  Default fulfillment status to shipped
		nsFFRec.setValue('shipstatus','C');
		var lineCount= nsFFRec.getLineCount({ sublistId: "item" });	
		for(var loop_i = 0; loop_i < lineCount; loop_i++) {
			nsFFRec.setSublistValue({sublistId: "item", line: loop_i, fieldId: "quantity", value: qty});		
		}	

		//  Save the nsFFRec
		var fulfillmentId = nsFFRec.save();
		log.debug({title: 'createFFfromSO - handle partial',details:  'Fulfillment Created - ' +  fulfillmentId});
		return  record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: fulfillmentId});
	}
	function createFFfromSO(nsSORec){
		var nsFFRec = record.transform({fromType: record.Type.SALES_ORDER, fromId: nsSORec.id, toType: record.Type.ITEM_FULFILLMENT});
		log.debug('SO is transformed into Fulfillment  ');     

		//  Default fulfillment status to shipped
		nsFFRec.setValue('shipstatus','C');
		//  Save the nsFFRec
		var fulfillmentId = nsFFRec.save();
		log.debug( 'Fulfillment Created - ' +  fulfillmentId);
		return  record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: fulfillmentId});
	}
	function addItemsToFFWithDeviceCSV(nsFFRec,strDevCSV,provisionStatus){
		var lineCount= nsFFRec.getLineCount({ sublistId: "item" });	
		for(var loop_i = 0; loop_i < lineCount; loop_i++) {
			var isSerializedItem = nsFFRec.getSublistValue({sublistId: "item", fieldId: "custitem_spireonserialized", line:loop_i}); 
			var isSCSyncSOItem = nsFFRec.getSublistValue({sublistId: "item", fieldId: "custcol21", line:loop_i});
			var itemid = nsFFRec.getSublistValue({sublistId: "item", fieldId: "item", line:loop_i});
			if ( isSCSyncSOItem && itemid >0 ) // not sure why the end of the group is coming as an is sync to sc
			{
				var lineItem = search.lookupFields({
					type: search.Type.ITEM,
					id: itemid,
					columns: ['custitem_spireonserialized'],
				});
				if (!lineItem['custitem_spireonserialized'])
					continue; // not a serialized device
				
				//var isItemFulfilled = nsFFRec.getSublistValue({sublistId: "item", fieldId: "itemisfulfilled", line:loop_i});
				var lineNumber = nsFFRec.getSublistValue({sublistId: "item", fieldId: "line", line:loop_i});
				var linetransactionId = nsFFRec.getSublistValue({sublistId: "item", fieldId: "lineuniquekey", line:loop_i});
				var qty = nsFFRec.getSublistValue({sublistId: "item", fieldId: "quantity", line:loop_i});
				var sku = nsFFRec.getSublistValue({sublistId: "item", fieldId: "custcol_ava_item", line:loop_i});
				addDevicesUsingCSV(nsFFRec,nsFFRec.id,itemid,qty,strDevCSV,provisionStatus);
			}
		}	
		//populateAdditionalFieldsForitemFF(nsFFRec);
		nsFFRec.save();
	}
	function addItemsToFF(nsFFRec){
		var lineCount= nsFFRec.getLineCount({ sublistId: "item" });
		var hasDevices = false;
		for(var loop_i = 0; loop_i < lineCount; loop_i++) {
			var isSCSyncSOItem = nsFFRec.getSublistValue({sublistId: "item", fieldId: "custcol21", line:loop_i});
			var itemid = nsFFRec.getSublistValue({sublistId: "item", fieldId: "item", line:loop_i});
			if ( isSCSyncSOItem && itemid >0 ) // not sure why the end of the group is coming as an is sync to sc
			{
				hasDevices = true;
				
				//var isItemFulfilled = nsFFRec.getSublistValue({sublistId: "item", fieldId: "itemisfulfilled", line:loop_i});
				var lineNumber = nsFFRec.getSublistValue({sublistId: "item", fieldId: "line", line:loop_i});
				var linetransactionId = nsFFRec.getSublistValue({sublistId: "item", fieldId: "lineuniquekey", line:loop_i});
				var itemid = nsFFRec.getSublistValue({sublistId: "item", fieldId: "item", line:loop_i});
				var qty = nsFFRec.getSublistValue({sublistId: "item", fieldId: "quantity", line:loop_i});
				var sku = nsFFRec.getSublistValue({sublistId: "item", fieldId: "custcol_ava_item", line:loop_i});
				addDevicesbyGeneratingSerials(nsFFRec,nsFFRec.id,itemid,qty);
			}
		}	
		//populateAdditionalFieldsForitemFF(nsFFRec);
		nsFFRec.save();
	}
	function updateNspireResoponse(nspireJsonResponse){
		log.debug('inside updateNspireResoponse');
		var ffid = nspireJsonResponse.id;
		log.debug('ffid - ' + ffid);
		ffrec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: ffid});
        ffrec.setValue('custbody_spr_nspire_api_order_status',nspireJsonResponse.overallStatus);
		var dslCount= ffrec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
		for(var dslNum = 0; dslNum < dslCount; dslNum++) {
			var devSerialValue = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_devsrno", line:dslNum});
			var devinternalId = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "id", line:dslNum});
			log.debug({title: 'Inside updateNspireResoponse',details: 'devinternalId - ' + devinternalId});
			/*
			for (var i =0; i < nspireJsonResponse.devices.length; i++){
					if(nspireJsonResponse.devices[i].serialNumber == devSerialValue ){
						var devid = record.submitFields({
						  type: 'customrecord_ssr_order_item_serialnum',
						  id: devinternalId,
						  values: {
							 'custrecord_spr_srno_nspire_status':  nspireJsonResponse.devices[i].status.processingStatus,
                             'custrecord_spr_srno_nspire_err_code':  nspireJsonResponse.devices[i].status.lastErrorCode,
                             'custrecord_spr_srno_nspire_err_msg':  nspireJsonResponse.devices[i].status.lastErrorMessage
						  },                          
						  options: {
							  enableSourcing: false,
							  ignoreMandatoryFields : true
						  }
						}); 
					}
			}
			*/
			for (var i =0; i < nspireJsonResponse.devices.length; i++){
					if(nspireJsonResponse.devices[i].serialNumber == devSerialValue ){							
						ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_status", value: nspireJsonResponse.devices[i].status.processingStatus });
						ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_code", value: nspireJsonResponse.devices[i].status.lastErrorCode});
						ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_msg", value: nspireJsonResponse.devices[i].status.lastErrorMessage})
					}
			}	
		}	
		ffrec.save();
	}
	function populateAdditionalFieldsForitemFF(itemFF){
		var renewDate = '';
		var sotransid = itemFF.getValue('createdfrom');
		var sorec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: sotransid});
		var shipdate = sorec.getValue('shipdate');
		var warrantyDate = '';
		
		
		var lineCount= itemFF.getLineCount({ sublistId: "item" });
		var hasDevices = false;
		for(var lineNum = 0; lineNum < lineCount; lineNum++) {
			var itemid = sorec.getSublistValue({sublistId: "item", fieldId: "item", line:lineNum});
			if ( isService(itemid)){
				var revrec_enddate = sorec.getSublistValue({sublistId: "item", fieldId: "revrecenddate", line:lineNum});				
			}
		}
		if ( revrec_enddate !== '')
			renewDate = revrec_enddate;
		
		var dslCount= itemFF.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
		for(var dslNum = 0; dslNum < dslCount; dslNum++) {
			warrantyDate = '';
			var itemid = itemFF.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_itemno", line:dslNum});
			var lineItem = search.lookupFields({
			type: search.Type.ITEM,
			id: itemid,
			columns: ['itemid', 'custitem_warrantydays'],
			});
			warrantyDate = shipdate;
			if(lineItem['custitem_warrantydays'] !== ''){
				warrantyDate.setDate(warrantyDate.getDate()+lineItem['custitem_warrantydays']);
			}
			else{
				warrantyDate.setDate(warrantyDate.getDate()+1095);
			}
			log.debug('item warranty date is: ' + warrantyDate ); 
			log.debug('item renewDate date is: ' + renewDate ); 
			itemFF.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_wardate", value: warrantyDate});
			itemFF.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_rendate", value: renewDate});
		}
			
	}
	function getNSPIREAuthenticationtoken(){
		var token='';
		var authenticationDetails;
		var tokenRefreshTime;
		var mySearch = search.create({
			type: 'customrecord_spr_cust_app_config',
			columns: ['custrecord_spr_cust_app_config_key','custrecord_spr_cust_app_config_value'],
			filters: ['custrecord_spr_cust_app_config_key','startswith','nspire']
			});

		var result = mySearch.run().getRange(0, 20);
		for (var i = 0; i < result.length; i++) {
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspiretoken'){
				token = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspireauth'){
				authenticationDetails = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspiretokenrefreshtime'){
				tokenRefreshTime = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
		}
		if ( token != ''){
			//Check if the current time passed refreshed time
			var currentDateTime = new Date();
			if (tokenRefreshTime.length ==20){ // ISO time without milli seconds is not getting recognized in NS
				tokenRefreshTime = tokenRefreshTime.replace('Z','.000Z');
				var refreshDateTime = new Date(tokenRefreshTime);
				if( ( refreshDateTime - currentDateTime ) <0)
					token = ''; // token expired
			}
		}
		
		if ( token == ''){
			token = refreshAndSaveToken(authenticationDetails);
		}
		return token;
	}
	function refreshAndSaveToken(authcred){
		//Get Authentication token
        var base64EncodedString = encode.convert({
            string: authcred,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
		
		var data = '';
		var headers = [];
		headers['Content-Type'] = 'application/json';
		headers['Accept'] = '*/*';
		headers['Content-Length']  = data.length;
		headers['x-nspire-apptoken'] = '4b503794-fd28-4c57-9d73-73c7a90246b9';
		headers['Authorization'] = 'Basic ' + base64EncodedString ;  // how to convert userid and pwd to authorization header

		var response = https.get({
		url: url_identitytoken,
		body: data,
		headers: headers
		});
		tokenResponse = JSON.parse(response.body);
		
		//save authentication token 
		var tokenupdate = record.submitFields({
					  type: 'customrecord_spr_cust_app_config',
					  id: 6,
					  values: {
						  'custrecord_spr_cust_app_config_value':  tokenResponse.token
					  },
					  options: {
						  enableSourcing: false,
						  ignoreMandatoryFields : true
					  }
					}); 
		var refreshtimeupdate = record.submitFields({
					  type: 'customrecord_spr_cust_app_config',
					  id: 7,
					  values: {
						  'custrecord_spr_cust_app_config_value':  tokenResponse.refreshBy
					  },
					  options: {
						  enableSourcing: false,
						  ignoreMandatoryFields : true
					  }
					}); 
		
		return tokenResponse.token;
	}
	function addDevicesUsingCSV(rec,transid,itemid,numberOfItems,strDevCSV,provisionStatus){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var newSeq = 0;
		var parentArray = parseCSV(strDevCSV);
		var devArrray = parentArray[0];
		for(var i = 0; i < devArrray.length; i++) {
			log.debug({title: 'Inside addDevicesUsingCSV',details: 'Device - ' + devArrray[i]});
			addLine(rec,transid,itemid,devArrray[i],i,provisionStatus);
		}
	}
	function parseCSV(str) {
		var arr = [];
		var quote = false;  // 'true' means we're inside a quoted field

		// Iterate over each character, keep track of current row and column (of the returned array)
		for (var row = 0, col = 0, c = 0; c < str.length; c++) {
			var cc = str[c], nc = str[c+1];        // Current character, next character
			arr[row] = arr[row] || [];             // Create a new row if necessary
			arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

			// If the current character is a quotation mark, and we're inside a
			// quoted field, and the next character is also a quotation mark,
			// add a quotation mark to the current column and skip the next character
			if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

			// If it's just one quotation mark, begin/end quoted field
			if (cc == '"') { quote = !quote; continue; }

			// If it's a comma and we're not in a quoted field, move on to the next column
			if (cc == ',' && !quote) { ++col; continue; }

			// If it's a newline (CRLF) and we're not in a quoted field, skip the next character
			// and move on to the next row and move to column 0 of that new row
			if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

			// If it's a newline (LF or CR) and we're not in a quoted field,
			// move on to the next row and move to column 0 of that new row
			if (cc == '\n' && !quote) { ++row; col = 0; continue; }
			if (cc == '\r' && !quote) { ++row; col = 0; continue; }

			// Otherwise, append the current character to the current column
			arr[row][col] += cc;
		}
		return arr;
	}
	function addDevicesbyGeneratingSerials(rec,transid,itemid,numberOfItems){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var newSeq = 0;
		var sprDevSerJson = "";
		var mySearch = search.create({
				type: 'customrecord_spr_cust_app_config',
				columns: ['custrecord_spr_cust_app_config_key','custrecord_spr_cust_app_config_value'],
				filters: ['custrecord_spr_cust_app_config_key','startswith','Serial']
				});

			var result = mySearch.run().getRange(0, 20);
			for (var i = 0; i < result.length; i++) {
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialCurrentSeq'){
					serialCurrentSeq = parseInt(result[i].getValue('custrecord_spr_cust_app_config_value'));
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialAutoIncrement'){
					if (parseInt(result[i].getValue('custrecord_spr_cust_app_config_value')) ==0){
						serialAutoIncrementFlag = false;
					}
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialLength'){
					serialLength = parseInt(result[i].getValue('custrecord_spr_cust_app_config_value'));
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialPrefix'){
					serialPrefix = result[i].getValue('custrecord_spr_cust_app_config_value');
				}
			}
			for(var i = 0; i < numberOfItems; i++) {
				
				addLine(rec,transid,itemid,serialPrefix+ FormatNumberLength( serialCurrentSeq+i,serialLength-serialPrefix.length ),i)
				newSeq++;
			}
			log.debug('Inside addDevicesbyGeneratingSerials transid - ' + transid);
			if(serialAutoIncrementFlag)
			{
				var recid = record.submitFields({
							  type: 'customrecord_spr_cust_app_config',
							  id: 8,
							  values: {
								  'custrecord_spr_cust_app_config_value':  serialCurrentSeq+ newSeq
							  },
							  options: {
								  enableSourcing: false,
								  ignoreMandatoryFields : true
							  }
							}); 
			}
			log.debug('incrementing serial no');

	}
	function addLine(rec,transid,itemid,serialNo,insertLineNo,provisionStatus) {
		//transaction.Type.ITEM_FULFILLMENT
		rec.insertLine({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo});
		rec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo, fieldId: "custrecord_spr_srno_transtype", value: 32});
		rec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo, fieldId: "custrecord_spr_srno_transno", value: transid});
		rec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo, fieldId: "custrecord_spr_srno_itemno", value: itemid});
		rec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo, fieldId: "custrecord_spr_srno_devsrno", value: serialNo});
		rec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: insertLineNo, fieldId: "custrecord_spr_srno_nspire_status", value: provisionStatus});
		//rec.commitLine({sublistId: "recmachcustrecord_spr_srno_transno"});
	}
	
	function FormatNumberLength(num, length) {
		var r = "" + num;
		while (r.length < length) {
			r = "0" + r;
		}
		return r;
	} 
	function isDevice(itemID) {
		var lineItem = search.lookupFields({
			type: search.Type.ITEM,
			id: itemID,
			columns: ['itemid', 'displayname','parent'],
		});
		log.debug(lineItem);
		var parentItemdesc = '';
		if( lineItem.parent.length >0)
			parentItemdesc = lineItem.parent[0].text;
		if(parentItemdesc.search(/device/i) >1){
			log.debug('It is a device');
			return true;
		}
		return false;
	}
	function isService(itemID) {
		var lineItem = search.lookupFields({
			type: search.Type.ITEM,
			id: itemID,
			columns: ['itemid', 'displayname','parent'],
		});
		log.debug(lineItem);
		var parentItemdesc = '';
		if( lineItem.parent.length >0)
			parentItemdesc = lineItem.parent[0].text;
		if(parentItemdesc.search(/service/i) >1){
			log.debug('It is a service');
			return true;
		}
		return false;
	}	
	return{
		onRequest: function (context) {
			var request  = context.request;         
			execute(context);
			log.debug({title: 'Mavrick test engine simulation',details: 'Finished Executing'});
		}
	};

});
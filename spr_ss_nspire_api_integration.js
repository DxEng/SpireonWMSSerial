/**
 * spr_ss_nspire_api_integration.js
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * Auther: Sathish Madhi
 * Created: 07/29/2021
 */
 
 
 
define(['N/search', 'N/record','N/transaction', 'N/log', 'N/runtime', 'N/error', 'N/format','N/https','N/encode','./spr_util_shipconfirmvalidations'],
function (search, record,transaction, log, runtime, error, format,https,encode,shipconfirm){
	const _LOGHEADER = 'Nspire API Integration';
	var url_DeviseProvision = 'https://deviceprovisioningservice-stage.spireon.com/rest/deviceProvisioningOrders';
	var url_identitytoken = 'https://identity-stage.spireon.com/identity/token';
	function execute(context){
		var today = new Date();
		log.audit({title: _LOGHEADER,details: 'Start of execute'});
		try{
			var i = 1;
			//getFFProvisionStatusFromNspire(); // get the status for submissions that are not provisioned yet
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}		
		try{
			shipconfirm.sendAlertForFailedProvisions(); // after provision try.
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}
		try{
			shipconfirm.updateSCNonSerializedIFFPackToShip();// If all the items inthe iff are only non-serialzed
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}
		try{
			shipconfirm.validateAndAlertEmailSCSerializedIFFAndPackToShip();// Serialized with Pack
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}		
		try{
			var j = 2;
			//populateDeviceDates(); //Populates dates based on SS for fulfillment records with devices that doesn't have device dates not populated.
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}
		try{
			var k = 3;
			//submitInitial(); //Submit for Provision	
		}catch(e){
			log.error ({ title: e.name,details: e.message});
		}		
		log.audit({title: _LOGHEADER,details: 'End of execute'});
	}
	function getFFProvisionStatusFromNspire(){
		log.debug({title: _LOGHEADER,details: 'Start of submitInitial' });
		//log.debug({title: _LOGHEADER,details: 'Finished submitInitial' + ' with Record Count: '+recordcount});
		var ffSearchWithDevicesNotSubmittedToNspire = search.create({
		type: 'itemfulfillment',
		columns: ['statusref'],
		filters:
		   [
			  ['type','anyof','ItemShip'],     
			  'AND', 
			  ['mainline','is','T'], 
			  'AND', 
			  ['status','anyof','ItemShip:C','FftReq:E'], 
			  'AND', 
			  ['location','anyof','201','202'], 
			  'AND', 
			  [['custbody_spr_nspire_api_order_status','isnotempty','']
				,'AND',
				[['custbody_spr_nspire_api_order_status','is','INITIAL'],'OR',['custbody_spr_nspire_api_order_status','is','ATTEMPT_IN_PROGRESS']
				,'OR',
				['custbody_spr_nspire_api_order_status','is','PENDING_RETRY']]
			  ],
			  'AND',
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_devsrno','isnotempty',''], 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_shipdate','isnotempty',''],
			  
		   ]
		});

		var searchResult = ffSearchWithDevicesNotSubmittedToNspire .run().getRange(0, 50);
		for (var i = 0; i < searchResult.length; i++) {
			log.debug(searchResult[i].id);
			try{
				checkStatusOfProvisionByOrderIdANDSaveFF(searchResult[i].id);
			}catch(e){
					log.error ({ title: e.name,details: e.message});
			}
		}		
		log.debug({title: _LOGHEADER,details: 'Finished submitInitial' });
	}
	function populateDeviceDates(){
		log.debug({title: _LOGHEADER,details: 'Start of populateDeviceDates'});
		var ffSearchWithDevicesNoDates = search.create({
		type: 'itemfulfillment',
		columns: ['statusref'],
		filters:
		   [
			  ['type','anyof','ItemShip'],     
			  'AND', 
			  ['mainline','is','T'], 
			  'AND', 
			  ['status','anyof','ItemShip:C','FftReq:E'], 
			  'AND', 
			  ['location','anyof','201','202'], 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_devsrno','isnotempty',''], 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_shipdate','isempty','']
		   ]
		});

		var searchResult = ffSearchWithDevicesNoDates .run().getRange(0, 50);
		for (var i = 0; i < searchResult.length; i++) {
			log.debug(searchResult[i].id);
			ffrec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: searchResult[i].id});
			if(ffrec.type == record.Type.ITEM_FULFILLMENT   ){
				try{
					ffrec.save(); // See if there is a better way to do this.	
				}catch(e){
						log.error ({ title: e.name,details: e.message});
				}				              
			}
		}
		
		log.debug({title: _LOGHEADER,details: 'Finished populateDeviceDates' + ' with Record Count: '+searchResult.length});
	}
	function submitInitial(){
		log.debug({title: _LOGHEADER,details: 'Start of submitInitial'});
		var ffSearchWithDevicesNotSubmittedToNspire = search.create({
		type: 'itemfulfillment',
		columns: ['statusref'],
		filters:
		   [
			  ['type','anyof','ItemShip'],     
			  'AND', 
			  ['mainline','is','T'], 
			  'AND', 
			  ['status','anyof','ItemShip:C','FftReq:E'], 
			  'AND', 
			  ['location','anyof','201','202'], 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_devsrno','isnotempty',''], 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_shipdate','isnotempty',''],
			  'AND', 
			  ['custbody_spr_nspire_api_order_status','isempty','']  , 
			  'AND', 
			  ['custrecord_spr_srno_transno.custrecord_spr_srno_nspire_status','isempty','']
		   ]
		});

		var searchResult = ffSearchWithDevicesNotSubmittedToNspire .run().getRange(0, 50);
		for (var i = 0; i < searchResult.length; i++) {
			log.debug(searchResult[i].id);
			ffrec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: searchResult[i].id});
			if(ffrec.type == record.Type.ITEM_FULFILLMENT   ){
				var JSONstring = generateJSONstringFromFF(ffrec);
				submitInitialProvisionToNSpireANDSaveFF(JSONstring);		              
			}
		}
		
		log.audit({title: _LOGHEADER,details: 'Finished of submitInitial' + ' with Record Count: '});
	}
	function updateNspireProvisionStatus(ffid){
		var headers = [];
		headers['Content-Type'] = 'application/json';
		headers['Accept'] = '*/*';
		headers['Content-Length']  = 0;
		headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();

		var response = https.get({
			url: url_DeviseProvision + '/' +ffid,
			headers: headers
			});
		var JSONstring = response.body;	
		log.debug({title: 'FINDBYID - response bod',details: JSONstring});
		var nspireresponse = JSON.parse(JSONstring);
		updateNspireResoponse(nspireresponse);
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
	function checkStatusOfProvisionByOrderIdANDSaveFF(ffid){
		var headers = [];
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = '*/*';
			headers['Content-Length']  = 0;
			headers['Authorization'] = 'Bearer ' + getNSPIREAuthenticationtoken();
		var response = https.get({
			url: url_DeviseProvision + '/' +ffid,
			headers: headers
			});
		JSONstring = response.body;	
		log.debug({title: 'FINDBYID - response bod',details: JSONstring});
		var nspireresponse = JSON.parse(JSONstring);
		updateNspireResoponse(nspireresponse);			
	}
	function submitInitialProvisionToNSpireANDSaveFF(data){
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
	function updateNspireResoponse(nspireJsonResponse){
		log.debug('inside updateNspireResoponse');
		if(nspireJsonResponse.id == null){
			log.error ({ title: 'Nspire Error-' + nspireJsonResponse.code ,details: nspireJsonResponse.message});
			return;
		}
		var ffid = nspireJsonResponse.id;
		log.debug('ffid - ' + ffid);
		ffrec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: ffid});
		ffrec.setValue('custbody_spr_nspire_api_order_status',nspireJsonResponse.overallStatus);
		var dslCount= ffrec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
		//Mapreduce candidate
		for(var dslNum = 0; dslNum < dslCount; dslNum++) {
			var devSerialValue = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_devsrno", line:dslNum});
			var devinternalId = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "id", line:dslNum});
			log.debug({title: 'Inside updateNspireResoponse',details: 'devinternalId - ' + devinternalId});
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
	function convertDateToNspireFormatFromSubList(nsRec, subListId, rowNum, field){
		//return ( format.format({value:nsRec.getSublistValue({sublistId: subListId, line: rowNum, fieldId: field}),type: format.Type.DATE}));
		var dateValue = nsRec.getSublistValue({sublistId: subListId, line: rowNum, fieldId: field});
		//yyyy-mm-dd
		if ( dateValue == '')
			return '';
		var monthValue = dateValue.getMonth() + 1;
		if ( monthValue <10)
			monthValue = '0'+monthValue;
		return 	dateValue.getFullYear()   + '-' + monthValue  + '-' + dateValue.getDate(); 
	}
	function getNSPIREAuthenticationtoken(){
		var token='';
		var authenticationDetails;
		var tokenRefreshTime;
		var nspiretokenAConfigIId;
		var nspiretokenRefresshTimeAConfigIId;
		var mySearch = search.create({
			type: 'customrecord_spr_cust_app_config',
			columns: ['custrecord_spr_cust_app_config_key','custrecord_spr_cust_app_config_value'],
			filters: ['custrecord_spr_cust_app_config_key','startswith','nspire']
			});

		var result = mySearch.run().getRange(0, 20);
		for (var i = 0; i < result.length; i++) {
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspiretoken'){
				token = result[i].getValue('custrecord_spr_cust_app_config_value');
				nspiretokenAConfigIId = result[i].id;
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspireauth'){
				authenticationDetails = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nspiretokenrefreshtime'){
				tokenRefreshTime = result[i].getValue('custrecord_spr_cust_app_config_value');
				nspiretokenRefresshTimeAConfigIId = result[i].id;
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
			token = refreshAndSaveToken(authenticationDetails, nspiretokenAConfigIId,nspiretokenRefresshTimeAConfigIId);
		}
		return token;
	}
	function refreshAndSaveToken(authcred,nsTokenAConfigIId,nsTokenAConfigRefreshTimeIId){
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
		//Hard coded record ids are problem in production the values are different. May be make a query to get the id
		var tokenupdate = record.submitFields({
					  type: 'customrecord_spr_cust_app_config',
					  id: nsTokenAConfigIId,
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
					  id: nsTokenAConfigRefreshTimeIId,
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
	
	return {
		execute: execute
	}
});
/**
 * @NApiVersion  2.1
 * @NModuleScope Public
 */
define(['N/error', 'N/record','N/query','N/url', 'N/email','SuiteScripts/DevLibrary/ECMA-Javascript-PolyFill'],
function(error, record,query,url,email) {
   
    function saveIFF(iffid, iffStatus, nSpireStatus = '') {
		let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});	
		if ( iffStatus.length > 0)	
			iffRec.setValue('shipstatus',iffStatus);
		if ( nSpireStatus.length > 0){
				iffRec.setValue('custbody_spr_nspire_api_order_status',nSpireStatus);
		}
		var msmatchStr = 'DEVICE QUANTITY MISMATCH';			
		if (( iffStatus == 'C' && nSpireStatus == 'IN PROCESS') || (iffRec.getValue('shipstatus') == 'B' &&  nSpireStatus.substring(0,msmatchStr.length) == msmatchStr)){
			let dslCount= iffRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
			for(let dslNum = 0; dslNum < dslCount; dslNum++) {
				//log.debug({title: 'Clean up old Errors',details: 'devinternalId - ' + devinternalId});
				iffRec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_msg", value: ''}); // blanking out the old error messages				
			}	
		}
		iffRec.save();
	}
	function updateSCNonSerializedIFFPackToShip(){
		let strHWIffUpdateDetails = 'HW Only Update Details.\n';
		let strQuery = "select distinct T.id InternalId,T.status  " +
							"from  transaction t inner join transactionLine tl on t.id = tl.transaction " +
							"inner join item i on tl.item = i.id  " +
							"left join ( select distinct T.id from  transaction t inner join transactionLine tl on t.id = tl.transaction  " +
							"inner join item i on tl.item = i.id   and i.custitem_spireonserialized = 'T' and t.recordtype = 'itemfulfillment' WHERE T.status = 'B') A  on T.id = A.id " +
							"WHERE T.custbody_spr_nspire_api_order_status = 'IN PROCESS' and A.id is null ";
		log.debug({title: 'updateSCNonSerializedIFFPackToShip' ,details: strQuery});
		results = query.runSuiteQL({
			query: strQuery
		});
		let lineCount = results.results.length;
		log.debug({title: 'updateSCNonSerializedIFFPackToShip' ,details: 'lineCount - ' + lineCount});
		for(let loop_i = 0; loop_i < lineCount; loop_i++) {
			if ( results.results[loop_i].values[1] == 'B'){ // Suite QL is not working to filter this , so filtering here.
				let internalId = results.results[loop_i].values[0];
				strHWIffUpdateDetails = strHWIffUpdateDetails + String.format('IFF Internal Id: {0} Inital Status: {1} Update Status To: {2} \n',internalId,'Packed','Shipped');				
				saveIFF(internalId,'C','NOT APPLICABLE');
			}
		}
		return strHWIffUpdateDetails;
	}
	function validateAndAlertEmailSCSerializedIFFAndPackToShip(){
		let strEmailBody = 'Item Fulfillment(s) with Devices Validation Details.\n';
		let strWithDevicesProvision = strEmailBody;
		let strQuery = "select distinct T.id InternalId,T.status  " +
			"from  transaction t inner join transactionLine tl on t.id = tl.transaction " +
			"inner join item i on tl.item = i.id  " +
			"left join ( select distinct T.id from  transaction t inner join transactionLine tl on t.id = tl.transaction  " +
			"inner join item i on tl.item = i.id   and i.custitem_spireonserialized = 'T' and t.recordtype = 'itemfulfillment' ) A  on T.id = A.id and T.status = 'B' "+
			"WHERE T.custbody_spr_nspire_api_order_status = 'IN PROCESS' ";
		log.debug({title: 'validateAndAlertEmailSCSerializedIFFAndPackToShip' ,details: strQuery});
		let rs_iff_withdevices = query.runSuiteQL({
			query: strQuery
		});
		let lineCount = rs_iff_withdevices.results.length;
		log.debug({title: 'PACKTOSHIPDEVICES' ,details: 'lineCount - ' + lineCount});
		for(let loop_i = 0; loop_i < lineCount; loop_i++) {
			if ( rs_iff_withdevices.results[loop_i].values[1] == 'B'){ 
				let internalId = rs_iff_withdevices.results[loop_i].values[0];
				log.debug({title: 'validateAndAlertEmailSCSerializedIFFAndPackToShip' ,details: ' before Validate iffid : ' + internalId});
				strWithDevicesProvision = strWithDevicesProvision + String.format('IFF Internal Id validated : {0}  \n',internalId);
				ValidateAndUpdate(internalId);
			}
		}
		strWithDevicesProvision = strWithDevicesProvision + 'Device Validation Failed for below records.\n';
		strQuery = "select T.tranid, T.id internalid, createddate , custbody_spr_nspire_api_order_status , C.companyname , T.Entity CustomerInternalId , T.status "+
			"from transaction T inner join Customer C on T.entity = C.Id  " +
			"where recordtype = 'itemfulfillment' and  t.status != 'C' and custbody_spr_nspire_api_order_status like 'FAILED%' and createddate  > '9/1/2021' "+
			"UNION "+
			"select T.tranid, T.id internalid, createddate , custbody_spr_nspire_api_order_status , C.companyname , T.Entity CustomerInternalId ,T.status  "+
			"from transaction T inner join Customer C on T.entity = C.Id  " +
			"where recordtype = 'itemfulfillment' and  t.status != 'C' and custbody_spr_nspire_api_order_status like '%MISMATCH%' and createddate  > '9/1/2021' "
		strWithDevicesProvision = strWithDevicesProvision  + SendEmail(strEmailBody,strQuery,true);
		return strWithDevicesProvision;
	}
	function ValidateAndUpdate(iffid, isUpdate=true)
	{			
		log.debug({title: 'ValidateAndUpdate' ,details: iffid + ' isUpdate: ' + isUpdate});			
		let strQuery = " select deviceCount from ( SELECT T.id InternalId, i.itemid, (-1) * tl.quantity as itemQuantity,  " +
			"( select  count(1) from customrecord_ssr_order_item_serialnum where custrecord_spr_srno_transno = T.id and custrecord_spr_srno_itemno = i.id)  deviceCount " +
			"FROM  transaction t inner join transactionLine tl on t.id = tl.transaction  " +
			"inner join item i on tl.item = i.id   " +
			"WHERE t.recordtype = 'itemfulfillment'  and  i.custitem_spireonserialized = 'T' and tl.custcol21 = 'T' ";
		strQuery = strQuery + String.format("and  T.id = {0} ) T1 where itemQuantity <> deviceCount",iffid);
		//has devices logic will coved the packed
		log.debug({title: 'Item Info' ,details: strQuery});
		results = query.runSuiteQL({
			query: strQuery
		});
		let hasDeviceCountMismatch = false;
		let deviceCount = 0;
		if ( results.results.length > 0){
			hasDeviceCountMismatch = true;	
			for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
				deviceCount	= results.results[loop_i].values[0];		
			}				
		}
		let strSuiteQL;
		strQuery = "select custrecord_spr_cust_app_config_value from customrecord_spr_cust_app_config where custrecord_spr_cust_app_config_key= 'DeviceValidationSQL' ";		
		results = query.runSuiteQL({
			query: strQuery
		});
		if ( results.results.length > 0){
			for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
				strSuiteQL = results.results[loop_i].values[0];
			}
			strSuiteQL = String.format(strSuiteQL,iffid);
			log.debug({title: 'custrecord_spr_cust_app_config_value' ,details:strSuiteQL });
		}
		strQuery = strSuiteQL;
		log.debug({title: 'Device Serial Validation' ,details: strQuery});
		results = query.runSuiteQL({
			query: strQuery
		});
		if( results.results.length > 0 ){
			log.debug({title: 'API Provision Steps' ,details: 'Inside after suiteQL - results' + results.results.length });
			let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});	
/*
//I changed the looping in reverse order. 			
			for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
				let dslCount= iffRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
				for(let dslNum = 0; dslNum < dslCount; dslNum++) {
					let devSerialValue = iffRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_devsrno", line:dslNum});
					let devinternalId = iffRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "id", line:dslNum});
					log.debug({title: 'Inside update of Errors',details: 'devinternalId - ' + devinternalId});
					if(results.results[loop_i].values[0] == devSerialValue ){								
						iffRec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_msg", value: results.results[loop_i].values[1]})
					}	
				}						
			}	
			*/
			
			let dslCount= iffRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
			for(let dslNum = 0; dslNum < dslCount; dslNum++) {
				let devSerialValue = iffRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_devsrno", line:dslNum});
				let devinternalId = iffRec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "id", line:dslNum});
				log.debug({title: 'Inside update of Errors',details: 'devinternalId - ' + devinternalId});
				iffRec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_msg", value: ''}); // blanking out the old error messages first 
				for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
					if(results.results[loop_i].values[0] == devSerialValue ){								
						iffRec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: dslNum, fieldId: "custrecord_spr_srno_nspire_err_msg", value: results.results[loop_i].values[1]})
					}	
				}						
			}	
			log.debug({title: 'Inside update of Validation Errors',details: 'iffid - ' + iffid});
			let iffError = 'FAILED(NS)';
			if (hasDeviceCountMismatch)
				iffError = 'DEVICE QUANTITY MISMATCH('+deviceCount + ')';
			iffRec.setValue('custbody_spr_nspire_api_order_status',iffError);				
			iffRec.save();				
		}
		else if(hasDeviceCountMismatch){
			saveIFF(iffid,'','DEVICE QUANTITY MISMATCH('+deviceCount + ')')
		}
		else{
			saveIFF(iffid,'C','IN PROCESS');
		}
	}
	function sendAlertForFailedProvisions(){
		let strEmailBody =  'Provisioning requests to nspire are failed or more likely fail (if they are in pending retry. Notify people who can correct this.\n';
		let strQuery = "select T.tranid, T.id internalid, createddate,custbody_spr_nspire_api_order_status, C.companyname , T.Entity CustomerInternalId ,T.status  "+
			"from transaction T inner join Customer C on T.entity = C.Id " +
			"where recordtype = 'itemfulfillment' and custbody_spr_nspire_api_order_status = 'FAILED' and createddate  > '9/1/2021'"
		return SendEmail(strEmailBody,strQuery);					
	}
	function SendEmail(emailBody, strEmailSQL, ispackedOnly= false){
		let strEmailReponse = emailBody;
		log.debug({title: 'SendEmail' ,details: strEmailSQL});
		let results = query.runSuiteQL({
			query: strEmailSQL
		});			
		let lineCount= results.results.length;
		log.debug({title: 'SendEmail' ,details: lineCount});
		let scheme = 'https://';
		let host = url.resolveDomain({
			hostType: url.HostType.APPLICATION
		});		
		for(let loop_i = 0; loop_i < lineCount; loop_i++) {
			if (ispackedOnly && results.results[loop_i].values[6] != 'B')
				continue;
			let relativePath  = url.resolveRecord({
				recordType: record.Type.ITEM_FULFILLMENT,
				recordId: results.results[loop_i].values[1],
				isEditMode: false
				});
		
			let recordPath =  scheme + host + relativePath;
			strEmailReponse = strEmailReponse + String.format('Fulfillment: {0} Internal Id: {1} Create Date: {2} nspire Status: {3} Customer: {4} Customer Internal Id: {5} url:{6}\n',results.results[loop_i].values[0],results.results[loop_i].values[1],results.results[loop_i].values[2],results.results[loop_i].values[3],results.results[loop_i].values[4],results.results[loop_i].values[5],recordPath);
		}
		log.debug({title: 'SendEmail' ,details: 'strEmailReponse: ' + strEmailReponse});
		email.send({
			author: 5855344,
			recipients: 'smadhi@spireon.com;sathish.madhi@gmail.com',
			subject: 'Item Fulfillment Records in FAILED/ PENDING RETRY nspire Status',
			body: strEmailReponse		
		});
		return strEmailReponse;
	}
	return {
		saveIFF: saveIFF,
		updateSCNonSerializedIFFPackToShip: updateSCNonSerializedIFFPackToShip,
		validateAndAlertEmailSCSerializedIFFAndPackToShip: validateAndAlertEmailSCSerializedIFFAndPackToShip,
		ValidateAndUpdate: ValidateAndUpdate,
		sendAlertForFailedProvisions: sendAlertForFailedProvisions
	}
});
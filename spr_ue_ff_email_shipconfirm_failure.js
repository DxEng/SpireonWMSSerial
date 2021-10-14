/**
 * @NApiVersion  2.1
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/format','N/query','N/url', 'N/email','SuiteScripts/DevLibrary/ECMA-Javascript-PolyFill'],
function(search, record, log, runtime, error, format,query,url,email){
	function afterSubmit(scriptContext) {
		var ffRec = scriptContext.newRecord;
        if(ffRec.getValue('ordertype') != 'SalesOrd')
			return;
		//email alert for Failed(ns) or Pending Retry 
		if (scriptContext.type == scriptContext.UserEventType.EDIT){// not applicable at the time of record creation 
			var shipStatus = ffRec.getValue('shipstatus');
			var nSpireStatus = ffRec.getValue('custbody_spr_nspire_api_order_status');
			var msmatchStr = 'DEVICE QUANTITY MISMATCH';
			var ffOldRec = scriptContext.oldRecord;
			var old_nSpireStatus = ffOldRec.getValue('custbody_spr_nspire_api_order_status');
          	log.debug({title: 'afterSubmit' ,details:String.format( "shipStatus: {0}, nSpireStatus: {1}, old_nSpireStatus: {2}",shipStatus,nSpireStatus,old_nSpireStatus) });
			if (shipStatus == 'B' && (nSpireStatus == 'FAILED(NS)' || nSpireStatus.substring(0,msmatchStr.length) == msmatchStr )){			
				if (old_nSpireStatus != nSpireStatus){
					try{
						SendEmail(ffRec,true);
					}catch(e){
						log.error ({ title: e.name,details: e.message});
					}	
				}
			}
			if (shipStatus == 'C' && nSpireStatus == 'PENDING_RETRY' ){
				if (old_nSpireStatus != nSpireStatus){
					try{
						SendEmail(ffRec,false);
					}catch(e){
						log.error ({ title: e.name,details: e.message});
					}		
				}
			}
		}		
	}	
	function SendEmail(ffRec, isNSFailure ){		
		let configkeyLike = '';
		let emailSubj = '';
		let emailBody = '';
		let emailRecipients = '';
		
		if(isNSFailure){
			configkeyLike = 'IFF_EMAIL_NS_VALIDATIONS';
		}else{
			configkeyLike = 'IFF_EMAIL_PROVISION';
		}
		let strQuery = String.format("select custrecord_spr_cust_app_config_key , custrecord_spr_cust_app_config_value from customrecord_spr_cust_app_config where custrecord_spr_cust_app_config_key like '{0}%' ", configkeyLike);
		results = query.runSuiteQL({
			query: strQuery
		});
		if ( results.results.length > 0){
			for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
				if(results.results[loop_i].values[0] == 'IFF_EMAIL_NS_VALIDATIONS_FAILURE_BODY' || results.results[loop_i].values[0] == 'IFF_EMAIL_PROVISION_FAILURE_BODY')
					emailBody = results.results[loop_i].values[1];
				if(results.results[loop_i].values[0] == 'IFF_EMAIL_NS_VALIDATIONS_FAILURE_SUB' || results.results[loop_i].values[0] == 'IFF_EMAIL_PROVISION_FAILURE_SUB')
					emailSubj = results.results[loop_i].values[1];
				if(results.results[loop_i].values[0] == 'IFF_EMAIL_NS_VALIDATIONS_RECIPIENTS' || results.results[loop_i].values[0] == 'IFF_EMAIL_PROVISION_RECIPIENTS')
					emailRecipients = results.results[loop_i].values[1];
			}
			log.debug({title: 'SendEmail' ,details:String.format( "Subject: {0}, Body: {1}, Recipients: {2}",emailSubj,emailBody,emailRecipients) });
		}	
		let scheme = 'https://';
		let host = url.resolveDomain({
			hostType: url.HostType.APPLICATION
		});		
		let relativePath  = url.resolveRecord({
			recordType: record.Type.ITEM_FULFILLMENT,
			recordId: ffRec.id ,
			isEditMode: false
			});
		let recordPath =  scheme + host + relativePath;
		emailBody = emailBody + String.format('Fulfillment: {0} Internal Id: {1} Create Date: {2} Item Fulfillment Status: {3} nspire Status: {4} Customer: {5} Customer Internal Id: {6} url:{7}\n',ffRec.getValue('tranid'),ffRec.id,ffRec.getValue('createddate'),ffRec.getValue('shipstatus'),ffRec.getValue('custbody_spr_nspire_api_order_status'),ffRec.getValue('entityname'),ffRec.getValue('entity'),recordPath);		
		log.debug({title: 'SendEmail' ,details: 'emailBody: ' + emailBody});
		email.send({
			author: 5855344,
			recipients: emailRecipients,
			subject: emailSubj,
			body: emailBody		
		});
	}	
	return {
	  afterSubmit : afterSubmit
	};
});
/**
 * @NApiVersion  2.1
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/format','N/query','N/url', 'N/email','SuiteScripts/DevLibrary/ECMA-Javascript-PolyFill'],
function(search, record, log, runtime, error, format,query,url,email){
    function beforeLoad(scriptContext) {
		log.debug({title: 'beforeLoad',details: scriptContext.type});
		var ffRec = scriptContext.newRecord;
        if(ffRec.getValue('ordertype') != 'SalesOrd')
			return;
		//custom buttons if the nspire status is in FAILED(NS) or DEVICE QUANTITY MISMATCH
		if (scriptContext.type === scriptContext.UserEventType.VIEW){// Applicable at the time of view mode
			var shipStatus = ffRec.getValue('shipstatus');
			var nSpireStatus = ffRec.getValue('custbody_spr_nspire_api_order_status');
			var msmatchStr = 'DEVICE QUANTITY MISMATCH';			
			if (shipStatus == 'B' && (nSpireStatus == 'FAILED(NS)' || nSpireStatus.substring(0,msmatchStr.length) == msmatchStr )){			

				let iffFailureUIOption = 3;
				let strQuery = "select custrecord_spr_cust_app_config_value from customrecord_spr_cust_app_config where custrecord_spr_cust_app_config_key like 'IFF_NSPIRE_FAILED_UI_OPTION'";
				results = query.runSuiteQL({
					query: strQuery
				});
				if ( results.results.length > 0){
					for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
						iffFailureUIOption = results.results[loop_i].values[0];
					}
					log.debug({title: 'beforeLoad Custom UI' ,details:String.format( "iffFailureUIOption: {0}",iffFailureUIOption) });
				}			
				if ( iffFailureUIOption != '3'){
					if (iffFailureUIOption == '1'){
						var button = scriptContext.form.getButton({
							id : 'edit'
						});
						if ( button != null){
							scriptContext.form.removeButton('edit');
						}
					}					
					var btn1 = scriptContext.form.addButton({
						id: 'custpage_validateagain',
						label: 'Re-Validate (for IN PROCESS and Shipped)',
						functionName: 'onValidateIFFAgain'
					});
					var btn2 = scriptContext.form.addButton({
						id: 'custpage_ignorevalidations_ship',
						label: 'Ignore Validations (Proceed to Provision)',
						functionName: 'onIgnoreValidationOnIFFMarkShipped'
					});
					
				}				
			}			
		}
		var btn3 = scriptContext.form.addButton({
						id: 'custpage_getdevicecount',
						label: 'Show Device Count',
						functionName: 'onShowDeviceCount'
					});
		scriptContext.form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/spr_cs_iff_custombuttons.js";
	}	
	function beforeSubmit(scriptContext) {
		//most of the time the ff is saved first so the ff transactionid is available to save the device serial object that will connect the device serial object to ff record 
        log.debug({title: 'beforeSubmit Context ',details: scriptContext.type});
		var ffrec = scriptContext.newRecord;
        if(ffrec.getValue('ordertype') != 'SalesOrd')
			return;
		var datePopulationApplicable = true;
		if (scriptContext.type === scriptContext.UserEventType.CREATE){
			log.debug({title: 'beforeSubmit Context Type',details: scriptContext.UserEventType.CREATE});
			datePopulationApplicable = false;
            //return;
        }
		if (scriptContext.type === scriptContext.UserEventType.DELETE){
			log.debug({title: 'beforeSubmit Context Type',details: scriptContext.UserEventType.DELETE});
			if(ffrec.type == record.Type.ITEM_FULFILLMENT){
				var dslCount= ffrec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" });
				if( dslCount > 0){
					for(var loop_i = dslCount-1; loop_i >= 0; loop_i--) {
						var device_internalid = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "id", line:loop_i});
						var deviceRecord = record.delete({
						   type: 'customrecord_ssr_order_item_serialnum',
						   id: device_internalid,
						});
					}						
				}
				return;
			}
        }	
		if(ffrec.type == record.Type.ITEM_FULFILLMENT && ffrec.id > 0  && datePopulationApplicable){//ff record should have created
			var sotransid = ffrec.getValue('createdfrom');
			var dslCount= ffrec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
			if ( dslCount < 1)
				return;
			log.debug({title: 'FF beforeSubmit ',details: 'sotransid '+ sotransid});
			var shipdate = '';
			var renewDate = '';
			var warrantyDate = '';
			var strQuery = "SELECT t.shipdate ,ADD_MONTHS( t.shipdate, st.custrecord_servicetermmonths) renewdate ";
			strQuery = strQuery  + ",CASE WHEN st.custrecord_servicetermmonths  < 36 THEN ADD_MONTHS(t.shipdate, st.custrecord_servicetermmonths )  ELSE " ;
			strQuery = strQuery  + "ADD_MONTHS(t.shipdate,36) END warrantydate " ;
			strQuery = strQuery  + "FROM item i inner join CUSTOMRECORD_SERVICETERM st on i.custitem27= st.id inner join salesOrdered on salesOrdered.item = i.id ";
			strQuery = strQuery  + "inner join Transaction t on salesOrdered.transaction = t.id ";
			strQuery = strQuery  + "where salesOrdered .type='SalesOrd' and t.id=" + sotransid + " and itemtype='Service'";
			log.debug({title: 'beforeSubmit' ,details: strQuery});
			var results = query.runSuiteQL({
				query: strQuery
			});
			if ( results.results.length == 1){
				shipdate =  new Date(results.results[0].values[0]);
				renewDate =  new Date(results.results[0].values[1]);
				warrantyDate =  new Date(results.results[0].values[2]);	
			}
			else if ( results.results.length == 0){
				var sorec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: sotransid});
				shipdate = sorec.getValue('shipdate');
				warrantyDate = new Date(shipDate.getFullYear(), shipDate.getMonth()+36 , shipDate.getDate());
			}
			
            log.debug({title: 'FF beforeSubmit ',details: 'dslCount '+ dslCount});
			var prevItemid = -1;
			for(var loop_i = 0; loop_i < dslCount; loop_i++) {
				var currentItemid = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_itemno", line:loop_i});
				var currentShipDate = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_shipdate", line:loop_i});
				if( currentShipDate != '')
					return; //Dates are already populated, so this is no longer required.
				log.debug({title: 'FF beforeSubmit, Dates are not populated',details: 'currentItemid' + currentItemid});
				log.debug({title: 'beforeSubmit',details: String.format( 'Dates Are {0} {1} {2}', renewDate ,warrantyDate ,shipdate) });
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_rendate", value: renewDate });
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_wardate", value: warrantyDate});
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_shipdate", value: shipdate});
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_activedate", value: shipdate});
			}
		}
	}
	function isCustomerBelongsToVFClass(customerId){
		var custDetails = search.lookupFields({
			type: search.Type.CUSTOMER,
			id: customerId,
			columns: ['custentity44']
		});
		var customerClassText = custDetails.custentity44[0].text;
		log.debug({title: 'FF beforeSubmit ',details: 'Class text: '+ customerClassText});
		if(customerClassText.search(/ATS-VF/i) >-1){
			return true;
		}
	}
	function isWirelessDevice(deviceItemId){		
		var lineItem = search.lookupFields({
			type: search.Type.ITEM,
			id: deviceItemId,
			columns: ['description']
		});
		if(lineItem.description.search(/untethered/i) >-1){
			log.debug('It is a Wireless');
			return true;
		}
	}	
	function afterSubmit(scriptContext) {
		var ffRec = scriptContext.newRecord;
        if(ffRec.getValue('ordertype') != 'SalesOrd')
			return;
		//email alert for Failed(ns) or Pending Retry 
		if (scriptContext.type === scriptContext.UserEventType.EDIT){// not applicable at the time of record creation 
			var shipStatus = ffRec.getValue('shipstatus');
			var nSpireStatus = ffRec.getValue('custbody_spr_nspire_api_order_status');
			var msmatchStr = 'DEVICE QUANTITY MISMATCH';
			var ffOldRec = scriptContext.oldRecord;
			var old_nSpireStatus = ffOldRec.getValue('custbody_spr_nspire_api_order_status');
			if (shipStatus == 'B' && (nSpireStatus == 'FAILED(NS)' || nSpireStatus.substring(0,msmatchStr.length) == msmatchStr )){							
				if (old_nSpireStatus != nSpireStatus){
					try{
						SendEmail(ffRec,true);
					}catch(e){
						log.error ({ title: e.name,details: e.message});
					}	
				}
			}
			if (shipStatus == 'C' && shipStatus == 'PENDING_RETRY' ){
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
		//afterSubmit : afterSubmit
		beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit
	  
	};
});
/**
 * Copyright © 2017, 2019 Oracle and/or its affiliates. All rights reserved.
 * 
 * @NScriptType ClientScript
 * @NApiVersion 2.x
 */
define(['N/runtime', 'N/https', 'N/url','N/ui/dialog','N/ui/message','N/currentRecord'],
/**
 * @param {runtime} runtime
 * @param {https} https
 * @param {url} url
 */
	
function(runtime, https, url,dialog,message,currentRecord) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

	
  	var rec ;//saving current record in the pageInit	
	var strTitle ;
	var isShowAlert;
    var suiteletUrl;
	var mysubmitMsg;
	function populateCommonVariables(){
		strTitle = 'Device Validation';
		isShowAlert = true;
		suiteletUrl = url.resolveScript({
			scriptId          : 'customscript_spr_sl_ss_apiprovisonsteps',
			deploymentId      : 'customdeploy_spr_sl_ss_apiprovisonsteps',
			returnExternalUrl : false
		});
		rec = currentRecord.get();
	}
	function showSubmitMessage(msg){
		mysubmitMsg = message.create({
        	title: "Device Validation",
          	message: msg ,
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
	}
	function onValidateSerial() {
		console.log('onValidateSerial');
		populateCommonVariables();
		showSubmitMessage("Device Validation Logic");		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					deviceSerial	: rec.getValue('custrecord_spr_validate_devserial'),
              		requestType: 'DEVICEVALIDATION'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				rec.setValue('custpage_validation_response',response.body);
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
		
	}
	function onSingIFFUpdate(){
		alert('update');
		form.post();
	}
	function onPackToShipHW() {
		console.log('onPackToShipHW');
		populateCommonVariables();
		showSubmitMessage("Processing Pack To Ship HW Only");		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
              		requestType: 'HWONLYPACKTOSHIP'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				rec.setValue('custpage_iff_records_processed',response.body);
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
		
	}
	function onPackToShipDevices() {
		console.log('onPackToShipDevices');
		populateCommonVariables();
		showSubmitMessage("Processing Pack To Ship With Devices");		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
              		requestType: 'PACKTOSHIPDEVICES'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				rec.setValue('custpage_iff_records_processed',response.body);
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
		
	}
	
	function onGetDetailsInfo() {
			https.post({
			url: suiteletUrl,
			body : {	
					transid	: rec.getValue('custrecord_spr_validate_iff_internalid'),
              		requestType: 'IFFDETAILS'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				rec.setValue('custpage_validation_response',response.body);
				document.getElementById('custpage_to_ship_hardwareonly').disabled = false;
				document.getElementById('custpage_validate_device_iif_ship').disabled = false;
				var jsobj = JSON.parse(response.body);
				rec.setValue('custpage_iif_displayvalue',jsobj.transactiondetails);
				rec.setValue('custpage_iif_nspirestatus',jsobj.nspire_api_order_status);
				rec.setValue('custpage_iif_status',jsobj.status);
				rec.setValue('custpage_iif_has_devices',jsobj.hasdevices);
				rec.setValue('custpage_iif_location',jsobj.location);
				if (jsobj.items.length > 0)
					rec.setValue('custpage_validation_iteminfo',jsobj.items[0]);
				else
					rec.setValue('custpage_validation_iteminfo','');
				rec.setValue('custpage_validation_deviceinfo',jsobj.devices);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}	
	function onGetDetailsInfoPromise() {
		console.log('IFFDETAILS');
		populateCommonVariables();
		showSubmitMessage("Check if the IFF has any devices");		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {	
					transid	: rec.getValue('custrecord_spr_validate_iff_internalid'),
              		requestType: 'IFFDETAILS'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				rec.setValue('custpage_validation_response',response.body);
				document.getElementById('custpage_to_ship_hardwareonly').disabled = false;
				document.getElementById('custpage_validate_device_iif_ship').disabled = false;
				var jsobj = JSON.parse(response.body);
				rec.setValue('custpage_iif_displayvalue',jsobj.transactiondetails);
				rec.setValue('custpage_iif_nspirestatus',jsobj.nspire_api_order_status);
				rec.setValue('custpage_iif_status',jsobj.status);
				rec.setValue('custpage_iif_has_devices',jsobj.hasdevices);
				rec.setValue('custpage_iif_location',jsobj.location);
				if (jsobj.items.length > 0)
					rec.setValue('custpage_validation_iteminfo',jsobj.items[0]);
				else
					rec.setValue('custpage_validation_iteminfo','');
				rec.setValue('custpage_validation_deviceinfo',jsobj.devices);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}	
	function onAlertOnNspireFailures() {
		console.log('onAlertOnNspireFailures');
		populateCommonVariables();
		showSubmitMessage("Send Notifcation of nspire Failures");		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {					
              		requestType: 'SENDFAILURENOTIFICATIONS'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: strTitle,
					message: "Response is : " + response.body
				});
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}	
	function pageInit(context) {  
		console.log('pageInit');
		rec = context.currentRecord;
	}
	return {
		onValidateSerial: onValidateSerial,
		onSingIFFUpdate: onSingIFFUpdate,
		onAlertOnNspireFailures : onAlertOnNspireFailures ,
		onGetDetailsInfo : onGetDetailsInfo,
		onPackToShipHW : onPackToShipHW,
		onPackToShipDevices : onPackToShipDevices,
		pageInit: pageInit
	};
});
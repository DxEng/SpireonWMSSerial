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
	function populateCommonVariables(){
		strTitle = 'Test Simulation';
		isShowAlert = true;
		suiteletUrl = url.resolveScript({
			scriptId          : 'customscript_spr_sl_testsimulator_engine',
			deploymentId      : 'customdeploy_spr_sl_testsimulator_engine',
			returnExternalUrl : false
		});
		rec = currentRecord.get();
	}
	function onGetJSONForSOId() {
		populateCommonVariables();
		console.log(rec.getValue('custrecord_spr_tstsim_soid'));		
		console.log('onGetJSONForSOId');
        var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Fulfillment Json for the Sales Order is getting created",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
	
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_soid'),
              		requestType: 'SOToFFJSON'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Fulfillment Json for the SO generated",
					message: "Fulfillment Json is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_ffid',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onCreateFFFromCSV() {
		console.log('onCreateFFFromCSV');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Fulfillment from SO",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_soid'),
					deviceCSV: rec.getValue('custrecord_spr_tstsim_fulfilreq'),
              		requestType: 'FFFROMSOWITHDEVICECSV'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Fulfillment create",
					message: "Fulfillment internal Id is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_ffid',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
		function onAppendSerailsToFFFromCSV() {
		console.log('onAppendSerailsToFFFromCSV');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Add missing Serials to FF",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
					deviceCSV: rec.getValue('custrecord_spr_tstsim_fulfilreq'),
              		requestType: 'APPENDDEVICES'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Append Devices TO Fulfillment",
					message: "Fulfillment internal Id is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_ffid',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}

	function onPopulateDeviceDatesForFF() {
		console.log('onPopulateDeviceDatesForFF');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Populate Device Dates for the Fulfillment Record.",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
              		requestType: 'POPULATEFFDEVICEDATES'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Test Simulation",
					message: "Device Dates for the Fulfillment Record are populated." 
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
	function onEmailInvoiceAndCSVByInvId() {
		console.log('onEmailInvoiceAndCSVByInvId');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Email for Invoice including csv",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_invid'), 
              		requestType: 'EMAILINVOICE'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Email sent with csv",
					message: "Message from Simulator " + response.body
				});
				//rec.setValue('custrecord_spr_tstsim_fulfilreq',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onGenerateBillForSO() {
		console.log('onGenerateBillForSO');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Bill from SO",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_soid'),
              		requestType: 'BILLLFROMSO'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Invoice create",
					message: "Invoice internal Id is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_invid',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onCreateFFFromSO() {
		console.log('onCreateFFFromSO');
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Fulfillment from SO",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_soid'),
              		requestType: 'FFFROMSO'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Fulfillment create",
					message: "Fulfillment internal Id is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_fulfilreq',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onCreateOBJsonInit() {
		populateCommonVariables();
		console.log('onCreateOBJsonInit');
		var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Outbound Init Request",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
              		requestType: 'OBINITJSON'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "Outbound Rest",
					message: "Outbound Json for Initial request is : " + response.body
				});
				rec.setValue('custrecord_spr_tstsim_ff_ob_init',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onGetJsonFindById() {
		console.log('onGetJsonFindById');
		
		populateCommonVariables();
		console.log(rec.getValue('custrecord_spr_tstsim_soid'));		
		console.log('onGetJSONForSOId');
        var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Outbound call is made to nspire",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
              		requestType: 'FINDBYID'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "fulfillment is submitted to nspire",
					message: "Response from nspire is : " + response.body
				});
				rec.setValue('custrecordcustrecord_spr_tstsim_response',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onSubmitOBToNSpire() {
		console.log('onSubmitOBToNSpire');
		
		populateCommonVariables();
		console.log(rec.getValue('custrecord_spr_tstsim_soid'));		
		console.log('onGetJSONForSOId');
        var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Outbound call is made to nspire",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
              		requestType: 'SUBMITOUTBOUND',
					JSONInput: rec.getValue('custrecord_spr_tstsim_ff_ob_init')
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "fulfillment is submitted to nspire",
					message: "Response from nspire is : " + response.body
				});
				rec.setValue('custrecordcustrecord_spr_tstsim_response',response.body);
				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onRetryWhole() {
		console.log('onRetryWhole');		
		populateCommonVariables();

        var mysubmitMsg = message.create({
        	title: "Test Simulation",
          	message: "Retry Whole to NSPIRE",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					transId	: rec.getValue('custrecord_spr_tstsim_ffid'),
              		requestType: 'RETRYWHOLE'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
				dialog.alert({
					title: "fulfillment is submitted to nspire",
					message: "Response from nspire is : " + response.body
				});
				rec.setValue('custrecordcustrecord_spr_tstsim_response',response.body);				
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onGenerateRetryJSON() {
		console.log('onGenerateRetryJSON');
		
		populateCommonVariables();
		
	}
	function onRetrySome() {
		console.log('onRetrySome');
		
		populateCommonVariables();
		
	}
	function pageInit(context) {  
		console.log('pageInit');
		rec = context.currentRecord;
	}
	return {
		onGetJSONForSOId: onGetJSONForSOId,
		onCreateFFFromCSV: onCreateFFFromCSV,
      	onAppendSerailsToFFFromCSV: onAppendSerailsToFFFromCSV,
		onPopulateDeviceDatesForFF: onPopulateDeviceDatesForFF,
		onEmailInvoiceAndCSVByInvId: onEmailInvoiceAndCSVByInvId,
		onCreateFFFromSO: onCreateFFFromSO,
		onCreateOBJsonInit: onCreateOBJsonInit,
		onGetJsonFindById: onGetJsonFindById,
		onSubmitOBToNSpire: onSubmitOBToNSpire,
		onRetryWhole: onRetryWhole,
		onGenerateRetryJSON: onGenerateRetryJSON,
		onRetrySome: onRetrySome,
		onGenerateBillForSO: onGenerateBillForSO,
		pageInit: pageInit
	};
});
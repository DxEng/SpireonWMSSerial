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

	/*
		Device Serial No	custrecord_spr_sb_test_dev_serialno	Free-Form Text	 	 	Yes
 	Factory	custrecord_spr_sb_test_dev_isfactory	Check Box	 	 	Yes
 	Already Used for FF transaction	custrecord_spr_sb_test_dev_isusedonff
	*/
  	var rec ;//saving current record in the pageInit

	
	var strTitle ;
	var isShowAlert;
    var suiteletUrl;
	function populateCommonVariabless(){
		strTitle = 'Create SB Test Device';
		isShowAlert = true;
		suiteletUrl = url.resolveScript({
			scriptId          : 'customscript_spr_sl_create_dev_nspire_ap',
			deploymentId      : 'customdeploy_spr_sl_create_dev_nspire_ap',
			returnExternalUrl : false
		});
		rec = currentRecord.get();
	}
	function onFillSerialFromAppConfig() {
		console.log('onFillSerialFromAppConfig');
		populateCommonVariabless();
        var mysubmitMsg = message.create({
        	title: strTitle,
          	message: "Retrive current Appconfig Device Serial and +1",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();	
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					devserialNo	: rec.getValue('custrecord_spr_tstsim_soid'),
              		requestType: 'GETSERIAL'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
			  if (isShowAlert){
				dialog.alert({
				title: strTitle,
				message: "Fulfillment Json is : " + response.body
				});
				rec.setValue('custrecord_spr_sb_test_dev_serialno',response.body);
				rec.setValue('custrecord_spr_sb_test_dev_name','Name_'+ response.body);
                rec.setValue('custrecord_spr_sb_test_dev_description','Desc_'+ response.body);
			  }
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});

	}
	function onCreateDeviceFactory() {
		populateCommonVariabless();
		console.log('onCreateDeviceFactory');
        var mysubmitMsg = message.create({
        	title: strTitle,
          	message: "Create a Factory Device",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					devserialNo	: rec.getValue('custrecord_spr_sb_test_dev_serialno'),
					inputDevName	: rec.getValue('custrecord_spr_sb_test_dev_name'),
					devserialDescription	: rec.getValue('custrecord_spr_sb_test_dev_description'),
              		requestType: 'CREATENONFACTORY'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
			  if (isShowAlert){
				dialog.alert({
				title: strTitle,
				message: "Created a Factory Device : " + response.body
				});
				//rec.setValue('custrecord_spr_sb_test_dev_isfactory',true);
				var responseJSONObj = JSON.parse(response.body);
				rec.setValue('custrecord_spr_sb_test_dev_nspiredevid',responseJSONObj.id);
				rec.setValue('custrecord_spr_sb_test_dev_isfactory',true);
			  }
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onCreateDeviceNonFactory() {
		populateCommonVariabless();	
		console.log('onCreateDeviceNonFactory');
        var mysubmitMsg = message.create({
        	title: strTitle,
          	message: "Create a Non-Factory Device",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();

		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					devserialNo	: rec.getValue('custrecord_spr_sb_test_dev_serialno'),
					inputDevName	: rec.getValue('custrecord_spr_sb_test_dev_name'),
					devserialDescription	: rec.getValue('custrecord_spr_sb_test_dev_description'),
              		requestType: 'CREATENONFACTORY'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
			  if (isShowAlert){
				dialog.alert({
				title: strTitle,
				message: "Created a Factory Device : " + response.body
				});
				//rec.setValue('custrecord_spr_sb_test_dev_isfactory',true);
				var responseJSONObj = JSON.parse(response.body);
				rec.setValue('custrecord_spr_sb_test_dev_nspiredevid',responseJSONObj.id);
			  }
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onMoveDeviceToFactory() {
		populateCommonVariabless();	
		console.log('onMoveDeviceToFactory');
        var mysubmitMsg = message.create({
        	title: strTitle,
          	message: "Move Device To Factory",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					devserialId	: rec.getValue('custrecord_spr_sb_test_dev_nspiredevid'),
              		requestType: 'MOVENONFACTORYTOFACTORY'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
			  if (isShowAlert){
				dialog.alert({
				title: strTitle,
				message: "Bulk Devices : " + response.body
				});
				rec.setValue('custrecord_spr_sb_test_dev_isfactory',true);
			  }
			})
			.catch(function onRejected(reason) {
              mysubmitMsg.hide();
				log.debug({
					title: 'Invalid Request: ',
					details: reason
				});
		});
	}
	function onBulkCreateDevicesFactory() {
		populateCommonVariabless();	
		strTitle = 'Bulk Create Dvices';
		console.log('onMoveDeviceToFactory');
        var mysubmitMsg = message.create({
        	title: strTitle,
          	message: "Bulk Device creation can take time",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		
		
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					qty: rec.getValue('custrecord_spr_blk_dev_qty'),
					useAppConfig: rec.getValue('custrecord_spr_blk_dev_useappconfig'),
					prefix: rec.getValue('custrecord_spr_blk_dev_prefix'),
					sequence : rec.getValue('custrecord_spr_blk_dev_seq'),
					length: rec.getValue('custrecord_spr_blk_dev_length'),
              		requestType: 'BULKDEVICECREATE'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
			  console.log(response);
			  if (isShowAlert){
				dialog.alert({
				title: strTitle,
				message: "DEvices are created for Factory: " + response.body
				});
				rec.setValue('custrecord_spr_blk_dev_output',response.body);
			  }
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
	}
	return {
		onFillSerialFromAppConfig: onFillSerialFromAppConfig,
		onCreateDeviceFactory: onCreateDeviceFactory,
		onCreateDeviceNonFactory: onCreateDeviceNonFactory,
		onMoveDeviceToFactory: onMoveDeviceToFactory,
		onBulkCreateDevicesFactory: onBulkCreateDevicesFactory,
		pageInit: pageInit
	};
});
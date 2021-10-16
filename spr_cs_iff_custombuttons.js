 /**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * Author: Sathish
 * Created: 10/13/2021
 */ 
 
define(['N/runtime', 'N/https', 'N/url','N/ui/dialog','N/ui/message','N/currentRecord'],
/**
 * @param {runtime} runtime
 * @param {https} https
 * @param {url} url
 */
	
function(runtime, https, url,dialog,message,currentRecord) {
	
  	var rec ;
	var strTitle ;
	var isShowAlert;
    var suiteletUrl;
	function populateCommonVariables(){		
		suiteletUrl = url.resolveScript({
			scriptId          : 'customscript_spr_sl_iff_revalidate_dev',
			deploymentId      : 'customdeploy_spr_sl_iff_revalidate_dev',
			returnExternalUrl : false
		});
		rec = currentRecord.get();
	}
	function onValidateIFFAgain() {
		populateCommonVariables();
		document.location=suiteletUrl+'&custpage_requesttype=REVALIDATE&custpage_iff_id='+ rec.getValue('id');				
	}
	function onIgnoreValidationOnIFFMarkShipped() {
		let options = {
			title: 'Confirm Ignore Validations',
			message: 'Press OK to Ignore validations and change the item fulfillment to Shipped or Cancel'
		};
		dialog.confirm(options).then(success).catch(failure);				
	}	
    function success(result) {
		if(result){
			populateCommonVariables();
			document.location=suiteletUrl+'&custpage_requesttype=IGNOREVALIDATION&custpage_iff_id='+ rec.getValue('id');	
		}
    }
    function failure(reason) {
        console.log('Failure: ' + reason);
    }  	
	function pageInit(context) {  
		console.log('pageInit');
		rec = context.currentRecord;
	}
	function onShowDeviceCount(){
		populateCommonVariables();
		var mysubmitMsg = message.create({
        	title: "Item Fullfillment - " + rec.getValue('id'),
          	message: "Getting Device Count",
        	type: message.Type.INFORMATION
    	});
      	mysubmitMsg.show();
		/*
		let devCount = rec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" });
		dialog.alert({
				title: "Item Fullfillment - " + rec.getValue('id') ,
				message: "Device Count is: " + devCount
			});
		*/
		var response = https.post.promise({
			url: suiteletUrl,
			body : {
					custpage_iff_id	: rec.getValue('id'),
              		custpage_requesttype: 'DEVICECOUNT'
				}
			})
			.then(function(response){
				mysubmitMsg.hide();
				console.log(response);
				dialog.alert({
					title: "Item Fullfillment - " +rec.getValue('id'),
					message: "Device Quantity is : " + response.body
				});
			
			})
			.catch(function onRejected(reason) {
				mysubmitMsg.hide();
				console.log(reason);
		});

	}
	return {
		onValidateIFFAgain: onValidateIFFAgain,
		onIgnoreValidationOnIFFMarkShipped: onIgnoreValidationOnIFFMarkShipped,
		onShowDeviceCount: onShowDeviceCount,
		pageInit: pageInit
	};
});
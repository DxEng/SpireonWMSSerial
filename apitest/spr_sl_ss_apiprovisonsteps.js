/**
 * spr_sl_ss_apiprovisonsteps.js
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Author: Sathish
 * Created: 06/01/2021
 */


define(['N/https','SuiteScripts/SpireonWMSSerial/spr_util_shipconfirmvalidations'],
function(https,apitestutil){
    var url_DeviseProvision = 'https://deviceprovisioningservice-stage.spireon.com/rest/deviceProvisioningOrders';
	var url_identitytoken = 'https://identity-stage.spireon.com/identity/token';
	function execute(context){
		var request  = context.request;
		var strReponse = '';
		var requestType = request.parameters.requestType;
		var transactionId = request.parameters.transid;
		if ( requestType =='DEVICEVALIDATION'){
			var deviceSerial = request.parameters.deviceSerial;
			if ( deviceSerial.length <12){
				strReponse = 'Invalid Device Serial length -  Minimum length is 12.\n';
			}
			else{
				if (!deviceSerial.match(/^[0-9a-zA-Z]+$/)){
					strReponse = strReponse + 'Invalid Device Serial - Only alpha numeric data is accepted.';
				}
				if (!deviceSerial.match(/^[ABW]/)){
					strReponse = strReponse + 'Invalid Device Serial - Valid First Characters are A,B and W';
				}
				if( (strReponse.length ==0 ) && (deviceSerial.match(/^[AB]/)) && (deviceSerial.length != 12 )){
					strReponse = strReponse + 'With A/B start, the device serial length should be 12';
				}
				if( (strReponse.length ==0 ) && (deviceSerial.match(/^[W]/)) && (deviceSerial.length != 13 )){
					strReponse = strReponse + 'With W start, the device serial length should be 13';
				}
			}
			if ( strReponse.length ==0)
				strReponse ='Device Seriaal is seems correct based on validation rules.';
		}
		if ( requestType =='HWONLYPACKTOSHIP'){			
			strReponse = apitestutil.updateSCNonSerializedIFFPackToShip();
		}
		if ( requestType =='PACKTOSHIPDEVICES'){
			strReponse = apitestutil.validateAndAlertEmailSCSerializedIFFAndPackToShip();
		}
		if ( requestType =='SENDFAILURENOTIFICATIONS'){	
			strReponse = apitestutil.sendAlertForFailedProvisions();				
		} 
		context.response.write(strReponse); 
	}
	
	
	return{
		onRequest: function (context) {
			var request  = context.request;         
			execute(context);
			log.debug({title: 'Device Validation',details: 'Finished Executing'});
		}
	};

});

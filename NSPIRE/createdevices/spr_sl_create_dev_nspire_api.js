/**
 * spr_sl_create_dev_nspire_api.js
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * Author: Sathish
 * Created: 06/01/2021
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/format','N/https','N/encode'],
function(search, record, log, runtime, error, format,https,encode){
	var sessionjwttoken = '';
	var url_identitytoken = 'https://identity-stage.spireon.com/identity/token'; // This is same url, but as it is not applicable in produciton it is hard corded here as device creation is specific to sandbox (some times release preview).
	var url_DeviceCreation = 'https://platformapi-stage.spireon.com/v0/rest/internal/devices'; //if the scope increase from sandbox, may be moving this into app config makes sense, or if these are changing time to time instead of static. 
	function execute(context){
		var JSONstring;		
		var request  = context.request;
		if ( request.parameters.requestType == 'BULKDEVICECREATE'){
			log.debug(request.parameters.qty);            
			var useAppConfig = request.parameters.useAppConfig;
			var inputPrefix = request.parameters.prefix;
			var inputLength = request.parameters.length;
			var inputSeq = request.parameters.sequence;
			if ( request.parameters.qty > 20)			
				JSONstring = bulkCreateSerialProvisionOnly(request.parameters.qty,useAppConfig, inputPrefix, inputSeq, inputLength);
			else
				JSONstring = bulkCreateSerial(request.parameters.qty,useAppConfig, inputPrefix, inputSeq, inputLength);	
		}	
		else{
			
			var inputDevSerail = request.parameters.devserialNo;
			var inputNspireDevId = request.parameters.devserialId;
			var inputDevName = request.parameters.devserialName;
			var inputDevDescription = request.parameters.devserialDescription;
			var requestType = request.parameters.requestType;
			log.debug(request.parameters.GETSERIAL);
			var jsonStringReq = request.parameters.JSONInput;
			var JSONstring;
			log.debug({title: 'NS Device Creation',details: "requestType -  "+requestType});
			log.debug({title: 'NS Device Creation',details: "inputDevSerail -  "+inputDevSerail});	
			log.debug({title: 'NS Device Creation',details: "inputNspireDevId -  "+inputNspireDevId});	
			log.debug({title: 'NS Device Creation',details: "inputDevName -  "+inputDevName});	
			log.debug({title: 'NS Device Creation',details: "inputDevDescription -  "+inputDevDescription});	
			if ( requestType == 'GETSERIAL'){
				JSONstring = getSerialFromAppConfig();			
			}		
			if ( requestType == 'CREATENONFACTORY'){
				JSONstring = createNonFactory(inputDevSerail,inputDevName,inputDevDescription);
			}
			if ( requestType == 'CREATEFACTORY'){
				JSONstring = createNonFactory(inputDevSerail,inputDevName,inputDevDescription);
				var nspireRespone = JSON.parse(JSONstring);
				JSONstring = moveToFactory(nspireRespone.id);			
			}
			if(requestType == 'MOVENONFACTORYTOFACTORY'){
				JSONstring = moveToFactory(inputNspireDevId);		
			}
		}
	  //log.debug(JSONstring);	
	  log.debug({title: 'RequestType:'+requestType,details: 'return JSONstring: ' + JSONstring});
      context.response.write(JSONstring); 
	} 
	function createNonFactory(devSerial, devName, devDesc){
		var data = '';
		data = '{"serialNumber": "' + devSerial + '", "name": "' + devName + '","description": "' + devDesc + '"}'
		log.debug({title: 'createNonFactory',details: data});
		var headers = [];
		headers['Content-Type'] = 'application/json';
		headers['Accept'] = '*/*';
		headers['Content-Length']  = data.length;
		headers['Authorization'] = 'Bearer ' + getNSPIREDevCreateJWTToken();

		var response = https.post({
			url: url_DeviceCreation,
			body: data,
			headers: headers
			});
		return response.body;		
	}
	function moveToFactory(devSerialNspireId){
		var data = '';
		data = '{"id": "' + devSerialNspireId + '", "accountId": "13954327291859ZYOSOX"}'
		log.debug({title: 'MOVENONFACTORYTOFACTORY',details: data});
		var headers = [];
		headers['Content-Type'] = 'application/json';
		headers['Accept'] = '*/*';
		headers['Content-Length']  = data.length;
		headers['Authorization'] = 'Bearer ' + getNSPIREDevCreateJWTToken();

		var response = https.put({
			url: url_DeviceCreation+devSerialNspireId,
			body: data,
			headers: headers
			});
		return response.body;		
	}
	function bulkCreateSerialProvisionOnly(qty, useAppConfig, userinputPrefix, userinputstartSeq, userinputLength ){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var newSeq = 0;
		var sprDevSerials = "";
		var localJSON = "";
		log.audit({title:'bulkCreateSerialProvisionOnly', details: 'qty is: ' + qty});
		if (  useAppConfig == 'false'){
			serialCurrentSeq = userinputstartSeq;
			serialPrefix = userinputPrefix;
			serialLength = userinputLength;
			serialAutoIncrementFlag = false;
		}
		else{
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
		}
		
		var provQty = 20;
		if ( qty > 20){
			for (var outer_i = 0; outer_i < qty ; outer_i = outer_i+20){
				if ( (qty  - outer_i) <20)
					provQty = qty  - outer_i;
				log.debug(provQty); 
				log.audit('newSeq - ' + newSeq);
				var script = runtime.getCurrentScript();
				log.audit({
					"title": "Governance Monitoring",
					"details": "Remaining Usage = " + script.getRemainingUsage()
				});

				for(var i = 0; i < provQty; i++) {
					var serailValue = serialPrefix+ FormatNumberLength( serialCurrentSeq+newSeq,serialLength-serialPrefix.length );
					newSeq++;
					localJSON = createNonFactory(serailValue,'Name_' + serailValue,'Desc_'+serailValue);
					var nspireRespone = JSON.parse(localJSON);
					localJSON = moveToFactory(nspireRespone.id);					
					
					if ( i >0)
						sprDevSerials = sprDevSerials+',';
					sprDevSerials = sprDevSerials + serailValue;
				}

			}
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
		return sprDevSerials;
		
	}
	function bulkCreateSerial(qty, useAppConfig, userinputPrefix, userinputstartSeq, userinputLength ){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var newSeq = 0;
		var sprDevSerials = "";
		var localJSON = "";
		if (  useAppConfig == 'false'){
			serialCurrentSeq = userinputstartSeq;
			serialPrefix = userinputPrefix;
			serialLength = userinputLength;
			serialAutoIncrementFlag = false;
		}
		else{
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
		}
		for(var i = 0; i < qty; i++) {
			var serailValue = serialPrefix+ FormatNumberLength( serialCurrentSeq+i,serialLength-serialPrefix.length );
			newSeq++;
			localJSON = createNonFactory(serailValue,'Name_' + serailValue,'Desc_'+serailValue);
			var nspireRespone = JSON.parse(localJSON);
			localJSON = moveToFactory(nspireRespone.id);	
			var objRecord = record.create({
				type: 'customrecord_spr_sb_test_dev_serial'	
			});
			objRecord.setValue('custrecord_spr_sb_test_dev_serialno',serailValue);
			objRecord.setValue('custrecord_spr_sb_test_dev_name','Name_' + serailValue);
			objRecord.setValue('custrecord_spr_sb_test_dev_description','Desc_'+serailValue);
			objRecord.setValue('custrecord_spr_sb_test_dev_nspiredevid',nspireRespone.id);
			objRecord.setValue('custrecord_spr_sb_test_dev_isfactory',true);
			var recid = objRecord.save();
			if ( i >0)
				sprDevSerials = sprDevSerials+',';
			sprDevSerials = sprDevSerials + serailValue;
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
		return sprDevSerials;
		
	}
	function getSerialFromAppConfig(){
		var serialCurrentSeq;
		var serialAutoIncrementFlag = true;
		var serialPrefix;
		var serialLength;
		var devSerial;
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
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialLength'){
					serialLength = parseInt(result[i].getValue('custrecord_spr_cust_app_config_value'));
				}
				if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialPrefix'){
					serialPrefix = result[i].getValue('custrecord_spr_cust_app_config_value');
				}
			}
			devSerial = serialPrefix+ FormatNumberLength( serialCurrentSeq+1,serialLength-serialPrefix.length ) ;
			if(serialAutoIncrementFlag)
			{
				var recid = record.submitFields({
							  type: 'customrecord_spr_cust_app_config',
							  id: 8,
							  values: {
								  'custrecord_spr_cust_app_config_value':  serialCurrentSeq+ 1
							  },
							  options: {
								  enableSourcing: false,
								  ignoreMandatoryFields : true
							  }
							}); 
			}
			return devSerial;
	}

	function getNSPIREDevCreateJWTToken(){
		if ( sessionjwttoken != '')
			return sessionjwttoken;
		log.debug('inside - getNSPIREDevCreateJWTToken');
		var apptoken;
		var jwttoken='';
		var authenticationDetails;
		var jwttokenRefreshTime;
		var mySearch = search.create({
			type: 'customrecord_spr_cust_app_config',
			columns: ['custrecord_spr_cust_app_config_key','custrecord_spr_cust_app_config_value'],
			filters: ['custrecord_spr_cust_app_config_key','startswith','nsp_dev_create_']
			});

		var result = mySearch.run().getRange(0, 20);
		for (var i = 0; i < result.length; i++) {
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nsp_dev_create_apptoken'){
				apptoken = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nsp_dev_create_auth'){
				authenticationDetails = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nsp_dev_create_jwt_refreshtime'){
				jwttokenRefreshTime = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='nsp_dev_create_jwt_token'){
				jwttoken = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
		}
		if ( jwttoken != '' && jwttokenRefreshTime != ''){
			//Check if the current time passed refreshed time
			var currentDateTime = new Date();
			if (jwttokenRefreshTime.length ==20){ // ISO time without milli seconds is not getting recognized in NS
				jwttokenRefreshTime = jwttokenRefreshTime.replace('Z','.000Z');
				var refreshDateTime = new Date(jwttokenRefreshTime);
				if( ( refreshDateTime - currentDateTime ) <0)
					jwttoken = ''; // token expired
			}
		}
		
		if ( jwttoken == ''){
			jwttoken = refreshAndSaveDevCreateJWTToken(authenticationDetails,apptoken);
		}
		sessionjwttoken = jwttoken;
		return jwttoken;
	}
	function refreshAndSaveDevCreateJWTToken(authcred,apptoken){
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
		headers['x-nspire-apptoken'] = apptoken;
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
					  id: 14,
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
					  id: 15,
					  values: {
						  'custrecord_spr_cust_app_config_value':  tokenResponse.refreshBy
					  },
					  options: {
						  enableSourcing: false,
						  ignoreMandatoryFields : true
					  }
					}); 
		log.debug('end of - refreshAndSaveDevCreateJWTToken');
		return tokenResponse.token;
	}

	function FormatNumberLength(num, length) {
		var r = "" + num;
		while (r.length < length) {
			r = "0" + r;
		}
		return r;
	} 

	return{
		onRequest: function (context) {
			var request  = context.request;         
			execute(context);
			log.debug({title: 'SandBox Test Device Creation',details: 'Finished Executing'});
		}
	};

});
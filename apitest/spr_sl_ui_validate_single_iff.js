/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

define( [ 'N/ui/serverWidget','N/url','N/runtime','SuiteScripts/DevLibrary/Spireon-Utils','N/record', 'N/query' ], main );


function main( serverWidget, url,runtime,Utils,record, query ) {

	var scriptURL
    return {
    
    	onRequest: function( context ) {     
    	
			scriptURL = url.resolveScript( { scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId, returnExternalURL: false } ); 
			if (context.request.method === 'GET') {				
				context.response.writePage(createFrom(context));

			} else if (context.request.method === 'POST') {
				var request  = context.request;
				log.debug({title: request.method ,details: 'Type of request'});
				log.debug({title: request.method ,details: request.parameters.custrecord_spr_validate_iff_internalid});
				context.response.writePage(createFrom(context));
			}
								
        }
        
    }
	function createFrom(context){
		let request  = context.request;
		let isValidIFF = false;
		let isValidIFFPacked = false;
		let isIdemQtyDeviceQtyMatch = true;
		let deviceQty = 0;
		let isPost = false;
		let hasDevices = false;
		let strQuery;
		let results;
		let internalId, transInfo, nspireStatus, iffStatus,  location;
		let iffid = request.parameters.custrecord_spr_validate_iff_internalid;
		let isUpdateAlso = false;
      	let isPacked = false;

		if (request.method === 'POST' && iffid != undefined){
			isPost = true;
			if ( request.parameters.custrecord_spr_update_iff == 'T')
				isUpdateAlso = true;
			
			strQuery = String.format("select distinct id from  transaction t  where id ={0} and recordtype = 'itemfulfillment'",iffid); 
			results = query.runSuiteQL({
				query: strQuery
			});
			if ( results.results.length > 0){
				isValidIFF = true;
				strQuery = "select distinct T.id InternalId,BUILTIN.DF(T.id) ,BUILTIN.DF(t.status),custbody_spr_nspire_api_order_status, CASE WHEN A.id is null THEN 'F' ELSE 'T' END as hasDevices,BUILTIN.DF(tl.location),T.status  " +
								"from  transaction t inner join transactionLine tl on t.id = tl.transaction " +
								"inner join item i on tl.item = i.id  " +
								"left join ( select distinct T.id from  transaction t inner join transactionLine tl on t.id = tl.transaction  " +
								"inner join item i on tl.item = i.id   and i.custitem_spireonserialized = 'T' and t.recordtype = 'itemfulfillment' ) A  on T.id = A.id ";
				if(isUpdateAlso)
					strQuery = strQuery + "and T.status = 'B' ";
				strQuery = strQuery + String.format("WHERE  T.id = {0} ",iffid);
				if(isUpdateAlso)
					strQuery = strQuery + "and T.custbody_spr_nspire_api_order_status = 'IN PROCESS' ";
				log.debug({title: 'IFF Single(Dev)' ,details: strQuery});
				results = query.runSuiteQL({
					query: strQuery
				});
				let lineCount = results.results.length;
				log.debug({title: 'IFF Single(Dev)' ,details: 'total records - ' + lineCount});
				for(let loop_i = 0; loop_i < lineCount; loop_i++) {
					internalId = results.results[loop_i].values[0];
					transInfo = results.results[loop_i].values[1];
					iffStatus = results.results[loop_i].values[2];
					nspireStatus = results.results[loop_i].values[3];					
					if ( results.results[loop_i].values[4] == 'T')
						hasDevices = true;
					location = results.results[loop_i].values[5];		
                  	if ( results.results[loop_i].values[6] == 'B'){
                  		isPacked = true;
						isValidIFFPacked = true;
					}
				}
              	log.debug({title: 'IFF Single(Dev)' ,details: 'Is Packed - ' + isPacked});
			}
		}
		
		var form = serverWidget.createForm({ title: 'Validate Single Fulfillment' });
		form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/apitest/spr_cs_nspireapi_ph.js";
		form.addSubmitButton({
			id: 'custpage_validate_has_devices',
			label: 'Run NS Validation Rules'
		});
		/*
		var btnHardware = form.addButton({
			id: 'custpage_to_ship_hardwareonly',
			label: 'Pack To Ship Hardware Only',
			functionName: 'onIFFHasDevices'
		});
		btnHardware.isDisabled = true;
		if( isValidIFF && !hasDevices)
			btnHardware.isDisabled = false;
		var btnDevices = form.addButton({
			id: 'custpage_validate_device_iif_ship',
			label: 'Pack To Ship With Devices',
			functionName: 'onIFFHasDevices'
		});
		btnDevices.isDisabled = true;
		if( isValidIFF && hasDevices)
			btnDevices.isDisabled = false;
		
		form.addButton({
			id: 'custpage_update_with_ns_rules',
			label: 'Update with NS V Rules',
			functionName: 'onSingIFFUpdate'
		});
		*/
		var fieldgroup = form.addFieldGroup({
			id : 'iffInfoGroupId',
			label : 'Item Fulfillment Info'
		});
		var field = form.addField({
			id: 'custrecord_spr_validate_iff_internalid',
			label: 'Item Fulfillment Internal Id',
			type: serverWidget.FieldType.TEXT,
			container : 'iffInfoGroupId'
		});
		if(iffid != undefined)
			field.defaultValue =  iffid;
		var field = form.addField({
			id: 'custrecord_spr_update_iff',
			label: 'Update Item Fulfillment with validation Rules (PACKED & IN PROCESS -> Ship)',
			type: serverWidget.FieldType.CHECKBOX,
			container : 'iffInfoGroupId'
		});

		var field = form.addField({
			id: 'custrecord_spr_validate_iff_url',
			label: 'url',
			type: serverWidget.FieldType.TEXT,
			container : 'iffInfoGroupId'
		});
		field.defaultValue =  scriptURL;
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});
		var field = form.addField({
			id: 'custrecord_spr_requesttype',
			label: 'requesttype',
			type: serverWidget.FieldType.TEXT,
			container : 'iffInfoGroupId'
		});
		field.defaultValue =  'RUN';
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});
		field.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
        });
		var fieldgroup = form.addFieldGroup({
			id : 'iifDetailsGrpId',
			label : 'Item Fulfillment Details'
		});
		var field = form.addField({
			id : 'custpage_iif_displayvalue',
			type : serverWidget.FieldType.TEXT,
			label : 'Item Fulfillment (internal Id)',
			container : 'iifDetailsGrpId'
		});
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		if( isValidIFF){
			field.defaultValue =  internalId;
			var scheme = 'https://';
			var host = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});
			var relativePath  = url.resolveRecord({
				recordType: record.Type.ITEM_FULFILLMENT,
				recordId: internalId,
				isEditMode: false
			});
			var field = form.addField({
				id : 'custpage_record_url',
				type : serverWidget.FieldType.URL,
				label : 'URL'
			});
			field.defaultValue =  scheme + host + relativePath;
			field.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.INLINE
			});
		}
		var field = form.addField({
			id : 'custpage_iif_transinfo',
			type : serverWidget.FieldType.TEXT,
			label : 'Item Fulfillment',
			container : 'iifDetailsGrpId'
		});
		if( isValidIFF)
			field.defaultValue =  transInfo;
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		
		
		
		var nspirestatusfield = form.addField({
			id : 'custpage_iif_nspirestatus',
			type : serverWidget.FieldType.TEXT,
			label : 'nspire status',
			container : 'iifDetailsGrpId'
		});
		if( isValidIFF)
			nspirestatusfield.defaultValue =  nspireStatus;
		nspirestatusfield.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		var iifstatusfield = form.addField({
			id : 'custpage_iif_status',
			type : serverWidget.FieldType.TEXT,
			label : 'status',
			container : 'iifDetailsGrpId'
		});
		if( isValidIFF)
			iifstatusfield.defaultValue =  iffStatus;
		iifstatusfield.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		var field = form.addField({
			id : 'custpage_iif_has_devices',
			type : serverWidget.FieldType.TEXT,
			label : 'has devices',
			container : 'iifDetailsGrpId'
		});
		if( isValidIFF)
			field.defaultValue =  hasDevices;
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		var field = form.addField({
			id : 'custpage_iif_location',
			type : serverWidget.FieldType.TEXT,
			label : 'location',
			container : 'iifDetailsGrpId'
		});
		if( isValidIFF)
			field.defaultValue =  location;
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		var field = form.addField({
			id : 'custpage_validation_response',
			type : serverWidget.FieldType.TEXTAREA,
			label : 'Response',
			container : 'iifDetailsGrpId'
		});
		if (isPost && !isValidIFF)
			field.defaultValue =  'Invalid Item Fulfillment InternalId';
		field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		
		
		if (hasDevices){
			var itemSubList = form.addSublist({
				id : 'itemlist',
				type : serverWidget.SublistType.LIST,
				label : 'Items'
			});
			itemSubList.addField({
				id : 'col1',
				type : serverWidget.FieldType.TEXT,
				label : 'IFF Internal ID'
				});

			itemSubList.addField({
				id : 'col2',
				type : serverWidget.FieldType.TEXT,
				label : 'Item'
				});

			itemSubList.addField({
				id : 'col3',
				type : serverWidget.FieldType.TEXT,
				label : 'Item Qty'
				});
			itemSubList.addField({
				id : 'col4',
				type : serverWidget.FieldType.TEXT,
				label : 'Device Count'
				});


			strQuery = "SELECT T.id InternalId, i.itemid, (-1) * tl.quantity as itemQuantity,  " +
					"( select  count(1) from customrecord_ssr_order_item_serialnum where custrecord_spr_srno_transno = T.id and custrecord_spr_srno_itemno = i.id)  deviceCount " +
					"FROM  transaction t inner join transactionLine tl on t.id = tl.transaction  " +
					"inner join item i on tl.item = i.id   " +
					"WHERE t.recordtype = 'itemfulfillment'  and  i.custitem_spireonserialized = 'T' and tl.custcol21 = 'T' ";
			strQuery = strQuery + String.format("and  T.id = {0} ",iffid);
			//has devices logic will coved the packed
			log.debug({title: 'Item Info' ,details: strQuery});
			results = query.runSuiteQL({
				query: strQuery
			});
			if ( results.results.length > 0)
			{
				
				for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
					itemSubList.setSublistValue({
						id: 'col1', line: loop_i, value: results.results[loop_i].values[0]
					});
					itemSubList.setSublistValue({
						id: 'col2', line: loop_i, value: results.results[loop_i].values[1]
					});
					itemSubList.setSublistValue({
						id: 'col3', line: loop_i, value: results.results[loop_i].values[2]
					});
					itemSubList.setSublistValue({
						id: 'col4', line: loop_i, value: results.results[loop_i].values[3]
					});
					if( results.results[loop_i].values[2] != results.results[loop_i].values[3] ){
						isIdemQtyDeviceQtyMatch = false;	
						deviceQty = results.results[loop_i].values[3];
					}						
				}
			}
			//Add Devices Info
			
			var deviceSubList = form.addSublist({
				id : 'devicelist',
				type : serverWidget.SublistType.LIST,
				label : 'Failed Serails'
			});
			deviceSubList.addField({
				id : 'serial',
				type : serverWidget.FieldType.TEXT,
				label : 'Serial'
				});

			deviceSubList.addField({
				id : 'error',
				type : serverWidget.FieldType.TEXT,
				label : 'Validation Message'
				});
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
				//if update  Load iif, and using key values, update the Device details or see if it makes sense to update just devices, but IIF nspire status need to be updated any way.
				//if no errors, but the devices have errors due to corrections not reflecting (may not matter)
				log.debug({title: 'Device Serial Validation' ,details: 'Inside after suiteQL - results' + results.results.length });
				let iffRec;
				if(isUpdateAlso){
					iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});										
				}
				for(let loop_i = 0; loop_i < results.results.length; loop_i++) {
					deviceSubList.setSublistValue({
						id: 'serial', line: loop_i, value: results.results[loop_i].values[0]
					});
					deviceSubList.setSublistValue({
						id: 'error', line: loop_i, value: results.results[loop_i].values[1]
					});		
					if(isUpdateAlso){
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
				}	
				if(isUpdateAlso){
					log.debug({title: 'Inside update of Errors',details: 'iffid - ' + iffid});
					iffRec.setValue('custbody_spr_nspire_api_order_status','FAILED(NS)');
					nspirestatusfield.defaultValue =  'FAILED(NS)';
					iffRec.save();
				}
			}
			else{
				if (isValidIFFPacked && hasDevices && isUpdateAlso && isIdemQtyDeviceQtyMatch)
				{
					let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});										
					iffRec.setValue('shipstatus','C');
					iffRec.save();
					iifstatusfield.defaultValue =  'Shipped';
				}
				else if( !isIdemQtyDeviceQtyMatch && isUpdateAlso){
					let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});	
										iffRec.setValue('custbody_spr_nspire_api_order_status','DEVICE QUANTITY MISMATCH('+deviceQty + ')');
					nspirestatusfield.defaultValue =  'DEVICE QUANTITY MISMATCH('+deviceQty + ')';
					iffRec.save();
				}
			}
		}
		if (isValidIFFPacked && !hasDevices && isUpdateAlso)
		{
			let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: iffid});										
			iffRec.setValue('shipstatus','C');
			iffRec.save();
			iifstatusfield.defaultValue =  'Shipped';
		}
		return form;
	}

}


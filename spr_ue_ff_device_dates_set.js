/**
 * @NApiVersion  2.0
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/format','N/ui/message'],
function(search, record, log, runtime, error, format,message){
   
    /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2021.1
     */
	const _LOTMPERFIX = 'LOTM0';	
	var  serviceItem = {
	  itemId: -1,
	  displayname: '',
	  salesdescription: '',
	  isLotManagedItem: false,
	  renewDate: '',
	  warrantyDate: ''
	};
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
				return
			}
        }

		
		if(ffrec.type == record.Type.ITEM_FULFILLMENT && ffrec.id > 0  && datePopulationApplicable){//ff record should have created
			var sotransid = ffrec.getValue('createdfrom');
			log.debug({title: 'FF beforeSubmit ',details: 'sotransid '+ sotransid});
			var sorec = record.load({type: record.Type.SALES_ORDER  , isDynamic: false, id: sotransid});
			var renewDate = '';
			var shipdate = sorec.getValue('shipdate');
            log.debug({title: 'FF beforeSubmit ',details: 'shipdate '+ shipdate});
			var warrantyDate = '';
			var revrec_enddate = '';
			populateServiceItemDetailsForSO(shipdate,sorec);
			var dslCount= ffrec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" }); //device serial line count
            log.debug({title: 'FF beforeSubmit ',details: 'dslCount '+ dslCount});
			var prevItemid = -1;
			for(var loop_i = 0; loop_i < dslCount; loop_i++) {
				//var sertransid = ffrec.getSublistValue({sublistId: "item", fieldId: "custrecord_spr_srno_transno", line:loop_i});
				//if ( sertransid > 0) //Can only some device serial records can be added? if not may be exit from this loop instead of checking for each
				//	continue; // if the device is not added first time, the device date calculations are not applicable
				var currentItemid = ffrec.getSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", fieldId: "custrecord_spr_srno_itemno", line:loop_i});
				log.debug({title: 'FF beforeSubmit ',details: 'currentItemid' + currentItemid});
				/*
				if ( prevItemid != currentItemid){
						var lineItem = search.lookupFields({
					type: search.Type.ITEM,
					id: itemid,
					columns: ['itemid', 'custitem_warrantydays'],
					});
					warrantyDate = shipdate;
					if(lineItem['custitem_warrantydays'] !== ''){
						warrantyDate.setDate(warrantyDate.getDate()+lineItem['custitem_warrantydays']);
					}
					else{
						warrantyDate.setDate(warrantyDate.getDate()+1095);
					}
				}
				*/
				
				if ( serviceItem.isLotManagedItem && serviceItem.warrantyDate == ''){
					log.debug({title: 'FF beforeSubmit ',details: 'set serviceItem.warrantyDate'});
					serviceItem.warrantyDate = getLotManagementWarrantyDate(shipdate,currentItemid, serviceItem.displayname,ffrec.getValue('entity'));
				}
              	if ( serviceItem.itemId == -1){ //no service item means default warranty date of 3 years.
					serviceItem.warrantyDate = new Date(shipdate.getFullYear(), shipdate.getMonth()+36 , shipdate.getDate());
				}
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_rendate", value: serviceItem.renewDate });
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_wardate", value: serviceItem.warrantyDate});
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_shipdate", value: shipdate});
				ffrec.setSublistValue({sublistId: "recmachcustrecord_spr_srno_transno", line: loop_i, fieldId: "custrecord_spr_srno_activedate", value: shipdate});
			}
		}
	}
	function populateServiceItemDetailsForSO(shipDate,sorec){
		var lineCount= sorec.getLineCount({ sublistId: "item" });
		for(var lineNum = 0; lineNum < lineCount; lineNum++) {
			var itemid = sorec.getSublistValue({sublistId: "item", fieldId: "item", line:lineNum});
			if ( isService(itemid)){
				var lineItem = search.lookupFields({
					type: search.Type.ITEM,
					id: itemid,
					columns: [ 'displayname']
				});
				serviceItem.displayname = lineItem.displayname;
		
				if (!isLotManageService(serviceItem.displayname)){
					serviceItem.isLotManagedItem = false;
					revrec_enddate = sorec.getSublistValue({sublistId: "item", fieldId: "revrecenddate", line:lineNum});	
                    log.debug({title: 'Inside populateServiceItemDetailsForSO ',details: 'revrec_enddate is: ' + revrec_enddate});
					if ( revrec_enddate !== ''){
						serviceItem.renewDate = revrec_enddate;
						serviceItem.warrantyDate = revrec_enddate;
					}
				}	
				else{
					serviceItem.renewDate = getLotManagementRenewDate(shipDate,serviceItem.displayname);
					serviceItem.isLotManagedItem = true;					
				}
				return;
			}
		}
				
	}
	function isLotManageService(itemName){
		//return itemName.toUpperCase().startsWith(_LOTMPERFIX);
		if( itemName.search(_LOTMPERFIX) > -1){
			return true;
		}	
		return false;		
	}
	function getLotManagementRenewDate(shipDate, itemName){
		var lotManagementMonths = parseInt( itemName.slice(itemName.length-2, itemName.length));
		var lmRenewDate = null;
		if (!isNaN(lotManagementMonths)){
			lmRenewDate = new Date(shipDate.getFullYear(), shipDate.getMonth()+lotManagementMonths , shipDate.getDate());
		}
		 //if some reason the item name is not followed the pattern what? for now renwDate = null;
			
		return lmRenewDate;
	}
	function getLotManagementWarrantyDate(shipDate, deviceItemId,serviceItemName, customerId){
		//For Kahu, the device is warrantied for 1 year for the dealer and the consumer is warrantied for the service term that they purchased but not to exceed 3 years.  Once the device is sold through to the consumer, the warranty date would need to be updated.
		//For GS, the wired device is warrantied for the term they purchased but not to exceed 3 years.  For the wireless device, the device is warrantied for the term purchased (always 3 years) with the exception that it is voided once the device is put into recovery mode.
		// Kahu means Kahu/lojack
		/*
		SM comment: For now all lot management products are code for 1 year warranty until logic of how  the device is identified Wired / wireless is confirmed.
		for now Tethered in description  - wired, untethered wireless 
		*/
		var isVF = false;
		var warrantyDate = '';
		isVF = isCustomerBelongsToVFClass(customerId );
		var isWireless = false;
		var gsMaxWiredDeviceWarranty = 36; // 36 monhts.
		var fdsMaxWiredDeviceWarranty = 12; // 12 monhts.
		if ( isVF && isWirelessDevice(deviceItemId)){
			warrantyDate = new Date(shipDate.getFullYear(), shipDate.getMonth()+gsMaxWiredDeviceWarranty , shipDate.getDate());			
		}
		else{
			var lotManagementMonths = parseInt( serviceItemName.slice(serviceItemName.length-2, serviceItemName.length));
			
			if ( isVF){
				if ( lotManagementMonths > gsMaxWiredDeviceWarranty)
					lotManagementMonths = maxWiredDeviceWarranty;
			}
			else{
				if ( lotManagementMonths > fdsMaxWiredDeviceWarranty)
					lotManagementMonths = fdsMaxWiredDeviceWarranty;				
			}
			warrantyDate = new Date(shipDate.getFullYear(), shipDate.getMonth()+lotManagementMonths , shipDate.getDate());
		}		
		return warrantyDate;
	}	
	function isService(itemID) {
		if ( itemID < 1)
			return false;
		var lineItem = search.lookupFields({
			type: search.Type.ITEM,
			id: itemID,
			columns: ['itemid', 'displayname','parent'],
		});
		log.debug(lineItem);
		var parentItemdesc = '';
		if( lineItem.parent.length >0)
			parentItemdesc = lineItem.parent[0].text;
		if(parentItemdesc.search(/service/i) >-1){
			log.debug('It is a service');
			return true;
		}
		return false;
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
	
   return {
      beforeSubmit : beforeSubmit
   };
});
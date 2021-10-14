/**
 * @NApiVersion  2.0
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/search', 'N/record'],
function(runtime, search, record) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
		if (scriptContext.type === scriptContext.UserEventType.VIEW)
        	return;
		var rec = scriptContext.newRecord;
		rec.setValue('custrecord_spr_blk_dev_useappconfig',true);
		
		var serialCurrentSeq;
		var serialPrefix;
		var serialBulkQty;
		var serialLength;
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
			if(result[i].getValue('custrecord_spr_cust_app_config_key') =='SerialBulkQty'){
				serialBulkQty = result[i].getValue('custrecord_spr_cust_app_config_value');
			}
		}
		rec.setValue('custrecord_spr_blk_dev_prefix',serialPrefix);
		rec.setValue('custrecord_spr_blk_dev_seq',serialCurrentSeq);
		rec.setValue('custrecord_spr_blk_dev_length',serialLength);      
		rec.setValue('custrecord_spr_blk_dev_qty',serialBulkQty);   
      
		var button = scriptContext.form.addButton({
            id: "custpage_createdevices_facoty",
            label: "Bulk Create Devices Factory" ,
            functionName: "onBulkCreateDevicesFactory()"
        });
		scriptContext.form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/NSPIRE/createdevices/spr_cs_create_dev_ph.js";
	}

   return {
      beforeLoad : beforeLoad
   };
});
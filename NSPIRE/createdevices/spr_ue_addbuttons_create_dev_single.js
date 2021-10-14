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
		
		var button = scriptContext.form.addButton({
            id: "custpage_fillserialfromappconfig",
            label: "Fill Serial From App Config" ,
            functionName: "onFillSerialFromAppConfig()"
        });
		
		var button = scriptContext.form.addButton({
            id: "custpage_createdevicefactory",
            label: "Create Device For Factory" ,
            isDisabled: true,
            functionName: "onCreateDeviceFactory()"
        });
		
		var button = scriptContext.form.addButton({
            id: "custpage_createdevicenonfactory",
            label: "Create Device For Non-Factory" ,
            functionName: "onCreateDeviceNonFactory()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_movedevicetofactory",
            label: "Move Device To Factory" ,
            functionName: "onMoveDeviceToFactory()"
        });
		scriptContext.form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/NSPIRE/createdevices/spr_cs_create_dev_ph.js";
	}

   return {
      beforeLoad : beforeLoad
   };
});
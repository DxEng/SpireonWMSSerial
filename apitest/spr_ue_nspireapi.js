/**
 * @NApiVersion  2.0
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/search', 'N/record','N/ui/serverWidget'],
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
            id: "custpage_validateserial",
            label: "#0 Validate Serial" ,
            functionName: "onValidateSerial()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_packtoship_onlynonserailitems",
            label: "#1 Pack To Ship (only with all items non-serialized)" ,
            functionName: "onUpdateOnlynNONSerialIFFtoShip()"
        });

		var button = scriptContext.form.addButton({
            id: "custpage_validate_alert_and_packtoship_boomi_iff",
            label: "#2 validate and alert and ship" ,
            functionName: "onValidatateandAlertAndShipSerialIFF()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_getprovisonstatus",
            label: "#3 Get Nspire Provison Status( old requests)" ,
            functionName: "onGetProvisionStatus()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_alertonnspirefailures",
            label: "#4 Alert nspire Failures(nspire failures)" ,
            functionName: "onAlertOnNspireFailures()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_populatedates",
            label: "#5 Populate Dates" ,
            functionName: "onPopulateDates()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_populatedates",
            label: "#6 Send Provision Request to nSpire(Initial)" ,
            functionName: "onSendProvisionToNSpire()"
        });

		scriptContext.form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/apitest/spr_cs_nspireapi_ph.js";
	}

   return {
      beforeLoad : beforeLoad
   };
});
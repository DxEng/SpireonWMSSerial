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
		/*
		var button = scriptContext.form.addButton({
            id: "custpage_getffjsonreq",
            label: "Get Fulfill Json Request" ,
            functionName: "onGetJSONForSOId()"
        });
		*/
		var button = scriptContext.form.addButton({
            id: "custpage_processffwithcsv",
            label: "Create FF using device CSV" ,
            functionName: "onCreateFFFromCSV()"
        });
		/*
		var button = scriptContext.form.addButton({
            id: "custpage_createff",
            label: "Create FF from SO (App Config)" ,
            functionName: "onCreateFFFromSO()"
        });
		*/
       var button = scriptContext.form.addButton({
            id: "custpage_addmissingserialstoFFFromCSV",
            label: "Append FF with additional Serials" ,
            functionName: "onAppendSerailsToFFFromCSV()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_populateDatesforFF",
            label: "Populate Device Dates for FF" ,
            functionName: "onPopulateDeviceDatesForFF()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_generatebill",
            label: "Generate Bill for SO" ,
            functionName: "onGenerateBillForSO()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_generate_ob_json_init",
            label: "Create OB JSON Request INIT" ,
            functionName: "onCreateOBJsonInit()"
        });
		 var button = scriptContext.form.addButton({
            id: "custpage_generate_ob_submit",
            label: "Submit OB JSON to NSPIRE (New Provision)" ,
            functionName: "onSubmitOBToNSpire()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_generate_ob_json_find",
            label: "NSPIRE result - Find by ID" ,
            functionName: "onGetJsonFindById()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_email_invoice_csv",
            label: "Email Invoice and csv" ,
            functionName: "onEmailInvoiceAndCSVByInvId()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_retry_whole",
            label: "NSPIRE Retry Whole" ,
            functionName: "onRetryWhole()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_generate_retry",
            label: "NSPIRE Generate Some Outbound JSON" ,
            functionName: "onGenerateRetryJSON()"
        });
		var button = scriptContext.form.addButton({
            id: "custpage_retry_some",
            label: "NSPIRE Retry Some" ,
            functionName: "onRetrySome()"
        });

		scriptContext.form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/testcode/spr_cs_testsimulator_promise_handler.js";
	}

   return {
      beforeLoad : beforeLoad
   };
});
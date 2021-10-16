/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

define( [ 'N/ui/serverWidget' ], main );


function main( serverWidget, urlModule ) {

	
    return {
    
    	onRequest: function( context ) {     
    	
			if (context.request.method === 'GET') {
				var form = serverWidget.createForm({ title: 'Device Serial Validator' });
				form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/apitest/spr_cs_nspireapi_ph.js";
				form.addButton({
					id: 'custpage_validate_serial',
					label: 'Validate Serial',
					functionName: 'onValidateSerial'
				});
				var fieldgroup = form.addFieldGroup({
					id : 'deviceInfoGroupId',
					label : 'Device Info'
				});
				form.addField({
					id: 'custrecord_spr_validate_devserial',
					label: 'Device Serial',
					type: serverWidget.FieldType.TEXT,
					container : 'deviceInfoGroupId'
				});
				
				var fieldgroup = form.addFieldGroup({
					id : 'validationRulesGroupId',
					label : 'Device Validation Rules'
				});
				var field = form.addField({
					id : 'custpage_fld_length',
					type : serverWidget.FieldType.TEXT,
					label : 'Device Fromat and length',
					container : 'validationRulesGroupId'
				});
				field.defaultValue =  '[AB] length - 12 or [W]13';
				field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
				var field = form.addField({
					id : 'custpage_validation_response',
					type : serverWidget.FieldType.TEXTAREA,
					label : 'Device Validation Result',
					container : 'validationRulesGroupId'
				});
				field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
		
				context.response.writePage(form);

			} else if (context.request.method === 'POST') {
				log.debug("Suitelet is posting.")
			}
								
        }
        
    }

}


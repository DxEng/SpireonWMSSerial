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
				var form = serverWidget.createForm({ title: 'Validate All Item Fulfillments' });
				form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/apitest/spr_cs_nspireapi_ph.js";
				form.addButton({
					id: 'custpage_get_nspire_status',
					label: 'Get Provision Status (last cycle)',
					functionName: 'onGetProvisionStatus()'
				});
				form.addButton({
					id: 'custpage_validate_serial',
					label: 'Notify nspire failures (all)',
					functionName: 'onAlertOnNspireFailures()'
				});
				form.addButton({
					id: 'custpage_pack_to_ship_hw_only',
					label: 'Pack To Ship HW Only',
					functionName: 'onPackToShipHW'
				});
				form.addButton({
					id: 'custpage_pack_to_ship_with_devices',
					label: 'Pack To Ship/Notify With Devices',
					functionName: 'onPackToShipDevices'
				});
				form.addButton({
					id: 'custpage_submit_initial',
					label: 'Submit to nspire for INITIAL',
					functionName: 'onAlertOnNspireFailures()'
				});
				var fieldgroup = form.addFieldGroup({
					id : 'iifDetailsGrpId',
					label : 'All Item Fulfillment Records'
				});
				var field = form.addField({
					id : 'custpage_all_iff_records',
					type : serverWidget.FieldType.TEXTAREA,
					label : 'Item fulfillments in Packed and IN PROCESS',
					container : 'iifDetailsGrpId'
				});
				field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
				var field = form.addField({
					id : 'custpage_iff_records_processed',
					type : serverWidget.FieldType.TEXTAREA,
					label : 'Item fulfillments Processed',
					container : 'iifDetailsGrpId'
				});
				field.updateDisplayType({displayType : serverWidget.FieldDisplayType.DISABLED});
				context.response.writePage(form);

			} else if (context.request.method === 'POST') {
				log.debug("Suitelet is posting.")
			}
								
        }
        
    }

}


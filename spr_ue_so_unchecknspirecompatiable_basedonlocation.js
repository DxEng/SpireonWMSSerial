/**
 * @NApiVersion  2.0
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/log'],
function( record, log){

   
    /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2021.1
     */

	function beforeSubmit(scriptContext) {
		log.debug({title: 'beforeSubmit Context ',details: scriptContext.type });
		var sorec = scriptContext.newRecord;
		log.debug({title: 'beforeSubmit Context ', details: 'SO internal ID -' +  sorec.getValue('transid') + ' location ' +  sorec.getValue('location') + ' nspire compatiable ' + sorec.getValue('custbodytrans_nspirecompatibleorder')});
      if (sorec.getValue('location') == 201 || sorec.getValue('location') == 202){
        sorec.setValue('custbodytrans_nspirecompatibleorder', false);
        sorec.setValue('tobeemailed', false);        
      }
	}

	function afterSubmit(scriptContext){
		log.debug({title: 'afterSubmit Context ',details: scriptContext.type });
        var sorec = scriptContext.newRecord;
		log.debug({title: 'afterSubmit Context ', details: 'SO internal ID -' +  sorec.getValue('transid') + ' location ' +  sorec.getValue('location') + ' nspire compatiable ' + sorec.getValue('custbodytrans_nspirecompatibleorder')});
	}
	
		
   return {
      beforeSubmit : beforeSubmit,
	  afterSubmit : afterSubmit
   };
});
	
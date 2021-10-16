/**
 * spr_sl_testsimulator_engine.js
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Author: Sathish
 * Created: 06/01/2021
 */
 
define(['N/redirect','N/record','SuiteScripts/SpireonWMSSerial/spr_util_shipconfirmvalidations' ],
function(redirect,record, iffvalidateutil){

	function execute(context){
		var request  = context.request; 
		var reqType = request.parameters['custpage_requesttype'];
		var transactionId = request.parameters['custpage_iff_id'];
		log.debug({title: 'Re-Validate',details: 'reqType :' +reqType });
		log.debug({title: 'Re-Validate',details: 'transactionId :' +transactionId });
		if ( reqType == 'REVALIDATE'){		
			iffvalidateutil.ValidateAndUpdate(transactionId,true);
		}
		if(reqType == 'IGNOREVALIDATION'){
			iffvalidateutil.saveIFF(transactionId,'C','IN PREOCESS');	
		}
		if(reqType == 'DEVICECOUNT'){
			let iffRec = record.load({type: record.Type.ITEM_FULFILLMENT  , isDynamic: false, id: transactionId});	
			let dslCount= iffRec.getLineCount({ sublistId: "recmachcustrecord_spr_srno_transno" });	
          	log.debug({title: 'Re-Validate',details: 'dslCount :' +dslCount });
          	context.response.write(" " + dslCount);
			return ;
		}
		redirect.toRecord({
            type: record.Type.ITEM_FULFILLMENT,
            id: transactionId
        });
	} 
	
	return{
		onRequest: function (context) {
			var request  = context.request;         
			execute(context);
			log.debug({title: 'Re-Validate',details: 'execute - In Re-Validate'});
		}
	};

});
/**
 * @NApiVersion  2.0
 * @NScriptType  UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/error', 'N/format','N/ui/message','N/email', 'N/render','N/file','N/query','SuiteScripts/DevLibrary/Spireon-Utils'],
function(search, record, log, runtime, error, format,message,email,render,file,query,Utils){
   
    /**
     * Function definition to be triggered before record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2021.1
     */
	const _InvoicesWithDeviceFolder = 22547627;// SB 22311180 PROD 22547627
	const _author = 5855344;
	const _LOGHEADER = 'Invoice UE CSV';
	function beforeSubmit(scriptContext) {
		log.debug({title: _LOGHEADER,details: 'beforeSubmit Context - ' + scriptContext.type });
		if (scriptContext.type != scriptContext.UserEventType.CREATE){
			return;
		}	
		var invrec = scriptContext.newRecord;
		try{
			log.debug({title: _LOGHEADER,details: 'subsidiary - ' + invrec.getValue('subsidiary') });
			if (invrec.getValue('subsidiary')=='3') //FAI subsidary no SO
				return;
			log.debug({title: _LOGHEADER,details: 'createdfrom - ' + invrec.getValue('createdfrom') });
			log.debug({title: _LOGHEADER,details: 'tranid - ' + invrec.getValue('tranid') });
			if(typeof (invrec.getValue('createdfrom')) === 'undefined'){
				log.audit({title: 'Invoice - beforeSubmit Context ',details: 'Invoice created from is undefined' });
				return;
			}
			if (invrec.getValue('createdfrom')=='') {//Created from shouldn't be blank
				log.audit({title: 'Invoice - beforeSubmit Context ',details: 'Invoice created from is blank' });
				return;
			}
			var strQuery = 'select distinct DEV.custrecord_spr_srno_devsrno from customrecord_ssr_order_item_serialnum DEV ';
			strQuery = strQuery + 'INNER JOIN Transaction  AS NT ON ( DEV.custrecord_spr_srno_transno = NT.ID)';
			strQuery = strQuery + 'INNER JOIN NextTransactionLineLink AS NTLL ON ( NT.ID = NTLL.NextDoc )';
			strQuery = strQuery + 'where  NTLL.PreviousDoc = ' + invrec.getValue('createdfrom');
			var results = query.runSuiteQL({
				query: strQuery
			});
			if( results.results.length > 0)
				invrec.setValue('tobeemailed', false); // If device serials are present, generate invoice standard way.
		}catch(e){
				log.error ({ title: e.name,details: e.message});
		}
	
	}
	function afterSubmit(scriptContext){
		log.debug({title: 'afterSubmit Context ',details: scriptContext.type });
		if (scriptContext.type != scriptContext.UserEventType.CREATE){
			return;
		}
		var invrec = scriptContext.newRecord;
		try{
			log.debug({title: _LOGHEADER,details: 'subsidiary - ' + invrec.getValue('subsidiary') });
			if (invrec.getValue('subsidiary')=='3') //FAI subsidary no SO
				return;
			log.debug({title: _LOGHEADER,details: 'createdfrom - ' + invrec.getValue('createdfrom') });
			log.debug({title: _LOGHEADER,details: 'tranid - ' + invrec.getValue('tranid') });
			if(typeof (invrec.getValue('createdfrom')) === 'undefined'){
				log.audit({title: 'Invoice - beforeSubmit Context ',details: 'Invoice created from is undefined' });
				return;
			}
			if (invrec.getValue('createdfrom')=='') {//Created from shouldn't be blank
				log.audit({title: 'Invoice - beforeSubmit Context ',details: 'Invoice created from is blank' });
				return;
			}
			if (invrec.getValue('email') == '')
				return; // if there is no email, don't run this script
			var strQuery = 'select distinct DEV.custrecord_spr_srno_devsrno from customrecord_ssr_order_item_serialnum DEV ';
			strQuery = strQuery + 'INNER JOIN Transaction  AS NT ON ( DEV.custrecord_spr_srno_transno = NT.ID)';
			strQuery = strQuery + 'INNER JOIN NextTransactionLineLink AS NTLL ON ( NT.ID = NTLL.NextDoc )';
			strQuery = strQuery + 'where  NTLL.PreviousDoc = ' + invrec.getValue('createdfrom');
			var results = query.runSuiteQL({
				query: strQuery
			});
			if( results.results.length == 0)
				return;

			var invid = invrec.id
			var time = new Date();
			var fileName = String.format('Invoice_{0}_{1}_{2}', invrec.getValue('tranid'), Utils.printDate(time, false, '-'), time.getTime());
			var pdfFileId = generateInvoicePDF(fileName + '.pdf', _InvoicesWithDeviceFolder, invrec); 
			var csvFileId = generateCSVDetails(fileName + '.csv', _InvoicesWithDeviceFolder, invrec, results ); 
			var pdfFile = file.load({id: pdfFileId});
			var csvFile = file.load({id: csvFileId});
			email.send({
				author: _author,
				recipients: invrec.getValue('email'), 
				subject: String.format('Spireon, Inc.: Invoice #{0}',invrec.getValue('tranid')),
				body: "Please open the attached file to view your Invoice.\n \n To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site http://www.adobe.com/products/acrobat/readstep.html to download it.",
				attachments: [pdfFile,csvFile],
				relatedRecords: {
					entityId: invrec.getValue('entity'),
					transactionId: invrec.id
				}
			});
		}catch(e){
				log.error ({ title: e.name,details: e.message});
		}
	}	
	function generateCSVDetails(fileName, folderId, _invoiceRecord,queryResultSet){
		var csvFile = file.create({
				name: fileName,
				fileType: file.Type.CSV,
				description: 'Invoice details for ' + _invoiceRecord.getText({fieldId: 'tranid'}),
				contents: '"Serial Number"\n'
			});
		var serialDevCount = queryResultSet.results.length ;
		for(var loop_i = 0; loop_i < serialDevCount; loop_i++) {
			csvFile.appendLine({value: queryResultSet.results[loop_i].values[0]});
		}
		csvFile.folder = folderId;
		return csvFile.save();
	}	
	function generateInvoicePDF(fileName, folderId, _invoiceRecord) 
	{
		var pdfFile = render.transaction({
            entityId: _invoiceRecord.id,
            printMode: render.PrintMode.PDF
            });
	    pdfFile.folder = folderId;
	    return pdfFile.save();
	}
		
   return {
      beforeSubmit : beforeSubmit,
	  afterSubmit : afterSubmit
   };
});
	
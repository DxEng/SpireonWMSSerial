/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/



var 	
	datatablesEnabled = true,	
	file,
	https,
	log,
	page,
	query,
	record,
	remoteLibraryEnabled = true,
	render,
	rowsReturnedDefault = 10,
	runtime,	
	scriptURL,
	queryFolderID = null,	
	toolLatestVersion,
	toolUpgradesEnabled = true,
	toolUpgradeMessage = '',
	url,
	version = '2021.2 Beta 2',
	workbooksEnabled = true;


define( [ 'N/file', 'N/https', 'N/log', 'N/ui/message', 'N/query', 'N/record', 'N/render', 'N/runtime', 'N/ui/serverWidget', 'N/url' ], main );


function main( fileModule, httpsModule, logModule, messageModule, queryModule, recordModule, renderModule, runtimeModule, serverWidgetModule, urlModule ) {

	file = fileModule;
	https = httpsModule;
	log = logModule;
	message = messageModule;
	query= queryModule;
	record = recordModule;
	render = renderModule;
	runtime = runtimeModule;
	serverWidget = serverWidgetModule;	
	url = urlModule;
	
    return {
    
    	onRequest: function( context ) {     
    	
			scriptURL = url.resolveScript( { scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId, returnExternalURL: false } ); 
	    	    	

						
			if ( context.request.parameters.hasOwnProperty( 'function' ) ) {	
			
				if ( context.request.parameters['function'] == 'documentGenerate' ) {						
					documentGenerate( context );						
				}				
			
							
			} else {
			
				if ( toolUpgradesEnabled === true ) {

					if ( toolLatestVersion != null ) {
						if ( toolLatestVersion.version != version ) {
							toolUpgradeMessage = `
								<p style="margin-top: 24px;">
								<span style="padding: 9px; x-background-color: yellow; width: 30%; border: 1px solid #ccc;">
								<a href="${toolLatestVersion.infoURL}" target="_info" style="color: #4d5f79;">Version ${toolLatestVersion.version}</a> is now available. 
								<a href="${scriptURL}&function=upgrade" style="color: #4d5f79;">Click to install.</a>
								</span>
								</p>
							`;
						}
		
					}
				
				}
																		
				var form = serverWidget.createForm( { title: 'Device Serial Validator', hideNavBar: false } );		
				
				var htmlField = form.addField(
					{
						id: 'custpage_field_html',
						type: serverWidget.FieldType.INLINEHTML,
						label: 'HTML'
					}								
				);

				htmlField.defaultValue = htmlGenerate();						
				form.clientScriptModulePath = "SuiteScripts/SpireonWMSSerial/apitest/spr_cs_nspireapi_ph.js";
				context.response.writePage( form );					
				
			}						
    		    			
        }
        
    }

}


function documentGenerate( context ) {

	try {		

		var sessionScope = runtime.getCurrentSession();
		
		var docInfo = JSON.parse( sessionScope.get( { name: 'suiteQLDocumentInfo' } ) );
						
		var moreRecords = true;	
		
		var paginatedRowBegin = docInfo.rowBegin;
		
		var paginatedRowEnd = docInfo.rowEnd;		
		
		var queryParams = new Array();

		var records = new Array();

		do {			
	
			var paginatedSQL = 'SELECT * FROM ( SELECT ROWNUM AS ROWNUMBER, * FROM (' + docInfo.query + ' ) ) WHERE ( ROWNUMBER BETWEEN ' + paginatedRowBegin + ' AND ' + paginatedRowEnd + ')';
		
			var queryResults = query.runSuiteQL( { query: paginatedSQL, params: queryParams } ).asMappedResults(); 	
				
			records = records.concat( queryResults );	
					
			if ( queryResults.length < 5000 ) { moreRecords = false; }
		
			paginatedRowBegin = paginatedRowBegin + 5000;
				
		} while ( moreRecords );	
				
		var recordsDataSource = { 'records': records };	

		var renderer = render.create();
		renderer.addCustomDataSource( { alias: 'results', format: render.DataSource.OBJECT, data: recordsDataSource } );										
		renderer.templateContent = docInfo.template;
		
		if ( docInfo.docType == 'pdf' ) {
			let renderObj = renderer.renderAsPdf();				
			let pdfString = renderObj.getContents();						
			context.response.setHeader( 'Content-Type', 'application/pdf' );										
			context.response.write( pdfString );
		} else {
			let htmlString = renderer.renderAsString();							
			context.response.setHeader( 'Content-Type', 'text/html' );										
			context.response.write( htmlString );		
		}	
								
	} catch( e ) {		

		log.error( { title: 'documentGenerate Error', details: e } );
		
		context.response.write( 'Error: ' + e );		
		
	}				
	
}


function documentSubmit( context, requestPayload ) {

	try {		
	
		var responsePayload;		
		
		var sessionScope = runtime.getCurrentSession();
		
		sessionScope.set( { name: 'suiteQLDocumentInfo', value: JSON.stringify( requestPayload ) } );		
				
		responsePayload = { 'submitted': true }

	} catch( e ) {		

		log.error( { title: 'queryExecute Error', details: e } );
		
		responsePayload = { 'error': e }		
		
	}			
	
	context.response.write( JSON.stringify( responsePayload, null, 5 ) );	
	
}


function htmlDataTablesFormatOption() {

	if ( datatablesEnabled === true ) {
	
		return `
			<div class="form-check-inline">
				<label class="form-check-label" style="font-size: 10pt;">
					<input type="radio" class="form-check-input" name="resultsFormat" value="datatable" onChange="responseGenerate();">DataTable
				</label>
			</div>			
 		`
	
	} else {
	
		return ``
	
	}

}


function htmlGenerate() {
			
	return `

		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
		<script src="/ui/jquery/jquery-3.5.1.min.js"></script>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
		<style type = "text/css"> 
		
			input[type="text"], input[type="search"], textarea, button {
				outline: none;
				box-shadow:none !important;
				border: 1px solid #ccc !important;
			}
			
			p, pre {
				font-size: 10pt;
			}
			
			td, th { 
				font-size: 10pt;
				border: 3px;
			}
			
			th {
				text-transform: lowercase;
				font-weight: bold;				
			}
			
		</style>
		
			
		${htmlUI()}
				
	
	`
	
}


function htmlLocalLoadModal() {

	return `
		<div class="modal fade" id="localLoadModal">
			<div class="modal-dialog modal-lg">
				<div class="modal-content">

					<div class="modal-header">
						<h4 class="modal-title">Local Query Library</h4>
						<button type="button" class="close" data-dismiss="modal">&times;</button>
					</div>

					<div class="modal-body" id="localSQLFilesList">								
					</div>

				</div>
			</div>
		</div>	
	`;	

}


function htmlUI() {

	return `

		<table border="2">
			<tbody>
			<tr>
			<td>
			<table border="1">
			<tbody>
			<tr>
			<td colspan="2">Device Serial:</td>
			  </tr>
			<tr>
			<td colspan="2"><input id="custrecord_spr_validate_devserial" type="text" /></td>
			</tr>
			<tr>
			<td colspan="2" align="center"><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Validate Serial"onclick="onValidateSerial()" /></td>
			</tr>
			<tr>
			<td colspan="2">Device Validation Rules</td>
			</tr>
			<tr>
			<td>Min Length:</td>
			<td>5</td>
			</tr>
			<tr>
			<td>Valid Characters</td>
			<td>[0-9a-zA-Z]</td>
			</tr>
			<tr>
			<td>Valid First Character</td>
			<td>[ABCMW124]</td>
			</tr>
			</tbody>
			</table >
			</td>
			<td>
			<table border="1">
			<tbody>
			<tr>
			<td>Item Fulfillment Internal Id:</td>
			 </tr>
			<tr>
			<td align="center"><input id="custrecord_spr_validate_iffid" type="text" /></td>
			</tr>
			<tr>
			<td align="center"><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Validate Item Fulfmillment" /></td>
			</tr>
			<tr>
			<td >#1 Count #2 Valid #3 Duplicate<br> 
			  #4 Ship + Dates / Notify</td>
			</tr>
			<tr>
			<td align="center"><input id="custpage_submit_initial" name="custpage_submit_initial_single" type="button" value="Submit Initial" /></td>
			</tr>
			</tbody>
			</table >
			</td>
			<td>
			<table border="1">
			<tbody>
			<tr>
			<td>For All Fulfillment Records</td>
			</tr>
			<tr>
			<td><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Get Provision Status (last cycle)" /></td>
			</tr>
			<tr>
			<td><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Notify nspire Failures" /></td>
			</tr>
			<tr>
			<td><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Validate  Device Data+Notify/Ship" /></td>
			</tr>
			<tr>
			<td><input id="custpage_validateserial" name="custpage_validateserial" type="button" value="Submit Initial" /></td>
			</tr>

			</tbody>
			</table>
			</td>
			</tr>
			</tbody>
			</table>		

	`;	

}





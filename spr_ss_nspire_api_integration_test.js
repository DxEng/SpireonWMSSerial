/**
 * spr_ss_nspire_api_integration.js
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 * Auther: Sathish Madhi
 * Created: 07/29/2021
 */
 
 
 
define(['N/search', 'N/email', 'N/record', 'N/log', 'N/file', 'N/runtime','SuiteScripts/DevLibrary/Spireon-Monitor', 'SuiteScripts/DevLibrary/Spireon-Runner', 'SuiteScripts/DevLibrary/Spireon-Utils', 'SuiteScripts/DevLibrary/Spireon-Assert','SuiteScripts/SpireonWMSSerial/spr_util_shipconfirmvalidations.js'],
    function(search, email, record, log, file, runtime, RecordMonitor, Runner, Utils, Assert,shipconfirm) {
	const _LOGHEADER = 'Nspire API Integration';
	var url_DeviseProvision = 'https://deviceprovisioningservice-stage.spireon.com/rest/deviceProvisioningOrders';
	var url_identitytoken = 'https://identity-stage.spireon.com/identity/token';
	function execute(context){
		var today = new Date();
		log.audit({title: _LOGHEADER,details: 'Start of execute'});
		
		log.audit({title: _LOGHEADER,details: 'End of execute'});
	}
	
	return {
		execute: execute
	}
});


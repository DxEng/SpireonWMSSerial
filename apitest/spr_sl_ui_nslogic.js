/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https'], function(https) {
    function onRequest(context) {
		
		var contentRequest = https.get({
                url: "https://772965-sb2.app.netsuite.com/core/media/media.nl?id=61044920&c=772965_SB2&h=-9zb4sDUpWOFplUYV1C8e8EDCBpcA_212TVnGvObkFHFIQ2z&_xt=.html" 
            });
        context.response.write(contentRequest);
        context.response.setHeader({
            name: 'Custom-Header-Demo',
            value: 'Demo'
        });
    }

    return {
        onRequest: onRequest
    };
});

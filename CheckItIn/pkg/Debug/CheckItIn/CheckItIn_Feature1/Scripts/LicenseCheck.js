/*
Company Name: Stebra Consulting
Company URL: http://www.stebra.se
Developers: Simon Bergqvist & Felix Freye
App Title: Check It In
App URL: http://www.stebra.se/apps/checkitin
Description: Stebra Check It In allows users to easily find and check in their checked out files. 
Version: 1.0.0.1
Copyright (C) 2014 Stebra Consulting
*/
'use strict';
$(document).ready(function () {
    //var settings = {
    //    context: SP.ClientContext.get_current(),
    //    appGuid: "{eb284ff6-af7c-467f-a07a-e49a704a0436}"
    //};
    //Check(settings);
    startAppjs();
});

var licenseCollection;
var webResponse;
var licenseSettings;

function Check(settings) {
    licenseSettings = settings;
    licenseCollection = SP.Utilities.Utility.getAppLicenseInformation(licenseSettings.context, licenseSettings.appGuid);
    
    licenseSettings.context.executeQueryAsync(function ()//onsuccess at getAppLicenseInformation
    {
      
        var topLicense;
        var encodedTopLicense;

        if (licenseCollection.get_count() > 0) {

            topLicense = licenseCollection.get_item(0).get_rawXMLLicenseToken();
            encodedTopLicense = encodeURIComponent(topLicense);

            var webRequest = new SP.WebRequestInfo();
            webRequest.set_url("https://verificationservice.officeapps.live.com/ova/verificationagent.svc/rest/verify?token=" + encodedTopLicense);
            webRequest.set_method("GET");
            webResponse = SP.WebProxy.invoke(licenseSettings.context, webRequest);
            licenseSettings.context.executeQueryAsync(function () { var xmltoken = webResponse.get_body(); checkToken(xmltoken); }, licenseFail);
            //onsuccess(give xmltoken to checkTokenfunc), no license found

        }
        else {
            
            licenseFail();  //no license found
        }

    }, licenseFail); // no license found

}


function checkToken(xmltoken) {
    
    var token = $.xml2json(xmltoken); //xml -> json
    
    
    //SellerDashboard Mode / Production Mode
    if (token.IsValid == "false" || token.IsTest == "true") {licenseFail("notValid"); token = "";}
    else {licenseTypeCheck(token);}

    //devmode
    //for (var key in token) {$("#fail").append(key + " - " + token[key] + "<br>");}
    //licenseTypeCheck(token);


}


function licenseTypeCheck(token) {
    
    switch (token.EntitlementType.toLowerCase()) {

        case "free":    //app should not be free
            break;
        case "paid":    //if user have paid
            startAppjs(); 
            break;
        case "trial":   //still trial
            if (token.IsEntitlementExpired.toLowerCase() === "true") licenseFail("Expired"); // Trial app has expired!
            else startAppjs();
            break;
    }
}


function licenseFail(msg) { //optional inparameter = Expired license, License is not valid, No license 

    var language = decodeURIComponent(getQueryStringParameter("SPLanguage"));
    switch (msg) {
        case 'notValid':
            window.location.replace("novalidlicense.html?Language=" + language);
            break;
        case 'Expired':
            window.location.replace("expiredlicense.html?Language=" + language);
            break;
        default: //'noLicense'
            window.location.replace("novalidlicense.html?Language=" + language);
            break;
    }
}


//getQueryStringParameter
function getQueryStringParameter(paramToRetrieve) {
    var params =
        document.URL.split("?")[1].split("&");
    var strParams = "";
    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve)
            return singleParam[1];
    }
}
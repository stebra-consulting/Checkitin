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
function getLanguage() {
    var language = decodeURIComponent(getQueryStringParameter("Language"));

    var licenseVocab;
    if (language.toLowerCase() == "sv-se") {
        licenseVocab = {

            noLicense: "Du har ingen giltig licens. Köp en licens på SharePoint Store eller via ",
            expiredLicense: "Din trial har gått ut. Köp den fullständiga appen på SharePoint Store eller via "
        }
    } else {
        licenseVocab = {
            noLicense: "You have no valid license. Please buy one at SharePoint Store or through ",
            expiredLicense: "Your trial has expired. Please buy the full app at SharePoint Store or through "
        };
    }

    if ($('#noLicenseMessage').length != '0') {
        $('#noLicenseMessage').html(licenseVocab["noLicense"] + "<a href='http://www.stebra.se/apps/checkitin' target='_blank' alt='www.stebra.se/apps/checkitin'>www.stebra.se/apps/checkitin</a>");
    }
 
    if ($('#expiredLicenseMessage').length != '0') {
        $('#expiredLicenseMessage').html(licenseVocab["expiredLicense"] + "<a href='http://www.stebra.se/apps/checkitin' target='_blank' alt='www.stebra.se/apps/checkitin'>www.stebra.se/apps/checkitin</a>");
    }

}


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

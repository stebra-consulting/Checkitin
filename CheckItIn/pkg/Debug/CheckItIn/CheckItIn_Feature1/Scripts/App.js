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

var clientContext = SP.ClientContext.get_current();
var hostWebUrl = decodeURIComponent(getQueryStringParameter('SPHostUrl'));
var user = clientContext.get_web().get_currentUser();
var subwebs = new Array();
var allDocLibs = [];
var itemCollections = [];
var allListCollections = [];
var allCheckedOutFiles = [];
var currentListCollection = 0;
var allLists = [];
var mirrored = [];

var vocab; //language
var pageMemory = 0;
var toggled;
var senderId;
var lastSelection = new Array();

function startAppjs() {

    $("body").height(100);
    $("#loading").show();
    clientContext.load(user);
    subwebs.push(hostWebUrl);
    getSenderId();
    getLanguage();
    appWebMessage();
    restCall();


}

function appWebMessage() {
    if ($('#appWebMessage').length != '0') {
        $('#appWebMessage').append(vocab["appWebText"] + "<img src='../images/screen_v5.png' alt='Instructions Picture'/>");
    }
}


function getSenderId() {
    var params = document.URL.split("?")[1].split("&");
    for (var i = 0; i < params.length; i = i + 1) {
        var param = params[i].split("=");
        if (param[0].toLowerCase() == "senderid")
            senderId = decodeURIComponent(param[1]);
    }


}

function getLanguage() {
    var language = decodeURIComponent(getQueryStringParameter("SPLanguage"));
    if (language.toLowerCase() == "sv-se") {

        vocab = {

            selectAll: "Markera Alla",
            deselectAll: "Avmarkera Alla",
            checkItInBtn: "Checka in markerade filer",
            defaultError: "Ett fel har uppstått.",
            appWebText: "Appen körs nu i ett eget fönster men den är ämnad att köras som en Programdel. </br> " +
                        "Appen kan användas fördelaktigt som en progamdel eftersom du ser appen samtidigt som du får en bra översikt över annan information på sidan. </br></br>" +
                        "Instruktioner för att köra appen som en programdel i en befintlig sida;</br>" +

        "1. Navigera till sidan som du vill ha appen på </br>" +
        "2. klicka på redigera sida </br>" +
        "3. klicka på ribbon-fliken infoga </br>" +
        "4. klicka på programdel </br>" +
        "5. välj appen som nästa alternativ </br>" +
        "6. klicka på add-knappen </br>" +
        "7. klicka på spara </br>",
            logoTooltip: "Klicka här för att ge oss feedback",
            nextPage: "Nästa sida",
            prevPage: "Föregående sida"

        }
    } else {

        vocab = {
            selectAll: "Select All",
            deselectAll: "Deselect All",
            checkItInBtn: "Check in the selected files",
            defaultError: "An error has occurred.",
            appWebText: "The app is now running in its own window but it is recommended to run it as a Client Web Part. </br> " +
                     "The app can be used beneficial as a Client Web Part since you get a good overview on both the app and the rest of a page. </br></br>" +
                     "Instructions to install the app as a Client Web part; </br>" +

     "1. Navigate to the page you want the app installed </br>" +
     "2. Click on Edit Page </br>" +
     "3. Click the Ribbon-tab Insert </br>" +
     "4. Click on App part </br>" +
     "5. Choose the app in the menu </br>" +
     "6. Click on the add-button </br>" +
     "7. Click on Save </br>",
            logoTooltip: "Click here to give us feedback",
            nextPage: "Next page",
            prevPage: "Previous page"

        };
    }
}

function restCall() {

    //https://nackademin862.sharepoint.com/_api/search/query?querytext='web'&trimduplicates=false&rowlimit=50&selectproperties='Sitename%2cPath'&refinementfilters='WebTemplate:("STS")'
    var appWebUrl = decodeURIComponent(getQueryStringParameter('SPAppWebUrl'));
    var extraQuery = "&trimduplicates=false&rowlimit=50&selectproperties='Sitename%2cPath'&refinementfilters='or( WebTemplate:(STS),WebTemplate:(BLOG) )'";

    var queryUrl = appWebUrl + "/_api/search/query?querytext='web'" + extraQuery;

    $.ajax({
        url: queryUrl,
        method: "GET",
        headers: {
            "Accept": "application/json; odata=verbose"
        },
        success: onQuerySuccess,
        error: onQueryError
    });
}


function onQuerySuccess(data) {
    var isHostwebs = false;
    var results = data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;

    $.each(results, function () {
        isHostwebs = false;
        $.each(this.Cells.results, function () {
            if (this.Key.toLowerCase() == "sitename") {
                if (this.Value == hostWebUrl + "/") {
                    isHostwebs = true;

                }

            }
            if (this.Key == "Path") {
                if (isHostwebs) {
                    subwebs.push(this.Value);
                }
            }


        });
    });
    getListsfromSubwebs();
}

function onQueryError(error) {
    onFail();
}

function logoRedirect() {
    window.open(
    'http://www.stebra.se/apps/checkitin',
    '_blank');
}

function getListsfromSubwebs() {
    if (subwebs.length != 0) {

    var url = subwebs[0];
    var parentContext = new SP.AppContextSite(clientContext, url);
    var parentWeb = parentContext.get_web();

    var lists = parentWeb.get_lists();
    clientContext.load(lists);
    clientContext.executeQueryAsync(function () {

        var listEnumerator = lists.getEnumerator();
        while (listEnumerator.moveNext()) {
            var currentList = listEnumerator.get_current();
            if (currentList.get_baseType() == "1") {
                allDocLibs.push(currentList);
            }
        }

        subwebs.splice(0, 1);
        getListsfromSubwebs();
    }, function () {
        subwebs.splice(0, 1);
        getListsfromSubwebs();
    });

    }
    else {
        partiallyExecThis();
    }
}


function partiallyExecThis() {

    var collectionCopy = allDocLibs.slice();

    //This variable decides how much to load before each clientContext.executeQueryAsync(x, y);
    var resourceSize = 5; //hardcoded cap
    //10, 8 = error, 5 = sucess

    var collectionCopySize = collectionCopy.length;
    var nIterations = Math.ceil(collectionCopySize / resourceSize);


    for (var i = 1; i <= nIterations; i++) {
        var splicedLists;
        if (i != nIterations) {
            splicedLists = collectionCopy.splice(0, 5);
        } else {
            splicedLists = collectionCopy.splice(0, collectionCopy.length);
        }
        allListCollections.push(splicedLists);
    }

    GetCAML();

}


function GetCAML() {
    var textCaml = "";
    textCaml = "".concat(
        "<View Scope='RecursiveAll'>",
            "<Query>",
                "<Where>",
                    "<And>",
                        "<Eq>",
                            "<FieldRef Name='CheckoutUser'>",
                            "</FieldRef>",
                            "<Value Type='Lookup'>",
                                    user.get_title(),
                            "</Value>",
                        "</Eq>",
                        "<IsNotNull>",
                            "<FieldRef Name='CheckoutUser' />",
                        "</IsNotNull>",
                    "</And>",
                "</Where>",
            "</Query>",
        "</View>");

    GetFiles(textCaml);
} //Requires 'user' to be loaded&Executed


function GetFiles(textCaml) {
    var camlQuery = new SP.CamlQuery(); //Able to use Caml.
    camlQuery.set_viewXml(textCaml);

    if (currentListCollection < allListCollections.length) {
        for (var currentList = 0; currentList < allListCollections[currentListCollection].length; currentList++) {
            var selectedList = allListCollections[currentListCollection][currentList];
            var selectedItemCollection = selectedList.getItems(camlQuery);
            allLists.push(selectedList);
            itemCollections.push(selectedItemCollection);
            clientContext.load(selectedItemCollection);
        }
        currentListCollection++;

        clientContext.executeQueryAsync(function (sender, args) {
            GetFiles(textCaml);
        },
        onFail
        );
    }

    else if (currentListCollection == allListCollections.length) {
        checkedOutItems();
    }
}

function checkedOutItems() {

    for (var i = 0; i < itemCollections.length; i++) {

        var listItemsE = itemCollections[i].getEnumerator();
        while (listItemsE.moveNext()) {
            var currentItem = listItemsE.get_current();

            mirrored.push(allLists[i]);
            allCheckedOutFiles.push(currentItem);

        }
    }

    sortByDate();
}

function sortByDate() {

    var dates = new Array();
    for (var i = 0; i < allCheckedOutFiles.length; i++) {
        var currentDate = allCheckedOutFiles[i].get_item("Last_x0020_Modified").substring(0, 10);
        dates.push([currentDate, i, mirrored[i]]);
    }

    dates.sort(); //Array now becomes [41, 25, 8, 71]
    dates.reverse(); //Reversed
    var mirroredSorted = new Array();
    var filesSorted = new Array();
    for (var j = 0; j < allCheckedOutFiles.length; j++) {
        var selectedIndex = dates[j][1];
        var selectedItem = allCheckedOutFiles[selectedIndex];
        filesSorted.push(selectedItem);
        var selectedDocLib = dates[j][2];
        mirroredSorted.push(selectedDocLib);

    }
    allCheckedOutFiles = filesSorted;
    mirrored = mirroredSorted;
    fillSource();
}

function getBaseUrl(url) {

    //url sample
    //https://nackademin862.sharepoint.com/sites/Shared
    var splitParameter = ".";
    //'.sharepoint.';

    var splitted = url.split(splitParameter);
    // ['https://nackademin862', 'sharepoint', 'com/sites/Shared']

    var spl1 = splitted[(splitted.length) - 1];
    //com/sites/Shared

    var splitted2 = spl1.split("/");
    //['com', 'sites', 'Shared']

    var spl2 = splitted2[0];
    //com
    // str.replace("/sites/Shared", "FileDirRef");
    var replacedUrl = url.replace(spl1, spl2);
    //In https://nackademin862.sharepoint.com/sites/Shared, replace "com/sites/Shared", with "com".

    return replacedUrl;
    //return 'https://nackademin862.sharepoint.com'
}

function openFileUrl(item, wopiUrl, absUrl) {

    var href;

    var fileRef = item.get_item("FileRef"); //FileRef = /site/subsite/list/folder/listitem

    var fileType = item.get_item("File_x0020_Type"); //filetype to file
    var guid = item.get_item("UniqueId"); //id to file

    var fileLeafRef = item.get_item("FileLeafRef");

    var fullUrl = getBaseUrl(hostWebUrl) + wopiUrl;

    //fullUrl = htttp://server/site/subsite
    //absurl = http://server/site/subsite/list/folder
    //fileLeafRef = listitem

    //OFFICE SUITE FILES OPEN IN O365ONLINE EDIT
    if (fileType == "docx" || fileType == "doc" || fileType == "pptx" || fileType == "xlsx") {
        href = fullUrl + "/_layouts/15/WopiFrame.aspx?sourcedoc={" + guid + "}&file=" + fileLeafRef + "&action=default";


    }
        //IMAGES OPENS IN LIGHTBOX
    else if (fileType == "jpg" || fileType == "jpeg" || fileType == "png" || fileType == "tif" || fileType == "png" || fileType == "bmp" || fileType == "gif") {

        href = fullUrl + "/_layouts/15/Lightbox.aspx?url=" + absUrl + "/" + fileLeafRef;

    }
        //OTHER FILES OPEN IN BROWSER
    else { href = fileRef; }


    return href;

}


function fillSource() {

    var data = new Array();

    for (var i = 0; i < allCheckedOutFiles.length; i++) {
        var row = {};

        var absoluteUrl = getBaseUrl(hostWebUrl) + allCheckedOutFiles[i].get_item("FileDirRef");
        //("FileRef");sitecollection/subsites/subsites/doclib/folder/


        var fileLeafRef = allCheckedOutFiles[i].get_item("FileLeafRef");

        var tooltip = fileLeafRef + "\n" + absoluteUrl;

        var fileLeafRefFix = fileLeafRef.replace(/-/g, "&#8209;");

        var wopiFriendlyUrl = "";
        wopiFriendlyUrl = mirrored[i].get_parentWebUrl();
        //mirrored[i]


        var href = openFileUrl(allCheckedOutFiles[i], wopiFriendlyUrl, absoluteUrl);

        row["title"] = "<p class='rowContainer' ><a title='" + tooltip + "' href='" + href + "' target='_blank'>" + fileLeafRefFix + "</a></p>";

        row['index'] = i;

        data[i] = row;

    }
    var source;
    source = {
        localData: data,
        dataType: "array",
        dataFields: [{
            name: 'title',
            type: 'string'
        }, {
            name: 'index',
            type: 'number'
        }]
    };
    var dataAdapter;
    dataAdapter = new $.jqx.dataAdapter(source);
    
    $("#loading").hide();

    if (allCheckedOutFiles.length != 0) { //Hide the JQXDatatable when no there is no files to present
        $('.textContent').css('top', '520px');
        if (allCheckedOutFiles.length < 6) {
            var newHeight = 48.3;
            if (allCheckedOutFiles.length == 1) {
                newHeight = 49;
            }
            var zeroItems = 132;
            var newHeight = zeroItems + (newHeight * allCheckedOutFiles.length)
            if ($('#appWebD').length != '0') {
                $('#appWebD').height(newHeight);
            }
            else { $("body").height(newHeight); }


        }
        else {
            if ($('#appWebD').length != '0') {
                $('#appWebD').height('421');
                
            }
            else { $("body").height('421'); }


        }
        adjustSize();
        renderList(dataAdapter);

    }
    else {
        $("body").height(0);
        adjustSize();
    }
}

function adjustSize() {
    // Post the request to resize the App Part, but just if has to make a resize

     //step = 30, // the recommended increment step is of 30px. Source:
                   // http://msdn.microsoft.com/en-us/library/jj220046.aspx
    var width = 300,        // the App Part width
    height = $('body').height() + 25,  // the App Part height
                                      
    resizeMessage = '<message senderId={Sender_ID}>resize({Width}, {Height})</message>';

    // set the parameters
    resizeMessage = resizeMessage.replace("{Sender_ID}", senderId);
    resizeMessage = resizeMessage.replace("{Height}", height);
    resizeMessage = resizeMessage.replace("{Width}", 300);

    // post the message
    window.parent.postMessage(resizeMessage, "*");


}



function renderList(dataAdapter) {

    var self = this;
    var pageCap = 6;

    var pagerrenderer = function () {
        var element = $("<div id='pager'></div>");
        var leftButton = $("<div id='leftButton' class='.hoverButton' title='" + vocab["prevPage"] + "' ><div id='leftButtonInner' ></div></div>");
        leftButton.find('div').addClass('jqx-icon-arrow-left');
        leftButton.width(36);
        leftButton.jqxButton({
            theme: 'energyblue'
        });
        var rightButton = $("<div id='rightButton' class='.hoverButton' title='" + vocab["nextPage"] + "' ><div id='rightButtonInner' ></div></div>");
        rightButton.find('div').addClass('jqx-icon-arrow-right');
        rightButton.width(36);
        rightButton.jqxButton({
            theme: 'energyblue'
        });

        var infoContent = allCheckedOutFiles.length.toString();

        var info = $("<div id='selectAllBtn' class='.hoverButton' title='" + vocab["selectAll"] + "' ><img src='../images/All_files2.png' alt='Select All' width='16' height='16'><div id='totalFiles'>" + infoContent + "</div></div>");

        if (allCheckedOutFiles.length > pageCap) {
            leftButton.appendTo(element);
            rightButton.appendTo(element);
            rightButton.click(function () {
                $("#jqxDatatable").jqxDataTable('goToNextPage');
            });
            leftButton.click(function () {
                $("#jqxDatatable").jqxDataTable('goToPrevPage');
            });
        }

        info.appendTo(element);

        info.click(function () {

            if (toggled) {
                //if (allCheckedOutFiles.length == lastSelection.length) {}
                toggled = false;
                $("#jqxDatatable").jqxDataTable('clearSelection');
                lastSelection = new Array();
                $("#jqxDatatable").jqxDataTable('destroy'); //destroys the entire div
                $('#dataTableHolder').append("<div id='jqxDatatable'></div>"); //create a new legit target for renderList()
                fillSource();

            }
            else {
                toggled = true;
                for (var i = 0; i < allCheckedOutFiles.length; i++) {
                    $("#jqxDatatable").jqxDataTable('selectRow', i);
                    lastSelection.push(i);
                    $('#selectAllBtn').attr('title', vocab["deselectAll"]);
                }
            }
        });

        // update buttons states.
        var handleStates = function (event, button, className, add) {
            button.on(event, function () {
                if (add == true) {
                    button.find('div').addClass(className);
                } else button.find('div').removeClass(className);
            });
        }

        return element;
    }

    $('#jqxDatatable').jqxDataTable({

        width: '100%',
        height: '100%',
        pagerPosition: 'top',
        selectionMode: 'custom',
        pagerRenderer: pagerrenderer,
        pageSize: pageCap,
        theme: 'bluemod',
        pageable: true,
        showToolbar: true,
        showHeader: false,
        showStatusbar: true,

        renderToolbar: function (toolbar) { //TOP SPACE WHERE LOGO IS LOCATED
            var container = $("<div id='toolbarContainer'></div>");
            var logo = $("<img id='logo' title='" + vocab["logoTooltip"] + "' src='../images/StebraCheckItInterlaced.png' alt='Stebra_Logo' >");
            toolbar.append(container);
            container.append(logo);


            $("#logo").bind('click', function () {
                logoRedirect();
            });

        },

        renderStatusbar: function (toolbar) { //BOTTOM SPACE WHERE BUTTON

            var container = $("<div id='statusbarContainer' ></div>");
            var button = $("<div id='button' title='" + vocab["checkItInBtn"] + "'>" +
                "<div id='normal' style='z-index:0'></div>" +
                "<div id='hover' style='z-index:-1'></div>" +
                "<div id='active' style='z-index:-2'></div>" +
                "</div>");
            
            toolbar.append(container);
            container.append(button);

            //var leftPositioning = ($("#dataTableHolder").width() / 2) - 35;
            //$("#statusbarContainer").css("left", leftPositioning);

            $("#button")
           .mouseover(function () { $("#hover").css("z-index", "1") })
           .mouseout(function () { $("#hover").css("z-index", "-1") })
           .mousedown(function () { $("#active").css("z-index", "1");})
           .mouseup(function () { $("#active").css("z-index", "-2"); CheckIn();  })
           .mouseleave(function () { $("#active").css("z-index", "-2") });

        },
        source: dataAdapter,
        columns: [{
            text: 'My Checked Out Documents',
            dataField: 'title',
            width: '100%'
        }, {
            text: 'Index',
            dataField: 'index',
            width: 0,
            hidden: true
        }]
    });



    $('#jqxDatatable').jqxDataTable({ pagerHeight: 30 });
    $('#jqxDatatable').jqxDataTable({ statusBarHeight: 70 });
    $('#jqxDatatable').jqxDataTable({ toolbarHeight: 33 });

    //contentjqxDatatable hide on no docs
    if (allCheckedOutFiles.length <= 0) {
        $("#contentjqxDatatable").hide();
    }

    $('#jqxDatatable').on('rowClick', function (event) {
        var index = args.index;
        var clickEvent = args.originalEvent;
        if (clickEvent.target.nodeName == "A") {
            window.open(
            decodeURIComponent(clickEvent.target.href),
            '_blank');
        }

        else {
            var isSpliced = false;
            $("#jqxDatatable").jqxDataTable('selectRow', index);
            for (var i = 0; i < lastSelection.length; i++) {
                if (index == lastSelection[i]) {
                    lastSelection.splice(i, 1);
                    isSpliced = true;
                    $("#jqxDatatable").jqxDataTable('unselectRow', index);
                    break;
                }

            }
            if (!isSpliced) {
                lastSelection.push(index);
            }
        }
    });

    $("#jqxDatatable").jqxDataTable('goToPage', pageMemory);
    $('#jqxDatatable').on('pageChanged', function (event) {
        var args = event.args;
        var pageNum = args.pagenum;
        pageMemory = pageNum;


    });

}



function CheckIn() {
    //init select
    var selectedItems = new Array; //will contain allCheckedOutFiles.GUIDS





    if (lastSelection.length != 0) {
        //splice corresponding item in allCheckedOutFiles[]
        //url(../images/round.png);
        $("#button").replaceWith("<img id='replaced' src='../Images/CheckItInButton/loading2.gif' alt='Loading' width='50' height='50'>");
        for (var i = 0; i < lastSelection.length; i++) {

            //get corresponding index from checkedOutFiles[x]
            var sourceSelection = $("#jqxDatatable").jqxDataTable('getCellValue', lastSelection[i], 'index');

            var selectedItem = allCheckedOutFiles[sourceSelection];

            selectedItems.push(selectedItem.get_item("UniqueId"));

        }

        var spliceIndexes = new Array();
        var globalItem = null; //load CurrentItem for Check In
        for (var i = 0; i < selectedItems.length; i++) { //spliceIndexes.push(z - i);

            for (var z = 0; z < allCheckedOutFiles.length; z++) {

                if (allCheckedOutFiles[z].get_item("UniqueId") == selectedItems[i]) {
                    var file = allCheckedOutFiles[z].get_file();
                    file.checkIn();

                    spliceIndexes.push(z); //This makes it possible to remove several consequently items in the array by Index

                    globalItem = allCheckedOutFiles[z];
                    clientContext.load(globalItem);
                }

                for (var j = 0; j < spliceIndexes.length; j++) {

                    allCheckedOutFiles.splice(spliceIndexes[j], 1);


                }
                spliceIndexes = [];



            }

        }

        clientContext.executeQueryAsync(CheckInOnSuccess, onFail);





    }
}

function CheckInOnSuccess() {

    lastSelection = new Array(); // clears the SelectionMode: 'custom'-selection
    $("#jqxDatatable").jqxDataTable('clearSelection');

    $("#jqxDatatable").jqxDataTable('destroy'); //destroys the entire div
    $('#dataTableHolder').append("<div id='jqxDatatable'></div>"); //create a new legit target for renderList()

    fillSource(); //fillSource() -> rendewrList() //Init the Datatable once again with freshly generated indexes



}

function onFail(sender, args) {
    //$('#fail').text('Failure' + args.get_message());
    $('#jqxDatatable').append('<div id="jqxNotification"></div>');
    $('#jqxNotification').text(vocab["defaultError"]);

    $("#jqxNotification").jqxNotification({
        width: "100%",
        height: '71px',
        position: "top-right",
        opacity: 1,
        autoOpen: true,
        autoClose: false,
        template: "warning"
    });

    $("#jqxNotification").remove();

    lastSelection = new Array(); // clears the SelectionMode: 'custom'-selection
    $("#jqxDatatable").jqxDataTable('clearSelection');

    $("#jqxDatatable").jqxDataTable('destroy'); //destroys the entire div
    $('#dataTableHolder').append("<div id='jqxDatatable'></div>"); //create a new legit target for renderList()

    fillSource(); //fillSource() -> rendewrList() //Init the Datatable once again with freshly generated indexes



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
} //to get hostweb url







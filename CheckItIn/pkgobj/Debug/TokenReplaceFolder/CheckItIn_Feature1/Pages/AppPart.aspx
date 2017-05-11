<%@ Page language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<WebPartPages:AllowFraming ID="AllowFraming" runat="server" />

<html>
<head>
    <title></title>
    <script type="text/javascript" src="../Scripts/jquery-1.9.1.min.js"></script>

    <script type="text/javascript" src="/_layouts/15/MicrosoftAjax.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script>
    <script type="text/javascript" src="/_layouts/15/sp.js"></script>
    

    <%-- JQXCSS --%>
    <link rel="stylesheet" href="../jqwidgets/styles/jqx.base.css"      type="text/css"/>
    <link rel="stylesheet" href="../jqwidgets/styles/jqx.bluemod.css"   type="text/css"/>
    <%-- JQXCSS --%>

    <%-- JQXWIDGETS HERE --%>
    <script type="text/javascript" src="../jqwidgets/jqxcore.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxnotification.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxdata.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxbuttons.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxscrollbar.js"></script>    
    <script type="text/javascript" src="../jqwidgets/jqxlistbox.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxdropdownlist.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxdatatable.js"></script>
    <script type="text/javascript" src="../jqwidgets/jqxtooltip.js"></script>
     <script type="text/javascript" src="../Scripts/jquery.xml2json.js"></script>
   

    <%-- JQXWIDGETS HERE --%>
    
      <!-- Add your CSS styles to the following file -->
    <link rel="Stylesheet" type="text/css" href="../Content/App.css" />
    <!-- Add your JavaScript to the following file -->
   <script type="text/javascript" src="../Scripts/LicenseCheck.js"></script>
    <script type="text/javascript" src="../Scripts/App.js"></script>
</head>
<body>

       <div id="jqxNotification"></div>
    <div id="loadingContainer" style="text-align:center">
         <img id='loading' src="../Images/loading3.gif" alt="loading" style='display:none'>
    </div>
   
    
    <div id="dataTableHolder" >
        <div id="jqxDatatable"></div>
    </div>

    <div id="fail"></div>
</body>
</html>

function drawEnclosureSummaryData(EnclosureAnimalObjArray) {
    var EnclosureObj, EnclosureID;

    $.jStorage.set('EnclosureObject', EnclosureAnimalObjArray.data[0]);

    EnclosureObj = $.jStorage.get('EnclosureObject');
    EnclosureID = EnclosureObj.EnclosureID;

    $(document).data(ENCLOSURE_ID, EnclosureID);

    $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .enclosure_name').html(EnclosureObj.Name);
    //$.jStorage.get(INSTITUTION)

    $('#' + APP_UI_CONTAINER_ELEMENT_ID).empty();

    getTaxaListForEnclosure(EnclosureObj.EnclosureID, false);

    if(FCurrentTaxa > -1){
        $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .common').html(FTaxaObjectList[FCurrentTaxa].Common);
        $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .gss').html(FTaxaObjectList[FCurrentTaxa].Scientific);
    }
    else{
        $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .common').html('');
        $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .gss').html('');
    }

    $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID).show();
    $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).show();

    resize_appui();
}

function drawTaxaDetailDisplay() {
    //FTaxaObjectList[FCurrentTaxa].Rank;  .Range;  .Endangered;  .Venomous;

    if(FCurrentTaxa == -1){
        return;
    }

    $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID).hide();
    $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).hide();

    $('#' + APP_UI_CONTAINER_ELEMENT_ID).append('<div id="overlay">' +
        '<div class="taxa"><div class="common"></div><div class="gss"></div></div>' +
        '<div class="enclosure_name"></div>' +
        '<div class="back"><div class="fingerprint_filled"></div>BACK</div>' +
        '<div class="notes"><div class="habitat"></div><div class="species"></div></div>' +
        '</div>');

    $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay .taxa .common').html(FTaxaObjectList[FCurrentTaxa].Common);
    $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay .taxa .gss').html(FTaxaObjectList[FCurrentTaxa].Scientific);
    $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay .enclosure_name').html($.jStorage.get('EnclosureObject').Name);

    $("#overlay").data("TaxID", FTaxaObjectList[FCurrentTaxa].TaxID);
    $("#overlay").data(LOAD_TIME_MILLIS, currentTimeMillis());

    populateTaxaNotes(FTaxaObjectList[FCurrentTaxa].Notes, HABITAT_INFO_NOTE_TYPE, $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay .notes .habitat'));
    populateTaxaNotes(FTaxaObjectList[FCurrentTaxa].Notes, SPECIES_INFO_NOTE_TYPE, $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay .notes .species'));

    resize_appui();

    $('#overlay .back').hammer({ dragLockToAxis: true });
    $(document).off('tap', '#overlay .back');
    $(document).on('tap', '#overlay .back', function(){
        $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay').remove();

        $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID).show();
        $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).show();
    });
}

function drawTaxaListingDisplay(TaxaObjectArray) {
    var noAnimals = TaxaObjectArray.data == EMPTY_RESULT_SET_INDICATOR;

    if(JSON.stringify(TaxaObjectArray.data) == JSON.stringify(FTaxaObjectList))
        return true;

    FCurrentTaxa = -1;

    if (noAnimals)
        FTaxaObjectList = Array();
    else
        FTaxaObjectList = TaxaObjectArray.data;

    if(noAnimals) {
        $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).html('No Animals In This Enclosure.');
    }
    else {
        FCurrentTaxa = 0;

        $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).html('');

        $('<div>').attr({
            id: "more_info_div",
        }).html('MORE<div class="fingerprint_filled"></div>INFO')
        .appendTo($('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID));

        $('#appui_foot #more_info_div').hammer({ dragLockToAxis: true });
        $(document).off('tap', '#appui_foot #more_info_div');
        $(document).on('tap', '#appui_foot #more_info_div', function(){
            drawTaxaDetailDisplay();
        });

        $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).append('<div id="CarouselDivContainer"><div id="CarouselDiv"></div></div>');

        $.each(FTaxaObjectList, function(idx, TaxaObject) {
            var TaxID, DivID, IMGDivID;

            TaxID = TaxaObject.TaxID;
            DivID = "Tax" + TaxID;
            IMGDivID = "Img" + TaxID;

            $('<div>').attr({
                'id': DivID,
                'class': "taxaDiv",
                'taxid': TaxID,
                'index': idx
            }).appendTo("#CarouselDiv");

            $('<div>').attr({
                id: IMGDivID,
                class: "mediaDiv"
            }).appendTo("#" + DivID);

//            getMediaForTaxa(TaxID, VISITOR_ENGAGEMENT_TAXA_MEDIA_TAG);
            if(TaxaObject.Media != undefined){
                populateTaxaImage(TaxID, TaxaObject.Media[0].MediaMasterID);
            }
        });
    }

    $('#CarouselDiv div.taxaDiv').removeClass('selected');
    $('#CarouselDiv div.taxaDiv:first').addClass('selected');

    carousel_enclosure_animals = new Carousel("#CarouselDivContainer", "#CarouselDiv", "div.taxaDiv");
    carousel_enclosure_animals.init();
    carousel_enclosure_animals.set_pane($('#CarouselDiv div.taxaDiv.selected').index());
    carousel_enclosure_animals_on_set_pane();
    carousel_enclosure_animals.set_on_set_pane(carousel_enclosure_animals_on_set_pane);
}

function getTaxaListForEnclosure(EnclosureID, isAsync) {
    var URI;

    URI = LOOKUP_ISAPI_URI + ENCLOSURE_TAXA_LIST_POSTFIX + SLASH + EnclosureID +
          QUESTION + DATATYPE_PAIR_NAME + EQUALS + TAXA_DATATYPE +
          AMPER + IMAGE_TYPE_PAIR_NAME + EQUALS + VISITOR_ENGAGEMENT_TAXA_MEDIA_TAG +
          AMPER + NOTES_CATEGORIES_PAIR_NAME + EQUALS + SPECIES_INFO_NOTE_TYPE + COMMA + HABITAT_INFO_NOTE_TYPE +
          AMPER + sessionIDQuerystringPair(false);

    getTracksAjax(URI, function(JSONResponseArray) {
        drawTaxaListingDisplay(JSONResponseArray);
    }, isAsync);
}

function getEnclosureIDFromBeacon(BeaconID) {
    var URI;

    if(BeaconID == null || BeaconID == '') {
        console.log("why is beacon null?");
        return false;
    }

    URI = LOOKUP_ISAPI_URI + LOOKUP_ENCLOSURE_POSTFIX + QUESTION +
          ENCLOSURE_IDENTIFIER_TYPE + EQUALS + SIGNAGE_IDENTIFIER_TYPE + AMPER +
          ENCLOSURE_ID + EQUALS + BeaconID + AMPER + sessionIDQuerystringPair(false);

    getTracksAjax(URI, function(JSONResponseArray) {
        if(BeaconID != SESSION_CHECK_CALL_TAG)
            drawEnclosureSummaryData(JSONResponseArray);
    }, false);
}

function getQueryStringAssocArray(HrefString) {
    var ReturnArray, HrefArray;

    ReturnArray = {};
    HrefArray = HrefString.split("?");

    if(HrefArray.length > 1) {
        $.each(HrefArray[1].split("&"), function(idx, Pair) {
            var PairArray = Pair.split("=");

            if(PairArray.length > 1)
                ReturnArray[PairArray[0]] = decodeURIComponent(PairArray[1]);
        });
    }

    return ReturnArray;
}

function validateLogin(userName, password) {
    var URI;

    URI = LOOKUP_ISAPI_URI + LOGIN_POSTFIX + QUESTION +
          "UserName" + EQUALS + userName + AMPER +
          "Password" + EQUALS + password;

    getTracksAjax(URI, function(JSONResponseArray) {
        setLoggedIn(JSONResponseArray);
    });
}

function populateTaxaImage(TaxonomyID, MediaMasterID) {
    var IMGTag, DivID;

    DivID = "Img" + TaxonomyID;
    IMGTag = '<img src="' + LOOKUP_ISAPI_URI + MEDIA_POSTFIX + SLASH + MediaMasterID +
             QUESTION + RETURN_TYPE_PAIR_NAME + EQUALS + LARGE_IMAGE_RETURN_TYPE +
             AMPER + sessionIDQuerystringPair(true) + '">';

    $("#" + DivID).html(IMGTag);
}

function populateTaxaNotes(NotesObjArray, NoteType, elm) {
    elm.html('');
    if(NotesObjArray.data == EMPTY_RESULT_SET_INDICATOR){
        return;
    }
    $.each(NotesObjArray, function(idx, NoteObj) {
        if(NoteObj.Category == NoteType)
            elm.append($('<div>').html(NoteObj.Note));
    });
}

function setLoggedIn(LoginResponse) {
    var SessionID = LoginResponse.data.TracksSessionID;
                                              
    $.jStorage.set(SESSION_COOKIE_NAME, SessionID);

    reset();
}

function checkLoginCookies() {
    var SessionID;

    SessionID = $.jStorage.get(SESSION_COOKIE_NAME);

    if (SessionID == null || SessionID == NOT_LOGGED_IN) {
        $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

        return NOT_LOGGED_IN;
    }
    else {
        $.jStorage.set(SESSION_COOKIE_NAME, SessionID);

        return LOGGED_IN;
    }
}

function getTracksAjax(URI, callback, isAsync) {
    var request, useAsync;
                
    //if cross origin
    URI = URI +((URI.indexOf(QUESTION) >= 0) ? AMPER : QUESTION) + "no_cache" + EQUALS + new Date().getTime();
    
    if(isAsync == undefined)
        useAsync = true;
    else
        useAsync = isAsync;

    request = $.ajax({
        type: REQUEST_TYPE_GET,
        async: useAsync,
        url: URI,
        timeout: 20000,
        dataType: DATA_TYPE_JSON
    });

    request.success(callback);

    request.error(function(XMLHttpRequest, TextStatus, ErrorThrown) {
        var JSONResponseArray, ErrorText;
        JSONResponseArray = $.parseJSON(XMLHttpRequest.responseText);

        if(JSONResponseArray != null) {
            ErrorText = JSONResponseArray.error.response_code;
            if(TextStatus === "timeout") {
                if(URI.indexOf(SPECIES_INFO_NOTE_TYPE + COMMA + HABITAT_INFO_NOTE_TYPE) > 0)
                    getTaxaListForEnclosure($(document).data(ENCLOSURE_ID), isAsync);
            }
    /* if execution goes to this block, and the call was made
       with the check call tag string, the check call ran into
       bad session and bombed. Reset session cookie and call reset() */
            else if(URI.indexOf(SESSION_CHECK_CALL_TAG) > 0) {   
                $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

                reset();
            }
            else
                alert("An error occurred communicating with the server. Please reload the application.");
        }
    });
//    request.error(function(XMLHttpRequest) {
//        var JSONResponseArray, ErrorText;
//        JSONResponseArray = $.parseJSON(XMLHttpRequest.responseText);
//        /* Timeout is being enforced at 20 seconds. In this application,
//           the only timeout vulnerability that is being addressed is
//           that the NextTaxonomyMetaStack could be empty, so the call
//           to build it from server data is made. Other vulnerabilities
//           to timeout may be discovered later. */
//        if(TextStatus === "timeout") {
//            if(NextTaxonomyMetaStack == null || !NextTaxonomyMetaStack.hasMetaObjects())
//                getTaxaListForEnclosure($("#" + APP_UI_CONTAINER_ELEMENT_ID).data("EnclosureID"));
//        }
//        if(JSONResponseArray != null) {
//            ErrorText = JSONResponseArray.error.response_code;
//            console.log(ErrorText);
//    /* if execution goes to this block, and the call was made
//       with the check call tag string, the check call ran into
//       bad session and bombed. Reset session cookie and call reset() */
//            if(URI.indexOf(SESSION_CHECK_CALL_TAG) > 0) {       
//                $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);
//
//                reset();
//            }
//            else
//                alert("An error occurred communicating with the server. Please reload the application.");
//        }
//    });
}

function getSystemSetting(settingName) {
    var QueryString, URI, request, settingValue;

    QueryString = sessionIDQuerystringPair(false) + AMPER + SETTING_ID_PAIR_NAME + EQUALS + settingName;
    URI = LOOKUP_ISAPI_URI + SYSTEMSETTING_POSTFIX + QUESTION + QueryString;

    request = $.ajax({
        type: REQUEST_TYPE_GET,
        async: false,
        url: URI,
        dataType: DATA_TYPE_JSON
    });

    request.success(function(JSONResponse) {
        settingValue = JSONResponse.data;
    });

    request.error(function(XMLHttpRequest) {
        var JSONResponseArray, ErrorText;
        JSONResponseArray = $.parseJSON(XMLHttpRequest.responseText);

        if(JSONResponseArray != null) {
            ErrorText = JSONResponseArray.error.response_code;
            settingValue = -1;
            console.log(ErrorText);
        }
    });

    return settingValue;
}

function reset(count) {
    var LoginThingy, SessionFault, PreLoadEncID, timer;

    timer = $.timer(function() {

        if($("#overlay").length > 0) {
            var TimeOnPageMinutes =
             (currentTimeMillis() - $("#overlay").data(LOAD_TIME_MILLIS)) / 60000;

            if(TimeOnPageMinutes > DETAIL_PAGE_TIMEOUT_MINUTES) {
                $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' #overlay').remove();

                $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID).show();
                $('#' + APP_UI_FOOT_CONTAINER_ELEMENT_ID).show();
            }
        }
        else {
            getTaxaListForEnclosure($(document).data(ENCLOSURE_ID));
        }
    });

    timer.set({ time : FRESH_DATA_CHECK_INTERVAL_SECONDS * 1000, autostart : true });

    PreLoadEncID = getQueryStringAssocArray($(location).attr("href"))[ENCLOSURE_ID];

    if (count == undefined){
        count = 10;
    }
    if(count == 0){
        return;
    }

    LoginThingy = checkLoginCookies();

    if(LoginThingy == NOT_LOGGED_IN){
        validateLogin(VISITOR_USER, VISITOR_PASS);
    }
    else {
        try {
            SessionFault = false;
            getEnclosureIDFromBeacon(SESSION_CHECK_CALL_TAG);
        } // if the session is bad, the above call will bomb, but doesn't seem to throw exception
        catch(e) { // if it bombs we know that the session cookie is out of sync with the server
            console.log(e);
            SessionFault = true;
                                                            
            $.jStorage.set(SESSION_COOKIE_NAME, NOT_LOGGED_IN);

            reset(count - 1);
        }

        if(!SessionFault) {
            if(PreLoadEncID != null)
                getEnclosureIDFromBeacon(PreLoadEncID);
            else {
                $("#StartButton").attr("disabled", false);

                $('#StartButton').hammer({ dragLockToAxis: true });
                $(document).off('tap', '#StartButton');
                $(document).on('tap', '#StartButton', function(){
                    getEnclosureIDFromBeacon($('#BeaconID').val());
                });

                $.jStorage.set(INSTITUTION, getSystemSetting(INSTITUTION));
            }
        }
    }
}

function sessionIDQuerystringPair(NoDynamic) {
    if(NoDynamic)
        return SESSION_ID_NAME + EQUALS + $.jStorage.get(SESSION_COOKIE_NAME);
    else
        return SESSION_ID_NAME + EQUALS + $.jStorage.get(SESSION_COOKIE_NAME) + AMPER + "dt=" + Date.now();
}

$(function(){
    $(window).on('resize', resize_appui);

    function doOnOrientationChange(){
        resize_appui();
    }
    window.addEventListener('orientationchange', doOnOrientationChange);
    // Initial execution if needed
    doOnOrientationChange();
});

function resize_appui(){
    var new_height;
    new_height = $('html').outerHeight(true);
    if($('#appui_head').css('display') != 'none'){
        new_height = new_height - $('#appui_head').outerHeight(true);
    }
    if($('#appui_foot').css('display') != 'none'){
        new_height = new_height - $('#appui_foot').outerHeight(true);
    }
    $('#appui').height(new_height);
    if($('#appui_head').css('display') != 'none'){
        if(carousel_enclosure_animals != null){
            $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' img').attr('src', '');
            carousel_enclosure_animals_on_set_pane();
        }
    }
    else{
        reset_body_image_size();
    }
}

function reset_body_image_size(){
    var img_height, img_width, container_height, container_width;

    //make full width [x], and show center of image []?...

    img_height = $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' img').height();
    img_width = $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' img').width();

    if((img_height * img_width) == 0){
        img_height = $('#CarouselDiv .taxaDiv.selected .mediaDiv img').height();
        img_width = $('#CarouselDiv .taxaDiv.selected .mediaDiv img').width();
    }

    container_height = $("#" + APP_UI_CONTAINER_ELEMENT_ID).height();
    container_width = $("#" + APP_UI_CONTAINER_ELEMENT_ID).width();

    if((container_height / container_width) > (img_height / img_width)){
        $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').height('100%');
        $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').width('');
    }
    else{
        $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').width('100%');
        $('#' + APP_UI_CONTAINER_ELEMENT_ID + ' img').height('');
    }
    $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').css('margin', 0);
    //set_body_image_animation(container_height, container_width, img_height, img_width);
}
/*
//function set_body_image_animation(container_height, container_width, img_height, img_width){
//    var max_margin;
//
//    $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').stop();
//
//    if((container_height / container_width) > (img_height / img_width)){
//        if($("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').width() == 0){
//            setTimeout(function(){set_body_image_animation(container_height, container_width, img_height, img_width)}, 250);
//        }
//        max_margin = container_width - $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').width();
//        if(Math.abs(max_margin) > 50){
//            $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').animate({
//                marginLeft: max_margin,
//            }, Math.abs(max_margin * 40), function() {
//                $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').animate({
//                    marginLeft: 0,
//                }, Math.abs(max_margin * 40), function() {
//                    set_body_image_animation(container_height, container_width, img_height, img_width);
//                });
//            });
//        }
//    }
//    else{
//        if($("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').height() == 0){
//            setTimeout(function(){set_body_image_animation(container_height, container_width, img_height, img_width)}, 250);
//        }
//        max_margin = container_height - $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').height();
//        if(Math.abs(max_margin) > 50){
//            $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').animate({
//                marginTop: max_margin,
//            }, Math.abs(max_margin * 40), function() {
//                $("#" + APP_UI_CONTAINER_ELEMENT_ID + ' img').animate({
//                    marginTop: 0,
//                }, Math.abs(max_margin * 40), function() {
//                    set_body_image_animation(container_height, container_width, img_height, img_width);
//                });
//            });
//        }
//    }
//}
*/
function carousel_enclosure_animals_on_set_pane(){
    var selected_index;

    if(carousel_enclosure_animals.panes.eq(carousel_enclosure_animals.current_pane).attr('index') == $('#CarouselDiv div.taxaDiv.selected').attr('index')){
        if($('#' + APP_UI_CONTAINER_ELEMENT_ID + ' img').attr('src') == $('#CarouselDiv .taxaDiv.selected .mediaDiv img').attr('src')){
            return;
        }
    }

    $('#CarouselDiv div.taxaDiv').removeClass('selected');
    carousel_enclosure_animals.panes.eq(carousel_enclosure_animals.current_pane).addClass('selected');

    selected_index = $('#CarouselDiv div.taxaDiv.selected').attr('index');
    FCurrentTaxa = selected_index;
    $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .common').html(FTaxaObjectList[FCurrentTaxa].Common);
    $('#' + APP_UI_HEAD_CONTAINER_ELEMENT_ID + ' .taxa .gss').html(FTaxaObjectList[FCurrentTaxa].Scientific);

    $('#CarouselDiv div.taxaDiv').each(function(idx) {
        var current_index;
        current_index = $(this).attr('index');

        $(this).find('img').height(170 * Math.pow(0.8, Math.abs(selected_index - current_index)));
        $(this).find('img').css('marginTop', 170 - (170 * Math.pow(0.8, Math.abs(selected_index - current_index))));
    });

    carousel_enclosure_animals.set_pane(carousel_enclosure_animals.current_pane, false);

    $('#' + APP_UI_CONTAINER_ELEMENT_ID).html($('#CarouselDiv .taxaDiv.selected .mediaDiv').html());

    reset_body_image_size();
}

function currentTimeMillis() {
    return new Date().getTime();
}

var carousel_enclosure_animals = null;
var FTaxaObjectList = Array(); //probably should be in jstorage instead
var FCurrentTaxa = -1;         //probably should be in jstorage instead

var LOOKUP_ISAPI_URI = SERVER_HREF + '/tracks/tracksmobile.dll';
var APP_UI_CONTAINER_ELEMENT_ID = 'appui';
var APP_UI_HEAD_CONTAINER_ELEMENT_ID = 'appui_head';
var APP_UI_FOOT_CONTAINER_ELEMENT_ID = 'appui_foot';
var INSTITUTION = "InstitutionName";
var REQUEST_TYPE_GET = 'get';
var REQUEST_TYPE_POST = 'post';
var DATA_TYPE_JSON = 'json';
var SESSION_COOKIE_NAME = 'VisitTouchSessID';
var SESSION_ID_NAME = 'TracksSessionID';
var NOT_LOGGED_IN = "not-logged-in";
var LOGGED_IN = "logged-in";
var VISITOR_USER = 'demo';
var VISITOR_PASS = 'demo';
var LOGIN_POSTFIX = '/login';
var AMPER = "&";
var EQUALS = "=";
var QUESTION = "?";
var SLASH = "/";
var COMMA = ",";
var SESSION_CHECK_CALL_TAG = "t-t-7-ß-4$^00b"
var EMPTY_RESULT_SET_INDICATOR = "NO_RECORDS";
var LOOKUP_ENCLOSURE_POSTFIX = '/guest-enclosure-lookup';
var ENCLOSURE_TAXA_LIST_POSTFIX = '/guest-enclosure';
var ANIMAL_INFO_POSTFIX = '/guest-animal';
var TAXA_INFO_POSTFIX = '/guest-taxa';
var SYSTEMSETTING_POSTFIX = '/systemsetting';
var VISITOR_ENGAGEMENT_TAXA_MEDIA_TAG = 'visitor engagement';
var MEDIA_POSTFIX = '/media';
var ENCLOSURE_IDENTIFIER_TYPE = 'IdentifierType';
var ENCLOSURE_ID = 'IdentifierValue';
var BEACON_IDENTIFIER_TYPE = 'Beacon%20ID';
var SIGNAGE_IDENTIFIER_TYPE = 'Signage%20ID';
var DATATYPE_PAIR_NAME = 'datatype';
var TEXT_PAIR_NAME = 'Text';
var RETURN_TYPE_PAIR_NAME = 'ReturnType';
var IMAGE_TYPE_PAIR_NAME = 'ImageTags';
var NOTES_CATEGORIES_PAIR_NAME = 'NotesCategories';
var SETTING_ID_PAIR_NAME = 'settingid';
var TAXA_DATATYPE = 'taxa';
var ANIMALS_DATATYPE = 'animals';
var ACTIVITY_DATATYPE = 'activity';
var IMAGE_DATATYPE = 'image';
var NOTES_DATAYPE = 'notes';
var SPECIES_INFO_NOTE_TYPE = 'Species Characteristics';
var HABITAT_INFO_NOTE_TYPE = 'Habitat';
var LARGE_IMAGE_RETURN_TYPE = 'file';
var LOAD_TIME_MILLIS = "LoadTime";
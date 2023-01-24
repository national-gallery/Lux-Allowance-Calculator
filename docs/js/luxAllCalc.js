var types
var profiles
var diff
var days
var use
var profs
var newInputs = true;
var link
var urlParams

var typeDefault = false;
var profileDefault = false;

var extraProfiles;
var extraTypes;

var now = new Date()
//console.log(now);
var then = new Date(now)
then.setDate(now.getDate() + 6)

var ie11 = false;
var ua = window.navigator.userAgent;
var trident = ua.indexOf('Trident/');
if (trident > 0) {ie11 = true;}

const queryString = window.location.search;

var vars = {'start':now, 'end':then, 'type':false,
	'prof':false,	'luxlevel':false, 'maintenanceLux':false,
	'overnightLux':false, 'maxLux':false, 'period':false, 
	'url': false, 'debug':false, "annual":false, "data":false,
  "custom":false}

// required if people still using ie11	
if (ie11) {
  checkurlParams = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null){
       return null;
    }
    else {
       return decodeURI(results[1]) || 0;
    }}

  for (var key in vars)
	{if (checkurlParams(key))
		{if (key == "start" || key == "end")
			{vars[key] = new Date(checkurlParams(key) + "T00:00")}
		 else
			{vars[key] = checkurlParams(key)}}}
  }
else {
	urlParams = new URLSearchParams(queryString);
	for (var key in vars)
	{if (urlParams.has(key))
		{
    //console.log(key + ": " +urlParams.get(key))
    if (key == "start" || key == "end")
			{vars[key] = new Date(urlParams.get(key) + "T00:00")}
		 else
			{vars[key] = urlParams.get(key)}}}}
    
if(vars["data"])
  {
  const d1 = Base64.toUint8Array(vars["data"].slice(5));      
  const d2 = pako.inflate(d1, { to: 'string' })
  const dvars = JSON.parse(d2);
  //console.log(dvars)
  
  for (var key in dvars)
    {
    if (key == "start" || key == "end")
			{vars[key] = new Date(dvars[key])}
		 else
			{vars[key] = dvars[key];}
    }
  }
     
//console.log(vars);

if (vars["url"]) {
  //console.log("Adding external settings: "+vars["url"]);
  fetch(vars["url"])
    .then((response) => {
      if (!response.ok) {
	throw new Error('Network response was not OK');
	}
      return response.json()
      })
    .then((json) => 
      {
      extraProfiles = json["light-profiles"];
      extraTypes = json["object-types"]; 
      types = $.extend(types, json["object-types"]); 
      profiles = $.extend(profiles, json["light-profiles"]); 
      })
  .catch((error) => {
    console.error('There has been a problem with your fetch operation:', error);
  });  
  }

var dayLuxTotals = {	
	sunday:0,
	monday:0,
	tuesday:0,
	wednesday:0,
	thursday:0,
	friday:0,
	saturday:0
	};

const dayNames = Object.keys(dayLuxTotals);

function buildDropdowns () {
		// ------------------------------------------------------- //
		// Multi Level dropdowns
		// ------------------------------------------------------ //
		$("ul.dropdown-menu [data-toggle='dropdown']").on("click", function(event) {
			event.preventDefault();
			event.stopPropagation();

			$(this).siblings().toggleClass("show");

			if (!$(this).next().hasClass('show')) {
				$(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
				}
			$(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
				$('.dropdown-submenu .show').removeClass("show");
				});
			});
		}

function showDebug(str)
	{if (vars["debug"])
		{console.log("DEBUG");
		 console.log(str);}}
	
function validateValues (inputID, str)
	{
	var cInput = document.getElementById(inputID);
	cInput.value = str;
	}

// From: https://www.freecodecamp.org/forum/t/how-to-capitalize-the-first-letter-of-a-string-in-javascript/18405
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function luxUpdate (inputID)
	{var cInput = document.getElementById(inputID);
	 vars[inputID] = parseInt(cInput.value);
	 luxValidate (inputID);	
	 calculateAllowance()}
   

function otherUpdate (inputID, min=0, max=100)
	{var cInput = document.getElementById(inputID);
	 vars[inputID] = parseInt(cInput.value);
	 otherValidate (inputID, min, max);	
	 calculateAllowance()}

function luxValidate (inputID)
	{
	var inputLU = document.getElementById(inputID);
	$(inputLU).removeClass("alert-success alert-danger alert-warning");
	
	if (vars[inputID] === false || vars[inputID] == use[inputID])
		{vars[inputID] = parseInt(use[inputID]);}
	else if (vars[inputID] > vars['maxLux'] && inputID != "annual")
		{showDebug (inputID + " limited to the value of maxLux: "+vars['maxLux']);
		 vars[inputID] = parseInt(vars['maxLux']);
		 $(inputLU).addClass("alert alert-danger");}
	else
		{$(inputLU).addClass("alert alert-warning");}	
	inputLU.value = vars[inputID];
	}
  
function otherValidate (inputID, min, max)
	{
	var inputLU = document.getElementById(inputID);
	$(inputLU).removeClass("alert-success alert-danger alert-warning");
	
	if (vars[inputID] === false || vars[inputID] == use[inputID])
		{vars[inputID] = parseInt(use[inputID]);}
	else if (vars[inputID] > max)
		{showDebug (inputID + " limited to the value of "+ max);
		 vars[inputID] = parseInt(max);
		 $(inputLU).addClass("alert alert-danger");}
	else if (vars[inputID] <  min)
		{showDebug (inputID + " must be greater than "+ min);
		 vars[inputID] = parseInt(min);
		 $(inputLU).addClass("alert alert-danger");}
	else
		{$(inputLU).addClass("alert alert-warning");}
	inputLU.value = vars[inputID];
	}
	
function typeUpdate()
	{
	vars["type"] = document.getElementById("type").value
	use = types[vars["type"]]
	vars['maxLux'] = parseInt(use['maxLux']);
	vars['annual'] = parseInt(use['annual']);
	vars['luxlevel'] = parseInt(use['luxlevel']);
	$(".form-control").removeClass("alert alert-warning");
	vars['maintenanceLux'] = parseInt(use['maintenanceLux']);
	vars['overnightLux'] = parseInt(use['overnightLux']);
	vars['period'] = parseInt(use['period']);
	populateInputs()
	}

function profUpdate()
	{
	vars["prof"] = document.getElementById("prof").value
	prof = profiles[vars["prof"]];
	populateInputs()
	}

function dateUpdate()
	{
	var startStr = document.getElementById("start").value
	vars["start"] = new Date(startStr+"T00:00")
	var endStr = document.getElementById("end").value
	vars["end"] = new Date(endStr+"T00:00")
	
	if (vars["start"] == "Invalid Date")
		{vars["start"] = now;
		 validateValues ("start", getDateStr(vars["start"]))}
	if (vars["end"] == "Invalid Date")
		{vars["end"] = then;
		 validateValues ("end", getDateStr(vars["end"]))}

	calculateAllowance()
	}
	
function populateInputs()
	{
	var inputStart = document.getElementById("start");
	var inputEnd = document.getElementById("end");
	var selectType = document.getElementById("type");
	var selectProf = document.getElementById("prof");
	var inputAN = document.getElementById('annual');
  		
	if (newInputs) {    
    var customProfile = false;
		for (var key in types)
			{
       if (types[key].hasOwnProperty("selected"))
          {if(types[key]["selected"])
            {typeDefault = key;}}
       var el = document.createElement("option"); 
			 el.textContent = key; 
			 el.value = key; 
			 selectType.appendChild(el);}
		for (var key in profiles)
			{if (key.toLowerCase() == "custom")
        {customProfile = true;}       
       if (profiles[key].hasOwnProperty("selected"))
          {if(profiles[key]["selected"])
            {profileDefault = key;}
           // this extra field breaks the calculations so it should be 
           // removed, if present, at this stage
           delete profiles[key]["selected"];}
       var el = document.createElement("option"); 
			 el.textContent = key; 
			 el.value = key; 
			 selectProf.appendChild(el);}
  
    if (!customProfile) {
      var el = document.createElement("option"); 
			 el.textContent = "Custom"; 
			 el.value = "Custom"; 
			 selectProf.appendChild(el);
       profiles["Custom"] = {"default": {
				"openingHours": 8,
				"maintenance": 2
			}};}
	
		newInputs = false;}

  inputStart.value = getDateStr(vars["start"])
	inputEnd.value = getDateStr(vars["end"])
     
  if (typeof types[vars["type"]] == 'undefined') {
    if (typeDefault) {vars["type"] = typeDefault;}
    else {vars["type"] = Object.keys(types)[0];}
    }
	selectType.value = vars["type"];
  
  if (vars["type"] == "Special Light Sensitivity")
    {$("#annual").removeAttr('readonly');}
  else
    {$("#annual").attr('readonly','readonly');}
    
	var displayDetails = document.getElementById('typeComment');
	displayDetails.innerHTML = types[vars["type"]]["comment"];	
       
  if (typeof profiles[vars["prof"]] == 'undefined') {
		if (profileDefault) {vars["prof"] = profileDefault;}
    else {vars["prof"] = Object.keys(profiles)[0];}}
	selectProf.value = vars["prof"];

  if (vars["prof"] == "Custom")
    {$('#customGroup').show();}
  else
    {$('#customGroup').hide();}
    
	use = types[vars["type"]]
	prof = profiles[vars["prof"]];

	var str = "";
  var ohs;
  var xhs;
  
	for (var key in prof)
		{
		var ca = prof[key]
    
    if (ca["openingHours"] == 1) {ohs = "hr"}
    else {ohs = "hrs"}
    
    if (ca["maintenance"] == 1) {xhs = "hr"}
    else {xhs = "hrs"}
		
		if (key !== "default")
			{
      var closed = false;
            
      if (ca["openingHours"] > 0)
        {opStr = "open for " + ca["openingHours"] + " "+ohs;}
      else
        {opStr = "Closed";
         closed = true;}
         
      if (ca["maintenance"] > 0)
        {          
        if (closed) {
          exStr = ", with " + ca["maintenance"] + " "+xhs+" for cleaning, maintenance and security activities";}
        else {
          exStr = ", plus an extra " + ca["maintenance"] + " "+xhs;}
        }
      else
        {exStr = "";}
         
      str = str + "<br/>&nbsp;&nbsp;&nbsp;&nbsp; + " + capitalizeFirstLetter(key) + ": " + opStr + exStr;
      }
		else
			{str = str + "Open for " + ca["openingHours"] + " "+ohs+" a day, with an extra " + ca["maintenance"] + " " + xhs + " for cleaning, maintenance and security activities"}
		}

	displayDetails = document.getElementById('profileDetails');
	displayDetails.innerHTML = str;

	if (!vars['maxLux'])
		{vars['maxLux'] = parseInt(use['maxLux']);}
		
	if (!vars['period'])
		{vars['period'] = parseInt(use['period']);}	
			
	if (!vars['annual'])
		{vars['annual'] = parseInt(use['annual']);}
	inputAN.value = vars['annual'];

	luxValidate ('luxlevel');
	luxValidate ('maintenanceLux');
	luxValidate ('overnightLux');
  otherValidate ('period', 0, 100);
	
	if(ie11) /*required to ensure values are displayed*/
		{showDebug("Updating padding on date inputs");
		 $( inputStart ).addClass('ie11date');
		 $( inputEnd ).addClass('ie11date')}

	calculateAllowance()
	}

function dayLuxTotal (cday)
	{
	// vars and prof are global variables

	if (typeof prof[cday] !== 'undefined') {var cp = prof[cday]}
	else	{var cp = prof["default"]}

	var dtotal =
		(vars["luxlevel"] * cp["openingHours"]) + // Standard opening times for this day
		(vars['maintenanceLux'] * cp["maintenance"]) + // Opening for cleaning and or security checks
		(vars['overnightLux'] * (24 - cp["openingHours"] - cp["maintenance"])); //overnight light levels

	dayLuxTotals[cday] = dtotal
	return (dtotal)
	}
	
function calculateAllowance()
		{
		showDebug("calculateAllowance")
		showDebug(vars)
		showDebug(use)
		showDebug(prof)
		
		// Formulate the Difference between two dates 
		diff = Math.ceil((vars["end"] - vars["start"])/1000); // return seconds
		showDebug(diff)
		days = Math.floor(diff / (60*60*24)) + 1;
    
    if (vars["annual"] > 0)
				{var useAnn = parseInt(vars["annual"]);}
			else
				{var useAnn = parseInt(use["annual"]);}
		var allowance = Math.floor(useAnn * (days/365));

		var t0 = performance.now()
		
		fullWeeks = Math.floor(days / 7);
		remainder = days - (fullWeeks * 7);

		var cluxvals = {}
		var weekLuxTotal = 0;
		
		dayNames.forEach(function (item, index) {
			weekLuxTotal = weekLuxTotal + dayLuxTotal (item);
			});

		showDebug(dayLuxTotals)
		showDebug("weekLuxTotal: " + weekLuxTotal)
		showDebug("days: " + days)
		showDebug("fullWeeks: " + fullWeeks)
		showDebug("remainder: " + remainder)
		var dn = 0
		var luxTotal = weekLuxTotal * fullWeeks
		showDebug("luxTotal (from full weeks) = " + weekLuxTotal + " * " + fullWeeks + " = " + luxTotal)
		
		while (dn < remainder)
			{const tcd = new Date(vars["start"])
			 const tcurrentDate = vars["start"].getDate()
			 tcd.setDate(vars["start"].getDate() + dn)
			 dayOfWeek = dayNames[tcd.getDay()]
			 luxTotal = luxTotal + dayLuxTotals[dayOfWeek]
			 showDebug("luxTotal (+ "+dayLuxTotals[dayOfWeek]+" for " +dayOfWeek+" ) = " + luxTotal)			
			 dn++}		

    dn = 0
		
		var resultsDetails = document.getElementById('result');
		$(resultsDetails).removeClass("alert-success alert-danger");
		
		remainder = Math.floor (allowance - luxTotal)

		var resultStr = "Exhibition (" + days + " days): Allowance: " + allowance + " Lux Hrs<br/>"
				
		if (remainder >= 0)
			{
			if (vars["luxlevel"] > 0)
				{var useLux = vars["luxlevel"];}
			else
				{var useLux = parseInt(use["luxlevel"]);}
		
			resultStr = resultStr + "Allocated: " + luxTotal + " Lux Hrs - this leaves "+ remainder +" Lux Hrs "+
				" to use for additional events." +
				"<br/>&nbsp;&nbsp;&nbsp;&nbsp;@ "+useLux+" lux this allows " +(remainder/useLux).toFixed(2)+ " hrs of exposure"+
				"<br/>&nbsp;&nbsp;&nbsp;&nbsp;@ "+(useLux*0.6).toFixed(0)+" lux (60%) this allows " +(remainder/(useLux*0.6)).toFixed(2)+ " hrs of exposure"+
				"<br/>&nbsp;&nbsp;&nbsp;&nbsp;@ "+(useLux*0.4).toFixed(0)+" lux (40%) this allows " +(remainder/(useLux*0.4)).toFixed(2)+ " hrs of exposure";
			 $(resultsDetails).addClass("alert-success");
       }
		else
			{      
      var allowancePerHour =   (useAnn * (1/365))/24;      
      var darkPeriod = (remainder * -1) / allowancePerHour;
      var ddays = Math.floor(darkPeriod/24);
      var dhours = Math.ceil(darkPeriod % 24);
      
      resultStr = resultStr + "Allocated: " + luxTotal + " Lux Hrs<br/>CAUTION - OVEREXPOSURE BY: " + (remainder * -1) + " Lux Hrs<br/>" +
        "(Required dark storage compensation: " +ddays+" Days "+dhours+" Hours ).";
			 $(resultsDetails).addClass("alert-danger");
      }

    //console.log(vars);
    //console.log(profiles["Custom"]);
    const pakoVars = vars;
    pakoVars["custom"] = profiles["Custom"];
    delete pakoVars["data"];
    const bmCompressed = pako.deflate(JSON.stringify(pakoVars), { level: 9 });
    const bmData = Base64.fromUint8Array(bmCompressed, true);
    const link = "./?data=pako:"+bmData;
    		
    //link = "?"
		//for (var key in vars)
//			{			
			//if (key == "start" || key == "end")
	//			{link = link + key+"="+getDateStr(vars[key])+"&"}
//			else
	//			{link = link + key+"="+vars[key]+"&"}
		//	}

//var linkData = {
//  "exProfiles" : extraProfiles,
//  "exTypes" : extraTypes,
//  "vars" : vars };

//console.log(vars);

  
//if (vars["prof"] == "Custom")
//  {
//console.log(linkData)
//console.log(bmURL)
//}
  
		document.getElementById('linkButton').href = link

		resultsDetails.innerHTML = resultStr;
		}


function getDateStr(dateVal)
	{
	var mn = pad((dateVal.getMonth() + 1),2)
	var dn = pad(dateVal.getDate(),2)

	var str = dateVal.getFullYear() + "-" +	mn + "-" + dn

	return(str)
	}
	
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}


let full = $("#customDetails").find(".form_field_outer_row").first().find("select").clone();

function schange ()
  {console.log("CHAGING")}
  
function resetDaySelectors (which = "add")
  {  
  const fullDaySelectorValues = [	
    "Default", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",  "Sunday"];
  var usedDaySelectorValues = [];
  var checkedDaySelectorValues = [];  
  
  // Remove change event from select elements so they are not fired as they are rebuilt.
  $("#customDetails").find(".form_field_outer_row").find("select").off();
  
  $("#customDetails").find(".form_field_outer_row").each(function( index ) 
    {
    var cv = $(this).find("select")[0].value;
    if (usedDaySelectorValues.includes(cv)) {
      $(this).find("select").find("option[value='"+cv).remove();
      cv = $(this).find("select")[0].value;}    
    if (!usedDaySelectorValues.includes(cv)) {
      usedDaySelectorValues.push(cv);}
    });  
  
  $("#customDetails").find(".form_field_outer_row").each(function( index ) 
    {    
    var cv = $(this).find("select")[0].value;
    
    if (index > 0) // Ignore the first row and leave untouched
      {      
      $(this).find("select").find("option").remove();
    
      // ensure that all possible options are added to the select
      for(var i=0;i<fullDaySelectorValues.length;i++)      
        {var optn = fullDaySelectorValues[i];
         var el = document.createElement("option");
         el.textContent = optn;
         el.value = optn;
         $(this).find("select").append(el);}
         
      // remove options that are in use already
        for(var i=0;i<usedDaySelectorValues.length;i++)
          {if (cv != usedDaySelectorValues[i] || checkedDaySelectorValues.includes(cv)) {
            $(this).find("select").find("option[value='"+usedDaySelectorValues[i]).remove();}}
           
      var here = $(this).find("select").val(cv).change();
      if (!here[0].value) {$(this).find("select").val($(this).find("select").find("option").first()[0].value).change();}
      }     
    
    if (!checkedDaySelectorValues.includes(cv))
      {checkedDaySelectorValues.push(cv);}
    }); 
   
  $("#customDetails").find(".form_field_outer_row").find("select").on('change', function() {resetDaySelectors("manual");});
  customValidate();
  }

function addCustomRow (rowToCopy=false, dayValue="default", openHrs=8, extraHrs=2)
  {  
  if (!rowToCopy)
    {rowToCopy = $("#customDetails").find(".form_field_outer_row").last()}
  
  var rowCopy = $(rowToCopy).clone(true);
  let formOuter = $(rowToCopy).closest(".form_field_outer");
  
  $(rowCopy).find("select").prop("disabled", false);  
  $(formOuter).last().append(rowCopy).find(".remove_node_btn_frm_field:not(:first)").prop("disabled", false);
  $(formOuter).find(".form_field_outer_row").last().find("select").prop("disabled", false);
  
  
  
  if (dayValue) {
    $(rowCopy).find("select").val(dayValue).change();}
  if (openHrs) {
    $(rowCopy).find(".openhrs").val(openHrs).change();}
  if (extraHrs) {
    $(rowCopy).find(".extrahrs").val(extraHrs).change();}
  resetDaySelectors("add");
 
  $(formOuter).find(".remove_node_btn_frm_field").first().prop("disabled", true);
        
  // Only allow a max of 7 settings.
  if ($(formOuter).find(".form_field_outer_row").length == 7)
    {$(formOuter).find(".add_node_btn_frm_field").prop("disabled", true);}  
  }
  
function customValidate ()
  {
  var newCustom = {};
  var error = false;
   
  //console.log("customValidate");
  
  $("#customDetails").find(".form_field_outer_row").find(".openhrs").removeClass("alert alert-success alert-danger alert-warning");
  $("#customDetails").find(".form_field_outer_row").find(".extrahrs").removeClass("alert alert-success alert-danger alert-warning");
  
  $("#customDetails").find(".form_field_outer_row").each(function( index ) 
    {
    var dv = $(this).find("select")[0].value.toLowerCase();
    var ov = $(this).find(".openhrs")[0].value;
    var ovInt = parseInt(ov);
    var xv = $(this).find(".extrahrs")[0].value;
    var xvInt = parseInt(xv);
     
    //console.log (typeof ov);
    //console.log (ov);
    //console.log (typeof ovInt);
    //console.log (ovInt);
    
    if (!ov)
      {error = true;
       $(this).find(".openhrs").addClass("alert alert-warning")}    
    else if (isNaN(ovInt) || ovInt < 0 || (ovInt + xvInt > 24))
      {error = true;
       $(this).find(".openhrs").addClass("alert alert-danger")}
       
    if (!xv)
      {error = true;
       $(this).find(".extrahrs").addClass("alert alert-warning")}    
    else if (isNaN(xvInt) || xvInt < 0 || (ovInt + xvInt > 24))
      {error = true;
       $(this).find(".extrahrs").addClass("alert alert-danger")}      

    newCustom[dv] ={
        "maintenance": xv,
        "openingHours": ov
      };      
    });  
    
  if (!error) {
    profiles["Custom"] = newCustom
    populateInputs();
    } 
  }
  
// JS plus relates html based on example provided at: https://bootstrapfriendly.com/blog/dynamically-add-or-remove-form-input-fields-using-jquery/ (26/09/22
///======Clone method
$(document).ready(function () { 
  
  if (vars["custom"])
    {profiles["Custom"] = vars["custom"]}
     
  if (profiles.hasOwnProperty("Custom"))
    {
    for (const [key, value] of Object.entries(profiles["Custom"])) {
      if (key != "default")
        {const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
         addCustomRow (false, capitalized, value["openingHours"], value["maintenance"]);}
      else
        {$("#customDetails").find(".form_field_outer_row").first().find(".openhrs").val(value["openingHours"]).change();
         $("#customDetails").find(".form_field_outer_row").first().find(".extrahrs").val(value["maintenance"]).change();}
      }
    }



  $("body").on("click", ".add_node_btn_frm_field", function (e) {
    e.preventDefault();
    addCustomRow ($(e.target).closest(".form_field_outer_row"), false, false, false);
  });



  $("body").on("click", "#updateCustom", function (e) {
    e.preventDefault();    
    
    var newCustom = {};
    var error = false;
    //profiles["Custom"] = {};
    
    $("#customDetails").find(".form_field_outer_row").each(function( index ) 
      {
      var dv = $(this).find("select")[0].value.toLowerCase();
      var ov = $(this).find(".openhrs")[0].value;
      var xv = $(this).find(".extrahrs")[0].value;
      
      //if (ov < 0 || xv < 0 || (ov + xv > 24))
      //  {error = "Hours values cannot be negative and they must add up to less than 24"}
      //else if (ov === 0 || xv === 0 )
      
            
      //profiles["Custom"][dv] ={
      newCustom[dv] ={
          "maintenance": xv,
          "openingHours": ov
        };      
    });  
    
    if (!error) {
      profiles["Custom"] = newCustom
      populateInputs();
      }
  }); 




  //===== delete the form field row
  $("body").on("click", ".remove_node_btn_frm_field", function () {
        
    // Only allow a max of 7 settings.
    if ($(this).closest(".form_field_outer").find(".form_field_outer_row").length == 7)
      {$(this).closest(".form_field_outer").find(".add_node_btn_frm_field").prop("disabled", false);}
      
    $(this).closest(".form_field_outer_row").remove();
    resetDaySelectors ("delete");
    
    //console.log("success");
  });
  
  // The period value is mot yet used in calculations
  $("#period").closest(".input-group").parent().addClass("d-none");
  $("#period").attr('readonly','readonly');
});

"use strict";

// STYLES AUTOCOMPLETE FORM

var selectEl = document.querySelector('#last-neighborhood')
accessibleAutocomplete.enhanceSelectElement({
    autoselect: true,
    confirmOnBlur: true,
    defaultValue: "",
    minLength: 2,
    selectElement: selectEl
})

// EVENT LISTENER ON FORM, RETRIEVE VALUE 

var ntaForm = document.getElementById('nta-form');

ntaForm.addEventListener('submit', function (event) {
    
    event.preventDefault();                      // prevent page re-load
    selectedName = event.target[0].value;    // gives you full neighborhood name
    selectedNeighborhood = event.target[0].value.slice(0, 4); // gives you NTA code

    document.getElementById('NTA').innerHTML = 'Your neighborhood: <h3><span style="font-weight:bold;color:#15607a">' + DOMPurify.sanitize(selectedName) + '</span></h3>';
    document.getElementById('yourneighb').style.display = "block";
    
    dataFilter(nyccasData);
    dataChange();
    
});

// Create and initialize variables

// 'data_repo' and 'data_branch' are created from Hugo variables in the aqe.html template

var nyccasData = [];
var neighborhoodData = [];
var selectedNeighborhood;
var selectedName = '';
var dPM = 0;
var dNO2 = 0;
var dBuildingEmissions = 0;
var dBuildingDensity = 0;
var dTrafficDensity = 0;
var dIndustrial = 0;
var tabShown = 'tab-01-a'; 

// path variables

var aqe_path   = data_repo + "/" + data_branch + "/key-topics/air-quality-explorer";
var nyccas_url = data_repo + "/" + data_branch + "/key-topics/air-quality-explorer/aqe-nta.csv";
var PMBarVGSpec  = aqe_path + "/" + "PMBarSpec.vg.json";
var NO2BarVGSpec = aqe_path + "/" + "NO2BarSpec.vg.json";
var embed_opt = {
    actions:false
};

// path to topo json, will be loaded by vega

var nta_topojson = data_repo + "/" + data_branch + "/geography/NTA.topo.json"; 

// the d3 code below loads the data from a CSV file and dumps it into global javascript object variable.

// LOAD DATA

d3.csv(nyccas_url, d3.autoType).then(data => {
    nyccasData = data;
}); 

// FILTER DATA BASED ON SELECTION FROM FORM

function dataFilter(data) {
    
    neighborhoodData = data.filter(sf => {

        // geo code used in aqe.html is the character NTACode, so using that here instead of numeric GEOCODE

        return sf.NTACode === selectedNeighborhood;

    });


}

// at this point we have: neighborhoodName (full name), ntaCode (4-digit), and neighborhooData (array of data)

// UPON SELECTION, UPDATES DATA

function dataChange() {
    
    selectedName = neighborhoodData[0].GEONAME;
    
    dPM = numRound(neighborhoodData[0].Avg_annavg_PM25);
    dNO2 = numRound(neighborhoodData[0].Avg_annavg_NO2);
    
    dBuildingEmissions = neighborhoodData[0].tertile_buildingemissions;
    dBuildingDensity = neighborhoodData[0].tertile_buildingdensity;
    dTrafficDensity = neighborhoodData[0].tertile_trafficdensity;
    dIndustrial = neighborhoodData[0].tertile_industrial;

    document.querySelector("#PM").innerHTML = dPM + ' μg/m<sup>3</sup>';
    document.querySelector("#NO2").innerHTML = dNO2 + ' ppb';
    document.querySelector("#BuildingEmissions").innerHTML = 'Building emissions<br><h5>' + tertileTranslate(dBuildingEmissions) + '</h5>';
    document.querySelector("#BuildingDensity").innerHTML = 'Building density<br><h5>' + tertileTranslate(dBuildingDensity) + '</h5>';
    document.querySelector("#TrafficDensity").innerHTML = 'Traffic density<br><h5>' + tertileTranslate(dTrafficDensity) + '</h5>';
    document.querySelector("#Industrial").innerHTML = 'Industrial area<br><h5>' + tertileTranslate(dIndustrial) + '</h5>';
    
    buildMap(
        mapUpdateID(tabShown), 
        aqe_path + "/" + mapUpdateSpec(tabShown), 
        nyccasData, 
        nta_topojson,
        selectedNeighborhood
    );
    // load the PM2.5 bar chart

    buildChart(
        "#PMbar", 
        PMBarVGSpec, 
        nyccasData,
        selectedNeighborhood
    );

    // load the NO2 bar chart

    buildChart(
        "#NO2bar", 
        NO2BarVGSpec, 
        nyccasData,
        selectedNeighborhood
    );
    
} 


// rounding function lets us round all numbers the same

function numRound(x) {
    return Number.parseFloat(x).toFixed(1);
} 


// Returns block-level badges for the tabs

function tertileTranslate(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse btn-block">high</span>';
        
    } else if (tertileVal == 2) {
        return '<span class="badge badge-medium btn-block">medium</span>';
        
    } else {
        return '<span class="badge badge-better btn-block">low</span>';
        
    };
}


// Returns in-line badges for text

function tertileTranslate2(tertileVal) {
    
    if (tertileVal == 3) {
        return '<span class="badge badge-worse">high</span>';
        
    } else if (tertileVal == 2) {
        return '<span class="badge badge-medium">medium</span>';
        
    } else {
        return '<span class="badge badge-better">low</span>';
        
    };
} 


// Returns map insert/update div IDs

function mapUpdateID(tabShown) {
    
    if (tabShown === "tab-01-a") {
        return '#BEmap';
        
    } else if (tabShown === "tab-01-d") {
        return '#BDmap';
        
    } else if (tabShown === "tab-01-b") {
        return '#Industrialmap';
        
    } else if (tabShown === "tab-01-c") {
        return '#Trafficmap';
        
    } else {
        console.log('Error: not sure which map to update');
    };
} 


// Returns map specs for proper tab context

function mapUpdateSpec(tabShown) {
    
    if (tabShown === "tab-01-a") {
        return `BEmapSpec.vg.json`;
        
    } else if (tabShown === "tab-01-d") {
        return `BDmapSpec.vg.json`;
        
    } else if (tabShown === "tab-01-b") {
        return `IndustrialmapSpec.vg.json`;
        
    } else if (tabShown === "tab-01-c") {
        return `TrafficmapSpec.vg.json`;
        
    } else {
        console.log('Error: not sure which map to update');
        
    };
} 


// function to build maps

function buildMap(div, spec, csv, topo, nbr) {
    
    d3.json(spec).then(spec => {
            
        // get data object whose url is "topo"
        
        var topo_url = spec.data.filter(data => {return data.url === "topo"})[0];
        
        // update url element of this data array (which updates the spec), because
        //  top_url is a shallow copy / reference to the spec
        
        topo_url.url = topo;
        
        vegaEmbed(div, spec, {actions: false})
            .then(async res => {

                var res_view = 
                    await res.view
                        .signal("selectNTA", nbr)
                        .insert("nyccasData", csv)
                        .logLevel(vega.Info)
                        .runAsync();

                // console.log("getState", res_view.getState());
                
            })
            .catch(console.error);

    });
}


// function to build charts
        
function buildChart(div, spec, csv, nbr) {

    d3.json(spec).then(spec => {

        vegaEmbed(div, spec, {actions: false})
            .then(res => {

                var res_view = 
                    res.view
                        .insert("nyccasData", csv)
                        .signal("selectNTA", nbr)
                        .logLevel(vega.Info)
                        .runAsync();

            })
            .catch(console.error);
        });
    }

// load the charts after the page loads

$( window ).on( "load", function() {

    console.log("load");

    // load the map
    
    buildMap(mapUpdateID(tabShown), aqe_path + "/" + mapUpdateSpec(tabShown), nyccasData, nta_topojson, selectedNeighborhood);
    
    // load the PM2.5 bar chart
    
    buildChart("#PMbar", PMBarVGSpec, nyccasData, selectedNeighborhood);
    
    // load the NO2 bar chart
    
    buildChart("#NO2bar", NO2BarVGSpec, nyccasData, selectedNeighborhood);

});

// change maps when tabs change

$(document).ready(function () {
    
    $(document).alert('hi from jquery');
    
    $(".nav-pills a").click(function () {
        $(this).tab('show');
    });
    
    $('.nav-pills a').on('shown.bs.tab', function (event) {

        console.log(".nav-pills a");
        
        tabShown = $(event.target).attr('aria-controls'); // active tab
        
        $(".act span").text(tabShown);
        $(".prev span").text("did it again");

        // load the map

        buildMap(
            mapUpdateID(tabShown), 
            aqe_path + "/" + mapUpdateSpec(tabShown), 
            nyccasData, 
            nta_topojson,
            selectedNeighborhood
        );

        // load the PM2.5 bar chart
    
        buildChart(
            "#PMbar", 
            PMBarVGSpec, 
            nyccasData,
            selectedNeighborhood
        );
    
        // load the NO2 bar chart
    
        buildChart(
            "#NO2bar", 
            NO2BarVGSpec, 
            nyccasData,
            selectedNeighborhood
        );
        
    });
}); 


// Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('append')) {
            return;
        }
        Object.defineProperty(item, 'append', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function append() {
                var argArr = Array.prototype.slice.call(arguments),
                docFrag = document.createDocumentFragment();
                
                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });
                
                this.appendChild(docFrag);
            }
        });
    });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

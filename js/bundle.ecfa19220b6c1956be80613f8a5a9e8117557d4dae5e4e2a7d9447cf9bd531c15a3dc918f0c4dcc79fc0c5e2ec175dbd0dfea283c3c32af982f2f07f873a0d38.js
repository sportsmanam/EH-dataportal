// import { all, desc, op, table } from '../../../node_modules/arquero/dist/arquero.min.js';

// clicking on the indicator dropdown calls loadIndicator with that IndicatorID

// let indicators = []; // indicator data
// let defaultIndicatorId;
let selectedSummaryYears = [];
let selectedSummaryGeography = [];
let aboutMeasures;
let dataSources;

let measureAbout = `N/A`;
let measureSources = `N/A`;
let geoTable;
let aqData;
let joinedAqData;

let fullDataTableObjects;
let fullDataMapObjects;
let fullDataTrendObjects;
let fullDataLinksObjects;
let joinedDataLinksObjects;
let disparitiyData; // used by disparities.js

let indicator;
let indicatorName;
let indicatorDesc;
let indicatorShortName;
let indicatorMeasures;
let indicatorId;
let primaryIndicatorName;
let secondaryIndicatorName;

let defaultTrendMetadata = [];
let defaultTrendAbout;
let defaultTrendSources;
let defaultMapMetadata = [];
let defaultMapAbout;
let defaultMapSources;
let defaultLinksMetadata = [];
let defaultLinkMeasureTimes = [];
let defaultLinksAbout;
let defaultLinksSources;

let selectedMapMeasure;
let selectedTrendMeasure;
let selectedLinksMeasure;
let selectedMapAbout;
let selectedMapSources;
let selectedTrendAbout;
let selectedTrendSources;
let selectedLinksAbout;
let selectedLinksSources;
let selectedlinksSecondaryMeasureTime;

let primaryMeasureMetadata;
let secondaryMeasureMetadata;

let filteredMapData;
let filteredTrendData;
let filteredLinksData;

let mapMeasures = [];
let trendMeasures = [];
let linksMeasures = [];

let tabTable;
let tabMap;
let tabTrend;
let tabLinks;

let showTable;
let showMap;
let showTrend;
let showLinks;

// store hash, so display knows where it just was
let currentHash;
let state;

// modifying the measure dropdown innerHTML removes the event listeners from the dropdown list. So, i added it to the HTML, and we can remove it when we call renderTrendChart, if necessary

// get trend dropdown element; disparities button will be removed or appended
let tabTrendDropDown = document.querySelector('#tab-trend .dropdown');

// get disparities button dom element, so it can be removed and appended as needed
let btnShowDisparities = document.querySelector('.btn-show-disparities');

const url = new URL(window.location);

// hash change event, for firing on hash switch in renderMeasures

let hashchange = new Event('hashchange');


// define georank function at top scope, so we can use it later

const assignGeoRank = (GeoType) => {
    switch (GeoType) {
        case 'Citywide':
            return 0;
        case 'Borough':
            return 1;
        case 'NYCKIDS':
            return 2;
        case 'UHF34':
            return 3;
        case 'UHF42':
            return 4;
        case 'Subboro':
            return 5;
        case 'CD':
            return 6;
        case 'NTA':
            return 7;
    }
}

// array of geotypes in georank order

const geoTypes = [
    "Citywide",
    "Borough",
    "NYCKIDS",
    "UHF34",
    "UHF42",
    "Subboro",
    "CD",
    "NTA"
]

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// measure info functions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// Renders the Indicator Title and Description

const renderTitleDescription = (title, desc) => {

    // console.log("** renderTitleDescription");
    
    const indicatorTitle = document.getElementById('indicatorTitle');
    const indicatorDescription = document.querySelector('.indicator-description');
    indicatorTitle.innerHTML = title;
    indicatorDescription.innerHTML = `${desc}`;
}

// Renders copy for the About the measures and the Data sources sections

const renderAboutSources = (about, sources) => {

    aboutMeasures.innerHTML = about;
    dataSources.innerHTML = sources;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// chart resize
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const updateChartPlotSize = () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 200)
    
}
;
// =================================================================== //
//  fetch and load indicators metadata into global object
// =================================================================== //

fetch(data_repo + "/" + data_branch + '/indicators/indicators.json')
    .then(response => response.json())
    .then(async data => {

        // console.log("** fetch indicators.json");

        indicators = data;

        const paramId = url.searchParams.get('id') !== null ? parseInt(url.searchParams.get('id')) : false;
        
        renderIndicatorDropdown()
        renderIndicatorButtons()

        // calling loadIndicator calls loadData, etc, and eventually renderMeasures. Because all 
        //  of this depends on the global "indicator" object, we call loadIndicator here
        
        if (paramId) {
            await loadIndicator(paramId)
        } else {
            // console.log('no param', url.searchParams.get('id'));
            await loadIndicator()
        }
        
    })
    .catch(error => console.log(error));


// ======================================================================= //
// data loading and manipulation functions
// ======================================================================= //

// I reversed the order of these function declarations to make the process
//  of data creation easier to understand

// ----------------------------------------------------------------------- //
// function to load indicator metadata
// ----------------------------------------------------------------------- //

const loadIndicator = (this_indicatorId, dont_add_to_history) => {

    console.log("** loadIndicator");

    currentHash = window.location.hash;

    // if indicatorId isn't given, use the first indicator from the dropdown list
    //  (which is populated by Hugo reading the content frontmatter).

    const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    indicatorId = this_indicatorId ? parseFloat(this_indicatorId) : parseFloat(firstIndicatorId);

    // remove active class from every list element
    $(".indicator-dropdown-item").removeClass("active");
    $(".indicator-dropdown-item").attr('aria-selected', false);

    // get the list element for this indicator
    const thisIndicatorEl = document.querySelector(`button[data-indicator-id='${indicatorId}']`)

    // set this element as active & selected
    $(thisIndicatorEl).addClass("active");
    $(thisIndicatorEl).attr('aria-selected', true);

    // indicatorId comes in as  a string, so "find" uses '==' instead of '==='

    indicator = indicators.find(indicator => indicator.IndicatorID == indicatorId);
    indicatorName = indicator?.IndicatorName ? indicator.IndicatorName : '';
    indicatorDesc = indicator?.IndicatorDescription ? indicator.IndicatorDescription : '';
    indicatorShortName = indicator?.IndicatorShortname ? indicator.IndicatorShortname : indicatorName;
    indicatorMeasures = indicator?.Measures;

    // create Citation

    createCitation(); // re-runs on updating Indicator

    // send Indicator Title to vis headers

    document.getElementById('summaryTitle').innerHTML = indicatorName;
    document.getElementById('mapTitle').innerHTML     = indicatorName;
    document.getElementById('trendTitle').innerHTML   = indicatorName;

    // reset selected measure flags

    selectedMapMeasure = false;
    selectedTrendMeasure = false;
    selectedLinksMeasure = false;

    // if dont_add_to_history is true, then don't push the state
    // if dont_add_to_history is false, or not set, push the state
    // this prevents loadIndicator from setting new history entries when it's called
    //  on a popstate event, i.e. when the user is traversing the history stack

    // dont_add_to_history catches the pop state case, state.id != indicatorId catches the location change case
    // we don't want to add to the history stack if we've landed on this page by way of the history stack

    url.searchParams.set('id', parseFloat(indicatorId));

    if (!dont_add_to_history && (window.history.state === null || state === null || window.history.state.id != indicatorId)) {

        if (!url.hash) {

            // if loadIndicator is being called without a hash (like when a topic page is loaded), then show the first ID and summary

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        } else {

            url.hash = currentHash;
            window.history.pushState({ id: indicatorId, hash: url.hash }, '', url);

        }

    } else {


    }

    // call data loading function

    const indicatorTitle = document.getElementById('dropdownIndicator')

    indicatorTitle.innerHTML = indicatorName

    loadData(indicatorId)
}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

const loadData = (this_indicatorId) => {

    fetch(data_repo + "/" + data_branch + `/indicators/data/${this_indicatorId}.json`)
    .then(response => response.json())
    .then(async data => {

        // call the geo file loading function

        loadGeo();

        ful = aq.from(data)
            .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
            .groupby("Time", "GeoType", "GeoID", "GeoRank")


        aqData = ful
            .groupby("Time", "GeoType", "GeoID")
            .orderby(aq.desc('Time'), 'GeoRank')
    })
}

// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const loadGeo = () => {

    const geoUrl = data_repo + "/" + data_branch + `/geography/GeoLookup.csv`; // col named "GeoType"

    aq.loadCSV(geoUrl)
        .then(data => {

            geoTable = data.select(aq.not('Lat', 'Long'));

            // call the data-to-geo joining function

            joinData();

    });
}

// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

const joinData = () => {

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // get metadata fields
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // flatten MeasureID + TimeDescription

    let availableTimes = [];

    // create table column header with display type

    let measurementDisplay = [];

    indicatorMeasures.map(

        measure => {

            let aqAvailableTimes =
                aq.from(measure.AvailableTimes)
                .derive({MeasureID: `${measure.MeasureID}`})

            availableTimes.push(aqAvailableTimes);

            let aqMeasurementDisplay =
                aq.table(
                {
                    MeasureID: [measure.MeasureID],
                    MeasurementType: [measure.MeasurementType],
                    DisplayType: [measure.DisplayType]
                })

            measurementDisplay.push(aqMeasurementDisplay);

        }
    )
    
    // bind rows of Arquero tables in arrays

    let aqMeasureIdTimes     = availableTimes.reduce((a, b) => a.concat(b))
    let aqMeasurementDisplay = measurementDisplay.reduce((a, b) => a.concat(b))

    // foundational joined dataset

    joinedAqData = aqData
        .join_left(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
        .rename({'Name': 'Geography'})
        .join(aqMeasureIdTimes, [["MeasureID", "Time"], ["MeasureID", "TimeDescription"]])
        .select(
            "GeoID",
            "GeoType",
            "GeoRank",
            "Geography",
            "MeasureID",
            "Time",
            "Value",
            "DisplayValue",
            "CI",
            "start_period",
            "end_period"
        )
        .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
        .reify()

    // data for summary table

    fullDataTableObjects = joinedAqData
        .join_left(aqMeasurementDisplay, "MeasureID")
        .derive({
            MeasurementDisplay: d => op.trim(op.join([d.MeasurementType, d.DisplayType], " ")),
            DisplayCI: d => op.trim(op.join([d.DisplayValue, d.CI], " "))
        })
        .derive({ DisplayCI: d => op.replace(d.DisplayCI, /^$/, "-") }) // replace missing with "-"
        .select(aq.not("start_period", "end_period"))
        .objects()

    // data for map

    fullDataMapObjects = joinedAqData
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
        .impute({ Value: () => NaN })
        .objects()

    // map for trend chart

    fullDataTrendObjects = joinedAqData
        .filter(d => op.match(d.GeoType, /Citywide|Borough/)) // keep only Citywide and Boro
        .objects()

    // data for links & disparities chart

    fullDataLinksObjects = joinedAqData
        .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
        .objects()

    // call the measure rendering etc. function

    renderMeasures();

}

;
// ----------------------------------------------------------------------- //
// function to create data and metadata for links chart
// ----------------------------------------------------------------------- //

// WHAT'S THE MOST RECENT YEAR WHERE PRIMARY AND SECONDARY SHARE A GEOGRAPHY?

const filterSecondaryIndicatorMeasure = async (primaryMeasureId, secondaryMeasureId) => {

    console.log("primaryMeasureId", primaryMeasureId);
    console.log("secondaryMeasureId", secondaryMeasureId);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get metadata for the selected primary measure, assign to global variable
    // indicatorMeasures created in loadIndicator

    primaryMeasureMetadata = linksMeasures.filter(
        measure => measure.MeasureID === primaryMeasureId
    )

    // get available geos for primary measure (excluding citywide and boro)

    const primaryMeasureGeos = primaryMeasureMetadata[0].AvailableGeographyTypes
        .map(g => g.GeoType)
        .filter(g => !/Citywide|Borough/.test(g))


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure metadata
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // if no secondary measure ID is given, set it to the first in the primary measure's links list

    if (typeof secondaryMeasureId == "undefined") {
        secondaryMeasureId = primaryMeasureMetadata[0].VisOptions[0].Links[0].MeasureID;
    }

    // get the indicator element for the selected secondary measure

    const secondaryIndicator = indicators.filter(
        indicator => indicator.Measures.some(
            measure => measure.MeasureID === secondaryMeasureId
        )
    )

    // get secondary indicatorID, to get secondary data and metadata

    const secondaryIndicatorId = secondaryIndicator[0].IndicatorID

    // get metadata for the selected secondary measure, assign to global variable

    secondaryMeasureMetadata =
        secondaryIndicator[0].Measures.filter(
        measure => measure.MeasureID === secondaryMeasureId
    )


    // ==== geography ==== //

    // get avilable geos for secondary measure (excluding citywide and boro)

    const secondaryMeasureGeos = secondaryMeasureMetadata[0].AvailableGeographyTypes
        .map(g => g.GeoType)
        .filter(g => !/Citywide|Borough/.test(g))


    // ---- get primary x secondary intersection ---- //

    const sharedGeos = secondaryMeasureGeos.filter(g => primaryMeasureGeos.includes(g));

    // ==== times ==== //

    // get available time periods for secondary measure

    const secondaryMeasureTimes   = secondaryMeasureMetadata[0].AvailableTimes;
    const aqSecondaryMeasureTimes = aq.from(secondaryMeasureTimes);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // primary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const filteredPrimaryMeasureData = fullDataLinksObjects

        // keep primary measure
        .filter(d => d.MeasureID === primaryMeasureId)
        
        // get shared geos
        .filter(d => sharedGeos.includes(d.GeoType))


    // get most recent time period for primary measure
    //  (at shared geo level, which is why we're using the data, and not the metadata)

    const mostRecentPrimaryMeasureEndTime = Math.max(...filteredPrimaryMeasureData.map(d => d.end_period));

    // keep only most recent time period

    const filteredPrimaryMeasureTimesData = filteredPrimaryMeasureData

        .filter(d => d.end_period === mostRecentPrimaryMeasureEndTime)

    // convert to arquero table

    const aqFilteredPrimaryMeasureTimesData = aq.from(filteredPrimaryMeasureTimesData);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // secondary measure data
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // get secondary data with shared geo and time period that is closest with most recent primary data
    //  (fetches run asynchronously by default, but we need this data to do other things, so we have to 
    //  `await` the result before continuing)

    await fetch(`${data_repo}/${data_branch}/indicators/data/${secondaryIndicatorId}.json`)
        .then(response => response.json())
        .then(async data => {

            // get secondary measure data

            const secondaryMeasureData = data.filter(d => d.MeasureID === secondaryMeasureId)

            // join with geotable and times, keep only geos in primary data

            const aqFilteredSecondaryMeasureData = aq.from(secondaryMeasureData)
                .join(
                    geoTable,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )

                // get same geotypes as primary data (no citywide or boro)
                .filter(aq.escape(d => sharedGeos.includes(d.GeoType)))

                .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
                .rename({'Name': 'Geography'})

                // get end periods
                .join(
                    aqSecondaryMeasureTimes,
                    ["Time", "TimeDescription"]
                )
                .select(aq.not("TimeDescription"))

            // convert to JS object

            const filteredSecondaryMeasureTimesDataObjects = aqFilteredSecondaryMeasureData.objects();
            

            // ==== get closest data ==== //

            // get the secondary end time closest to most recent primary end time

            const closestSecondaryTime = filteredSecondaryMeasureTimesDataObjects.reduce((prev, curr) => {

                return (Math.abs(curr.end_period - mostRecentPrimaryMeasureEndTime) < Math.abs(prev.end_period - mostRecentPrimaryMeasureEndTime) ? curr : prev);

            });


            // use end time to get closest secondary data

            const aqClosestSecondaryData = aqFilteredSecondaryMeasureData

                // data with the latest end period
                .filter(`d => d.end_period === ${closestSecondaryTime.end_period}`)

                // get the finest geo left
                .filter(d => d.GeoRank === op.max(d.GeoRank))

                // in case there are two time periods left, get the one that starts the earliest,
                //  which will be yearly over seasonal
                .filter(d => d.start_period === op.min(d.start_period))
                

            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
            // join primary and secondary measure data
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
            
            const aqJoinedPrimarySecondaryData = aqFilteredPrimaryMeasureTimesData
                .join(
                    aqClosestSecondaryData,
                    [["GeoID", "GeoType"], ["GeoID", "GeoType"]]
                )

            // set the value of joinedDataLinksObjects, and make sure to wait for it

            joinedDataLinksObjects = await aqJoinedPrimarySecondaryData.objects();

        })
}


// ----------------------------------------------------------------------- //
// tab default measure functions
// ----------------------------------------------------------------------- //

// ===== map ===== //

const setDefaultMapMeasure = (visArray) => {

    // modified so that defaultMapMetadata is explicitly set, instead of by reference
    //  through defaultArray

    let defaultArray = [];

    const hasAgeAdjustedRate = visArray.filter(measure =>
        measure.MeasurementType.includes('Age Adjusted Rate')
    )
    const hasRate = visArray.filter(measure =>
        measure.MeasurementType.includes('Rate')
    )
    const hasPercent = visArray.filter(measure =>
        measure.MeasurementType.includes('Percent')
    )


    if (hasAgeAdjustedRate.length) {

        const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
            measure.MeasurementType.includes('Total')
        )

        // Set total as default if available
        if (hasAgeAdjustedRateTotal.length) {
            defaultArray.push(hasAgeAdjustedRateTotal[0]);

        } else {
            defaultArray.push(hasAgeAdjustedRate[0]);

        }

    } else if (hasRate.length) {
        defaultArray.push(hasRate[0]);

    } else if (hasPercent.length) {
        defaultArray.push(hasPercent[0]);

    } else {
        defaultArray.push(visArray[0]);

    }

    // assigning to global object

    defaultMapMetadata = defaultArray;

}


// ===== trend ===== //

const setDefaultTrendMeasure = (visArray) => {

    // modified so that defaultTrendMetadata is explicitly set, instead of by reference
    //  through defaultArray

    let defaultArray = [];

    if (visArray.length > 0) {

        const hasAgeAdjustedRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Age Adjusted Rate')
        )
        const hasRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Rate')
        )
        const hasPercent = visArray.filter(measure =>
            measure.MeasurementType.includes('Percent')
        )


        if (hasAgeAdjustedRate.length) {

            const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
                measure.MeasurementType.includes('Total')
            )
            // Set total as default if available
            if (hasAgeAdjustedRateTotal.length) {
                defaultArray.push(hasAgeAdjustedRateTotal[0]);

            } else {
                defaultArray.push(hasAgeAdjustedRate[0]);

            }


        } else if (hasRate.length) {
            defaultArray.push(hasRate[0]);

        } else if (hasPercent.length) {
            defaultArray.push(hasPercent[0]);

        } else {
            defaultArray.push(visArray[0]);

        }
    }

    // assigning to global object

    defaultTrendMetadata = defaultArray;
}


// ===== links ===== //

const setDefaultLinksMeasure = async (visArray) => {

    // modified so that defaultLinksMetadata is explicitly set, instead of by reference
    //  through defaultArray

    let defaultArray = [];

    if (visArray.length > 0) {

        const hasAgeAdjustedRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Age Adjusted Rate')
        )
        const hasRate = visArray.filter(measure =>
            measure.MeasurementType.includes('Rate')
        )
        const hasPercent = visArray.filter(measure =>
            measure.MeasurementType.includes('Percent')
        )


        if (hasAgeAdjustedRate.length) {

            const hasAgeAdjustedRateTotal = hasAgeAdjustedRate.filter(measure =>
                measure.MeasurementType.includes('Total')
            )
            // Set total as default if available
            if (hasAgeAdjustedRateTotal.length) {
                defaultArray.push(hasAgeAdjustedRateTotal[0]);

            } else {
                defaultArray.push(hasAgeAdjustedRate[0]);
            }


        } else if (hasRate.length) {
            defaultArray.push(hasRate[0]);

        } else if (hasPercent.length) {
            defaultArray.push(hasPercent[0]);

        } else {
            defaultArray.push(visArray[0]);

        }

        defaultLinkMeasureTimes = defaultArray[0].AvailableTime;

        const defaultPrimaryMeasureId = defaultArray[0].MeasureID;
        const defaultSecondaryMeasureId = defaultArray[0].VisOptions[0].Links[0].MeasureID;

        // assigning to global object
        defaultLinksMetadata = defaultArray;

        // using await here because filterSecondaryIndicatorMeasure calls fetch, and we need that data

        await filterSecondaryIndicatorMeasure(defaultPrimaryMeasureId, defaultSecondaryMeasureId)

    }
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// tab update functions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== map ===== //

const updateMapData = (e) => {

    // ----- handle selection ----- //

    // get meaasureId of selected dropdown element

    const measureId = parseInt(e.target.dataset.measureId);

    // get selected time

    const time = e.target.dataset.time;

    // persistent selection

    // remove active class from every list element
    $('.mapbutton').removeClass("active");
    $('.mapbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);


    // ----- get metatadata for selected measure ----- //

    const measureMetadata = mapMeasures.filter(m => m.MeasureID == measureId);
    const measurementType = measureMetadata[0].MeasurementType;
    const about           = measureMetadata[0].how_calculated;
    const sources         = measureMetadata[0].Sources;
    const display         = measureMetadata[0].DisplayType;


    // ----- set measure info boxes ----- //

    // "indicatorName" is set in loadIndicator

    selectedMapAbout   =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedMapSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedMapAbout, selectedMapSources);


    // ----- create dataset ----- //

    // filter map data using selected measure and time

    let mapMeasureData =
        fullDataMapObjects.filter(
            obj => obj.MeasureID === measureId &&
            obj.Time === time
        );

    // get the highest GeoRank, then keep just that geo

    let maxGeoRank = Math.max(mapMeasureData[0].GeoRank);
    filteredMapData = mapMeasureData.filter(obj => obj.GeoRank === maxGeoRank)

    // ----- render the map ----- //

    renderMap(filteredMapData, measureMetadata);

    updateChartPlotSize();

    // allow map to persist when changing tabs

    selectedMapMeasure = true;

}


// ===== trend ===== //

const updateTrendData = (e) => {

    console.log("updateTrendData");

    // ----- handle selection ----- //

    // get meaasureId of selected dropdown element

    const measureId = parseInt(e.target.dataset.measureId);

    // persistent selection

    // remove active class from every list element
    $('.trendbutton').removeClass("active");
    $('.trendbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // ----- get metatadata for selected measure ----- //

    // trendMeasures is created by renderMeasures, which evals before this would be called
    const measureMetadata = trendMeasures.filter(m => m.MeasureID == measureId);
    const measurementType = measureMetadata[0].MeasurementType;
    const about           = measureMetadata[0].how_calculated;
    const sources         = measureMetadata[0].Sources;
    const display         = measureMetadata[0].DisplayType;


    // ----- set measure info boxes ----- //

    selectedTrendAbout =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${about}</p>`;

    selectedTrendSources =
        `<h6>${indicatorName} - ${measurementType}</h6>
        <p>${sources}</p>`;

    // render measure info boxes

    renderAboutSources(selectedTrendAbout, selectedTrendSources);


    // ----- handle disparities button ----- //

    // check if disparities is enabled for this measure

    const disparities =
        measureMetadata[0].VisOptions[0].Trend &&
        measureMetadata[0].VisOptions[0].Trend[0]?.Disparities;

    // hide or how disparities button

    if (disparities == 0) {

        // if disparities is disabled, hide the button

        btnShowDisparities.style.display = "none";

        // remove click listeners to button that calls renderDisparities

        $(btnShowDisparities).off()

    } else if (disparities == 1) {

        // remove event listener added when/if button was clicked

        btnShowDisparities.innerText = "Show Disparities";
        $(btnShowDisparities).off()

        // if disparities is enabled, show the button

        btnShowDisparities.style.display = "inline";

        // add click listener to button that calls renderDisparities

        $(btnShowDisparities).on("click", () => renderDisparities(measureMetadata, 221));

    }


    // ----- create dataset ----- //

    // created filtered trend data, to be passed to render function

    filteredTrendData = fullDataTrendObjects.filter(m => m.MeasureID === measureId);


    // ----- render the chart ----- //

    // chart only the annual average for the following measureIds:
    // 365 - PM2.5 (Fine particles), Mean
    // 370 - Black carbon, Mean
    // 391 - Nitric oxide, Mean
    // 375 - Nitrogen dioxide, Mean

    const measureIdsAnnualAvg = [365, 370, 375, 391];

    // chart only the summer average for the following measureIds:
    // 386 - Ozone (O3), Mean

    const measureIdsSummer = [386];

    if (measureIdsAnnualAvg.includes(measureId)) {

        const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));

        renderTrendChart(filteredTrendDataAnnualAvg, measureMetadata);
        updateChartPlotSize();

    } else if (measureIdsSummer.includes(measureId)) {

        const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));

        renderTrendChart(filteredTrendDataSummer, measureMetadata);
        updateChartPlotSize();

    } else {

        renderTrendChart(filteredTrendData, measureMetadata);
        updateChartPlotSize();

    }

    // allow trend chart to persist when changing tabs

    selectedTrendMeasure = true;

}


// ===== links ===== //

const updateLinksData = async (e) => {

    // ---- handle selection ----- //

    // persistent selection

    // remove active class from every list element
    $('.linksbutton').removeClass("active");
    $('.linksbutton').attr('aria-selected', false);

    // set this element as active & selected
    $(e.target).addClass("active");
    $(e.target).attr('aria-selected', true);

    // get meaasureIds of selected dropdown element

    const primaryMeasureId = parseInt(e.target.dataset.primaryMeasureId);
    const secondaryMeasureId = parseInt(e.target.dataset.secondaryMeasureId);

    // call filterSecondaryIndicatorMeasure, which creates joinedDataLinksObjects,
    //  primaryMeasureMetadata, secondaryMeasureMetadata

    await filterSecondaryIndicatorMeasure(primaryMeasureId, secondaryMeasureId)


    // ----- get metatadata for selected measure ----- //

    // for all indicators, get the ones that are linked to the current indicator

    const linksSecondaryIndicator = indicators.filter(
        indicator => indicator.Measures.some(
            m => m.MeasureID === secondaryMeasureId
        )
    )

    // get indicator names, for chart + about & sources

    primaryIndicatorName   = indicatorName // created in loadIndicator
    secondaryIndicatorName = linksSecondaryIndicator[0].IndicatorName

    // extract metadata for about & sources boxes

    const primaryMeasurementType = primaryMeasureMetadata[0].MeasurementType;
    const secondaryMeasurementType = secondaryMeasureMetadata[0].MeasurementType;

    const primaryAbout = primaryMeasureMetadata[0].how_calculated;
    const secondaryAbout = secondaryMeasureMetadata[0].how_calculated;

    const primarySources = primaryMeasureMetadata[0].Sources;
    const secondarySources = secondaryMeasureMetadata[0].Sources;


    // ----- set measure info boxes ----- //

    selectedLinksAbout =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${secondaryIndicatorName} - ${secondaryMeasurementType}</h6>
        <p>${secondaryAbout}</p>`;

    selectedLinksSources =
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${secondaryIndicatorName} - ${secondaryMeasurementType}</h6>
        <p>${secondarySources}</p>`;

    // render the measure info boxes

    renderAboutSources(selectedLinksAbout, selectedLinksSources);


    // ----- create dataset ----- //

    // get the highest GeoRank, then keep just that geo

    // let maxGeoRank = Math.max(joinedDataLinksObjects[0].GeoRank);
    // filteredLinksData = joinedDataLinksObjects.filter(obj => obj.GeoRank === maxGeoRank)


    // ----- render the chart ----- //

    renderLinksChart(
        joinedDataLinksObjects,
        primaryMeasureMetadata,
        secondaryMeasureMetadata,
        primaryIndicatorName,
        secondaryIndicatorName
    );

    updateChartPlotSize();

    // allow links chart to persist when changing tabs

    selectedLinksMeasure = true;

}

// ----------------------------------------------------------------------- //
// table filtering functions
// ----------------------------------------------------------------------- //

// need to be defined before `renderMeasures`, where they're added as listener callbacks

// ===== year ===== //

const handleYearFilter = (el) => {
    el.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectedSummaryYears = [e.target.value]
        }
        renderTable()
    })
}

// ===== geo ===== //

const handleGeoFilter = (el) => {

    el.addEventListener('change', (e) => {

        if (e.target.checked) {
            selectedSummaryGeography.push(e.target.value)
        } else {
            selectedSummaryGeography = selectedSummaryGeography.filter(item => item !== e.target.value);
        }

        // only render table if a geography is checked

        if (selectedSummaryGeography.length > 0) {
            renderTable()

        } else {
            document.querySelector("#tableID").innerHTML = '';
        }
    })
}

// ----------------------------------------------------------------------- //
// finally, render the measures
// ----------------------------------------------------------------------- //

const renderMeasures = async () => {

    console.log("** renderMeasures");

    linksMeasures.length = 0

    const contentSummary = document.querySelector('#tab-table');
    const contentMap     = document.querySelector('#tab-map')
    const contentTrend   = document.querySelector('#tab-trend');
    const contentLinks   = document.querySelector('#tab-links');

    // ----- set dropdowns for this indicator ----- //

    const dropdownTableYear = contentSummary.querySelector('div[aria-labelledby="dropdownTableYear"]');
    const dropdownMapMeasures = document.querySelector('div[aria-labelledby="dropdownMapMeasures"]');

    const dropdownMapYear  = contentMap.querySelector('div[aria-labelledby="dropdownMapYear"]');
    const dropdownTableGeo = contentSummary.querySelector('div[aria-labelledby="dropdownTableGeo"]');
    const dropdownTrendMeasures = contentTrend.querySelector('div[aria-labelledby="dropdownTrendMeasures"]');
    const dropdownLinksMeasures = contentLinks.querySelector('div[aria-labelledby="dropdownLinksMeasures"]');

    // clear Measure Dropdowns

    dropdownTableYear.innerHTML = ``;
    dropdownTableGeo.innerHTML = ``;
    dropdownMapMeasures.innerHTML = ``;
    dropdownTrendMeasures.innerHTML = ``;
    dropdownLinksMeasures.innerHTML = ``;

    mapMeasures.length = 0;
    trendMeasures.length = 0;

    // create years dropdown for table

    const tableYears = [...new Set(fullDataTableObjects.map(item => item.Time))];

    tableYears.forEach((year, index) => {

        if (index === 0) {

            selectedSummaryYears.push(year);
            dropdownTableYear.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input type="radio" name="year" value="${year}" checked /> ${year}</label>`;

        } else {

            dropdownTableYear.innerHTML +=
                `<label class="dropdown-item checkbox-year"><input type="radio" name="year" value="${year}" /> ${year}</label>`;
        }

    });

    // create geo dropdown for table (keeping georank order)

    const tableGeoTypes = [...new Set(fullDataTableObjects.map(item => item.GeoType))];
    const dropdownGeoTypes = geoTypes.filter(g => tableGeoTypes.includes(g))

    dropdownGeoTypes.forEach((geoType, index) => {

        selectedSummaryGeography.push(geoType);
        dropdownTableGeo.innerHTML += `<label class="dropdown-item checkbox-geo"><input type="checkbox" value="${geoType}" checked /> ${geoType}</label>`;

    });


    // ----- handle measures for this indicator ----- //

    const mapYears = [...new Set(fullDataMapObjects.map(item => item.Time))];

    indicatorMeasures.map((measure, index) => {

        const type = measure?.MeasurementType;
        const displayType = measure?.DisplayType;
        const years = measure?.AvailableTimes.sort((a, b) => b.start_period - a.start_period);
        const geography = measure?.AvailableGeographyTypes;
        const links = measure?.VisOptions[0].Links && measure?.VisOptions[0]?.Links[0];
        const map = measure?.VisOptions[0].Map && measure?.VisOptions[0].Map[0]?.On;
        const trend = measure?.VisOptions[0].Trend && measure?.VisOptions[0].Trend[0]?.On;
        const trendDisparities = measure?.VisOptions[0].Trend && measure?.VisOptions[0].Trend[0]?.Disparities;
        const about = measure.how_calculated;
        const sources = measure.Sources;
        const measureId = measure.MeasureID;


        // ----- handle map measures ----- //

        if (map === 1) {

            mapMeasures.push(measure)

            dropdownMapMeasures.innerHTML += `<div class="dropdown-column-${index}"><div class="dropdown-title"><strong> ${type}</strong></div></div>`;

            const dropdownMapMeasuresColumn = document.querySelector(`.dropdown-column-${index}`);

            mapYears.map((time, index) => {
                dropdownMapMeasuresColumn.innerHTML += `<button class="dropdown-item link-measure mapbutton"
                data-measure-id="${measureId}"
                data-time="${time}">
                ${time}
                </button>`;

            });
        }


        // ----- handle trend measures ----- //

        if (trend === 1) {

            trendMeasures.push(measure)

            if (fullDataTrendObjects) {
                dropdownTrendMeasures.innerHTML += `<button class="dropdown-item link-measure trendbutton"
                data-measure-id="${measureId}">
                ${type}
                </button>`;
            }
        }


        // ----- handle links measures ----- //

        if (links) {

            // create linked measures object

            linksMeasures.push(measure)

            // get secondary measure id

            const secondaryMeasureId = measure.VisOptions[0].Links[0].MeasureID;


            if (fullDataTableObjects) {

                const linkYears = [...new Set(fullDataTableObjects.map(item => item.Time))];

                dropdownLinksMeasures.innerHTML +=
                    `<div class="dropdown-title"><strong> ${type}</strong></div>`;

                measure.VisOptions[0].Links.map(link => {

                    const linksSecondaryIndicator = indicators.filter(indicator =>
                        indicator.Measures.some(m =>
                            m.MeasureID === link.MeasureID)
                    );

                    const linksSecondaryMeasure = linksSecondaryIndicator[0].Measures.filter(m =>
                        m.MeasureID === link.MeasureID
                    );

                    dropdownLinksMeasures.innerHTML +=
                        `<button class="dropdown-item link-measure linksbutton"
                        data-primary-measure-id="${measureId}"
                        data-measure-id="${measure.MeasureID}"
                        data-secondary-measure-id="${link.MeasureID}">
                        ${linksSecondaryMeasure[0].MeasureName}
                    </button>`;

                });
            }
        }
    });


    setDefaultMapMeasure(mapMeasures);
    setDefaultTrendMeasure(trendMeasures);

    // set default measure for links; also calls filterSecondaryIndicatorMeasure, which creates the joined data

    await setDefaultLinksMeasure(linksMeasures);


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // functions to show to tabs
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // ===== table ===== //

    // define function

    showTable = (e) => {

        console.log("showTable");

        // ----- handle tab selection ----- //

        // set hash to summary

        if (window.location.hash !== '#display=summary' && window.location.hash !== 'display=summary') {
            window.location.hash = 'display=summary';
        }

        currentHash = 'display=summary'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', true);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- set measure info boxes ----- //

        renderTitleDescription(indicatorShortName, indicatorDesc);
        renderAboutSources(measureAbout, measureSources);


        // ----- render the table ----- //

        renderTable();

        updateChartPlotSize();

        $($.fn.dataTable.tables(false))
            .DataTable()
            .columns.adjust().draw();

    };


    // ===== map ===== //

    // define function

    showMap = (e) => {

        // ----- handle tab selection ----- //

        // set hash to map

        window.location.hash = 'display=map'
        currentHash = 'display=map'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', true);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', false);


        // ----- allow map to persist when changing tabs ----- //

        if (!selectedMapMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure ----- //

            // get default measure id

            const defaultMapMeasureId = defaultMapMetadata[0].MeasureID;

            // extract metadata for info boxes

            const about   = defaultMapMetadata[0]?.how_calculated;
            const sources = defaultMapMetadata[0].Sources;
            const measure = defaultMapMetadata[0].MeasurementType;


            // ----- set measure info boxes ----- //

            defaultMapAbout   =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${about}</p>`;

            defaultMapSources =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${sources}</p>`;

            // render measure info boxes

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultMapAbout, defaultMapSources);


            // ----- create dataset ----- //

            // filter map data using default measure

            let mapMeasureData = fullDataMapObjects.filter(
                    obj => obj.MeasureID === defaultMapMeasureId
                );

            // get the latest end_period

            let latest_end_period = Math.max(mapMeasureData[0].end_period);

            let mapTimeData = mapMeasureData.filter(
                    obj => obj.end_period === latest_end_period
                );

            let latest_time = mapTimeData[0].Time

            // get the highest GeoRank for this measure and end_period

            let maxGeoRank = Math.max(mapTimeData[0].GeoRank);

            filteredMapData = mapTimeData.filter(
                    obj => obj.GeoRank === maxGeoRank
                );


            // ----- render the map ----- //

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();

            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.mapbutton').removeClass("active");
            $('.mapbutton').attr('aria-selected', false);

            // set this element as active & selected

            let mapMeasureEl = document.querySelector(`.mapbutton[data-measure-id='${defaultMapMeasureId}'][data-time='${latest_time}']`)

            $(mapMeasureEl).addClass("active");
            $(mapMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a map already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedMapAbout, selectedMapSources);

            // ----- render the map ----- //

            renderMap(filteredMapData, defaultMapMetadata);

            updateChartPlotSize();
        }

    };


    // ===== trend ===== //

    // define function

    showTrend = (e) => {

        // ----- handle tab selection ----- //

        // set hash to trend

        window.location.hash = 'display=trend'
        currentHash = 'display=trend'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', true);
        tabLinks.setAttribute('aria-selected', false);


        // ----- allow chart to persist when changing tabs ----- //

        if (!selectedTrendMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function


            // ----- get metatadata for default measure ----- //

            const about   = defaultTrendMetadata[0]?.how_calculated;
            const sources = defaultTrendMetadata[0].Sources;
            const measure = defaultTrendMetadata[0].MeasurementType;


            // ----- set measure info boxes ----- //

            defaultTrendAbout =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${about}</p>`;

            defaultTrendSources =
                `<h6>${indicatorName} - ${measure}</h6>
                <p>${sources}</p>`;

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultTrendAbout, defaultTrendSources);


            // ----- handle disparities button ----- //

            // switch on/off the disparities button

            const disparities =
                defaultTrendMetadata[0].VisOptions[0].Trend &&
                defaultTrendMetadata[0].VisOptions[0].Trend[0]?.Disparities;

            // hide or show disparities button

            if (disparities == 0) {

                // if disparities is disabled, hide the button

                btnShowDisparities.style.display = "none";

                // remove click listeners to button that calls renderDisparities

                $(btnShowDisparities).off()

            } else if (disparities == 1) {

                // remove event listener added when/if button was clicked

                btnShowDisparities.innerText = "Show Disparities";
                $(btnShowDisparities).off()

                // if disparities is enabled, show the button

                btnShowDisparities.style.display = "inline";

                // add click listener to button that calls renderDisparities

                $(btnShowDisparities).on("click", () => renderDisparities(defaultTrendMetadata, 221))

            }


            // ----- create dataset ----- //

            const defaultTrendMeasureId = defaultTrendMetadata[0].MeasureID;
            filteredTrendData = fullDataTrendObjects.filter(m => m.MeasureID === defaultTrendMeasureId);


            // ----- render the chart ----- //

            // chart only the annual average for the following measureIds:
            // 365 - PM2.5 (Fine particles), Mean
            // 370 - Black carbon, Mean
            // 391 - Nitric oxide, Mean
            // 375 - Nitrogen dioxide, Mean

            const measureIdsAnnualAvg = [365, 370, 375, 391];

            // chart only the summer average for the following measureIds:
            // 386 - Ozone (O3), Mean

            const measureIdsSummer = [386];

            if (measureIdsAnnualAvg.includes(defaultTrendMeasureId)) {

                const filteredTrendDataAnnualAvg = filteredTrendData.filter(d => d.Time.startsWith('Annual Average'));

                renderTrendChart(filteredTrendDataAnnualAvg, defaultTrendMetadata);
                updateChartPlotSize();

            } else if (measureIdsSummer.includes(defaultTrendMeasureId)) {

                const filteredTrendDataSummer = filteredTrendData.filter(d => d.Time.startsWith('Summer'));

                renderTrendChart(filteredTrendDataSummer, defaultTrendMetadata);
                updateChartPlotSize();

            } else {

                renderTrendChart(filteredTrendData, defaultTrendMetadata);
                updateChartPlotSize();

            }


            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.trendbutton').removeClass("active");
            $('.trendbutton').attr('aria-selected', false);

            // set this element as active & selected

            let trendMeasureEl = document.querySelector(`.trendbutton[data-measure-id='${defaultTrendMeasureId}']`)

            $(trendMeasureEl).addClass("active");
            $(trendMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedTrendAbout, selectedTrendSources);

            // ----- render the chart ----- //

            renderTrendChart(filteredTrendData, defaultTrendMetadata);

            updateChartPlotSize();
        }

    };


    // ===== links ===== //

    // define function

    showLinks = (e) => {

        // ----- handle tab selection ----- //

        // set hash to links

        window.location.hash = 'display=links'
        currentHash = 'display=links'

        // reset aria attributes

        tabTable.setAttribute('aria-selected', false);
        tabMap.setAttribute('aria-selected', false);
        tabTrend.setAttribute('aria-selected', false);
        tabLinks.setAttribute('aria-selected', true);


        // ----- allow chart to persist when changing tabs ----- //

        if (!selectedLinksMeasure) {

            // this is all inside the conditional, because if a user clicks on this tab again
            //  after selecting a measure, we don't want to recompute everything. We'll use the
            //  values created by the update function

            // ----- get metatadata for default measure ----- //

            // get first linked measure by default

            const secondaryMeasureId = defaultLinksMetadata[0]?.VisOptions[0].Links[0].MeasureID;

            // get linked indicator's metadata

            const linksSecondaryIndicator = indicators.filter(indicator =>
                indicator.Measures.some(measure =>
                    measure.MeasureID === secondaryMeasureId
                )
            )

            // use linked indicator's metadata to get linked measure's metadata

            const linksSecondaryMeasure = linksSecondaryIndicator[0].Measures.filter(m =>
                m.MeasureID === secondaryMeasureId
            )

            primaryIndicatorName   = indicatorName;
            secondaryIndicatorName = linksSecondaryIndicator[0].IndicatorName;

            // get measure metadata

            const primaryMeasure         = defaultLinksMetadata[0].MeasurementType;
            const primaryAbout           = defaultLinksMetadata[0].how_calculated;
            const primarySources         = defaultLinksMetadata[0].Sources;

            const secondaryMeasure       = linksSecondaryMeasure[0].MeasurementType;
            const secondaryAbout         = linksSecondaryMeasure[0].how_calculated;
            const secondarySources       = linksSecondaryMeasure[0].Sources;


            // ----- set measure info boxes ----- //

            // creating indicator & measure info

            defaultLinksAbout =
                `<h6>${primaryIndicatorName} - ${primaryMeasure}</h6>
                <p>${primaryAbout}</p>
                <h6>${secondaryIndicatorName} - ${secondaryMeasure}</h6>
                <p>${secondaryAbout}</p>`;

            defaultLinksSources =
                `<h6>${primaryIndicatorName} - ${primaryMeasure}</h6>
                <p>${primarySources}</p>
                <h6>${secondaryIndicatorName} - ${secondaryMeasure}</h6>
                <p>${secondarySources}</p>`;


            // ----- create dataset ----- //

            // use joinedDataLinksObjects (created in filterSecondaryIndicatorMeasure) to get the
            //  highest GeoRank, then keep just that geo

            // let maxGeoRank = Math.max(joinedDataLinksObjects[0].GeoRank);
            // filteredLinksData = joinedDataLinksObjects.filter(obj => obj.GeoRank === maxGeoRank)

            renderTitleDescription(indicatorShortName, indicatorDesc);
            renderAboutSources(defaultLinksAbout, defaultLinksSources);


            // ----- render the chart ----- //

            // joined data and metadata created in filterSecondaryIndicatorMeasure called fron setDefaultLinksMeasure

            renderLinksChart(
                joinedDataLinksObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();


            // ----- persistent selection ----- //

            // remove active class from every list element
            $('.linksbutton').removeClass("active");
            $('.linksbutton').attr('aria-selected', false);

            // set this element as active & selected

            let linksMeasureEl = document.querySelector(`.linksbutton[data-secondary-measure-id='${secondaryMeasureId}']`)

            $(linksMeasureEl).addClass("active");
            $(linksMeasureEl).attr('aria-selected', true);


        } else {

            // if there was a chart already, restore it

            // ----- set measure info boxes ----- //

            renderAboutSources(selectedLinksAbout, selectedLinksSources);

            // ----- render the chart ----- //

            renderLinksChart(
                joinedDataLinksObjects,
                primaryMeasureMetadata,
                secondaryMeasureMetadata,
                primaryIndicatorName,
                secondaryIndicatorName
            );

            updateChartPlotSize();
        }

    };


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // disable tabs and switch to summary if there are no measures
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // this is effectively the state of the tabs when the indicator is loaded or changed

    const tabTableSelected = tabTable.getAttribute('aria-selected');
    const tabMapSelected   = tabMap.getAttribute('aria-selected');
    const tabTrendSelected = tabTrend.getAttribute('aria-selected');
    const tabLinksSelected = tabLinks.getAttribute('aria-selected');

    const disableTab = (el) => {
        el.classList.add('disabled');
        el.setAttribute('aria-disabled', true);
    }

    const enableTab = (el) => {
        el.classList.remove('disabled');
        el.setAttribute('aria-disabled', false);
    }


    // if there's no data to display for a tab, disable it. If you're on that tab when you switch to
    //  a new indicator (which calls renderMeasures), then switch to the summary table

    if (mapMeasures.length === 0) {

        if (tabMapSelected && window.location.hash === '#display=map') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        disableTab(tabMap);

    } else {

        enableTab(tabMap);
    }


    const onlyOneTime = trendMeasures.every(m => m.AvailableTimes.length <= 1)

    if (trendMeasures.length === 0 || onlyOneTime) {

        if (tabTrendSelected && window.location.hash === '#display=trend') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        disableTab(tabTrend);

    } else {

        enableTab(tabTrend);
    }


    if (linksMeasures.length === 0) {

        if (tabLinksSelected && window.location.hash === '#display=links') {

            // replace history stack entry

            url.hash = "display=summary";
            window.history.replaceState({ id: indicatorId, hash: url.hash}, '', url);

        }

        disableTab(tabLinks);

    } else {

        enableTab(tabLinks);
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // set tab based on hash
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    let hash = window.location.hash.replace('#', "")

    switch (hash) {

        // using fallthrough

        case 'display=summary':
        case 'tab-table':
            $('#tab-btn-table').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=map':
        case 'tab-map':
            $('#tab-btn-map').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=trend':
        case 'tab-trend':
            $('#tab-btn-trend').tab('show');
            window.dispatchEvent(hashchange);
            break;

        case 'display=links':
        case 'tab-links':
            $('#tab-btn-links').tab('show');
            window.dispatchEvent(hashchange);
            break;

        default:
            window.dispatchEvent(hashchange);
            $('#tab-btn-table').tab('show');
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // add event listeners to measure dropdown elements, will call the
    //  respective update functions
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    // without custom class, selector would be '[aria-labelledby="dropdownMapMeasures"] button.link-measure'

    let mapMeasuresLinks = document.querySelectorAll('.mapbutton');
    let trendMeasuresLinks = document.querySelectorAll('.trendbutton');
    let linksMeasuresLinks = document.querySelectorAll('.linksbutton');

    // adding click listeners using update functions
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#memory_issues

    mapMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateMapData);
    })

    trendMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateTrendData);
    })

    linksMeasuresLinks.forEach(link => {
        link.addEventListener('click', updateLinksData);
    })


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // add event handler functions to summary tab checkboxes
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    const checkboxYear = document.querySelectorAll('.checkbox-year');
    const checkboxGeo = document.querySelectorAll('.checkbox-geo');

    checkboxYear.forEach(checkbox => {
        handleYearFilter(checkbox);
    })
    checkboxGeo.forEach(checkbox => {
        handleGeoFilter(checkbox);
    })


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
    // Render default Measure About and Sources
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

    measureAbout = '';
    measureSources = '';
    indicatorMeasures.map(measure => {

        measureAbout +=
            `<h6>${measure.MeasurementType}</h6>
            <p>${measure.how_calculated}</p>`;

        measureSources +=
            `<h6>${measure.MeasurementType}</h6>
            <p>${measure.Sources}</p>`;

    })

    renderAboutSources(measureAbout, measureSources);

}

;
const renderTable = () => {

    console.log("** renderTable");
    
    const groupColumnYear = 0
    const groupColumnGeo = 1;
    const groupId = 0;
    let filteredTableData;

    const filteredTableYearData = 
        fullDataTableObjects
        .filter(d => selectedSummaryYears.includes(d.Time))

    // get geoTypes available for this year

    const dataGeos = [...new Set(filteredTableYearData.map(d => d.GeoType))];

    // console.log("dataGeos", dataGeos);

    // get all geo check boxes

    const allGeoChecks = document.querySelectorAll('.checkbox-geo');

    // console.log("allGeoChecks", allGeoChecks);

    let geosNotAvailable = [];
    
    // remove disabled class from every geo list element

    $(allGeoChecks).removeClass("disabled");
    $(allGeoChecks).attr('aria-disabled', false);
    
    // add disabled class for geos not available for this year
    for (const checkbox of allGeoChecks) {

        // console.log("checkbox", checkbox.children[0].value);

        if (!dataGeos.includes(checkbox.children[0].value)) {
            
            geosNotAvailable.push(checkbox)
            
            // set this element as disabled
            $(checkbox).addClass("disabled");
            $(checkbox).attr('aria-disabled', true);
            
        }

    }

    // console.log("geosNotAvailable", geosNotAvailable);

    // only render table if a geography is checked

    if (selectedSummaryGeography.length > 0) {
        
        filteredTableData = 
            filteredTableYearData
            .filter(d => selectedSummaryGeography.includes(d.GeoType))

    } else {
        
        // if no selected geo, then set table to blank and return early
        document.querySelector("#tableID").innerHTML = '';

        return;
    }
    
    // console.log("filteredTableData", filteredTableData);

    if (filteredTableData.length === 0) {

        // if no selected geos not in data, then set table to blank and return early
        document.querySelector("#tableID").innerHTML = '';
        
        return;

    }
    
    // console.log("filteredTableData [renderTable]", filteredTableData);
    
    const measureAlignMap = new Map();
    // const measureImputeMap = new Map();
    const measures = [...new Set(filteredTableData.map(d => d.MeasurementDisplay))];
    
    measures.forEach((m) => {
        
        measureAlignMap.set(m, "r")
        // measureImputeMap.set(m, () => "-")
        
    });
    
    const measureAlignObj = Object.fromEntries(measureAlignMap);
    // const measureImputeObj = Object.fromEntries(measureImputeMap);
    
    // console.log("measureAlignObj", measureAlignObj);
    // console.log("measureImputeObj", measureImputeObj);
    
    const filteredTableAqData = aq.from(filteredTableData)
        .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
    
        // need to put this down here because the data might be missing one of the measures, which will be undefined after the pivot
        // .impute(measureImputeObj) 
        
        // these 4 columns always exist, and we always want to hide them, so let's put them first, respecting the original relative order
        .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 }) 
    
    // console.log("filteredTableAqData [renderTable]");
    // filteredTableAqData.print({limit: 400})
    
    // export Arquero table to HTML
    
    document.getElementById('summary-table').innerHTML = 
        filteredTableAqData.toHTML({
            limit: Infinity,
            align: measureAlignObj, 
            null: () => "-" // use this to replace undefined
        });
    
    // this gives the table an ID (table code generated by Arquero)
    
    document.querySelector('#summary-table table').id = "tableID"
    
    // set some display properties 
    document.querySelector('#summary-table table').className = "cell-border stripe"
    document.querySelector('#summary-table table').width = "100%"
    
    // call function to show table
    
    $('#tableID').DataTable({
        scrollY: 475,
        scrollX: true,
        scrollCollapse: true,
        searching: false,
        paging: false,
        select: true,
        buttons: [
            {
                extend: 'csvHtml5',
                name: "thisView",
                filename: 'NYC EH Data Portal - ' + indicatorName + " (filtered)"
            }
        ],
        bInfo: false,
        fixedHeader: true,
        orderFixed: [ 3, 'asc' ], // GeoRank
        columnDefs: [
            { targets: [0, 1, 2, 3], visible: false}
        ],
        "createdRow": function ( row, data, index ) {
            // console.log('RENDER TABLE FUNCTION - CreatedRow')
            const time    = data[0];
            const geoType = data[1];
            if (time && geoType) {
                row.setAttribute(`data-group`, `${time}-${geoType}`)
                row.setAttribute(`data-year`, `${time}`);
            }
        },
        "drawCallback": function ( settings ) {
            // console.log('RENDER TABLE FUNCTION - DrawCallback')
            const api = this.api();
            const data = api.rows( {page:'current'} ).data()
            const rows = api.rows( {page:'current'} ).nodes();
            const totaleColumnsCount = api.columns().count()
            const visibleColumnsCount =  totaleColumnsCount - 4;
            
            let last = null;
            let lastYr = null;
            
            const createGroupRow = (groupColumn, lvl) => {
                
                api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {
                    
                    const year = data[i][0]
                    const groupName = `${year}-${group}`
                    
                    if ( last !== group || lastYr !== year ) {
                        
                        $(rows).eq( i ).before(
                            `<tr class="group"><td colspan="${visibleColumnsCount}" data-year="${year}" data-group="${group}" data-group-level="${lvl}"> ${group}</td></tr>`
                            );
                            last = group;
                            lastYr = year
                            
                        }
                    });
                }
                
                createGroupRow(groupColumnYear, 0);
                createGroupRow(groupColumnGeo, 1);
                handleToggle();
            }
        })

    }


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// handler functions for summary table
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

const handleToggle = () => {

    $('body').off('click', '#summary-table tr.group td');
    $('body').on('click', '#summary-table tr.group td', (e) => {

        const td = $(e.target);
        const tr = td.parent();
        const group = td.data('group');
        const groupLevel = td.data('group-level');

        const handleGroupToggle = () => {

            const subGroupToggle = $(`td[data-year="${group}"][data-group-level="1"]`);
            const subGroupRow = $(`tr[data-year="${group}"]`);

            if (subGroupToggle.css('display') === 'none') {
                subGroupToggle.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                td.removeClass('hidden');
                subGroupToggle.show();
                subGroupRow.show();
            } else {
                subGroupToggle.addClass('hidden');
                subGroupRow.addClass('hidden');
                td.addClass('hidden');
                subGroupToggle.hide();
                subGroupRow.hide();
            }
        }

        const handleSubGroupToggle = () => {

            const subDataGroup = tr.next(`tr`).data(`group`);
            const parentDataGroup = subDataGroup.split('-')[0];
            const subGroupRow = $(`tr[data-group="${subDataGroup}"]`);
            const parentGroupToggle = $(`td[data-group="${parentDataGroup}"]`);

            if (subGroupRow.css('display') == 'none')  {
                subGroupRow.show();
                td.removeClass('hidden');
                subGroupRow.removeClass('hidden');
                parentGroupToggle.removeClass('hidden');
            } else {
                subGroupRow.hide();
                td.addClass('hidden');
                subGroupRow.addClass('hidden');
            }
        }

        if (groupLevel === 0) {
            handleGroupToggle();
        } else {
            handleSubGroupToggle();
        }

    });
}

;
const renderMap = (
    data,
    metadata
    ) => {

        console.log("** renderMap");

        // get unique time in data

        const mapYears =  [...new Set(data.map(item => item.Time))];

        // console.log("mapYears [map.js]", mapYears);

        let mapGeoType            = data[0].GeoType;
        let mapMeasurementType    = metadata[0].MeasurementType;
        let mapGeoTypeDescription = 
            metadata[0].AvailableGeographyTypes.filter(
                gt => gt.GeoType === mapGeoType
            )[0].GeoTypeDescription;

        let mapDisplay = metadata[0].DisplayType;
        let mapTime = mapYears[0];
        let topoFile = '';

        // can add year to this

        console.log("mapGeoType [renderMap]", mapGeoType);

        if (mapGeoType === "NTA") {
            topoFile = 'NTA.topo.json';
        } else if (mapGeoType === "CD") {
            topoFile = 'CD.topo.json';
        } else if (mapGeoType === "PUMA") {
            topoFile = 'PUMA_or_Subborough.topo.json';
        } else if (mapGeoType === "Subboro") {
            topoFile = 'PUMA_or_Subborough.topo.json';
        } else if (mapGeoType === "UHF42") {
            topoFile = 'UHF42.topo.json';
        } else if (mapGeoType === "UHF34") {
            topoFile = 'UHF34.topo.json';
        } else if (mapGeoType === "NYCKIDS") {
            topoFile = 'NYCKids.topo.json';
        }

        
        // define spec
        
        mapspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": {
                "text": `By ${mapGeoTypeDescription}, ${mapTime}`,
                "subtitlePadding": 10
            },
            "data": {
                "values": data,
                "format": {
                    "parse": {
                        "Value": "number"
                    }
                }
            },
            "config": {
                "concat": {"spacing": 20}, 
                "view": {"stroke": "transparent"},
                "axisY": {"domain": false,"ticks": false},
                "title": {
                    "fontWeight": "normal"
                  },
                "legend": {
                    "offset": -25,
                    "titleFontWeight": "normal",
                }
            },
            "projection": {"type": "mercator"},
            "vconcat": [
                {
                    "layer": [
                        {
                            "height": 500,
                            "width": "container",
                            "data": {
                                "url": `${data_repo}/${data_branch}/geography/borough.topo.json`,
                                "format": {
                                    "type": "topojson",
                                    "feature": "collection"
                                }
                            },
                            "mark": {
                                "type": "geoshape",
                                "stroke": "#fafafa",
                                "fill": "#C5C5C5",
                                "strokeWidth": 0.5
                            }
                        },
                        {
                            "height": 500,
                            "width": "container",
                            "mark": {"type": "geoshape", "invalid": null},
                            "params": [
                                {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
                            ],
                            "transform": [
                                {
                                    "lookup": "GeoID",
                                    "from": {
                                        "data": {
                                            "url": `${data_repo}/${data_branch}/geography/${topoFile}`,
                                            "format": {"type": "topojson", "feature": "collection"}
                                        },
                                        "key": "properties.GEOCODE"
                                    },
                                    "as": "geo"
                                }
                            ],
                            "encoding": {
                                "shape": {"field": "geo", "type": "geojson"},
                                "color": {
                                    "condition": {
                                        "test": "isValid(datum.Value)",
                                        "bin": false,
                                        "field": "Value",
                                        "type": "quantitative",
                                        "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}}
                                    },
                                    "value": "#808080"
                                },
                                "stroke": {
                                    "condition": [{"param": "highlight", "empty": false, "value": "orange"}],
                                    // "value": "#161616"
                                    "value": "#dadada"
                                },
                                "strokeWidth": {
                                    "condition": [{"param": "highlight", "empty": false, "value": 1.25}],
                                    "value": 0.5
                                },
                                "order": {
                                    "condition": [{"param": "highlight", "empty": false, "value": 1}],
                                    "value": 0
                                },
                                "tooltip": [
                                    {"field": "Geography", "title": "Neighborhood"},
                                    {
                                        "field": "Value",
                                        "type": "quantitative",
                                        "title": mapMeasurementType,
                                        "format": ",.1~f"
                                    },
                                ],
                            },
                        }
                    ]
                },
                {
                    "height": 150,
                    "width": "container",
                    "config": {
                        "axisY": {
                            "labelAngle": 0,
                            "labelFontSize": 13,
                        }
                    },
                    "mark": {"type": "bar", "tooltip": true, "stroke": "#161616"},
                    "params": [
                        {"name": "highlight", "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}}
                    ],
                    "encoding": {
                        "y": {
                            "field": "Value", 
                            "type": "quantitative", 
                            "title": null,
                            "axis": {
                                "labelAngle": 0,
                                "labelFontSize": 11,
                            }
                        },
                        "tooltip": [
                            {
                                "field": "Geography", 
                                "title": "Neighborhood"
                            },
                            {
                                "field": "Value", 
                                "type": "quantitative", 
                                "title": mapMeasurementType,
                                "format": ",.1~f"
                            },
                        ],
                        "x": {"field": "GeoID", "sort": "y", "axis": null},
                        "color": {
                            "bin": false,
                            "field": "Value",
                            "type": "quantitative",
                            "scale": {"scheme": {"name": "purples", "extent": [0.25, 1]}},
                            "legend": {"direction": "horizontal","orient": "top-left","title": `${mapMeasurementType}`}
                        },
                        "stroke": {
                            "condition": [{"param": "highlight", "empty": false, "value": "orange"}],
                            "value": "white"
                        },
                        "strokeWidth": {
                            "condition": [{"param": "highlight", "empty": false, "value": 3}],
                            "value": 0
                        }
                    }
                }
            ]
        }
        
        vegaEmbed("#map", mapspec);
    }
;
const renderTrendChart = (
    data,
    metadata
) => {

    console.log("** renderTrendChart");

    // arquero table for extracting arrays easily

    let aqData = aq.from(data);
    let Value = aqData.array("Value");
    let valueMin = Math.min.apply(null, Value);

    // extract measure metadata

    let trendMeasurementType = metadata[0].MeasurementType;
    let trendDisplay = metadata[0].DisplayType;

    // get dimensions
    var columns = 6;
    var height = 500
    window.innerWidth < 576 ? columns = 3 : columns = 6;
    window.innerWidth < 576 ? height = 350 : columns = 500;

    
    // define spec
    
    let trendspec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "config": {
            "background": "#FFFFFF",
            "axisX": {
                "labelAngle": 0,
                "labelOverlap": "parity",
                "labelFontSize": 11,
                "titleFontSize": 13,
                "titleFont": "sans-serif",
                "titlePadding": 10
            },
            
            "axisY": {
                "labelAngle": 0,
                "labelFontSize": 11,
            },
            "legend": {
                "columns": columns,
                "labelFontSize": 14,
                "symbolSize": 140
            },
            "title": {
                "fontWeight": "normal"
                },
            "view": {"stroke": "transparent"},
            "range": {
                "category": [
                    "#1696d2",
                    "#fdbf11",
                    "#ec008b",
                    "#000000",
                    "#a8a8a8",
                    "#55b748"
                ]
            },
            
            "line": {"color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3},
            
            "point": {"filled": true},
            "text": {
                "color": "#1696d2",
                "fontSize": 11,
                "fontWeight": 400,
                "size": 11
            }
        },
        "data": {
            "values":  data,
        },
        "width": "container",
        "height": height,
        "title": { 
            "anchor": "start", 
            "fontSize": 13, 
            "font": "sans-serif",
            "baseline": "top",
            "text": `${trendMeasurementType} ${trendDisplay && `(${trendDisplay})`}`,
            "dy": -10
        },
        "encoding": {
            "x": {
                "field": "Time",
                "type": "nominal",
                "title": null
            }
        },
        "layer": [
            {
                "encoding": {
                    "color": {
                        "field": "Geography",
                        "type": "nominal",
                        "legend": {
                            "orient": "bottom",
                            "title": null
                        }
                    },
                    "y": {
                        "field": "Value",
                        "type": "quantitative",
                        "title": null,
                        "scale": {"domainMin": 0, "nice": true} // change domainMin to valueMin to scale with data
                    }
                },
                "layer": [
                    {
                        "mark": {
                            "type": "line",
                            "point": {"filled": false, "fill": "white"}
                        }
                        
                    },
                    {
                        "transform": [
                            {
                                "filter": {
                                    "param": "hover",
                                    "empty": false
                                }
                            }
                        ],
                        "mark": "point"
                    }
                ]
            },
            {
                "transform": [
                    {
                        "pivot": "Geography",
                        "value": "Value",
                        "groupby": [
                            "Time"
                        ]
                    }
                ],
                "mark": "rule",
                "encoding": {
                    "opacity": {
                        "condition": {
                            "value": 0.3,
                            "param": "hover",
                            "empty": false
                        },
                        "value": 0
                    },
                    "tooltip": [
                        {
                            "title": "Year",
                            "field": "Time",
                            "type": "nominal"
                        },
                        {
                            "field": "New York City",
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "field": "Bronx",
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "field": "Brooklyn",
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "field": "Manhattan",
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "field": "Queens",
                            "type": "quantitative",
                            "format": ",.1~f"
                        },
                        {
                            "field": "Staten Island",
                            "type": "quantitative",
                            "format": ",.1~f"
                        }
                    ]
                },
                "params": [
                    {
                        "name": "hover",
                        "select": {
                            "type": "point",
                            "fields": [
                                "Time"
                            ],
                            "nearest": true,
                            "on": "mouseover",
                            "clear": "mouseout"
                        }
                    }
                ]
            }
        ]
    }
    
    vegaEmbed("#trend", trendspec);
    
}
;
const renderLinksChart = (
    data,
    primaryMetadata,   // indicators.json for primary indicator
    secondaryMetadata, // indciators.json for secondary indicator
    primaryIndicatorName,
    secondaryIndicatorName,
) => {

    console.log("** renderLinksChart");

    // arquero table for extracting arrays easily

    let aqData = aq.from(data);
    let Value_1 = aqData.array("Value_1");
    let Value_2 = aqData.array("Value_2");

    // get measure metadata

    const primaryMeasurementType = primaryMetadata[0].MeasurementType;
    const primaryMeasureName     = primaryMetadata[0].MeasureName;
    const primaryDisplay         = primaryMetadata[0].DisplayType;
    const primaryTime            = data[0].Time_1;

    const primaryGeoType = data[0].GeoType; // from the actual data we're charting

    const primaryGeoTypeDescription = 
        primaryMetadata[0].AvailableGeographyTypes.filter(
            gt => gt.GeoType === primaryGeoType
        )[0].GeoTypeDescription;    

    const secondaryMeasurementType = secondaryMetadata[0].MeasurementType
    const secondaryMeasureName     = secondaryMetadata[0].MeasureName
    const secondaryMeasureId       = secondaryMetadata[0].MeasureID
    const secondaryDisplay         = secondaryMetadata[0].DisplayType;
    const secondaryTime            = data[0].Time_2;

    const SecondaryAxis = 
        primaryMetadata[0].VisOptions[0].Links.filter(
            l => l.MeasureID === secondaryMeasureId
        )[0].SecondaryAxis;


    // switch field assignment based on SecondaryAxis preference

    let xMeasure;
    let yMeasure;
    let xMeasureName;
    let yMeasureName;
    let xDisplay = null;
    let yDisplay = null;
    let xTime;
    let yTime;
    let xIndicatorName;
    let yIndicatorName;
    let xMin;

    switch (SecondaryAxis) {
        case 'x':
            xMeasure = secondaryMeasurementType;
            yMeasure = primaryMeasurementType;
            xMeasureName = secondaryMeasureName;
            yMeasureName = primaryMeasureName;
            xValue = "Value_2";
            yValue = "Value_1";
            xMin = Math.min.apply(null, Value_2); // get min value for adjusting axis
            xDisplay = secondaryDisplay ? secondaryDisplay : '';
            yDisplay = primaryDisplay ? primaryDisplay : '';
            xTime = secondaryTime;
            yTime = primaryTime;
            xIndicatorName = secondaryIndicatorName;
            yIndicatorName = primaryIndicatorName;
            break;
        case 'y':
            xMeasure = primaryMeasurementType;
            yMeasure = secondaryMeasurementType;
            xMeasureName = primaryMeasureName;
            yMeasureName = secondaryMeasureName;
            xValue = "Value_1";
            yValue = "Value_2";
            xMin = Math.min.apply(null, Value_1); // get min value for adjusting axis
            xDisplay = primaryDisplay ? primaryDisplay : '';
            yDisplay = secondaryDisplay ? secondaryDisplay : '';
            xTime = primaryTime;
            yTime = secondaryTime;
            xIndicatorName = primaryIndicatorName;
            yIndicatorName = secondaryIndicatorName;
            break;
    }

    // get dimensions
    var legendOrientation = "bottom"
    var columns = 6;
    var bubbleSize = 200;
    var height;
    window.innerWidth < 576 ? bubbleSize = 100: bubbleSize = 200
    window.innerWidth < 576 ? columns = 3 : columns = 6;
    window.innerWidth < 576 ? height = 350 : height = 500;


    // define spec

    setTimeout(() => {

        let linkspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Asthma 5-17 ED visit rate and poverty scatterplot",
            "title": {
                "text": [`${yIndicatorName && `${yIndicatorName}`}`, `${yMeasure && `${yMeasure}`} ${yDisplay && `${yDisplay}`} (${yTime})`],
                "align": "left", 
                "anchor": "start", 
                "fontSize": 12, 
                "fontWeight": "normal",
                "font": "sans-serif",
                "baseline": "top",
                "dy": -10,
                "limit": 1000
            },            
            "width": "container",
            "height": height,
            "config": {
                "background": "#FFFFFF",
                "axisX": {
                    "labelFontSize": 11,
                    "titleFontSize": 12,
                    "titleFont": "sans-serif",
                    "titlePadding": 10,
                    "titleFontWeight": "normal"
                },
                "axisY": {
                    "labelFontSize": 11,
                    "titleFontSize": 0, // to turn off axis title
                    "labelAngle": 0,
                    "titlePadding": 10,
                    "titleFont": "sans-serif",
                },
                "legend": {
                    "columns": columns,
                     "labelFontSize": 14,
                     "symbolSize": 140,
                     "orient": legendOrientation,
                     "title": null
                 },
                "view": { "stroke": "transparent" },
                "range": {
                    "category": [
                        "#1696d2",
                        "#fdbf11",
                        "#ec008b",
                        "#a8a8a8",
                        "#55b748"
                    ]
                },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "align": "center",
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values": data
            },
            "layer":[
                {
                    "mark": { 
                        "type": "circle", 
                        "filled": true, 
                        "size": bubbleSize, // update based on Screen Size.
                        "stroke": "#7C7C7C", 
                        "strokeWidth": 2
                    },
                    "params": [
                        {
                            "name": "borough",
                            "select": { "type": "point", "fields": ["Borough"], "on": "click" },
                            "bind": "legend"
                        },
                        {
                            "name": "hover",
                            "value": "#7C7C7C",
                            "select": { "type": "point", "on": "mouseover" }
                        }
                    ],
                    "encoding": {
                        "y": {
                            "field": yValue,
                            "type": "quantitative"
                        },
                        "x": {
                            "title": [`${xIndicatorName && `${xIndicatorName}`}`, `${xMeasure} ${xDisplay && `(${xDisplay})`} (${xTime})`],
                            "field": xValue,
                            "type": "quantitative",
                            "scale": {"domainMin": xMin, "nice": true}
                        },
                        "tooltip": [
                            {
                                "title": "Borough",
                                "field": "Borough",
                                "type": "nominal"
                            },
                            {
                                "title": "Neighborhood",
                                "field": "Geography_1",
                                "type": "nominal"
                            },
                            {
                                "title": "Time",
                                "field": "Time_2",
                                "type": "nominal"
                            },
                            {
                                "title": yMeasureName,
                                "field": yValue,
                                "type": "quantitative",
                                "format": ",.1~f"
                            },
                            {
                                "title": xMeasureName,
                                "field": xValue,
                                "type": "quantitative",
                                "format": ",.1~f"
                            }
                        ],
                        "color": {
                            "title": "Borough",
                            "field": "Borough",
                            "type": "nominal"
                        },
                        "opacity": {
                            "condition": {
                                "param": "borough",
                                "empty": true,
                                "value": 1
                            },
                            "value": 0.2
                        },
                        "stroke": {
                            "condition": {
                                "param": "hover",
                                "empty": false,
                                "value": "#7C7C7C"
                            },
                            "value": null
                        }
                    }
                },
                {"mark": {
                    "type": "line",
                    "color": "darkgray"
                  },
                  "transform": [
                    {
                      "regression": yValue,
                      "on": xValue
                    }
                  ],
                  "encoding": {
                    "x": {
                      "field": xValue,
                      "type": "quantitative"
                    },
                    "y": {
                      "field": yValue,
                      "type": "quantitative"
                    }
                  }
                }
            ]

        }

        vegaEmbed("#links", linkspec);

    }, 300)

}
;
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to create the dataset for the disparities chart
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// need to filter for relevant disparities geo (current = GeoType, future += GeoEntity)

const loadDisparitiyData = async (disparityMetadata, disparityIndicatorId) => {

    // extract disparity metadata

    const disparityMeasureId      = disparityMetadata[0].MeasureID
    const aqDisparityMeasureTimes = aq.from(disparityMetadata[0].AvailableTimes)

    // create primary data

    const aqPrimaryData = 
        aq.from(fullDataLinksObjects) // fullDataTrendObjects is created by the joinData function
        .select("GeoType", "GeoRank", "GeoID", "Time", "end_period", "Value", "DisplayValue")
        .reify()

    // aqPrimaryData.print()

    let maxGeoRank = Math.max(aqPrimaryData.objects()[0].GeoRank);
    // console.log("maxGeoRank", maxGeoRank);
    let filteredPrimaryData = aqPrimaryData.filter(`obj => obj.GeoRank == ${maxGeoRank}`)

    // filteredPrimaryData.print({limit: Infinity})
    
    // get disparity data
    
    await fetch(`${data_repo}/${data_branch}/indicators/data/${disparityIndicatorId}.json`)
        .then(response => response.json())
        .then(data => {

            // create disparities data
            
            const aqDisparityData = aq.from(data)

                // filter for disparity measure

                .filter(`d => d.MeasureID === ${disparityMeasureId}`)

                // join with disparity measure times

                .join(aqDisparityMeasureTimes, ["Time", "TimeDescription"])

                // create tertile column

                .derive({
                    bin: aq.bin('Value', { maxbins: 3 }),
                })
                .derive({
                    Tertile: aq.escape( d => d.bin === 0 && 'low' || d.bin === 20 && 'med' || d.bin === 40 && 'hi')
                })

                // pare down columns

                .select("GeoType", "GeoID", "Time", "end_period", "bin", "Tertile")
                .reify()
            
            
            // (inner) join with primary data

            disparitiyData = 
                filteredPrimaryData
                .join(aqDisparityData, [["GeoType", "GeoID", "end_period"], ["GeoType", "GeoID", "end_period"]])

                // summarize by  grouping
                .groupby("Time_1", "Tertile", "GeoType")
                .rollup({median: d => op.median(d.Value)})

                // turn into JavaScript object

                .objects()
            
            // console.log("disparitiyData", disparitiyData);

        })
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// function to render the disparities chart
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// this function is called when the "Show Disparities" button is clicked. it
//  in turn calls "loadDisparitiyData".

const renderDisparities = async (primaryMetadata, disparityMeasureId) => {

    console.log("** renderDisparities");
    
    // remove disparities event listeners
    $(btnShowDisparities).off()

    // add trend event listener
    $(btnShowDisparities).on("click", e => showTrend(e));

    // switch button text
    btnShowDisparities.innerText = "Show Trend";


    // extract primary metadata

    let primaryIndicatorName   = indicatorName
    let primaryMeasurementType = primaryMetadata[0].MeasurementType;
    let primaryDisplay         = primaryMetadata[0].DisplayType;
    let primaryAbout           = primaryMetadata[0]?.how_calculated;
    let primarySources         = primaryMetadata[0].Sources;

    // get disparities poverty indicator metadata - "indicators" is a global object created by loadIndicator

    const disparityIndicator = indicators.filter(indicator =>
        indicator.Measures.some(m =>
            m.MeasureID === disparityMeasureId
        )
    );

    const disparityMetadata = disparityIndicator[0].Measures.filter(
        m => m.MeasureID === disparityMeasureId
    );

    // put metadata into fields

    const disparityIndicatorId     = disparityIndicator[0].IndicatorID
    const disparityIndicatorName   = disparityIndicator[0].IndicatorName
    const disparityMeasurementType = disparityMetadata[0].MeasurementType
    const disparitySources         = disparityMetadata[0].Sources
    const disparitysAbout          = disparityMetadata[0].how_calculated

    // load disparities measure data (creates `disparitiyData`)

    await loadDisparitiyData(disparityMetadata, disparityIndicatorId)
    
    // get min value for adjusting axis
    
    let aqData = aq.from(disparitiyData);
    let median = aqData.array("median");
    let medianMin = Math.min.apply(null, median);

    // created combined about and sources info

    const combinedAbout = 
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primaryAbout}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitysAbout}</p>`;

    const combinedSources = 
        `<h6>${primaryIndicatorName} - ${primaryMeasurementType}</h6>
        <p>${primarySources}</p>
        <h6>${disparityIndicatorName} - ${disparityMeasurementType}</h6>
        <p>${disparitySources}</p>`;

    // render combined info

    renderAboutSources(combinedAbout, combinedSources);
    
    // define spec
    
    setTimeout(() => {
        
        let disspec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "config": {
                "background": "#FFFFFF",
                "axisX": {
                    "labelAngle": 0,
                    "labelOverlap": "parity",
                    "labelFontSize": 11,
                    "titleFontSize": 13,
                    "titleFont": "sans-serif"
                },
                
                "axisY": {
                    "labelAngle": 0,
                    "labelFontSize": 11,
                    "titleFontSize": 13
                },
                "legend": {
                    "labelFontSize": 14,
                    "titleFontSize": 14,
                    "symbolSize": 140,
                    "titlePadding": 10
                },
                "lineBreak": "\n",
                
                "view": { "stroke": "transparent" },
                
                "range": {
                    "category": [
                        "#FFC425",
                        "#21918c",
                        "#440154"
                    ]
                },
                
                "line": { "color": "#1696d2", "stroke": "#1696d2", "strokeWidth": 3 },
                
                
                "point": { "filled": true },
                "text": {
                    "color": "#1696d2",
                    "fontSize": 11,
                    "fontWeight": 400,
                    "size": 11
                }
            },
            "data": {
                "values": disparitiyData,
            },
            "width": "container",
            "height": 500,
            "title": { 
                "anchor": "start", 
                "fontSize": 13, 
                "font": "sans-serif",
                "baseline": "top",
                "text": `${primaryMeasurementType} ${primaryDisplay && `(${primaryDisplay})`}`,
                "dy": -10
            },
            "encoding": {
                "x": {
                    "field": "Time_1",
                    "type": "nominal",
                    "title": null
                }
            },
            "layer": [
                {
                    "encoding": {
                        "color": {
                            "field": "Tertile",
                            "type": "nominal",
                            "legend": {
                                "orient": "right",
                                // "title": `${disparityIndicatorName}, ${disparityMeasurementType}`
                                "title": "Neighborhood \n poverty level",
                                "values": ["hi", "med", "low"]
                            }
                        },
                        "y": {
                            "field": "median",
                            "type": "quantitative",
                            "title": null,
                            "scale": {"domainMin": medianMin, "nice": true}
                        }
                    },
                    "layer": [
                        {
                            "mark": {
                                "type": "line",
                                "point": { "filled": false, "fill": "white" }
                            }
                            
                        },
                        {
                            "transform": [
                                {
                                    "filter": {
                                        "param": "hover",
                                        "empty": false
                                    }
                                }
                            ],
                            "mark": "point"
                        }
                    ]
                },
                {
                    "transform": [
                        {
                            "pivot": "Tertile",
                            "value": "median",
                            "groupby": [
                                "Time_1"
                            ]
                        }
                    ],
                    "mark": "rule",
                    "encoding": {
                        "opacity": {
                            "condition": {
                                "value": 0.3,
                                "param": "hover",
                                "empty": false
                            },
                            "value": 0
                        },
                        "tooltip": [
                            {
                                "title": "Time",
                                "field": "Time_1",
                                "type": "nominal"
                            },
                            {
                                "field": "hi",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                            {
                                "field": "med",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                            {
                                "field": "low",
                                "type": "quantitative",
                                "format": ",.1f"
                            },
                        ]
                    },
                    "params": [
                        {
                            "name": "hover",
                            "select": {
                                "type": "point",
                                "fields": [
                                    "Time_1"
                                ],
                                "nearest": true,
                                "on": "mouseover",
                                "clear": "mouseout"
                            }
                        }
                    ]
                }
            ]
        }
        
        vegaEmbed("#trend", disspec);
        
    }, 300)

}
;

// clicking on the indicator dropdown calls loadIndicator with that IndicatorID

// call loadindicator when traversing through the history

window.onpopstate = function (event) {

    const new_url = new URL(window.location);
    let new_indicatorId = parseFloat(new_url.searchParams.get('id'));

    if (new_indicatorId != indicatorId) {

        loadIndicator(new_indicatorId, true)

    }
};

window.addEventListener("hashchange", () => {

    const hash = window.location.hash.replace('#', "");

    switch (hash) {

        // using fallthrough

        case 'display=summary':
        case 'tab-table':
            currentHash = 'display=summary';
            $('#tab-btn-table').tab('show');
            showTable();
            break;

        case 'display=map':
        case 'tab-map':
            currentHash = 'display=map';
            $('#tab-btn-map').tab('show');
            showMap();
            break;

        case 'display=trend':
        case 'tab-trend':
            currentHash = 'display=trend';
            $('#tab-btn-trend').tab('show');
            showTrend();
            break;

        case 'display=links':
        case 'tab-links':
            currentHash = 'display=links';
            $('#tab-btn-links').tab('show');
            showLinks();
            break;

        default:
            currentHash = 'display=summary';
            break;
    }

    state = window.history.state;


});


document.addEventListener("DOMContentLoaded", () => {

    tabTable = document.querySelector('#tab-btn-table');
    tabMap = document.querySelector('#tab-btn-map');
    tabTrend = document.querySelector('#tab-btn-trend');
    tabLinks = document.querySelector('#tab-btn-links');

    aboutMeasures = document.querySelector('.indicator-measures');
    dataSources = document.querySelector('.indicator-sources');

});

function reveal() {
    document.getElementById('truncate').classList.toggle('hide');
    document.getElementById('full').classList.toggle('show');
    document.getElementById('contenttoggle').innerHTML = `Show less... <i class="fas fa-caret-square-up" aria-hidden="true"></i>`;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
// add listeners to tabs
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

// ===== table ===== /

$('#tab-btn-table').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=summary'
})

// ===== map ===== /

$('#tab-btn-map').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=map'
})   

// ===== trend ===== /

$('#tab-btn-trend').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=trend'
})  

// ===== links ===== /

$('#tab-btn-links').on('click', e => {
    $(e.currentTarget).tab('show');
    window.location.hash = 'display=links'
})


// export current table view

$("#thisView").on("click", (e) => {

    let summaryTable = $('#tableID').DataTable();
    summaryTable.button("thisView:name").trigger();

    gtag('event', 'file_download', {
        'file_name': 'NYC EH Data Portal - ' + indicatorName + " (filtered)" + '.csv',
        'file_extension': '.csv',
        'link_text': 'Current table view'
    });

    e.stopPropagation();

});

// export full table data (i.e., original view)

$("#allData").on("click", (e) => {

    // pivot the full dataset

    let allData = aq.from(fullDataTableObjects)
        .groupby("Time", "GeoType", "GeoID", "GeoRank", "Geography")
        .pivot("MeasurementDisplay", "DisplayCI")
        .relocate(["Time", "GeoType", "GeoID", "GeoRank"], { before: 0 })

    let downloadTableCSV = allData.toCSV();

    // Data URI
    let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
    let hiddenElement = document.createElement('a');

    hiddenElement.href = csvData;
    hiddenElement.target = '_blank';
    hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (full)" + '.csv';
    hiddenElement.click();

    gtag('event', 'file_download', {
        'file_name': hiddenElement.download,
        'file_extension': '.csv',
        'link_text': 'Full table for this indicator'
    });

    e.stopPropagation();

});

// export raw dataset

$("#rawData").on("click", (e) => {

    let dataURL = data_repo + "/" + data_branch + '/indicators/data/' + indicatorId + '.json'

    // console.log('Data are at: ' + dataURL)

    aq.loadJSON(`${dataURL}`).then(function(data) {

        let downloadTable = data;
        let downloadTableCSV = downloadTable.toCSV();

        // Data URI
        let csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(downloadTableCSV);
        let hiddenElement = document.createElement('a');

        hiddenElement.href = csvData;
        hiddenElement.target = '_blank';
        hiddenElement.download = 'NYC EH Data Portal - ' + indicatorName + " (raw)" + '.csv';
        hiddenElement.click();

        gtag('event', 'file_download', {
            'file_name': hiddenElement.download,
            'file_extension': '.csv',
            'link_text': 'Raw data for this indicator'
        });

        e.stopPropagation();

    })
});

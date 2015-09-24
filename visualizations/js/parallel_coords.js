var margin = {top: 120, right: 10, bottom: 20, left: 80},
    width = 1350 - margin.left - margin.right,  //1800
    height = 800 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var strokeWidth = 1.0
    defaultStrokeDasharray = 3;
var lastPathSelected;
var defaultPathColour = "steelblue",
    currentSelectionColour = "red",
    lastSelectionColour = null;
var opacity = 90;

var svg = d3.select("#plot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// @todo - extract from data
var numericHeaders = [],
    suppressedHeaders = []
    hiddenAxesLocations = [],
    skillNotDefined = [];
var removingAxis;
var dimensions, dataHeaders;

var summaries = [],
    termFrequencyMax, termFrequencyMedian;
var medianFrequencyLabel = "Median frequency",
    maxFrequencyLabel = "Max frequency";

var minFrequency = maxFrequency = 0;
var datePostedEmpty = true,
    firstSeenEmpty = true,
    lastSeenEmpty = true;
var minValidDate = Date.now(),
    maxValidDate = new Date(0);


function drawParallelCoordinates(dataFile, fileDelimiter, skills, ignoredHeaders) {
  var dsv = d3.dsv(fileDelimiter, "text/utf-8");  // plain
  dsv(dataFile, function(error, highDData) {
    if (error)  // really should write to screen...
      throw error;


    highDData.sort(function(a, b) {
      // reverse chronological
      if (a.datePosted > b.datePosted)
        return 1;
      else if (a.datePosted < b.datePosted)
        return -1;

      if (a.firstSeen > b.firstSeen)
        return 1;
      else if (a.firstSeen < b.firstSeen)
        return -1;

      // chronological
      else if (a.lastSeen < b.lastSeen)
        return 1;
      else if (a.lastSeen > b.lastSeen)
        return -1;
      return 0;

    })/*.filter(function(d) {//@todo - update...
                  console.log(d.firstSeen + " - " + d.lastSeen);
                  var test = isoDateFormat.parse(d.lastSeen);
                  if (formatDateDby(test) != null) //{
                  console.log("SIGH");
                    return d;
                  //}
    })*/;

//  console.log("data: " + highDData);


    Object.keys(skills).forEach(function (skillSet) {
      skills[skillSet].forEach(function (skill) {
        numericHeaders.push(skill);
      });
    });

    suppressedHeaders = ignoredHeaders;

    /////////////

    var colourCodesDomain = [];

    highDData.forEach(function (d, i) {

      colourCodesDomain.push(d.identifier);

      //2015-05-13T01:21:07
      if (d.datePosted.trim() != "") {
        d.datePosted = isoDateFormat.parse(d.datePosted);

        if (d.datePosted != null) {
          if (d.datePosted < minValidDate)
            minValidDate = d.datePosted;
          else if (d.datePosted > maxValidDate)
            maxValidDate = d.datePosted;
        }

        if (datePostedEmpty) // need to set only once
          datePostedEmpty = false;
      }

      if (d.firstSeen.trim() != "") {
        d.firstSeen = isoDateFormat.parse(d.firstSeen);

        if (d.firstSeen != null) {
          if (d.firstSeen < minValidDate)
            minValidDate = d.firstSeen;
          else if (d.firstSeen > maxValidDate)
            maxValidDate = d.firstSeen;
        }

        if (firstSeenEmpty)
          firstSeenEmpty = false;
      }

      if (d.lastSeen.trim() != "") {
        d.lastSeen = isoDateFormat.parse(d.lastSeen);

        if (d.lastSeen != null) {
          if (d.lastSeen < minValidDate)
            minValidDate = d.lastSeen;
          else if (d.lastSeen > maxValidDate)
            maxValidDate = d.lastSeen;
        }

        if (lastSeenEmpty)
          lastSeenEmpty = false;
      }

      try {
        formatDateDby(d.datePosted)
       } catch (error) {
//         console.log("ALERT - error in datePosted: " + d.identifier + ": " + d.title); // whichever date broke will be empty or null...
         d.datePosted = new Date(-1); //- new Date() === Date.now()
       }

      try {
        formatDateDby(d.firstSeen)
       } catch (error) {
//         console.log("ALERT - error in firstSeen: " + d.identifier + ": " + d.lastSeen + " - " + d.title); // whichever date broke will be null...
         d.firstSeen = new Date(-1);
       }
      try {
          formatDateDby(d.lastSeen)
      } catch (error) {
//            console.log("ALERT - error in lastSeen: " + d.identifier + ": " + d.firstSeen + " - " + d.title); // whichever date broke will be null...
        d.lastSeen = new Date(-1);
      }

      minFrequency = Math.min(minFrequency, d.minValue);
      maxFrequency = Math.max(maxFrequency, d.maxValue);

      Object.keys(d).forEach(function(g) {

        if (!summaries[g]) {
          summaries[g] = [];
          summaries.push(summaries[g]);
        }
        if (contains(numericHeaders, g, true))
          summaries[g].push(+d[g]); // need to eliminate text bleeding into first... // will cause problems - need to strip out all such entries...
        else
          summaries[g].push("");  // or breaks axis labels...
      });

    }); // end iteration through dataset

    buildSkillsetPanel("selectorPanel", skills, true, summaries);


    // finalise other stats ...
    termFrequencyMedian = termFrequencyMax = [];
    Object.keys(summaries).forEach(function(g) {
      termFrequencyMedian[g] = d3.median(summaries[g]);
      termFrequencyMax[g] = d3.max(summaries[g]);

      if ((termFrequencyMax[g] === 0) && contains(numericHeaders, g, true))
        skillNotDefined.push(g);
    });

    termFrequencyMax.identifier = maxFrequencyLabel;
    termFrequencyMax.dataSourceId = "";
    highDData[highDData.length] = termFrequencyMax;

    colourCodesDomain = d3.set(colourCodesDomain).values();

    var cDomain = [], cRange = [],
        colourSelector = d3.merge([ // set full first as may need to extend range...
                                    colorbrewer.Spectral[11],
                                    colorbrewer.Accent[8],
                                    colorbrewer.GnBu[9],  //YlOrBr[9],
                                    colorbrewer.PuBuGn[9],
                                    colorbrewer.PuOr[9],
                                    colorbrewer.Set3[12],
                                  ]);

//    if (skills) { // need to filter...// no longer filtering on skills - need to set this to "filterVariable"
//     colourCodesDomain.forEach(function (d, i) {
//
//       if (contains(skills, d)) {
//         cRange.push(colourSelector[i]);
//         cDomain.push(colourCodesDomain[i]);
//
//       console.log(d + " :- " + colourSelector[i] + " - " + colourCodesDomain[i]);
//       }
//     }); // end forEach ...
//    } else {

      cRange = colourSelector;
      cDomain = colourCodesDomain;

//    } // end legend filter...

    colourCodesLib = d3.scale.ordinal()
                       .range(cRange)
                       .domain(cDomain);

    dataHeaders = d3.keys(highDData[0]);
    setAxesDomains(highDData);
    drawPlot(highDData);
    drawAxes(dimensions);

//  header...
//////    svg.append("text")
//////      .attr("x", 400)
//////      .attr("y", 0 - (margin.top / 1.75))
//////      .attr("text-anchor", "text")
//////      .style("font-size", "20px")
//////  //          .style("text-decoration", "underline")
//////      .text("Overview (Parallel Coordinates Plot)"); // header
////
//

  }); // end d3.c,d,tsv
}

// @todo - complete/reimplement
function drawStaggeredParallelCoordinates(error, dump1, dump2, dump3) {
}

function setAxesDomains(highDData) {
  x.domain(dimensions = dataHeaders.filter(function(d) {
    if (contains(suppressedHeaders, d, true) ||
      /*(d === "identifier") ||//Job ID
//          (d === "dataSourceId") ||
        (d === "description") ||
        (d === "title") ||
        (d === "minValue") || (d === "maxValue") ||*/
        ( (datePostedEmpty && (d === "datePosted")) ||
          (firstSeenEmpty && (d === "firstSeen")) ||
          (lastSeenEmpty && (d === "lastSeen"))) )
      return false;

    if (!contains(numericHeaders, d, true)) {
//        if (d === "Skill") {
//          return y[d] = d3.scale.ordinal()
//                                    .domain(highDData.sort(function(a, b) {
//                                              return stringSort(a.Skill, b.Skill, true);  // don't split...
//                                            })
//                                            .map(function(p) {
//                                                return p[d];
//                                              }))
//                                    .rangePoints([height, 0]);
      if ((!datePostedEmpty && (d === "datePosted")) ||
          (!firstSeenEmpty && (d === "firstSeen")) ||
          (!lastSeenEmpty && (d === "lastSeen")))
        return y[d] = d3.time.scale()
//                                .domain(d3.extent(highDData, function(p) {
//                                  if (+p[d] === +(new Date(-1)))
//                                    return minValidDate;
//                                  return +p[d]; }))
                              .domain([+minValidDate, +maxValidDate])
                              .range([height, 0]);
      else
        return y[d] = d3.scale.ordinal()
                              .domain(highDData.map(function(p) { return p[d]; }))
                              .rangePoints([height, 0]);
    } else {
      return (y[d] = d3.scale.linear()
                              .domain([minFrequency, maxFrequency])
//                                .domain(d3.extent(highDData, function(p) { return +p[d]; }))
                              .range([height, 0])
                                  );
    }
  }));  // end setting x-domain
}

function drawPlot(highDData) {
    background = svg.append("g")
                    .attr("fill", "none") // or background (from CSS) renders black == none/transparent
                    .attr("class", "background")
                    .selectAll("path")
                    .data(highDData)//, function(d) { return d.identifier; })  // key function
                    .enter().append("path")
                    .attr("d", path);

    foreground = svg.append("g")
                    .attr("fill", "none")
                    .attr("class", "foreground")
                    .selectAll("path")
                    .data(highDData)//, function(d) { return d.identifier; })
                    .enter().append("path")
                    .attr("d", path)

    // additional interaction elements...
                    .attr("stroke", function(d) {
                      if (d.identifier === maxFrequencyLabel)
                        return "magenta";
                      return colourCodesLib(d.identifier);
                    })
                    .style("stroke-dasharray", function(d) {
                      if (d.identifier === maxFrequencyLabel)
                       return defaultStrokeDasharray;
//                      return null;
                    })
                    .style("stroke-linejoin", function(d) {//linecap
                       if (d.identifier === maxFrequencyLabel)
                        return "butt";  // round
//                      return null;
                     })
                   .style("stroke-width", function(d) {
                      if (d.identifier === maxFrequencyLabel)
                        return strokeWidth * 3;
//                      if (d.dataSourceId == maxFrequencyLabel)
//                        return 0;
                      return strokeWidth;
                    })
                    .attr("title", function(d, i) {
                      if (d.identifier === maxFrequencyLabel)
                        return "Maximum term frequency trend line";

                      var info = "";
                      for (var key in highDData[i]) {
                        if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
                          if ((highDData[i][key] != "") && (+(highDData[i][key]) != -1))
                            info += "* " + key.replace(/_/g, " ") + ":\t" + formatDateDbY(highDData[i][key]) + "\n";
                        }
//                        else if (key === "description")
//                          ; // do nothing -  info += "* " + key.replace(/_/g, " ") + ":\t" + truncate(highDData[i][key], 1500, "... (more at...)") + "\n";
                        else if ((key != "identifier") && (key != "description") && (key != "minValue") && (key != "maxValue") &&
                                  (highDData[i][key] != "") && (highDData[i][key] != "0"))
                          info += "* " + key.replace(/_/g, " ") + ":\t" + highDData[i][key] + "\n";
                      }
                      return info + "\n *** Double-click on entry to reveal more detail... ***";
                    })
                    .on("mouseout", function() {
                      d3.select(this)
                        .style("stroke-width", function(d) {
                          if (d.identifier === maxFrequencyLabel)
                            return strokeWidth * 3;
                          return strokeWidth;
                        })
                        .style("stroke-opacity", opacity/100)
                        .style("stroke", function(d) {
                          if (d.identifier === maxFrequencyLabel)
                            return "magenta";
                          return colourCodesLib(d.identifier);
                        });

                      if (lastPathSelected != null)
                        lastPathSelected.style("stroke-width", strokeWidth * 3)
                                         .style("stroke-opacity", 1.0)
                                         .style("stroke-dasharray", 2)
                                         .style("stroke", currentSelectionColour);
                   })
                    .on("mouseover", function(d, i) {
                      d3.select(this)
                        .style("stroke-width", strokeWidth * 3)// + (strokeWidth/3))  // otherwise hidden if lying under another
                        .style("stroke-opacity", 1.0)
                        .style("stroke-dasharray", function(d) {
                          if (d.identifier === maxFrequencyLabel)
                            return defaultStrokeDasharray;
    //                      return null;
                        })
                        .style("stroke", currentSelectionColour);
                    })
                    .on("dblclick", function(d, i) {
                      if (d.identifier === maxFrequencyLabel)
                        return;

                      if (lastPathSelected != null)
                        lastPathSelected.style("stroke-width", strokeWidth)
                                         .style("stroke-opacity", opacity/100)
                                         .style("stroke-dasharray", null)
                                         .style("stroke", function(d) {
                                           if (d.identifier === maxFrequencyLabel)
                                             return "magenta";
                                           return colourCodesLib(d.identifier);
                                         });

                      lastPathSelected = d3.select(this);  // reset
                      lastSelectionColour = colourCodesLib(d.identifier);


//                      if (d3.event.ctrlKey) { // @todo - complete - with next
                        var info = "<h3>Posting Detail & Term Frequency</h3>" +
                                      "(up to <a href=\"#plot\">plot</a>)<br />&nbsp;<br />" +
                                      "<table border='1' width=75%>";
                        for (var key in highDData[i]) {
                          if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
                            if ((highDData[i][key] != "") && (+(highDData[i][key]) != -1))
                            info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + formatDateDbY(highDData[i][key]) + "</td></tr>";
                          } else if (key === "description")
                            info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + highDData[i][key] + "</td></tr>";
                          else if ((key != "identifier") && (key != "minValue") && (key != "maxValue") &&
                                    (highDData[i][key] != "") && (highDData[i][key] != "0"))
                          info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + highDData[i][key] + "</td></tr>"
                        }
                        info += "</table>" +
                                  "<br />&nbsp;<br />(back up to <a href=\"#plot\">plot</a>)<br />";
                        printOutLastSelection(info, "selectionDetail");
//                      }
                    })
//                    .on("focusout", function(d, i) {  // not working :S - or does only occasionally
//                      printOutLastSelection("and out!" + highDData[i]["datePosted"][1], "selectionDetail");
//                    })

//                    // filter impacts everything that follows so need to place last...AND interaction... so can't use :S
//                    .filter(function(d) { return (d.identifier === maxFrequencyLabel); } )
//                      .style("stroke-dasharray", defaultStrokeDasharray)
//                      .style("stroke-linejoin", "butt") //linecap
//                      .style("stroke-width", strokeWidth * 3)
                    ;
///////////end interaction
//
}

function drawAxes(dimensions) {
  var groupElement = svg.selectAll(".dimension")
                        .data(dimensions)
                        .enter().append("g")
                        .attr("class", "dimension")
                        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
                        .call(d3.behavior.drag()
                                .origin(function(d) { return {x: x(d)}; })
                                .on("dragstart", function(d) {
                                  dragging[d] = x(d);
                                  background.attr("visibility", "hidden");
                                })
                                .on("drag", function(d) {
                                  dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                                  foreground.attr("d", path);
                                  dimensions.sort(function(a, b) { return position(a) - position(b); });
                                  x.domain(dimensions);
                                  groupElement.attr("transform", function(d) {
                                    return "translate(" + position(d) + ")"; })
                                  })
                                .on("dragend", function(d) {
                                  delete dragging[d];
                                  transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                                  transition(foreground).attr("d", path);
                                  background.attr("d", path)
                                           .transition()
                                           .delay(500)
                                           .duration(0)
                                           .attr("visibility", (removingAxis ? "none" : null));
                                  removingAxis = false; // reset if necessary...
                                }))
                        .on("dblclick", function(d) { // @todo - where is the delay???
//                            if (d3.event.ctrlKey) { // not recognising this...
                          hiddenAxesLocations[d.toLowerCase()] = dimensions.indexOf(d);
                          removingAxis = hideAxes([d], groupElement);
                          if (removingAxis)
                            updateSelectorPanelItem(d, false);
                        });

  groupElement.append("g")
              .attr("class", "axis")
              .each(function(d) {
                if ((d === "datePosted")|| (d === "firstSeen")|| (d === "lastSeen"))
                  d3.select(this).call(axis.scale(y[d])
                                            .tickFormat(formatDateby));
                if (contains(numericHeaders, d, true))
                  d3.select(this).call(axis.scale(y[d])
                                            .tickFormat(formatInteger));
                else
                  d3.select(this).call(axis.scale(y[d]));
              })
              .append("text")
              .style("font-size", "12px")
              .style("fill", function(d) { if (contains(skillNotDefined, d, true)) return "lightgrey"; })
              .style("text-anchor", "start")
              .attr("y", -9)
              .attr("transform", function(d) { return "translate(10, -5) rotate(-65)"; })
              .text(function(d) { return d.toLowerCase().replace(/_/g, " "); });

  groupElement.append("g")
              .attr("class", "brush")
              .each(function(d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d])
                                                        .on("brushstart", brushstart)
                                                        .on("brush", brush));
               })
              .selectAll("rect")
              .attr("x", -8)
              .attr("width", 16);
}

/*
 * function borrowed from: http://bl.ocks.org/syntagmatic/3150059
 * next created, the following adapted from the same
 */
function hideAxes(d, groupElement) {
  if (containsAnyOf(suppressedHeaders, d, true) ||
      (containsAnyOf([ "dataSourceId", "datePosted", "firstSeen", "lastSeen" ], d, true)) ) {
    alert("You may only hide axes for data attributes!")
    return false;
  }

  dimensions = _.difference(dimensions, d);
  x.domain(dimensions);

  groupElement.attr("transform", function(p) {  //@todo - check iteration...
//    if (position(p))  // @todo - till get this to filter out removed...
      return "translate(" + position(p) + ")";
  });
  groupElement.filter(function(p) { // @todo - not filtering out...
    return contains(d, p, true)//p == d;// valid only when reading in a single - this now reads in an array
  }).remove();

  updatePlot(null, groupElement);
  return true;
}

function showAxis(d, groupElement) {
  if (hiddenAxesLocations[d.toLowerCase()] != -1)
    dimensions.splice(hiddenAxesLocations[d.toLowerCase()], 0, d);
  else
    dimensions.push(d);
  x.domain(dimensions);

  groupElement.attr("transform", function(p) {
    return "translate(" + position(p) + ")";
  });

  updatePlot(d, groupElement, true);
}

function updatePlot(update, groupElement, updateAxes) {

  // update polylines and transition back in ...
  // ignore axes, no need to rescale
  d3.selectAll(".foreground")
    .each(function (d) {
      d3.select(this).selectAll('path')
                      .style("display", "none");

      d3.select(this).selectAll('path')
                      .transition()
//                      .delay(800)
                      .attr("d", path)
                      .style("display", null);

    }); // end update - polyline

    if (updateAxes) {
      var g_axes = d3.selectAll(".dimension")
                     .data("");
      g_axes.exit().remove();
      drawAxes(dimensions);
    }

  // and any "brushes set" - reset when paths redrawn. even when commented out doesn't redraw brush area - there's an error here somewhere
//  updateBrushes(d);
  if (update) {
    var coordinateBrush = d3.selectAll(".brush")
                            .filter(function(key) { return key == update; });
    // single tick
    coordinateBrush.call(y[update].brush = d3.svg.brush()
                                              .y(y[update])
                                              .on("brush", brush));
  } else {  // all ticks
    d3.selectAll(".brush")
      .each(function (update) {
        d3.select(this)
          .call(y[update].brush = d3.svg.brush()
                                    .y(y[update])
                                    .on("brush", brush));
      })
  } // end if-else update brushes
}

//function show_ticks() {
//  d3.selectAll(".axis").style("display", null);
//  //d3.selectAll(".axis path").style("display", null);
//  d3.selectAll(".background").style("visibility", null);
////  d3.selectAll("#show-ticks").attr("disabled", "disabled");
////  d3.selectAll("#hide-ticks").attr("disabled", null);
//}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) {
    return [position(p), y[p](d[p])];
  }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}


// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(d) { return !y[d].brush.empty(); }),
      extents = actives.map(function(d) { return y[d].brush.extent(); });

  foreground.style("display", function(g) {
    return actives.every(function(d, i) {

      if (!contains(numericHeaders, d, true)) // categorical/ordinal
        return extents[i][0] <= y[d](g[d]) && y[d](g[d]) <= extents[i][1];
      else // linear
        return extents[i][0] <= g[d] && g[d] <= extents[i][1];
    }) ? null : "none";
  });
}

function updateBrushes(selectedAxis) {
}

/*
 * input of type: key = skillset; key = languageCode; value: skills (translated)
 */
function filterSkills(parsedInput, selectedSkillSet, languageOfInterest) {
  var skills = [];

  Object.keys(parsedInput).forEach(function(d) {  // skillSets
    if (d === selectedSkillSet) {

      Object.keys(parsedInput[d]).forEach(function(language) {
        if (language === languageOfInterest)
          skills = parsedInput[d][language]; // annoyingly cannot break out...
      });
    }
  });

  return skills;
}

function applyFilter(itemSelected, skillSet) {  // note: skillSet is label list, not HTMLInputElements
  var groupElement = d3.selectAll(".dimension");  //foreground");
  var skillLabel;

  if (skillSet) {
    skillSet.forEach(function (d) {
      if ((skillLabel = getContainedElement(dimensions, d, true)) != null)  // get last position... will restore to this point... ignoring any other relocations...
        hiddenAxesLocations[d.toLowerCase()] = dimensions.indexOf(skillLabel);
    }); // need to get all locations before start removing...

    skillSet.forEach(function (d) {
      if ((skillLabel = getContainedElement(dimensions, d, true)) != null) {
        if (!itemSelected.checked)  // cascaded to "children"
          hideAxes([skillLabel], groupElement);

      } else if (itemSelected.checked)
        showAxis(getContainedElement(dataHeaders, d, true), groupElement);
    });
  } else {  // just the one skill
    var skill = itemSelected.id;
    skill = skill.substring(skill.lastIndexOf(defaultDelimiter) + 1);

    if ((skillLabel = getContainedElement(dimensions, skill, true)) != null)
      hiddenAxesLocations[skill.toLowerCase()] = dimensions.indexOf(skillLabel);

    if (itemSelected.checked) {
      if (skillLabel == null) // not currently displayed... should normally not happen, but greyed out may be unticked but included
        showAxis(getContainedElement(dataHeaders, skill, true), groupElement);
    } else
      hideAxes([getContainedElement(dataHeaders, skill, true)], groupElement);
  }
}

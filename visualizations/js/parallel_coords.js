var margin = {top: 120, right: 10, bottom: 50, left: 80},
    width = 1800 - margin.left - margin.right,
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
var numericHeaders = [];
var skillNotDefined = [];

var summaries = [],
    termFrequencyMax, termFrequencyMedian;
var medianFrequencyLabel = "Median frequency",
    maxFrequencyLabel = "Max frequency";


function drawParallelCoordinates(dataFile, skills) {
//drawParallelCoordinates(error, dump1, dump2, dump3) {

  var dsv = d3.dsv("|", "text/utf-8");  // plain
  //d3.csv
  dsv(dataFile, function(error, highdData) {

    highdData.sort(function(a, b) {
//      return stringSort(a.Country, b.Country) // //-coords top-down...

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

//  console.log("data: " + highdData);

    Object.keys(skills).forEach(function (skillSet) {
      skills[skillSet].forEach(function (skill) {
        numericHeaders.push(skill);
      });
    });

    /////////////

    var colourCodesDomain = [];
    var minFrequency = maxFrequency = 0;
//    var minDate, maxDate;
    var datePostedEmpty = true,
        firstSeenEmpty = true,
        lastSeenEmpty = true;
    var minValidDate = Date.now(),
        maxValidDate = new Date(0);


    highdData.forEach(function (d, i) {

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

    termFrequencyMedian = termFrequencyMax = [];
    Object.keys(summaries).forEach(function(g) {
      termFrequencyMedian[g] = d3.median(summaries[g]);
      termFrequencyMax[g] = d3.max(summaries[g]);

      if ((termFrequencyMax[g] === 0) && contains(numericHeaders, g, true))
        skillNotDefined.push(g);
    });

    termFrequencyMax.identifier = maxFrequencyLabel;
    termFrequencyMax.dataSourceId = "";
    highdData[highdData.length] = termFrequencyMax;

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
    /////////////

    x.domain(dimensions = d3.keys(highdData[0]).filter(function(d) {
      if ((d === "identifier")/*Job ID*/ ||
//          (d === "dataSourceId") ||
          (d === "description") ||
          (d === "title") ||
          (d === "minValue") || (d === "maxValue")||
          ( (datePostedEmpty && (d === "datePosted")) ||
            (firstSeenEmpty && (d === "firstSeen")) ||
            (lastSeenEmpty && (d === "lastSeen"))) )
        return false;

      if (!contains(numericHeaders, d, true)) {
//        if (d === "Skill") {
//          return y[d] = d3.scale.ordinal()
//                                    .domain(highdData.sort(function(a, b) {
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
//                                .domain(d3.extent(highdData, function(p) {
//                                  if (+p[d] === +(new Date(-1)))
//                                    return minValidDate;
//                                  return +p[d]; }))
                                .domain([+minValidDate, +maxValidDate])
                                .range([height, 0]);
        else
          return y[d] = d3.scale.ordinal()
                                .domain(highdData.map(function(p) { return p[d]; }))
                                .rangePoints([height, 0]);
      } else {
        return (y[d] = d3.scale.linear()
                                .domain([minFrequency, maxFrequency])
//                                .domain(d3.extent(highdData, function(p) { return +p[d]; }))
                                .range([height, 0])
                                    );
      }
    }));  // end setting x-domain

    background = svg.append("g")
                    .attr("fill", "none") // or background (from CSS) renders black == none/transparent
                    .attr("class", "background")
                    .selectAll("path")
                    .data(highdData)//, function(d) { return d.identifier; })  // key function
                    .enter().append("path")
                    .attr("d", path);

    foreground = svg.append("g")
                    .attr("fill", "none")
                    .attr("class", "foreground")
                    .selectAll("path")
                    .data(highdData)//, function(d) { return d.identifier; })
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
                      for (var key in highdData[i]) {
                        if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
                          if ((highdData[i][key] != "") && (+(highdData[i][key]) != -1))
                            info += "* " + key.replace(/_/g, " ") + ":\t" + formatDateDbY(highdData[i][key]) + "\n";
                        }
//                        else if (key === "description")
//                          ; // do nothing -  info += "* " + key.replace(/_/g, " ") + ":\t" + truncate(highdData[i][key], 1500, "... (more at...)") + "\n";
                        else if ((key != "identifier") && (key != "description") && (key != "minValue") && (key != "maxValue") &&
                                  (highdData[i][key] != "") && (highdData[i][key] != "0"))
                          info += "* " + key.replace(/_/g, " ") + ":\t" + highdData[i][key] + "\n";
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
                        for (var key in highdData[i]) {
                          if ((key === "datePosted") || (key === "firstSeen") || (key === "lastSeen")) {
                            if ((highdData[i][key] != "") && (+(highdData[i][key]) != -1))
                            info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + formatDateDbY(highdData[i][key]) + "</td></tr>";
                          } else if (key === "description")
                            info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + highdData[i][key] + "</td></tr>";
                          else if ((key != "identifier") && (key != "minValue") && (key != "maxValue") &&
                                    (highdData[i][key] != "") && (highdData[i][key] != "0"))
                          info += "<tr><td width=10%><b><i>" + key.replace(/_/g, " ") + "</i></b> </td><td width=65%>" + highdData[i][key] + "</td></tr>"
                        }
                        info += "</table>" +
                                  "<br />&nbsp;<br />(back up to <a href=\"#plot\">plot</a>)<br />";
                        printOutLastSelection(info, "selectionDetail");
//                      }
                    })
//                    .on("focusout", function(d, i) {  // not working :S - or does only occasionally
//                      printOutLastSelection("and out!" + highdData[i]["datePosted"][1], "selectionDetail");
//                    })
                    ;
///////////end interaction
//
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
                                     groupElement.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                               })
                               .on("dragend", function(d) {
                                     delete dragging[d];
                                     transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                                     transition(foreground).attr("d", path);
                                     background.attr("d", path)
                                               .transition()
                                               .delay(500)
                                               .duration(0)
                                               .attr("visibility", null);
                               }));

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
                .text(function(d) { return d.replace(/_/g, " "); });

    groupElement.append("g")
                .attr("class", "brush")
                .each(function(d) {
                  d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
                 })
                .selectAll("rect")
                .attr("x", -8)
                .attr("width", 16);



////    svg.append("text")
////      .attr("x", 400)
////      .attr("y", 0 - (margin.top / 1.75))
////      .attr("text-anchor", "text")
////      .style("font-size", "20px")
////  //          .style("text-decoration", "underline")
////      .text("Overview (Parallel Coordinates Plot)"); // header
//
  }); // end d3.tsv
}


function position(coordinate) {
   var v = dragging[coordinate];
   return v == null ? x(coordinate) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(coordinate) {
  return line(dimensions.map(function(p) {
    return [position(p), y[p](coordinate[p])];
  }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}


// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(coordinate) { return !y[coordinate].brush.empty(); }),
      extents = actives.map(function(coordinate) { return y[coordinate].brush.extent(); });

  foreground.style("display", function(d) {
    return actives.every(function(coordinate, i) {

      if (!contains(numericHeaders, coordinate, true)) // categorical/ordinal
        return extents[i][0] <= y[coordinate](d[coordinate]) && y[coordinate](d[coordinate]) <= extents[i][1];
      else // linear
        return extents[i][0] <= d[coordinate] && d[coordinate] <= extents[i][1];
    }) ? null : "none";
  });
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

/** acknowledgments: http://www.jeromecukier.net/stuff/data%20example/data-example3.html */


var margin = {top: 60, right: 50, bottom: 30, left: 50},
    width = 1240 - margin.left - margin.right,//1000
    height,// = 500 - margin.top - margin.bottom;//900
    legendWidth = 300;
        
var cWidth = 100,
    cHeight = 100,
    cMargin = 5;

var x = d3.scale.linear()
          .domain([0, 20])
          .range([cMargin, cWidth - margin]),
    y = d3.scale.linear()
          .range([cHeight - cMargin, cMargin])/*,
    o = d3.scale.linear()
          .domain([0, 300000])
          .range([.5, 1])*/;

var initialCountryPercentageThreshold = 25,
    initialSkillsPercentageThreshold = 50;
var smSvg, parsedData;

var skillCount;

function drawSmallMultiplesGPlot(dataFile, indexOfInterest, countries, skills) {
  appendToOutput("<table width='650'>" +
                    "<tr><td>" +
                    "<label for='countryPercentageThreshold' style='display: inline-block; text-align: left; color: steelblue;'>" +
                  "> than country %: <span id='countryPercentage'>" + initialCountryPercentageThreshold + "</span></label>&nbsp;&nbsp;" +
                  "</td><td><input type='range' min='0' max='100' id='countryPercentageThreshold' value='" + initialCountryPercentageThreshold +
                  "'</td>");//</tr>");



  filterOnCountryPercentage(initialCountryPercentageThreshold);


//  appendToOutput("<tr><td>" +
  appendToOutput("<td width='200'></td><td>" +
                    "<label for='skillsPercentageThreshold' style='display: inline-block; text-align: left; color: olive;'>" +
                    "> than skills %: <span id='skillsPercentage'>" + initialSkillsPercentageThreshold + "</span></label>&nbsp;&nbsp;" +
                    "</td><td><input type='range' min='0' max='100' id='skillsPercentageThreshold' value='" + initialSkillsPercentageThreshold +
                   "'</td></tr>" +
                  "</table>");

  filterOnSkillsPercentage(initialSkillsPercentageThreshold);
//  appendToOutput("<p>&nbsp;</p>");


  if (countries || skills) {  //filtersApplied
//    appendToOutput("Filters:");
//    if (countries)
//      appendToOutput("&nbsp;&nbsp;&nbsp;&nbsp;Countries: " + countries);

    if (skills)
      skillCount = 15 * skills.length;
  }
  appendToOutput("&nbsp;&nbsp;&nbsp;&nbsp;Skills: ");

  d3.csv(dataFile, function(error, data) {
    if (error)
      return console.error(error);  // @todo - really more useful to write to screen (body)...

    // initially working only within html... then didn't... now only here... :S
    d3.select("#countryPercentageThreshold")
      .on("input", function() {
          filterOnCountryPercentage(+this.value);
        });

    d3.select("#skillsPercentageThreshold")
      .on("input", function() {
          filterOnSkillsPercentage(+this.value);
        });
    ///


////////////////////
//
//    var colourCodesLib = d3.scale.ordinal()
//                            .range(d3.merge([
//                                    colorbrewer.Spectral[11],
//                                    colorbrewer.Accent[8],
//                                  ]))
//                            .domain(colourCodesDomain);

/////////////////////////////////
//
    // need to maintain consistency even after filtering...
    var colourCodesDomain = [];
    data.forEach(function (d, i) {
      colourCodesDomain.push(d.Skill);
    });
    colourCodesDomain = d3.set(colourCodesDomain).values();

    var cDomain = [], cRange = [],
       colourSelector = d3.merge([ // set full first as may need to extend range...
    //                                  colorbrewer.RdYlBu[7],
    //                                  colorbrewer.Pastel1[8],
                                  colorbrewer.Spectral[11],
                                  colorbrewer.Accent[8],
    //                                  colorbrewer.RdYlGn[11],
                      ]);

    if (skills) { // need to filter...

     colourCodesDomain.forEach(function (d, i) {
    //        console.log(d + " - " + colourSelector[i] + " - " + colourCodesDomain[i]);

       if (contains(skills, d)) {
         cRange.push(colourSelector[i]);
         cDomain.push(colourCodesDomain[i]);
       }
     }); // end forEach ...
    } else {

     cRange = colourSelector;
     cDomain = colourCodesDomain;

    } // end legend filter...
//
    colourCodesLib = d3.scale.ordinal()
                         .range(cRange)
                         .domain(cDomain);
//
/////////////////////////////////

    data = data.filter(function(d) {
                  if ((d.Jobs > 0) && //(d.Country != "UK") &&
                      (!countries || contains(countries, d.Country)) &&
                      (!skills || contains(skills, d.Skill)))
                    return d;
                })
                .sort(function(a, b) {
//                  sortOnDualProperty(+a.Jobs, +b.Jobs, a.Country , b.Country);  // don't get this - implementation identical but method returns different sort...
                  if (+b.Jobs > +a.Jobs)
                    return 1;
                  else if (+b.Jobs < +a.Jobs)
                    return -1;

                  else {
                    if (+b.Skills_Percentage > +a.Skills_Percentage)
                      return 1;
                    else if (+b.Skills_Percentage < +a.Skills_Percentage)
                      return -1;

                    else {
                      if (+b.Country_Percentage > +a.Country_Percentage)
                        return 1;
                      else if (+b.Country_Percentage < +a.Country_Percentage)
                        return -1;

                      else
                        return (a.Country < b.Country);
                    }
                  }
                });
    parsedData = data;

//    console.log(JSON.stringify(data, null, 3));

    height = (Math.max(10, data.length) / 5 * 130) - margin.top - margin.bottom;//900


    var svg = d3.select("#plot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    data.forEach(function (d, i) {
//      d.weight = +d.Country_Percentage; //?
      d.width = d.Jobs;
      d.innerWidth = ((indexOfInterest === 1) ? d.Country_Percentage : d.Skills_Percentage);
    });

    y.domain([0, d3.max(data, function (d) { return +d.Jobs })]).nice();

    // drawing...
    var lSvg = d3.select("#legend")
                  .append("svg")
                  .attr("width", 400)
                  .attr("height", skillCount)
                  .append("g")
                  .attr("transform", "translate(" + (0) + "," + (0) + ")");

    var yCount = 0, xCount, rowMax = 10;
    smSvg = svg.selectAll("g")
                .data(data)
                .enter().append("g")

                .attr("transform", function(d, i) {
                  xCount = Math.floor(yCount++ / rowMax);
                  return "translate(" + ((cWidth + 10) * (i % rowMax)) + "," + (xCount * (cHeight + 20)) + ")";
                });

    // elementTitle ...
    smSvg.append("rect")
          .attr("class", "countryPercentage")
          .attr("x", cMargin)
          .attr("y", cMargin)
          .attr("width", cWidth - 2 * cMargin)
          .attr("height", cHeight - 2 * cMargin)
          .style("stroke", function(d) {
            if (filterByCountryPercentage(d.Country_Percentage, initialCountryPercentageThreshold, data) > 0)
              return "steelblue";
            else
              return "black";
          })
    //      .style("stroke-width", function(d) {
    //        return (isInTopFive);
    //      })
    //      .on("dblclick", function(d, i){ location.href = "=" + d.key; })
          .append("title")
          .text(function(d) { return (d.Skill + " (" + d.Jobs + ")" +
                                        "\n\tCountry Percentage: " + d.Country_Percentage +
                                        "\n\tSkills Percentage: " + d.Skills_Percentage); });


      smSvg.append("rect")
            .attr("class", "skillsPercentage")
            .attr("x", cMargin * 2)
            .attr("y", cMargin * 2)
            .attr("width", cWidth - 4 * cMargin)
            .attr("height", cHeight - 4 * cMargin)
            .style("fill", "none")  // otherwise overlays the previous... and hides tooltip...
            .style("stroke", function(d) {
              if (filterBySkillsPercentage(d.Skills_Percentage, initialSkillsPercentageThreshold, data) > 0)
                return "olive";
            })
    //        .style("stroke-width", function(d) { return (isInTopFiveActiveEngagements(d.key, advisors)); })
    //        .style("display", function(d) {
    //          if (!isInTopFiveActiveEngagements(d.key, advisors))
    //            return "none";
    //          else
    //            return "block";
    //        })

      smSvg.append("text")
            .attr("y", cHeight + 8)
            .attr("x", cMargin)
            .text(function(d) { return truncate(d.Country, 20, "..."); })

      smSvg.append("text")
            .attr("y", cHeight + 16)
            .attr("x", cMargin)
            .style("font-size", "6px")
            .style("fill", function (d) { return colourCodesLib(d.Skill) } )
            .text(function(d) { return ("(" + d.Skill + " - " + d.Jobs + ")"); })


      smSvg.append("text")
            .attr("y", function (d) { return y(+d.Jobs); })
            .attr("x", cMargin + 8)
            .text("•")//("⋅••⋅")
            .style("font-size", function (d) { return (+d.Jobs + 5) + "px" }) // min 6
            .style("vertical-align", "bottom" )
            .style("fill", function (d) { return colourCodesLib(d.Skill) } )
            .style("stroke", "lightgray" )
            .style("cursor", "default")
            .append("title")
            .text(function(d) { return d.Jobs + " Jobs (" + d.Skill + ")"; });

        smSvg.selectAll("circle")
          .data(data)
          .enter()
          .append("svg:circle")
          .attr("class", "circle")
          .attr("cy", function (d) { return y(+d.Jobs); })
          .attr("cx", function (d) { return y(+d.Jobs); })
          .attr("r", 1.5)
          .style("fill", function (d) { return colourCodesLib(d.Skill) } )
          .append("title")
          .text(function(d) { return d.Country + "- " + d.Jobs + " Jobs (" + d.Skill + ")"; });

        // end drawing...



    var legend = lSvg.selectAll(".legend")
                      .data(colourCodesLib.domain())
                      .enter().append("g")
                      .attr("class", "legend")
                      .attr("transform", function(d, i) { return "translate(0," + (i * 12) + ")"; });

    legend.append("rect")
          .attr("x", legendWidth - 250)// - 100)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", colourCodesLib);

    legend.append("text")
          .attr("x", legendWidth - 235)// - 85
          .attr("y", 9)
          .attr("dy", ".05em")
          .style("text-anchor", "start")
          .text(function(d) { return d; });

  }); // end d3.csv
}

function filterOnCountryPercentage(threshold) {
  d3.select("#countryPercentage")
    .text(threshold);
  d3.select("#countryPercentageThreshold")
    .property("value", threshold);

  if (smSvg)
    smSvg.select("rect.countryPercentage")
         .style("stroke", function(d) {
            if (filterByCountryPercentage(d.Country_Percentage, threshold, parsedData) > 0)
              return "steelblue";
            else
              return "black";
          });
}

function filterOnSkillsPercentage(threshold) {
  d3.select("#skillsPercentage")
    .text(threshold);
  d3.select("#skillsPercentageThreshold")
    .property("value", threshold);

  if (smSvg)
    smSvg.select("rect.skillsPercentage")
          .style("stroke", function(d) {
            if (filterBySkillsPercentage(d.Skills_Percentage, threshold, parsedData) > 0)
              return "olive";
          });
}

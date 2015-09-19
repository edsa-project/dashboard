/** acknowledgments: http://bl.ocks.org/bbest/2de0e25d4840c68f2db1 */


var asterPlotWidth = 300,
    asterPlotHeight = 300,
    asterPlotMargin = 50,
    radius = Math.min(asterPlotWidth - asterPlotMargin, asterPlotHeight - asterPlotMargin) / 2,
    innerRadius = 0.3 * radius;

var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.width; });// arc

var arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(function (d) {
                  return (radius - innerRadius) * (d.data.innerWidth / 100) + innerRadius;
                });

var outlineArc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(radius);

var summary, 
    primaryFilter = "Job Market",
    skillCount = asterPlotHeight / 2;

function drawAster(dataFile, indexOfInterest, countries, skills) {
  if (countries || skills) {  //filtersApplied
//    appendToOutput("Filters:");
//    if (countries)
//      appendToOutput("&nbsp;&nbsp;&nbsp;&nbsp;Countries: " + countries);

    if (skills)
      skillCount = 15 * skills.length + 20;

    primaryFilter = ((countries && (countries.length === 1)) ? countries[0] :
                      (skills && (skills.length === 1)) ? skills[0] : "Job Market");
  }
//  appendToOutput("&nbsp;&nbsp;&nbsp;&nbsp;Skills: ");


  d3.csv(dataFile, function (error, data) {
    if (error)
      return console.error(error);  // @todo - really more useful to write to screen (body)...



    var pSvg = d3.select("#plot")
                  .append("svg")
                  .attr("width", asterPlotWidth * 2)
                  .attr("height", asterPlotHeight)
                  .append("g")
                  .attr("transform", "translate(" + (asterPlotWidth / 2 + asterPlotMargin / 2) + "," + (asterPlotHeight / 2) + ")");
    var lSvg = d3.select("#legend")
                  .append("svg")
                  .attr("width", asterPlotWidth * 3/2)
                  .attr("height", skillCount)//asterPlotHeight / 2)
                  .append("g")
                  .attr("transform", "translate(" + (0) + "," + (0) + ")");
//                  .attr("transform", "translate(" + (asterPlotWidth) + "," + (0) + ")");


    // need to maintain consistency even after filtering...
    var colourCodesDomain = [];
    data.forEach(function (d) {
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

    colourCodesLib = d3.scale.ordinal()
                          .range(cRange)
                          .domain(cDomain);


    data = data.filter(function(d) {
            if ((d.Jobs > 0) &&
                (!countries || contains(countries, d.Country)) &&
                (!skills || contains(skills, d.Skill))) {
              return d;
            }
          });


    if ((countries && (countries.length === 1)) ||
        (skills && (skills.length === 1))) {
      var jobCount = d3.nest()
                      .rollup(function(leaves) {
                        return d3.sum(leaves, function(d) {
                          return +d.Jobs;
                        });
                      })
                      .entries(data);
      primaryFilter += " (" + jobCount + ")";
    }

    data.forEach(function (d, i) {
//      d.weight = +d.Country_Percentage; //?
      d.width = d.Jobs;
      d.innerWidth = ((indexOfInterest === 1) ? d.Country_Percentage : d.Skills_Percentage);
   });

    /*var path =*/ pSvg.selectAll(".solidArc")
                    .data(pie(data))
                    .enter().append("path")
                    .attr("fill", function (d) {
                      return colourCodesLib(d.data.Skill);
                    })//d.data.label); })//
                    .attr("class", "solidArc")
                    .attr("stroke", "gray")

                    .attr("d", arc)
                    .attr("title", (function (d) {
                      return d.data.Country + " (Jobs: " + d.data.Jobs + ")" +
                        "\n\tSkill: " + d.data.Skill +
                        "\n\tCountry %age: " + d.data.Country_Percentage +
                        "\n\tSkills %age: " + d.data.Skills_Percentage;
                    }))
                    /*.on('dblClick', (function (d) {
                      alert( advisor = d.data.Skill);
                    }))*/;

    /*var outerPath =*/ pSvg.selectAll(".outlineArc")
                        .data(pie(data))
                        .enter().append("path")
                        .attr("fill", "none")
                        .attr("stroke", "gray")
                        .attr("stroke-width", 1.5)
                        .attr("class", "outlineArc")
                        .attr("d", outlineArc);


    pSvg.append("svg:text")
        .attr("class", "primary_filter")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(primaryFilter);

//    pSvg.append("g")
//        .attr("class", "lines");


    var legend = lSvg.selectAll(".legend")
                    .data(colourCodesLib.domain())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d, i) { return "translate(0," + (i * 12) + ")"; });

    legend.append("rect")
          .attr("x", asterPlotWidth - 250)// - 100)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", colourCodesLib);

    legend.append("text")
          .attr("x", asterPlotWidth - 235)// - 85
          .attr("y", 9)
          .attr("dy", ".05em")
          .style("text-anchor", "start")
          .text(function(d) { return d; });

 }); // end d3.csv

}

function print() {

summary.forEach(function (d) {
          appendToOutput(d.key + ": " + d.values);
        });
}

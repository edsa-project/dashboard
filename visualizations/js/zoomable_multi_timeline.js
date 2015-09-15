/**  acknowledgments:  adapted from http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
 *                                  http://bl.ocks.org/mbostock/1667367
 *                                  http://bl.ocks.org/mbostock/4015254
 *                                  http://bl.ocks.org/benjchristensen/2657838
 */

var totalWidth = 1200,
totalHeight = 550;

var margin = {top: 20, right: 150, bottom: 120, left: 40},
    basePlotMargin = {top: 450, right: 10, bottom: 60, left: 0},
    width = totalWidth - margin.left - margin.right,
    height = totalHeight - margin.top - margin.bottom,
    basePlotHeight = totalHeight - basePlotMargin.top - basePlotMargin.bottom;


var bisectDate = d3.bisector(function(d) { return d.date; }).left;

var x = d3.time.scale().range([0, width]),
    xBase = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]);//,
//    yBase = d3.scale.linear().range([basePlotHeight, 0]);

var colourScale = d3.scale.category20c();
var baseGrey = "#F1F1F2";


var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxisBase = d3.svg.axis().scale(xBase).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left")/*,
    yAxisBase = d3.svg.axis()
                  .scale(yBase)
                  .orient("left")
                  .ticks(5)*/;


var line = d3.svg.line()
              .interpolate("basis")
              .x(function(d) { return x(d.date); })
              .y(function(d) { return y(d.count); })
              .defined(function(d) { return d.count; });  // skip (draw blank) rather than interpolate to 0 for missing values

var maxY;


function drawMultiAttrTimeline(datafile) {

  var svg = d3.select("#plot")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "mouse-tracker");
  //    .style("fill", "white");  // don't see the point in this...

  var hoverLineGroup = svg.append("g")
                          .attr("class", "hover-line");

  var context = svg.append("g")
                    .attr("class", "context")
                    .attr("transform", "translate(" + basePlotMargin.left + "," + basePlotMargin.top + ")");

  svg//.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);


  d3.csv(datafile, typeData, function(error, data) {

//    console.log(dataFile + "\n" + JSON.stringify(d3.values(data).slice(0, 2), null, 3));

    colourScale.domain(d3.keys(data[0]).filter(function(key) {
      return (key !== "date");
    }));


    var categories = colourScale.domain().map(function(skill) {

      return {
        skill: skill,
        values: data.map(function(d) {
          return {
            date: d.date,
            count: d[skill],
            };
        }),
        visible: true
      };
    });
//    console.log(dataFile + "\n" + JSON.stringify(d3.values(categories).slice(0, 2), null, 3));

    x.domain(d3.extent(data, function(d) { return d.date; }));
    xBase.domain(x.domain());
    y.domain([0, d3.max(categories, function(c) { return d3.max(c.values, function(v) { return v.count; }); })]);

    var brush = d3.svg.brush()
                  .x(xBase)
                  .on("brush", brushed);

    context.append("g")
            .attr("class", "context axis")
            .attr("transform", "translate(0," + basePlotHeight + ")")
            .call(xAxisBase);

    var contextArea = d3.svg.area()
                        .interpolate("monotone")
                        .x(function(d) { return xBase(d.date); })
                        .y0(basePlotHeight)
                        .y1(0);

    context.append("path")
            .attr("class", "area")
            .attr("d", contextArea(categories[0].values))
            .style("fill", baseGrey);

    context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("height", basePlotHeight)
            .style("fill", "slategray");//""#E6E7E8");
    /*
        context.append("g")
              .attr("class", "y axis")
              .call(yAxisBase);
    */


    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Skill Count");


    var skill = svg.selectAll(".skill")
                    .data(categories)
                    .enter().append("g")
                    .attr("class", "skill");

    skill.append("path")
          .attr("class", "line")
          .style("pointer-events", "none")
          .attr("id", function(d) {
            return "line-" + d.skill.replace(" ", "").replace("/", ""); // line id
          })
          .attr("d", function(d) {
            return d.visible ? line(d.values) : null;
          })
          .attr("clip-path", "url(#clip)")
          .style("stroke", function(d) { return colourScale(d.skill); });

    var legendSpace = (height + margin.top) / categories.length;

    skill.append("rect")
        .attr("width", 8)
        .attr("height", 8)
        .attr("x", width + (margin.right/3) - 15)
        .attr("y", function (d, i) { return (legendSpace + i * legendSpace - 8); })
        .style("fill", function(d) {
          return (d.visible ? colourScale(d.skill) : baseGrey);
        })
        .attr("class", "legend-box")

        .on("click", function(d) {
          d.visible = !d.visible; 

          y.domain([0, (maxY = updateMaxY(categories))]); // @todo - not sure I like this redefine axes idea... may leave out
          svg.select(".y.axis")
            .transition()
            .call(yAxis);

          skill.select("path")
                .transition()
                .attr("d", function(d) {
                  return (d.visible ? line(d.values) : null);
                })

          skill.select("rect")
                .transition()
                .style("fill", function(d) {
                  return (d.visible ? colourScale(d.skill) : baseGrey);
                });
        })

        .on("mouseover", function(d) {

          d3.select(this)
            .transition()
            .style("stroke", function(d) { return colourScale(d.skill); });

          d3.select("#line-" + d.skill.replace(" ", "").replace("/", "")) //@todo - return with static function ...
            .transition()
            .attr("d", function(d) {
              return line(d.values);
            })
         .style("stroke-width", 2.5);
        })

        .on("mouseout", function(d){

          d3.select(this)
            .transition()
            .style("stroke", function(d) {
              return (d.visible ? colourScale(d.skill) : baseGrey); })
            .style("fill", function(d) {
              return (d.visible ? colourScale(d.skill) : baseGrey); });

          d3.select("#line-" + d.skill.replace(" ", "").replace("/", ""))
            .transition()
            .attr("d", function(d) {
              return (d.visible ? line(d.values) : null);
            })
            .style("stroke-width", 1.5);
        })

    // legend ...
    skill.append("text")
          .attr("x", width + (margin.right/3))
          .attr("y", function (d, i) { return (legendSpace + i * legendSpace); }) // replace with better calculation, pref using function....
          .text(function(d) { return d.skill; });


    var hoverLine = hoverLineGroup.append("line")
                                  .attr("id", "hover-line")
                                  .attr("x1", 10).attr("x2", 10)
                                  .attr("y1", 0).attr("y2", height + 10)
                                  .style("pointer-events", "none")
                                  .style("opacity", 1e-6); // Set opacity to zero ... and this is zero?????

// NOT WORKING - NONE OF THE HOVER...
    var hoverDate = hoverLineGroup.append('text')
                                  .attr("class", "hover-text")
                                  .attr("y", height - (height-40)) // hover date text position
                                  .attr("x", width - 150)
                                  .style("fill", "#E6E7E8");

    var columnNames = d3.keys(data[0])
                        .slice(1);  // exclude date

    var focus = skill.select("g")
                      .data(columnNames)
                      .enter().append("g")
                      .attr("class", "focus");

    focus.append("text")
          .attr("class", "tooltip")
          .attr("x", width + 5)//20)
          .attr("y", function (d, i) { return (legendSpace + i * legendSpace); });

    d3.select("#mouse-tracker")
      .on("mousemove", mousemove)
      .on("mouseout", function() {

        hoverDate.text(null) // not working...

        d3.select("#hover-line")
          .style("opacity", 1e-6);
      });

    function mousemove() {
        var mouse_x = d3.mouse(this)[0];
        var graph_x = x.invert(mouse_x);

        //var mouse_y = d3.mouse(this)[1]; // Finding mouse y position on rect
        //var graph_y = y.invert(mouse_y);

        hoverDate.text(formatDateDbY(graph_x)); // scale mouse position to x date and format it to show month and year
//        console.log(mouse_x + " - " + formatDatebY(graph_x));

        d3.select("#hover-line")
            .attr("x1", mouse_x)
            .attr("x2", mouse_x)
            .style("opacity", 1);

        // attr (skill counts) // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = ((x0 - d0.date) > (d1.date - x0) ? d1 : d0);

        focus.select("text").text(function(columnName) {
           return d[columnName];
        });
    };

    function brushed() {

      x.domain(brush.empty() ? xBase.domain() : brush.extent());
      svg.select(".x.axis")
          .transition()
          .call(xAxis);

      maxY = updateMaxY(categories);
      y.domain([0, maxY]);

      svg.select(".y.axis")
          .transition()
          .call(yAxis);

      skill.select("path")
            .transition()
            .attr("d", function(d){
              return d.visible ? line(d.values) : null;
            });
    };

  }); // end d3.csv
}


function typeData(d) {
  d.date = formatDateYmd.parse(d.date);

  Object.keys(d).forEach(function(dataPoint) {

    if (!(d[dataPoint] instanceof Date))
      d[dataPoint] = +d[dataPoint];
  });

  return d;
}


function updateMaxY(data){ 
  var maxYValues = data.map(function(d) {
    if (d.visible) {
      return d3.max(d.values, function(value) {
        return value.count; })
    }
  });
  return d3.max(maxYValues);
}

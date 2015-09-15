<!DOCTYPE html>
<html>
  <head lang="en">
    <meta charset="UTF-8">
    <title></title>

    <style>

      svg {
        font: 10px sans-serif;
      }

      tr {
        vertical-align: top
      }
      td {
        padding: 5px;
        width: 180px;
      }

      .solidArc {
        -moz-transition: all 0.3s;
        -o-transition: all 0.3s;
        -webkit-transition: all 0.3s;
        transition: all 0.3s;
      }
      <!-- .x.axis path, {
        display: none;
      } -->
      .axis path,
      .axis line,
      .axis1 path,
      .axis1 line {
        fill: none;
        stroke: #b6b6b6;  //#000;
        shape-rendering: crispEdges;
      }

      .axis text {
        text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
        cursor: move;
      }

      .tick line {
        <!--fill: none;
        stroke: none; -->
      }
      .tick text {
        fill: #999;
      }


      .aster-score {
        line-height: 2;
        font-weight: bold;
        font-size: 125%;
      }

      polyline{
        opacity: .3;
        stroke: black;
        stroke-width: 2px;
        fill: none;
      }

      rect {
        fill: white;
      }
      circle {
        fill: steelblue;
        opacity: .75;
      }


      .area {
        fill: none;
        stroke: lightsteelblue;
        clip-path: url(#clip);
      }

      .line {
        fill: none;
        stroke: steelblue;
        stroke-width: 1.5px;
      }

      .brush
      .extent {
        stroke: red;//#fff;
        fill-opacity: .125;// .3;
        shape-rendering: crispEdges;
      }

      rect.pane {
        cursor: move;
        fill: none;
        pointer-events: all;
      }


      .legend-box {
        cursor: pointer;
      }

      #mouse-tracker {
        stroke: #E6E7E8;
        stroke-width: 1px;
      }

      .hover-line {
        stroke: #E6E7E8;//slategray
        fill: none;
        stroke-width: 1px;
        left: 10px;
        shape-rendering: crispEdges;
//        opacity: 1e-6;  // hides...overrides setting in js file...
      }

      .hover-text {
        stroke: none;
        font-size: 24px;
        font-weight: bold;
        fill: #000000;
      }

      // //-coords
      .background path {
        fill: none;
        stroke: #ddd;
        stroke-opacity: .9;
        shape-rendering: crispEdges;
      }

      .foreground path {
        fill: none;
        /*stroke: steelblue;*/
        stroke-opacity: .9;
      }


      .table {
        position: absolute;
        text-align: center;
        /*width: 60px;*/
        /*height: 28px;*/
        padding: 5px;
        font: 12px sans-serif;
        background: lightsteelblue;
        border: 0px;
        border-radius: 8px;
        pointer-events: none;
      }
      tr {
        vertical-align: top
      }
      td {
        padding: 5px;
        /*width: 180px;*/
      }

//      .tooltip {
//        font-weight: normal;  // redundant...
//      }

    </style>
  </head>

  <body>
    <p id="output"></p>

    <div id="legend"></div>
    <div id="plot"></div>

    <div id="test" style="display: none;" >
      // display command ignored for scripting sections but even commented out works for php - but need to hide php comments...

      <?php
        include '../php/data_parser.php';
        $languageFilter = [ "hu", "gb", "fr", "random", "el" ];
      ?>
    </div>


    <!--<script src="http://d3js.org/d3.v3.min.js"></script>-->
    <!--<script src="http://colorbrewer2.org/export/colorbrewer.js"></script>-->
    <!--<script src="http://d3js.org/queue.v1.min.js"></script>-->
    <script src="../js/common_libs/ext/d3.v3.min.js"></script>
    <script src="../js/common_libs/ext/colorbrewer.js"></script>
    <script src="../js/common_libs/ext/queue.min.js"></script>

    <script src="../js/common_libs/common.js"></script>
    <script src="../js/common.js"></script>
    <script src="../js/parallel_coords.js"></script>


    <script>

//    // need to force to top, above selectors within js or php files called
      appendToOutput("<div><h4 id='dataFilterHeader'></h4>" +
                        "<div id='dataFilter'></div><p>&nbsp;</p>" +
                        "<div id='innerPageDataFilter'></div>" +
                       "</div>");

      var parsedDirs =  JSON.parse('<?php echo str_replace('\"', "", json_encode(getDataFilesFromDefault($languageFilter))); ?>');
//      console.log(JSON.stringify(parsedDirs, null, 3));

      var countryMetadata = JSON.parse('<?php echo json_encode(getDefaultCountryMetadata($languageFilter)); ?>');
//      console.log(JSON.stringify(countryMetadata, null, 3));


      var dataFile,
          languageCodes = JSON.parse('<?php echo json_encode($GLOBALS[languageCodes]); ?>'), // will eventually need to user a parser to countryIds in jobs_short.csv, for instance//null, //[ "UK", "France", "Germany" ],
          skillSets = Object.keys(parsedDirs),
          skills = [],
          languageOfInterest,  // = languageCodes[10], // currently gb, fr == 10
          indexOfInterest = skillSets[skillSets.length - 1];

      var defaultDir = JSON.parse('<?php echo json_encode($defaultOutputDir); ?>'),
          defaultFileSuffix = JSON.parse('<?php echo json_encode($defaultSuffix); ?>');

      var languageFilter = [];
      skillSets.forEach(function(d) {

        Object.keys(parsedDirs[d]).forEach(function(language) {
          if (!contains(languageFilter, language))
            languageFilter.push(language);


          // need a default till set up to select ...
          if (!languageOfInterest)
            languageOfInterest = languageFilter[1]; // gb

          if (language === languageOfInterest)
            skills[d] = parsedDirs[d][language]; // annoyingly cannot break out...
        });
      });

      dataFile = defaultDir +
                    /*d*/ indexOfInterest + "/" +
                    languageOfInterest +
                    defaultFileSuffix
                        ;


      d3.csv("", function(error, data) {/// not doing anything with this here but without it selector does not work...
        if (error)
          return console.error(error);  // @todo - really more useful to write to screen (body)...

//        d3.select("#dataFilter")
//          .append("text")
//          .text("Select skillset: ");
//
//        var skillSetSelector = d3.select("#dataFilter")
//                              .append("select")
//                              .attr('class', 'selector');
//        skillSetSelector.selectAll("option")
//                      .data(skillSets)
//                      .enter()
//                      .append("option")
//                      .attr("value", function(d) { return d; } )
//                      .text(function(d) { return d.replace(/_/g, " "); })
//                      .on("click", function click(d) {  // this is working... or mouse, but not input :S - in firefox... but chrome also failing :S
//                        indexOfInterest = d;  // there must be a more efficient way to do this... but can't find how to select  this object and get value...
//                        skills[indexOfInterest] = filterSkills(parsedDirs, indexOfInterest, languageOfInterest);
//                        populateSkillset(skills[indexOfInterest]);
//                      })
//                      .on("input", function click(d) {  // this is not working, nor change, nor focusout... nor input :S - in firefox...
//                        indexOfInterest = d;
//                        skills[indexOfInterest] = filterSkills(parsedDirs, indexOfInterest, languageOfInterest);
//                    });


      });

      dataFile = "../data/data_extraction/detail_term_frequencies1441903172993.csv";

      drawParallelCoordinates(dataFile);
      printOutput();

      var skillSelector;
      function populateSkillset(selectedSkillSet) {

        if (!skillSelector) {

          d3.select("#dataFilter")
            .append("text")
            .text("Select skills: ");

          skillSelector = d3.select("#dataFilter")
                                .append("select")
                                .attr('class', 'selector');
        }

        skillSelector.selectAll("option")
                      .data(selectedSkillSet)
                      .enter()
                      .append("option")
                      .attr("value", function(d) { return d; } )
                      .text(function(d) { return d.replace(/_/g, " "); })
                      .on("click", function click(d) {  // this is working... or mouse, but not input :S - in firefox... but chrome also failing :S
//                        indexOfInterest = d;  // there must be a more efficient way to do this... but can't find how to select  this object and get value...
//                        skills[indexOfInterest] = filterSkills(parsedDirs, indexOfInterest, languageOfInterest);
                      })
                      .on("input" , function click(d) {  // this is not working, nor change, nor focusout... nor input :S - in firefox...
//                        indexOfInterest = d;
//                        skills[indexOfInterest] = filterSkills(parsedDirs, indexOfInterest, languageOfInterest);
                    });

        d3.select("#dataFilter")
          .selectAll("input")
          .data(["Update chart"])
          .enter()
          .append("input")
          .attr("type","button")
          .attr("class","button")
          .attr("value", function(d) { return d;}  )
          .on("click", function click(d) {  // this is working... or mouse, but not input :S
//            if (plotSvg)
//              redrawDisplay(defaultDir, defaultFileSuffix, languageOfInterest, selectedSkill);
          });
      }

    </script>


    <div><h4 id="selectionHeader"></h4>
      <div id="indicatorSelectionList"></div>
    </div>
    <a name="selectionDetail"></a>
    <div id="selectionDetail"></div>

  </body>
</html>

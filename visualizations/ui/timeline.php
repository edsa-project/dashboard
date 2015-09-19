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
        stroke: #b6b6b6;
        shape-rendering: crispEdges;
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
        fill-opacity: .125;
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
    <script src="../js/zoomable_multi_timeline.js"></script>


    <script>

//    // need to force to top, above selectors within js or php files called
      appendToOutput("<div><h4 id='dataFilterHeader'></h4>" +
                        "<div id='dataFilter'></div><p>&nbsp;</p>" +
                        "<div id='innerPageDataFilter'></div>" +
                       "</div>");

      var parsedDirs =  JSON.parse('<?php echo str_replace('\"', "", json_encode(getDataFilesFromDefault($languageFilter))); ?>');

      var countryMetadata = JSON.parse('<?php echo json_encode(getDefaultCountryMetadata($languageFilter)); ?>');


      var dataFile, // = "../data/jobs_short.csv",
          languages = JSON.parse('<?php echo json_encode($GLOBALS[languageCodes]); ?>'), // will eventually need to user a parser to countryIds in jobs_short.csv, for instance//null, //[ "UK", "France", "Germany" ],
          skills = Object.keys(parsedDirs), //[ "Data Management", "Data Governance" ],
          skillCategories = [],
          languageOfInterest,  // = languages[10], // currently gb, fr == 10
          indexOfInterest = skills[skills.length - 1];
//      console.log(skills);

      var defaultDir = JSON.parse('<?php echo json_encode($defaultOutputDir); ?>'),
          defaultFileSuffix = JSON.parse('<?php echo json_encode($defaultSuffix); ?>');

      languages = [];  // reset ...
      Object.keys(parsedDirs).forEach(function(d) {

        Object.keys(parsedDirs[d]).forEach(function(language) {
          if (!contains(languages, language))
            languages.push(language);

          // need a default till set up to select ...
          if (!languageOfInterest)
            languageOfInterest = languages[1];

          if (language === languageOfInterest)
            skillCategories[d] = parsedDirs[d][language]; // annoyingly cannot break out...
        });
      });

      dataFile = defaultDir +
                    /*d*/ indexOfInterest + "/" +
                    languageOfInterest +
                    defaultFileSuffix
                        ;
      appendToOutput("Data file: " + indexOfInterest + "/" + languageOfInterest + defaultFileSuffix);//dataFile);

      drawMultiAttrTimeline(dataFile);//"../data/test_data/ml_data.csv");

      printOutput();

    </script>

  </body>
</html>
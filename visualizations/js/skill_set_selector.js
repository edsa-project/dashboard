
//var skillSelector;

/*
function populateSkillset(selectedSkillSet) {
buildSkillsetFilter("innerPageDataFilter", selectedSkillSet);

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
} // end function populateSkillset
*/

function buildSkillsetPanel(divId, skillSet) {
 divId = "#" + divId;

  d3.select(divId)
    .append("text")
    .style("font-size", "14px")
    .text("Skillsets".toUpperCase());

  d3.select(divId)
    .selectAll("div")
    .data(Object.keys(skillSet)) // map - key: label; values: skills
    .enter()

    // outer div used for show-hide
    .append("div")
    .attr("class", "selector-box")
    .each(function (d) {
      d3.select(this)
        .append("span")
        .attr("id", function (d) { return "div_label_" + d; } )
        .style("font-weight", "bold")
        .style("display", "none")
        .text(function (d) { return "\u2004 + \u2004" + d.replace(/_/g, " ").toUpperCase(); } ) // \u25BC/A
//        .text(function (d) { return "<a onmousedown='showHideRegion(div_" + d + ", div_label_" + d + ")'  href='javascript:;'>\u25BC</a> " + d.replace(/_/g, " ").toUpperCase(); } )
    })
//    .on("mousedown", function (d) { // there's some pause... annoying...// need to use mousedown or click below isn't recognised...
      // having said that... mousedown is affecting the entire div... will need to retest...
//      showHideRegion("div_" + d, "div_label_" + d);
//    })
    .on("dblclick", function (d) {
      showHideRegion("div_" + d, "div_label_" + d);
    })

    // div containing each skillset
    .append("div")
    .attr("id", function (d) { return "div_" + d; } )
    .append("p")
    .each(function (d) {

      // skillSet label
      d3.select(this).append("span")
        .style("font-weight", "bold")
        .text(function (d) { return "\u2009\u2014\u200A"; } )
        .on("click", function (d) { // there's some pause... annoying...
          showHideRegion("div_" + d, "div_label_" + d);
        });
      d3.select(this)
        .append("input")
        .attr("type", "checkbox")
        .attr("id", function (d) { return d; } )
//        .attr("checked", false) // doesn't recognise false... but this is default, anyway...
        .attr("class", "skillSet")
        .on("click", function (d, i) {
          filterPlot(this, skillSet[d]);
        })
      d3.select(this).append("span")
        .style("font-weight", "bold")
        .text(function (d) { return d.replace(/_/g, " ").toUpperCase(); } )
        .append("br");

      // and skills
      for (var k = 0; k < skillSet[d].length; k++) {

        d3.select(this)
          .append("input")
          .attr("type", "checkbox")
          .attr("id", function (d) { return d + defaultDelimiter + skillSet[d][k]; } )
  //            .attr("checked", false) // doesn't recognise false...
          .style("margin-left", "24px")
          .attr("class", "skill")
          .on("click", function (d) {
            filterPlot(this);
          });
        d3.select(this).append("span")
          .style("color", "blue")
          .text(function (d) { return skillSet[d][k].toLowerCase().replace(/_/g, " "); } )
          .append("br");
      }
  });
}

function filterPlot(itemSelected, skillSet) {
  updateSelectorPanel(itemSelected, skillSet);
  applyFilter(itemSelected, skillSet);  //define as required by each widget or plot
}

function updateSelectorPanel(itemSelected, skillSet) {
  var g = d3.select(itemSelected).node().parentNode;

  if (skillSet) { // cascade...
    d3.select(g).selectAll(".skill")
                .property("checked", (itemSelected.checked ? true : false));  // attr doesn't work properly...

  } else {
    var parent = d3.select(g).select(".skillSet");

    if (itemSelected.checked) {
      var set = d3.select(g).selectAll(".skill");
//      set.each(function(d) {  // returns parent label

      set.forEach(function(d) { // don't understand why need to iterate twice, but not till the second does it return the checkbox element with properties defined...
        var allSelected = true;

        d.forEach(function(k) {
          if (allSelected) // only need to reset once... but cannot break out of loop...
            allSelected = k.checked;
        }); // end check for toggle skillSet label...
        parent.property("checked", allSelected);
        
      });
    } else
      parent.property("checked", itemSelected.checked);  // should be false
  }
}

// adapted from http://jsfiddle.net/zhanghuancs/cuYu8
function buildSkillsetFilter(divId, selectedSkillSet, replaceContents) {
  divId = "#" + divId;

  if (replaceContents) {
    d3.select(divId)
      .selectAll("div")
      .data("")
      .exit().remove();
  }

  d3.select(divId)
    .selectAll("div")
    .data(selectedSkillSet)
    .enter()
    .append("div")
    .attr("class", "selector-box")  //"checkbox-container")
    .append("label")
    .each(function (d) {
      d3.select(this)
        .append("input")
        .attr("type", "checkbox")
        .attr("id", function (d) { return d; } )
//            .attr("checked", false) // doesn't recognise false...
        .on("click", function (d, i) {
//              filterGraph(d, (this.checked ? "visible" : "hidden"));// @tod - set up
        });
      d3.select(this).append("span")
        .text(function (d) { return d; } );
  });
} // end function buildSkillsetFilter

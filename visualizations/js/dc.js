
/********************************************************
*														*
* 	dj.js example using EDSA  Dataset		*
* 	Alan Ponce  4th August  2015 						*
*														*
********************************************************/

/********************************************************
*														*
* 	Step0: Load data from json file						*
*														*
********************************************************/
d3.json("data/JobsShort2.json", function (edsa_data) {
	
/********************************************************
*														*
* 	Step1: Create the dc.js chart objects & ling to div	*
*														*
********************************************************/
var bubbleChart = dc.bubbleChart("#dc-bubble-graph");
var pieChart1 = dc.pieChart("#dc-pie-graph");
var pieChart2 = dc.pieChart("#dc-pie-graph2");
var volumeChart = dc.barChart("#dc-volume-chart");
var lineChart = dc.lineChart("#dc-line-chart");
var dataTable = dc.dataTable("#dc-table-graph");
var rowChart1 = dc.rowChart("#dc-row-graph");

/********************************************************
*														*
* 	Step2:	Run data through crossfilter				*
*														*
********************************************************/

//It creates a new crossfilter with given records (edsa_data)
var ndx = crossfilter(edsa_data);
	
/********************************************************
*														*
* 	Step3: 	Create Dimension that we'll need			*
*														*
********************************************************/

	
	//Skills Row Chart
	var skillDimension = ndx.dimension(function (d) { return d.Skill; });
	var skillValueGroup = skillDimension.group();
	var skillDimensionGroup = skillDimension.group().reduce(
		//Add
		function (p,v){
			++p.count;
			p.review_sum += v.Country_Percentage;
			p.star_sum +=v.Jobs;
			p.review_avg = p.review_sum / p.count;
			p.star_avg = p.star_sum / p.count;
			return p;
		},
		//Remove
		function (p,v){
			--p.count;
			p.review_sum +=v.Skills_Percentage;
			p.star_sum += v.Jobs;
			p.review_avg = p.review_sum / p.count;
			p.star_avg = p.star_sum / p.count;
			return p;
		},
		//init
		function (p,v){
			return{count:0, review_sum: 0, star_sum: 0, review_avg: 0, star_avg: 0};
		}
	); 

	//Jobs Row Chart
	var jobsDimension = ndx.dimension(function (d) { return d.Jobs; });
	var jobsValueGroup = jobsDimension.group();

	//Country Row Chart
	var countryDimension = ndx.dimension(function (d) { return d.Country; });
	var countryValueGroup = countryDimension.group();

	// For datatable
	var skillsTableDimension = ndx.dimension(function (d) { return d.Skill; });

/********************************************************
*														*
* 	Step4: 	Step4: Create the Graphs and Visualisations											*
*														*
********************************************************/

bubbleChart.width(650)
			.height(340)
			.dimension(skillDimension)
			.group(skillDimensionGroup)
			.transitionDuration(1500)
			.colors(["#a60000","#ff0000", "#ff4040","#ff7373","#67e667","#39e639","#00cc00"])
			.colorDomain([-12000, 12000])

			.x(d3.scale.linear().domain([0, 50]))
			.y(d3.scale.linear().domain([0, 50]))
			.r(d3.scale.linear().domain([0, 2500]))

			.keyAccessor(function (p) {
				return p.value.star_avg;
			})
			.valueAccessor(function (p) {
				return p.value.review_avg;
			})
			.radiusValueAccessor(function (p) {
				return p.value.count;
			})

			.transitionDuration(1500)
			.elasticY(true)
			.yAxisPadding(1)
			.xAxisPadding(1)
			.label(function (p) {
				return p.key;
			})

			.renderLabel(true)
			.renderlet(function (chart) {
		        rowChart1.filter(chart.filter());
		    })
		    .on("postRedraw", function (chart) {
		        dc.events.trigger(function () {
		            rowChart1.filter(chart.filter());
		        });
			 });
		    ;

	//Skills Row Chart
	rowChart1.width(330)
 			.height(750)
 			.dimension(skillDimension)
 			.group(skillValueGroup)
 			.renderLabel(true)
 			//.colors(["#a60000","#ff0000", "#ff4040","#ff7373","#67e667","#39e639","#00cc00"])
 			.colors(['rgb(141,211,199)','rgb(255,255,179)','rgb(190,186,218)','rgb(251,128,114)','rgb(128,177,211)','rgb(253,180,98)','rgb(179,222,105)','rgb(252,205,229)','rgb(217,217,217)','rgb(230,245,201)'])
 			//.colorDomain([0, 0])
		    .renderlet(function (chart) {
		        bubbleChart.filter(chart.filter());
		    })
		    .on("filtered", function (chart) {
		        dc.events.trigger(function () {
		            bubbleChart.filter(chart.filter());
		        });
			 });	

	//Jobs Volume Chart
	volumeChart.width(250)
            .height(240)
            .dimension(jobsDimension)
            .group(jobsValueGroup)
			.transitionDuration(1500)
            .centerBar(true)	
			.gap(777)
            .x(d3.scale.linear().domain([0.5, 140]))
			.elasticY(true)
			.on("filtered", function (chart) {
				dc.events.trigger(function () {
					if(chart.filter()) {
						console.log(chart.filter());
						lineChart.filter(chart.filter());
						}
					else
					{lineChart.filterAll()}
				});
			})
			.xAxis().tickFormat(function(v) {return v;});	

	//Jobs Line Chart
	lineChart.width(250)
		.height(220)
		.dimension(jobsDimension)
		.group(jobsValueGroup)
		.x(d3.scale.linear().domain([0.5, 25]))
		.valueAccessor(function(d) {
			return d.value;
			})
			.renderHorizontalGridLines(true)
			.elasticY(true)
			.xAxis().tickFormat(function(v) {return v;});	

	//Jobs Pie Chart
	pieChart1.width(320)
		.height(280)
		.transitionDuration(1500)
		.dimension(jobsDimension)
		.group(jobsValueGroup)
		.radius(140)
		.minAngleForLabel(0)
		.label(function(d) { return d.data.key; })
		.on("filtered", function (chart) {
			dc.events.trigger(function () {
				if(chart.filter()) {
					console.log(chart.filter());
					//volumeChart.filter([chart.filter()-25,chart.filter()-(-25)]);
					}
				else volumeChart.filterAll();
			});
		});			

	//Country Pie Chart
	pieChart2.width(320)
		.height(280)
		.transitionDuration(1500)
		.dimension(countryDimension)
		.group(countryValueGroup)
		.radius(140)
		.minAngleForLabel(0)
		.label(function(d) { return d.data.key; })
		.on("filtered", function (chart) {
			dc.events.trigger(function () {
				if(chart.filter()) {
					console.log(chart.filter());
					//volumeChart.filter([chart.filter()-25,chart.filter()-(-25)]);
					}
				else volumeChart.filterAll();
			});
		});
	
	//Full Table
	dataTable.width(340)
	.height(200)
 		.dimension(skillsTableDimension)
 		.group(function(d) { return "List of all Selected Skills"
 		 })
 		.size(100)
    	 .columns([
        	 function(d) { return d.Skill; },
        	 function(d) { return d.Country; },
   		     function(d) { return d.Jobs; },
  	    	 function(d) { return d.Country_Percentage; },
       		 function(d) { return d.Skills_Percentage; },
 			function(d) { return '<a href=\"https://gb.linkedin.com/' +"\" target=\"_blank\">LinkedIn</a>"}
    		 ])
     .sortBy(function(d){ return d.Jobs; })
     // (optional) sort order, :default ascending
     .order(d3.ascending);

/********************************************************
*														*
* 	Step6: 	Render the Charts							*
*														*
********************************************************/
			
	dc.renderAll();
});

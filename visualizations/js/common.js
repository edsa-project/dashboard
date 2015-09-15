
var colourCodes = { jobs : "red",
                    Country_Percentage: "black",
                    Skills_Percentage: "olive",
//                    regionCount: "steelblue"
                  };

var parseJobCountOptions = {  linear_complete : 0,
                              linear_by_skill : 1,
                              linear_by_date : 2,
                              log_complete : 3,
                              log_by_skill : 4,
                              log_by_date : 5
                            };

//
//    var colourCodesLib = d3.scale.ordinal()
//                            .range(d3.merge([
////                                    colorbrewer.RdYlBu[7],
////                                    colorbrewer.Pastel1[8],
//                                    colorbrewer.Spectral[11],
//                                    colorbrewer.Accent[8],
////                                    colorbrewer.RdYlGn[11],
//                                  ]))
//                            .domain(colourCodesDomain);



function filterByCountryPercentage(key, threshold, data) {
  var slice = data.filter(function(coordinate) {
                      if (coordinate.Country_Percentage >= threshold)
                        return coordinate;
                    }).sort(function(a, b) {
                      return (b.Country_Percentage > a.Country_Percentage);
                    });

  var returnValue,  // keeps iterating past this...
      count = 0;

  slice.forEach(function (jobSet) {
    if (!returnValue && (key === jobSet.Country_Percentage))
      returnValue = slice.length - count;
    count++;
  });

  return (!returnValue ? "" : returnValue);
}

function filterBySkillsPercentage(key, threshold, data) {
  var slice = data.filter(function(coordinate) {
                      if (coordinate.Skills_Percentage >= threshold)
                        return coordinate;
                    }).sort(function(a, b) {
                      return (b.Skills_Percentage > a.Skills_Percentage);
                    });

  var returnValue,
      count = 0;

  slice.forEach(function (jobSet) {
    if (!returnValue && (key === jobSet.Skills_Percentage))
      returnValue = slice.length - count;
    count++;
  });

  return (!returnValue ? "" : returnValue);
}

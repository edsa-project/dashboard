import urllib
import json
import codecs
from geopy.geocoders import GeoNames

#First geocoder developed by Chris in Crete


#save results to file
def output():
	print 'Ending'
	#dictionary to match the geojson structure
	features = dict()
	features['type'] = "FeatureCollection"
	feature_list = list()
	for key in location_dict:
		this_location_details = location_dict[key]
		this_location = key
		feature = dict()
		feature['type'] = "Feature"
		data = dict()
		geometry = dict()
		properties = dict()
		data['location'] = this_location
		data['type'] = "Point"
		data['coordinates'] = [this_location_details[1], this_location_details[0]]
		feature['geometry'] = data
		feature_list.append(feature)
	features['features'] = feature_list
	with open("locations_full2.geojson", 'w+') as outfile:
		json.dump(features, outfile)


#Main code
geolocator = GeoNames(username="edsa_project")
#replace with name of location file, or add in file input as arg
f = open("Locations4")
fail_list = list()  # for recording a list of any place names that do not return a result
location_dict = dict()
#output_list = list()
for line in f:
	unicode_line = unicode(line, "utf-8")
	unicode_line  = unicode_line [3:-3]
	try:
		location=geolocator.geocode(unicode_line )				
		coords = ((location.latitude, location.longitude))
		location_dict[line] = coords
		print unicode_line
		print coords		
	except:
		fail_list.append(unicode_line)
print 'FAILED:'
for failed in fail_list:
	print failed
output()

	

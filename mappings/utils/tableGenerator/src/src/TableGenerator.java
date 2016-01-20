/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package src;

import fr.inria.acacia.corese.api.IDatatype;
import fr.inria.acacia.corese.exceptions.EngineException;
import fr.inria.edelweiss.kgram.core.Mapping;
import fr.inria.edelweiss.kgram.core.Mappings;
import fr.inria.edelweiss.kgraph.core.Graph;
import fr.inria.edelweiss.kgraph.query.QueryProcess;
import fr.inria.edelweiss.kgtool.load.Load;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.commons.lang3.StringUtils;

/**
 *
 * @author ldig
 */
public class TableGenerator {

	static String TABLEQUERY = "@prefix geonames: <http://www.geonames.org/ontology#> \n" +
"@prefix schema: <http://schema.org/> \n" +
"@prefix edsa: <http://www.edsa-project.eu/edsa#> \n" +
"@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \n" +
"@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
"@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
"@prefix xml: <http://www.w3.org/XML/1998/namespace> \n" +
"@prefix xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
"\n" +
"select ?job ?title ?hiringOrganization ?locationName ?lat ?long ?countryName (group_concat(?skillname;separator=\"|\") as ?skills) where {\n" +
"  ?job schema:jobTitle ?title .\n" +
"  ?job schema:hiringOrganization ?hiringOrganization .\n" +
"  ?job edsa:Location ?location .\n" +
"  ?location geonames:name ?locationName .\n" +
"  ?location geonames:parentCountry ?country .\n" +
"  ?country geonames:name ?countryName .\n" +
"  ?job edsa:requiresSkill ?skill .\n" +
"  ?skill edsa:lexicalValue ?skillname .\n" +
"  ?location geo:lat ?lat .\n" +
"  ?location geo:long ?long \n" +
"}\n" +
"group by ?job ?title ?hiringOrganization ?locationName ?lat ?long ?countryName\n" +
"order by ?countryName";
	
		
    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws ParseException {
        // TODO code application logic here

		String inputfile = "";
		String endpoint = "";
		String outputcsv = "";
		String skills = "";
		String countries = "";

		Options options = new Options();
		options.addOption("inputfile",true,"Input RDF file");
		options.addOption("endpoint",true,"Endpoint to query");
		options.addOption("outputcsv",true,"Output csv file");
		options.addOption("skillNames",true,"Dataset with the skill names");
		options.addOption("countries",true,"Dataset with the countries");

		CommandLineParser parser = new DefaultParser();
		CommandLine cmd = parser.parse( options, args);

		if(cmd.hasOption("inputfile") && cmd.hasOption("endpoint")) {
			System.out.println("Choose inputfile or endpoint");
			System.exit(1);
		} else if(cmd.hasOption("inputfile")){

			inputfile = cmd.getOptionValue("inputfile");
			if(cmd.hasOption("skillNames")){

			skills = cmd.getOptionValue("skillNames");
		
			}else {
				System.out.println("Missing skill names file");
				System.exit(1);
			}
		
			if(cmd.hasOption("countries")){

				countries = cmd.getOptionValue("countries");
		
			}else {
				System.out.println("Missing countries file");
				System.exit(1);
			}
				
		} else if(cmd.hasOption("endpoint")){
			endpoint = cmd.getOptionValue("endpoint");
		
		}

		if(cmd.hasOption("outputcsv")){

			outputcsv = cmd.getOptionValue("outputcsv");
		
		}else {
			System.out.println("Missing output file path");
			System.exit(1);
		}

		


			try {
					if(cmd.hasOption("inputfile")){
					genTableFromFile(inputfile,outputcsv,skills,countries);
					}
					else{
						genTableFromEndpoint(endpoint,outputcsv);}
					
					System.out.println("Finished!");
			} catch (UnsupportedEncodingException ex) {
					Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
			} catch (FileNotFoundException ex) {
					Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
			}


		

    }

    /*
    Input: 
    fp: RDF file with the jobs in the discussed data model. No need to have the skillNames and countries loaded.
    outputfile: file to be output
    skillNames: File with the skillNames (see utils/datasets)
    countries: File with the countries (see utils/datasets)
 
    */
    public static void genTableFromFile(String fp, String outputfile, String skillNames, String countries) throws UnsupportedEncodingException, FileNotFoundException {
		Graph graph = Graph.create();	
		Load ld = Load.create(graph);
		ld.load(fp);	

		ld.load(skillNames);
		ld.load(countries);

		String header = "job, title, hiringOrganization, locationName, lat, lon, countryName, skills";
		try (Writer out = new BufferedWriter(new OutputStreamWriter(
				new FileOutputStream(outputfile), "UTF-8"))) {
			out.write(header);
		} catch (IOException ex) {
				Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
		}

		QueryProcess exec = QueryProcess.create(graph);
		try {	
				Mappings map = exec.query(TABLEQUERY);
				//TODO: Abstract this to a method
				String[] line = new String[8]; 
				for (Mapping m : map){
				   		IDatatype dt = (IDatatype) m.getValue("?job");
						line[0] = dt.getLabel();
						dt = (IDatatype) m.getValue("?title");
						line[1] = dt.getLabel();
						dt = (IDatatype) m.getValue("?hiringOrganization");
						line[2] = dt.getLabel();
						dt = (IDatatype) m.getValue("?locationName");
						line[3] = dt.getLabel();
						dt = (IDatatype) m.getValue("?lat");
						line[4] = dt.getLabel();
						dt = (IDatatype) m.getValue("?long");
						line[5] = dt.getLabel();
						dt = (IDatatype) m.getValue("?countryName");
						line[6] = dt.getLabel();
						dt = (IDatatype) m.getValue("?skills");
						line[7] = dt.getLabel();
						try (BufferedWriter out = new BufferedWriter(new OutputStreamWriter(
								new FileOutputStream(outputfile, true), "UTF-8"))) {
							out.newLine();
							out.write(StringUtils.join(line, ","));
						} catch (IOException ex) {
								Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
						}
					}
		} catch (EngineException ex) {
				Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
		}

		
	
	}
    /*
    Input: 
    endpoint: URI with an endpoint already loaded with all the data (countries and skillNames included)
    outputfile:
    */
    public static void genTableFromEndpoint(String endpoint, String outputfile) {

	// CORESE uses the SERVICE keyword for remote endpoints
	Graph graph = Graph.create();

String fedquery = "@prefix geonames: <http://www.geonames.org/ontology#> \n" +
"@prefix schema: <http://schema.org/> \n" +
"@prefix edsa: <http://www.edsa-project.eu/edsa#> \n" +
"@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \n" +
"@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
"@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
"@prefix xml: <http://www.w3.org/XML/1998/namespace> \n" +
"@prefix xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
"\n" +
"select ?job ?title ?hiringOrganization ?locationName ?lat ?long ?countryName (group_concat(?skillname;separator=\"|\") as ?skills) where {\n" +
"SERVICE <" + endpoint + "> {" + 
"  ?job schema:jobTitle ?title .\n" +
"  ?job schema:hiringOrganization ?hiringOrganization .\n" +
"  ?job edsa:Location ?location .\n" +
"  ?location geonames:name ?locationName .\n" +
"  ?location geonames:parentCountry ?country .\n" +
"  ?country geonames:name ?countryName .\n" +
"  ?job edsa:requiresSkill ?skill .\n" +
"  ?skill edsa:lexicalValue ?skillname .\n" +
"  ?location geo:lat ?lat .\n" +
"  ?location geo:long ?long \n" +
"}\n" +
"}\n" +
"group by ?job ?title ?hiringOrganization ?locationName ?lat ?long ?countryName\n" +
"order by ?countryName";


	
	QueryProcess exec = QueryProcess.create(graph);
	
	String header = "job, title, hiringOrganization, locationName, lat, lon, countryName, skills";
	
	try (Writer out = new BufferedWriter(new OutputStreamWriter(
				new FileOutputStream(outputfile), "UTF-8"))) {
		out.write(header);
	} catch (IOException ex) {
			Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
	}
	
	try {	
				Mappings map = exec.query(fedquery);
				//TODO: Abstract this to a method
				String[] line = new String[8]; 
				for (Mapping m : map){
				   		IDatatype dt = (IDatatype) m.getValue("?job");
						line[0] = dt.getLabel();
						dt = (IDatatype) m.getValue("?title");
						line[1] = dt.getLabel();
						dt = (IDatatype) m.getValue("?hiringOrganization");
						line[2] = dt.getLabel();
						dt = (IDatatype) m.getValue("?locationName");
						line[3] = dt.getLabel();
						dt = (IDatatype) m.getValue("?lat");
						line[4] = dt.getLabel();
						dt = (IDatatype) m.getValue("?long");
						line[5] = dt.getLabel();
						dt = (IDatatype) m.getValue("?countryName");
						line[6] = dt.getLabel();
						dt = (IDatatype) m.getValue("?skills");
						line[7] = dt.getLabel();
						try (BufferedWriter out = new BufferedWriter(new OutputStreamWriter(
								new FileOutputStream(outputfile, true), "UTF-8"))) {
							out.newLine();
							out.write(StringUtils.join(line, ","));
						} catch (IOException ex) {
								Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
						}
					}
		} catch (EngineException ex) {
				Logger.getLogger(TableGenerator.class.getName()).log(Level.SEVERE, null, ex);
		}
	// Query needs to be adapted to service	
	//String query = "" 

    }
    
    }


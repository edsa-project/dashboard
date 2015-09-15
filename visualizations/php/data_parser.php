/** borrows from https://github.com/davetaz/EDSA/blob/gh-pages/harvester.php */


<?php

  $defaultTopLevelDataFolder = "../data/";
  $defaultSearchTermsDir = $defaultTopLevelDataFolder . "harvester/search_terms/";
  $defaultOutputDir = $defaultTopLevelDataFolder . "harvester/search_results/linkedin/";
  $defaultCountryMetadataFile = $defaultTopLevelDataFolder . "eu-country-languages.csv";
  $defaultSuffix = ".csv";

  $languageCodes = [];

  function getDefaultCountryMetadata($languageFilter) {
    return getCountryMetadata($defaultCountryMetadataFile, $languageFilter);
  }

  function getCountryMetadata($metadataFile, $languageFilter) {
    //name,ISO2,id,Language
    $countryNameIndex = -1;
    $iso2Index = -1;
    $countryIdIndex = -1;
    $languageIndex = -1;

    if (!isset($metadataFile) || trim($metadataFile) == "")
      $metadataFile = "../data/eu-country-languages.csv";

    $countryMetadata = file($metadataFile);
    $metadata = [];

    $tmp = explode(",", $countryMetadata[0]);
    $headers = array_fill_keys($tmp, "");

    for ($i = 0; $i < count($tmp); $i++) {
      if (array_key_exists($tmp[$i], $headers)) {
        $headers[$tmp[$i]] = $i;

        if (trim($tmp[$i]) === "name")
          $countryNameIndex = $i;
        else if (trim($tmp[$i]) === "ISO2")
          $iso2Index = $i;
        else if (trim($tmp[$i]) === "id")
          $countryIdIndex = $i;
        else if (trim($tmp[$i]) === "Language")
          $languageIndex = $i;
     }
    } // end for

    $countryNameKey = trim(array_keys($headers)[$countryNameIndex]);
    $iso2Key = trim(array_keys($headers)[$iso2Index]);
    $countryIdKey = trim(array_keys($headers)[$countryIdIndex]);
    $languageKey = trim(array_keys($headers)[$languageIndex]);

    for ($i = 1; $i < count($countryMetadata); $i++) {

      $dataValues = explode(",", $countryMetadata[$i]);


      if (($countryName = trim($dataValues[$countryNameIndex])) !== null) {
        if ( (($language = trim($dataValues[$languageIndex])) !== null) &&
            in_array($language, $languageFilter)) {

          $metadataHolder = array(
                              $countryNameKey => $countryName, //name
                              $iso2Key => $dataValues[$iso2Index], //ISO2
                              $countryIdKey => $dataValues[$countryIdIndex], //id
                              $languageKey => $language //Language
                              );
          $metadata[$countryName] = $metadataHolder;
        }
      }
    }

    return $metadata;
  }

  function getDataFilesFromDefault($languageFilter) {
    return getDataFiles($defaultSearchTermsDir, $defaultOutputDir, $languageFilter); // cannot get why this prefixes array with 1 ...
  }

  function getDataFiles($searchTermsDir, $resultsDir, $languageFilter) {


    if (!isset($searchTermsDir) || trim($searchTermsDir) == "")
      $searchTermsDir = "../data/harvester/search_terms/";
    if (!isset($resultsDir))
      $resultsDir = "../data/harvester/search_results/linkedin/";

    $files = scandir($searchTermsDir);
    $extractedTerms = [];

    for ($i = 2; $i < count($files); $i++) {  // need to skip directory :S listings (. & ..)

      $subSearchTerms = [];
      $count = 0;
      $file = $searchTermsDir . $files[$i];

      $file_handle = fopen($file, "r"); //need to parse so file(fileName) not useful
      while (!feof($file_handle)) {
        if ($count == 0) {
          $languageCodeHeaders = trim(fgets($file_handle));
          $GLOBALS[languageCodes] = array_merge($GLOBALS[languageCodes], $languages = explode(",", $languageCodeHeaders));

          if ((is_null($languageFilter)) || (count($languageFilter) == 0))
            $subSearchTerms = array_fill_keys($languages, []);
          else //if (in_array($languageFilter, $languages))
            $subSearchTerms = array_fill_keys(array_intersect($languageFilter, $languages), []);

        } else if (strlen($term = trim(fgets($file_handle))) > 0) {
          $tmp = explode(",", $term);
          for ($j = 0; $j < count($tmp); $j++) {
            if (is_null($languageFilter) || array_key_exists($languages[$j], $subSearchTerms))
              array_push($subSearchTerms[$languages[$j]], $tmp[$j]);
          }
        }

        $count++; // any other way will come out b4 printing last
      }
      fclose($file_handle);

      $GLOBALS[languageCodes] = array_unique($GLOBALS[languageCodes]);

      $extractedTerms[substr($files[$i], 0, -4)] = $subSearchTerms;


      $resultBatch = $resultsDir . substr($files[$i], 0, -4); // @todo - replace with suffix call
      $output_files = scandir($resultBatch);
    }

   return $extractedTerms;
  }

  $languageFilter = [ "gb", "fr", "random", "el" ];
  $countryMetadata = getDefaultCountryMetadata($languageFilter);

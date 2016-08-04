# scrapper
Iterates list page and then scraps the detailed page to scrap values from it. The output is in a csv file format

## Usage: 
  The executable is inside `./bin` folder
  
  You can either use the executable from cli
  
  ```
  scrapper -f <config filename>
  ```
  
  OR
  
  use from your nodejs script
  
  ```
  Scrapper = require ('scapper');
  var config = {
  }; // The config file
  (new Scrapper(config)).execute();
  ```
  
  ## Explaining the config
  
  A example is added in config_example.json.
  
  * __site__ - The domain where you want to scrap from. eg: example.com
  * __list__ - configuration from list page.
      * _url_ - The url of the list page. eg: http://www.example.com?pagetype=list&page=%page%
      * _startIndex_ - The starting page id. This value replaces `%page%` in url above. 
      * _pageLimit_ - The ending page id. This value replaces `%page%` in url above. The code iterates pages from startIndex to pageLimit
      * _selectorForLink_ - The selector to find the links for detailed page
  * __browserDetails__ - configuration to mimic a browser
      * _userAgent_ - Add a valid user agent
      * _cookie_ - If cookie is required then add this
  * __throttleTime__ - time in millisecond. Throttles the page fetch speed .
  * __listPageThrottleTime__ (optional) - time in millisecond. Throttles the page fetch speed page for list page. If not present then it uses throttleTime
  * __detailed__ - Configuration for the detailed page
      * _scrapValues_ - List of option to scrap from the detailed page. It is an array of scrapOptions. 
  * __output__ - Configuration for the output
      * _location_ - The file location where the output csv is saved
      * _bufferLength_ - The length of buffer to hold the output scrap values. After it is filled up , the program empties it to the output file csv file


  ### Scrap options
  * __selector__ - The css seelctor where the content lies
  * __key__ - The field name
  * __split__ - configuration to split the selectors content
      * _sep_ - The separator by which the content is split
      * _idx_ - The index of the splitted string array to be picked as the value
  * __func__ - for complex processing of the selectors content you can add the function content here. The function is passed one argument and it is the selectors content. The output of the function is picked as the value
  

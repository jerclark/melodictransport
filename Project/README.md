#CS171 - Spring 2016 Final Project
###DCE Studio 1, Group 2 - Melodic Transport
Nathaniel Burbank, Burno Carriere, Jeremy Clark

Project Title: *The American Consumer - 30 years of consumer spending trends*

##Project Structure:

###Libraries Used (/lib):
D3: For visualizations

D3-tip: For viz tool tips

Bootstrap: For Layout

Font-Awesome: For Tree viz Icons

Colorbrewer: For color generation and ordering

Underscore: For code utility

Queue: For data loading

Jquery: For library support, event handling, and other Jquery goodness

Jquery-scrolltofixed: For pinning the timeline

###Original Sources (/js)
*adjusted-dollars.js*: To calculate raw dollar values to inflation adjusted values. Code adapted from https://github.com/snemvalts/dollarinflation

*dataset.js*: Loads data used in site, implements basic query api and utility functions for accessing data.

*demographic-picker.js*: Implements various picker dropdowns using html templates in index.html

*main.js*: Main file that loads initializes the site and loads the visualizations. Also has event handlers for calling back into the visualiztions on control changes.

*multiple-plot.js*: Utility used to draw the side by side trees. Could be expanded to support arbitrarly sized plot-matrices, but it would need some work to do that.

*radar.js*: Viz code for radar chart.

*stacked-area.js*: Viz code for Area Chart

*stories.js*: Utility class with API to show and hide stories next to the charts.

*timeline.js*: Viz code for timeline brush component

*tree.js*: Viz code for money tree

###HTML
*index.html*: Has it all


##Links
###Project Site
[http://melodictransport.uppadada.com/cs171/project/index.html](http://melodictransport.uppadada.com/cs171/project/index.html)

There are links to project book and screencast on the website, and files can be directly viewed at:
[http://melodictransport.uppadada.com/cs171/project/screencast.mp4](http://melodictransport.uppadada.com/cs171/project/screencast.mp4)
[http://melodictransport.uppadada.com/cs171/project/process_book.pdf](http://melodictransport.uppadada.com/cs171/project/process_book.pdf)

###Databrowser
We used a homegrown data browser (Thanks, Bruno!) to help us analyze the vast amounts of data in the Bureau of Labor Statistics Consumer Expenditure survey. You can find it at:
[http://melodictransport.uppadada.com/cs171/databrowser/index.html](http://melodictransport.uppadada.com/cs171/databrowser/index.html)

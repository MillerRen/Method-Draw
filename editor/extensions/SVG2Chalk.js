
/*
   parser = new DOMParser();
   xmlDoc = parser.parseFromString(text,"text/xml");
 */

var SVG2Chalk = (function(){

    var parser = new DOMParser();

    function toChalk(svgstring)
    {
        var title = "Dummy title";
        var description = "Dummy description";
        var bodies = [];
        var tacks = [];
        var hints = [];
        var decorations = [];
        var setupFunc = "function(context){}";
        var updateFunc = "function(context){}";

    	var xmlDoc = parser.parseFromString(svgstring,"text/xml");
        var rects = xmlDoc.getElementsByTagName("rect");
        var ellipses = xmlDoc.getElementsByTagName("ellipse");

        var source = "\r\nLevelSelector.getLevels().push({\r\n" + 
            "title : '" + title + "',\r\n" +
            "description : '" + description + "',\r\n" +
            "bodies : " + JSON.stringify(bodies) + ",\r\n" +
            "tacks : " + JSON.stringify(tacks) + ",\r\n" +
            "hints : " + JSON.stringify(hints) + ",\r\n" +
            "decorations : " + JSON.stringify(decorations) + ",\r\n" +
            "setup : " + setupFunc + ",\r\n" +
            "update : " + updateFunc + ",\r\n" +
        "});\r\n\r\n\r\n/*\r\n Generated from SVG: \r\n" + svgstring + "\r\n*/";
    	return source;
    }

    function createShapeFromRect(element)
    {
    	return {
    		label : element.getAttribute("id"),
            type : "Polygon",
            position : [element.getAttribute("cx"),element.getAttribute("cy")],
            radio : element.getAttribute("rx"),
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000",
            isSensor : element.getAttribute("stroke") == "#f00",
    	};
    }

    function createShapeFromPath(element)
    {
    	return {
    		label : element.getAttribute("id"),
            type : "Polygon",
            position : [element.getAttribute("cx"),element.getAttribute("cy")],
            radio : element.getAttribute("rx"),
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000",
            isSensor : element.getAttribute("stroke") == "#f00",
    	};
    }

    function createShapeFromEllipse(element)
    {
    	return {
    		label : element.getAttribute("id"),
            type : "Polygon",
            position : [element.getAttribute("cx"),element.getAttribute("cy")],
            radio : element.getAttribute("rx"),
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000",
            isSensor : element.getAttribute("stroke") == "#f00",
    	};
    }

    function scale()
    {

    }

    return { toChalk : toChalk };
})();
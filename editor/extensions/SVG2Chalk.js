
/*
   parser = new DOMParser();
   xmlDoc = parser.parseFromString(text,"text/xml");
 */

var SVG2Chalk = (function(){

    var parser = new DOMParser();
    var scale = 0.02;
    var svg_width = 0;
    var svg_height = 0;

    function run()
    {
        var source = build();
        var source = btoa(source);
        var url = "https://rawgithub.com/DavidLanderosAlcala/airconsole-project1/5b51101ee262db836d827d80d256caaf7069b671/src/screen.html?loadLevel=" + source
        window.open(url, "", "width=1000,height=618");
    }

    function build()
    {
        var title = "Dummy title";
        var description = "Dummy description";
        var bodies = [];
        var tacks = [];
        var hints = [];
        var decorations = [];
        var setupFunc = "function(context){}";
        var updateFunc = "function(context){}";

    	var xmlDoc = document.querySelector("#svgcontent");
        var rects = xmlDoc.getElementsByTagName("rect");
        var ellipses = xmlDoc.getElementsByTagName("ellipse");
        var paths = xmlDoc.getElementsByTagName("path");

        var cb = xmlDoc.getElementById("canvas_background");
        svg_width = scaleIt(cb.getAttribute("width"));
        svg_height = scaleIt(cb.getAttribute("height"));

        for(var i = 2; i < rects.length; i++)
        {
            var shape =  createShapeFromRect(rects[i]);
            var category = shape.category;
            delete shape.category;
            switch(category)
            {
                case "bodies" : {
                    bodies.push(shape);
                    break;
                }
                case "tacks" : {
                    tacks.push(shape);
                    break;
                }
                case "hints" : {
                    tacks.push(shape);
                    break;
                }
                case "decoration" : {
                    tacks.push(shape);
                    break;
                }
            }
        }

        var source = "\r\nLevelSelector.getLevels().push({\r\n" + 
            "title : '" + title + "',\r\n" +
            "description : '" + description + "',\r\n" +
            "bodies : " + JSON.stringify(bodies) + ",\r\n" +
            "tacks : " + JSON.stringify(tacks) + ",\r\n" +
            "hints : " + JSON.stringify(hints) + ",\r\n" +
            "decorations : " + JSON.stringify(decorations) + ",\r\n" +
            "setup : " + setupFunc + ",\r\n" +
            "update : " + updateFunc + ",\r\n" +
        "});\r\n\r\n\r\n/*\r\n Generated from SVG: \r\n" + cb.toString() + "\r\n*/";
    	return source;
    }

    function createShapeFromRect(element)
    {
        var half_width = scaleIt(parseInt(element.getAttribute("width"))>>1);
        var half_height = scaleIt(parseInt(element.getAttribute("height"))>>1);
        var x = scaleIt(parseInt(element.getAttribute("x")));
        var y = scaleIt(parseInt(element.getAttribute("y")));


        x -= (svg_width>>1)
        y = (svg_height -  y);

        x += half_width;
        y -= half_height;

    	var obj = {
    		label : element.getAttribute("id"),
            type : "Polygon",
            position : [x, y],
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000000",
            isSensor : element.getAttribute("stroke") == "#ff0000",
            vertices : [
                [-half_width, -half_height],
                [-half_width, half_height],
                [half_width, half_height],
                [half_width, -half_height],
            ]
    	};

        return obj;
    }

    function createShapeFromPath(element)
    {
    	return {
    		label : element.getAttribute("id"),
            type : "Polygon",
            position : [element.getAttribute("cx"),element.getAttribute("cy")],
            radio : element.getAttribute("rx"),
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000000",
            isSensor : element.getAttribute("stroke") == "#ff0000",
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
            isStatic : element.getAttribute("fill") == "#000000",
            isSensor : element.getAttribute("stroke") == "#ff0000",
    	};
    }

    function scaleIt(value)
    {
        if(value.constructor == Array && value[0].constructor == Array)
        {
            for(var i = 0; i < value.length;  i++)
            {
                value[i][1] *= scale;
                value[i][0] *= -scale;
            }
        }
        else if(value.constructor == Array)
        {
            value[1] *= scale;
            value[0] *= -scale;
        }
        else
        {
            value *= scale;
        }
        return value;
    }

    return { build : build,
             run   : run };
})();
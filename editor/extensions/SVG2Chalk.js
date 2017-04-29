
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
        //var url = "file:///C:/Users/david.landeros/Documents/HTML5%20Projects/airconsole-project1/src/screen.html?loadLevel=" + source
        var url = "https://rawgithub.com/DavidLanderosAlcala/airconsole-project1/f246e55c52a24a2a5188a63cc2d36067c5f32664/src/screen.html?loadLevel=" + source
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
                case "bodies" : { bodies.push(shape); break; }
                case "tacks" : { tacks.push(shape); break; }
                case "hints" : { hints.push(shape); break; }
                case "decoration" : { decorations.push(shape); break; }
            }
        }

        for(var i = 0; i < ellipses.length; i++)
        {
            var shape =  createShapeFromEllipse(ellipses[i]);
            var category = shape.category;
            delete shape.category;
            switch(category)
            {
                case "bodies" : { bodies.push(shape); break; }
                case "tacks" : { tacks.push(shape); break; }
                case "hints" : { hints.push(shape); break; }
                case "decoration" : { decorations.push(shape); break; }
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


        var rotation = element.getAttribute("transform") || "";
        if(rotation.indexOf("rotate") == 0)
        {
            rotation = rotation.split(" ")[0].replace("rotate(","");
            rotation = -parseFloat(rotation) * Math.PI / 180;
        }
        else
        {
            rotation = 0.0;
        }


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

        for(var i = 0; i < obj.vertices.length; i++)
        {
            var x = obj.vertices[i][0];
            var y = obj.vertices[i][1];
            obj.vertices[i][0] = (x  * Math.cos(rotation)) - (y * Math.sin(rotation)); 
            obj.vertices[i][1] = (y * Math.cos(rotation)) + (x * Math.sin(rotation));
        }

        if(element.getAttribute("stroke-dasharray") != "none")
        {
            obj.category = "hints";
            obj.vertices.push(obj.vertices[0]);
            delete obj.isStatic;
            delete obj.isSensor;
            delete obj.type;
        }

        return obj;
    }

    function createShapeFromPath(element)
    {
    	return {
    		label : element.getAttribute("id"),
            type : "polygon",
            position : [element.getAttribute("cx"),element.getAttribute("cy")],
            radio : element.getAttribute("rx"),
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000000",
            isSensor : element.getAttribute("stroke") == "#ff0000",
    	};
    }

    function createShapeFromEllipse(element)
    {
        var radius = scaleIt(element.getAttribute("rx"));
        var x = scaleIt(parseInt(element.getAttribute("cx")));
        var y = scaleIt(parseInt(element.getAttribute("cy")));

        x -= (svg_width>>1)
        y = (svg_height -  y);

        var obj = {
            label : element.getAttribute("id"),
            type : "circle",
            position : [x, y],
            category : "bodies",
            isStatic : element.getAttribute("fill") == "#000000",
            isSensor : element.getAttribute("stroke") == "#ff0000",
            radio : radius,
        };

        return obj;
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
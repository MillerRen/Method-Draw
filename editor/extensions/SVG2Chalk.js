
/*
   parser = new DOMParser();
   xmlDoc = parser.parseFromString(text,"text/xml");
 */

var SVG2Chalk = (function(){

    var parser = new DOMParser();
    var scale = 0.01;
    var svg_width = 0;
    var svg_height = 0;
    var title = "Dummy title";
    var description = "Dummy description";
    var isEditorCreated = false;

    var setup_source_code = "function(context){\r\n    /* your code goes here */\r\n    context.gameover = false;\r\n}\r\n";
    var update_source_code = "function(context){\r\n    /* your code goes here */\r\n    return context.gameover;\r\n}\r\n";

    function setTitle(text)
    {
        title = text;
    }

    function setDescription(text)
    {
        description = text;
    }

    function run(width, height)
    {
        var source = build();
        var source = btoa(source);
        //var url = "file:///C:/Users/david.landeros/Documents/HTML5%20Projects/airconsole-project1/src/screen.html?loadLevel=" + source
        var url = "https://rawgithub.com/DavidLanderosAlcala/airconsole-project1/f246e55c52a24a2a5188a63cc2d36067c5f32664/src/screen.html?loadLevel=" + source
        window.open(url, "", "width=" + width + ",height=" + height);
    }

    function build()
    {
        var bodies = [];
        var tacks = [];
        var hints = [];
        var decorations = [];
        var setupFunc = setup_source_code;
        var updateFunc = update_source_code;

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
                case "decorations" : { decorations.push(shape); break; }
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
            category : element.getAttribute("category"),
            isStatic : element.getAttribute("static") == "true",
            isSensor : element.getAttribute("sensor") == "true",
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
        
        var opacity = element.getAttribute("opacity");
        if(obj.category == "hints" || obj.category == "decorations")
        {
            obj.vertices.push(obj.vertices[0]);
            obj.opacity = opacity;
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
            category : element.getAttribute("category"),
            isStatic : element.getAttribute("static") == "true",
            isSensor : element.getAttribute("sensor") == "true",
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

    function showCodeEditor()
    {
        if(isEditorCreated)
        {
            document.querySelector("#codeEditorContainer").style.zIndex = "2";
            return;
        }
        var container = document.createElement("div");
        container.id = "codeEditorContainer";
        container.style.position = "absolute";
        container.style.width = "1000px";
        container.style.height = "750px";
        container.style.left = "50%";
        container.style.top = "50%";
        container.style.margin = "-400px 0 0 -500px";
        container.style.backgroundColor = "silver";
        container.style.borderRadius = "10px";

        var setup_label = document.createElement("h4");
        setup_label.innerHTML = "Setup function:";
        setup_label.style.marginLeft = "3%";
        setup_label.style.color = "black";
        container.appendChild(setup_label);

        var setup_container = document.createElement("div");
        setup_container.id = "setup_container";
        setup_container.innerHTML = setup_source_code;
        setup_container.style.position = "relative";
        setup_container.style.width = "95%";
        setup_container.style.height = "40%";
        setup_container.style.left = "2.5%";
        //setup_container.style.top = "2.5%";
        setup_container.style.backgroundColor = "white";
        container.appendChild(setup_container);

        var update_label = document.createElement("h4");
        update_label.innerHTML = "update function:";
        update_label.style.marginLeft = "3%";
        update_label.style.color = "black";
        container.appendChild(update_label);

        var update_container = document.createElement("div");
        update_container.innerHTML = update_source_code;
        update_container.id = "update_container";
        update_container.style.position = "relative";
        update_container.style.width = "95%";
        update_container.style.height = "40%";
        update_container.style.left = "2.5%";
        //update_container.style.top = "5%";
        update_container.style.backgroundColor = "white";
        container.appendChild(update_container);

        var buttons_container = document.createElement("div");
        buttons_container.id = "buttons_container";
        buttons_container.style.textAlign = "right";
        buttons_container.style.position = "relative";
        buttons_container.style.width = "95%";
        //buttons_container.style.height = "2%";
        buttons_container.style.left = "2.5%";
        //buttons_container.style.top = "7.5%";
        //buttons_container.style.backgroundColor = "white";
        container.appendChild(buttons_container);

        var save = document.createElement("button");
        save.className = "ok";
        save.innerHTML = "OK";
        save.style.marginTop = "10px";
        save.style.borderRadius = "5px";
        save.addEventListener("click", function(){
            document.querySelector("#codeEditorContainer").style.zIndex = "-2";
        });
        buttons_container.appendChild(save);


        document.body.appendChild(container);

        var flask_setup = new CodeFlask;
        var flask_update = new CodeFlask;

        flask_setup.run('#setup_container', { language: 'javascript', lineNumbers: false });
        flask_update.run('#update_container', { language: 'javascript', lineNumbers: false });

        flask_setup.onUpdate(function(code) {
            setup_source_code = code;
        });

        flask_update.onUpdate(function(code) {
            update_source_code = code;
        });

        isEditorCreated = true;
    }

    return { build : build,
             run   : run,
             showCodeEditor : showCodeEditor };
})();
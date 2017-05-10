
/*
   parser = new DOMParser();
   xmlDoc = parser.parseFromString(text,"text/xml");
 */

var SVG2Chalk = (function(){

    var parser = new DOMParser();
    var scale = 0.01;
    var svg_width = 0;
    var svg_height = 0;
    var current_title = "Dummy title";
    var current_description = "Dummy description";
    var isEditorCreated = false;
    var isPropEditorCreated = false;
    var projectFileInput = null;
    var prefabFileInput = null;

    var setupEditor = null;
    var updateEditor = null;

    var setup_source_code = "\r\nfunction setup(context) {\r\n    /* your code goes here */\r\n    context.gameover = false;\r\n}\r\n";
    var update_source_code = "\r\nfunction update(context) {\r\n    /* your code goes here */\r\n    return context.gameover;\r\n}\r\n";

    function run(width, height)
    {
        var source = build();
        var source = btoa(source);
        var url = "https://rawgithub.com/DavidLanderosAlcala/airconsole-project1/engine-migration/src/screen.html#" + source
        window.open(url, "", "width=" + width + ",height=" + height);
    }

    function build()
    {
        var bodies = [];
        var tacks = [];
        var hints = [];
        var decorations = [];
        var setupFunc = setup_source_code.replace(" setup(", " (").replace(" setup (", " (");
        var updateFunc = update_source_code.replace(" update(", " (").replace(" setup (", " (");

    	var xmlDoc = getCurrentDrawingElem(); 
        var rects = xmlDoc.getElementsByTagName("rect");
        var ellipses = xmlDoc.getElementsByTagName("ellipse");
        var paths = xmlDoc.getElementsByTagName("path");

        svg_width = scaleIt(2000);
        svg_height = scaleIt(1236);

        for(var i = 0; i < rects.length; i++)
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
                case "decorations" : { decorations.push(shape); break; }
            }
        }

        for(var i = 0; i < paths.length; i++)
        {
            var shape =  createShapeFromPath(paths[i]);
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


        //var serializer = new XMLSerializer();
        var str = xmlDoc.innerHTML;//serializer.serializeToString(xmlDoc.innerHTML);

        var source = "\r\nLevelSelector.getLevels().push({\r\n" + 
            "title : '" + current_title + "',\r\n" +
            "description : '" + current_description + "',\r\n" +
            "bodies : " + JSON.stringify(bodies) + ",\r\n" +
            "tacks : " + JSON.stringify(tacks) + ",\r\n" +
            "hints : " + JSON.stringify(hints) + ",\r\n" +
            "decorations : " + JSON.stringify(decorations) + ",\r\n" +
            "setup : " + setupFunc + ",\r\n" +
            "update : " + updateFunc + ",\r\n" +
        "});\r\n\r\n\r\n/*\r\n Generated from SVG: \r\n" + str + "\r\n*/";
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
    		label : element.getAttribute("label") || "untitled-shape",
            type : "polygon",
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

    function insert(array, item)
    {
        for(var i = 0; i < array.length; i++)
        {
            if(array[i][0] == item[0] && array[i][1] == item[1])
            {
                return;
            }
        }
        array.push(item);
    }

    function replaceAll(str, find, replace)
    {
        var copy = str.split(find);
        return copy.join(replace);
    }

    function parseVertices(svgDAttribute)
    {
        var poly = [];
        var x, y;

        svgDAttribute = svgDAttribute.toLowerCase();
        svgDAttribute = replaceAll(svgDAttribute, "m"," ");
        svgDAttribute = replaceAll(svgDAttribute, "l"," ");
        svgDAttribute = replaceAll(svgDAttribute, "c"," ");
        svgDAttribute = replaceAll(svgDAttribute, "z"," ");
        svgDAttribute = replaceAll(svgDAttribute, ","," ");

        svgDAttribute = svgDAttribute.split(" ");
        for(var i = svgDAttribute.length-1; i >= 0; i--)
        {
            if( svgDAttribute[i].length == 0)
            {
                svgDAttribute.splice(i,1);
            }
        }

        for(var i = 0; i < svgDAttribute.length; i += 2)
        {
            x = scaleIt(svgDAttribute[i]);
            y = scaleIt(svgDAttribute[i + 1]);
            insert(poly, [ x , y ]);
        }

        console.log(poly);
        return poly;
    }

    function createShapeFromPath(element)
    {

        var centroid = [0,0];
        var rotation = element.getAttribute("transform") || "";
        if(rotation.indexOf("rotate") == 0)
        {

            rotation = rotation.replace("rotate(","");
            rotation = rotation.replace(","," ");
            var aux = rotation.split(" ");
            rotation = aux[0];
            centroid[0] = scaleIt(parseFloat(aux[1]));
            centroid[1] = scaleIt(parseFloat(aux[2]));
            rotation = parseFloat(rotation) * Math.PI / 180;
        }
        else
        {
            rotation = 0.0;
        }


        //x -= (svg_width>>1)
        //y = (svg_height -  y);


        var obj = {
            label : element.getAttribute("label") || "untitled-shape",
            type : "polygon",
            position : [0, 0],
            category : element.getAttribute("category") || "bodies",
            isStatic : element.getAttribute("static") == "true",
            isSensor : element.getAttribute("sensor") == "true",
            vertices : parseVertices(element.getAttribute("d")),
        };

        for(var i = 0; i < obj.vertices.length; i++)
        {
            var x = obj.vertices[i][0] - centroid[0];
            var y = obj.vertices[i][1] - centroid[1];

            obj.vertices[i][0] = (x  * Math.cos(rotation)) - (y * Math.sin(rotation)); 
            obj.vertices[i][1] = (y * Math.cos(rotation)) + (x * Math.sin(rotation));

            obj.vertices[i][0] += centroid[0];
            obj.vertices[i][1] += centroid[1];

            obj.vertices[i][0] -= (svg_width>>1);
            obj.vertices[i][1] = (svg_height - obj.vertices[i][1]);
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

    function createShapeFromEllipse(element)
    {
        var radius = scaleIt(element.getAttribute("rx"));
        var x = scaleIt(parseInt(element.getAttribute("cx")));
        var y = scaleIt(parseInt(element.getAttribute("cy")));

        x -= (svg_width>>1)
        y = (svg_height -  y);

        var obj = {
            label : element.getAttribute("label") || "untitled-shape",
            type : "circle",
            position : [x, y],
            category : element.getAttribute("category"),
            isStatic : element.getAttribute("static") == "true",
            isSensor : element.getAttribute("sensor") == "true",
            radio : radius,
        };

        if(obj.category == "tacks")
        {
            delete obj.isSensor;
            delete obj.isStatic;
            delete obj.radio;
            delete obj.type;
            obj.bodyA = element.getAttribute("bodya");
            obj.bodyB = element.getAttribute("bodyb");
            if(obj.bodyB == "")
            {
                obj.bodyB = "null";
            }
        }

        return obj;
    }

    function scaleIt(value)
    {
        if(value.constructor == Array && value[0].constructor == Array)
        {
            for(var i = 0; i < value.length;  i++)
            {
                value[i][1] *= scale;
                value[i][0] *= scale;
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
            setupEditor.setValue(setup_source_code);
            updateEditor.setValue(update_source_code);
            document.querySelector("#codeEditorContainer").style.zIndex = "2";
            return;
        }
        var container = document.createElement("div");
        container.id = "codeEditorContainer";
        container.style.border = "3px solid white";
        container.style.position = "absolute";
        container.style.width = "90%";
        container.style.height = "90%";
        container.style.left = "5%";
        container.style.top = "5%";
        container.style.backgroundColor = "#2F2F2C";
        container.style.borderRadius = "10px";
        container.style.zIndex = 10;

        var setup_label = document.createElement("label");
        setup_label.style.lineHeight= "40px";
        setup_label.innerHTML = "Level behavior:";
        setup_label.style.marginLeft = "3%";
        setup_label.style.color = "white";
        container.appendChild(setup_label);

        var setup_container = document.createElement("div");
        setup_container.id = "setup_container";
        setup_container.innerHTML = setup_source_code;
        setup_container.style.position = "relative";
        setup_container.style.display = "inline-block";
        setup_container.style.width = "45%";
        setup_container.style.height = "86%";
        setup_container.style.left = "2.5%";
        setup_container.style.marginRight = "5%";
        setup_container.style.fontSize = "18px";
        setup_container.style.backgroundColor = "#141414;";
        container.appendChild(setup_container);

        var update_label = document.createElement("label");
        update_label.style.lineHeight= "40px";
        update_label.innerHTML = "Update function :";
        update_label.style.marginLeft = "3%";
        update_label.style.color = "white";
        //container.appendChild(update_label);

        var update_container = document.createElement("div");
        update_container.innerHTML = update_source_code;
        update_container.id = "update_container";
        update_container.style.display = "inline-block";
        update_container.style.position = "relative";
        update_container.style.width = "45%";
        update_container.style.height = "86%";
        update_container.style.left = "2.5%";
        update_container.style.fontSize = "18px";
        update_container.style.backgroundColor = "#141414;";
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


        var cancel = document.createElement("button");
        cancel.className = "cancel";
        cancel.innerHTML = "Cancel";
        cancel.style.float = "left";
        cancel.style.marginTop = "10px";
        cancel.style.borderRadius = "5px";
        cancel.addEventListener("click", function(){
            document.querySelector("#codeEditorContainer").style.zIndex = "-2";
        });
        buttons_container.appendChild(cancel);

        var save = document.createElement("button");
        save.className = "ok";
        save.innerHTML = "Apply changes";
        save.style.marginTop = "10px";
        save.style.borderRadius = "5px";
        save.addEventListener("click", function(){
            document.querySelector("#codeEditorContainer").style.zIndex = "-2";
            setup_source_code = setupEditor.getValue();
            update_source_code = updateEditor.getValue();
        });
        buttons_container.appendChild(save);


        document.body.appendChild(container);

        setupEditor = ace.edit("setup_container");
        setupEditor.setTheme("ace/theme/monokai");
        setupEditor.getSession().setMode("ace/mode/javascript");

        updateEditor = ace.edit("update_container");
        updateEditor.setTheme("ace/theme/monokai");
        updateEditor.getSession().setMode("ace/mode/javascript");

        $('#setup_container').on('mousewheel', function(e, delta, deltaX, deltaY){
          if (e.altKey || e.ctrlKey) {
            e.preventDefault();
            var fontSize = parseInt(document.querySelector("#setup_container").style.fontSize.replace("px",""));
            document.querySelector("#setup_container").style.fontSize = (fontSize + deltaY) + "px";
          }
        });

        $('#update_container').on('mousewheel', function(e, delta, deltaX, deltaY){
          if (e.altKey || e.ctrlKey) {
            e.preventDefault();
            var fontSize = parseInt(document.querySelector("#update_container").style.fontSize.replace("px",""));
            document.querySelector("#update_container").style.fontSize = (fontSize + deltaY) + "px";
          }
        });

        isEditorCreated = true;
    }

    function showProperties()
    {
        if(isPropEditorCreated)
        {
            document.querySelector("#title_input").value = current_title;
            document.querySelector("#description_input").value = current_description;
            document.querySelector("#propEditorContainer").style.zIndex = "2";
            return;
        }
        var container = document.createElement("div");
        container.id = "propEditorContainer";
        container.style.border = "3px solid white";
        container.style.position = "absolute";
        container.style.width = "500px";
        container.style.height = "230px";
        container.style.left = "50%";
        container.style.top = "50%";
        container.style.margin = "-150px 0 0 -250px";
        container.style.backgroundColor = "#2F2F2C";
        container.style.borderRadius = "10px";  

        var title = document.createElement("label");
        title.style.lineHeight= "40px";
        title.innerHTML = "Level title :";
        title.style.marginLeft = "3%";
        title.style.color = "white";
        container.appendChild(title);

        var title_input = document.createElement("input");
        title_input.id = "title_input";
        title_input.value = current_title;
        title_input.style.marginLeft = "3%";
        title_input.style.width = "94%";
        title_input.style.lineHeight = "30px";
        container.appendChild(title_input);

        var description = document.createElement("label");
        description.style.lineHeight= "40px";
        description.innerHTML = "Level description :";
        description.style.marginLeft = "2%";
        description.style.color = "white";
        container.appendChild(description);

        var description_input = document.createElement("input");
        description_input.id = "description_input";
        description_input.style.marginLeft = "3%";
        description_input.value = current_description;
        description_input.style.width = "94%";
        description_input.style.lineHeight = "30px";
        container.appendChild(description_input);
        description_input.style.marginBottom = "3%";

        var cancel = document.createElement("button");
        cancel.style.marginLeft = "20px";
        cancel.className = "cancel";
        cancel.innerHTML = "Cancel";
        cancel.style.marginTop = "10px";
        cancel.style.borderRadius = "5px";
        cancel.addEventListener("click", function(){
            document.querySelector("#propEditorContainer").style.zIndex = "-3";
        });
        container.appendChild(cancel);

        var save = document.createElement("button");
        save.className = "ok";
        save.style.float = "right";
        save.style.marginRight = "20px";
        save.innerHTML = "Apply changes";
        save.style.marginTop = "10px";
        save.style.borderRadius = "5px";
        save.addEventListener("click", function(){
            document.querySelector("#propEditorContainer").style.zIndex = "-3";
            current_title = document.querySelector("#title_input").value;
            current_description = document.querySelector("#description_input").value;
        });
        container.appendChild(save);

        document.body.appendChild(container);
        isPropEditorCreated = true;
    }

    function saveProject()
    {
        var project = {
            current_title : current_title,
            current_description : current_description,
            setup_source_code : setup_source_code,
            update_source_code : update_source_code,
            svg : getCurrentDrawingElem().innerHTML,
        };

        saveData(project, current_title.replace(" ","-") + ".chalkproj");
    }

    function initProjectFileInput()
    {
        projectFileInput = document.createElement("input");
        projectFileInput.type = "file";
        projectFileInput.onchange = function(evt)
        {
            var reader = new FileReader();
            reader.onload = function () {
                onProjectFileOpened(reader.result);
            };
            reader.readAsText(projectFileInput.files[0]);
        };
    }

    function initPrefabFileInput()
    {
        prefabFileInput = document.createElement("input");
        prefabFileInput.type = "file";
        prefabFileInput.onchange = function(evt)
        {
            var reader = new FileReader();
            reader.onload = function () {
                onPrefabFileOpened(reader.result);
            };
            reader.readAsText(prefabFileInput.files[0]);
        };
    }    

    function onProjectFileOpened(content)
    {
        var proj = JSON.parse(content);
        current_title = proj.current_title;
        current_description = proj.current_description;
        setup_source_code = proj.setup_source_code;
        update_source_code = proj.update_source_code;
        getCurrentDrawingElem().innerHTML = proj.svg;
    }
    
    function onPrefabFileOpened(content)
    {
        var prefab = JSON.parse(content);
        getCurrentDrawingElem().innerHTML += prefab.svg;
    }

    function openProject()
    {
        if(projectFileInput == null)
        {
            initProjectFileInput();
        }
        projectFileInput.click();
    }

    function importPrefab()
    {
        if(prefabFileInput == null)
        {
            initPrefabFileInput();
        }
        prefabFileInput.click();
    }

    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var json = JSON.stringify(data),
                blob = new Blob([json], {type: "octet/stream"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    function getCurrentTitle()
    {
        return current_title;
    }

    function exportPrefab()
    {
        var svg = getCurrentDrawingElem();
        svg.removeChild(svg.getElementsByTagName("title")[0]);
        var prefab = { svg : svg.innerHTML };
        var name = prompt("Nombre del prefab", "untitled-prefab");
        saveData(prefab, name + ".prefab");
    }

    function getCurrentDrawingElem()
    {
        var svg = document.querySelector("#svgcontent");
        var gs = svg.getElementsByTagName("g");
        return gs[gs.length-1];
    }

    return { build : build,
             run   : run,
             showCodeEditor : showCodeEditor,
             showProperties : showProperties,
             saveProject : saveProject,
             openProject : openProject,
             getCurrentTitle : getCurrentTitle,
             exportPrefab : exportPrefab,
             importPrefab : importPrefab,
             importLevel : function(){
                getCurrentDrawingElem().innerHTML = '<title style="pointer-events:inherit">Layer 1</title><rect fill="url(#diagonal-stripe-1)" stroke="#fff" stroke-width="5" style="pointer-events:inherit" x="122.49969188866038" y="1035.166623227708" width="1755.0006355362018" height="198.33340515556313" id="svg_1" stroke-dasharray="none" static="true" category="bodies" sensor="false" opacity="1.0"></rect><rect fill="url(#diagonal-stripe-1)" stroke="#fff" stroke-width="5" x="255.8330519701965" y="569.6666733646753" width="695.0002516795785" height="68.33335807880746" id="svg_2" stroke-dasharray="none" static="true" category="bodies" sensor="false" opacity="1.0" transform="rotate(33.71042251586914 603.3331909179689,603.8333740234375) "></rect><ellipse fill="none" stroke="#fff" stroke-width="5" stroke-opacity="null" fill-opacity="null" style="pointer-events:inherit" cx="457.499778113753" cy="207.99987695847946" id="svg_3" rx="41.66668175537046" ry="41.666681755370405" stroke-dasharray="none" static="false" category="bodies" sensor="false" opacity="1.0"></ellipse><path fill="none" stroke="#fff" stroke-width="5" stroke-opacity="null" fill-opacity="null" d="M 1350.8334349488946 449.66663113962784 C 1349.16676767868 449.66663113962784 1245.8333969253613 267.9998986862129 1245.0004044581922 266.66675329760477 C 1245.8333969253613 267.9998986862129 1435.8334657298503 192.99987152654612 1445.8334693511392 192.99987152654612 C 1455.8334729724281 192.99987152654612 1877.5002923367765 267.9998986862129 1876.6672763318936 266.66675329760477 C 1877.5002923367765 267.9998986862129 1907.5003032006432 588.0000145674576 1906.6672860778742 586.6668572547305 C 1907.5003032006432 588.0000145674576 1369.1667749212575 691.3333853207762 1374.166776731902 691.3333853207762 C 1379.1667785425466 691.3333853207762 1557.500176455532 603.0000199993909 1556.667172374768 601.6668621277207 C 1557.500176455532 603.0000199993909 1645.833541776917 416.3332857353315 1645.0005344045994 415.00013481939743 C 1645.833541776917 416.3332857353315 1530.8335001320947 327.99992041394626 1530.0004970450075 326.66677278956587 C 1530.8335001320947 327.99992041394626 1377.5001112723317 339.66659130544997 1376.6671138988847 338.33344324633606 C 1377.5001112723317 339.66659130544997 1352.5001022191093 449.66663113962784 1350.8334349488946 449.66663113962784 z" id="svg_4" stroke-dasharray="10,10" static="false" category="hints" sensor="false" opacity="0.34"></path>';
             } };
})();
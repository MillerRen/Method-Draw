
/*
   parser = new DOMParser();
   xmlDoc = parser.parseFromString(text,"text/xml");
 */

var SVG2Chalk = (function(){

    var isColaborative = false;
    var lockDrawingUpdate = false;
    var lastContent = "";
    var syncLoopInterval = null;
    var allowCommits = false;

    var parser = new DOMParser();
    var scale = 0.01;
    var svg_width = 0;
    var svg_height = 0;
    var current_title = "Dummy title";
    var current_description = "Dummy description 1";
    var current_star2_description = "Dummy description 2";
    var current_star3_description = "Dummy description 3";
    var isEditorCreated = false;
    var isPropEditorCreated = false;
    var projectFileInput = null;
    var prefabFileInput = null;

    var setupEditor = null;
    var updateEditor = null;

    var setup_source_code = "\r\nfunction setup(ctx) {\r\n    /* your code goes here */\r\n    ctx.statuscode = 0;\r\n}\r\n";
    var update_source_code = "\r\nfunction update(ctx) {\r\n    /* your code goes here */\r\n    return ctx.statuscode;\r\n}\r\n";
    var show_timer = false;

    function init()
    {
        TogetherJS.on("ready", function () {
            isColaborative = true;
            //document.querySelector("#svgcontent").addEventListener("DOMSubtreeModified", onDrawingModified);
            syncLoopInterval = setInterval(syncLoop, 1000);
            document.querySelector("#togetherjs-dock").style.backgroundColor = "#4D4E53";
            document.querySelector("#togetherjs-share > header").style.backgroundColor = "#4D4E53";
            document.querySelector("#togetherjs-confirm-end > header").style.backgroundColor = "#4D4E53";
            document.querySelector("#togetherjs-chat > header").style.backgroundColor = "#4D4E53";
            document.querySelector("#togetherjs-chat > section.togetherjs-subtitle").style.backgroundColor = "#4D4E53";
        });

        TogetherJS.on("close", function () {
            isColaborative = false;
            //document.querySelector("#svgcontent").removeEventListener("DOMSubtreeModified", onDrawingModified);
            clearInterval(syncLoopInterval);
        });
        
        TogetherJS.hub.on("modifyDrawing", function (obj) {
            lockDrawingUpdate = true;
            getCurrentDrawingElem().innerHTML = obj.svg;
            allowCommits = true;
        });

        TogetherJS.hub.on("modifyProperties", function (obj) {
            current_title = obj.current_title;
            current_description = obj.current_description;
            current_star2_description = obj.current_star2_description;
            current_star3_description = obj.current_star3_description;
            show_timer = obj.show_timer;
        });

        TogetherJS.hub.on("modifyCode", function (obj) {
            setup_source_code = obj.setup_source_code;
            update_source_code = obj.update_source_code;
        });

        /* When a new guest arrives */
        TogetherJS.hub.on('togetherjs.hello', function () {

                /* It sends the current drawing */
                TogetherJS.send({
                   type : "modifyDrawing", 
                   svg  : getCurrentDrawingElem().innerHTML,
               });

                /* It sends the current properties */
                TogetherJS.send({
                    type: "modifyProperties", 
                    current_title : current_title,
                    current_description : current_description,
                    current_star2_description : current_star2_description,
                    current_star3_description : current_star3_description,
                    show_timer                : show_timer,
                });                

                /* It sends the current level code */
                TogetherJS.send({
                    type: "modifyCode", 
                    setup_source_code : setup_source_code,
                    update_source_code : update_source_code,
                });                
        });


    }

    init();

    function syncLoop()
    {
        if(lastContent != getCurrentDrawingElem().innerHTML)
        {
            if(!lockDrawingUpdate && allowCommits)
            {
               TogetherJS.send({
                   type : "modifyDrawing", 
                   svg  : getCurrentDrawingElem().innerHTML,
               });
            }
            lockDrawingUpdate = false;
            lastContent = getCurrentDrawingElem().innerHTML;
            console.log("cambio commiteado!");
        }
    }

    function run(width, height)
    {
        var source = build();
        var source = btoa(source);
        //var url = "file:///C:/Users/david.landeros/Documents/HTML5%20Projects/airconsole-project1/src/screen.html#" + source;
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

        for(var i = rects.length -1; i >= 0; i--)
        {
            svgCanvas.convertToPath(rects[i]);
        }

        var ellipses = xmlDoc.getElementsByTagName("ellipse");
        var paths = xmlDoc.getElementsByTagName("path");

        svg_width = scaleIt(2000);
        svg_height = scaleIt(1236);

        //for(var i = 0; i < rects.length; i++)
        //{
        //    var shape =  createShapeFromRect(rects[i]);
        //    var category = shape.category;
        //    delete shape.category;
        //    switch(category)
        //    {
        //        case "bodies" : { bodies.push(shape); break; }
        //        case "tacks" : { tacks.push(shape); break; }
        //        case "hints" : { hints.push(shape); break; }
        //        case "decorations" : { decorations.push(shape); break; }
        //    }
        //}

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
        var descriptions = [current_description, current_star2_description, current_star3_description];
        var source = "\r\nLevelManager.getLevels().push({\r\n" + 
            "title : '" + current_title + "',\r\n" +
            "descriptions : " + JSON.stringify(descriptions) + ",\r\n" +
            "show_timer : " + (show_timer ? "true" : "false") + ",\r\n" +
            "bodies : " + JSON.stringify(bodies) + ",\r\n" +
            "tacks : " + JSON.stringify(tacks) + ",\r\n" +
            "hints : " + JSON.stringify(hints) + ",\r\n" +
            "decorations : " + JSON.stringify(decorations) + ",\r\n" +
            "setup : " + setupFunc + ",\r\n" +
            "update : " + updateFunc + ",\r\n" +
        "});\r\n\r\n";
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
            respawn : element.getAttribute("respawn") == "true",
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
            if(element.getAttribute("d").indexOf("Z") > 0 || element.getAttribute("d").indexOf("z") > 0)
                obj.vertices.push(obj.vertices[0]);
            obj.line = element.getAttribute("hintline");
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
            respawn : element.getAttribute("respawn") == "true",
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
            if(element.getAttribute("d").indexOf("Z") > 0 || element.getAttribute("d").indexOf("z") > 0)
            {
                obj.vertices.push(obj.vertices[0]);
            }
            obj.line = element.getAttribute("hintline");
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
            respawn : element.getAttribute("respawn") == "true",
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

            if(isColaborative)
            {
                TogetherJS.send({
                    type: "modifyCode", 
                    setup_source_code : setup_source_code,
                    update_source_code : update_source_code,
                });
            }

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
            document.querySelector("#star2_description_input").value = current_star2_description;
            document.querySelector("#star3_description_input").value = current_star3_description;
            document.querySelector("#timer_input").checked = show_timer;
            document.querySelector("#propEditorContainer").style.zIndex = "2";
            return;
        }
        var container = document.createElement("div");
        container.id = "propEditorContainer";
        container.style.border = "3px solid white";
        container.style.position = "absolute";
        container.style.width = "500px";
        container.style.height = "450px";
        container.style.left = "50%";
        container.style.top = "50%";
        container.style.margin = "-225px 0 0 -250px";
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
        description.innerHTML = "1st Star description :";
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

        var star2_description = document.createElement("label");
        star2_description.style.lineHeight= "40px";
        star2_description.innerHTML = "2nd Star description :";
        star2_description.style.marginLeft = "2%";
        star2_description.style.color = "white";
        container.appendChild(star2_description);

        var star2_description_input = document.createElement("input");
        star2_description_input.id = "star2_description_input";
        star2_description_input.style.marginLeft = "3%";
        star2_description_input.value = current_star2_description;
        star2_description_input.style.width = "94%";
        star2_description_input.style.lineHeight = "30px";
        container.appendChild(star2_description_input);
        star2_description_input.style.marginBottom = "3%";

        var star3_description = document.createElement("label");
        star3_description.style.lineHeight= "40px";
        star3_description.innerHTML = "3th Star description :";
        star3_description.style.marginLeft = "2%";
        star3_description.style.color = "white";
        container.appendChild(star3_description);

        var star3_description_input = document.createElement("input");
        star3_description_input.id = "star3_description_input";
        star3_description_input.style.marginLeft = "3%";
        star3_description_input.value = current_star3_description;
        star3_description_input.style.width = "94%";
        star3_description_input.style.lineHeight = "30px";
        container.appendChild(star3_description_input);
        star3_description_input.style.marginBottom = "3%";

        var timer_input = document.createElement("input");
        timer_input.type ="checkbox";
        timer_input.id = "timer_input";
        timer_input.style.marginLeft = "3%";
        timer_input.checked = show_timer;
        container.appendChild(timer_input);

        var timer = document.createElement("label");
        timer.style.lineHeight= "40px";
        timer.innerHTML = "Timer visible";
        timer.style.marginLeft = "2%";
        timer.style.color = "white";
        timer.style.display = "inline-block";
        container.appendChild(timer);
        container.appendChild(document.createElement("br"));

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
            current_star2_description = document.querySelector("#star2_description_input").value;
            current_star3_description = document.querySelector("#star3_description_input").value;
            show_timer = document.querySelector("#timer_input").checked;
            if(isColaborative)
            {
                TogetherJS.send({
                    type: "modifyProperties", 
                    current_title : current_title,
                    current_description : current_description,
                    current_star2_description : current_star2_description,
                    current_star3_description : current_star3_description,
                    show_timer                : show_timer,
                });
            }
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
            current_star2_description : current_star2_description,
            current_star3_description : current_star3_description,
            show_timer : show_timer,
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
        current_star2_description = proj.current_star2_description;
        current_star3_description = proj.current_star3_description;
        show_timer = proj.show_timer;
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

    function setAllowCommits(value)
    {
        allowCommits = value;
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
             setAllowCommits : setAllowCommits };
})();
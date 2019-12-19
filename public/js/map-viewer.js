(function() {
    const s           = Snap("#drawsvg");
    let theorems      = [];
    let definitions   = [];
    let lines         = [];
    let vertices      = []; // for positioning
    let conObjs       = [];
    let g = s.g();
    let zoom = 0;
    let isZooming       = false;
    let m               = Snap.matrix();
    let svgrect = document.getElementById("drawsvg").getBoundingClientRect();
    let svgx = svgrect.left;
    let svgy = svgrect.top;
    let toggle = true;

    function loadBlocksFromAPI(type) {
        return new Promise( resolve => {
            // get svg elements form API
            fetch('/api/'+type+'/')
            .then((res) => 
                res.json()
            )
            .then((json) => {
                resolve(json)
            })
        }); 
    };

    document.getElementById("pos").addEventListener("click",loadPosFromAPI);

    function loadPosFromAPI() {
        let pr = new Promise( resolve => {
            // get svg elements form API
            fetch('/api/positions/')
            .then((res) => 
                res.json()
            )
            .then((json) => {
                resolve(json)
            })
        });

        pr.then( (json) => {
            theorems.forEach(th => {
                json.forEach(el => {
                    if(th._id == el.id)
                        th.moveBy(el.x-th.x, el.y-th.y);
                });
            });
            definitions.forEach(def => {
                json.forEach(el => {
                    if(def._id == el.id)
                        def.moveBy(el.x-def.x, el.y-def.y);
                });
            });
            drawConnections();
        });
    };

    function avoidOverlapping(elements) { // TODO: implement WebCola vpsc.ts 
        if(!elements)
            elements = definitions.concat(theorems);

        elements.forEach(el => {
            definitions.forEach(def => {
                pushAway(el,def);
            });
            theorems.forEach(th => {
                pushAway(el,th);
            });
        });
        drawConnections();
    }

    function pushAway(a,b) {
        if(a._id == b._id)
            return;
        
        if(a.x < b.x && a.y < b.y) { // a to the top left of b
            let dx = b.x - (a.x + a.width); //left
            let dy = b.y - (a.y + a.height); //top
            if(dx < 0 && dy < 0) {
                a.moveBy(dx/4,dy/4);
                b.moveBy(-dx/3,-dy/3);
            }
        } else if(a.x > b.x && a.y < b.y) { // a to the top right of b
            let dx = a.x - (b.x + b.width); //right
            let dy = b.y - (a.y + a.height); //top
            if(dx < 0 && dy < 0) {
                a.moveBy(-dx/4,dy/4);
                b.moveBy(dx/3,-dy/3);
            }
        } else if(a.x < b.x && a.y > b.y) { // a to the bottom left of b
            let dx = b.x - (a.x + a.width); //left
            let dy = a.y - (b.y + b.height); //bottom
            if(dx < 0 && dy < 0) {
                a.moveBy(dx/4,-dy/4);
                b.moveBy(-dx/3,dy/3);
            }
        } else { // a to the bottom right of b
            let dx = a.x - (b.x + b.width); //right
            let dy = a.y - (b.y + b.height); //bottom
            if(dx < 0 && dy < 0) {
                a.moveBy(-dx/4,-dy/4);
                b.moveBy(dx/3,dy/3);
            }
        }
    }

    function drawBlocks(jsontheorems, jsondefs) {
        jsontheorems.forEach(json => {
            let the = new Theorem(s, json);
            the.draw();
            the.addToGroup(g);
            the.moveBy(json.x,json.y);

            theorems.push(the);  
        });
        x = 0;
        jsondefs.forEach(json => {
            let def = new Definition(s, json);
            def.draw();
            def.addToGroup(g);
            def.moveBy(json.x,json.y);

            definitions.push(def);      
        });
    }

    function detectConnectedObjects() {
        conObjs = [];
        theorems.forEach(th => {
            th.con = [];
            th.blocks.forEach(bl => {
                if(bl.con)
                    th.con = th.con.concat(bl.con);
            });
            if(th.con.length)
                conObjs.push(th);
        });
        definitions.forEach(def => {
            if(def.block.con.length) {
                def.con = def.block.con;
                conObjs.push(def);
            }
        });
    }

    function drawConnections() {
        for (; lines.length > 0; lines.pop().remove());
        conObjs.forEach(v => {
            v.con.forEach(conID => {
                drawConnection(v,findByID(conID));
            });
        });
        g.add(lines);
    }

    function drawConnection(src,trg) {
        let dist 	= Math.sqrt(Math.pow(src.x-trg.x,2) + Math.pow(src.y-trg.y,2));
		let dx 		= trg.x-src.x;
		let dy		= trg.y-src.y;
		let normdx 	= (dx)/dist;
		let normdy 	= (dy)/dist;
		let orth  = {
			x: -normdy,
			y: normdx
		};
        line = {};
        
        line 	= s.path(
            "M"+src.x+" "+src.y+
            " L"+trg.x+" "+trg.y
        );

        line.attr({
            stroke: "rgba(0,0,0,0.3)",
			strokeWidth: 8
        });
        lines.push(line);
    }

    function findByID(id) {
        for (let i = 0; i < definitions.length; i++)
            if (definitions[i]._id == id)
                return definitions[i];
        for (let i = 0; i < theorems.length; i++)
            if (theorems[i]._id == id)
                return theorems[i];
        console.log("no return "+id);
    }

    function makeBlocksDraggable() {
        let prevdx = 0,
            prevdy = 0;
        s.drag((dx, dy, x, y, event) => {
            let scale = 1/m.a;
            m.translate(scale*(dx-prevdx), scale*(dy-prevdy));
            prevdx = dx;
            prevdy = dy;
            g.transform(m);
        }, () => { // start of drag
            prevdx = 0;
            prevdy = 0;
        }, () => { // after each drag
            
        });
    }
    
    function zoomlock() {
        let time = 90;
        let timer = setInterval(() => {
            if(time > 0)
                document.getElementById("time").textContent = (time-=10);
            else {
                clearInterval(timer);
                isZooming = false;
            }
        }, 10);
    }

    // zoom
    document.addEventListener("wheel", (e) => {
        if(!isZooming) {
            isZooming = true;
            zoomlock();
            
            handleZoom(e);
            
            // IE Edge bug workaround (redraw):
            s.node.setAttribute("style", toggle ? "color: red" : "");
            toggle = !toggle;
        }
    });
    
    
    function handleZoom(e) {
        let zIn, zOut;

        if(e.deltaY > 0) { //zoom out
            zoom--;
            matrixScaleAtXY(e.x, e.y, 0.8);
            zOut = true;
        }
            
        if(e.deltaY < 0) { //zoom in
            if(zoom == 0) return;
            zoom++;
            matrixScaleAtXY(e.x, e.y, 1.25);
            zIn = true;
        }
        // apply matrix transformation
        g.transform(m);

        // different zoom levels
        // if(zoom == 0 && zIn) {
        //     theorems.forEach(th => {
        //         th.expand(); // TODO: expand only on click
        //     });
        // }
        if(zoom == -2 && zIn) {
            theorems.forEach(th => {
                th.collapseToCore();
            });
            definitions.forEach(def => {
                def.expand();
            });
            avoidOverlapping();
        }
        if(zoom == -3 && zOut) {
            theorems.forEach(th => {
                th.collapseToTitle();
            });
            definitions.forEach(def => {
                def.collapseToTitle();
            });
        }

    }

    function matrixScaleAtXY(absZoomX, absZoomY, scaleFactor) {
        // center of zoom
        let cx = absZoomX-svgx;
        let cy = absZoomY-svgy;
        
        let minv = m.invert();
        m.scale(scaleFactor, scaleFactor, minv.x(cx,cy), minv.y(cx,cy));
    }

    (async function init() {
        const jsontheorems = await loadBlocksFromAPI("the");
        const jsondefs     = await loadBlocksFromAPI("def");
        drawBlocks(jsontheorems, jsondefs);
        await MathJax.typesetPromise();

        // refresh blocks height after MathJax typeset
        theorems.forEach(th => {
            th.refreshHeight();
        });
        definitions.forEach(def => {
            def.refreshHeight();
        });


        makeBlocksDraggable();

        // save texts for collapse/expand during zooming
        theorems.forEach(th => {
            th.saveTextWithMathJax();
        });
        definitions.forEach(def => {
            def.saveTextWithMathJax();
        });

        Theorem.prototype.avoidOverlapping = avoidOverlapping;

        //initial collapse
        theorems.forEach(th => {
            th.collapseToCore();
        });

        detectConnectedObjects();
        drawConnections();
        // the1.onSpecialLetter('@', (p) => showTitles((title) => p.innerHTML = p.innerHTML+title));
        
    })();


})();



(function() {
    const s           = Snap("#drawsvg");
    let theorems      = [];
    let definitions   = [];
    let g = s.g();
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

    function drawBlocks(jsontheorems, jsondefs) {
        let x = 0;
        jsontheorems.forEach(json => {
            let the = new Theorem(s, json);
            the.draw();
            the.addToGroup(g);
            the.move(x,0);

            theorems.push(the);
            x  = x + the.blocks[0].width + 50; // draw next set of blocks to the right        
        });
        x = 0;
        jsondefs.forEach(json => {
            let def = new Definition(s, json);
            def.draw();
            def.addToGroup(g);
            def.move(x,-550);

            definitions.push(def);
            x  = x + def.block.width + 50; // draw next set of blocks to the right        
        });
    }

    function makeBlocksDraggable() {
        let prevdx = 0,
            prevdy = 0;
        s.drag((dx, dy, x, y, event) => {
            let scale = 1/m.a;
            m.translate(scale*(dx-prevdx), scale*(dy-prevdy));
            prevdx = dx;
            prevdy = dy;
            g.transform(m.toTransformString());
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

            // center of zoom
            let cx = e.x-svgx;
            let cy = e.y-svgy;
            
            let minv = m.invert();

            if(e.deltaY > 0) //zoom out
                m.scale(0.8, 0.8, minv.x(cx,cy), minv.y(cx,cy));

            if(e.deltaY < 0) //zoom in
                m.scale(1.2, 1.2, minv.x(cx,cy), minv.y(cx,cy));
            
            g.transform(m.toTransformString());
            // IE Edge bug fix:
            s.node.setAttribute("style", toggle ? "color: red" : "");
            toggle = !toggle;
        }

    });

    (async function init() {
        const jsontheorems = await loadBlocksFromAPI("the");
        const jsondefs     = await loadBlocksFromAPI("def");
        drawBlocks(jsontheorems, jsondefs);
        MathJax.typeset();
        makeBlocksDraggable();
        
        // the1.onSpecialLetter('@', (p) => showTitles((title) => p.innerHTML = p.innerHTML+title));
        
    })();


})();





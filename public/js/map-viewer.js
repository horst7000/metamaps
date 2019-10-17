(function() {
    const s           = Snap("#drawsvg");
    let jsontheorems  = [];
    let theorems      = [];

    function loadBlocksfromAPI(next) {
        // get svg elements form API
        fetch('/api/def/')
          .then((res) => 
              res.json()
          )
          .then((json) => {
            jsontheorems = json;
          })
          .then( next );
      };

    function drawBlocks() {
        let x = 0;
        jsontheorems.forEach(json => {
            let the = new Theorem(s, json);
            the.draw();
            the.move(x,0);

            theorems.push(the);
            x  = x + 400; // draw next set of blocks to the right        
        });
    }

    function makeBlocksDraggable() {
        let lastdx = 0,
            lastdy = 0;
        s.drag((dx, dy, x, y, event) => {
            theorems.forEach(the => {
                the.move(dx-lastdx,dy-lastdy);
            });
            lastdx = dx;
            lastdy = dy;
        }, null, () => { // after each drag
            lastdx = 0;
            lastdy = 0;
        });
    }

    document.addEventListener("wheel", (e) => {
        if(e.deltaY > 0) //zoom out
            theorems.forEach(th => {
                th.zoomOut();
            });

        if(e.deltaY < 0) //zoom out
            theorems.forEach(th => {
                th.zoomIn();
            });
    });

    (function init() {
        loadBlocksfromAPI(() => {
            drawBlocks();
            makeBlocksDraggable();
            
            // the1.onSpecialLetter('@', (p) => showTitles((title) => p.innerHTML = p.innerHTML+title));
        });
    })();


})();





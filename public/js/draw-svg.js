(function() {
    const s           = Snap("#drawsvg");
    const blocktype   = { premise : 1, proof : 2, conclusion : 3 };
    let   rectcounter = 0;
    let   blocks = [];

    (function init() {
        const btnX = 650;    
        let addButton = s.circle(btnX,50,30);
        addButton.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 5
        });
        s.text(+addButton.attr("cx"),
            +addButton.attr("cy"), "+");
    
        let delButton = s.circle(btnX,120,30);
        delButton.attr({
            fill: "#55adb5",
            stroke: "#000",
            strokeWidth: 5
        });
        s.text(+delButton.attr("cx"),
            +delButton.attr("cy"), "-");
    
        addButton.click(onAddButtonClick);
    })();

    function onAddButtonClick() {
        if(rectcounter < 5) {
            blocks.push(new Block(40, 40 + rectcounter*(150+20), "edit me"));
            createBlock(blocks[blocks.length-1]);
            rectcounter++;
        }
    };


    function createRect(x,y,text) {
        const width  = 350,
              height = 150;
    
        let rect = s.rect(
                        x, y,
                        width, height,
                        10);
        rect.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 5,
            id : rect.id
        });
        var t1 = s.text(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, "Snap");
        createText(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, text);
        return "#"+rect.id;
    }
    
    function createText(x,y,text) {
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        var textdiv = document.createElement("div");
        var textpar = document.createElement("p");
        var textnode = document.createTextNode(text);
        textpar.appendChild(textnode);
        textpar.className = "text-secondary";
        textdiv.appendChild(textpar);
        textpar.setAttribute("contentEditable", "true");
        textpar.setAttribute("width", "auto");
        myforeign.setAttribute("width", "100%");
        myforeign.setAttribute("height", "100%");
        myforeign.classList.add("foreign"); //to make div fit text
        textdiv.classList.add("divinforeign"); //to make div fit text
        //textdiv.addEventListener("mousedown", elementMousedown, false);
        myforeign.setAttributeNS(null, "transform", "translate(" + x + " " + y + ")");
        myforeign.appendChild(textdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
    }
    
    function createBlock(block) {
        block.rectID = createRect(block.x,block.y,block.text);
    }

    class Block {
        constructor(x, y, text, nr = 0, type = blocktype.proof) {
            this._text = text;
            this._nr   = nr;
            this._x    = x;
            this._y    = y;
            // blocktype:   prmise, proof, conclusion
            this._isPremise = (type == blocktype.premise);
            this._isConclusion = (type == blocktype.conclusion);
        }
        set text(text) {
            this._text = text;
        }
        set rectID(rectID) { this._rectID = rectID; }
        get rectID(){ return this._rectID; }
        get text() { return this._text; }
        get x() { return this._x; }
        get y() { return this._y; }
        get isPremise() { return this._isPremise; }
        get isConclusion() { return this._isConclusion; }        

        asObj() {
            return {
                text : this._text,
                nr : this._nr,
                x : this._x,
                y : this._y,
                isPremise : this._isPremise,
                isConclusion : this._isConclusion,
            }
        }
    }

    
    // const bl = new Block(130, 100, "hello");
    // createBlock(bl);
    
    (function loadSVGfromURL() {
        // load svg
        const urlpathname = window.location.pathname;
        const paths = urlpathname.split("/")
        fetch('/api/def/' + paths[paths.length-1])
          .then((res) => 
              res.json()
          )
          .then((json) => {
            if(json[0].inner) 
                setInnerSVG(unescapeHtml("" + json[0].inner))
            console.log(unescapeHtml("" + json[0].inner));
          });
      })();
    
    function setInnerSVG(inner) {
        // view on SVG element
        document.getElementById("drawsvg").innerHTML = unescapeHtml(inner);
    
        // add click listener
        s.children()[2].click(onAddButtonClick)
        console.log(s.children());
    }
})();






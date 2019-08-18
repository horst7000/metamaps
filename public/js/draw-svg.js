const drawer = (function() {
    const s           = Snap("#drawsvg");
    const blocktype   = { premise : 1, proof : 2, conclusion : 3 };
    const buttonpos   = { bottom : 1, bottomright : 2, topright : 3, top : 4 };
    let   blocks = [];
    let   blockcntr = 0;
   
    class Block {
        constructor(x, y, text, nr, type = blocktype.proof) {
            this._text = text;
            this._nr   = nr;
            this._x    = x;
            this._y    = y;            
            this._type = type; // blocktype:   prmise, proof, conclusion
            this._parents  = [];
            this._children = [];
            this._btns = [];

            createBlock(this);
            if(type == blocktype.premise)
                this._btns.push(createAddButton(buttonpos.bottomright, this));
            if(type != blocktype.conclusion)
                this._btns.push(createAddButton(buttonpos.bottom, this));
            if(type != blocktype.premise)
                this._btns.push(createAddButton(buttonpos.topright, this));
        }
        set text(text) { this._text = text; }
        set rectID(rectID) { this._rectID = rectID; }
        get rectID(){ return this._rectID; }
        get text() { return this._text; }
        get nr() { return this._nr; }
        get x() { return this._x; }
        get y() { return this._y; }
        get isPremise() { return (type == blocktype.premise); }
        get isConclusion() { return (type == blocktype.conclusion); }        
        get width() { return s.select(this._rectID).attr("width"); }
        get height() { return s.select(this._rectID).attr("height"); }

        
        onTextChange(element) { //element is HTMLParagraphElement
            this._text = element.innerHTML;
            let h      = element.offsetHeight;
            let oldh   = parseInt(s.select(this._rectID).attr("height"));
            let hdif   = (h+45) - oldh;
            
            // set rect new height
            s.select(this._rectID).attr({height : h+45});

            // set buttons new y
            this._btns.forEach(btn => {
                let btnpos = btn.attr("pos");
                if(btnpos != buttonpos.top && btnpos != buttonpos.topright) {
                    let oldbtnY = parseInt(btn.attr("cy"));
                    btn.attr({ cy : oldbtnY + hdif });
                }
            });

        }

        asObj() {
            return {
                text : this._text,
                nr : this._nr,
                x : this._x,
                y : this._y,
                type : this._type,
            }
        }
    }

    function createBlock(block) { 
        let ids = createRect(block.x,block.y, block.nr,block.text);
        let textpar = document.getElementById(ids[1]).lastChild.lastChild;
        textpar.addEventListener("input", (ev) => block.onTextChange(ev.target)); // ev.target is textpar

        block.rectID    = ids[0];
        block.foreignID = ids[1];
    }

    function createRect(x,y,nr,text) {
        const width  = 350,
              height = 150;
    
        let rect = s.rect(
                        x, y,
                        width, height,
                        10);        
        // derive id of foreign element from rectID
        let forID = "for" + rect.id.slice(4);
        let t1 = s.text(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, nr);
        let h  = createText(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, text, forID);
        
        // let gr = s.g(rect, t1);
        // gr.attr({x : 1000});
        console.log(s.node.children);

        rect.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 5,
            id : rect.id,
            height : h+45,
        });
        
        return ["#"+rect.id, forID];
    }
    
    /*
        creates editable text element <p> and adds it in foreign container to SVG
    */
    function createText(x, y, text, forID) {
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        myforeign.setAttribute('id', forID);
        myforeign.setAttribute("width", "350");
        myforeign.setAttribute("height", "100%");
        myforeign.classList.add("foreign"); //to make div fit text
        myforeign.setAttributeNS(null, "transform", "translate(" + x + " " + y + ")");

        var textdiv = document.createElement("div");
        textdiv.classList.add("divinforeign"); //to make div fit text

        var textpar = document.createElement("p");
        textpar.innerHTML = text;
        textpar.setAttribute('style', 'white-space: pre;');
        textpar.className = "text-secondary";
        textpar.setAttribute("contentEditable", "true");
        textpar.setAttribute("width", "auto");

        // append everything
        textdiv.appendChild(textpar);
        myforeign.appendChild(textdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
        return textpar.offsetHeight;
    }

    /*
        needs parent and child to set child/parent property of affected blocks
    */
    function createAddButton(relativePos, parent, child) {
        let btnX = 0;
        let btnY = 0;
        switch (relativePos) {
            case buttonpos.bottom:
                btnX = parent.x + parseInt(parent.width) / 2;
                btnY = parent.y + parseInt(parent.height) +15;
                break;
            case buttonpos.bottomright:
                btnX = parent.x + parseInt(parent.width);
                btnY = parent.y + parseInt(parent.height) +15;
                break;
            case buttonpos.topright:
                btnX = parent.x + parseInt(parent.width);
                btnY = parent.y;
                break;
        }
        let addButton = s.circle(btnX,btnY,15);
        addButton.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 3,
            pos : relativePos
        });
        s.text(+addButton.attr("cx"),
            +addButton.attr("cy"), "+");
            
        addButton.click(() => onAddButtonClick(relativePos, parent, child));
        return addButton;
    }
    
    function onAddButtonClick(relativePos, parent, child) {
        blockcntr++;
        let createType = blocktype.proof;
        if(parent.type == blocktype.premise && !child)
            createType = blocktype.conclusion;
        

        blocks.push(new Block(40, 40 +parent.y +parseInt(parent.height),
            "edit me", blockcntr, createType));
    };
    
    function maxBlockNr() {
        let maxnr = 0;
        blocks.forEach(block => {
            if(block.nr > maxnr)
                maxnr = block.nr;
        });
        return maxnr;
    }

    function getBlockByNr(nr) {
        blocks.forEach(block => {
            if(block.nr == nr)
                return block;
        });
        return undefined;
    }
    
    function loadSVGfromURL(next) {
        // get svg elements form API
        const urlpathname = window.location.pathname;
        const paths = urlpathname.split("/")
        fetch('/api/def/' + paths[paths.length-1])
          .then((res) => 
              res.json()
          )
          .then((json) => {
            if(json.blocks) {
                setupBlocks(json.blocks);
            }
          })
          .then( next );
      };
    
    function setupBlocks(jblocks) {
        // fill blocks array
        jblocks.forEach(block => {
            blocks.push(new Block(block.x, block.y, block.text, block.nr, block.type));
        });
    }

    
    (function init() {
        loadSVGfromURL(() => {
            blockcntr = maxBlockNr();
            if(!blockcntr) {
                blockcntr++;
                blocks.push(new Block(40, 40, "edit me", blockcntr, blocktype.premise));
            }
        });


    let r = s.rect(500,0,10,10);
    r.attr({fill: Snap.flat.carrot});
    let c = s.circle(550,0,10);
    let t = s.text(505,10,"bla");
    set = Snap.set(r,c,t);
    set.forEach((el) => el.animate({y:300},1000));

        /*
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
        // */
    })();

    /*
        returns an Array of reduced block objects containing
        text, nr, x, y, type
    */
    function getBlocks() {
        let blockObj = [];
        blocks.forEach((block) => blockObj.push(block.asObj()));
        return blockObj;
    }

    return { getBlocks : getBlocks };

})();






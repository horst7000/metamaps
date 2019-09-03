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

            // draw block
            drawBlock(this); //initialises _snapset

            // draw buttons
            if(type != blocktype.premise) { // premise has no top or topright button
                this._snapset.push(...createAddButton(buttonpos.topright, this));
                this._snapset.push(...createAddButton(buttonpos.top, this));
            }
            this._snapset.push(...createAddButton(buttonpos.bottomright, this));
            this._snapset.push(...createAddButton(buttonpos.bottom, this));
        }
        set text(text) { this._text = text; }
        set rectID(rectID) { this._rectID = rectID; }
        set snapset(snapset) { this._snapset = snapset; }
        get rectID(){ return this._rectID; }
        get text() { return this._text; }
        get nr() { return this._nr; }
        get x() { return this._x; }
        set x(x) { this._x = x; }
        get y() { return  this._y; }
        set y(y) { this._y = y; }
        get isPremise() { return (type == blocktype.premise); }
        get isConclusion() { return (type == blocktype.conclusion); }
        get isConnectedToRoot() { // recursive
            parents.forEach(parentBlock => {
                if(parentBlock.isConnectedToRoot())
                    return true;
            });
            return false;
        }
        get width() { return s.select(this._rectID).attr("width"); }
        get height() { return s.select(this._rectID).attr("height"); }
        get children() { return this.children };
        get parents() { return this._parents };
        addChild(child) { this._children.push(child); }
        addParent(parent) { this._parents.push(parent); }
        delChild(child) {
            this._children = this._children.filter( (val) => val != child);
        }
        delParent(parent) {
            this._parents = this._parents.filter( (val) => val != parent);
        }

        onTextChange(p) { //p is HTMLParagraphElement
            this._text = p.innerHTML;
            let h      = p.offsetHeight;            
            
            this.rescale(h+45);
        }     

        rescale(newY) {
            // sets elements of _snapset new y
            let oldh   = parseInt(this.height);
            let hdif   = newY - oldh;
            this.insertSpaceBelow(20, hdif);

            // set rect new height
            s.select(this._rectID).attr({height : newY});
        }
        
        insertSpaceBelow(belowY, amountY) {
            this.moveAllChildrenY(amountY);

            let blockCoordChanged = false;
            this._snapset.forEach(el => {
                let yattr = "y";
                if(el.type == "circle")
                    yattr = "cy";
                
                let elY = el.attr(yattr);
                if(elY - this.y > belowY ) { // not on top
                    let oldelY = parseInt(el.attr(yattr));
                    el.attr({ [yattr] : oldelY + amountY }); //[yattr] is "cy" or "y"
                    if (el.type == "rect")
                        blockCoordChanged = true;
                }
            });

            if(blockCoordChanged) this.updateCoords();

            // move textpar
            document.getElementById(this.foreignID).setAttributeNS(null,
                "transform", "translate( " + (this.x+20) + " " + (this.y+20) + ")");
        }   

        updateCoords() {
            this.x = parseInt( s.select(this._rectID).attr("x") );
            this.y = parseInt( s.select(this._rectID).attr("y") );
        }

        moveAllChildrenY(amountY) { // recursive
            this._children.forEach(childNr => {
                let childBlock = getBlockByNr(childNr);
                childBlock.moveAllChildrenY(amountY);
                childBlock.insertSpaceBelow(-20, amountY);
            });
            
        }

        insertBlock(relativePos) {
            blockcntr++;
            let freespaceY = 110;

            let bl = new Block(40, this.y, "edit me", blockcntr);
            blocks.push(bl);

            // ------ manage children / parents
            if(relativePos == buttonpos.top) {
                // pass parents
                this._parents.forEach(parNr => {
                    let par = getBlockByNr(parNr);
                    this.connect(par, bl);
                    this.disconnect(par, this);
                });
                
                this._parents = [];
            }

            if(relativePos == buttonpos.bottom) {
                // pass children
                this._children.forEach(childNr => {
                    let child = getBlockByNr(childNr);
                    this.connect(bl, child);
                    this.disconnect(this, child);
                });
                
                this._children = [];
            }

            if(relativePos == buttonpos.top || relativePos == buttonpos.topright) {                
                // connect child and new parent
                this.connect(bl, this);
                
                // move old block and children
                bl.moveAllChildrenY(freespaceY);

            } else {
                // connect parent and new child
                this.connect(this, bl);
                
                // move only children
                this.moveAllChildrenY(parseInt(this.height) + freespaceY/2);
            }
        }

        connect(parentBlock, childBlock) {
            parentBlock.addChild(childBlock.nr);
            childBlock.addParent(parentBlock.nr);
        }

        disconnect(oldParent, oldChild) {
            oldParent.delChild(oldChild.nr);
            oldChild.delParent(oldParent.nr);
        }

        asObj() {
            return {
                text : this.text,
                nr : this.nr,
                x : this.x,
                y : this.y,
                type : this._type,
            }
        }
    }

    function drawBlock(block) { 
        let ids = drawRect(block.x,block.y, block.nr,block.text);
        let textpar = document.getElementById(ids[1]).lastChild.lastChild;
        textpar.addEventListener("input", (ev) => block.onTextChange(ev.target)); // ev.target is textpar

        block.rectID    = ids[0];
        block.foreignID = ids[1];
        block.snapset   = ids[2];
    }

    function drawRect(x,y,nr,text) {
        const width  = 350,
              height = 150;
    
        let rect = s.rect(
                        x, y,
                        width, height,
                        10);        
        // derive id of foreign element from rectID
        let forID = "for" + rect.id.slice(4);
        let t  = s.text(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, nr);
        let h  = createText(+rect.attr("x") + 20,
                    +rect.attr("y") + 20, text, forID);
        
                    
        console.log(s.node.children);

        rect.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 5,
            id : rect.id,
            height : h+45,
        });
        snapset = Snap.set(rect, t);

        return ["#"+rect.id, forID, snapset];
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
        needs parent and child to adjust child/parent property of affected blocks
    */
    function createAddButton(relativePos, owner) {
        let btnX = 0;
        let btnY = 0;
        switch (relativePos) {
            case buttonpos.bottom:
                btnX = owner.x + parseInt(owner.width) / 2;
                btnY = owner.y + parseInt(owner.height) +15;
                break;
            case buttonpos.bottomright:
                btnX = owner.x + parseInt(owner.width);
                btnY = owner.y + parseInt(owner.height) +15;
                break;
            case buttonpos.topright:
                btnX = owner.x + parseInt(owner.width);
                btnY = owner.y;
                break;
            case buttonpos.top:
                btnX = owner.x + parseInt(owner.width) / 2;
                btnY = owner.y;
                break;
        }
        let addButton = s.circle(btnX,btnY,15);
        addButton.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 3
        });
        let t = s.text(+addButton.attr("cx"),
            +addButton.attr("cy"), "+");
            
        addButton.click(() => owner.insertBlock(relativePos));
        return [addButton,t];
    }
    
    function maxBlockNr() {
        let maxnr = 0;
        blocks.forEach(block => {
            if(block.nr > maxnr)
                maxnr = block.nr;
        });
        return maxnr;
    }

    function getBlockByNr(nr) {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if(block.nr == nr)
                return block;
        }
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






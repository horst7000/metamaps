const drawer = (function() {
    const s           = Snap("#drawsvg");
    const blocktype   = { premise : 1, proof : 2, conclusion : 3 };
    const buttonpos   = { bottom : 1, bottomright : 2, topright : 3, top : 4 };
    let   blocks = [];
    let   blockcntr = 0;
    let   titlemenu = [];
    let   defIds = [];
   
    class Block {
        constructor(x, y, text, nr, type, parents = [], children = []) {
            this._text = text;
            this._nr   = nr;
            this._x    = x;
            this._y    = y;            
            this._type = type; // blocktype:   prmise, proof, conclusion
            this._parents  = parents;
            this._children = children;
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
        get width() { return parseInt(s.select(this._rectID).attr("width")); }
        get height() { return parseInt(s.select(this._rectID).attr("height")); }
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

        onTextChange(p, data) { //p is HTMLParagraphElement
            this._text = p.innerHTML;
            if(data == '@')
                showTitles((title) => p.innerHTML = p.innerHTML+title);
            
            let h      = p.offsetHeight;
            this.rescale(h+45);
        }     

        rescale(newY) {
            // sets elements of _snapset new y
            let oldh   = parseInt(this.height);
            let hdif   = newY - oldh;
            this.insertSpaceBelow(20, hdif);
            this.moveAllChildrenY(hdif);

            // set rect new height
            s.select(this._rectID).attr({height : newY});
        }
        
        insertSpaceBelow(belowY, amountY) {
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
            let foreign = document.getElementById(this.foreignID);
            foreign.setAttributeNS(null, "transform", "translate( " + (this.x+20) + " " + (this.y+20) + ")");
            foreign.setAttribute("height", this.height);
        }   

        updateCoords() {
            this.x = parseInt( s.select(this._rectID).attr("x") );
            this.y = parseInt( s.select(this._rectID).attr("y") );
        }

        moveAllChildrenY(amountY) { // recursive
            this._children.forEach(childNr => {
                let childBlock = blocks[childNr];
                childBlock.moveAllChildrenY(amountY);
                childBlock.insertSpaceBelow(-20, amountY);
            });
            
        }

        insertBlock(relativePos) {
            blockcntr++;
            let defaultheight = 73;
            let freespaceY = defaultheight + 37;
            let x = this.x;

            if(relativePos == buttonpos.bottomright || relativePos == buttonpos.topright)
                x = this.x + this.width;

            let bl = new Block(x, this.y, "edit me", blockcntr);
            // blocks[blockcntr] = bl;
            blocks.push(bl);

            // ------ manage children / parents            
            if(relativePos == buttonpos.topright) {
                this.connect(bl, this);
            }

            if(relativePos == buttonpos.bottomright) {
                this.connect(this, bl);
            }
            
            if(relativePos == buttonpos.top) {                
                // pass parents
                this._parents.forEach(parNr => {
                    let par = blocks[parNr];
                    this.connect(par, bl);
                    this.disconnect(par, this);
                });
                
                this._parents = [];

                // connect child and new parent
                this.connect(bl, this);
                
                // move old block and children
                bl.moveAllChildrenY(freespaceY);                
            }
            
            if(relativePos == buttonpos.bottom) {
                // pass children
                this._children.forEach(childNr => {
                    let child = blocks[childNr];
                    this.connect(bl, child);
                    this.disconnect(this, child);
                });
                
                this._children = [];

                // connect parent and new child
                this.connect(this, bl);
                
                // move new child to bottom edge
                bl.insertSpaceBelow(-20, this.height - defaultheight);
                
                // move only children
                this.moveAllChildrenY(freespaceY);
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
                parents : this._parents,
                children : this._children,
            }
        }
    }

    function drawBlock(block) { 
        let ids = drawRect(block.x,block.y, block.nr,block.text); //drawrect returns ids
        let textpar = document.getElementById(ids[1]).lastChild.lastChild;
        textpar.addEventListener("input", (ev) => block.onTextChange(ev.target, ev.data)); // ev.target is textpar        

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
                    +rect.attr("y") + 20, text, forID); //createText returns height
        
        
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
        
        myforeign.setAttribute("height", textpar.offsetHeight);
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
                btnX = owner.x + owner.width / 2;
                btnY = owner.y + owner.height +15;
                break;
            case buttonpos.bottomright:
                btnX = owner.x + owner.width;
                btnY = owner.y + owner.height +15;
                break;
            case buttonpos.topright:
                btnX = owner.x + owner.width;
                btnY = owner.y;
                break;
            case buttonpos.top:
                btnX = owner.x + owner.width / 2;
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

    async function showTitles(onSelect) {
        let r = s.rect(0, 0, 150, 200).attr({fill: "#aac"});
        titlemenu.push(r);
        const titles = await loadTitleWithIdFromAPI(); //pair = { title: title, id: id}
        
        let i = 0;
        titles.forEach(pair => {
            let t = s.text(0, 20+15*i, pair.title);
            t.attr({width: 150});
            t.hover(() =>t.attr({fill:"#a11"}),
                    () =>t.attr({fill:"black"}));
            t.click(() => {
                onSelect(pair.title+"["+pair.id+"]");
                hideTitles();
            });
            
            titlemenu.push(t);
            i++;
        });
    }

    function hideTitles() {
        titlemenu.forEach(el => {
            el.remove();
        });
    }
    
    //TO DO: mouse and keyboard listener for selection (arrows, input, return, esc)
    // text array of menu entries for navigation?

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
    
    function loadTitleWithIdFromAPI() {
        return new Promise(resolve => {
            fetch('/api/def/titles')
                .then((res) => resolve(res.json()));
        });
    }

    function loadBlocksfromAPI(next) {
        // get svg elements form API
        const urlpathname = window.location.pathname;
        const paths = urlpathname.split("/")
        defId = paths[paths.length-1];
        fetch('/api/def/' + defId)
          .then((res) => 
              res.json()
          )
          .then((json) => {
            if(json.blocks) {
                setupBlocks(json.blocks);
            }
          })
          .then( next );
    }

    document.addEventListener('keydown', (e) => (e.key === "Escape") ? hideTitles() : null);
    
    function setupBlocks(jblocks) {
        // fill blocks array
        jblocks.forEach(jblock => {
            blockcntr++;
            blocks[blockcntr] = new Block(jblock.x, jblock.y, jblock.text, jblock.nr,
                jblock.type, jblock.parents, jblock.children);
        });
    }

    (function init() {
        loadBlocksfromAPI(() => {
            blockcntr = maxBlockNr();
            if(blockcntr == 0) {
                blockcntr++;
                blocks[blockcntr] = new Block(40, 40, "edit me", blockcntr, blocktype.premise);
            }
        });
    })();
    
    /*
        returns an Array of reduced block objects containing
        text, nr, x, y, type, parents, children
    */
    function getBlocks() {
        let blockObj = [];
        blocks.forEach((block) => blockObj.push(block.asObj()));
        return blockObj;
    }

    return { getBlocks : getBlocks };

})();






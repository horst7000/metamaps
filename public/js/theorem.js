const viewStatus   = { expanded : 1, core : 2, title : 3 };

class Theorem {
    constructor(snap, json) {
        this._title = json.title;
        this._id    = json._id;
        this._zoom  = 0;
        this._s     = snap;
        this._blockcntr = 0;
        this._x = 0;
        this._y = 0;
        this._g = this._s.g();
        this._blockwidth = 390;
        this._status = viewStatus.title;
        this._vizeStatus = viewStatus.title;
        this._holdCore  = false;
        this._proofCtr  = 0;
        this._proofIndicator    = this._s.g();
        this._color = "";
        this._premiseTextWithMJ = "";
        
        this._blocks = [];
        json.blocks.forEach(block => {
            this._blocks.push(new Block(snap, block));
            // find max nr
            if(block.nr > this._blockcntr) this._blockcntr = block.nr;
            // count proof blocks
            if(block.type == blocktype.proof) this._proofCtr++;
        });
        
        // add listeners
        this._blocks.forEach(block => {
            block.onRescale((triggerBlock, hdif) => {
                // this.moveAllChildrenY(triggerBlock, hdif);
                this.blockPosRecursive(1);
            });
            block.onAddButtonClick((triggerBlock, relativePos) => {
                this.insertBlock(triggerBlock, relativePos);
            });
        });
    }

    get blocks() { return this._blocks };
    get x() { return this._x };
    get y() { return this._y };
    get width() { return this._g.getBBox().width };
    get height() { return this._g.getBBox().height };
    set tribute(tribute) { this._tribute = tribute };
    
    addToGroup(group) {
        group.add(this._g);
    }

    setAttr(attrObj) {
        this._blocks.forEach(bl => {
            bl._rect.attr(attrObj);
        });
    }

    blockPosRecursive(blockNr=1, done=[], column=0, columnheights=[0,0,0,0]) {  
        const BLOCK_SPACE_Y = 20;
        // console.log("recursive call "+this._title);
        // console.log(blockNr+" called. Column: "+column+ " @ "+columnheights[column]);
        let block   = this.getBlockByNr(blockNr);
        block.x     = (this._blockwidth+5) * column;
        block.y     = columnheights[column];
        if(!block.hidden)
            columnheights[column] = block.y + block.height + BLOCK_SPACE_Y;
        let parentColumn      = column;
        let childColumn       = column;
        let lowestParentEdgeY = 0;
        let parentEdgeY       = 0;
        
        done.push(blockNr);

        // recursive call upwards (parents)
        block.parents.forEach((parentNr,i) => {
            if ( i >= 1 )
                parentColumn++;
            if (done.indexOf(parentNr) == -1) // no repetetive recursion
                parentEdgeY = this.blockPosRecursive(parentNr, done, parentColumn, columnheights);
            if (parentEdgeY > lowestParentEdgeY)
                lowestParentEdgeY = parentEdgeY;
        });
        
        // set y dependend on lowest parent edge
        // console.log(blockNr+" lowestPE:"+lowestParentEdgeY);
        if (lowestParentEdgeY > block.y && !block.hidden) {
            block.y = lowestParentEdgeY;
            columnheights[column] = block.y + block.height + BLOCK_SPACE_Y;
        }
        
        // recursive call downwards (children)
        block.children.forEach((childNr,i) => {
            if ( i >= 1 )
                childColumn++;
            if (done.indexOf(childNr) == -1) // no repetetive recursion
                this.blockPosRecursive(childNr, done, childColumn, columnheights);
        });

        // return blocks lower edge y
        if(block.hidden)
            return 0;
        else
            return block.y+block.height;
    }
    
    click(e) {
        if(this._status == viewStatus.expanded) {
            this.collapseToCore();
        } else if(this._status == viewStatus.core && !this._holdCore) {
            this._g.addClass("holdCore");
            this._holdCore = true;
        } else if(this._status == viewStatus.core && this._holdCore) {
            let b = this._proofIndicator.node.getBoundingClientRect();
            if(e.clientX < b.x || e.clientX > b.x+b.width ||
                e.clientY < b.y || e.clientY > b.y+b.height ) {
                this.collapseToTitle();
                this._g.removeClass("holdCore");
                this._holdCore = false;
            } else {
                this.expand();
            }
        }
    }

    collapseToTitle() {
        let premiseBlock = {};
        this._blocks.forEach(block => {
            block.hide();
            if(block.type == blocktype.premise)
                premiseBlock = block;
        });
        premiseBlock.show();
        premiseBlock.text = this._title;
        premiseBlock.paragraphElement.classList.add("blockheader");
        this._proofIndicator.addClass("d-none");
        this._status = viewStatus.title;
    }
    
    collapseToCore() {
        let premiseBlock = {};
        this._blocks.forEach(block => {
            block.hide();
            if(block.type == blocktype.premise)
            premiseBlock = block;
            if(block.type == blocktype.conclusion)
            block.show();
        });
        premiseBlock.show();
        // remove class before changing text (change font size before calculating height)
        premiseBlock.paragraphElement.classList.remove("blockheader");
        this._proofIndicator.removeClass("d-none");
        premiseBlock.text = this._premiseTextWithMJ;
        this._status = viewStatus.core;
    }

    colorize(color) {
        this._color = color;
        this._blocks.forEach(block => {
            block.colorize(color);
        });
        this._proofIndicator.children().forEach((circ) => {
            circ.attr({fill : color});
        });
    }

    draw(editable) {
        this._blocks.forEach(block => {
            block.draw(editable, this._g);
            if(editable && this._tribute)
                this._tribute.attach(block.paragraphElement);
        });
        
        for (let i = 0; i < this._proofCtr; i++) {
            let circ = this._s.circle(
                this._x,
                this._y+10+30*i,
                13
            );
            this._proofIndicator.add(circ);
        }
        this._proofIndicator.addClass("indicator");
        this._proofIndicator.addClass("d-none");
        this._g.add(this._proofIndicator);

        this.postDraw(editable);
    }

    postDraw(editable) {
        // add hover listener
        if(!editable) {
            this._g.hover(() => this.mouseover(),(e) => this.mouseout(e));
        }

        // add click listener
        if(!editable) {
            this._g.click((e) => this.click(e));
        }

        this.blockPosRecursive(1);
    }

    expand() {
        // title -> core first
        if(this._status == viewStatus.title)
            this.collapseToCore();

        this._blocks.forEach(block => {
            block.show();
        });
        this.blockPosRecursive();
        this.avoidOverlapping([this]);
        this._proofIndicator.addClass("d-none");
        this._status = viewStatus.expanded;
    }
    
    getBlockByNr(nr) {
        for (let i = 0; i < this._blocks.length; i++) {
            if (this._blocks[i].nr == nr)
                return this._blocks[i];
        }
    }

    moveBy(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
    }

    mouseover() {
        this.setAttr({style: "opacity: 0.9"});
        if(this._status == viewStatus.title)
            this.collapseToCore();
    }
    
    mouseout(e) {
        let b = this._g.node.getBoundingClientRect();    
        if(e.clientX < b.x || e.clientX > b.x+b.width ||
            e.clientY < b.y || e.clientY > b.y+b.height ) {
            if(!this._holdCore && this._status == viewStatus.core)
                this.collapseToTitle();
            this.setAttr({style: "opacity: 1"});
        }        
    }

    insertBlock(triggerBlock, relativePos) {
        this._blockcntr++;
        console.log("Blockcntr:"+this._blockcntr);
        
        let bl = new Block(this._s, {
            x: 0,
            y: 0,
            text: "edit me",
            nr: this._blockcntr,
            type: blocktype.proof,
        });
        
        // new block setup
        bl.draw(true, this._g);
        if(this._tribute)
            this._tribute.attach(bl.paragraphElement);
        bl.onRescale(() => this.blockPosRecursive());
        bl.onAddButtonClick((triggerBlock, relativePos) => {
            this.insertBlock(triggerBlock, relativePos);
        });
        this._blocks.push(bl);
        
        // ------ manage children / parents            
        if(relativePos == buttonpos.topright) {
            this.connect(bl, triggerBlock);
        }
        
        if(relativePos == buttonpos.bottomright) {
            this.connect(triggerBlock, bl);
        }
        
        if(relativePos == buttonpos.top) {                
            // pass parents
            triggerBlock._parents.forEach(parNr => {
                console.log("pass "+parNr);
                let par = this._blocks.find((el) => el.nr == parNr);
                par.replaceChild(triggerBlock, bl);
                triggerBlock.replaceParent(par, bl);
                bl.addParent(par);
            });

            // connect child and new parent
            this.connect(bl, triggerBlock);
        }
        
        if(relativePos == buttonpos.bottom) {
            // pass children
            triggerBlock.children.forEach(childNr => {
                let child = this.getBlockByNr(childNr);
                child.replaceParent(triggerBlock, bl);
                triggerBlock.replaceChild(child, bl);
                bl.addChild(child);
            });
            
            // connect parent and new child
            this.connect(triggerBlock, bl);
        }
        // this._blocks.forEach(block => {
        //     console.log("Block: "+block.nr);
        //     console.log("C: "+block.children);
        //     console.log("P: "+block.parents);
        // });
        this.blockPosRecursive();
    }

    refreshHeight() {
        this._blocks.forEach(bl => {
            bl.refreshHeight();
        });
    }

    saveTextWithMathJax() {
        // save text of premise for collapsing / expanding
        this._premiseTextWithMJ = this._blocks[0].textWithMJ;
    }

    connect(parentBlock, childBlock) {
        parentBlock.addChild(childBlock);
        childBlock.addParent(parentBlock);
    }

    disconnect(oldParent, oldChild) {
        oldParent.delChild(oldChild);
        oldChild.delParent(oldParent);
    }

    /**
        fn(p)   Parameters:
                        p    (obj) paragraph <p> element in which text is written
    */
    onSpecialLetter(letter, fn) {
        this._blocks.forEach(block => {
            block.onSpecialLetter(letter, fn);
        });
    }
}
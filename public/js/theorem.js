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
        
        this._blocks = [];
        json.blocks.forEach(block => {
            this._blocks.push(new Block(snap, block));
            // find max nr
            if(block.nr > this._blockcntr) this._blockcntr = block.nr;
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

    blockPosRecursive(blockNr=1, done=[], column=0, columnheights=[0,0,0,0]) {        
        // console.log(blockNr+" called. Column: "+column+ " @ "+columnheights[column]);
        let block   = this.getBlockByNr(blockNr);
        block.x     = (this._blockwidth+5) * column;
        block.y     = columnheights[column];
        if(!block.hidden)
            columnheights[column] = block.y + block.height + 40;
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
            columnheights[column] = block.y + block.height + 40;
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
        premiseBlock.text = this._premiseTextWithMJ;
        premiseBlock.paragraphElement.classList.remove("blockheader");
    }

    draw(editable) {
        this._blocks.forEach(block => {
            block.draw(editable, this._g);
            if(editable && this._tribute)
                this._tribute.attach(block.paragraphElement);
        });

        this.blockPosRecursive(1);
    }

    expand() {
        this._blocks.forEach(block => {
            block.show();
        });
        this.blockPosRecursive();
    }
    
    getBlockByNr(nr) {
        for (let i = 0; i < this._blocks.length; i++) {
            if (this._blocks[i].nr == nr)
                return this._blocks[i];
        }
    }

    saveTextWithMathJax() {
        // save text of premise for collapsing / expanding
        this._premiseTextWithMJ = this._blocks[0].textWithMJ;
    }

    moveBy(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
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
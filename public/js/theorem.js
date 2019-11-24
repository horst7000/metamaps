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

        this._blocks = [];
        json.blocks.forEach(block => {
            this._blocks.push(new Block(snap, block));
            // find max nr
            if(block.nr > this._blockcntr) this._blockcntr = block.nr;
        });
        
        this._blocks.forEach(block => {
            block.onRescale((triggerBlock, hdif) => {
                this.moveAllChildrenY(triggerBlock, hdif);
            });
            block.onAddButtonClick((triggerBlock, relativePos) => {
                this.insertBlock(triggerBlock, relativePos);
            });
        });
    }

    get blocks() { return this._blocks };
    set tribute(tribute) { this._tribute = tribute };
    
    draw(editable) {
        this._blocks.forEach(block => {
            block.draw(editable, this._g);
            if(editable && this._tribute)
                this._tribute.attach(block.paragraphElement);
        });
    }

    addToGroup(group) {
        group.add(this._g);
    }

    moveAllChildrenY(trigger, amountY, tmp) { // recursive
        trigger.children.forEach(childNr => {
            let childBlock = this._blocks.find((el) => el.nr == childNr);
            this.moveAllChildrenY(childBlock, amountY, tmp);
            childBlock.move(0, amountY);
            if(tmp) childBlock.tmpOffsetY += amountY/childBlock.height;
        });
    }

    move(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
    }

    zoomIn(x, y) {
        if(this._zoom < 0) {
            this._zoom++;
            this.zoom(x,y,1);
        }
        // this.viewZoom(x, y, 1);
    }
    zoomOut(x, y) {
        if(this._zoom > -15) {
            this._zoom--;
            this.zoom(x,y,-1);
        }
        // this.viewZoom(x, y, -1);
    }

    
    /**
     * Show and hide blocks in zoom steps.
     * @param {number} x x pos of mouse
     * @param {number} y y pos of mouse
     * @param {number} sign -1 if zoom out,  1 if zoom in
     */
    viewZoom(x, y, sign) {
        switch (this._zoom) {
            case 0:
                // this.redraw();
                break;
            case -1:
            case -2:
            case -3:
                // this.redraw();
                this._blocks.forEach(block => {
                    if(block.type == blocktype.proof) {
                        this.moveAllChildrenY(block,-block.height, true);
                        // block.remove();
                    }
                    if(block.type == blocktype.premise) {
                        block.resetText();
                        // block.redraw();
                    }
                });
                break;
            case -4:
                this._blocks.forEach(block => {
                    if(block.type == blocktype.premise) {
                        block.text = this._title;
                        // block.redraw();
                    }
                    // if(block.type != blocktype.premise)
                        // block.remove();
                });
                break;
        
            default:
                this._blocks.forEach(block => {
                    // if(block.type != blocktype.premise)
                        // block.remove();
                });
                break;
        }
    }

    insertBlock(triggerBlock, relativePos) {
        this._blockcntr++;
        let defaultheight = 73;
        let freespaceY = defaultheight + 20;
        let x = triggerBlock.x;
        
        if(relativePos == buttonpos.bottomright || relativePos == buttonpos.topright)
        x = triggerBlock.x + triggerBlock.width;
        
        let bl = new Block(this._s, {
            x: x,
            y: triggerBlock.y,
            text: "edit me",
            nr: this._blockcntr,
            type: blocktype.proof,
        });
        
        // new block setup
        bl.draw(true, this._g);
        if(this._tribute)
            this._tribute.attach(bl.paragraphElement);
        bl.onRescale((triggerBlock, hdif) => {
            this.moveAllChildrenY(triggerBlock, hdif);
        });
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
                let par = this._blocks.find((el) => el.nr == parNr);
                this.connect(par, bl);
                this.disconnect(par, triggerBlock);
            });
            
            // triggerBlock._parents = [];

            // connect child and new parent
            this.connect(bl, triggerBlock);
            
            // move old block and children
            this.moveAllChildrenY(bl, freespaceY);
        }
        
        if(relativePos == buttonpos.bottom) {
            // pass children
            triggerBlock.children.forEach(childNr => {
                let child = this._blocks.find((el) => el.nr == childNr);
                this.connect(bl, child);
                this.disconnect(triggerBlock, child);
            });
            
            // triggerBlock._children = [];
            
            // connect parent and new child
            this.connect(triggerBlock, bl);
            
            // move new child to bottom edge
            bl.move(0, triggerBlock.height - defaultheight);
            
            // move children (including new child)
            this.moveAllChildrenY(triggerBlock, freespaceY);
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
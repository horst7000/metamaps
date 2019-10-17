class Theorem {
    constructor(snap, json) {
        this._title  = json.title;
        this._id     = json._id;
        this._zoom   = 0;
        
        this._blocks = [];
        json.blocks.forEach(block => {
            this._blocks.push(new Block(snap, block));
        });
        
        this._blocks.forEach(block => {
            block.onRescale((hdif) => {
                // this.moveAllChildrenY(hdif);      TODO
            });            
        });
        
        
    }

    draw(editable) {
        this._blocks.forEach(block => {
            block.draw(editable);
        });
    }

    move(dx, dy) {
        this._blocks.forEach(block => {
            block.move(dx,dy);
        });
    }

    zoomIn() {
        this._zoom++;
        this.viewZoom();
    }
    zoomOut() {
        this._zoom--;
        this.viewZoom();
    }

    viewZoom() {
        console.log(this._zoom);
        switch (this._zoom) {
            case -1:
                for (let i = 1; i < this._blocks.length-1; i++) {
                    this._blocks[i].remove();
                    this._blocks[i+1].move(0,-this._blocks[i].height);
                }
                break;
        
            default:
                break;
        }
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
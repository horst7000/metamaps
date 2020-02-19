class Definition {
    constructor(snap, json) {        
        this._block = new Block(snap, json.block);
        this._title = json.title;
        this._id    = json._id;
        this._x = 0;
        this._y = 0;
        this._s     = snap;
        this._status = viewStatus.title;
        this._holdCore  = false;
        this._g     = this._s.g();
    }

    get block() { return this._block };
    get x() { return this._x };
    get y() { return this._y };
    get width() { return this._g.getBBox().width };
    get height() { return this._g.getBBox().height };
    set tribute(tribute) { this._tribute = tribute };

    addToGroup(g) {
        g.add(this._g);
    }

    asObj() {
        return this._block.asObj();
    }

    click() {
        if(this._status == viewStatus.core && !this._holdCore) {
            this._g.addClass("holdCore");
            this._holdCore = true;
        } else if(this._status == viewStatus.core && this._holdCore) {
            this.collapseToTitle();
            this._g.removeClass("holdCore");
            this._holdCore = false;
        }
        this.avoidOverlapping();
    }

    collapseToTitle() {
        this._block.text = '';
        this._status = viewStatus.title;
    }

    collapseToCore() {
        this._block.text = this._textWithMJ;
        this._status = viewStatus.core;
    }

    colorize(color) {
        this._block.colorize(color);
    }

    draw(editable) {        
        this._block.draw(editable, this._g);
        if(editable && this._tribute)
            this._tribute.attach(this._block.paragraphElement);
        
        this.postDraw(editable);
    }

    postDraw(editable) {
        // add hover listener
        if(!editable) {
            this._g.hover(() => this.mouseover(),(e) => this.mouseout(e));
        }

        // add click listener
        if(!editable) {
            this._g.click(() => this.click());
        }
    }

    moveBy(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
    }
    
    mouseover() {
        this._block._rect.attr({style: "opacity: 0.9"});
        if(this._status == viewStatus.title)
            this.collapseToCore();
    }
    
    mouseout(e) {
        let b = this._g.node.getBoundingClientRect();    
        if(e.clientX < b.x || e.clientX > b.x+b.width ||
            e.clientY < b.y || e.clientY > b.y+b.height ) {
            if(!this._holdCore && this._status == viewStatus.core)
                this.collapseToTitle();
            this._block._rect.attr({style: "opacity: 1"});
        }        
    }

    refreshHeight() {
        this._block.refreshHeight();
    }
    

    saveTextWithMathJax() {
        // save text for collapsing / expanding
        this._textWithMJ = this.block.textWithMJ;
    }
}
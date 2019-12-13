class Definition {
    constructor(snap, json) {        
        this._block = new Block(snap, json.block);
        this._title = json.title;
        this._id    = json._id;
        this._x = 0;
        this._y = 0;
        this._s     = snap;
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

    collapseToTitle() {
        this._block.text = '';
    }

    expand() {
        this._block.text = this._textWithMJ;
    }

    draw(editable) {        
        this._block.draw(editable, this._g);
        if(editable && this._tribute)
            this._tribute.attach(this._block.paragraphElement);
    }

    moveBy(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
    }

    saveTextWithMathJax() {
        // save text for collapsing / expanding
        this._textWithMJ = this.block.textWithMJ;
    }
}
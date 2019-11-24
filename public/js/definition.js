class Definition {
    constructor(snap, json) {        
        this._block = new Block(snap, json.block);
        this._x = 0;
        this._y = 0;
        this._s     = snap;
        this._g     = this._s.g();
    }

    set tribute(tribute) { this._tribute = tribute };
    get block() { return this._block };

    addToGroup(g) {
        g.add(this._g);
    }

    asObj() {
        return this._block.asObj();
    }

    draw(editable) {        
        this._block.draw(editable, this._g);
        if(editable && this._tribute)
            this._tribute.attach(this._block.paragraphElement);
    }

    move(dx, dy) {
        this._x += dx;
        this._y += dy;
        this._g.transform("t("+this._x+","+this._y+")");
    }
}
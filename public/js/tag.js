class Tag {
    constructor(snap, json) {
        this._s     = snap;
        this._id    = json._id;
        this._x     = json.x;
        this._y     = json.y;
        this._name  = json.name;
        this._color = json.color;
        this._usedByIds = json.usedByIds;
        this._con       = json.con;


    }

    set x(x) {
        this._x = x;
        this.text.attr({x:x});
    }
    set y(y) {
        this._y = y;
        this.text.attr({y:y});
    }
    get color() { return this._color; }
    get usedByIds() { return this._usedByIds; }
    
    draw() {
        this.text = this._s.text(this._x, this._y, this._name);
        this.text.attr({
            fontSize: (60 + 8*this._usedByIds.length),
            fill: this._color,
            opacity: 0.8,
        });
    }

    addToGroup(g) {
        g.add(this.text);
    }
}
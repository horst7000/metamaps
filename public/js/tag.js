class Tag {
    constructor(snap, json) {
        this._s     = snap;
        this._id    = json._id;
        this._x     = json.x;
        this._y     = json.y;
        this._name  = json.name;
        this._color = (this._name == "null") ? "#000" : json.color;
        this._usedByIds = json.usedByIds;
        this._con   = json.con;
        this._fontSize  = 60 + 7*this._usedByIds.length;
        this._cx    = this._x + this._fontSize/2 * this._name.length/2;
    }

    set x(x) {
        if(x == null) console.log(this._name + " x is null");
        this._x     = x;
        this._cx    = x+this._fontSize/2 * this._name.length/2;
        this.text.attr({x:x});
        this.rect.attr({x:this._cx });
        // this.cir4.attr({cx:this._cx });
        // this.cir5.attr({cx:this._cx });
    }
    set y(y) {
        this._y = y;
        this.text.attr({y:y});
        this.rect.attr({y:y});
        // this.cir4.attr({cy:y});
        // this.cir5.attr({cy:y});
    }
    get color() { return this._color; }
    get usedByIds() { return this._usedByIds; }
    
    draw() {
        this.text = this._s.text(this._x, this._y, this._name);
        this.rect = this._s.rect(this._cx, this._y, 5,5);
        // this.cir4 = this._s.circle(this._cx, this._y, 150+this._usedByIds.length*35)
        //     .attr({stroke:"#000", strokeWidth: 2, fill:"none"});
        // this.cir5 = this._s.circle(this._cx, this._y, 200*Math.sqrt(this._usedByIds.length))
        //     .attr({stroke:"#000", strokeWidth: 5, fill:"none"});
        this.text.attr({
            fontSize: (this._fontSize),
            fill: this._color,
            opacity: 0.8,
        });
    }

    addToGroup(g) {
        g.add(this.text);
        g.add(this.rect);
        // g.add(this.cir4);
        // g.add(this.cir5);
    }
}
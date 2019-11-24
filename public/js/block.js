const blocktype   = { premise : 1, proof : 2, conclusion : 3, definition : 4 };
const buttonpos   = { bottom : 1, bottomright : 2, topright : 3, top : 4 };
/**
 * snap: instance of SnapSVG
 * json: json object
 *          x: number
 *          y: number
 *          nr: number
 *          text: string
 *          type: number
 *          parents: Array of numbers (nr)
 *          children: Array of numbers (nr)
 */
class Block {
    constructor(snap, json) {
        this._s     = snap;
        this._text  = json.text;
        this._text0 = json.text;
        this._nr    = json.nr;
        this._x     = json.x;
        this._y     = json.y;
        this._type  = json.type; // blocktype:   prmise, proof, conclusion
        this._parents   = json.parents || [];
        this._children  = json.children || [];
        this._btns      = [];
        this._width     = 390;
        // this._height    = 150;
        this._txtSize   = 100;  //in %
        // only for definition
        if(this._type == blocktype.definition) {
            this._nameText = json.name;
            this._altText  = "";
            json.alt.forEach(alt => {
                this._altText  += alt + ";";
            });
        }

        this._specialLetters   = [];
        this._specialLetterFns = [];
        this.onRescaleFn = function() {};
        this.onAddButtonClickFn = function() {};

        this._moveOffsetX = 0;
        this._moveOffsetY = 0;
        this._tmpOffsetX = 0;
        this._tmpOffsetY = 0;
    }
    get width() { return parseInt(this._rect.attr("width")); }
    get height() { return parseInt(this._rect.attr("height")); }
    set width(w) { this._width = w; }
    set height(h) { this._height = h; }
    set txtSize(t) { this._txtSize = t; }
    get x() { return this._x; }
    get y() { return  this._y; }
    get tmpOffsetX() { return this._tmpOffsetX; }
    get tmpOffsetY() { return this._tmpOffsetY; }
    set tmpOffsetX(x) { this._tmpOffsetX = x; }
    set tmpOffsetY(y) { this._tmpOffsetY = y; }
    get nr() { return this._nr; }
    get text() { return this._text; }
    set text(text) { this._text = text; }
    get children() { return this._children };
    get type() { return this._type; }
    get paragraphElement( ) { return this._txt.textpar; }
    addChild(child) { this._children.push(child); }
    addParent(parent) { this._parents.push(parent); }
    delChild(child) { this._children = this._children.filter( (val) => val != child); }
    delParent(parent) { this._parents = this._parents.filter( (val) => val != parent); }

    draw(editable, group){
        this._editable = editable;
        this._g = group;
        this._height = 0;

        // draw rect
        this._rect  = this._s.rect(
                        this._x, this._y,
                        this._width, this._height,
                        4
                    );
        group.add(this._rect);
                    
        // draw nr
        // if(editable) {
        //     this._nrTxt = this._s.text(+ this._x + 20,
        //                     + this._y + 20, this._nr);
        //     group.add(this._nrTxt);
        // }
        
        if(this._type == blocktype.definition)
            this._height = this.drawDefElements(group);

        // draw text
        this._txt = this.createForeignText(this._y + this._height + 20, this._text);
        this._height    += parseInt(this._txt.getAttribute("height"))+45;
        group.node.appendChild(this._txt);  // foreignObject
        
        // draw checkbox for conclusion
        if(editable && this._type != blocktype.premise && this._type != blocktype.definition) {
            this._check = this.createConclCheckbox();
            group.node.appendChild(this._check);  // foreignObject
        }

        
        // adjust rect height
        this._rect.attr({
            fill: "#1da",
            stroke: "#000",
            strokeWidth: 2,
            height : this._height,
        });


        this._rect.hover(
            () => this._rect.attr({style: "opacity: 0.5"}),
            () => this._rect.attr({style: "opacity: 1"})
        );

        // draw buttons
        if(editable && this._type != blocktype.definition) {
            if(this._type != blocktype.premise) { // premise has no top or topright button
                this._btns.topright = this.createAddButton(buttonpos.topright);
                this._btns.top      = this.createAddButton(buttonpos.top);
                group.add(this._btns.topright, this._btns.top);
            }
            this._btns.bottomright  = this.createAddButton(buttonpos.bottomright);
            this._btns.bottom       = this.createAddButton(buttonpos.bottom);
            group.add(this._btns.bottomright, this._btns.bottom);
        }
    }

    drawDefElements(group) {
        let style = "font-weight: bold; text-align:center; width: 300px;";
        let height = 0;
        this._name = this.createForeignText(this._y + 20, this._nameText, style);
        this._name.textpar.setAttribute("width", 150);
        height = parseInt(this._name.getAttribute("height"));
        this._alt = this.createForeignText(this._y + height + 20, "["+this._altText+"]", style);
        height += parseInt(this._alt.getAttribute("height"));
        group.node.appendChild(this._name);
        group.node.appendChild(this._alt);
        return height;
    }

    resetText() {
        this._text = this._text0;
    }


    /*
        creates editable text element <p> and adds it in foreign container to SVG
    */
    createForeignText(y, text, style){
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        myforeign.setAttribute("width", "350");
        myforeign.classList.add("foreign"); //to make div fit text
        myforeign.setAttributeNS(null, "transform", "translate(" + (this._x + 20) + " " + y + ")");

        var textdiv = document.createElement("div");
        textdiv.classList.add("divinforeign"); //to make div fit text

        var textpar = document.createElement("p");
        textpar.innerHTML = text;
        textpar.setAttribute('style', (style||''));
        textpar.className = "text-secondary";
        textpar.setAttribute("contentEditable", "true");
        // textpar.setAttribute("width", "auto");
        textpar.addEventListener("input", (ev) => this.onTextChange(ev.target, ev.data)); // ev.target is textpar
        myforeign.textpar = textpar;

        // append everything
        textdiv.appendChild(textpar);
        myforeign.appendChild(textdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
        
        myforeign.setAttribute("height", textpar.offsetHeight);
        return myforeign;
    }

    createConclCheckbox() {
        // <input type="checkbox" class="custom-control-input" id="customSwitch1" checked=""></input>
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        myforeign.setAttribute("width", "30");
        myforeign.setAttribute("height", "30");
        myforeign.setAttributeNS(null, "transform", "translate(" + (this._x) + " " + (this._y) + ")");

        var inputdiv = document.createElement("div");
        inputdiv.classList.add("form-check"); //to make div fit text

        var input = document.createElement("input");
        input.classList.add("form-check-input");
        input.setAttribute("type", "checkbox");
        input.checked = (this._type == blocktype.conclusion);
        input.addEventListener("change", () => this._type = input.checked ? blocktype.conclusion : blocktype.proof);

        inputdiv.appendChild(input);
        myforeign.appendChild(inputdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
        
        return myforeign;
    }

    onTextChange(p, data) { //p is HTMLParagraphElement
        if(p === this._txt.textpar) {
            this._text      = p.innerHTML;
        } else if (p === this._name.textpar)
            this._nameText   = p.innerHTML;
        else if (p === this._alt.textpar)
            this._altText    = p.innerHTML.substring(1,p.innerHTML.length-1);

        // show titles at '@'
        // for (let i = 0; i < this._specialLetters.length; i++) {
        //     if(data == this._specialLetters[i])
        //         this._specialLetterFns[i](p);
        // }

        let h = this._txt.textpar.offsetHeight;
        if (this._type == blocktype.definition) {
            h += this._name.textpar.offsetHeight;
            h += this._alt.textpar.offsetHeight;
        }
        this.rescale(h+45);
    }

    

    rescale(newHeight) {
        let oldh        = parseInt(this.height);
        let hdif        = newHeight - oldh;

        // set rect new height
        this._rect.attr({height : newHeight});
        // set foreign element new height
        this._txt.setAttribute("height", this._txt.textpar.offsetHeight);
        if(this._type == blocktype.definition) {
            let h = this._name.textpar.offsetHeight;
            this._name.setAttribute("height", this._name.textpar.offsetHeight);
            this._alt.setAttributeNS(null, "transform", "translate(" +
                (this._x + 20) + " " + (this._y + 20 + this._name.textpar.offsetHeight) + ")");
            this._alt.setAttribute("height", this._alt.textpar.offsetHeight);
            this._txt.setAttributeNS(null, "transform", "translate(" +
                (this._x + 20) + " " + (this._y + 20  + this._name.textpar.offsetHeight +
                this._alt.textpar.offsetHeight) + ")");
        } else {
            // set buttons new y
            let oldBottomY  = parseInt(this._btns.bottom[0].attr('cy'));
            this._btns.bottom.attr({ y : oldBottomY + hdif });
            this._btns.bottomright.attr({ y : oldBottomY + hdif });
        }

        // run additional method set by onRescale(fn)
        this.onRescaleFn(this, hdif);
    }

    move(dx, dy) {
        this._x = this._x + dx;
        this._y = this._y + dy;
        
        const transformstring = "t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy);

        // move every element
        this._rect.transform(transformstring);
        if(this._editable) {
            // this._nrTxt.transform(transformstring);
            this._txt.setAttributeNS(null, "transform", "translate( " + (this._x+20) + " " + (this._y+20) + ")");
            this._check.setAttributeNS(null, "transform", "translate( " + (this._x) + " " + (this._y) + ")");
            this.transformSet(this._btns.bottom, transformstring);
            this.transformSet(this._btns.bottomright, transformstring);
            if(this._type != blocktype.premise) {
                this.transformSet(this._btns.top, transformstring);
                this.transformSet(this._btns.topright, transformstring);
            }
        }
        else {
            this.transformSet(this._txt, transformstring);
        }
        
        // save offset for further moves
        this._moveOffsetX += dx;
        this._moveOffsetY += dy;
    }

    transformSet(set, transformation) {
        set.forEach(el => {
            el.transform(transformation);
        });
    }


    createAddButton(relativePos) {
        let btnX = 0;
        let btnY = 0;
        let    r = 11;
        switch (relativePos) {
            case buttonpos.bottom:
                btnX = this._x + this.width / 2;
                btnY = this._y + this.height + r;
                break;
            case buttonpos.bottomright:
                btnX = this._x + this.width;
                btnY = this._y + this.height + r;
                break;
            case buttonpos.topright:
                btnX = this._x + this.width;
                btnY = this._y;
                break;
            case buttonpos.top:
                btnX = this._x + this.width / 2;
                btnY = this._y;
                break;
        }
        let addButton   = this._s.circle(btnX,btnY,11);
        addButton.attr({
            fill: "#3ca",
            stroke: "#000",
            strokeWidth: 1
        });
        let txt         = this._s.text((btnX-4),(btnY+3), "+");
        
        addButton.click(() => this.onAddButtonClickFn(this, relativePos));
        txt.click(() => this.onAddButtonClickFn(this, relativePos));

        let set = Snap.set(addButton, txt)
        set.bind("y", (y) => {
            txt.attr({y : y});
            addButton.attr({cy : y});
            return y;
        });
        set.bind("x", (x) => {
            txt.attr({x : x});
            addButton.attr({cx : x});
        });

        return set;
    }
    
    remove() {
        // move every element
        this._rect.remove();
        if(this._editable) {
            //                          TODO
        }
        else {
            this._txt.remove();
        }
        this._moveOffsetX = 0;
        this._moveOffsetY = 0;
    }

    asObj() {
        console.log(this._type == blocktype.definition);
        if(this._type == blocktype.definition) {
            let alts = this._altText.split(";");
            alts = alts.filter(alt => alt);
            return {
                x : this._x,
                y : this._y,
                text : this._text,
                type : this._type,
                name : this._nameText,
                alt : alts,
            }
        } else {
            return {
                x : this._x,
                y : this._y,
                nr : this._nr,
                text : this._text,
                type : this._type,
                parents : this._parents,
                children : this._children,
            }
        }
    }


    /*
        fn(hdif)   Parameters:
                        block   (obj) block who is rescaled
                        hdif    (number) height change in pixel
    */
    onRescale(fn) { this.onRescaleFn = fn }

    /*
        fn(relativePos)   Parameters:
                        block       (obj) block whose button was clicked
                        relativePos    (buttonpos) position of button (1-4)
    */
    onAddButtonClick(fn) { this.onAddButtonClickFn = fn }

    /*
        fn(p)   Parameters:
                        p    (obj) paragraph <p> element in which text is written
    */
    onSpecialLetter(letter, fn) {
        this._specialLetters.push(letter);
        this._specialLetterFns.push(fn);
    }
}
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
    constructor(snap, json) { // TODO: add params  editable & group?
        this._s     = snap;
        this._text  = json.text;
        this._text0 = json.text;
        this._nr    = json.nr;
        this._x     = json.x;
        this.con    = json.con;
        this._y     = json.y;
        this.hidden = false;
        this._type  = json.type; // blocktype:   prmise, proof, conclusion
        this._txtY  = 20;
        this._parents   = json.parents || [];
        this._children  = json.children || [];
        this._btns      = [];
        this._btnRadius = 11;
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
    get width() { return this._width; }
    get height() { return this._height; }
    set width(w) { this._width = w; }
    set height(h) { this._height = h; }
    set txtSize(t) { this._txtSize = t; }
    get x() { return parseInt(this._rect.attr("x")); }
    get y() { return parseInt(this._rect.attr("y")); }
    set x(x) {
        this._x = x;
        this._rect.attr({x: x});
        if(this._check)
            this._check.setAttributeNS(null, "transform", "translate(" + (this._x) + " " + (this._y) + ")");
        if(this._nrTxt)
            this._nrTxt.attr({x: x+20});
        if(this._btns.top) {
            this._btns.top.attr(     {x: x+this.width / 2});
            this._btns.topright.attr({x: x+this.width});
        }
        if(this._btns.bottom) {
            this._btns.bottom.attr(     {x: x+this.width / 2});
            this._btns.bottomright.attr({x: x+this.width});
        }
        this.updateForeignXY();
        
    }
    set y(y) {
        this._y = y;
        this._rect.attr({y: y});
        if(this._nrTxt)
            this._nrTxt.attr({y: y+20});
        if(this._btns.top) {
            this._btns.top.attr(     {y: y});
            this._btns.topright.attr({y: y});
        }
        if(this._btns.bottom) {
            this._btns.bottom.attr(     {y: y+this.height+this._btnRadius});
            this._btns.bottomright.attr({y: y+this.height+this._btnRadius});
        }
        this.updateForeignXY();
    }
    get tmpOffsetX() { return this._tmpOffsetX; }
    get tmpOffsetY() { return this._tmpOffsetY; }
    set tmpOffsetX(x) { this._tmpOffsetX = x; }
    set tmpOffsetY(y) { this._tmpOffsetY = y; }
    get nr() { return this._nr; }
    get text() { return this._text; }
    get textWithMJ() { return this._txt.textpar.innerHTML; }
    set text(text) {
        this._text = text;
        this._txt.textpar.innerHTML = text;
        this.onTextChange(this._txt.textpar);
    }
    get children() { return this._children };
    get parents() { return this._parents };
    get type() { return this._type; }
    get paragraphElement( ) { return this._txt.textpar; }
    get foreigns() { // this._check not included
        let fe = [this._txt];
        if(this._type == blocktype.definition) {
            fe.push(this._name, this._alt);
        }
        return fe;
    }
    addChild(child) { if(this._children.indexOf(child.nr) == -1) this._children.push(child.nr); }
    addParent(parent) { if(this._parents.indexOf(parent.nr) == -1) this._parents.push(parent.nr); }
    delChild(child) { this._children = this._children.filter( (val) => val != child.nr); }
    delParent(parent) { this._parents = this._parents.filter( (val) => val != parent.nr); }
    replaceChild(oldChild, newChild) {
        let i = this.children.indexOf(oldChild.nr);
        this.children[i] = newChild.nr;
    }
    replaceParent(oldPar, newPar) {
        let i = this.parents.indexOf(oldPar.nr);
        this.parents[i] = newPar.nr;
    }

    // Snap Elements:
    //      this._rect, this._nrTxt, this._btns.topright, this._btns.top, this._btns.bottomright, this._btns.bottom
    // Foreign Elements:
    //      this._txt, this._check,   (only as blocktype.definition:  this._name, this._alt )
    draw(editable, group){
        this._editable = editable;
        this._g = group;
        this._height = 0;
        let roundedCornerRadius = this._type == blocktype.definition ? 7 : 0;

        // draw rect
        this._rect  = this._s.rect(
                        0, 0,
                        this._width, this._height,
                        roundedCornerRadius
                    );
        group.add(this._rect);
                    
        // draw nr
        if(editable) {
            this._nrTxt = this._s.text(20, 20, this._nr);
            group.add(this._nrTxt);
        }
        
        if(this._type == blocktype.definition)
            this._height = this.drawDefElements(group, editable);

        // draw text
        this._txt = this.createForeignText(this._text, editable);
        this._height    += parseInt(this._txt.getAttribute("height"))+45;
        group.node.appendChild(this._txt);  // foreignObject
        
        // draw checkbox for conclusion
        if(editable && this._type != blocktype.premise && this._type != blocktype.definition) {
            this._check = this.createConclCheckbox();
            group.node.appendChild(this._check);  // foreignObject
        }

        
        // adjust rect height
        this._rect.attr({
            fill: "#4e5d6c",
            stroke: "#000",
            strokeWidth: 2,
            height : this._height,
        });


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

        // trigger positioning of blocks objects
        this.x = 0;
        this.y = 0;  
    }

    resetText() {
        this._text = this._text0;
    }

    setForeignXY(el,x,y) {
        el.setAttributeNS(null, "transform", "translate(" + x + " " + y + ")");
    }

    updateForeignXY() {
        this.setForeignXY(this._txt, this._x + 20, this._y + this._txtY);
        if(this._check)
            this.setForeignXY(this._check, this._x, this._y);
    }

    /*
        creates editable text element <p> and adds it in foreign container to SVG
    */
    createForeignText(text, editable, style){
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        myforeign.setAttribute("width", "350");
        myforeign.classList.add("foreign"); //to make div fit text

        var textdiv = document.createElement("div");
        textdiv.classList.add("divinforeign"); //to make div fit text

        var textpar = document.createElement("p");
        textpar.innerHTML = text;
        textpar.setAttribute('style', (style||''));
        textpar.className = "text-white";
        if(editable)
            textpar.setAttribute("contentEditable", "true");
        textpar.addEventListener("input", (ev) => this.onTextChange(ev.target, ev.data)); // ev.target is textpar
        myforeign.textpar = textpar;

        // append everything
        textdiv.appendChild(textpar);
        myforeign.appendChild(textdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
        
        myforeign.setAttribute("height", textpar.offsetHeight);
        return myforeign;
    }

    drawDefElements(group, editable) {
        let height  = 0;
        this._name  = this.createForeignText(this._nameText, editable);
        this.setForeignXY(this._name, this._x + 20, this._y + 20);
        this._name.textpar.classList.add("blockheader");
        this._name.textpar.classList.add("defheader");
        // this._name.textpar.setAttribute("width", 150);
        height      = parseInt(this._name.getAttribute("height"));
        this._alt   = this.createForeignText("["+this._altText+"]", editable);
        this.setForeignXY(this._alt, this._x + 20, this._y + height + 20);
        this._alt.textpar.classList.add("blockheader");
        this._alt.textpar.classList.add("defheader");
        height      += parseInt(this._alt.getAttribute("height"));
        group.node.appendChild(this._name);
        group.node.appendChild(this._alt);
        this._txtY  = height + 20;
        return height;
    }

    createConclCheckbox() {
        // <input type="checkbox" class="custom-control-input" id="customSwitch1" checked=""></input>
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        myforeign.setAttribute("width", "30");
        myforeign.setAttribute("height", "30");

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

        this.refreshHeight();
    }

    refreshHeight() {
        let h = 45;
        let hTxt = this._txt.textpar.offsetHeight || 1;
        this._txt.setAttribute("height", hTxt);
        h += hTxt;
        
        // set foreign element new height
        if(this._type == blocktype.definition) {
            let hName = this._name.textpar.offsetHeight;
            this._name.setAttribute("height", hName);
            let hAlt  = this._alt.textpar.offsetHeight;
            this._alt.setAttribute("height", hAlt);
            h += hName + hAlt;
            // adjust x,y of alt & txt
            this._alt.setAttributeNS(null, "transform", "translate(" +
                (this._x + 20) + " " + (this._y + 20 + hName) + ")");
            this._txt.setAttributeNS(null, "transform", "translate(" +
                (this._x + 20) + " " + (this._y + 20  + hName + hAlt) + ")");
        } else if(this._editable) {
            // set buttons new y
            this._btns.bottom.attr({ y : "+="+(h-this._height) });
            this._btns.bottomright.attr({ y : "+="+(h-this._height) });
        }

        // set rect new height
        this._rect.attr({height : h});
        this._height = h;

        // run additional method set by onRescale(fn)
        this.onRescaleFn();
    }

    transformSet(set, transformation) {
        set.forEach(el => {
            el.transform(transformation);
        });
    }


    createAddButton(relativePos) {
        let addButton   = this._s.circle(0,0,this._btnRadius);
        addButton.attr({
            fill: "#ef6c00",
            stroke: "#000",
            strokeWidth: 1
        });
        let txt         = this._s.text(-4,+3, "+");
        
        addButton.click(() => this.onAddButtonClickFn(this, relativePos));
        txt.click(() => this.onAddButtonClickFn(this, relativePos));

        let set = Snap.set(addButton, txt)
        set.bind("y", (y) => {
            txt.attr({y : y+3});
            addButton.attr({cy : y});
            return y;
        });
        set.bind("x", (x) => {
            txt.attr({x : x-4});
            addButton.attr({cx : x});
        });

        return set;
    }
    
    hide() {
        this._rect.node.classList.add("d-none");
        this._txt.classList.add("d-none");      
        this.hidden = true;  
    }
    
    show() {
        this._rect.node.classList.remove("d-none");
        this._txt.classList.remove("d-none");    
        this.hidden = false;
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
        let con = this.findConnections();
        
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
                con : con,
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
                con : con,
            }
        }
    }

    findConnections() {
        const regex = /<i id="([^"]+)">[^<]+<\/i>/gm; // thanks to https://regex101.com/
        let m;
        let con = [];

        while ((m = regex.exec(this._text)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            // m.forEach((match, groupIndex) => {
            //     console.log(`Found match, group ${groupIndex}: ${match}`);
            // });
            con.push(m[1]);
        }
        return con;
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
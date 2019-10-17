const blocktype   = { premise : 1, proof : 2, conclusion : 3 };
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
        this._s    = snap;
        this._text = json.text;
        this._nr   = json.nr;
        this._x    = json.x;
        this._y    = json.y;            
        this._type = json.type; // blocktype:   prmise, proof, conclusion
        this._parents  = json.parents;
        this._children = json.children;
        this._btns = [];

        this._specialLetters   = [];
        this._specialLetterFns = [];
        this.onRescale = function() {};
        this.onAddButtonClick = function() {};

        this._moveOffsetX = 0;
        this._moveOffsetY = 0;
    }
    
    get width() { return parseInt(this._rect.attr("width")); }
    get height() { return parseInt(this._rect.attr("height")); }

    draw(editable){
        this._editable = editable;

        // draw rect
        const width = 350;
        let  height = 150;
        this._rect  = this._s.rect(
                        this._x, this._y,
                        width, height,
                        8
                    );
                    
        // draw nr
        if(editable)
            this._nrTxt = this._s.text(+ this._x + 20,
                            + this._y + 20, this._nr);

        // draw text
        this._txt = []; // init as object
        if(editable) {
            this._txt = this.createForeignText();
            height    = parseInt(this._txt.getAttribute("height"))+45;
        } else {
            let txtcnt = 0;
            this._txt = Snap.set();

            this._text.split('<br>').forEach(line => {
                txtcnt++;
                let t = this._s.text(+ this._x + 20,
                        + this._y + 20 + txtcnt*15, line);
                this._txt.push(t);
            }); 

            height = txtcnt*15+45;
        }
        
        // adjust rect height
        this._rect.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 5,
            height : height,
        });


        // draw buttons
        if(editable) {
            if(this._type != blocktype.premise) { // premise has no top or topright button
                this._btns.topright = this.createAddButton(buttonpos.topright);
                this._btns.top      = this.createAddButton(buttonpos.top);
            }
            this._btns.bottomright  = this.createAddButton(buttonpos.bottomright);
            this._btns.bottom       = this.createAddButton(buttonpos.bottom);
        }
    }

    /*
        creates editable text element <p> and adds it in foreign container to SVG
    */
    createForeignText(){
        var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
        myforeign.setAttribute("width", "350");
        myforeign.classList.add("foreign"); //to make div fit text
        myforeign.setAttributeNS(null, "transform", "translate(" + (this._x + 20) + " " + (this._y + 20) + ")");

        var textdiv = document.createElement("div");
        textdiv.classList.add("divinforeign"); //to make div fit text

        var textpar = document.createElement("p");
        textpar.innerHTML = this._text;
        textpar.setAttribute('style', 'white-space: pre;');
        textpar.className = "text-secondary";
        textpar.setAttribute("contentEditable", "true");
        textpar.setAttribute("width", "auto");
        textpar.addEventListener("input", (ev) => this.onTextChange(ev.target, ev.data)); // ev.target is textpar   

        // append everything
        textdiv.appendChild(textpar);
        myforeign.appendChild(textdiv);
        document.getElementById("drawsvg").appendChild(myforeign);
        
        myforeign.setAttribute("height", textpar.offsetHeight);
        return myforeign;
    }

    onTextChange(p, data) { //p is HTMLParagraphElement
        this._text = p.innerHTML;
        // if(data == '@')
            // showTitles((title) => p.innerHTML = p.innerHTML+title);        //TODO
        for (let i = 0; i < this._specialLetters.length; i++) {
            if(data == this._specialLetters[i])
                this._specialLetterFns[i](p);
        }


        let h      = p.offsetHeight;
        this.rescale(h+45);
    }

    rescale(newY) {
        let oldh   = parseInt(this.height);
        let hdif   = newY - oldh;

        // set rect new height
        this._rect.attr({height : newY});
        // set foreign element new height
        this._txt.setAttribute("height", this.height);
        // set buttons new height
        this._btns.bottom.attr({ y : this._y + this.height +15 });
        this._btns.bottomright.attr({ y : this._y + this.height +15 });


        // run additional method set by onRescale(fn)
        this.onRescale(hdif);
    }

    move(dx, dy) {
        this._x = this._x + dx;
        this._y = this._y + dy;
        
        // move every element
        this._rect.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
        if(this._editable) {
            this._txt.setAttributeNS(null, "transform", "translate( " + (this._x+20) + " " + (this._y+20) + ")");
            this._btns.bottom.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
            this._btns.bottomright.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
            if(this._type != blocktype.premise) {
                this._btns.top.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
                this._btns.topright.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
            }
        }
        else {
            this._txt.forEach(el => {
                el.transform("t"+(this._moveOffsetX+dx)+","+(this._moveOffsetY+dy));
            });
        }
        
        // save offset for further moves
        this._moveOffsetX += dx;
        this._moveOffsetY += dy;
    }

    createAddButton(relativePos) {
        let btnX = 0;
        let btnY = 0;
        switch (relativePos) {
            case buttonpos.bottom:
                btnX = this._x + this.width / 2;
                btnY = this._y + this.height +15;
                break;
            case buttonpos.bottomright:
                btnX = this._x + this.width;
                btnY = this._y + this.height +15;
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
        let addButton   = this._s.circle(btnX,btnY,15);
        addButton.attr({
            fill: "#bada55",
            stroke: "#000",
            strokeWidth: 3
        });
        let txt         = this._s.text(+addButton.attr("cx"),
                            +addButton.attr("cy"), "+");
            
        addButton.click(() => this.onAddButtonClick(relativePos));

        let set = Snap.set(addButton, txt)
        set.bind("y", (y) => {
            txt.attr({y : y});
            addButton.attr({cy : y});
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
    }


    /*
        fn(hdif)   Parameters:
                        hdif    (number) height change in pixel
    */
    onRescale(fn) { this.onRescale = fn }

    /*
        fn(relativePos)   Parameters:
                        relativePos    (buttonpos) position of button (1-4)
    */
    onAddButtonClick(fn) { this.onAddButtonClick = fn }

    /*
        fn(p)   Parameters:
                        p    (obj) paragraph <p> element in which text is written
    */
    onSpecialLetter(letter, fn) {
        this._specialLetters.push(letter);
        this._specialLetterFns.push(fn);
    }

}
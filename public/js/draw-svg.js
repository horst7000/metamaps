const s = Snap("#drawsvg");
let rectcounter = 0;
window.onload = init();

      

function init() {
    const btnX = 650;
    let addButton = s.circle(btnX,50,30);
    addButton.attr({
        fill: "#bada55",
        stroke: "#000",
        strokeWidth: 5
    });
    s.text(+addButton.attr("cx"),
        +addButton.attr("cy"), "+");

    let delButton = s.circle(btnX,120,30);
    delButton.attr({
        fill: "#55adb5",
        stroke: "#000",
        strokeWidth: 5
    });
    s.text(+delButton.attr("cx"),
        +delButton.attr("cy"), "-");

    addButton.click(() => {
        if(rectcounter < 5) {
            createRect();
            rectcounter++;
        }
    });
}

function createRect() {
    const width  = 350,
          height = 150;

    let rect = s.rect(
                    40, 40 + rectcounter*(height+20),
                    width, height,
                    10);
    rect.attr({
        fill: "#bada55",
        stroke: "#000",
        strokeWidth: 5
    });
    var t1 = s.text(+rect.attr("x") + 20,
                +rect.attr("y") + 20, "Snap");
    createText(+rect.attr("x") + 20,
                +rect.attr("y") + 20, "edit me");
}

function createText(x,y,text) {
    var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    var textdiv = document.createElement("div");
    var textpar = document.createElement("p");
    var textnode = document.createTextNode(text);
    textpar.appendChild(textnode);
    textpar.className = "text-secondary";
    textdiv.appendChild(textpar);
    textdiv.setAttribute("contentEditable", "true");
    textdiv.setAttribute("width", "auto");
    myforeign.setAttribute("width", "100%");
    myforeign.setAttribute("height", "100%");
    myforeign.classList.add("foreign"); //to make div fit text
    textdiv.classList.add("divinforeign"); //to make div fit text
    //textdiv.addEventListener("mousedown", elementMousedown, false);
    myforeign.setAttributeNS(null, "transform", "translate(" + x + " " + y + ")");
    myforeign.appendChild(textdiv);
    document.getElementById("drawsvg").appendChild(myforeign);
}


loadSVGinURL();


function loadSVGinURL() {
    // load svg
    const urlpathname = window.location.pathname;
    const paths = urlpathname.split("/")
    fetch('/api/def/' + paths[paths.length-1])
      .then((res) => 
          res.json()
      )
      .then((json) => {
        if(json[0].inner)
            document.getElementById("drawsvg").innerHTML = unescapeHtml("" + json[0].inner);
        console.log(unescapeHtml("" + json[0].inner));
      });
  }





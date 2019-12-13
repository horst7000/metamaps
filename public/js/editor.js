const editor = (function() {
    const s         = Snap("#drawsvg");
    let   tribute   = {};
    let   blocks    = [];
    let   titlemenu = [];
    let   theorem   = [];
    let   definition    = {};
    let   g             = s.g();
    g.transform(Snap.matrix(1,0,0,1,40,40));
    let   isDefeditor   = false;

    async function showTitles(onSelect) {
        let r = s.rect(0, 0, 150, 200).attr({fill: "#aac"});
        titlemenu.push(r);
        const titles = await loadTitlesWithIdFromAPI(); //pair = { title: title, id: id}
        
        let i = 0;
        titles.forEach(pair => {
            let t = s.text(0, 20+15*i, pair.title);
            t.attr({width: 150});
            t.hover(() =>t.attr({fill:"#a11"}),
                    () =>t.attr({fill:"black"}));
            t.click(() => {
                onSelect(pair.title+"["+pair.id+"]");
                hideTitles();
            });
            
            titlemenu.push(t);
            i++;
        });
    }

    function hideTitles() {
        titlemenu.forEach(el => {
            el.remove();
        });
    }
    
    //TO DO: mouse and keyboard listener for selection (arrows, input, return, esc)
    // text array of menu entries for navigation?


    async function loadBlocksfromAPI() {
        // get svg elements form API
        const urlpathname = window.location.pathname;
        const paths = urlpathname.split("/");
        isDefeditor = (paths[paths.length-2] == "def");
        await setupTribute();

        if(isDefeditor) {
            defId = paths[paths.length-1];
            fetch('/api/def/' + defId)
                .then((res) => 
                    res.json()
                )
                .then((json) => {
                    setupDefinitions(json);
                });
        } else {
            theId = paths[paths.length-1];
            fetch('/api/the/' + theId)
                .then((res) => 
                    res.json()
                )
                .then((json) => {
                    setupTheorems(json);
                });                
        }


    }

    function setupTheorems(json) {
        theorem = new Theorem(s, json);
        theorem.addToGroup(g);
        theorem.tribute = tribute;
        theorem.draw(true);
        // theorem.onSpecialLetter('@', (p) => showTitles((title) => p.innerHTML = p.innerHTML+title));
    }

    function setupDefinitions(json) {
        definition = new Definition(s, json);
        definition.addToGroup(g);
        definition.tribute = tribute;
        definition.draw(true);
        // def.onSpecialLetter('@', (p) => showTitles((title) => p.innerHTML = p.innerHTML+title));
    }    
    
    async function setupTribute() {
        // returns { key: title, id: id, value: title or alternative,
        //  type: "the/" or "def/"}
        titles = await loadTitlesWithIdFromAPI(); 
        tribute = new Tribute({
            values: titles,  // values needs to have atleast {key:, id:}
            selectTemplate: function(item) {
                return (
                    "<i id=" + item.original.id + ">" + item.original.value + "</i>"
                );
            }
        });
    }
    
    function loadTitlesWithIdFromAPI() {
        return new Promise(resolve => {
            fetch('/api/titles')
                .then((res) => resolve(res.json()));
        });
    }

    (function init() {
        loadBlocksfromAPI();
        document.addEventListener('keydown', (e) => (e.key === "Escape") ? hideTitles() : null);
        s.attr({height: "1200px"});
    })();
    


    /*
        returns an Array of reduced block objects containing
        text, nr, x, y, type, parents, children
    */
    function getBlocks() {
        let blockObj = [];
        theorem.blocks.forEach((block) => blockObj.push(block.asObj()));
        return blockObj;
    }

    /*
        returns an Array of reduced block objects containing
        name, symbol, description, superdef
    */
    function getDef() {
        return definition.asObj();
    }

    return {
        getBlocks : getBlocks,
        getDef : getDef
    };

})();






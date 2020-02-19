module.exports = {
    calculatePositions : calculatePositions,
    prepareForUpdate : prepareForUpdate
}

function prepareForUpdate(defs, ths, tags) {
    // combine sets
    let vertices = [];
    ths.forEach(th => {
        th.cx = th.x+150;
        th.con = [];
        th.blocks.forEach(bl => {
            th.con = th.con.concat(bl.con);
        });
        vertices.push(th);
        th.forceX = 0;
        th.forceY = 0;
    });
    defs.forEach(def => {
        def.cx = def.x+150;
        def.con = def.block.con;
        vertices.push(def);
        def.forceX = 0;
        def.forceY = 0;
    });
    tags.forEach(tag => {
        tag.con     = [];
        tag.forceX  = 0;
        tag.forceY  = 0;
        tag.fontSize  = 60 + 7*tag.usedByIds.length;
        tag.cx        = tag.x + tag.fontSize/2 * tag.name.length/2;
    });
    
    // add connected tag ids
    // defs/ths (vertices) operate like edges between tags
    vertices.forEach(el => {
        el.tags.split(/; */).forEach(tagA => {
            if(tagA == "") return;
            
            let tag = tags.filter(t => t.name == tagA)[0];
            if(!tag) return;
            
            el.tags.split(/; */).forEach(tagB => {
                if(tagB != "" && tagA != tagB) {
                    let conTag = tags.filter(el => el.name == tagB)[0];
                    if(!conTag) return;
                    // if(tag.con.indexOf(conTag._id) != -1) return; // already connected
                    tag.con.push(conTag._id);
                }
            });
        });
    });

    tags.forEach((tag,i) => {
        tag.conCount = [];
        let con = [];
        tag.con.forEach((tagId,j) => {
            let firstIndex = tag.con.indexOf(tagId);
            if(j == firstIndex) { // first appearance
                tag.conCount.push(1);
                con.push(tag.con[j]);
            } else {
                tag.conCount[con.indexOf(tagId)]++;
                tag.con[j] = "";
            }
        });
        tag.con = con;

        // handle new tags as other vertices
        // if(tag.usedByIds.length > 1 || tag.usedByIds.length == 0) return;
        // let tagAsVertex = Object.assign({}, tag);
        // tagAsVertex.con = tagAsVertex.usedByIds;
        // vertices.push(tagAsVertex);
    });

    return { vertices: vertices, tags: tags };
}

function calculatePositions(vertices,tags,repetitions=1, callback) {
    for (let i = 0; i < repetitions; i++) {
        // calculate forces
        calcForces(vertices,tags)
        
        // update position without DB
        vertices.forEach(el => {
            let fx = Math.floor(el.forceX);
            let fy = Math.floor(el.forceY);
            if(isNaN(fx) || isNaN(fy)) console.log(fx + " " + fy + " " + (el.name || el.title));
            el.x  +=fx;
            el.cx +=fx;
            el.y  +=fy;
            el.forceX = 0;
            el.forceY = 0;
        });
    }

    callback(vertices);
}

function calcForces(vertices,tags) {
    vertices.forEach(elA => {
        vertices.forEach(elB => {
            let force = repulsiveForce(elA,elB);
			elA.forceX += force.x;
            elA.forceY += force.y;
            logForce(elA,elB,force.x,force.y,"repA");
            
        });
        force = gravity(elA,tags);
        elA.forceX += force.x;
        elA.forceY += force.y;

        elA.con.forEach(conID => {
            elCon = findByID(conID,vertices);

            let force = attractiveForce(elA,elCon);
			elA.forceX += force.x;
            elA.forceY += force.y;
            logForce(elA,elCon,force.x,force.y,"attrA");
                
            force = attractiveForce(elCon,elA);
            elCon.forceX += force.x;
            elCon.forceY += force.y;
            logForce(elA,elCon,force.x,force.y,"attrCon");
        });
    });
}

function logForce(elA, elB, dfx, dfy, name) {
    if(isNaN(elA.forceX) || isNaN(elA.forceY))
        console.log(name+" "+ dfx + " " + dfy + " " + (elA.name || elA.title)
                + " <> "+(elB.name || elB.title));
}

function effectiveDist(a,b) {
    return Math.sqrt(Math.pow(a.cx-b.cx,2) + Math.pow(a.y-b.y,2)) - defaultDist(a,b);
}

function defaultDist(a,b) {
    // ~150 is max.distance from center to edge
    let sizeA   = (a.usedByIds) ? 200*Math.sqrt(a.usedByIds.length) : 190;
    let sizeB   = (b.usedByIds) ? 200*Math.sqrt(b.usedByIds.length) : 190;
    // let sizeA   = 150;
    // let sizeB   = 150;
    let bInA    = (a.usedByIds) ? a.con.indexOf(b._id) : -1;
    let overlap = (bInA != -1) ? Math.pow(a.conCount[bInA],1/4)*400 : 0;
    return sizeA + sizeB - overlap;
}

function normDist(a,b) {
    let dist = Math.sqrt(Math.pow(a.cx-b.cx,2) + Math.pow(a.y-b.y,2));
    return { dx : (b.cx-a.cx)/dist, dy : (b.y-a.y)/dist};
}

const c0 = 500;
function repulsiveForce(a,b) {  // repulsive force applying on a.   a' <-f-- a    b
    // let degA = (a.usedByIds) ? a.usedByIds.length : a.con.length;
    // let degB = (b.usedByIds) ? b.usedByIds.length : b.con.length; // TODO?: number of INcoming edges
    let degA = a.con.length;
    let degB = b.con.length; // TODO?: number of INcoming edges
    
    if(a._id == b._id)
    return {x:0, y:0};
    
    let d = effectiveDist(a,b);
    if(d<=5) {
        dx    = -100+Math.floor(Math.random()*200)
        a.x  += dx;
        a.cx += dx;
        a.y  += -100+Math.floor(Math.random()*200);
        d = 5;
        // console.log(`Body check ${(a.name||a.title)} <>  ${(b.name||b.title)} `);
    }
    let norm = normDist(a,b);

    let x = c0*Math.sqrt((degA+1)*(degB+1))/Math.pow(d,0.96) * (-norm.dx);
    let y = c0*Math.sqrt((degA+1)*(degB+1))/Math.pow(d,1.06) * (-norm.dy);
    if(y > 1000 || isNaN(y))
        console.log(`${c0}*${(degA+1)}*${(degB+1)}/${Math.pow(d,0.95)} * ${(-norm.dy)} = ${y} `+
                    `  ${(a.name||a.title)} <>  ${(b.name||b.title)} `);
    return {
        x:x,
        y:y
    };
}

// c1 = 8 * 1E-2;    1.3*1E-1
function attractiveForce(a,b) { // attractive force applying on a.   a --f-> a' b
    const c1 = 0.48*1E-1; // attractive
    let d    = effectiveDist(a,b);
    let norm = normDist(a,b);

    if(a._id == b._id || d <= 0)
        return {x:0, y:0};
    
    return {
        x: c1*(d) * norm.dx,
        y: c1*(d) * norm.dy
    };
}

// c2 = 4*1E-2;     1.7*1E-2
function gravity(a,tags) {
    const c2 = 9*1E-3;
    let c2_tag = 1;
    let degA = a.con.length;

    if(tags == null) {   // a is a tag itself
        tags = [{cx:0, y:0}];
        c2_tag = 0.1;
    }

    let x = 0;
    let y = 0;
    tags.forEach(tag => {
        if(!tag._id || tag.usedByIds.indexOf(a._id) != -1) { // tag without id is 0,0
            x += c2_tag*c2*(degA+0.3) * (tag.cx-a.cx);
            y += c2_tag*c2*(degA+0.3) * (tag.y-a.y);
        }
    });

    return {
        // x: -c2*Math.pow(d,1) * (degA+0.3) * a.x/d,
        // y: -c2*Math.pow(d,1) * (degA+0.3) * a.y/d,
        x: x,
        y: y,
    };
}


function findByID(id,vertices) {
    for (let i = 0; i < vertices.length; i++)
        if (vertices[i]._id == id)
            return vertices[i];
}
const express = require("express");
const Datastore = require('nedb');

// init database and express
const dbTheorems    = new Datastore("db/theorems.db");
dbTheorems.loadDatabase();
const dbDefinitions = new Datastore("db/definitions.db");
dbDefinitions.loadDatabase();
const dbTags = new Datastore("db/tags.db");
dbTags.loadDatabase();

const app = express();
app.listen(3000, () => console.log("listening on Port 3000"));
app.use(express.static("public"));  
app.use(express.json()) // for parsing application/json

// configure pug
app.set('views', './templates')
app.set('view engine', 'pug')

// routing
app.get('/bla', (req, res) => 
    res.send({data: "Homepage"})
);

function getAllTheorems() {
    return new Promise(resolve => {
        dbTheorems.find({}, (err, docs) => {
            // console.log(docs);        
            resolve(docs);
        });
    });
}

function getTheoremHeader(id) {
    return new Promise(resolve => {
        dbTheorems.find({ _id: id }, (err, docs) => {
            if(docs.length > 0 && !err) 
                resolve({title: docs[0].title, tags: docs[0].tags});
            
        });
    });
}

function getAllDefinitions() {
    return new Promise(resolve => {
        dbDefinitions.find({}, (err, docs) => {
            resolve(docs);
        });
    });
}

function getDefinitionHeader(id) {
    return new Promise(resolve => {
        dbDefinitions.find({ _id: id }, (err, docs) => {
            if(docs.length > 0 && !err)
            resolve({title: docs[0].title, tags: docs[0].tags});
        });
    });
}

function getAllTags() {
    return new Promise(resolve => {
        dbTags.find({}, (err, docs) => {
            resolve(docs);
        });
    });
}


// --------------  not used ---------
// function findID(id) {
//     return new Promise(resolve => {
//         database.find({ _id: id }, (err,docs) => {
//             console.log(docs);
//             resolve(docs);
//         });
//     });
// }

app.route("/")
    .get( async (req,res) => {
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
        res.render('root', { definitions : defs, theorems : thes});
    });

app.route("/the/:id") 
    .get( async (req,res) => {
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
        const h = await getTheoremHeader(req.params.id); 
        res.render('edit', {
            definitions : defs,
            theorems : thes,
            title : h.title,
            tags : h.tags,
            theorem : true
        });
    });

app.route("/def/:id") 
    .get( async (req,res) => {
        const defs = await getAllDefinitions();
        const thes = await getAllTheorems();
        const h = await getDefinitionHeader(req.params.id); 
        res.render('edit', {
            definitions : defs,
            theorems : thes,
            title : h.title,
            tags : h.tags,
            definition : true
        });
    });

app.route("/view")
    .get( async (req,res) => {
        const docs = await getAllTheorems();
        res.render('viewmap');
    });


app.route("/api/the")
    .post((req,res) => { // new theorem
        const data = req.body;
        dbTheorems.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all theorems
        dbTheorems.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/def")
    .post((req,res) => { // new definiton
        const data = req.body;
        dbDefinitions.insert(data, (err, newDoc) => {
            res.send({_id: newDoc._id, title: newDoc.title});
        });
    })
    .get((req,res) => { // return all definitions
        dbDefinitions.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/tags")
    .get((req,res) => { // return all tags
        dbTags.find({}, (err,docs) => {
            res.json(docs);
        });
    });

app.route("/api/the/titles")
    .get((req,res) => { // return all titles with Ids
        dbTheorems.find({}, (err,docs) => {
            let data = [];
            docs.forEach(el => {
                data.push({key: el.title, id: el._id});
            });
            res.json(data);
        });
    });

app.route("/api/def/titles")
    .get((req,res) => { // return all titles with Ids
        dbDefinitions.find({}, (err,docs) => {
            let data = [];
            docs.forEach(el => {
                data.push({key: el.title, id: el._id});
            });
            res.json(data);
        });
    });

app.route("/api/titles")
    .get((req,res) => { // return all titles with Ids
        let data = [];
        dbTheorems.find({}, (err,docs) => {
            docs.forEach(el => {
                data.push({
                    key: el.title,
                    id: el._id,
                    value: el.title,
                    type: "the/"
                });
            });
            dbDefinitions.find({}, (err,docs) => {
                docs.forEach(el => {
                    data.push({
                        key: el.title,
                        id: el._id,
                        value: el.title,
                        type: "def/"
                    });

                    el.block.alt.forEach(alt => {
                        data.push({
                            key: el.title+": "+alt,
                            id: el._id,
                            value: alt,
                            type: "def/"
                        });
                    });
                });
                res.json(data);
            });
        });
    });


app.route("/api/the/:id")
    .get((req,res) => {
        dbTheorems.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put(async (req,res) => {
        const tags  = req.body.pop();
        const title = req.body.pop();
        const data  = req.body;
        dbTheorems.update({ _id: req.params.id }, { $set: { title: title, blocks : data, tags: tags } }, {});
        await updateTags(req.params.id, tags.split(/; */));

        res.json(data);
        updatePositions(10);
    });


app.route("/api/def/:id")
    .get((req,res) => {
        dbDefinitions.find({ _id: req.params.id }, (err,docs) => {
            res.json(docs[0]);
        });
        
    })
    .put(async (req,res) => {
        const title = req.body.title;
        const tags  = req.body.tags;
        delete req.body.title;
        delete req.body.tags;
        const data  = req.body;
        dbDefinitions.update({ _id: req.params.id }, { $set: { title: title, block: data, tags: tags } }, {});
        await updateTags(req.params.id, tags.split(/; */));

        res.json(data);
        updatePositions(10);
    });

function updateTags(usedById, tags) {
    if(tags.length == 1 && !tags[0])
        tags = ["null"]; //default tag (invisible)

    // check if tag still used in objects of usedByIds
    // tags == query(tags with usedById in tag.usedByIds)
    dbTags.find({ usedByIds: { $elemMatch: usedById } }, (err, docs) => {
        // docs = previous tags of usedById
        docs.forEach(doc => {
            // is tag still used by usedById (is doc.name in tags)?
            let found = tags.find((tag) => tag == doc.name );
            if(!found)
                dbTags.update({ _id: doc._id }, { $pull: { usedByIds: usedById } });
        });
    });

    // add new tags / add id to existing tags
    tags.forEach(tag => {
        if(tag == "") return;
        let data = {
            name: tag,
            color: "rgb(78, 93, "+(Math.floor(Math.random()*158))+")", 
            x: 0,
            y: 0,
            usedByIds: [usedById],
            con: [],
        };

        dbTags.findOne({ name: tag }, (err, doc) => {
            if(doc == null) { // create new tag
                dbTags.insert(data);
            } else { // add def/the id to existing tags
                dbTags.update({ _id: doc._id }, { $addToSet: { usedByIds: usedById } });
            }
        });
    });
    
    dbTags.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});
    dbTags.remove({ usedByIds: [] }, {multi: true});
}











// ###################################
// 
// 
// 
// position stuff

app.route("/api/positions") //TMP (get changes DB)
    .get(async (req,res) => {
        await updatePositions(1);
        let data = [];
        dbDefinitions.find({}).projection({x:1, y:1}).exec((err, defs) => {
            dbTheorems.find({}).projection({x:1, y:1}).exec((err, ths) => {
                dbTags.find({}).projection({x:1, y:1}).exec((err,tags) => {
                    data = data.concat(defs, ths, tags);
                    res.json(data);
                });
            });
        });
    });

app.route("/api/positions/reset") // temporary
    .get(async (req,res) => {
        dbTags.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbDefinitions.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbTheorems.update({ }, { $set: { x: 0, y: 0} }, {multi : true});  

        res.json();
    });

app.route("/api/positions/update") // temporary
    .get(async (req,res) => {
        dbTags.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbDefinitions.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        dbTheorems.update({ $or: [{ x : null }, { y : null }] }, { $set: { x: 0, y: 0} }, {multi : true});  
        updatePositions(200);

        res.json();
    });

async function updatePositions(repetitions) {
    // preparation
    let defs = await getAllDefinitions();
    let ths  = await getAllTheorems();
    let tags = await getAllTags();

    // combine sets
    let vertices = [];
    ths.forEach(th => {
        th.con = [];
        th.blocks.forEach(bl => {
            th.con = th.con.concat(bl.con);
        });
        vertices.push(th);
        th.forceX = 0;
        th.forceY = 0;
    });
    defs.forEach(def => {
        def.con = def.block.con;
        vertices.push(def);
        def.forceX = 0;
        def.forceY = 0;
    });

    // prepare nulltag
    let nulltag = tags.filter(tag => tag.name == "null")[0];
    if(nulltag) nulltag.forceX  = 0;
    if(nulltag) nulltag.forceY  = 0;
    
    // add connected tag ids
    // defs/ths (vertices) operate like edges between tags
    vertices.forEach(el => {
        el.tags.split(/; */).forEach(tagA => {
            if(tagA == "") return;
            
            let tag = tags.filter(t => t.name == tagA)[0];
            if(!tag) return;
            
            tag.con     = [];
            tag.forceX  = 0;
            tag.forceY  = 0;
            
            el.tags.split(/; */).forEach(tagB => {
                if(tagB != "" && tagA != tagB) {
                    tag.con.push(tags.filter(el => el.name == tagB)[0]._id);
                }
            });
        });
    });
    
    // acutally calculate and update positions
    await calcAndUpdatePositions(tags,null,repetitions);    
    await calcAndUpdatePositions(vertices,tags,repetitions);    
}

async function calcAndUpdatePositions(vertices,tags,repetitions=1) {
    for (let i = 0; i < repetitions; i++) {
        // calculate forces
        calcForces(vertices,tags)
        
        // update position without DB
        vertices.forEach(el => {
            let fx = Math.floor(el.forceX);
            let fy = Math.floor(el.forceY);
            el.x +=fx;
            el.y +=fy;
            el.forceX = 0;
            el.forceY = 0;
        });
    }

    // update position in DB
    vertices.forEach(el => {
        let fx = Math.floor(el.forceX);
        let fy = Math.floor(el.forceY);
        el.forceX = 0;
        el.forceY = 0;
        
        new Promise(resolve => {
            if(el.blocks)
                dbTheorems.update({ _id: el._id }, { $set: { x: el.x+fx, y: el.y+fy} },{resolve});
            else if (el.block)
                dbDefinitions.update({ _id: el._id }, { $set: { x: el.x+fx, y: el.y+fy} },{resolve});
            else
                dbTags.update({ _id: el._id }, { $set: { x: el.x+fx, y: el.y+fy, con: el.con} },{resolve});
        });
    });
}

function calcForces(vertices,tags) {
    vertices.forEach(elA => {
        vertices.forEach(elB => {
            let force = repulsiveForce(elA,elB);
			elA.forceX += force.x;
            elA.forceY += force.y;
            
        });
        force = gravity(elA,tags);
        elA.forceX += force.x;
        elA.forceY += force.y;

        elA.con.forEach(conID => {
            elCon = findByID(conID,vertices);

            let force = attractiveForce(elA,elCon);
			elA.forceX += force.x;
            elA.forceY += force.y;

            force = attractiveForce(elCon,elA);
			elCon.forceX += force.x;
            elCon.forceY += force.y;
        });
    });
}

function dist(a,b) {
    // ~150 is max.distance from center to edge
    let sizeA = (a.usedByIds) ? 150+a.usedByIds.length*40 : 150;
    let sizeB = (b.usedByIds) ? 150+b.usedByIds.length*40 : 150;
    return Math.sqrt(Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2)) - sizeA - sizeB;
}

const c0 = 500; // repulsive
function repulsiveForce(a,b) {
    let degA = a.con.length;
    let degB = b.con.length; // TODO?: number of INcoming edges
 
    
    if(a._id == b._id)
        return {x:0, y:0};

    let d = dist(a,b);
    if(d<=50) {
        a.x += -25+Math.floor(Math.random()*50);
        a.y += -25+Math.floor(Math.random()*50);
        d = 50;
    }
    let x = c0*Math.sqrt((degA+1)*(degB+1))/Math.pow(d,1.9) * (a.x-b.x);
    let y = c0*Math.sqrt((degA+1)*(degB+1))/Math.pow(d,2) * (a.y-b.y);
    if(x > 1000)
        console.log(`${c0}*${(degA+1)}*${(degB+1)}/${Math.pow(d,2)} * ${(a.x-b.x)} = ${x}`);
    return {
        x:x,
        y:y
    };
}

// c1 = 8 * 1E-2;
function attractiveForce(a,b) {
    const c1 = 8*1E-2; // attractive
    let d = dist(a,b);
    let defaultDist = 180;

    if(a._id == b._id || d <= 0)
        return {x:0, y:0};
    
    return {
        x:-c1*(d-defaultDist) * (a.x-b.x)/d,
        y:-c1*(d-defaultDist/3) * (a.y-b.y)/d
    };
}

// c2 = 4*1E-2;
function gravity(a,tags) {
    const c2 = 2.5*1E-2;
    let degA = a.con.length;
    let d = Math.sqrt(Math.pow(a.x,2) + Math.pow(a.y,2));

    if(tags == null) // a is a tag itself
        tags = [{x:0, y:0}];

    let x = 0;
    let y = 0;
    tags.forEach(tag => {
        if(!tag._id || tag.usedByIds.indexOf(a._id) != -1) { // tag without id is 0,0
            x += c2*(degA+0.3) * (tag.x-a.x);
            y += c2*(degA+0.3) * (tag.y-a.y);
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
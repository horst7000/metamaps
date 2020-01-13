function fetchPostTheorem() {  
  const options = { //for fetch
    method: 'POST',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({   
      title : "neu",
      blocks : [{  // default block
          x: 0,
          y: 0,
          text: "edit me",
          nr: 1,
          type: 1,  // = blocktype.premise
          con: [],
      }],
      x:0,
      y:0
    })
  }
  fetch('/api/the', options) // POST
    .then((res) => 
      res.json()
    )
    .then((json) => {
      console.log(json._id);
      window.location.href = "/the/" + json._id;
    });
}

function fetchPostDef() {  
  const options = { //for fetch
    method: 'POST',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({   
      title : "neu",
      block : {  // default block
          x: 0,
          y: 0,
          text: "edit me",
          name: "name",
          alt: ["alternative"],
          type: 4,  // = blocktype.definition
          con: [],
      },
      x:0,
      y:0,
    })
  }
  fetch('/api/def', options) // POST
    .then((res) => 
      res.json()
    )
    .then((json) => {
      console.log(json._id);
      window.location.href = "/def/" + json._id;
    });
}

function fetchPutTheorem() { 
  // const data = s.toJSON();
  // const data = document.getElementById("drawsvg").innerHTML;
  let   data = editor.getBlocks();
  let  title = document.getElementById("titleInput").value || "default";
  data.push(title);
  let  tags = document.getElementById("tagInput").value;
  data.push(tags);
  console.log(data);
  const options = {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  }
  const urlpathname = window.location.pathname;
  const paths = urlpathname.split("/")
  fetch('/api/the/' + paths[paths.length-1], options);
}

function fetchPutDefinition() { 
  let   data = editor.getDef();
  let  title = document.getElementById("titleInput").value || "default";
  data.title = title;
  data.tags = document.getElementById("tagInput").value;
  console.log(data);
  const options = {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  }
  const urlpathname = window.location.pathname;
  const paths = urlpathname.split("/")
  fetch('/api/def/' + paths[paths.length-1], options);
}

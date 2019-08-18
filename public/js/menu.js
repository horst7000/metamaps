function fetchPostDef() {  
  const options = { //for fetch
    method: 'POST',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ })
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

function fetchPutDef() { 
  // const data = s.toJSON();
  const data = document.getElementById("drawsvg").innerHTML;
  const options = {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(drawer.getBlocks())
  }
  const urlpathname = window.location.pathname;
  const paths = urlpathname.split("/")
  fetch('/api/def/' + paths[paths.length-1], options);
      // .then((res) => 
      //     res.json()
      // )
      // .then((json) => {
      //     console.log(json);
      // });
}

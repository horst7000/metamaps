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

function escapeHtml(unsafe) {
  return unsafe
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}
function unescapeHtml(safe) {
  return safe
       .replace(/&amp;/g, "&")
       .replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">")
       .replace(/&quot;/g, "\"")
       .replace(/&#039;/g, "\'");
}

function fetchPutDef() { 
  // const data = s.toJSON();
  const data = document.getElementById("drawsvg").innerHTML;
  const options = {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ inner : escapeHtml(data) })
  }
  const urlpathname = window.location.pathname;
  const paths = urlpathname.split("/")
  fetch('/api/def/' + paths[paths.length-1], options)
      .then((res) => 
          res.json()
      )
      .then((json) => {
          console.log("put response\n" + json);
      });
}

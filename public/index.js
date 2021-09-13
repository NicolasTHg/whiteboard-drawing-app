// getting a reference to our HTML element
const canvas = document.querySelector('canvas')

// initiating 2D context on it
const ctx = canvas.getContext('2d')
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

document.getElementById("displayFig").addEventListener("click", display_onclick);
document.getElementById("generateRandomFigures").addEventListener("click", generateRandomFigures_onclick);
document.getElementById("saveimage").addEventListener("click", saveimage_onclick);
document.getElementById("imageslist").addEventListener("click", imageslist_onclick);
document.getElementById("openimage").addEventListener("click", openImage_onclick);
//The new shape is drawn where it doesn't overlap the existing canvas content.
ctx.globalCompositeOperation = 'destination-over';

let name = null;
//Key to retrieve object from storage
var id_figure = 0;

var socket = io();


//To receive figures from other users
socket.on('figure_to_client', (data, name)=> {
    //console.log("Received by " + name + " : " + JSON.stringify(data));
    displayFigure(data.form,data.bgColor, data.borderColor, data.borderThickness, data.figureSize, data.X, data.Y);
    display_name(name);
});
//To receive lines from other users
socket.on('line_to_client', (data, name)=> {
    //console.log("Drawing by " + name + " : " + JSON.stringify(data));
    drawLine_other(data.x1,data.y1, data.x2, data.y2, data.stokeStyle, data.lineWidth);
});

//Open image when clicking on the button
function openImage_onclick(){
  var image = new Image();
  image.src = canvas.toDataURL()
  var w = window.open("");
  w.document.write(image.outerHTML)
  w.document.location = "#image";//to enable "save as" on chrome
}
//Save image when clicking on the button
function saveimage_onclick(){
  if (name == null) return null;
  canvas.toBlob(function(blob) {
    const formData = new FormData();

    //Get current datetime
    let date = new Date().toUTCString();
    //remove special characters for the file name yo avoid errors
    let file_name = `${name.replace(/[\., \/#!$%\^&\*;:{}=`~()@\+\?><\[\]\+]/g,'')}_${date.replace(/[\., \/#!$%\^&\*;:{}=`~()@\+\?><\[\]\+]/g,'-')}.png`;

    formData.append('file', blob, file_name);
    formData.append('username', name);
    formData.append('datetime', date);
    const options = {
        method: 'POST',
        body: formData,
    };
    fetch('/upload', options)
    .then(function(res){
      if(res.ok){
        console.log('Image Uploaded !');
        const successdiv = document.createElement("div");
        successdiv.setAttribute("class","success" );
        successdiv.textContent = "Image uploaded !";
        document.body.insertBefore(successdiv, document.body.firstChild);
        const x = document.createElement("span");
        x.setAttribute("class","closebtn");
        x.innerHTML="&times;";
        successdiv.appendChild(x);
        x.setAttribute("onclick","this.parentElement.style.display='none';");
      } else {
        console.log('Upload failed..');
      }
    })
    .catch(error => {
      console.error(error)
    });
  });
}
//Open page with list of images  when clicking on the button
function imageslist_onclick(){
  let w = window.open('list_images.html','_blank');
  fetch('/images_list')
  .then(function(response){return response.json();})
  .then(function(data) {
    data.images.forEach(function(doc) {
      var path =doc.path_image;
      console.log(path);
      w.document.body.innerHTML +=
      `<a  href="#" onClick='printImage("${path}")'>
      ${doc.datetime} - ${doc.username}</a><br>` ;
    });
  })
  .catch(error => {
    console.error(error);
  });
}



//Display a figure on click after collecting values in the control bar
function display_onclick(){
  if (name == null) return null;
  let form = document.getElementById("form").value
  let bgColor = document.getElementById("bgcolor").value
  let borderColor = document.getElementById("bordercolor").value
  let borderThickness = document.getElementById("bthickness").value
  let figureSize = document.getElementById("fsize").value
  let figureX = getRandomInt(canvas.width)
  let figureY = getRandomInt(canvas.height)

  //Create object
  let figure_obj = {};
  figure_obj["form"] = form;
  figure_obj["X"] = figureX
  figure_obj["Y"] = figureY
  figure_obj["bgColor"] = bgColor;
  figure_obj["borderColor"] = borderColor;
  figure_obj["borderThickness"] = borderThickness;
  figure_obj["figureSize"] = figureSize;
  let data = figure_obj

  socket.emit('figure', data, name);

}

//Display figure given all these parameters
function displayFigure_random(form, bgColor, borderColor, borderThickness, figureSize){
  if (name == null) return null;
  let figureX = getRandomInt(canvas.width)
  let figureY = getRandomInt(canvas.height)


  switch(form){
  case 'square':
    ctx.beginPath()
    ctx.rect(figureX,figureY,figureSize,figureSize)
    ctx.closePath()
    break;
  case 'circle':
    ctx.beginPath()
    ctx.arc(figureX, figureY, figureSize, 0, Math.PI * 2)
    ctx.closePath()
    break;
  case 'triangle':
    ctx.beginPath()
    ctx.moveTo(figureX, figureY)
    ctx.lineTo(figureX - parseInt(figureSize)/2, figureY + parseInt(figureSize))
    ctx.lineTo(figureX + parseInt(figureSize), figureY + parseInt(figureSize))
    ctx.closePath()
    break;
  }
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.fillStyle = bgColor;
  ctx.fill();


}

//Display figure given all these parameters
function displayFigure(form, bgColor, borderColor, borderThickness, figureSize, X, Y){
  let figureX = X
  let figureY = Y


  switch(form){
  case 'square':
    ctx.beginPath()
    ctx.rect(figureX,figureY,figureSize,figureSize)
    ctx.closePath()
    break;
  case 'circle':
    ctx.beginPath()
    ctx.arc(figureX, figureY, figureSize, 0, Math.PI * 2)
    ctx.closePath()
    break;
  case 'triangle':
    ctx.beginPath()
    ctx.moveTo(figureX, figureY)
    ctx.lineTo(figureX - parseInt(figureSize)/2, figureY + parseInt(figureSize))
    ctx.lineTo(figureX + parseInt(figureSize), figureY + parseInt(figureSize))
    ctx.closePath()
    break;
  }
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.fillStyle = bgColor;
  ctx.fill();


}

//Obtain arrays of value/text from html
var figuresList = [];
var doc = document.getElementById("form").options;
for (i = 0; i < doc.length; i++) {
  figuresList.push(doc[i].value);
}
var borderColorsList = [];
doc = document.getElementById("presetBorderColors").options;
for (i = 0; i < doc.length; i++) {
  borderColorsList.push(doc[i].text);
}
var bgColorsList = [];
doc = document.getElementById("presetBgColors").options;
for (i = 0; i < doc.length; i++) {
  bgColorsList.push(doc[i].text);
}
var bThicknessList = [];
doc = document.getElementById("bthickness").options;
for (i = 0; i < doc.length; i++) {
  bThicknessList.push(doc[i].value);
}
var fSizeList = [];
doc = document.getElementById("fsize").options;
for (i = 0; i < doc.length; i++) {
  fSizeList.push(doc[i].value);
}

///////////////////////////////////////////////////////////
//10 random figures  when clicking on the button
function generateRandomFigures_onclick() {
  if (name == null) return null;
  let figure_obj = {};
  for (i = 0; i < 10; i++) {
    figure_obj["form"] = figuresList.sample();
    figure_obj["bgColor"] = bgColorsList.sample();
    figure_obj["borderColor"] = borderColorsList.sample();
    figure_obj["borderThickness"] = bThicknessList.sample();
    figure_obj["figureSize"] = fSizeList.sample();
    figure_obj["X"] = getRandomInt(canvas.width)
    figure_obj["Y"] = getRandomInt(canvas.height)
    let data = figure_obj;
    socket.emit('figure', data, name);
  }
}

////////////////////////////////////////////

let isDrawing = false;
let x=0;
let y=0;

function drawLine(x1, y1, x2, y2) {
  if (name == null) return null;
  // using a line between actual point and the last one solves the problem
  // if you make very fast circles, you will see polygons.
  // we could make arcs instead of lines to smooth the angles and solve the problem
  let stokeStyle = document.getElementById("stokestyle").value
  let lineWidth = document.getElementById("linewidth").value

  let line = {};
  line["x1"] = x1;
  line["y1"] = y1;
  line["x2"] = x2;
  line["y2"] = y2;
  line["stokeStyle"] = stokeStyle;
  line["lineWidth"] = lineWidth;
  socket.emit('line', line, name);
  ctx.beginPath();
  ctx.strokeStyle = stokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}


function drawLine_other(x1, y1, x2, y2, stokeStyle, lineWidth) {
  // using a line between actual point and the last one solves the problem
  // if you make very fast circles, you will see polygons.
  // we could make arcs instead of lines to smooth the angles and solve the problem
  ctx.beginPath();
  ctx.strokeStyle = stokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}


canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect()
    x = e.clientX - rect.left
    y = e.clientY - rect.top
    isDrawing=true

})

canvas.addEventListener('mousemove', e => {
  if (isDrawing === true) {
    drawLine(x, y, e.offsetX, e.offsetY);
    x = e.offsetX;
    y = e.offsetY;
  }
});

window.addEventListener('mouseup', e => {
  if (isDrawing === true) {
    drawLine(x, y, e.offsetX, e.offsetY);
    x = 0;
    y = 0;
    isDrawing = false;
  }
});



/////////////////////////////////////////////////
//Submit name
const Submit = () => {
    name = document.getElementById("name").value;
    if(name==""){name = null};
}
//display user name below the canvas
function display_name(name){
    document.getElementById("display_name").innerHTML ="Last figure from : " + name;
}
////////////////////////////////////////////////////////////
function getRandomInt(max) {
  return Math.random() * max;
}

//Get a random value from an array
Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}

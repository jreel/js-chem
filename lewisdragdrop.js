/**
 * lewisdragdrop-svg.js
 * v1.0 created by jreel on 7/15/2016
 *
 * Purpose: render Lewis-dot marked atoms as SVG elements,
 *  allowing for drag-and-drop. Emphasize the "puzzle piece" approach
 *  to figuring out atom connectivity in Lewis structures
 *
 * Input: list of atoms to render
 *
 *
 * Heavily inspired by:
 *  http://simonsarris.com/blog/510-making-html5-canvas-useful
 * And:
 *  http://www.petercollingridge.co.uk/interactive-svg-components/draggable-svg-element
 * Also using code from:
 *  http://stackoverflow.com/a/7778990
 */

var svgNS = "http://www.w3.org/2000/svg";

function Atom(el, x, y) {
    this.el = el || "H";
    this.x = x || 0;
    this.y = y || 0;

    this.symbol = Elements[el].symbol;
    this.valence = parseInt(Elements[el].valence);

    this.r = 16;    // radius
    this.fontStyle = "font:bold 20px Arial;color:#000000";

    this.gradColor = "stop-color:"+Elements[el].color+";stop-opacity:1";

}
Atom.prototype.buildAtom = function(svgid, gid) {
    // build an atom from SVG parts, all within a group;
    // svg is the id of the target parent SVG "container";
    // gid is the "id" attribute that will be assigned to the group

    // make the group & attach to the SVG first
    var group = document.createElementNS(svgNS, "g");
    group.setAttributeNS(null, "id", gid);
    group.setAttributeNS(null, "transform", "translate(0 0)");
    group.setAttributeNS(null, "onmousedown", "startMove(evt)");
    group.setAttributeNS(null, "onmouseup", "endMove()");
    svgid.appendChild(group);

    // in our atom, we want a nice gradient fill
    // make a radialGradient & attach to group
    var myDefs = document.createElementNS(svgNS, "defs");
    myDefs.setAttributeNS(null, "id", gid + "-d");
    document.getElementById(gid).appendChild(myDefs);

    var myGrad = document.createElementNS(svgNS, "radialGradient");
    myGrad.setAttributeNS(null, "id", gid + "-grad");
    myGrad.setAttributeNS(null, "cx", "50%");
    myGrad.setAttributeNS(null, "cy", "50%");
    myGrad.setAttributeNS(null, "r", "50%");
    myGrad.setAttributeNS(null, "fx", "70%");
    myGrad.setAttributeNS(null, "fy", "30%");
    document.getElementById(gid + "-d").appendChild(myGrad);

    var myStop1 = document.createElementNS(svgNS, "stop");
    myStop1.setAttributeNS(null, "offset", "0%");
    myStop1.setAttributeNS(null, "style", "stop-color:rgb(255,255,255);stop-opacity:1");

    var myStop2 = document.createElementNS(svgNS, "stop");
    myStop2.setAttributeNS(null, "offset", "100%");
    myStop2.setAttributeNS(null, "style", this.gradColor);

    document.getElementById(gid + "-grad").appendChild(myStop1);
    document.getElementById(gid + "-grad").appendChild(myStop2);

    // now that we have the gradient, make a circle
    var myCircle = document.createElementNS(svgNS, "circle");
    myCircle.setAttributeNS(null, "id", gid + "-ball");
    myCircle.setAttributeNS(null, "cx", this.x);
    myCircle.setAttributeNS(null, "cy", this.y);
    myCircle.setAttributeNS(null, "r", this.r);
    myCircle.setAttributeNS(null, "fill", "url(#" + gid + "-grad)");
    myCircle.setAttributeNS(null, "stroke", "none");
    document.getElementById(gid).appendChild(myCircle);

    // add the element symbol to the circle
    var myText = document.createElementNS(svgNS, "text");
    myText.setAttributeNS(null, "id", gid + "-txt");
    myText.setAttributeNS(null, "x", this.x);
    myText.setAttributeNS(null, "y", this.y + 2);
    myText.setAttributeNS(null, "style", this.fontStyle);
    myText.setAttributeNS(null, "text-anchor", "middle");
    myText.setAttributeNS(null, "dominant-baseline", "middle");
    myText.innerHTML = this.el;
    document.getElementById(gid).appendChild(myText);

    // add Lewis dots around the circle
    var pos = [
        {x: this.r + 3, y: -6}, {x: -(this.r + 5), y: 6},
        {x: -6, y: -(this.r + 5)}, {x: 6, y: this.r + 3},
        {x: 6, y: -(this.r + 5)}, {x: -6, y: this.r + 3},
        {x: this.r + 3, y: 6}, {x: -(this.r + 5), y: -6}
    ];
    var px, py, myDot;
    for (var v = 0; v < this.valence; v++) {
        px = this.x + pos[v].x;
        py = this.y + pos[v].y;

        myDot = document.createElementNS(svgNS, "rect");
        myDot.setAttributeNS(null, "id", gid + "-dot" + v);
        myDot.setAttributeNS(null, "x", px);
        myDot.setAttributeNS(null, "y", py);
        myDot.setAttributeNS(null, "width", 3);
        myDot.setAttributeNS(null, "height", 3);
        myDot.setAttributeNS(null, "style", "fill:rgb(0,0,0)");
        document.getElementById(gid).appendChild(myDot);
    }

    // add a transparent drag handle on top
    var myDrag = document.createElementNS(svgNS, "rect");
    myDrag.setAttributeNS(null, "id", gid + "-drag");
    myDrag.setAttributeNS(null, "class", "draggable");
    myDrag.setAttributeNS(null, "x", this.x - this.r);
    myDrag.setAttributeNS(null, "y", this.y - this.r);
    myDrag.setAttributeNS(null, "width", this.r * 2);
    myDrag.setAttributeNS(null, "height", this.r * 2);
    myDrag.setAttributeNS(null, "style", "fill:grey;stroke-width:0;fill-opacity:0.1");
    myDrag.setAttributeNS(null, "onmousedown", "startMove(evt)");
    myDrag.setAttributeNS(null, "onmouseup", "endMove()");
    document.getElementById(gid).appendChild(myDrag);


};

var targ, mx, my;
function startMove(evt) {
    if (evt && evt.target && evt.target.getAttribute("class").specified) {
        if (evt.target.getAttribute("class").value = "draggable") {
            console.log("startMove called with evt: " + evt);
            mx = evt.clientX;
            my = evt.clientY;
            //document.documentElement.setAttribute("onmousemove", "moveIt(evt)");
            targ = evt.target.parentElement;
            console.log("target: " + targ);
            targ.setAttributeNS(null, "onmousemove", "moveIt(evt)");
        }
    }
}

function moveIt(evt) {
    if (evt && evt.target && evt.target.getAttribute("class").specified) {
        if (evt.target.getAttribute("class").value = "draggable") {
            var translation = targ.getAttributeNS(null, "transform").slice(10, -1).split(' ');
            var sx = parseInt(translation[0]);
            var sy = parseInt(translation[1]);

            targ.setAttributeNS(null, "transform", "translate(" + (sx + evt.clientX - mx) + " " + (sy + evt.clientY - my) + ")");
            mx = evt.clientX;
            my = evt.clientY;
        }
    }
}

function endMove() {
    //document.documentElement.setAttributeNS(null, "onmousemove", null)
    targ.setAttributeNS(null, "onmousemove", null);
}

// ***TO-DO!***
// pass in list of atoms to draw
function initSVG() {
    var svgid = document.getElementById('mySVG');
    var a1 = new Atom("O", 200, 150);
    a1.buildAtom(svgid, 'O1');
	var a2 = new Atom("C", 100, 50);
    a2.buildAtom(svgid, 'C1');
}
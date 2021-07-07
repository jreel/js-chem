/**
 * periodic.js
 * v1.0 created by jreel on 7/13/2017
 *
 * Purpose: output a full or partial periodic table, using various formatting options
 *
 * Dependencies:
 *      - elements.js   (all elements in JSON format)
 *
 * Optional:
 *      - periodic.css  (defines styles based on element type, occurrence, etc.)
 *
 * function periodicTable(targetDiv, {size, info, shade, border} ):
 *
 *      targetDiv:  the ID of the element in which to render the table
 *
 *      size:   (one of the following)
 *      - 'typical'     outputs "typical" table, with f-block below
 *      - 'long'        f-block is placed between s- and d-blocks
 *      - 'compact'     compact 8-column format
 *      - 'main'        only s- and p- blocks
 *      - 'leftstep'    Janet's table based on filled shells: f, then d, then p, then s
 *
 *      info:   (array containing any of the following)
 *      - symbol
 *      - number
 *      - name
 *      - mass
 *      - electroneg
 *      - electron-config
 *      - valence
 *      - melting
 *      - boiling
 *
 *      shade:
 *      - 'type'        colors by element type (as defined in JSON)
 *      - 'block'       colors by s-, p-, d-, or f-block
 *      - 'electroneg'  color as a gradient based on electronegativity value
 *      - 'bw'          white background with black text (overrides any other coloring options)
 *
 *      border:
 *      - 'occurrence'  border color by occurrence (as defined in JSON)
 *      - 'phase'       border color by state of matter at STP
 *      - 'block'       grouped border by block
 *      - 'type'        grouped border by type
 *
 *
 *
 * To-do:
 *      - implement additional options (only size: 'typical' and size: 'long') are done atm
 *
 */

// global counter for how many tables, to ensure unique IDs
var ptCount = 0;

function periodicTable(targetDiv, options) {
    // option defaults
    options = options || {};
    options.size = options.size || 'typical';
    options.info = options.info || ['symbol'];
    options.shade = options.shade || 'type';
    options.border = options.border || 'occurrence';

    ptCount++;

    // layout table grid first based on size option
    var pTable = document.createElement("TABLE");
    pTable.id = "pTable-" + ptCount;
    document.getElementById(targetDiv).appendChild(pTable);

    var tr, td;

    // 'typical' option:
    // dimensions: 7 rows (periods), skip, then 2 more (10 rows total)
    //             by 18 columns
    if (options.size == 'typical') {

        for (var r = 1; r <= 10; r++) {
            tr = document.createElement("TR");
            tr.id = "table-" + ptCount + "-row-" + r;
            pTable.appendChild(tr);

            for (var c = 1; c <= 18; c++) {
                td = document.createElement("TD");
                td.id = "t" + ptCount + "r" + r + "c" + c;
                tr.appendChild(td);
            }
        }
    }

    // 'long' or 'leftstep' option
    // dimensions: 7 rows (periods), but 32 columns
    if (options.size == 'long' || options.size == 'leftstep') {

        for (var r = 1; r <= 7; r++) {
            tr = document.createElement("TR");
            tr.id = "table-" + ptCount + "-row-" + r;
            pTable.appendChild(tr);

            for (var c = 1; c <= 32; c++) {
                td = document.createElement("TD");
                td.id = "t" + ptCount + "r" + r + "c" + c;
                tr.appendChild(td);
            }
        }
    }

    // 'compact' option
    // dimensions: 11 rows by 8 cols
    // based on https://en.wikipedia.org/wiki/File:ShortPT20b.png
    if (options.size == 'compact') {

        for (var r = 1; r <= 11; r++) {
            tr = document.createElement("TR");
            tr.id = "table-" + ptCount + "-row-" + r;
            pTable.appendChild(tr);

            for (var c = 1; c <= 8; c++) {
                td = document.createElement("TD");
                td.id = "t" + ptCount + "r" + r + "c" + c;
                tr.appendChild(td);
            }
        }
    }


    // place elements in appropriate location on table
    var el, elRow, elCol, elCell;
    for (key in Elements) {
        el = Elements[key];
        elRow = Number(el.period);

        // lanthanides & actinides have 'starred' group numbers in the JSON,
        // indicating which column they should be placed in
        // when being placed below the main table
        if(el.group.endsWith('*')) {
            elCol = Number(el.group.slice(0,-1));

            if (options.size == 'typical') {
                // in "typical" layout, put them in a later row than their actual period
                // period 6 elements go into row 9
                // period 7 elements go into row 10
                elRow += 3;
            }
        }
        else {
            if (options.size == 'long' && Number(el.group) >= 4) {
                // in the long layout, lanthanides & actinides are filled in before d-block
                // therefore, non-lanthanides/actinides in group 4+ get pushed to the right by 14
                elCol = Number(el.group) + 14;
            }
            else {
                elCol = Number(el.group);
            }
        }


        elCell = document.getElementById("t" + ptCount + "r" + elRow + "c" + elCol);

        if (elCell) {

            if (options.info.indexOf('number') > -1) {
                var num = document.createElement("SPAN");
                num.innerHTML = el.number;
                num.classList.add('number');
                elCell.appendChild(num);
                elCell.classList.remove('element-sm');
            }

            if (options.info.indexOf('symbol') > -1) {
                var sym = document.createElement("SPAN");
                sym.innerHTML = el.symbol;
                sym.classList.add('symbol');
                elCell.appendChild(sym);
                elCell.classList.add('element-sm');
            }

            if (options.info.indexOf('name') > -1) {
                var name = document.createElement("SPAN");
                name.innerHTML = el.name;
                name.classList.add('name');
                elCell.appendChild(name);
                elCell.classList.add('element-lg');
                elCell.classList.remove('element-sm');
            }

            if (options.info.indexOf('mass') > -1) {
                var mass = document.createElement("SPAN");
                mass.innerHTML = el.mass;
                mass.classList.add('mass');
                elCell.appendChild(mass);
                elCell.classList.remove('element-sm');
            }
            
            elCell.classList.add('element');
            
            if (options.shade == "bw") {
                // black-and-white option overrides any other coloring options
                elCell.classList.add('bw');
            } 
            else {
            elCell.classList.add(el.type);
            elCell.classList.add(el.occurrence);
            }
        }
    }

    // some clean-up based on various layouts
    if ((options.size == "typical")) {
        // markers for lanthinides/actinides
        document.getElementById("t" + ptCount + "r6c3").innerHTML = "*";
        document.getElementById("t" + ptCount + "r9c2").innerHTML = "*";
        document.getElementById("t" + ptCount + "r7c3").innerHTML = "**";
        document.getElementById("t" + ptCount + "r10c2").innerHTML = "**";
        if (options.shade != "bw") {
            document.getElementById("t" + ptCount + "r6c3").classList.add('lanthanide');
            document.getElementById("t" + ptCount + "r7c3").classList.add('actinide');
        }
    }
    
   

}




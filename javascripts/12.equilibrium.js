// wgt = weight = pendulum, mbl = mobile, hg = hanger
const g_bg_sz = [700, 660]; // size of svg for problem
const g_wgt_min = 10, g_wgt_max = 200;
const g_bar_len = 210, g_bar_hgt = 10, g_hg_hgt = 50, g_mid_hg_hgt = g_hg_hgt * 2.5, g_long_hg_hgt = g_hg_hgt * 5;
const g_mbl_hgt = g_bar_hgt + g_hg_hgt + Math.sqrt(g_wgt_max) * 2; // 200^(1/3) ~= 5.85, 200^(1/2) = 14.14
let g_nxt_wgt_id = 0, g_nxt_mbl_id = 1000;
let g_wgt_map = new Map(), g_mbl_map = new Map();
let minus_bar_color = d3.scaleLinear().domain([-1, 0]).range(["MediumVioletRed", "White"]);
let plus_bar_color = d3.scaleLinear().domain([0, 1]).range(["White", "RoyalBlue"]);

$(document).ready(function () {
    // initialize svg
    initialize_svg();

    // draw cables, g_pins and pendulum
    draw_mbl(g_structure, g_mbl_map.get(1000)); // draw from mom(1000) mbl to children, grand children, ...
});

function initialize_svg() {
    // initialize svg
    gv_ratio_len = 1.0;
    $("#prob_svg").empty();
    var sx = g_bg_sz[0] / 2, sy = g_bg_sz[1];
    g_structure = d3.select("#prob_svg").attr("style", "width:" + g_bg_sz[0] + "; height:" + g_bg_sz[1]).append("g") // set svg group
        .attr("transform", "translate(0, " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

    // lv0(mother) mobiles
    var lv0_id = create_mbl(5, sx, sy - gv_ele_unit);

    // lv1(child) mobiles
    sy -= g_hg_hgt;
    var lv1_lft_id = create_mbl(4, 0, 0, g_mid_hg_hgt); // left child
    hang_mbl(lv0_id, lv1_lft_id, 0); // hang chd_id to 1st wgt
    var lv1_rgt_id = create_mbl(3 + get_randomi(1), 0, 0, g_long_hg_hgt); // right child
    hang_mbl(lv0_id, lv1_rgt_id, 3 + get_randomi(1)); // hang chd_id to nth wgt

    // lv2(grand child) mobiles
    sy -= g_hg_hgt;
    var lv2_lft_id = create_mbl(4 + get_randomi(1), 0, 0, g_long_hg_hgt); // left child
    hang_mbl(lv1_lft_id, lv2_lft_id, get_randomi(3)); // hang chd_id to nth wgt
    var lv2_rgt_id = create_mbl(4, 0, 0, g_long_hg_hgt); // right child
    hang_mbl(lv1_rgt_id, lv2_rgt_id, get_randomi(2)); // hang chd_id to 4th wgt
}

function create_mbl(p_num_wgt, p_ox, p_oy, p_hg_hgt) {
    // adjust input
    if (p_hg_hgt == undefined) p_hg_hgt = g_hg_hgt;

    // create and add wgt
    var wgt_id_arr = [];
    var dist_arr = get_random(0.0 + gv_ele_unit, g_bar_len - gv_ele_unit, p_num_wgt).sort(function (a, b) { return a - b }); // get array of random number because of sort; now no need to sort
    for (var i = 0; i < p_num_wgt; i++) {
        var wgt = {
            id: g_nxt_wgt_id++,
            mag: get_random(g_wgt_min, g_wgt_max),
            dist: dist_arr[i],
            mbl_id: 0
        };
        g_wgt_map.set(wgt.id, wgt);
        wgt_id_arr.push(wgt.id);
    }
    g_wgt_map.get(wgt_id_arr[0]).dist = 0;
    g_wgt_map.get(wgt_id_arr[p_num_wgt - 1]).dist = g_bar_len;

    // create, add and then equalize mbl
    var mbl = {
        id: g_nxt_mbl_id++, // 1000, 1001, 1002, ... => global variable
        wgt_ids: wgt_id_arr,
        ox: p_ox, oy: p_oy, // origin of this mbl = left point of mbl bar is p_ox, p_oy
        hg_dist: get_random(0.0 + gv_ele_unit, g_bar_len - gv_ele_unit), // hg = hang up
        hg_hgt: p_hg_hgt,
        mom_id: 0
    };
    equalize_mbl(mbl); // equalize
    g_mbl_map.set(mbl.id, mbl); // add mbl

    return mbl.id;
}

function hang_mbl(p_mom_id, p_chd_id, p_ith) { // hang child to (i+1)th wgt of mother
    // retrieve mom, chd
    var mom = g_mbl_map.get(p_mom_id); // mother
    var chd = g_mbl_map.get(p_chd_id); // child

    // hang chd to ith wgt of mom
    var wgt = g_wgt_map.get(mom.wgt_ids[p_ith]);
    wgt.mbl_id = p_chd_id; // mark this wgt is child mobile
    wgt.mag = chd.mag; // update magnitude of this wgt with the magnitude of resultant force of child
    chd.ox = wgt.dist; // update origin x of child with the distance of wgt
    chd.mom_id = mom.id; // update mom id
    equalize_mbl(mom); // equalize mom again
}

function equalize_mbl(p_mbl) { // calculate resultant force
//////////////////////////////////////////////////////////////////////////
//  r
//  |<----|
//  v  x
//        ==============================
//        ^    ^                       ^
//        |    |                       |
//        p1   p2                      p3
//        0--->3---------------------->10
// total_mnt = p1*0 + p2*3 + p3*10
// r = p1 + p2 + p3
// sigma_M = r*x + total_mnt = 0
// x = abs(-total_mnt / r); // - => to left, abs => to right
//////////////////////////////////////////////////////////////////////////
    var total_mnt = 0, ry = 0;
    p_mbl.wgt_ids.forEach(function (id) {
        var wgt = g_wgt_map.get(id);
        if (wgt.mbl_id > 0) wgt.mag = g_mbl_map.get(wgt.mbl_id).mag; // if wgt is mbl, set mbl.mag to wgt.mbl
        total_mnt += wgt.mag * wgt.dist;
        ry += wgt.mag;
    });
    p_mbl.mag = ry; // magnitude of resultant force
    p_mbl.eq_dist = total_mnt / ry; // location of resultant force
    p_mbl.dt_dist = p_mbl.eq_dist - p_mbl.hg_dist; // left is -, right is +

    // equalize mom mbl
    if (p_mbl.mom_id > 0) {
        var mom_mbl = g_mbl_map.get(p_mbl.mom_id);
        equalize_mbl(mom_mbl);
    }
}

function drag_started() {
    // set point at start of drag
    g_px = d3.event.x;
    g_py = d3.event.y;
}

function drag_bar_ing() {
    // new x, y
    var dx = d3.event.x - g_px; // not equal to d3.event.dx => do not know why
    var dy = d3.event.y - g_py; // not equal to d3.event.dy => do not know why

    // get mbl and update position
    var mbl = d3.select(this.parentNode).datum(); // datum() returns the first linked data, i.e., the current mbl
    var tx = mbl.hg_dist - dx;
    tx = Math.max(0, tx); // min is 0.0
    tx = Math.min(tx, g_bar_len); // max is g_bar_len
    mbl.hg_dist = tx;
    equalize_mbl(mbl);

    // draw again
    var d3_bar_wgt = d3.select(this.parentNode.parentNode.parentNode); // this(bar) => bar_wgt => mbl => bar_wgt
    draw_mbl(d3_bar_wgt, mbl);
}

function drag_mbl_hg_ing() {
    // new x, y
    var dx = d3.event.x - g_px; // not equal to d3.event.dx => do not know why
    var dy = d3.event.y - g_py; // not equal to d3.event.dy => do not know why

    // get mbl
    var cur_mbl = d3.select(this.parentNode).datum(); // datum() returns the first linked data, i.e., the current wgt or mbl
    if (cur_mbl.id == 1000) return;
    //if ((cur_mbl.ox == 0.0) || (cur_mbl.ox == g_bar_len)) return;
    
    // update position
    var tx = cur_mbl.ox + dx;
    tx = Math.max(0, tx); // min is 0.0
    tx = Math.min(tx, g_bar_len); // max is g_bar_len
    cur_mbl.ox = tx;
    var mom_mbl = g_mbl_map.get(cur_mbl.mom_id); // mom mbl
    var wgt = find_wgt_by_mbl_id(mom_mbl, cur_mbl.id); // find the corresponding wgt from mom mbl
    wgt.dist = cur_mbl.ox; // update the position of the wgt
    equalize_mbl(mom_mbl);

    // draw again
    var d3_mom = d3.select(this.parentNode.parentNode.parentNode.parentNode); // this(dot) => mbl_hg => bar_wgt => mbl => bar_wgt / svg.g
    draw_mbl(d3_mom, mom_mbl);
}

function drag_wgt_hg_ing() {
    // new x, y
    var dx = d3.event.x - g_px; // not equal to d3.event.dx => do not know why
    var dy = d3.event.y - g_py; // not equal to d3.event.dy => do not know why

    // get wgt group and update position
    //var cur_wgt = d3.select(this.parentNode).datum(); // datum() returns the first linked data, i.e., the current wgt
    var cur_wgt = g_wgt_map.get(d3.select(this.parentNode).datum()); // datum() returns the first linked data, i.e., id of current wgt

    // update position
    var tx = cur_wgt.dist + dx;
    tx = Math.max(0, tx); // min is 0.0
    tx = Math.min(tx, g_bar_len); // max is g_bar_len
    cur_wgt.dist = tx;
    var mom_mbl = d3.select(this.parentNode.parentNode).datum();
    equalize_mbl(mom_mbl);

    // draw again
    var d3_mom = d3.select(this.parentNode.parentNode); // this(dot) => wgt_unit => bar_wgt
    draw_bar(d3_mom, mom_mbl);
    draw_wgt_unit(d3_mom, cur_wgt.id, cur_wgt.mag, cur_wgt.dist, 0, g_hg_hgt, false, true);
}

function mouse_enter(p_tgt_type, p_fx, p_fy, p_x, p_y) {
    var tooltip_text = "Force at " + p_x.toFixed(g_digit) + "mm";
    //if (p_mag != undefined) tooltip_text = p_mag.toFixed(g_digit) + "N at " + p_dist.toFixed(g_digit) + "mm";
    if (p_tgt_type == "wgt") tooltip_text = p_fy.toFixed(g_digit) + "N at " + p_x.toFixed(g_digit) + "mm";
    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
        .classed("tooltip", true)
        .style("left", (d3.event.pageX - 70).toString() + "px")
        .style("top", (d3.event.pageY - 35).toString() + "px")
        .style("width", "170px")
        .style("opacity", 0)
        .text(tooltip_text);
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}

function find_wgt_by_mbl_id(p_mom_mbl, p_chd_mbl_id) {
    // forEach of array does not allow return or break; just use for loop
    for (let i = 0; i < p_mom_mbl.wgt_ids.length; i++) {
        var wgt = g_wgt_map.get(p_mom_mbl.wgt_ids[i]);
        if (wgt.mbl_id == p_chd_mbl_id) return wgt;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw bars, weights, cables, and g_pins
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_mbl(p_d3, p_mbl) {
    // group
    var d3_mbl = p_d3.selectAll("#mbl_" + p_mbl.id).data([p_mbl]).join("g")
        .attr("id", mbl => "mbl_" + mbl.id)
        .attr("transform", mbl => "translate(" + (mbl.ox - mbl.hg_dist) + ", " + (mbl.oy - mbl.hg_hgt) + ")");

    // hg
    d3_mbl.each(function () { draw_mbl_hg(d3_mbl, p_mbl.hg_dist, p_mbl.hg_hgt); }); // each: call function for each data; call: call function just once for all data

    // dimension for hg
    var dims = [p_mbl.hg_dist, g_bar_len - p_mbl.hg_dist];
    var d3_dim = draw_dimensions(d3_mbl, 0, 0, 0, "hg_dim_" + p_mbl.id, dims, -gv_margin_unit, "mm", "up");
    d3_dim.attr("transform", "scale(1, -1) " + d3_dim.attr("transform"));

    //// dimension for wgt
    //dims = [0]; // dims[0] is for pre dist
    //p_mbl.wgt_ids.forEach(function (wgt_id) {
    //    var wgt = g_wgt_map.get(wgt_id); // get cur dist
    //    dims.push(wgt.dist - dims[0]); // subtract pre dist from cur dist
    //    dims[0] = wgt.dist; // store cur dist at dims[0] as pre dist
    //});
    //dims.splice(0, 2); // remove the first 2 items; 1st = pre dist, 2nd = dist of the 1st wgt, shift(); // remove the first item
    //d3_dim = draw_dimensions(d3_mbl, 0, 0, 0, "wgt_dim", dims, gv_margin_unit, "mm", "dn");
    //d3_dim.attr("transform", "scale(1, -1) " + d3_dim.attr("transform"));

    // bar, wgt
    var d3_bar_wgt = d3_mbl.selectAll("#bar_wgt_" + p_mbl.id).data([p_mbl]).join("g");
    d3_bar_wgt.attr("id", "bar_wgt_" + p_mbl.id)
        .each(function () {
            draw_bar_wgt(d3_bar_wgt, p_mbl);
        });
}

function draw_bar_wgt(p_d3, p_mbl) {
    // bar
    var d3_bar = draw_bar(p_d3, p_mbl);

    // wgt and mbl
    p_mbl.wgt_ids.forEach(function (wgt_id) {
        var wgt = g_wgt_map.get(wgt_id);
        if (wgt.mbl_id == 0) draw_wgt_unit(p_d3, wgt.id, wgt.mag, wgt.dist, 0, g_hg_hgt, false, true);
        else draw_mbl(p_d3, g_mbl_map.get(wgt.mbl_id));
    });
}

function draw_bar(p_d3, p_mbl) {
    var d3_bar = p_d3.selectAll("#bar_" + p_mbl.id).data([p_mbl]).join("rect") // opposite to raise(); bring to front; do not know why redraw change the the order of drawing
        .attr("id", mbl => "bar_" + mbl.id)
        .attr("x", -gv_ele_unit / 3).attr("y", -g_bar_hgt / 2)
        .attr("width", g_bar_len + 2 * gv_ele_unit / 3).attr("height", g_bar_hgt)
        .attr("style", (mbl, i) => "cursor:pointer; " + set_bar_style(mbl))
        .call(d3.drag()
            .on("start", drag_started)
            .on("drag", drag_bar_ing));
}

//function draw_wgt_unit(p_d3, p_wgt) {
//    // group
//    var d3_wgt_unit = p_d3.selectAll("#wgt_unit_" + p_wgt.id).data([p_wgt]).join("g")
//        .attr("id", wgt => "wgt_unit_" + wgt.id)
//        .attr("transform", wgt => "translate(" + wgt.dist + ", 0)");

//    // wgt hg
//    d3_wgt_unit.each(function () { draw_wgt_hg(d3_wgt_unit, 0, -g_hg_hgt); }); // because wgt hg is downward, -g_hg_hgt

//    // wgt
//    d3_wgt_unit.selectAll(".wgt").data(wgt => [[Math.sqrt(wgt.mag), wgt.dist]]).join("rect")
//        .classed("wgt", true)
//        .attr("x", d => -d[0]).attr("y", d => -g_hg_hgt - d[0] * 2)
//        .attr("width", d => d[0] * 2).attr("height", d => d[0] * 2)
//        .attr("style", "fill:lightgrey; stroke:dimgrey")
//            .on("mouseover", function (d) { mouse_enter(Math.pow(d[0], 2), d[1]); })
//            .on("mouseout", function () {mouse_out(); });
//}

function draw_mbl_hg(p_d3, p_x, p_hg_hgt) {
    var mbl = p_d3.datum();
    p_d3.selectAll("#mbl_hg_" + mbl.id).data([p_hg_hgt]).join("line") // hg for mbl
        .attr("id", "mbl_hg_" + mbl.id)
        .attr("x1", p_x).attr("y1", 0)
        .attr("x2", p_x).attr("y2", hgt => hgt)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width: 2")
            .on("mouseover", function () { mouse_enter("mbl_hg", undefined, undefined, mbl.ox); })
            .on("mouseout", function () { mouse_out(); });
    p_d3.selectAll("#up_hg_dot_" + mbl.id).data([p_hg_hgt]).join("circle") // upper dot of hanger
        .attr("id", "up_hg_dot_" + mbl.id)
        .attr("cx", p_x).attr("cy", hgt => Math.max(hgt, 0)) // Math.max => -hgt is used for wgt hg, +hgt is used for hg
        .attr("r", gv_ele_unit / 6)
        .attr("style", "cursor: pointer; fill:white; stroke-width:1; stroke:dimgrey")
        .call(d3.drag()
            .on("start", drag_started)
            .on("drag", drag_mbl_hg_ing));
    p_d3.selectAll("#dn_hg_dot_" + mbl.id).data([p_hg_hgt]).join("circle") // lower dot of hanger
        .attr("id", "dn_hg_dot_" + mbl.id)
        .attr("cx", p_x).attr("cy", hgt => Math.min(hgt, 0)) // Math.min => -hgt is used for wgt hg, +hgt is used for hg
        .attr("r", gv_ele_unit / 6)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
}

//function set_bar_style(p_idx, p_mbls) {
//    if (p_idx < p_mbls.length / 2) return "stroke:dimgrey; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + g_bar_hgt;
//    else {
//        var eq_rto = p_mbls[0].dt_dist / g_bar_len;
//        var threshold = 0.01;
//        if (eq_rto < -threshold) return "stroke:" + minus_bar_color(eq_rto) + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + (g_bar_hgt - 1);
//        else if (Math.abs(eq_rto) < threshold) return "stroke:lightgrey; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + (g_bar_hgt - 1);
//        else return "stroke:" + plus_bar_color(eq_rto) + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + (g_bar_hgt - 1);
//    }
//}

function set_bar_style(p_mbl) {
    var eq_rto = p_mbl.dt_dist / g_bar_len;
    var threshold = 0.01;
    if (eq_rto < -threshold) return "stroke:dimgrey; fill:" + minus_bar_color(eq_rto) ;
    else if (Math.abs(eq_rto) < threshold) return "stroke:dimgrey; fill:lightgrey";
    else return "stroke:dimgrey; fill:" + plus_bar_color(eq_rto);
}
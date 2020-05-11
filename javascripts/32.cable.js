// cbl = cable, wgt = weight = pendulum, hg = hanger
const g_bg_sz = [700, 700]; // size of svg for problem
const g_wgt_min = 10, g_wgt_max = 200;
const g_hg_hgt = 50;
let g_wgt_num = 7;
let g_all_wgt_units = [], g_wgt_units = [], g_pins = [], g_cbls = [];
let g_nxt_wgt_id = 0, g_nxt_cbl_id = 1000;

$(document).ready(function () {
    $(document).on("input", "#input_N", function () {
        g_wgt_num = parseInt($(this).val());
        $("#label_N").html(g_wgt_num);
        initialize_svg();
        create(g_wgt_num + 1);
        solve();
        draw();
    });

    // initialize svg
    initialize_svg();

    // create, solve, and draw
    create(g_wgt_num + 1);
    solve();
    draw();
});

function initialize_svg() {
    gv_ratio_len = 1.0, g_nxt_wgt_id = 0, g_nxt_cbl_id = 1000;
    $("#prob_svg").empty(); // delete the existing child svgs for all svgs
    var sx = g_bg_sz[0] / 2, sy = g_bg_sz[1];
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)
}

function create(p_interval) {
    // coordinates of left, right pin
    var lx = -g_bg_sz[0] / 2 + gv_ele_unit * 1.5, rx = -lx; // left and right
    var ty = g_bg_sz[1] - gv_ele_unit * 1.5, by = gv_ele_unit * 20; // top and bottom
    var x0 = get_random(lx / 5, rx / 5), y0 = by; // vertex based on random number
    var x1 = lx, y1 = ty; // the other point
    if (x0 < 0) x1 = rx;
    var a = (y1 - y0) / Math.pow(x1 - x0, 2), b = -2 * a * x0, c = a * x0 * x0 + y0; // the coefficients of quadratic equation based on points of (x0, y0) and (x1, y1)

    // create g_wgt_units
    g_all_wgt_units = []; // empty array
    var scaler = d3.scaleLinear().domain([0, p_interval]).range([lx, rx]); // scale [0, max_interval] to [lx, rx]
    var xs = d3.range(0, p_interval + 1, 1); // 0, 1, 2, ..., max_interval
    var scope = (rx - lx) / p_interval / 4;
    xs.forEach(function (ele, idx) {
        var xx = scaler(ele) + get_random(-scope, scope), yy = poly_val([a, b, c], xx);
        var wgt_unit = create_wgt_unit(xx, yy, false);
        if (idx == 0) {
            wgt_unit = create_wgt_unit(lx, poly_val([a, b, c], lx), true); // true = pin = no wgt
        }
        if (idx == (xs.length - 1)) {
            wgt_unit = create_wgt_unit(rx, poly_val([a, b, c], rx), true); // true = pin = no wgt
        }
        g_all_wgt_units.push(wgt_unit);
    });
    ////////////////////////////////////////////////////////////////////////////////////
    // for test !!!
    ////////////////////////////////////////////////////////////////////////////////////
    //g_all_wgt_units = [];
    ////var wgts = [0, -15, -15, -10, 0]; // ex in textbook
    ////g_all_wgt_units.push(create_wgt_unit(0, 300, true));
    ////g_all_wgt_units.push(create_wgt_unit(12, 300 - 21.44 / 41.83 * 12, false));
    ////g_all_wgt_units.push(create_wgt_unit(37, 0, false));
    ////g_all_wgt_units.push(create_wgt_unit(49, 0, true));
    ////g_all_wgt_units.push(create_wgt_unit(66, 300, true));
    ////var wgts = [0, -60, -30, 0]; // ex1 in homepage
    ////g_all_wgt_units.push(create_wgt_unit(0, 300, true));
    ////g_all_wgt_units.push(create_wgt_unit(30, 200, false));
    ////g_all_wgt_units.push(create_wgt_unit(60, -200, false));
    ////g_all_wgt_units.push(create_wgt_unit(90, 300, true));
    //var wgts = [0, -20, 0]; // ex2 in homepage
    //g_all_wgt_units.push(create_wgt_unit(0, 100, true));
    //g_all_wgt_units.push(create_wgt_unit(100, 90, false));
    //g_all_wgt_units.push(create_wgt_unit(300, 150, false));
    ////g_all_wgt_units.push(create_wgt_unit(0, 150, true));
    ////g_all_wgt_units.push(create_wgt_unit(200, 90, false));
    ////g_all_wgt_units.push(create_wgt_unit(300, 100, false));
    //g_all_wgt_units.forEach(function (wgt_unit, i) { wgt_unit.fy = wgts[i]; });
    ////////////////////////////////////////////////////////////////////////////////////
    // for test !!!
    ////////////////////////////////////////////////////////////////////////////////////
    g_wgt_units = g_all_wgt_units.slice(1, g_all_wgt_units.length - 1); // get all wgt_units except for the first and last element
    g_pins = [g_all_wgt_units[0], g_all_wgt_units[g_all_wgt_units.length - 1]];

    //create g_cbls
    g_cbls = [];
    g_all_wgt_units.forEach(function (wgt_unit, i) {
        if (i != 0) {
            var pre_wgt = g_all_wgt_units[i - 1];
            var seg = create_cbl_seg(pre_wgt.loc, wgt_unit.loc);
            g_cbls.push(seg);
        }
    });
}

function solve() {
    // solve support reactions
    var sigma_x = g_pins[1].loc.x - g_pins[0].loc.x;
    var sigma_y = g_pins[1].loc.y - g_pins[0].loc.y;
    var sigma_w = g_wgt_units.reduce(function (sum, wgt_unit) { return sum - wgt_unit.fy; }, 0); // - => the magnitude of downward force
    var sigma_M = g_wgt_units.reduce(function (sum, wgt_unit) { return sum - (wgt_unit.loc.x - g_pins[0].loc.x) * wgt_unit.fy; }, 0); // - => the magnitude of clockwise moment
    var Va = g_pins[0].fy = (sigma_w - sigma_M / sigma_x) / (1 - (sigma_y / sigma_x) * (g_cbls[0].seg.df.x / g_cbls[0].seg.df.y)); // Va
    //if (g_pins[0].loc.y > g_pins[1].loc.y) Va = g_pins[0].fy = (sigma_w - sigma_M / sigma_x) / (1 + (sigma_y / sigma_x) * (g_cbls[0].seg.df.x / g_cbls[0].seg.df.y));
    var Vb = g_pins[1].fy = sigma_w - Va; // Vb
    var Ha = g_pins[0].fx = (g_cbls[0].seg.df.x / g_cbls[0].seg.df.y) * Va; // Ha
    var Hb = g_pins[1].fx = -Ha; // Hb

    // solve member force
    var acc_fy = Va; // accumulated Fy, at first, equals to upward reaction of the left support
    g_cbls.forEach(function (cbl, i) {
        var wgt_unit = g_all_wgt_units[i + 1];
        wgt_unit.loc.y = g_all_wgt_units[i].loc.y + (acc_fy / Ha) * cbl.seg.df.x; // calculate height of the wgt_unit
        cbl.seg = create_vector(g_all_wgt_units[i].loc, wgt_unit.loc); // update cbl according the calculated height of the wgt_unit
        cbl.axial = Math.sqrt(Ha * Ha + acc_fy * acc_fy); // calculate axial force of the cbl
        acc_fy += wgt_unit.fy; // prepare next cbl
    });
}

function draw() {
    // draw g_cbls
    g_structure.selectAll(".cbl").data(g_cbls).join("rect").classed("cbl", true)
        .attr("transform", cbl => "translate(" + cbl.seg.sp.x + ", " + cbl.seg.sp.y + ") rotate(" + cbl.seg.ng + ")") // do not know why "rotate and then translate" does not work!!
        .attr("x", 0).attr("y", -gv_ele_unit / 8)
        .attr("width", cbl => cbl.seg.mg).attr("height", gv_ele_unit / 4)
        .attr("style", "fill:lightgrey; stroke:dimgrey")
        .on("mouseover", cbl => { mouse_enter("cbl", cbl.axial, undefined, cbl.seg.mg) })
        .on("mouseout", function () { mouse_out(); });

    // draw g_pins
    g_structure.selectAll(".pin").data(g_pins).join("circle") // g_pins for support
        .classed("pin", true)
        .attr("cx", pin => pin.loc.x).attr("cy", pin => pin.loc.y)
        .attr("r", gv_ele_unit / 2)
        .attr("style", "cursor: pointer; fill:lightgrey; stroke-width:2; stroke:dimgrey")
        .on("mouseover", pin => { mouse_enter("pin", pin.fx, pin.fy, pin.loc.x, pin.loc.y); })
        .on("mouseout", function () { mouse_out(); });

    // draw wgts
    g_wgt_units.forEach(function (wgt_unit) {
        draw_wgt_unit(g_structure, wgt_unit.id, -wgt_unit.fy, wgt_unit.loc.x, wgt_unit.loc.y, g_hg_hgt, true, false); // true = large up dot, false = no drag
    });
}

function create_wgt_unit(p_x, p_y, p_is_pin) {
    var wgt = 0;
    if (p_is_pin == false) wgt = -get_random(g_wgt_min, g_wgt_max); // minus means downward
    //p_y += Math.pow(-wgt, 2 / 5);

    return {
        id: g_nxt_wgt_id++, //l_cbl_id: , r_cbl_id: ,
        fx: 0, fy: wgt,
        loc: create_point(p_x, p_y)
    }
}

function create_cbl_seg(p_s, p_e) {
    return {
        id: g_nxt_cbl_id++,
        seg: create_vector(p_s, p_e)
    }
}

function mouse_enter(p_tgt_type, p_fx, p_fy, p_x, p_y) {
    var wth = "170px", hgt = "28px";
    var lft = (d3.event.pageX - 70).toString() + "px", top = (d3.event.pageY - 35).toString() + "px";
    var tooltip_text;
    switch (p_tgt_type) {
        case "wgt":
            wth = "100px";
            tooltip_text = p_fy.toFixed(g_digit) + "N";
            break;
        case "dot":
            tooltip_text = "(" + p_x.toFixed(g_digit) + ", " + p_y.toFixed(g_digit) + ")mm";
            break;
        case "pin":
            hgt = "56px";
            top = (d3.event.pageY - 70).toString() + "px";
            tooltip_text = "(" + p_fx.toFixed(g_digit) + ", " + p_fy.toFixed(g_digit) + ")N<br />(" + p_x.toFixed(g_digit) + ", " + p_y.toFixed(g_digit) + ")mm"; // 
            break;
        case "cbl":
            tooltip_text = p_fx.toFixed(g_digit) + "N, " + p_x.toFixed(g_digit) + "mm"; // axial force and length
            break;
    }

    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
        .classed("tooltip", true)
        .style("left", lft).style("top", top)
        .style("width", wth).style("height", hgt)
        .style("opacity", 0)
        .html(tooltip_text);
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}

function mouse_out() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip = undefined;
}
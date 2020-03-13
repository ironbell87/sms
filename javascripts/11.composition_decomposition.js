﻿var g_or = 100; // offset_radius
var g_bg_sz = [700, 700]; // size of svg for problem
var g_bg_nsz = [g_bg_sz[0] - gv_ele_unit * 4, g_bg_sz[1] - gv_ele_unit * 4]; // net size of svg for problem
var g_pendulum_len = 50;
var g_xy; // 3x2; 3 = left, right, center; 2 = x, y

$(document).ready(function () {
    // initialize the location of pins (supports)
    var lpnt = { "x": -g_bg_nsz[0] / 2, "y": +g_bg_nsz[1] / 2 - get_random(0, g_or) }; // left
    var rpnt = { "x": +g_bg_nsz[0] / 2, "y": +g_bg_nsz[1] / 2 - get_random(0, g_or) }; // right
    var cpnt = { "x": (lpnt.x + rpnt.x) / 2.0, "y": (lpnt.y + rpnt.y) / 2.0 - get_random(0, g_or) * 3 }; // center
    var ppnt = { "x": cpnt.x, "y": cpnt.y - g_pendulum_len }; // pendulum
    g_xy = [{ "start": lpnt, "end": cpnt }, { "start": cpnt, "end": rpnt }, { "start": cpnt, "end": ppnt }]; // left, right, center

    // initialize svg
    $("svg").empty(); // delete the existing child svgs for all svgs
    var sx = g_bg_sz[0] / 2, sy = g_bg_sz[1] / 2; // size of svg = (700, 700)
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)
    var sx = 50, sy = 0; // 50 is indentation
    g_measurement = d3.select("#measurement_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

    // draw cables, pins and pendulum
    draw_problem();

    $(".smt_measurement").click(function () {
        // no modification, no measuement
        if ($(".smt_measurement").val() == "Measurement is completed!") return;

        // show the results of measurement
        measure_angle();

        // update UI
        $("#output_space").slideDown(1000); // 1sec.
        $(".smt_measurement").val("Measurement is completed!");
    });
});

function drag_pendulum_started() {
    // show tooltip
    g_tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
        .style("opacity", 0)
        .html(g_xy[2].end.x.toFixed(g_digit).toString() + ", " + g_xy[2].end.y.toFixed(g_digit).toString());
    g_tooltip
        .transition().duration(500)
        .style("opacity", .6);

    // update problem (svg) and UI
    $("#div_input_outer").fadeOut();
    $("#output_space").slideUp(1000); // 1sec.
    $(".smt_measurement").val("Click to measure angle!");
}

function drag_pendulum_ing() {
    // new x and y
    var new_x = d3.event.x;
    var new_y = d3.event.y;

    // limit of range of new x
    new_x = Math.max(new_x, g_xy[0].start.x + gv_ele_unit * 2); //40);
    new_x = Math.min(new_x, g_xy[1].end.x - gv_ele_unit * 2); //40);

    // limit of range of new y
    var dx = g_xy[1].end.x - g_xy[0].start.x;
    var dy = g_xy[1].end.y - g_xy[0].start.y;
    var cx = new_x - g_xy[0].start.x;
    var cy = cx * (dy / dx) + g_xy[0].start.y;
    new_y = Math.min(new_y, (cy - g_pendulum_len));
    new_y = Math.max(new_y, (-g_bg_nsz[1] /2 + gv_ele_unit));

    // update points
    var ppnt = { "x": new_x, "y": new_y };
    var cpnt = { "x": ppnt.x, "y": ppnt.y + g_pendulum_len };
    g_xy[0].end = cpnt;
    g_xy[1].start = cpnt;
    g_xy[2].start = cpnt; g_xy[2].end = ppnt;

    // unpdate cables, pin, and pendulum
    draw_problem();

    // update tooltip
    g_tooltip
        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
        .html(ppnt.x.toFixed(g_digit).toString() + ", " + ppnt.y.toFixed(g_digit).toString());
}

function drag_pendulum_ended() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip = undefined;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw cables, pins, and pendulum
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_problem() {
    // prepare temporary points for cable, pin and pendulum
    var t_xy = [];
    g_xy.forEach(function (d) {
        var dx = d.end.x - d.start.x, dy = d.end.y - d.start.y; // vector from start to end
        var mg = Math.sqrt(dx * dx + dy * dy);
        var vx = dx / mg, vy = dy / mg; // unit vector of (dx, dy)
        var ns = { "x": d.start.x + vx / 2, "y": d.start.y + vy / 2 };
        var ne = { "x": d.end.x - vx / 2, "y": d.end.y - vy / 2 };
        t_xy.push({ "start": ns, "end": ne })
    });
    t_xy = g_xy.concat(t_xy);

    // draw or update cables
    g_structure.selectAll("line")
        .data(t_xy).join("line") // .join("line"), same to .enter().append("line"), is valid only for d3.v5
        //.enter().append("line").attr("x1", function (d,i) { console.log(i, d.start.x); return d.start.x; }).attr("y1", function (d) { return d.start.y; })
        .attr("x1", d => d.start.x).attr("y1", d => d.start.y) // "d =>" makes d as parameter of each element in g_xy
        .attr("x2", d => d.end.x).attr("y2", d => d.end.y)
        .attr("style", (d, i) => set_cable_style(i));

    // draw or update pins
    var j_xy = [g_xy[0].start, g_xy[1].start, g_xy[1].end]; // point
    j_xy[0].name = "A"; j_xy[1].name = "B"; j_xy[2].name = "C"; // label
    g_structure.selectAll("circle")
        .data(j_xy).join("circle")
        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", gv_ele_unit / 2)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    g_structure.selectAll("text")
        .data(j_xy).join("text")
        .attr("x", 0).attr("y", 20).text(d => d.name)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle") // start/middle/end
        .attr("transform", d => "translate(" + d.x + ", " + (d.y + 35) + ") scale(1, -1)");

    // draw or update a pendulum
    draw_pendulum(g_structure, g_xy[2].end.x, g_xy[2].end.y, "100N", true, "pendulum");
}

function set_cable_style(p_idx) {
    if (p_idx < 3) return "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + gv_ele_unit / 2;
    else return "stroke:lightgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + (gv_ele_unit / 2 - 1);
}

function measure_angle() {
    // draw reference line
    var x_min = -300, x_max = 300;
    var cpnt = [g_xy[1].start]; // center point
    var ref_line = g_structure.selectAll("g#ref_line").data([1]).join("g").attr("id", "ref_line");
    ref_line.selectAll("line")
        .data(cpnt).join("line")
        .attr("x1", x_min).attr("y1", d => d.y)
        .attr("x2", x_max).attr("y2", d => d.y)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:1; stroke-dasharray:1,3");
    var rpnt = [{ "x": x_min - gv_ele_unit, "y": cpnt[0].y, "label": "D" }, { "x": x_max + gv_ele_unit, "y": cpnt[0].y, "label": "E" }]; // points for label
    ref_line.selectAll("text")
        .data(rpnt).join("text")
        .attr("x", d => d.x).attr("y", d => d.y + 5)
        .text(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle"); // start/middle/end

    // vector for calculation; s = start, e = end, l = left, r = right, c = center, pt = pnt
    var spt = g_xy[0].start, ept = g_xy[1].end, cpt = g_xy[0].end;
    var ldx = cpt.x - spt.x, ldy = cpt.y - spt.y; // position vector
    var rdx = ept.x - cpt.x, rdy = ept.y - cpt.y; // position vector

    // calculate length and anagle of cable
    var cable_len = [+Math.sqrt(ldx * ldx + ldy * ldy).toFixed(g_digit), rln = +Math.sqrt(rdx * rdx + rdy * rdy).toFixed(g_digit)];
    var cable_ang = [+(acosd(ldx / cable_len[0])).toFixed(g_digit), +(acosd(rdx / cable_len[1])).toFixed(g_digit)];

    // object for display of measurement using svg; msmt = measurement
    var msmt = [{ "label": "LENGTH OF AB", "val": cable_len[0], "unit": "mm" },
                { "label": "LENGTH OF BC", "val": cable_len[1], "unit": "mm" },
                { "label": "ANGLE OF ABD", "val": cable_ang[0], "unit": "degree" },
                { "label": "ANGLE OF CBE", "val": cable_ang[1], "unit": "degree" }];

    // draw the results
    g_measurement.selectAll("g").remove();
    var msmt_result_grp = g_measurement.selectAll("g").data(msmt).join("g")
        .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
    msmt_result_grp.append("text")
        .attr("x", 0).attr("y", 0)
        //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
        .html(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
        .attr("transform", "scale(1, -1)");
    msmt_result_grp.append("rect")
        .attr("x", 130).attr("y", -15)
        .attr("width", 100).attr("height", 40)
        .attr("rx", 20).attr("rx", 20)
        .attr("style", "stroke:grey; stroke-width:0.5; fill:none")
    msmt_result_grp.append("text")
        .attr("x", 210).attr("y", 0)
        .html(d => d.val)
        .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
        .attr("transform", "scale(1, -1)");
    msmt_result_grp.append("text")
        .attr("x", 240).attr("y", 0)
        .html(d => { return d.unit; })
        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
        .attr("transform", "scale(1, -1)");
}
////const g_or = 100; // offset_radius
////const g_bg_sz = [700, 700]; // size of svg for problem
////const g_bg_nsz = [g_bg_sz[0] - gv_ele_unit * 4, g_bg_sz[1] - gv_ele_unit * 4]; // net size of svg for problem
////const g_pendulum_len = 50;
////let g_xy; // 3x2; 3 = left, right, center; 2 = x, y

////$(document).ready(function () {
////    // initialize the location of g_pins (supports)
////    var lpnt = create_point(-g_bg_nsz[0] / 2, +g_bg_nsz[1] / 2 - get_random(0, g_or)); // left
////    var rpnt = create_point(+g_bg_nsz[0] / 2, +g_bg_nsz[1] / 2 - get_random(0, g_or)); // right
////    var cpnt = create_point((lpnt.x + rpnt.x) / 2.0, (lpnt.y + rpnt.y) / 2.0 - get_random(0, g_or) * 3); // center
////    var ppnt = create_point(cpnt.x, cpnt.y - g_pendulum_len); // pendulum
////    g_xy = [{ start: lpnt, end: cpnt }, { start: cpnt, end: rpnt }, { start: cpnt, end: ppnt }]; // left, right, center

////    // initialize svg
////    $("#prob_svg, #measurement_svg").empty();
////    var sx = g_bg_sz[0] / 2, sy = g_bg_sz[1] / 2; // size of svg = (700, 700)
////    g_structure = d3.select("#prob_svg").append("g") // set svg group
////        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)
////    var sx = 50, sy = 0; // 50 is indentation
////    g_measurement = d3.select("#measurement_svg").append("g") // set svg group
////        .attr("transform", "translate(" + sx + ", " + sy + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

////    // draw cables, g_pins and pendulum
////    draw_problem();

////    $(".smt_measurement").click(function () {
////        // no modification, no measuement
////        if ($(".smt_measurement").val() == "Measurement is completed!") return;

////        // show the results of measurement
////        measure_angle();

////        // update UI
////        $("#output_space").slideDown(1000); // 1sec.
////        $(".smt_measurement").val("Measurement is completed!");
////    });
////});

////function drag_pendulum_started() {
////    // show tooltip
////    g_tooltip = d3.select("body").append("div")
////        .attr("class", "tooltip")
////        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
////        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
////        .style("opacity", 0)
////        .html(g_xy[2].end.x.toFixed(g_digit).toString() + ", " + g_xy[2].end.y.toFixed(g_digit).toString());
////    g_tooltip
////        .transition().duration(500)
////        .style("opacity", .8);

////    // update problem (svg) and UI
////    $("#div_input_outer").fadeOut();
////    $("#output_space").slideUp(1000); // 1sec.
////    $(".smt_measurement").val("Click to measure angle!");
////}

////function drag_pendulum_ing() {
////    // new x and y
////    var new_x = d3.event.x;
////    var new_y = d3.event.y;

////    // limit of range of new x
////    new_x = Math.max(new_x, g_xy[0].start.x + gv_ele_unit * 2); //40);
////    new_x = Math.min(new_x, g_xy[1].end.x - gv_ele_unit * 2); //40);

////    // limit of range of new y
////    var dx = g_xy[1].end.x - g_xy[0].start.x;
////    var dy = g_xy[1].end.y - g_xy[0].start.y;
////    var cx = new_x - g_xy[0].start.x;
////    var cy = cx * (dy / dx) + g_xy[0].start.y;
////    new_y = Math.min(new_y, (cy - g_pendulum_len));
////    new_y = Math.max(new_y, (-g_bg_nsz[1] /2 + gv_ele_unit));

////    // update points
////    var ppnt = { x: new_x, y: new_y };
////    var cpnt = { x: ppnt.x, y: ppnt.y + g_pendulum_len };
////    g_xy[0].end = cpnt;
////    g_xy[1].start = cpnt;
////    g_xy[2].start = cpnt; g_xy[2].end = ppnt;

////    // unpdate cables, pin, and pendulum
////    draw_problem();

////    // update tooltip
////    g_tooltip
////        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
////        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
////        .html(ppnt.x.toFixed(g_digit).toString() + ", " + ppnt.y.toFixed(g_digit).toString());
////}

////function drag_pendulum_ended() {
////    // hide tooltip
////    g_tooltip.transition().duration(500).style("opacity", 0);
////    g_tooltip = undefined;
////}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////// draw cables, g_pins, and pendulum
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////function draw_problem() {
////    // prepare temporary points for cable, pin and pendulum
////    var t_xy = g_xy.concat(g_xy);
////    //var t_xy = [];
////    //g_xy.forEach(function (d) {
////    //    var dx = d.end.x - d.start.x, dy = d.end.y - d.start.y; // vector from start to end
////    //    var mg = Math.sqrt(dx * dx + dy * dy);
////    //    var vx = dx / mg, vy = dy / mg; // unit vector of (dx, dy)
////    //    var ns = { x: d.start.x + vx / 2, y: d.start.y + vy / 2 };
////    //    var ne = { x: d.end.x - vx / 2, y: d.end.y - vy / 2 };
////    //    t_xy.push({ start: ns, end: ne })
////    //});
////    //t_xy = g_xy.concat(t_xy);

////    // draw or update cables
////    g_structure.selectAll("line")
////        .data(t_xy).join("line") // .join("line"), same to .enter().append("line"), is valid only for d3.v5
////        //.enter().append("line").attr("x1", function (d,i) { console.log(i, d.start.x); return d.start.x; }).attr("y1", function (d) { return d.start.y; })
////        .attr("x1", d => d.start.x).attr("y1", d => d.start.y) // "d =>" makes d as parameter of each element in g_xy
////        .attr("x2", d => d.end.x).attr("y2", d => d.end.y)
////        .attr("style", (d, i) => set_cable_style(i, 3));

////    // draw or update g_pins and labels
////    var j_xy = [g_xy[0].start, g_xy[1].start, g_xy[1].end]; // point
////    j_xy[0].name = "A"; j_xy[1].name = "B"; j_xy[2].name = "C"; // label
////    g_structure.selectAll("circle")
////        .data(j_xy).join("circle")
////        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", gv_ele_unit / 2)
////        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
////    g_structure.selectAll("text")
////        .data(j_xy).join("text")
////        .attr("x", 0).attr("y", 20).text(d => d.name)
////        .attr("style", "cursor:default; fill:grey; text-anchor:middle") // start/middle/end
////        .attr("transform", d => "translate(" + d.x + ", " + (d.y + 35) + ") scale(1, -1)");

////    // draw or update a pendulum
////    draw_pendulum(g_structure, g_xy[2].end.x, g_xy[2].end.y, "100N", true, "pendulum");
////}

////function measure_angle() {
////    //// draw reference line
////    //var x_min = -300, x_max = 300;
////    //var cpnt = [g_xy[1].start]; // center point
////    //var ref_line = g_structure.selectAll("g#ref_line").data([1]).join("g").attr("id", "ref_line");
////    //ref_line.selectAll("line")
////    //    .data(cpnt).join("line")
////    //    .attr("x1", x_min).attr("y1", d => d.y)
////    //    .attr("x2", x_max).attr("y2", d => d.y)
////    //    .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:1; stroke-dasharray:1,3");
////    //var rpnt = [{ "x": x_min - gv_ele_unit, "y": cpnt[0].y, "label": "D" }, { "x": x_max + gv_ele_unit, "y": cpnt[0].y, "label": "E" }]; // points for label
////    //ref_line.selectAll("text")
////    //    .data(rpnt).join("text")
////    //    .attr("x", d => d.x).attr("y", d => d.y + 5)
////    //    .text(d => d.label)
////    //    .attr("style", "cursor:default; fill:grey; text-anchor:middle"); // start/middle/end

////    //// vector for calculation; s = start, e = end, l = left, r = right, c = center, pt = pnt
////    //var spt = g_xy[0].start, ept = g_xy[1].end, cpt = g_xy[0].end;
////    //var ldx = cpt.x - spt.x, ldy = cpt.y - spt.y; // position vector
////    //var rdx = ept.x - cpt.x, rdy = ept.y - cpt.y; // position vector

////    //// calculate length and anagle of cable
////    //var cable_len = [+Math.sqrt(ldx * ldx + ldy * ldy).toFixed(g_digit), rln = +Math.sqrt(rdx * rdx + rdy * rdy).toFixed(g_digit)];
////    //var cable_ang = [+(acosd(ldx / cable_len[0])).toFixed(g_digit), +(acosd(rdx / cable_len[1])).toFixed(g_digit)];

////    //// object for display of measurement using svg; msmt = measurement
////    //var msmt = [{ label: "LENGTH OF AB", val: cable_len[0], unit: "mm" },
////    //            { label: "LENGTH OF BC", val: cable_len[1], unit: "mm" },
////    //            { label: "ANGLE OF ABD", val: cable_ang[0], unit: "degree" },
////    //            { label: "ANGLE OF CBE", val: cable_ang[1], unit: "degree" }];

////    //// draw the results
////    //g_measurement.selectAll("g").remove();
////    //var msmt_result_grp = g_measurement.selectAll("g").data(msmt).join("g")
////    //    .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
////    //msmt_result_grp.append("text")
////    //    .attr("x", 0).attr("y", 0)
////    //    //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
////    //    .html(d => d.label)
////    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
////    //    .attr("transform", "scale(1, -1)");
////    //msmt_result_grp.append("rect")
////    //    .attr("x", 130).attr("y", -15)
////    //    .attr("width", 100).attr("height", 40)
////    //    .attr("rx", 20).attr("rx", 20)
////    //    .attr("style", "stroke:grey; stroke-width:0.5; fill:none")
////    //msmt_result_grp.append("text")
////    //    .attr("x", 210).attr("y", 0)
////    //    .html(d => d.val)
////    //    .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
////    //    .attr("transform", "scale(1, -1)");
////    //msmt_result_grp.append("text")
////    //    .attr("x", 240).attr("y", 0)
////    //    .html(d => { return d.unit; })
////    //    .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
////    //    .attr("transform", "scale(1, -1)");


////    // draw reference line
////    var x_min = -300, x_max = 300;
////    var cpnt = [g_xy[1].start]; // center point
////    var ref_line = g_structure.selectAll("g#ref_line").data([1]).join("g").attr("id", "ref_line");
////    ref_line.selectAll("line")
////        .data(cpnt).join("line")
////        .attr("x1", x_min).attr("y1", d => d.y)
////        .attr("x2", x_max).attr("y2", d => d.y)
////        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:1; stroke-dasharray:1,3");
////    var rpnt = [{ "x": x_min - gv_ele_unit, "y": cpnt[0].y, "label": "D" }, { "x": x_max + gv_ele_unit, "y": cpnt[0].y, "label": "E" }]; // points for label
////    ref_line.selectAll("text")
////        .data(rpnt).join("text")
////        .attr("x", d => d.x).attr("y", d => d.y + 5)
////        .text(d => d.label)
////        .attr("style", "cursor:default; fill:grey; text-anchor:middle"); // start/middle/end

////    // vector for calculation; s = start, e = end, l = left, r = right, c = center, pt = pnt
////    var spt = g_xy[0].start, ept = g_xy[1].end, cpt = g_xy[0].end;
////    var ldx = cpt.x - spt.x, ldy = cpt.y - spt.y; // position vector
////    var rdx = ept.x - cpt.x, rdy = ept.y - cpt.y; // position vector

////    // calculate length and anagle of cable
////    var cable_len = [+Math.sqrt(ldx * ldx + ldy * ldy).toFixed(g_digit), rln = +Math.sqrt(rdx * rdx + rdy * rdy).toFixed(g_digit)];
////    var cable_ang = [+(acosd(ldx / cable_len[0])).toFixed(g_digit), +(acosd(rdx / cable_len[1])).toFixed(g_digit)];

////    // object for display of measurement using svg; msmt = measurement
////    var msmt = [{ label: "LENGTH OF AB", val: cable_len[0], unit: "mm" },
////    { label: "LENGTH OF BC", val: cable_len[1], unit: "mm" },
////    { label: "ANGLE OF ABD", val: cable_ang[0], unit: "degree" },
////    { label: "ANGLE OF CBE", val: cable_ang[1], unit: "degree" }];

////    //draw_angle_arc_360(g_structure, g_Mohr.cx, 0, ini_ng, cur_ng, "Mohr_theta");


////    // draw the results
////    g_measurement.selectAll("g").remove();
////    var msmt_result_grp = g_measurement.selectAll("g").data(msmt).join("g")
////        .attr("transform", (d, i) => "translate(0, " + (-i * 60 - 50) + ")");
////    msmt_result_grp.append("text")
////        .attr("x", 0).attr("y", 0)
////        //.html(d => "<pre>" + d.label + "             " + d.val + "    " + d.unit + "</pre>")
////        .html(d => d.label)
////        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
////        .attr("transform", "scale(1, -1)");
////    msmt_result_grp.append("rect")
////        .attr("x", 130).attr("y", -15)
////        .attr("width", 100).attr("height", 40)
////        .attr("rx", 20).attr("rx", 20)
////        .attr("style", "stroke:grey; stroke-width:0.5; fill:none")
////    msmt_result_grp.append("text")
////        .attr("x", 210).attr("y", 0)
////        .html(d => d.val)
////        .attr("style", "cursor:default; fill:grey; font-weight:bold; text-anchor:end") // start/middle/end
////        .attr("transform", "scale(1, -1)");
////    msmt_result_grp.append("text")
////        .attr("x", 240).attr("y", 0)
////        .html(d => { return d.unit; })
////        .attr("style", "cursor:default; fill:grey; text-anchor:start") // start/middle/end
////        .attr("transform", "scale(1, -1)");
////}



const g_or = 100; // offset_radius
const g_bg_sz = [700, 700]; // size of svg for problem
const g_bg_nsz = [g_bg_sz[0] - gv_ele_unit * 4, g_bg_sz[1] - gv_ele_unit * 4]; // net size of svg for problem
const g_pendulum_len = 50;
let g_lpnt, g_rpnt, g_cpnt, g_npnt;

$(document).ready(function () {
    // initialize the location of g_pins (supports)
    g_lpnt = create_point(-g_bg_nsz[0] / 2, +g_bg_nsz[1] / 2 - get_random(0, g_or)); // left
    g_rpnt = create_point(+g_bg_nsz[0] / 2, +g_bg_nsz[1] / 2 - get_random(0, g_or)); // right
    g_npnt = create_point((g_lpnt.x + g_rpnt.x) / 2.0, (g_lpnt.y + g_rpnt.y) / 2.0 - get_random(0, g_or) * 3); // new point; be careful not to change the value of cpnt // new point; be careful not to change the value of cpnt
    g_cpnt = create_point(g_npnt.x, g_npnt.y - 10); // center; old

    // initialize svg
    initialize_svg();

    // draw cables, g_pins and pendulum
    measure();
    draw_problem();
});

function initialize_svg() {
    $("#prob_svg, #measurement_svg").empty();
    var sx = g_bg_sz[0] / 2, sy = g_bg_sz[1] / 2; // size of svg = (700, 700)
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + [sx, sy] + ") scale(1,-1)"); // translate and then flip down the object and axes (+x = right, +y = upward)

    // pattern for rounded image for pendulum
    var svg_defs = g_structure.append("defs"); // define defs for pattern
    var img_pattern = svg_defs.append("pattern") // create pattern in defs
        .attr("id", "img_pattern")
        .attr("height", 1).attr("width", 1)
        .attr("x", "0").attr("y", "0");
    img_pattern.append("image") // square image contained in pattern
        .attr("x", 0).attr("y", 0)
        .attr("height", 40).attr("width", 40) // image size
        .attr("xlink:href", "../images/ironman.png");
}

function drag_pendulum_started() {
/*    // show tooltip
    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").classed("tooltip", true)
        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
        .style("opacity", 0)
        .html(g_xy[2].ep.x.toFixed(g_digit).toString() + ", " + g_xy[2].ep.y.toFixed(g_digit).toString());
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
*/}

function drag_pendulum_ing() {
    // new x and y
    var new_x = d3.event.x;
    var new_y = d3.event.y;

    // limit of range of new x
    new_x = Math.max(new_x, g_lpnt.x + gv_ele_unit * 2);
    new_x = Math.min(new_x, g_rpnt.x - gv_ele_unit * 2);

    // limit of range of new y
    var dx = g_rpnt.x - g_lpnt.x;
    var dy = g_rpnt.y - g_lpnt.y;
    var cx = new_x - g_lpnt.x;
    var cy = cx * (dy / dx) + g_lpnt.y;
    new_y = Math.min(new_y, cy);
    new_y = Math.max(new_y, (-g_bg_nsz[1] / 2 + gv_ele_unit * 4));

    // update points
    g_npnt = create_point(new_x, new_y);

    // unpdate cables, pin, and pendulum
    measure();
    draw_problem();
    g_cpnt = create_point(g_npnt.x, g_npnt.y);

/*
    // update tooltip
    g_tooltip
        .style("left", (d3.event.sourceEvent.clientX + 40).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 10).toString() + "px")
        .html(cpnt.x.toFixed(g_digit).toString() + ", " + cpnt.y.toFixed(g_digit).toString());
*/}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw cables, g_pins, and pendulum
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_problem() {
    // prepare temporary points for cable, pin and pendulum
    var m_ppnt = create_point(g_cpnt.x, g_cpnt.y - g_pendulum_len);
    var m_xy = [create_vector(g_lpnt, g_npnt), create_vector(g_npnt, g_rpnt), create_vector(g_npnt, m_ppnt)]; // left, right, center
    var t_xy = m_xy.concat(m_xy);

    // draw or update cables
    g_structure.selectAll(".cable").data(t_xy).join("line").classed("cable", true) // .join("line"), same to .enter().append("line"), is valid only for d3.v5
        .attr("id", (d, i) => "cable" + i)
        .attr("x1", d => d.sp.x).attr("y1", d => d.sp.y) // "d =>" makes d as parameter of each element in m_xy
        .attr("x2", d => d.ep.x).attr("y2", d => d.ep.y)
        .attr("style", (d, i) => set_cable_style(i, 3))
        .on("mouseover", d => mouse_enter("length", d.mg))
        .on("mouseout", mouse_out);

    g_structure.select("#cable2", "#cable5")
        .transition().ease(d3.easeElastic).duration(1000).attr("x2", g_npnt.x)
        .transition().ease(d3.easeElastic).duration(1000).attr("y2", g_npnt.y - g_pendulum_len);

    // draw or update g_pins
    var j_xy = [g_lpnt, g_npnt, g_rpnt]; // point
    g_structure.selectAll("circle").data(j_xy).join("circle").attr("id", (d, i) => "pin" + i)
        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", gv_ele_unit / 2)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    g_structure.select("#pin1").attr("style", "cursor:pointer; fill:white; stroke-width:2; stroke:#ff6f6f").call(d3.drag()
        //.on("start", drag_pendulum_started)
        .on("drag", drag_pendulum_ing));
    //.on("end", drag_ended));

    // draw or update a pendulum
    draw_pendulum(g_structure, "100N", true, "pendulum");
}

function measure() {
    // draw reference line
    var ref_line = g_structure.selectAll("g#ref_line").data([1]).join("g").attr("id", "ref_line");
    ref_line.selectAll("line").data([g_npnt]).join("line")
        .attr("x1", d => d.x - 100).attr("y1", d => d.y)
        .attr("x2", d => d.x + 100).attr("y2", d => d.y)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:1; stroke-dasharray:1,3");

    // position vector for length and angle of left and right cable
    var lft = create_vector(g_lpnt, g_npnt); // position vector of lpnt -> npnt
    var rgt = create_vector(g_npnt, g_rpnt); // position vector of npnt -> rpnt

    // draw angle
    draw_angle_arc_360(g_structure, g_npnt.x, g_npnt.y, 180 + lft.ng, 180, 50, 1, "angle", "left");
    draw_angle_arc_360(g_structure, g_npnt.x, g_npnt.y, 0, rgt.ng, 50, 1, "angle", "right");
}

function draw_pendulum(p_svg_mom, p_load, p_drag, p_id) {
    var dx = g_npnt.x - g_cpnt.x, dy = g_npnt.y - g_cpnt.y;
    p_svg_mom.selectAll("#pendulum").data([0]).join("circle").attr("id", p_id) // set circle fill to the created pattern => make square image to circle image
        .attr("cx", 0).attr("cy", 0).attr("r", 20)
        .attr("fill", "url(#img_pattern)")
        .attr("transform", "translate(" + (g_cpnt.x - 2 * dx) + "," + (g_cpnt.y - g_pendulum_len - 2 * dy) + ") scale(1,-1)") // translate
        .transition().ease(d3.easeElastic).duration(1000)
        .attr("transform", "translate(" + g_npnt.x + "," + (g_npnt.y - g_pendulum_len) + ") scale(1,-1)"); // translate;

    p_svg_mom.selectAll(".pendulum_text").data([0]).join("text").classed("pendulum_text", true)
        .attr("x", 0).attr("y", 0).text(p_load)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle") // start/middle/end
        .attr("transform", "translate(" + g_npnt.x + "," + (g_npnt.y - g_pendulum_len - 35) + ") scale(1,-1)");

    /*    // set drag callback function
        if (p_drag == true) {
            d3.select("#" + p_id).attr("style", "cursor:pointer; stroke-width:2; stroke:#ff6f6f").call(d3.drag()
                //.container(p_svg_mom.node()) // make beam the coordinate system of dragging point
                .on("start", drag_pendulum_started)
                .on("drag", drag_pendulum_ing)
                .on("end", drag_ended));
        }*/
}

function mouse_enter(p_tgt_type, p_data) {
    var wth = "110px", hgt = "28px";
    var lft = (d3.event.x + 10).toString() + "px", top = (d3.event.y - 35).toString() + "px";
    var tooltip_text;
    switch (p_tgt_type) {
        case "length":
            tooltip_text = p_data.toFixed(g_digit) + " mm";
            break;
        case "angle":
            tooltip_text = p_data.toFixed(g_digit) + " ˚";
            break;
    }

    // show tooltip
    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").classed("tooltip", true)
        .style("left", lft).style("top", top)
        .style("width", wth).style("height", hgt)
        .style("opacity", 0)
        .html(tooltip_text);
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}
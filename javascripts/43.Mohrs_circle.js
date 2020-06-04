var g_bg_sz = [700, 700]; // size of svg for problem
let g_setting = { sx: 800, sy: 400, t: -550 }; // sigma_x, sigma_y, tau
let g_Mohr = new Object(), g_scaler, g_svg_unit, g_svg_text_unit = 1.1;
let g_point_id, g_is_dragging = false;

$(document).ready(function () {
    // solve and draw
    solve_Mohr();
    initialize_svg();
    draw_Mohrs_circle();

    // update setting
    $("#input_sigma_x, #input_sigma_y, #input_tau").change(function () {
        // update setting values
        g_setting.sx = parseFloat($("#input_sigma_x").val());
        g_setting.sy = parseFloat($("#input_sigma_y").val());
        g_setting.t = parseFloat($("#input_tau").val());

        // solve and draw
        solve_Mohr();
        initialize_svg();
        draw_Mohrs_circle();
    });
});

function solve_Mohr() {
    // get Mohr's circle
    g_Mohr.cx = (g_setting.sx + g_setting.sy) / 2;
    g_Mohr.r = Math.sqrt(Math.pow((g_setting.sx - g_setting.sy) / 2, 2) + Math.pow(g_setting.t, 2));
    g_Mohr.s1 = g_Mohr.cx + g_Mohr.r;
    g_Mohr.s2 = g_Mohr.cx - g_Mohr.r;
    g_Mohr.tp = Math.atan(-2 * g_setting.t / (g_setting.sx - g_setting.sy)) / 2;
    g_Mohr.tmax = g_Mohr.r;
    g_Mohr.tmin = -g_Mohr.r;
    g_Mohr.ts = g_Mohr.tp + Math.PI / 2;
    if (g_Mohr.tp < 0) g_Mohr.ts = g_Mohr.tp - Math.PI / 2;

    // set scaler
    g_scaler = d3.scaleLinear().domain([-(g_Mohr.r * 0.2) + g_Mohr.s2, g_Mohr.s1 + (g_Mohr.r * 0.2)]).range([0, 650]); // scale domain to pixel
    g_svg_unit = g_scaler(1) - g_scaler(0); // convert 1 unit in domain to 1 unit in svg
}

function initialize_svg() {
    $("#fbd_svg, #reaction_svg").empty();
    var sx = g_scaler(0), sy = 700 / 2;
    g_structure = d3.select("#fbd_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + "," + sy + ") scale(" + g_svg_unit + "," + -g_svg_unit + ")");
    sx = 700 / 2;
    g_reaction = d3.select("#reaction_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + "," + sy + ") scale(" + g_svg_unit + "," + -g_svg_unit + ")");
}

function drag_point_started() {
    // disable mouseover and mouseout event
    g_is_dragging = true;

    // show tooltip
    g_point_id = d3.select(this).datum().id;
    g_tooltip = d3.selectAll("body").selectAll(".tooltip").data([0]).join("div").classed("tooltip", true)
        .style("left", (d3.event.sourceEvent.clientX + 10).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 35).toString() + "px")
        .style("opacity", 0)
        .html(d3.event.x.toFixed(g_digit).toString() + ", " + d3.event.y.toFixed(g_digit).toString());
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}

function drag_point_ing() {
    // snap to principal stress point, max shear point
    if (Math.abs(d3.event.y) < 10 / g_svg_unit) d3.event.y = 0;
    if (Math.abs(g_Mohr.cx - d3.event.x) < 10 / g_svg_unit) d3.event.x = g_Mohr.cx;

    // cur vector for the face of 1 or 2
    var cur_vec = create_vector(create_point(g_Mohr.cx, 0), create_point(d3.event.x, d3.event.y));
    if (cur_vec.mg < 20 / g_svg_unit) return;
    var cur_pnt = create_point(cur_vec.uv.x * g_Mohr.r + g_Mohr.cx, cur_vec.uv.y * g_Mohr.r);

    // snap to original stress point
    if (Math.abs(cur_pnt.x - g_setting.sx) < 10 / g_svg_unit)
        if (Math.abs(cur_pnt.y - g_setting.t) < 10 / g_svg_unit) {
            cur_pnt.x = g_setting.sx;
            cur_pnt.y = g_setting.t;
            g_structure.selectAll(".arc").remove();
        }
    if (Math.abs(cur_pnt.x - g_setting.sy) < 10 / g_svg_unit)
        if (Math.abs(cur_pnt.y + g_setting.t) < 10 / g_svg_unit) {
            cur_pnt.x = g_setting.sy;
            cur_pnt.y = -g_setting.t;
            g_structure.selectAll(".arc").remove();
        }
    //// snap to zero normal stress point
    //if (Math.abs(cur_pnt.x) < 1 / g_svg_unit) cur_pnt.x = 0;

    // get angle and new sigma x, y, and tau
    var s1 = cur_pnt.x, s2 = 2 * g_Mohr.cx - s1, t = cur_pnt.y;
    if (g_point_id == 2) { s2 = cur_pnt.x, s1 = 2 * g_Mohr.cx - s2, t = -cur_pnt.y; }

    // draw new stress point
    var pnts = [{ x: s1, y: t, id: 1 }, { x: s2, y: -t, id: 2 }];
    draw_stress_point(pnts, "cur_point", true);

    // draw angle arc
    var ini_vec = create_vector(create_point(g_Mohr.cx, 0), create_point(g_setting.sx, g_setting.t));
    if (g_point_id == 2) ini_vec = create_vector(create_point(g_Mohr.cx, 0), create_point(g_setting.sy, -g_setting.t));
    var ini_ng = get_angle_360(ini_vec.df), cur_ng = get_angle_360(cur_vec.df);
    draw_angle_arc_360(g_structure, g_Mohr.cx, 0, ini_ng, cur_ng, 50 / g_svg_unit, 1 / g_svg_unit, "Mohr_theta");

    // draw new stress state
    draw_stress_state(pnts, ini_ng, cur_ng);

    // update tooltip
    var tooltip_string = cur_pnt.x.toFixed(g_digit).toString() + ", " + cur_pnt.y.toFixed(g_digit).toString();
    g_tooltip
        .style("left", (d3.event.sourceEvent.clientX + 10).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 35).toString() + "px")
        .html(tooltip_string);
}

function drag_point_ended() {
    // enable mouseover and mouseout event
    g_is_dragging = false;

    // hide tooltip
    mouse_out();
}

function mouse_enter(p_tgt_type, p_data) {
    // check on dragging
    if (g_is_dragging == true) return;

    var wth = "110px", hgt = "28px";
    var lft = (d3.event.x + 10).toString() + "px", top = (d3.event.y - 35).toString() + "px";
    var tooltip_text;
    switch (p_tgt_type) {
        case "diameter":
            tooltip_text = "r = " + p_data.toFixed(g_digit);
            break;
        case "stress_point":
            wth = "150px";
            tooltip_text = "(" + p_data.x.toFixed(g_digit) + ", " + p_data.y.toFixed(g_digit) + ")";
            break;
        case "Mohr_theta":
            hgt = "56px";
            tooltip_text = "2θ = " + p_data.toFixed(g_digit) + "˚<br />θ = " + (p_data / 2).toFixed(g_digit) + "˚";
            break;
        case "state_theta":
            tooltip_text = "θ = " + p_data.toFixed(g_digit) + "˚";
            break;
        case "stress":
            tooltip_text = p_data.toFixed(g_digit) + " MPa";
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

function mouse_out() {
    // check on dragging
    if (g_is_dragging == true) return;

    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
}

function draw_Mohrs_circle() {
    // in case of invalid input
    if (Math.abs(g_Mohr.r) <= Number.EPSILON) {
        alert("Input values are invalid! Try for another input values")
        return;
    }

    // draw axes
    draw_axes();

    // draw circle and center
    g_structure.selectAll(".Mohr")
        .data([g_Mohr]).join("circle").classed("Mohr", true)
        .attr("cx", d => d.cx).attr("cy", 0).attr("r", d => d.r)
        .attr("style", "fill:none; stroke:dimgrey; stroke-width:" + 1 / g_svg_unit);
    g_structure.selectAll(".center")
        .data([g_Mohr]).join("circle").classed("center", true)
        .attr("cx", d => d.cx).attr("cy", 0).attr("r", (gv_ele_unit / 1.5) / g_svg_unit)
        .attr("style", "cursor:default; fill:lightgrey; opacity:0.4; stroke:dimgrey; stroke-width:" + 2 / g_svg_unit)
        .on("mouseover", d => { mouse_enter("stress_point", { x: g_Mohr.cx, y: 0 }); })
        .on("mouseout", mouse_out);

    // draw point of stress state
    var pnts = [{ x: g_setting.sx, y: g_setting.t, id: 1 }, { x: g_setting.sy, y: -g_setting.t, id: 2 }];
    draw_stress_point(pnts, "ini_point", false);
    draw_stress_point(pnts, "cur_point", true);

    // draw background fo stress state
    draw_background();

    // draw stress state
    draw_stress_state(pnts);
}

function draw_axes() {
    var lt = create_point(-(g_Mohr.r * 0.2) + g_Mohr.s2, g_Mohr.r * 1.2),
        rb = create_point(g_Mohr.s1 + (g_Mohr.r * 0.2), -g_Mohr.r * 1.2);
    var sx = create_point(lt.x, 0), ex = create_point(rb.x, 0);
    var sy = create_point(0, rb.y), ey = create_point(0, lt.y);
    var axes = [{ sp: sx, ep: ex, name: "σθ" }, { sp: sy, ep: ey, name: "τθ" }];
    g_structure.selectAll(".axes")
        .data(axes).join("line").classed("axes", true)
        .attr("x1", d => d.sp.x).attr("y1", d => d.sp.y)
        .attr("x2", d => d.ep.x).attr("y2", d => d.ep.y)
        .attr("style", "stroke:grey; stroke-width:" + 1 / g_svg_unit);
    g_structure.selectAll(".axes_name")
        .data(axes).join("text").classed("axes_name", true)
        .attr("x", 0).attr("y", 0).text(d => d.name)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle; alignment-baseline:middle") // start/middle/end; hanging/middle/baseline
        .attr("transform", d => {
            var trans = "translate(";
            if (d.ep.y == 0) trans += [d.ep.x * 1.03, d.ep.y]; // x-axis
            else trans += [d.ep.x, d.ep.y * 1.05]; // y-axis
            return trans += ") scale(" + [g_svg_text_unit / g_svg_unit, -g_svg_text_unit / g_svg_unit] + ")";
        });
}

function draw_stress_point(p_pnts, p_cls_name, p_drag) {
    // draw point of stress state
    g_structure.selectAll("." + p_cls_name + "_name")
        .data(p_pnts).join("text").classed(p_cls_name + "_name", true)
        .attr("x", 0).attr("y", 0).text(d => d.id)
        .attr("style", "fill:black; text-anchor:middle; alignment-baseline:middle") // start/middle/end; hanging/middle/baseline
        .attr("transform", d => "translate(" + [d.x, d.y] + ") scale(" + [g_svg_text_unit / g_svg_unit, -g_svg_text_unit / g_svg_unit] + ")");
    var d3_stress_point = g_structure.selectAll("." + p_cls_name)
        .data(p_pnts).join("circle").classed(p_cls_name, true)
        .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", (gv_ele_unit / 1.5) / g_svg_unit)
        .attr("style", d => {
            if (p_drag == true) return "cursor:pointer; fill:#ff6f6f; opacity:0.4; stroke:red; stroke-width:" + 2 / g_svg_unit;
            else return "cursor:default; fill:lightgrey; opacity:0.4; stroke:dimgrey; stroke-width:" + 2 / g_svg_unit;
        })
        .on("mouseover", pnt => { mouse_enter("stress_point", pnt); })
        .on("mouseout", mouse_out);

    // make draggable
    if (p_drag == true) {
        d3_stress_point.call(d3.drag()
            .on("start", drag_point_started)
            .on("drag", drag_point_ing)
            .on("end", drag_point_ended));
    }

    // draw diameter
    var dia = [create_vector(p_pnts[0], p_pnts[1])];
    g_structure.selectAll("." + p_cls_name + "_diameter")
        .data(dia).join("line").classed(p_cls_name + "_diameter", true).lower()
        .attr("x1", d => d.sp.x).attr("y1", d => d.sp.y)
        .attr("x2", d => d.ep.x).attr("y2", d => d.ep.y)
        .attr("style", function () {
            var stroke_color = (p_drag == true) ? "stroke:#ff6f6f; " : "stroke:grey; ";
            return stroke_color + "stroke-width:" + 2 / g_svg_unit + "; stroke-dasharray: " + [3 / g_svg_unit, 3 / g_svg_unit];
        })
        .on("mouseover", dia => { mouse_enter("diameter", dia.mg / 2); })
        .on("mouseout", mouse_out);
}

function draw_background() {
    // draw axes
    var bg_sz = 160 / g_svg_unit;
    var sx = create_point(-bg_sz * 2, 0), ex = create_point(bg_sz * 2, 0);
    var sy = create_point(0, -bg_sz * 2), ey = create_point(0, bg_sz * 2);
    var axes = [{ sp: sx, ep: ex, name: "x" }, { sp: sy, ep: ey, name: "y" }];
    g_reaction.selectAll(".ini_axes")
        .data(axes).join("line").classed("ini_axes", true)
        .attr("x1", d => d.sp.x).attr("y1", d => d.sp.y)
        .attr("x2", d => d.ep.x).attr("y2", d => d.ep.y)
        .attr("style", "stroke:grey; stroke-width:" + 1 / g_svg_unit);
    g_reaction.selectAll(".ini_axes_name")
        .data(axes).join("text").classed("ini_axes_name", true)
        .attr("x", 0).attr("y", 0).text(d => d.name)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle; alignment-baseline:middle") // start/middle/end; hanging/middle/baseline
        .attr("transform", d => {
            var trans = "translate(";
            if (d.ep.y == 0) trans += [d.ep.x * 1.03, d.ep.y]; // x-axis
            else trans += [d.ep.x, d.ep.y * 1.05]; // y-axis
            return trans += ") scale(" + [g_svg_text_unit / g_svg_unit, -g_svg_text_unit / g_svg_unit] + ")";
        });

    // draw body
    g_reaction.selectAll(".ini_body")
        .data([0]).join("rect").classed("ini_body", true)
        .attr("x", -bg_sz / 2).attr("y", -bg_sz / 2)
        .attr("width", bg_sz).attr("height", bg_sz)
        .attr("style", "fill:lightgrey; opacity: 0.3; stroke:grey; stroke-width:" + 1 / g_svg_unit);
}

function draw_stress_state(p_pnts, p_ini_ng, p_cur_ng) {
    // rotation angle
    var ang = 0;
    if (p_ini_ng != undefined) {
        ang = p_cur_ng - p_ini_ng; // in degree
        if (Math.abs(ang) > 180) ang = ang + ((ang > 0) ? -360 : 360); // in ccw => +, in cw => -
    }
    draw_angle_arc_360(g_reaction, 0, 0, 0, ang / 2, 50 / g_svg_unit, 1 / g_svg_unit, "state_theta");

    // draw axes
    var bg_sz = 160 / g_svg_unit;
    var sx = create_point(-bg_sz * 2, 0), ex = create_point(bg_sz * 2, 0);
    var sy = create_point(0, -bg_sz * 2), ey = create_point(0, bg_sz * 2);
    var axes = [{ sp: sx, ep: ex, name: "θ" }, { sp: sy, ep: ey, name: "θ'" }];

    var d3_state = g_reaction.selectAll(".cur_state").data([0]).join("g").classed("cur_state", true)
        .attr("transform", "rotate(" + ang / 2 + ")");
    d3_state.selectAll(".cur_axes")
        .data(axes).join("line").classed("cur_axes", true)
        .attr("x1", d => d.sp.x).attr("y1", d => d.sp.y)
        .attr("x2", d => d.ep.x).attr("y2", d => d.ep.y)
        .attr("style", "stroke:#ff6f6f; stroke-width:" + 1 / g_svg_unit);
    d3_state.selectAll(".cur_axes_name")
        .data(axes).join("text").classed("cur_axes_name", true)
        .attr("x", 0).attr("y", 0).text(d => d.name)
        .attr("style", "cursor:default; fill:#ff6f6f; text-anchor:middle; alignment-baseline:middle") // start/middle/end; hanging/middle/baseline
        .attr("transform", d => {
            var trans = "translate(";
            if (d.ep.y == 0) trans += [d.ep.x * 1.03, d.ep.y]; // x-axis
            else trans += [d.ep.x, d.ep.y * 1.05]; // y-axis
            return trans += ") scale(" + [g_svg_text_unit / g_svg_unit, -g_svg_text_unit / g_svg_unit] + ")";
        });

    // draw body
    d3_state.selectAll(".cur_body")
        .data([0]).join("rect").classed("cur_body", true)
        .attr("x", -bg_sz / 2).attr("y", -bg_sz / 2)
        .attr("width", bg_sz).attr("height", bg_sz)
        .attr("style", "fill:#ff6f6f; opacity: 0.2; stroke:red; stroke-width:" + 1 / g_svg_unit);

    // data for stress
    var fct = 160 / Math.max(Math.abs(g_Mohr.s1), Math.abs(g_Mohr.s2), g_Mohr.r) / g_svg_unit;
    var tw = 6 / g_svg_unit, th = 6 / g_svg_unit;
    var top_tri = -tw / 2 + "," + -th + " " + tw / 2 + "," + -th + " 0,0";
    var stress_states = [];
    var mag = p_pnts[0].x * fct;
    stress_states.push({ mg: mag, ng: (mag > 0) ? -90 : 90, tx: bg_sz / 2 + ((mag > 0) ? mag : 0), ty:0 }); // sigma +x
    stress_states.push({ mg: mag, ng: (mag > 0) ? 90 : -90, tx: -bg_sz / 2 - ((mag > 0) ? mag : 0), ty: 0 }); // sigma -x
    var mag = p_pnts[1].x * fct;
    stress_states.push({ mg: mag, ng: (mag > 0) ? 0 : 180, tx: 0, ty: bg_sz / 2 + ((mag > 0) ? mag : 0) }); // sigma +y
    stress_states.push({ mg: mag, ng: (mag > 0) ? 180 : 0, tx: 0, ty: -bg_sz / 2 - ((mag > 0) ? mag : 0) }); // sigma -y
    var mag = p_pnts[0].y * fct;
    stress_states.push({ mg: mag, ng: (mag > 0) ? 0 : 180, tx: -bg_sz / 1.8, ty: mag / 2 }); // tau +x
    stress_states.push({ mg: mag, ng: (mag > 0) ? 180 : 0, tx: bg_sz / 1.8, ty: -mag / 2 }); // tau -x
    var mag = p_pnts[1].y * fct;
    stress_states.push({ mg: mag, ng: (mag > 0) ? -90 : 90, tx: mag / 2, ty: bg_sz / 1.8 }); // tau +y
    stress_states.push({ mg: mag, ng: (mag > 0) ? 90 : -90, tx: -mag / 2, ty: -bg_sz / 1.8 }); // tau -y

    // draw stress
    var d3_stress = d3_state.selectAll(".cur_stress").data(stress_states).join("g").classed("cur_stress", true)//.attr("id", (d, i) => i)
        .attr("transform", d => "translate(" + d.tx + "," + d.ty + ") rotate(" + d.ng + ")") // translate and then rotate
        .on("mouseover", d => mouse_enter("stress", d.mg / fct))
        .on("mouseout", mouse_out);
    d3_stress.each((stress, i) => {
        // at first, select only the ith d3 element; ".cur_stress_arrow:nth-child(i)" does not work; do not know why
        d3.select(d3_stress.nodes()[i]).selectAll(".cur_stress_arrow").data([stress]).join("polygon").classed("cur_stress_arrow", true) // triangle
            .attr("points", top_tri)
            .attr("style", "fill:dimgrey; stroke:dimgrey; stroke-width:" + 2 / g_svg_unit)
            .style("opacity", d => (Math.abs(d.mg) < 1 / g_svg_unit) ? 0 : 1);
        d3.select(d3_stress.nodes()[i]).selectAll(".cur_stress_line").data([stress]).join("line").classed("cur_stress_line", true) // line
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", d => -Math.abs(d.mg))
            .attr("style", "stroke:dimgrey; stroke-width:" + 3 / g_svg_unit)
            .style("opacity", d => (Math.abs(d.mg) < 1 / g_svg_unit) ? 0 : 1);
    });
}
var g_span = 8, g_load = 5, g_load_type = "point", g_loc_fr = 4, g_loc_to = 4;
var gv_pre_x, gv_pre_y, gv_to_fr, gv_to_to; // for dragging
var g_dgm, g_d3_point_load, g_cur_loc, g_FBD_y = 120, g_SFD_y = g_FBD_y + 100, g_BMD_y = g_SFD_y + 100;

$(document).ready(function () {
    // update setting
    //g_setting = { b: 30.0, h: 50.0, L: 8.0, P: 5.0, E: 2200.0, Support: "Simple support", I: function () { return this.b * Math.pow(this.h, 3) / 12; } };
    g_setting = { L: 8.0, P: 5.0, Support: "Simple support" };
    $("#setting_space").css("height", "220px");
    $(document).on("input", "#input_S", function () {
        var spt_idx = parseInt($(this).val());
        g_setting.Support = g_support[spt_idx];
        $("#label_S").html(g_setting.Support);

        draw_beam_problem();
        solve_beam_problem();
        draw_beam_diagram();
    });
    $(document).on("input", "#input_LoadType", function () {
        if (parseInt($(this).val()) == 0) { // point load
            g_load_type = "point";
            g_loc_to = g_loc_fr;
            $("#label_LoadType").html("Point load");
        }
        else { // point ==> uniform
            g_load_type = "uniform";
            if (g_loc_fr == g_span) g_loc_fr = 0;
            g_loc_to = g_span;
            $("#label_LoadType").html("Uniform load");
        }
        draw_beam_problem();
        solve_beam_problem();
        draw_beam_diagram();
    });
    $(document).on("input", "#input_P", function () {
        g_load = parseFloat($(this).val());
        $("#label_P").html(g_load.toFixed(g_digit) + " kN");
        draw_beam_problem();
        solve_beam_problem();
        draw_beam_diagram();
    });
    $(document).on("input", "#input_L", function () {
        var new_span = parseFloat($(this).val());
        var ratio = new_span / g_span;
        g_span = new_span;
        g_loc_fr = g_loc_fr * ratio; // rounding to 0, 5, 10, ... makes large error
        g_loc_to = g_loc_to * ratio;
        g_cur_loc = g_cur_loc * ratio;
        $("#label_L").html(g_span.toFixed(g_digit) + " m");
        draw_beam_problem();
        solve_beam_problem();
        draw_beam_diagram();
    });

    // initialize svg
    initialize_svg();

    // draw beam, loads, diagrams, and solve
    draw_beam_problem();
    solve_beam_problem();
    draw_beam_diagram();
});

function drag_load_started() {
    // set point at start of drag
    gv_pre_x = g_loc_fr * gv_ratio_len;
    gv_pre_y = d3.event.y;
    gv_to_fr = (d3.event.x - 100) - g_loc_fr * gv_ratio_len;
    gv_to_to = g_loc_to * gv_ratio_len - (d3.event.x - 100);
}

function drag_load_ing() {
    // if drag is not needed
    if (d3.select(this).datum().drag == false) return;

    // get new x
    var v_new_x = d3.event.x, v_end_x = v_new_x;

    // apply constraint to end point of load
    switch (this.id) {
        case "pnt_load":
            v_new_x = Math.max(0, v_new_x);
            v_new_x = Math.min(v_new_x, gv_span);
            v_end_x = v_new_x;
            break;
        case "ufm_load": // coordinate system of parent node is used
            v_new_x = Math.max(0, (d3.event.x - 100) - gv_to_fr);
            v_end_x = v_new_x + (gv_to_fr + gv_to_to);
            v_end_x = Math.min(v_end_x, g_span * gv_ratio_len);
            v_new_x = v_end_x - (gv_to_fr + gv_to_to);
            break;
        case "s_u_load":
            v_end_x = g_loc_to * gv_ratio_len;
            v_new_x = Math.max(0, gv_pre_x + d3.event.x);
            v_new_x = Math.min(v_new_x, v_end_x - 0.1 * gv_ratio_len); // 0.1 * gv_ratio_len = 0.1m in g_span
            break;
        case "e_u_load":
            v_new_x = gv_pre_x;
            v_end_x = Math.min(v_new_x + d3.event.x, gv_span);
            v_end_x = Math.max(v_new_x + 0.1 * gv_ratio_len, v_end_x); // 0.1 * gv_ratio_len = 0.1m in g_span
            break;
    }

    // update input for position of the load
    //g_loc_fr = round_by_unit(v_new_x / gv_ratio_len, 0.01); // dragging by 0.01m
    //g_loc_to = round_by_unit(v_end_x / gv_ratio_len, 0.01); // dragging by 0.01m
    g_loc_fr = round_by_unit(v_new_x, 2) / gv_ratio_len; // dragging by 2px
    g_loc_to = round_by_unit(v_end_x, 2) / gv_ratio_len; // dragging by 2px

    // redraw problem
    draw_beam_problem();
    solve_beam_problem();
    draw_beam_diagram();
}

function drag_load_ended() { // dummy is required
}

function drag_slider_ing() { // drag function for slider
    // get new x
    //g_cur_loc = round_by_unit(d3.event.x / gv_ratio_len, 5);
    g_cur_loc = d3.event.x / gv_ratio_len;
    g_cur_loc = Math.max(g_cur_loc, 0); // limit of range of new x
    g_cur_loc = Math.min(g_cur_loc, g_span);
    g_cur_loc = round_by_unit(g_cur_loc, Math.min(0.1, g_span / 200)); // dragging by 0.1m

    // snap to indexing location
    var v_tol = gv_span / 100 / gv_ratio_len;
    //var v_tol = gv_span / 500 * gv_ratio_len;
    if (Math.abs(g_cur_loc - g_loc_fr) < v_tol) g_cur_loc = g_loc_fr;
    if (Math.abs(g_cur_loc - g_loc_to) < v_tol) g_cur_loc = g_loc_to;
    //if ((g_setting.Support == g_support[0]) && (Math.abs(g_cur_loc - get_zero_shear_loc()) < v_tol)) g_cur_loc = get_zero_shear_loc();
    if (Math.abs(g_cur_loc - get_zero_shear_loc()) < v_tol) g_cur_loc = get_zero_shear_loc();

    // redraw slider
    draw_slider(d3.select(this.parentNode), g_cur_loc);

    // update tooltip
    g_tooltip
        .style("left", (d3.event.sourceEvent.clientX - 55).toString() + "px")
        .style("top", (d3.event.sourceEvent.clientY - 35).toString() + "px")
        .html(g_cur_loc.toFixed(g_digit) + "m");
}

function change_point_load_color(p_d3, p_color) {
    p_d3.select("text").attr("style", "cursor:default; fill:" + p_color + "; text-anchor:middle");
    p_d3.select("line").attr("style", "fill:" + p_color + "; stroke:" + p_color + "; stroke-opacity:0.7; stroke-width:1");
    p_d3.select("polygon").attr("style", "fill:" + p_color + "; stroke:" + p_color + "; stroke-opacity:0.7; stroke-width:1");
    p_d3.select("path").attr("style", "fill:none; stroke:" + p_color + "; stroke-opacity:0.7; stroke-width:1");
}

function initialize_svg() {
    $("#prob_svg, #dgm_svg").empty();
    append_hatching_pattern("#prob_svg"); // prepare hatching pattern

    g_structure = d3.select("#prob_svg").append("g"); // set svg group
    g_dgm = d3.select("#dgm_svg").append("g"); // set svg group
    g_cur_loc = g_span / 2; // initial location of slider
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw beam
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_beam(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    p_svg_mom.attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // set variable
    span = p_span * gv_ratio_len;

    // beam
    draw_single_member(p_svg_mom, 0, 0, 0, span); // 0 = rotation in cw

    // label
    p_svg_mom.selectAll("text.label").remove();
    var labels = [{ x: 0, y: 0, ang: 0, offset: -gv_ele_unit, offset_ang: 0, label: "A", anchor: "middle" },
                  { x: span, y: 0, ang: 0, offset: gv_ele_unit, offset_ang: 0, label: "B", anchor: "middle" }];
    if (g_setting.Support == g_support[1]) {
        labels = [{ x: 0, y: 0, ang: 0, offset: gv_ele_unit * 1.7, offset_ang: 60, label: "A", anchor: "middle" },
                  { x: span, y: 0, ang: 0, offset: gv_ele_unit, offset_ang: 0, label: "B", anchor: "middle" }];
    }
    draw_labels(p_svg_mom, labels);

    // support
    p_svg_mom.selectAll("g.support").remove();
    var supports = [{ type: "hinge", x: 0, y: gv_ele_unit / 2, ang: 0 },
                    { type: "roller", x: span, y: gv_ele_unit / 2, ang: 0 }];
    if (g_setting.Support == g_support[1]) {
        supports = [{ type: "fix", x: 0, y: 0, ang: p_ang + 90 }];
    }
    draw_supports(p_svg_mom, supports);

    // dimensions
    draw_dimensions(p_svg_mom, 0, 0, 0, "beam_dim", [p_span], gv_margin_unit * 3, "mm", "dn", true);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw diagrams
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function draw_beam_diagram() {
    if (g_dgm == undefined) return;

    // draw free body diagram
    var sx = 130, ang = 0;
    draw_beam_FBD(g_dgm, sx, g_FBD_y, ang, g_span);

    // draw shear force diagram
    draw_beam_SFD(g_dgm, sx, g_SFD_y, ang, g_span);

    // draw beam moment diagram
    draw_beam_BMD(g_dgm, sx, g_BMD_y, ang, g_span);

    // draw slider
    var m_d3 = g_dgm.selectAll(".slider").data([0]).join("g").classed("slider", true)
        .attr("transform", "translate(" + sx + ", 0) rotate(" + ang + ")");
    draw_slider(m_d3, g_cur_loc);
}

function draw_beam_FBD(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // set variable
    var span = p_span * gv_ratio_len;

    // translate and then rotate
    var m_d3 = p_svg_mom.selectAll("g.fbd").data([0]).join("g").classed("fbd", true)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // beam (axis line)
    var members = [{ s: 0, e: span, y: 0, width: 1, color: "lightgrey" }];
    m_d3.selectAll(".axis_line").data(members).join("line").classed("axis_line", true) // line not rectangle
        .attr("x1", d => d.s).attr("y1", d => d.y)
        .attr("x2", d => d.e).attr("y2",  d => d.y)
        .attr("style", d => "stroke:" + d.color + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + d.width);

    // get input values for loads
    var v_loc_fr = g_loc_fr * gv_ratio_len, v_loc_to = g_loc_to * gv_ratio_len;
    var v_load = (Math.abs(g_load) < 0.01) ? gv_load : g_load * gv_ratio_load;
    var v_label = (Math.round(g_load * 10) / 10).toFixed(g_digit);

    // draw load
    m_d3.selectAll("g.point_load, g.uniform_load").remove(); // remove previous load
    if (g_load_type == "point") {
        // prepare data
        var loads = [{ x: v_loc_fr, y: 0, ang: 0, mg: v_load, label: v_label, drag: false, id: "pnt_load" }];

        // draw
        draw_point_load(m_d3, "point_load", loads);
        g_d3_point_load = m_d3.selectAll("g.point_load");
    }
    else if (g_load_type == "uniform") {
        // prepare data for each force
        var frc_nx = Math.ceil((v_loc_to - v_loc_fr) / 20);
        var frc_dx = (v_loc_to - v_loc_fr) / frc_nx;
        var point_loads = [];
        for (i = 0; i <= frc_nx; i++)
            point_loads.push({ x: i * frc_dx, y: 0, ang: 0, mg: v_load, label: undefined, drag: false, id: undefined });

        // draw
        draw_uniform_load(m_d3, "uniform_load", v_loc_fr, 0, 0, v_loc_to - v_loc_fr, v_load, v_label, false, "ufm_load", point_loads);
    }

    // support reactions
    var m_ratio_load = gv_ratio_load;
    if (g_load_type == "uniform") m_ratio_load = gv_load / (g_load * (g_loc_to - g_loc_fr));
    m_d3.selectAll("g.simple_reaction, g.fix_reaction, g.fix_mnt_reaction").remove();
    var loads = [{ x: 0, y: 0, ang: 180, mg: g_reaction[1] * m_ratio_load, label: g_reaction[1].toFixed(g_digit), drag: false, id: undefined }];
    if (g_reaction[1] == 0) loads = [];
    if (g_setting.Support == g_support[0]) { // simple support
        if (g_reaction[2] != 0) loads.push({ x: span, y: 0, ang: 180, mg: g_reaction[2] * m_ratio_load, label: g_reaction[2].toFixed(g_digit), drag: false, id: undefined });
        draw_point_load(m_d3, "simple_reaction", loads);
    }
    else { // cantilever
        draw_point_load(m_d3, "fix_reaction", loads);
        var mnts = [{ x: 0, y: 0, ang: 180, mg: gv_load, label: (-g_reaction[2]).toFixed(g_digit), drag: false, id: undefined, rad: 20, dir: "ccw" }];
        if (g_reaction[2] != 0) draw_point_moment(m_d3, "fix_mnt_reaction", mnts);
    }

    // reaction of node A = initial value of shear and bending moment
    var m_shr_color = "Plum", m_mnt_color = "LightBlue";
    if (g_reaction[1] * g_reaction[2] == 0) { m_shr_color = "dimgrey", m_mnt_color = "dimgrey"; }
    change_point_load_color(m_d3.select(".simple_reaction, .fix_reaction"), m_shr_color);
    change_point_load_color(m_d3.select(".fix_mnt_reaction"), m_mnt_color);
}

function get_FBD_string(p_loc, p_span) {
    if (g_load_type == "point") return [];
    p_loc = Math.max(p_loc, 0);
    p_loc = Math.min(p_loc, p_span);

    if (g_loc_fr < p_loc) {
        var m_loc = Math.min(p_loc, g_loc_to); //console.log([g_loc_fr + ",0 " + g_loc_fr + "," + -Math.abs(get_load(g_loc_fr)) + " " + m_loc + "," + get_load(m_loc) + " " + m_loc + ",0"]);
        return [g_loc_fr + ",0 " + g_loc_fr + "," + get_load(g_loc_fr + 0.01) + " " + m_loc + "," + get_load(m_loc - 0.01) + " " + m_loc + ",0"];
    }
    return [];
}

function draw_beam_SFD(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    var m_d3 = p_svg_mom.selectAll("g.SFD").data([0]).join("g").classed("SFD", true)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // beam
    var members = [{ s: 0, e: span, y: 0, width: 1, color: "dimgrey" }];
    m_d3.selectAll(".axis_line").data(members).join("line").classed("axis_line", true) // line not rectangle
        .attr("x1", d => d.s).attr("y1", d => d.y)
        .attr("x2", d => d.e).attr("y2",  d => d.y)
        .attr("style", d => "stroke:" + d.color + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + d.width);

    // shear
    var m_ratio_load = gv_ratio_load;
    if (g_load_type == "uniform") m_ratio_load = gv_load / (g_load * (g_loc_to - g_loc_fr));
    var shr_str = get_SFD_string(p_span, p_span);
    m_d3.selectAll(".completed_SFD").data(shr_str).join("polygon").classed("completed_SFD", true)
        .attr("transform", "scale(" + gv_ratio_len + "," + -m_ratio_load + ")")
        .attr("points", d => d)
        .attr("style", "fill:lightgrey;");
    m_d3.selectAll(".completed_SFD_init_val").data(shr_str).join("text").classed("completed_SFD_init_val", true)
        .attr("x", -gv_ele_unit / 5).attr("y", d = -get_shear(0) * m_ratio_load - gv_ele_unit / 5)
        .text(d => (get_shear(0)).toFixed(g_digit))
        .attr("style", "cursor:default; fill:Plum; text-anchor:end"); // start/middle/end
}

function get_SFD_string(p_loc, p_span) {
    if (p_loc == 0) return [];
    p_loc = Math.max(p_loc, 0);
    p_loc = Math.min(p_loc, p_span);

    if (p_loc <= g_loc_fr) // left
        return ["0,0 0," + get_shear(0)  + " " + p_loc + "," + get_shear(p_loc) + " " + p_loc + ",0"];
    if ((g_loc_fr < p_loc) && (p_loc <= g_loc_to)) // left + uniform
        return ["0,0 0," + get_shear(0)  + " " + g_loc_fr + "," + get_shear(g_loc_fr) + " " + 
                   p_loc + "," + get_shear(p_loc) + " " + p_loc + ",0"];
    if (g_loc_to < p_loc) // left + uniform + right
        return ["0,0 0," + get_shear(0)  + " " + g_loc_fr + "," + get_shear(g_loc_fr) + " " + 
                   g_loc_to + "," + get_shear(g_loc_to + 0.01) + " " +
                   p_loc + "," + get_shear(p_loc) + " " + p_loc + ",0"];
}

function draw_beam_BMD(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    // translate and then rotate
    var m_d3 = p_svg_mom.selectAll("g.BMD").data([0]).join("g").classed("BMD", true)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")");

    // beam
    var members = [{ s: 0, e: span, y: 0, width: 1, color: "dimgrey" }];
    m_d3.selectAll(".axis_line").data(members).join("line").classed("axis_line", true) // line not rectangle
        .attr("x1", d => d.s).attr("y1", d => d.y)
        .attr("x2", d => d.e).attr("y2",  d => d.y)
        .attr("style", d => "stroke:" + d.color + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + d.width);

    // moment
    var mnt_max = get_moment_max(); if (mnt_max == 0) mnt_max = 1;
    var m_ratio_load = 2 * gv_load / Math.abs(mnt_max);
    var mnt_str = get_BMD_string(p_span, p_span);
    m_d3.selectAll(".completed_BMD").data(mnt_str).join("polygon").classed("completed_BMD", true)
        .attr("transform", "scale(" + gv_ratio_len + "," + m_ratio_load + ")")
        .attr("points", d => d)
        .attr("style", "fill:lightgrey;");
    m_d3.selectAll(".completed_BMD_init_val").data(mnt_str).join("text").classed("completed_BMD_init_val", true)
        .attr("x", -gv_ele_unit / 5).attr("y", d = get_moment(0) * m_ratio_load - gv_ele_unit / 5)
        .text(d => (get_moment(0)).toFixed(g_digit))
        .attr("style", "cursor:default; fill:lightblue; text-anchor:end"); // start/middle/end
}

function get_BMD_string(p_loc, p_span) {
    if (p_loc == 0) return [];
    p_loc = Math.max(p_loc, 0);
    p_loc = Math.min(p_loc, p_span);

    if (p_loc <= g_loc_fr) // left
        return ["0,0 0," + get_moment(0)  + " " + p_loc + "," + get_moment(p_loc) + " " + p_loc + ",0"];
    if ((g_loc_fr < p_loc) && (p_loc <= g_loc_to)) // left + uniform
        return ["0,0 0," + get_moment(0)  + " " + g_loc_fr + "," + get_moment(g_loc_fr) + " " + get_BMD_uniform_string(p_loc) + p_loc + ",0"];
    if (g_loc_to < p_loc) // left + uniform + right
        return ["0,0 0," + get_moment(0)  + " " + g_loc_fr + "," + get_moment(g_loc_fr) + " " + get_BMD_uniform_string(g_loc_to) + p_loc + "," + get_moment(p_loc) + " " + p_loc + ",0"];
}

function get_BMD_uniform_string(p_loc) {
    if (p_loc == g_loc_fr) return "";
    p_loc = Math.max(p_loc, g_loc_fr);
    p_loc = Math.min(p_loc, g_loc_to);

    if (g_load_type == "point") return "";
    var num_inc = Math.round((p_loc - g_loc_fr) * gv_ratio_len / 3); // maybe about 3 pixels...
    var delta = (p_loc - g_loc_fr) / num_inc, mnt_str = "";
    for (i = 1; i <= num_inc; i++) {
        var xx = g_loc_fr + i * delta, yy = get_moment(xx);
        mnt_str = mnt_str + xx + "," + yy + " "; 
    }
    return mnt_str;
}

function draw_slider(p_d3, p_loc) {
    // slider
    var v_loc = p_loc * gv_ratio_len, top = g_FBD_y - 80, btm = g_BMD_y + 110, p_x = 0, p_y = 0;
    if (g_setting.Support == g_support[1]) btm = g_BMD_y + 60;
    p_d3.selectAll(".slider_line").data([btm]).join("line").classed("slider_line", true)
        .attr("x1", v_loc).attr("y1", top)
        .attr("x2", v_loc).attr("y2", d => d)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width: 1");
    p_d3.selectAll(".dots").data([{cx: v_loc, cy: top, r: gv_ele_unit / 2}, {cx: v_loc, cy: btm, r: gv_ele_unit / 2}]).join("circle").classed("dots", true)
        .attr("cx", d => d.cx).attr("cy", d => d.cy)
        .attr("r", d => d.r)
        .attr("style", "cursor: pointer; fill:white; stroke-width:3; stroke:dimgrey")
        .on("mouseover", function () { mouse_enter(); }) // callback functions for mouseover; tooltip for location
        .on("mouseout", function () { mouse_out(); })
        .call(d3.drag() // callback functions for drag
        .on("drag", drag_slider_ing));

    // FBD (load and reaction)
    var m_ratio_load = gv_ratio_load;
    if (g_load_type == "uniform") m_ratio_load = gv_load / (g_load * (g_loc_to - g_loc_fr));
    var fbd_str = get_FBD_string(g_cur_loc, g_span);
    p_d3.selectAll(".parted_FBD").data(fbd_str).join("polygon").classed("parted_FBD", true)
        .attr("transform", "translate(0," + g_FBD_y + ") scale(" + gv_ratio_len + "," + m_ratio_load + ")")
        .attr("points", d => d)
        .attr("style", "fill:OrangeRed; fill-opacity:0.4;");
    var m_color = "dimgrey";
    if ((0 < g_loc_fr) && (g_loc_fr < p_loc)) m_color = "OrangeRed";
    change_point_load_color(g_d3_point_load, m_color);

    // FBD line
    p_d3.selectAll(".FBD_line").data([get_load(p_loc)]).join("line").classed("FBD_line", true)
        .attr("x1", v_loc).attr("y1", g_FBD_y)
        .attr("x2", v_loc).attr("y2", d => g_FBD_y + d * m_ratio_load)
        .attr("style", "stroke:OrangeRed; stroke-linejoin:round; stroke-linecap:round; stroke-width: 2");
    var m_load = 0;
    if ((g_loc_fr <= p_loc) && (p_loc <= g_loc_to) && (g_loc_fr != g_loc_to)) m_load = g_load;
    p_d3.selectAll(".FBD_line_text").data([-m_load]).join("text").classed("FBD_line_text", true)
        .attr("x", v_loc + gv_ele_unit / 5).attr("y", g_FBD_y + 4 * gv_ele_unit / 5)
        .text(d => "-w(x) = " + d.toFixed(g_digit))
        .attr("style", "cursor:default; fill:OrangeRed; text-anchor:start"); // start/middle/end
    p_d3.selectAll(".FBD_area_text").data([get_load(p_loc)]).join("text").classed("FBD_area_text", true)
        .attr("x", v_loc - gv_ele_unit / 5).attr("y", g_FBD_y + 4 * gv_ele_unit / 5)
        .text("area = " + (get_shear(p_loc) - get_shear(0)).toFixed(g_digit))
        .attr("style", "cursor:default; fill:#F0A0A0; text-anchor:end"); // start/middle/end

    // shear
    var m_ratio_load = gv_ratio_load;
    if (g_load_type == "uniform") m_ratio_load = gv_load / (g_load * (g_loc_to - g_loc_fr));
    var shr_str = get_SFD_string(g_cur_loc, g_span);
    p_d3.selectAll(".parted_SFD").data(shr_str).join("polygon").classed("parted_SFD", true)
        .attr("transform", "translate(0," + g_SFD_y + ") scale(" + gv_ratio_len + "," + -m_ratio_load + ")")
        .attr("points", d => d)
        .attr("style", "fill:Plum;");

    // shear line
    p_d3.selectAll(".SFD_line").data([get_shear(p_loc)]).join("line").classed("SFD_line", true).raise()
        .attr("x1", v_loc).attr("y1", g_SFD_y)
        .attr("x2", v_loc).attr("y2", d => g_SFD_y - d * m_ratio_load)
        .attr("style", "stroke:MediumVioletRed; stroke-linejoin:round; stroke-linecap:round; stroke-width: 2");
    p_d3.selectAll(".SFD_line_text").data([get_shear(p_loc)]).join("text").classed("SFD_line_text", true)
        .attr("x", v_loc + gv_ele_unit / 5).attr("y", d => g_SFD_y - d * m_ratio_load - ((d >= 0) ? 1.3 : -4) * gv_ele_unit / 5)
        .html(d => "V(x) = " + d.toFixed(g_digit) + " = <tspan style='fill:Plum;'>" + get_shear(0).toFixed(g_digit) + "</tspan> + <tspan style='fill:#F0A0A0;'>" + (d - get_shear(0)).toFixed(g_digit) + "</tspan>")
        .attr("style", "cursor:default; fill:MediumVioletRed; text-anchor:start"); // start/middle/end
    p_d3.selectAll(".SFD_area_text").data([get_shear(p_loc)]).join("text").classed("SFD_area_text", true)
        .attr("x", v_loc - gv_ele_unit / 5).attr("y", d => g_SFD_y + ((d >= 0) ? 4 : -1.3) * gv_ele_unit / 5)
        .text(d => "area = " + (get_moment(p_loc) - get_moment(0)).toFixed(g_digit))
        .attr("style", "cursor:default; fill:Plum; text-anchor:end"); // start/middle/end

    // slope for shear
    var lines = get_tangent_line(p_loc, "shear", -m_ratio_load);
    draw_tangent_line(p_d3, "shear_slope_line", lines);

    // BMD
    var mnt_max = get_moment_max(); if (mnt_max == 0) mnt_max = 1;
    var m_ratio_load = 2 * gv_load / Math.abs(mnt_max);
    var mnt_str = get_BMD_string(g_cur_loc, g_span);
    p_d3.selectAll(".parted_BMD").data(mnt_str).join("polygon").classed("parted_BMD", true)
        .attr("transform", "translate(0," + g_BMD_y + ") scale(" + gv_ratio_len + "," + m_ratio_load + ")")
        .attr("points", d => d)
        .attr("style", "fill:LightBlue;");

    // moment line
    p_d3.selectAll(".BMD_line").data([get_moment(p_loc)]).join("line").classed("BMD_line", true).raise()
        .attr("x1", v_loc).attr("y1", g_BMD_y)
        .attr("x2", v_loc).attr("y2", d => g_BMD_y + d * m_ratio_load)
        .attr("style", "stroke:SteelBlue; stroke-linejoin:round; stroke-linecap:round; stroke-width: 2");
    p_d3.selectAll(".BMD_line_text").data([get_moment(p_loc)]).join("text").classed("BMD_line_text", true)
        .attr("x", v_loc + gv_ele_unit / 5).attr("y", d => g_BMD_y + d * m_ratio_load + ((d >= 0) ? 4 : -1.3) * gv_ele_unit / 5)
        .html(d => "M(x) = " + d.toFixed(g_digit) + " = <tspan style='fill:LightBlue;'>" + get_moment(0).toFixed(g_digit) + "</tspan> + <tspan style='fill:Plum;'>" + (d - get_moment(0)).toFixed(g_digit) + "</tspan>")
        //.html(d => "M(x) = " + d.toFixed(g_digit) + " = " + get_moment(0).toFixed(g_digit) + " + " + (d - get_moment(0)).toFixed(g_digit))
        .attr("style", "cursor:default; fill:SteelBlue; text-anchor:start"); // start/middle/end

    // slope for moment
    var lines = get_tangent_line(p_loc, "moment", m_ratio_load);
    draw_tangent_line(p_d3, "moment_slope_line", lines);
}

function get_tangent_line(p_loc, p_type, p_rto) {
    var x = p_loc, y = get_shear(x), a = 0, b = -a * x + y, m_dy = g_SFD_y, m_color = "OrangeRed";
    if ((g_loc_fr <= p_loc) && (p_loc <= g_loc_to) && (g_loc_fr != g_loc_to)) { a = -g_load; b = -a * x + y; }
    if (p_type == "moment") { y = get_moment(x), a = get_shear(x), b = -a * x + y, m_dy = g_BMD_y, m_color = "MediumVioletRed"; }
    var ref_line = { sx: -0.05 * g_span + x, sy: y, ex: x + 0.05 * g_span, ey: y, slp: 0, dy: m_dy, color: m_color, ratio: p_rto};
    var tngt_line = { sx: ref_line.sx, sy: poly_val([a, b], ref_line.sx), ex: ref_line.ex, ey: poly_val([a, b], ref_line.ex), slp: a, dy: ref_line.dy, color: ref_line.color, ratio: ref_line.ratio };
    return [ref_line, tngt_line];
}

function draw_tangent_line(p_d3, p_class, p_data) {
    p_d3.selectAll("." + p_class).data(p_data).join("line").classed(p_class, true).raise()
        .attr("x1", ln => ln.sx * gv_ratio_len).attr("y1", ln => ln.dy + ln.sy * ln.ratio)
        .attr("x2", ln => ln.ex * gv_ratio_len).attr("y2", ln => ln.dy + ln.ey * ln.ratio)
        .attr("stroke-dasharray", "1 3") // line 1, space 3; line-line
        .attr("style", ln => "stroke:" + ln.color + "; stroke-width:2;");
    p_d3.selectAll("." + p_class + "_text").data([p_data[1]]).join("text").classed(p_class + "_text", true).raise()
        .attr("x", ln => ln.sx * gv_ratio_len - gv_ele_unit / 5)
        .attr("y", ln => ln.dy + ((3 * ln.sy + ln.ey) / 4) * ln.ratio + 1.3 * gv_ele_unit / 5)
        .text(ln => "slope = " + ln.slp.toFixed(g_digit))
        .attr("style", ln => "cursor:default; fill:" + ln.color + "; text-anchor:end"); // start/middle/end
}

function mouse_enter() {
    var tooltip_text = g_cur_loc.toFixed(g_digit) + "m";
    g_tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div").classed("tooltip", true)
        .style("left", (d3.event.pageX - 55).toString() + "px")
        .style("top", (d3.event.pageY - 35).toString() + "px")
        .style("width", "100px")
        .style("opacity", 0)
        .text(tooltip_text);
    g_tooltip
        .transition().duration(500)
        .style("opacity", .8);
}

function draw_beam_problem() {
    // prepare variable for drawing
    gv_ratio_len = gv_span / g_span;
    gv_ratio_load = gv_load / g_load;

    // draw beam
    var sx = 100, sy = 100, ang = 0;
    draw_beam(g_structure, sx, sy, ang, g_span);
    
    // draw loads
    draw_beam_loads(g_structure, 1, true, true); // 1 = the 1st load, true = draw dimension, true = make load draggable

    // change unit; N -> kN, mm -> m
    g_structure.selectAll("#load_magnitude").text(g_load.toFixed(g_digit) + ((g_load_type == "point") ? "kN" : "kN/m"));
    var m_len = g_structure.selectAll("#span_length").each(function (d, i) {
        //if (i == 0) d3.select(this).text(g_span.toFixed(g_digit) + "m");
        //if (i == 1) d3.select(this).text(g_loc_fr.toFixed(g_digit) + "m");
        //if (i == 2)
        //    if (g_load_type == "point") d3.select(this).text((g_span - g_loc_to).toFixed(g_digit) + "m");
        //    else d3.select(this).text((g_loc_to - g_loc_fr).toFixed(g_digit) + "m");
        //if (i == 3) d3.select(this).text((g_span - g_loc_to).toFixed(g_digit) + "m");

        d3.select(this).text(d3.select(this).text().slice(0, -2) + "m");
    })
}

function solve_beam_problem() {
    // get magnitude of load and location
    var load = g_load, dist = g_loc_fr;
    if (g_load_type == "uniform") {
        dist = +((g_loc_fr + g_loc_to) / 2).toFixed(g_digit); // 3.toFixed(4) ==> string "3.0000"; +3.toFixed(4) ==> number 3.0000
        load = +(g_load * (g_loc_to - g_loc_fr)).toFixed(g_digit);
    }

    // compute reactions
    g_reaction = [0, load * (g_span - dist) / g_span, load * (dist / g_span)]; // g_Ha, g_Va, g_Vb
    if (g_setting.Support == g_support[1]) g_reaction = [0, load, load * dist]; // g_Ha, g_Va, g_Ma; for cantilever
}

function get_load(p_loc) { // load and reaction
    // point load
    if (g_load_type == "point") {
        if ((g_loc_fr == 0)) return 0; // no member force
        if (p_loc == 0) return g_reaction[1];
        if (g_setting.Support == g_support[0]) { // simple support
            if ((g_loc_fr == g_span)) return 0; // no member force
            if (p_loc == g_span) return g_reaction[2];
        }
        if (p_loc == g_loc_fr) return -g_load;
        return 0;
    }

    // uniform load
    if (p_loc == 0) return g_reaction[1];
    if ((g_loc_fr <= p_loc) && (p_loc <= g_loc_to)) { // resultant force for drawing only
        if (g_setting.Support == g_support[0]) 
            if (p_loc == g_span) return g_reaction[2]; // V_b
            else return -(g_reaction[1] + g_reaction[2]); // V_a + V_b = g_load * (g_loc_to - g_loc_fr)
        else return -g_reaction[1]; // V_a = g_load * (g_loc_to - g_loc_fr)
    }
    if ((p_loc == g_span) && (g_setting.Support == g_support[0])) return g_reaction[2];
    return 0;
}

function get_shear(p_loc) {
    if ((g_load_type == "point") && (g_loc_fr == 0)) return 0;
    var sx = g_loc_fr, sy = g_reaction[1]; // V_a
    var ex = g_loc_to, ey = (g_setting.Support == g_support[0]) ? -g_reaction[2] : 0; // V_b or 0

    if (p_loc <= g_loc_fr) return sy;
    if (g_loc_to < p_loc) return ey;

    var aa = (ey - sy) / (ex - sx), bb = sy - aa * sx;
    return poly_val([aa, bb], p_loc);
}

function get_zero_shear_loc() { // location from g_loc_fr
    if (g_setting.Support == g_support[0]) // simple support
        return g_loc_fr + (g_loc_to - g_loc_fr) * g_reaction[1] / (g_reaction[1] + g_reaction[2]);
    else
        return g_loc_to; // except for the part of no member force
}

function get_moment(p_loc) {
    var init_val = (g_setting.Support == g_support[0]) ? 0 : -g_reaction[2]; // 0 or M_a

    if (p_loc <= g_loc_fr) return init_val + p_loc * get_shear(p_loc);
    if (g_loc_to < p_loc) return (g_setting.Support == g_support[0]) ? (p_loc - g_span) * get_shear(p_loc) : 0;

    return init_val + g_reaction[1] * g_loc_fr + (g_reaction[1] + get_shear(p_loc)) * (p_loc - g_loc_fr) / 2;
}

function get_moment_max() {
    // in case of cantilever
    if (g_setting.Support == g_support[1]) return -g_reaction[2]; // M_a

    // in case of simple beam
    var moment_max = g_reaction[1] * g_loc_fr;
    if (g_load_type == "uniform") moment_max = moment_max + (g_loc_to - g_loc_fr) * g_reaction[1] / (g_reaction[1] + g_reaction[2]) * g_reaction[1] / 2;
    return moment_max;
}
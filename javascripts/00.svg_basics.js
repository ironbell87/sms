//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw basic elements : members, supports, loads, dimensions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// variables for visualization
var g_digit = 2;
var gv_span = 500, gv_hgt, gv_load = 30;
var gv_margin_unit = 15, gv_ele_unit = 15;
var gv_ratio_len, gv_ratio_load;

// variables for structure
var g_structure, g_fbd, g_measurement;
var gv_pre_x, gv_pre_y; // for dragging
var g_tooltip; // for tooltip

function append_hatching_pattern() {
    d3.select("svg").append("pattern")
        .attr("id", "hatch")
        .attr("width", 3).attr("height", 3)
        .attr("patternTransform", "rotate(45 0 0)")
        .attr("patternUnits", "userSpaceOnUse")
        .append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", 3)
        .attr("style", "stroke:dimgrey; stroke-width:1");
}

function draw_single_cable(p_svg_mom, p_org_x, p_org_y, p_ang, p_length) {
    p_svg_mom.append("line") // thick line not rectangle; boundary
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", p_length).attr("y2", 0)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + gv_ele_unit /2)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    p_svg_mom.append("line") // thick line not rectangle; interior
        .attr("x1", 0.5).attr("y1", 0)
        .attr("x2", (p_length - 0.5)).attr("y2", 0)
        .attr("style", "stroke:lightgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + (gv_ele_unit / 2 - 1))
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
}

function draw_single_cable_with_points(p_svg_mom, p_sx, p_sy, p_ex, p_ey) {
    var dx = p_ex - p_sx, dy = p_ey - p_sy; // vector from spnt to epnt
    var vx = dx / Math.sqrt(dx * dx + dy * dy), vy = dy / Math.sqrt(dx * dx + dy * dy); // unit vector of (dx, dy)

    p_svg_mom.append("line") // thick line not rectangle; boundary
        .attr("x1", p_sx).attr("y1", p_sy)
        .attr("x2", p_ex).attr("y2", p_ey)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + gv_ele_unit / 2);
    p_svg_mom.append("line") // thick line not rectangle; interior
        .attr("x1", p_sx + vx / 2).attr("y1", p_sy + vy / 2)
        .attr("x2", p_ex - vx / 2).attr("y2", p_ey - vy / 2)
        .attr("style", "stroke:lightgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + (gv_ele_unit / 2 - 1));
}

function draw_pendulum(p_svg_mom, p_x, p_y, p_load, p_drag, p_id) {
    var svg_defs = p_svg_mom.append("defs"); // define defs for pattern
    var img_pattern = svg_defs.append("pattern") // create pattern in defs
        .attr("id", "img_pattern")
        .attr("height", 1).attr("width", 1)
        .attr("x", "0").attr("y", "0");
    img_pattern.append("image") // square image contained in pattern
        .attr("x", 0).attr("y", 0)
        .attr("height", 40).attr("width", 40) // image size
        .attr("xlink:href", "../images/ironman.png");
    p_svg_mom.append("circle") // set circle fill to the created pattern => make square image to circle image
        .attr("id", p_id)
        .attr("cy", 0).attr("cy", 0).attr("r", 20)
        .attr("fill", "url(#img_pattern)")
        .attr("transform", "translate(" + p_x + "," + p_y + ") scale(1,-1)"); // translate
    p_svg_mom.append("text")
        .attr("x", 0).attr("y", 0).text(p_load)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle") // start/middle/end
        .attr("transform", "translate(" + p_x + "," + (p_y - 35) + ") scale(1,-1)");

    // set drag callback function
    if (p_drag == true) {
        d3.select("#" + p_id).attr("style", "cursor:pointer; stroke-width:2; stroke:#ff6f6f").call(d3.drag()
            //.container(p_svg_mom.node()) // make beam the coordinate system of dragging point
            .on("start", drag_pendulum_started)
            .on("drag", drag_pendulum_ing)
            .on("end", drag_pendulum_ended));
    }
    //p_svg_mom.append("text")
    //    //.attr("transform", "translate(" + p_x + "," + p_y + ")") // translate
    //    .attr("x", p_x).attr("y", p_y)
    //    .attr("text-anchor", "middle").attr("dominant-baseline", "central")
    //    .attr("font-family", "FontAwesome")
    //    .attr("font-size", "20px").attr("fill", "white")
    //    .text("\uf57e"); // \uf57e = globe-asia
}

function draw_pin(p_svg_mom, p_org_x, p_org_y, p_ang) {
    // variables for loc, size
    var rad = gv_ele_unit / 2;
    //var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = rad * 2;

    // draw pin for cable
    var pin = p_svg_mom.append("g") // set group for pin
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    pin.append("circle") // pin
        .attr("cx", 0).attr("cy", 0).attr("r", rad)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
}

function draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    p_svg_mom.append("line") // line not rectangle
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", p_span).attr("y2", 0)
        .attr("style", "stroke:dimgrey; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + gv_ele_unit)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    p_svg_mom.append("line") // line not rectangle
        .attr("x1", 0.5).attr("y1", 0)
        .attr("x2", (p_span - 0.5)).attr("y2", 0)
        .attr("style", "stroke:lightgrey; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + (gv_ele_unit - 1))
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
}

function draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang) {
    // variables for loc, size
    var rad = gv_ele_unit / 2;
    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = rad * 2;

    // draw roller
    var roller = p_svg_mom.append("g") // set group for roller
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    roller.append("circle") // roller
        .attr("cx", 0).attr("cy", rad).attr("r", rad)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    draw_fix(roller, 0, hatch_y, 0); // draw fix
}

function draw_roller_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_v_up_dn) {
    // draw concentrated load with label
    var v_load = 0;
    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
}

function draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang) {
    // variables for loc, size
    var tri_w = 15, tri_h = gv_ele_unit;
    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = tri_h;
    var tri_str = -tri_w / 2 + "," + tri_h + " " + tri_w / 2 + "," + tri_h + " 0,0";

    // draw hinge
    var hinge = p_svg_mom.append("g") // set group for hinge
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    hinge.append("polygon") // triangle
        .attr("points", tri_str)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    draw_fix(hinge, 0, hatch_y, 0); // draw fix
}

function draw_hinge_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
    // draw concentrated load with label
    var v_load = 0;
    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
}

function draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang) {
    // variables for loc, size
    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = 0;

    // draw fix
    var fix = p_svg_mom.append("g") // set group for roller
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    fix.append("line") // line
        .attr("x1", hatch_x).attr("y1", hatch_y)
        .attr("x2", hatch_x + hatch_w).attr("y2", hatch_y)
        .attr("style", "stroke:dimgrey; stroke-width:1");
    fix.append("rect") // support
        .attr("x", hatch_x).attr("y", hatch_y)
        .attr("width", hatch_w).attr("height", hatch_h)
        .attr("fill", "url(#hatch)");
}

function draw_fix_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
    // draw concentrated load with label
    var v_load = 0;
    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
    draw_reaction_moment(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, p_ang, v_load, "ccw", p_node_label);
}

function draw_hinge_joint(p_svg_mom, p_org_x, p_org_y) {
    // variables for loc, size
    var rad = gv_ele_unit / 2;

    // draw hinge joint
    var hinge = p_svg_mom.append("circle")
        .attr("cx", 0).attr("cy", 0).attr("r", rad)
        .attr("style", "fill:white; stroke-width:1; stroke:grey")
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ")"); // translate and then rotate
}

function draw_point_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_unit, p_up_dn, p_drag, p_id) {
    // variables for loc, size
    var tri_w = 6, tri_h = 6;
    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
    var v_load = p_load * gv_ratio_load;
    var v_label = Math.round(p_load * 10) / 10 + p_unit;
    if (Math.abs(p_load) < 0.01) {
        v_load = gv_load;
        v_label = p_unit;
    }

    // set location along the p_up_dn
    var up_dn_offset = 0, text_y = -v_load - 10;
    if (p_up_dn == "up") { // if upward load
        alert("### p_up_dn is used!! A close investigation is needed!! ###");
        up_dn_offset = v_load;
        text_y = up_dn_offset + 10;
    }

    // draw force
    var pnt_frc = p_svg_mom.append("g") // set group for arrow
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    pnt_frc.append("polygon") // triangle
        //.attr("transform", "translate(0," + up_dn_offset + ")")
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    pnt_frc.append("line") // line
        //.attr("transform", "translate(0," + up_dn_offset + ")")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", -v_load)
        .attr("style", "stroke-width:1; stroke:dimgrey");

    // write magnitude of load
    if (p_unit != undefined) { // do not write magnitude for distributed load
        var m_svg_mom = pnt_frc.append("text") // magnitude
            .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
            .attr("x", 0).attr("y", 0)
            .text(v_label)
            .attr("style", "fill:grey; text-anchor:middle")
            .attr("id", "load_magnitude");

        // click on load magnitude to change the magnitude
        m_svg_mom.on("click", click_load);
    }

    // set drag callback function
    if (p_drag == true) {
        if (p_id != "pnt_load") {
            p_svg_mom = d3.select(p_svg_mom.node().parentNode);
        }
        //pnt_frc.select("polygon").style("cursor", "pointer").call(d3.drag() //pnt_frc.on("click", toggleColor);
        pnt_frc.select("polygon").attr("style", "cursor:pointer; fill:#ff6f6f; stroke-width:3; stroke:#ff6f6f").call(d3.drag() //pnt_frc.on("click", toggleColor);
            .container(p_svg_mom.node()) // make beam the coordinate system of dragging point
            .on("start", drag_load_started)
            .on("drag", drag_load_ing)
            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
            .on("end", drag_load_ended))
            .attr("id", p_id);
        pnt_frc.select("line").attr("style", "stroke-width:1; stroke:#ff6f6f");
        pnt_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
    }
}

function draw_point_moment(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_dir, p_unit_label, p_sub) {
    // variables for loc, size
    var tri_w = 6, tri_h = 6;
    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
    var mnt_rad = 20;
    var v_label = Math.round(p_load * 10) / 10 + p_unit_label;
    if (Math.abs(p_load) < 0.01) {
        v_label = p_unit_label;
    }

    // draw force
    var pnt_frc = p_svg_mom.append("g") // set group for arrow
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    var arrow = pnt_frc.append("polygon") // arrow
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    if (p_dir == "ccw") {
        arrow.attr("transform", "translate(" + -tri_h + "," + -mnt_rad + ") rotate(90)") // translate and then rotate
    }
    else {
        arrow.attr("transform", "translate(" + -tri_h + "," + mnt_rad + ") rotate(90)") // translate and then rotate
    }
    pnt_frc.append("path") // arc
        //.attr("d", "M0,-20 A20,20 0 0,1 0,20")
        .attr("d", "M0," + -mnt_rad + " A" + mnt_rad + "," + mnt_rad + " 0 0,1 0," + mnt_rad)
        .attr("style", "fill:none; stroke-width:1; stroke:dimgrey");

    // write magnitude
    if (p_unit_label != undefined) {
        var m_svg_mom = pnt_frc.append("text") // magnitude
            .attr("x", 0).attr("y", -mnt_rad - 4)
            .text(v_label)
            .attr("style", "fill:grey; text-anchor:middle");
        if (p_sub != undefined) {
            draw_sup_sub(m_svg_mom, undefined, p_sub);
        }
    }
}

function draw_unifrom_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_width, p_load, p_unit, p_drag, p_id) {
    // variables for loc, size
    var v_load = p_load * gv_ratio_load;
    var v_label = Math.round(p_load * 10) / 10 + p_unit;
    if (Math.abs(p_load) < 0.01) {
        v_load = gv_load;
        v_label = p_unit;
    }

    // draw bounding rect
    var ufm_frc = p_svg_mom.append("g")
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate
    ufm_frc.append("rect")
        .attr("x", 0).attr("y", -v_load)
        .attr("width", p_width).attr("height", v_load)
        .attr("style", "fill:lightgrey; fill-opacity:0.2; stroke:darkgrey");

    // draw each force
    var frc_nx = Math.ceil(p_width / 20);
    var frc_dx = p_width / frc_nx;
    for (i = 0; i <= frc_nx; i++) {
        if (i == 0) draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, p_drag, "s_u_load"); // the 1st and last; s_u = start of uniform load
        else if (i == frc_nx) draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, p_drag, "e_u_load"); // the 1st and last; e_u = end of uniform load
        else draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, false);
    }

    // write magnitude
    if (p_unit != undefined) {
        var m_svg_mom = ufm_frc.append("text") // magnitude
            .attr("x", p_width / 2).attr("y", -v_load - 4) // 6 (of triangle height) + 4 (margin)
            .text(v_label)
            .attr("style", "fill:grey; text-anchor:middle")
            .attr("id", "load_magnitude");

        // click on load magnitude to change the magnitude
        m_svg_mom.on("click", click_load);
    }

    // set drag callback function
    if (p_drag == true) {
        ufm_frc.select("rect").attr("style", "cursor:pointer; fill:#ff6f6f; fill-opacity:0.2; stroke-width:1; stroke:#ffafaf").call(d3.drag() //pnt_frc.on("click", toggleColor);
            .container(p_svg_mom.node()) // make beam the coordinate system of dragging point
            .on("start", drag_load_started)
            .on("drag", drag_load_ing)
            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
            .on("end", drag_load_ended))
            .attr("id", p_id);
        ufm_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
    }
}

function draw_beam_loads(p_svg_mom, p_idx, p_draw_dim, p_drag) {
    // get input values
    var v_loc_fr = g_loc_fr * gv_ratio_len, v_loc_to = g_loc_to * gv_ratio_len;

    // draw load and dimensions
    if (g_load_type == "point") {
        draw_point_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, g_load, "N", "dn", p_drag, "pnt_load"); // dn = downward load
        if (p_draw_dim == false) return;
        draw_dimensions(p_svg_mom, 0, 0, 0, [g_loc_fr, (g_span - g_loc_fr)], gv_margin_unit * 5, "mm", "dn");
    }
    else if (g_load_type == "uniform") {
        draw_unifrom_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, v_loc_to - v_loc_fr, g_load, "N/mm", p_drag, "ufm_load"); // true = make load draggable
        if (p_draw_dim == false) return;
        var dims = [g_loc_to - g_loc_fr];
        if (Math.abs(g_loc_fr) > 1.0e-3) dims.splice(0, 0, g_loc_fr);
        if (Math.abs(g_loc_to - g_span) > 1.0e-3) dims.push(g_span - g_loc_to);
        draw_dimensions(p_svg_mom, 0, 0, 0, dims, gv_margin_unit * 5, "mm", "dn");
    }
}

function draw_reaction_force(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_label, p_sub, p_up_dn) {
    // variables for loc, size
    var tri_w = 6, tri_h = 6;
    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
    var v_load = p_load * gv_ratio_load;
    var v_label = p_label;
    if (Math.abs(p_load) < 0.01) {
        v_load = gv_load;
    }

    // set location along the p_up_dn
    var up_dn_offset = 0, text_y = -v_load - gv_ele_unit;
    if (p_up_dn == "up") { // if upward load
        up_dn_offset = v_load;
        text_y = up_dn_offset + gv_ele_unit;
    }

    // draw force
    var pnt_frc = p_svg_mom.append("g") // set group for arrow
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    pnt_frc.append("polygon") // triangle
        //.attr("transform", "translate(0," + up_dn_offset + ")")
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    pnt_frc.append("line") // line
        //.attr("transform", "translate(0," + up_dn_offset + ")")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", -v_load)
        .attr("style", "stroke-width:1; stroke:dimgrey");

    // write reaction label
    var m_svg_mom = pnt_frc.append("text") // magnitude
        .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
        .attr("x", 0).attr("y", 0)
        .text(v_label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
    if (p_sub != undefined) {
        draw_sup_sub(m_svg_mom, undefined, p_sub);
    }
}

function draw_reaction_moment(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_dir, p_sub) {
    // variables for loc, size
    var tri_w = 6, tri_h = 6;
    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
    var mnt_rad = 20;
    var v_label = "M";
    if (Math.abs(p_load) < 0.01) {
        v_load = gv_load;
    }

    // draw moment
    var pnt_mnt = p_svg_mom.append("g") // set group for arrow
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    var arrow = pnt_mnt.append("polygon") // arrow
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    if (p_dir == "ccw") {
        arrow.attr("transform", "translate(" + -tri_h + "," + -mnt_rad + ") rotate(90)") // translate and then rotate
    }
    else {
        arrow.attr("transform", "translate(" + -tri_h + "," + mnt_rad + ") rotate(90)") // translate and then rotate
    }
    pnt_mnt.append("path") // arc
        //.attr("d", "M0,-20 A20,20 0 0,1 0,20")
        .attr("d", "M0," + -mnt_rad + " A" + mnt_rad + "," + mnt_rad + " 0 0,1 0," + mnt_rad)
        .attr("style", "fill:none; stroke-width:1; stroke:dimgrey");

    // write reaction label
    var m_svg_mom = pnt_mnt.append("text") // magnitude
        .attr("transform", "rotate(" + -p_ang + ")") // translate and then rotate the object and axes
        .attr("x", 0).attr("y", -mnt_rad - gv_ele_unit)
        .text(v_label)
        .attr("style", "fill:grey; text-anchor:middle");
    if (p_sub != undefined) {
        draw_sup_sub(m_svg_mom, undefined, p_sub);
    }
}

function draw_dimensions(p_svg_mom, p_org_x, p_org_y, p_ang, p_dims, p_margin, p_unit, p_up_dn, p_click) {
    // prepare data
    var v_dims = [p_dims[0] * gv_ratio_len];
    var sx = [0], ex = [v_dims[0]];
    for (var i = 1; i < p_dims.length; i++) {
        v_dims.push(p_dims[i] * gv_ratio_len);
        sx.push(sx[i - 1] + v_dims[i - 1]);
        ex.push(ex[i - 1] + v_dims[i]);
    }

    // text location in y
    var text_y = p_margin + 14; // font-size=10, spacing = 4
    if (p_up_dn == "up") text_y = p_margin - 4;

    // dimensions
    var dim = p_svg_mom.append("g") // set group
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    dim.append("circle") // dots at start point
        .attr("cx", 0).attr("cy", p_margin).attr("r", 3)
        .attr("style", "fill:grey; stroke-width:1; stroke:none");
    var dims = dim.selectAll("g").data(p_dims).enter();
    dims.append("line") // dimension line
        .attr("x1", function (d, i) { return sx[i]; }).attr("y1", p_margin)
        .attr("x2", function (d, i) { return ex[i]; }).attr("y2", p_margin)
        .attr("style", "stroke:grey; stroke-width:1");
    dims.append("circle") // dots at end points
        .attr("cx", function (d, i) { return ex[i]; }).attr("cy", p_margin).attr("r", 3)
        .attr("style", "fill:grey; stroke-width:1; stroke:none");
    dims.append("text") // dimensions
        .attr("x", function (d, i) { return (sx[i] + ex[i]) / 2; }).attr("y", text_y)
        .text(function (d, i) { return Math.round(p_dims[i] * 10) / 10 + p_unit; }) // p_dims = dims for texting
        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
        .attr("id", "span_length");

    if (p_click == true) {
        dims.select("text").on("click", click_span)
            .attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
    }
}

//function draw_arrow(p_svg_mom, p_org_x, p_org_y, p_ang, p_magnitude, p_drag) {
//    // downward arrowhead(triangle) at (0,0)
//    var tri_w = 6, tri_h = 6;
//    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
//    p_svg_mom.append("polygon")
//        .attr("points", tri_str)
//        .attr("style", "fill:dimgrey;stroke-width:1;stroke:dimgrey");

//    // line (0,0)->(0,-magnitude)
//    p_svg_mom.append("line")
//        //.attr("transform", "translate(0," + up_dn_offset + ")")
//        .attr("x1", 0).attr("y1", 0)
//        .attr("x2", 0).attr("y2", -p_magnitude)
//        .attr("style", "stroke-width:1;stroke:dimgrey");

//    // set drag callback function
//    if (p_drag == true) {
//        p_svg_mom.style("cursor", "pointer").call(d3.drag() //pnt_frc.on("click", toggleColor);
//            .on("start", drag_arrow_started)
//            .on("drag", function () { drag_arrow_ing(this, p_org_y); }) // different type of function call for passing parameters
//            .on("end", drag_arrow_ended));
//    }
//}

function draw_label(p_svg_mom, p_org_x, p_org_y, p_ang, p_offset, p_offset_ang, p_label, p_anchor) {
    // text location
    var ang_rad = p_offset_ang * (Math.PI / 180);
    var offset_x = Math.cos(ang_rad) * p_offset, offset_y = Math.sin(ang_rad) * p_offset; // p_margin + 14; // font-size=10, spacing = 4

    // label
    var label = p_svg_mom.append("text")
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate the object and axes
        .attr("x", offset_x).attr("y", offset_y + 5) // the origin is (0, 0)
        .text(p_label)
        .attr("style", "cursor:default; fill:grey; text-anchor:" + p_anchor); // p_anchor = start/middle/end
}
//////function draw_label(p_svg_mom, p_org_x, p_org_y, p_ang, p_offset, p_offset_ang, p_label, p_sub, p_anchor, p_id) {
//////    // text location, not text rotation
//////    var ang_rad = p_offset_ang * (Math.PI / 180);
//////    var offset_x = Math.cos(ang_rad) * p_offset, offset_y = Math.sin(ang_rad) * p_offset; // p_margin + 14; // font-size=10, spacing = 4

//////    // draw text
//////    var label = p_svg_mom.append("text")
//////        .attr("transform", "rotate(" + -p_ang + "," + offset_x + "," + offset_y + ")") // rotate object and axes by -p_ang about (offset_x, offset_y)
//////        .attr("x", offset_x).attr("y", offset_y) // origin is (0, 0)
//////        .text(p_label)
//////        .attr("style", "fill: grey; text-anchor: " + p_anchor); // p_anchor = start/middle/end
//////    if (p_sub != undefined) {
//////        draw_sup_sub(label, undefined, p_sub);
//////    }

//////    // bind click event
//////    if (p_id != undefined) {
//////        label.attr("id", p_id)
//////        label.on("click", click_load_magnitude);
//////    }
//////}

function draw_sup_sub(p_svg_mom, p_sup, p_sub) {
    if (p_sup != undefined) { // superscript
        p_svg_mom.append("tspan")
            .text(p_sup)
            .attr("baseline-shift", "super")
            .attr("font-size", "62%"); // not work!!!
    }
    if (p_sub != undefined) { // subscript
        p_svg_mom.append("tspan")
            .text(p_sub)
            .attr("baseline-shift", "sub")
            .attr("font-size", "62%"); // not work!!!
    }
}

function get_transformation(transform) {
    // get the values of translation, rotation, ...
    // replacement of d3.transform in D3.js v3 which is removed in D3.js v4
    // the example of the input parameter "transform" = "rotate(45) skewX(20) translate(20,30) translate(-5,40)"

    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function 
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);
    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix. 
    var matrix = g.transform.baseVal.consolidate().matrix;

    // Below calculations are taken and adapted from the private function
    // transform/decompose.js of D3's module d3-interpolate.
    var { a, b, c, d, e, f } = matrix;   // ES6, if this doesn't work, use below assignment
    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * 180 / Math.PI,
        skewX: Math.atan(skewX) * 180 / Math.PI,
        scaleX: scaleX,
        scaleY: scaleY
    };
}

function round_by_unit(p_number, p_round_unt) { // round to [0 1 2 3 ...]*p_round_unt; ex. (12, 5) => 10, (13, 5) => 15
    return Math.round(p_number / p_round_unt) * p_round_unt;
}

function get_random(p_min, p_max) {
    // for input error
    m_min = Math.min(p_min);
    m_max = Math.max(p_max);
    if (m_min == m_max) return 0.0;

    // return randomm number
    if (m_min == undefined)
        return Math.random(); // bewteen 0.0 ~ 1.0
    else
        return Math.random() * (m_max - m_min) + m_min; // between p_min ~ p_max
}

function acosd(p_cos_value) {
    return Math.acos(p_cos_value) * (180 / Math.PI); // radian => degree
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// draw basic elements : members, supports, loads, dimensions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////// variables for visualization
//////var gv_span = 500, gv_hgt, gv_load = 30; 
//////var gv_margin_unit = 15, gv_ele_unit = 15;
//////var gv_ratio_len, gv_ratio_load;
//////var gv_prev_x, gv_prev_y;

//////function append_hatching_pattern() {
//////    d3.select("svg").append("pattern")
//////        .attr("id", "hatch")
//////        .attr("width", 3).attr("height", 3)
//////        .attr("patternTransform", "rotate(45 0 0)")
//////        .attr("patternUnits", "userSpaceOnUse")
//////    .append("line")
//////        .attr("x1", 0).attr("y1", 0)
//////        .attr("x2", 0).attr("y2", 3)
//////        .attr("style", "stroke:dimgrey; stroke-width:1");
//////}

//////function draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
//////    p_svg_mom.append("line") // line not rectangle
//////        .attr("x1", 0).attr("y1", 0)
//////        .attr("x2", p_span).attr("y2", 0)
//////        .attr("style", "stroke:dimgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + gv_ele_unit)
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    p_svg_mom.append("line") // line not rectangle
//////        .attr("x1", 0.5).attr("y1", 0)
//////        .attr("x2", (p_span - 0.5)).attr("y2", 0)
//////        .attr("style", "stroke:lightgrey;stroke-linejoin:miter;stroke-linecap:butt;stroke-width:" + (gv_ele_unit - 1))
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////}

//////function draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang) {
//////    // variables for loc, size
//////    var rad = gv_ele_unit / 2;
//////    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = rad * 2;

//////    // draw roller
//////    var roller = p_svg_mom.append("g") // set group for roller
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    roller.append("circle") // roller
//////        .attr("cx", 0).attr("cy", rad).attr("r", rad)
//////        .attr("style", "fill:white;stroke-width:1;stroke:dimgrey");
//////    draw_fix(roller, 0, hatch_y, 0); // draw fix
//////}

//////function draw_roller_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_v_up_dn) {
//////    // draw concentrated load with label
//////    var v_load = 0;
//////    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//////}

//////function draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang) {
//////    // variables for loc, size
//////    var tri_w = 15, tri_h = gv_ele_unit;
//////    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = tri_h;
//////    var tri_str = -tri_w / 2 + "," + tri_h + " " + tri_w / 2 + "," + tri_h + " 0,0";

//////    // draw hinge
//////    var hinge = p_svg_mom.append("g") // set group for hinge
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    hinge.append("polygon") // triangle
//////        .attr("points", tri_str)
//////        .attr("style", "fill:white;stroke-width:1;stroke:dimgrey");
//////    draw_fix(hinge, 0, hatch_y, 0); // draw fix
//////}

//////function draw_hinge_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_h_up_dn, p_v_up_dn) {
//////    // draw concentrated load with label
//////    var v_load = 0;
//////    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//////    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//////}

//////function draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang) {
//////    // variables for loc, size
//////    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = 0;

//////    // draw roller
//////    var fix = p_svg_mom.append("g") // set group for roller
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    fix.append("line") // line
//////        .attr("x1", hatch_x).attr("y1", hatch_y)
//////        .attr("x2", hatch_x + hatch_w).attr("y2", hatch_y)
//////        .attr("style", "stroke:dimgrey;stroke-width:1");
//////    fix.append("rect") // support
//////        .attr("x", hatch_x).attr("y", hatch_y)
//////        .attr("width", hatch_w).attr("height", hatch_h)
//////        .attr("fill", "url(#hatch)");
//////}

//////function draw_fix_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_h_up_dn, p_v_up_dn) {
//////    // draw concentrated load with label
//////    var v_load = 0;
//////    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//////    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//////    draw_point_moment(p_svg_mom, p_org_x, p_org_y, p_ang, v_load, p_dir, p_unit_label);
//////}

//////function draw_hinge_joint(p_svg_mom, p_org_x, p_org_y) {
//////    // variables for loc, size
//////    var rad = gv_ele_unit / 2;

//////    // draw hinge joint
//////    var hinge = p_svg_mom.append("circle")
//////        .attr("cx", 0).attr("cy", 0).attr("r", rad)
//////        .attr("style", "fill:white;stroke-width:1;stroke:grey")
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ")"); // translate and then rotate
//////}

////////////function draw_point_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_unit, p_drag) {
////////////    // variables for loc, size
////////////    var v_load = p_load * gv_ratio_load;
////////////    if (Math.abs(p_load) < 0.01) {
////////////        v_load = gv_load;
////////////    }

////////////    // set location according to the p_up_dn
////////////    var text_y = -v_load - 10;

////////////    // overall translation and rotation
////////////    var load = p_svg_mom.append("g") // set group for arrow
////////////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // rotate and then translate

////////////    // draw concentrated load
////////////    draw_arrow(load, p_org_x, p_org_y, p_ang, v_load, p_drag); // true = draggable

////////////    // draw magnitude
////////////    draw_label(load, p_org_x, p_org_y, p_ang, text_y, 90, p_load + p_unit, undefined, "middle"); // undefined = subscript
////////////}

//////function draw_point_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_unit, p_up_dn, p_drag, p_id) {
//////    // variables for loc, size
//////    var tri_w = 6, tri_h = 6;
//////    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
//////    var v_load = p_load * gv_ratio_load;
//////    var v_label = Math.round(p_load * 10) / 10 + p_unit;
//////    if (Math.abs(p_load) < 0.01) {
//////        v_load = gv_load;
//////        v_label = p_unit;
//////    }

//////    // set location along the p_up_dn
//////    var up_dn_offset = 0, text_y = -v_load - 10;
//////    if (p_up_dn == "up") { // if upward load
//////        alert("### p_up_dn is used!! A close investigation is needed!! ###");
//////        up_dn_offset = v_load;
//////        text_y = up_dn_offset + 10;
//////    }

//////    // draw force
//////    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    pnt_frc.append("polygon") // triangle
//////        //.attr("transform", "translate(0," + up_dn_offset + ")")
//////        .attr("points", tri_str)
//////        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
//////    pnt_frc.append("line") // line
//////        //.attr("transform", "translate(0," + up_dn_offset + ")")
//////        .attr("x1", 0).attr("y1", 0)
//////        .attr("x2", 0).attr("y2", -v_load)
//////        .attr("style", "stroke-width:1; stroke:dimgrey");

//////    // write magnitude of load
//////    if (p_unit != undefined) { // do not write magnitude for distributed load
//////        var m_svg_mom = pnt_frc.append("text") // magnitude
//////            .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
//////            .attr("x", 0).attr("y", 0)
//////            .text(v_label)
//////            .attr("style", "fill:grey; text-anchor:middle")
//////            .attr("id", "load_magnitude");

//////        // click on load magnitude to change the magnitude
//////        m_svg_mom.on("click", click_load);
//////    }

//////    // set drag callback function
//////    if (p_drag == true) {
//////        //pnt_frc.select("polygon").style("cursor", "pointer").call(d3.drag() //pnt_frc.on("click", toggleColor);
//////        pnt_frc.select("polygon").attr("style", "cursor:pointer; fill:#ff6f6f; stroke-width:3; stroke:#ff6f6f").call(d3.drag() //pnt_frc.on("click", toggleColor);
//////            .on("start", drag_load_started)
//////            .on("drag", drag_load_ing)
//////            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
//////            .on("end", drag_load_ended));
//////        pnt_frc.select("line").attr("style", "stroke-width:1; stroke:#ff6f6f");
//////        pnt_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
//////    }
//////}

//////function draw_point_moment(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_dir, p_unit_label, p_sub) {
//////    // variables for loc, size
//////    var tri_w = 6, tri_h = 6;
//////    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
//////    var mnt_rad = 20;
//////    var v_label = Math.round(p_load * 10) / 10 + p_unit_label;
//////    if (Math.abs(p_load) < 0.01) {
//////        v_label = p_unit_label;
//////    }

//////    // draw force
//////    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    var arrow = pnt_frc.append("polygon") // arrow
//////        .attr("points", tri_str)
//////        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
//////    if (p_dir == "ccw") {
//////        arrow.attr("transform", "translate(" + -tri_h + "," + -mnt_rad + ") rotate(90)") // translate and then rotate
//////    }
//////    else {
//////        arrow.attr("transform", "translate(" + -tri_h + "," + mnt_rad + ") rotate(90)") // translate and then rotate
//////    }
//////    pnt_frc.append("path") // arc
//////        //.attr("d", "M0,-20 A20,20 0 0,1 0,20")
//////        .attr("d", "M0," + -mnt_rad + " A" + mnt_rad + "," + mnt_rad + " 0 0,1 0," + mnt_rad)
//////        .attr("style", "fill:none; stroke-width:1; stroke:dimgrey");

//////    // write magnitude
//////    if (p_unit_label != undefined) {
//////        var m_svg_mom = pnt_frc.append("text") // magnitude
//////            .attr("x", 0).attr("y", -mnt_rad - 4)
//////            .text(v_label)
//////            .attr("style", "fill:grey; text-anchor:middle");
//////        if (p_sub != undefined) {
//////            draw_sup_sub(m_svg_mom, undefined, p_sub);
//////        }
//////    }
//////}

//////function draw_unifrom_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_width, p_load, p_unit, p_drag, p_id) {
//////    // variables for loc, size
//////    var v_load = p_load * gv_ratio_load;
//////    var v_label = Math.round(p_load * 10) / 10 + p_unit;
//////    if (Math.abs(p_load) < 0.01) {
//////        v_load = gv_load;
//////        v_label = p_unit;
//////    }

//////    // draw bounding rect
//////    var ufm_frc = p_svg_mom.append("g")
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate
//////    ufm_frc.append("rect")
//////        .attr("x", 0).attr("y", -v_load)
//////        .attr("width", p_width).attr("height", v_load)
//////        .attr("style", "fill:lightgrey; fill-opacity:0.2; stroke:darkgrey");

//////    // draw each force
//////    var frc_nx = Math.ceil(p_width / 20);
//////    var frc_dx = p_width / frc_nx;
//////    for (i = 0; i <= frc_nx; i++) {
//////        if ((i == 0) || (i == frc_nx)) draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, p_drag); // the 1st and last
//////        else draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, false);
//////    }

//////    // write magnitude
//////    if (p_unit != undefined) {
//////        var m_svg_mom = ufm_frc.append("text") // magnitude
//////            .attr("x", p_width / 2).attr("y", -v_load - 4) // 6 (of triangle height) + 4 (margin)
//////            .text(v_label)
//////            .attr("style", "fill:grey; text-anchor:middle")
//////            .attr("id", "load_magnitude");

//////        // click on load magnitude to change the magnitude
//////        m_svg_mom.on("click", click_load);
//////    }

//////    // set drag callback function
//////    if (p_drag == true) {
//////        ufm_frc.select("rect").attr("style", "cursor:pointer; fill:#ff6f6f; fill-opacity:0.2; stroke-width:1; stroke:#ffafaf").call(d3.drag() //pnt_frc.on("click", toggleColor);
//////            .on("start", drag_load_started)
//////            .on("drag", drag_load_ing)
//////            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
//////            .on("end", drag_load_ended));
//////        ufm_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
//////    }
//////}

//////function draw_reaction_force(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_label, p_sub, p_up_dn) {
//////    // variables for loc, size
//////    var tri_w = 6, tri_h = 6;
//////    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
//////    var v_load = p_load * gv_ratio_load;
//////    var v_label = p_label;
//////    if (Math.abs(p_load) < 0.01) {
//////        v_load = gv_load;
//////    }

//////    // set location along the p_up_dn
//////    var up_dn_offset = 0, text_y = -v_load - 15;
//////    if (p_up_dn == "up") { // if upward load
//////        up_dn_offset = v_load;
//////        text_y = up_dn_offset + 10;
//////    }

//////    // draw force
//////    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    pnt_frc.append("polygon") // triangle
//////        //.attr("transform", "translate(0," + up_dn_offset + ")")
//////        .attr("points", tri_str)
//////        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
//////    pnt_frc.append("line") // line
//////        //.attr("transform", "translate(0," + up_dn_offset + ")")
//////        .attr("x1", 0).attr("y1", 0)
//////        .attr("x2", 0).attr("y2", -v_load)
//////        .attr("style", "stroke-width:1; stroke:dimgrey");

//////    // write reaction label
//////    var m_svg_mom = pnt_frc.append("text") // magnitude
//////        .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
//////        .attr("x", 0).attr("y", 0)
//////        .text(v_label)
//////        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
//////        .attr("id", "force_magnitude");
//////    if (p_sub != undefined) {
//////        draw_sup_sub(m_svg_mom, undefined, p_sub);
//////    }
//////}

//////function draw_dimensions(p_svg_mom, p_org_x, p_org_y, p_ang, p_dims, p_margin, p_unit, p_up_dn, p_click) {
//////    // prepare data
//////    var v_dims = [p_dims[0] * gv_ratio_len];
//////    var sx = [0], ex = [v_dims[0]];
//////    for (var i = 1; i < p_dims.length; i++) {
//////        v_dims.push(p_dims[i] * gv_ratio_len);
//////        sx.push(sx[i - 1] + v_dims[i - 1]);
//////        ex.push(ex[i - 1] + v_dims[i]);
//////    }

//////    // text location in y
//////    var text_y = p_margin + 14; // font-size=10, spacing = 4
//////    if (p_up_dn == "up") text_y = p_margin - 4;

//////    // dimensions
//////    var dim = p_svg_mom.append("g") // set group
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    dim.append("circle") // dots at start point
//////        .attr("cx", 0).attr("cy", p_margin).attr("r", 3)
//////        .attr("style", "fill:grey; stroke-width:1; stroke:none");
//////    var dims = dim.selectAll("g").data(p_dims).enter();
//////    dims.append("line") // dimension line
//////        .attr("x1", function (d, i) { return sx[i]; }).attr("y1", p_margin)
//////        .attr("x2", function (d, i) { return ex[i]; }).attr("y2", p_margin)
//////        .attr("style", "stroke:grey; stroke-width:1");
//////    dims.append("circle") // dots at end points
//////        .attr("cx", function (d, i) { return ex[i]; }).attr("cy", p_margin).attr("r", 3)
//////        .attr("style", "fill:grey; stroke-width:1; stroke:none");
//////    dims.append("text") // dimensions
//////        .attr("x", function (d, i) { return (sx[i] + ex[i]) / 2; }).attr("y", text_y)
//////        .text(function (d, i) { return Math.round(p_dims[i] * 10) / 10 + p_unit; }) // p_dims = dims for texting
//////        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
//////        .attr("id", "span_length");

//////    if (p_click == true) {
//////        dims.select("text").on("click", click_span)
//////            .attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
//////    }
//////}

////////function draw_arrow(p_svg_mom, p_org_x, p_org_y, p_ang, p_magnitude, p_drag) {
////////    // downward arrowhead(triangle) at (0,0)
////////    var tri_w = 6, tri_h = 6;
////////    var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";
////////    p_svg_mom.append("polygon")
////////        .attr("points", tri_str)
////////        .attr("style", "fill:dimgrey;stroke-width:1;stroke:dimgrey");

////////    // line (0,0)->(0,-magnitude)
////////    p_svg_mom.append("line")
////////        //.attr("transform", "translate(0," + up_dn_offset + ")")
////////        .attr("x1", 0).attr("y1", 0)
////////        .attr("x2", 0).attr("y2", -p_magnitude)
////////        .attr("style", "stroke-width:1;stroke:dimgrey");

////////    // set drag callback function
////////    if (p_drag == true) {
////////        p_svg_mom.style("cursor", "pointer").call(d3.drag() //pnt_frc.on("click", toggleColor);
////////            .on("start", drag_arrow_started)
////////            .on("drag", function () { drag_arrow_ing(this, p_org_y); }) // different type of function call for passing parameters
////////            .on("end", drag_arrow_ended));
////////    }
////////}

//////function draw_label(p_svg_mom, p_org_x, p_org_y, p_ang, p_offset, p_offset_ang, p_label, p_anchor) {
//////    // text location
//////    var ang_rad = p_offset_ang * (Math.PI / 180);
//////    var offset_x = Math.cos(ang_rad) * p_offset, offset_y = Math.sin(ang_rad) * p_offset; // p_margin + 14; // font-size=10, spacing = 4

//////    // label
//////    var label = p_svg_mom.append("text")
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate the object and axes
//////        .attr("x", offset_x).attr("y", offset_y + 5) // the origin is (0, 0)
//////        .text(p_label)
//////        .attr("style", "cursor:default; fill:grey; text-anchor:" + p_anchor); // p_anchor = start/middle/end
//////}
////////////function draw_label(p_svg_mom, p_org_x, p_org_y, p_ang, p_offset, p_offset_ang, p_label, p_sub, p_anchor, p_id) {
////////////    // text location, not text rotation
////////////    var ang_rad = p_offset_ang * (Math.PI / 180);
////////////    var offset_x = Math.cos(ang_rad) * p_offset, offset_y = Math.sin(ang_rad) * p_offset; // p_margin + 14; // font-size=10, spacing = 4

////////////    // draw text
////////////    var label = p_svg_mom.append("text")
////////////        .attr("transform", "rotate(" + -p_ang + "," + offset_x + "," + offset_y + ")") // rotate object and axes by -p_ang about (offset_x, offset_y)
////////////        .attr("x", offset_x).attr("y", offset_y) // origin is (0, 0)
////////////        .text(p_label)
////////////        .attr("style", "fill: grey; text-anchor: " + p_anchor); // p_anchor = start/middle/end
////////////    if (p_sub != undefined) {
////////////        draw_sup_sub(label, undefined, p_sub);
////////////    }

////////////    // bind click event
////////////    if (p_id != undefined) {
////////////        label.attr("id", p_id)
////////////        label.on("click", click_load_magnitude);
////////////    }
////////////}

//////function draw_sup_sub(p_svg_mom, p_sup, p_sub) {
//////    if (p_sup != undefined) { // superscript
//////        p_svg_mom.append("tspan")
//////            .text(p_sup)
//////            .attr("baseline-shift", "super")
//////            .attr("font-size", "62%"); // not work!!!
//////    }
//////    if (p_sub != undefined) { // subscript
//////        p_svg_mom.append("tspan")
//////            .text(p_sub)
//////            .attr("baseline-shift", "sub")
//////            .attr("font-size", "62%"); // not work!!!
//////    }
//////}

//////// get the values of translation, rotation, ...
//////// replacement of d3.transform in D3.js v3 which is removed in D3.js v4
//////// the example of the input parameter "transform" = "rotate(45) skewX(20) translate(20,30) translate(-5,40)"
//////function get_transformation(transform) {
//////    // Create a dummy g for calculation purposes only. This will never
//////    // be appended to the DOM and will be discarded once this function 
//////    // returns.
//////    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

//////    // Set the transform attribute to the provided string value.
//////    g.setAttributeNS(null, "transform", transform);
//////    // consolidate the SVGTransformList containing all transformations
//////    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
//////    // its SVGMatrix. 
//////    var matrix = g.transform.baseVal.consolidate().matrix;

//////    // Below calculations are taken and adapted from the private function
//////    // transform/decompose.js of D3's module d3-interpolate.
//////    var { a, b, c, d, e, f } = matrix;   // ES6, if this doesn't work, use below assignment
//////    // var a=matrix.a, b=matrix.b, c=matrix.c, d=matrix.d, e=matrix.e, f=matrix.f; // ES5
//////    var scaleX, scaleY, skewX;
//////    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
//////    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
//////    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
//////    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
//////    return {
//////        translateX: e,
//////        translateY: f,
//////        rotate: Math.atan2(b, a) * 180 / Math.PI,
//////        skewX: Math.atan(skewX) * 180 / Math.PI,
//////        scaleX: scaleX,
//////        scaleY: scaleY
//////    };
//////}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// draw basic elements : members, supports, loads, dimensions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// variables for visualization
var g_digit = 2;
var gv_span = 500, gv_hgt, gv_load = 30;
var gv_margin_unit = 15, gv_ele_unit = 15;
var gv_ratio_len, gv_ratio_load;
const g_support = ["Simple support", "Cantilever"];
var g_setting = { b: 30.0, h: 50.0, L: 600.0, P: 100.0, E: 2200.0, Support: "Simple support", I: function () { return this.b * Math.pow(this.h, 3) / 12; } };

// variables for trianlge for arrow
var tri_w = tri_h = 6;
var tri_str = -tri_w / 2 + "," + -tri_h + " " + tri_w / 2 + "," + -tri_h + " 0,0";

// variables for structure
var g_structure, g_fbd, g_reaction, g_measurement;
var gv_pre_x, gv_pre_y; // for dragging
var g_tooltip; // for tooltip

function append_hatching_pattern(p_id_string) {
    d3.select(p_id_string).append("pattern")
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
        .attr("style", "stroke:lightgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + (gv_ele_unit / 2));
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

function draw_wgt_unit(p_d3, p_id, p_mag, p_x, p_y, p_hgt, p_large_dot, p_drag) {
    // group
    var d3_wgt_unit = p_d3.selectAll("#wgt_unit_" + p_id).data([p_id]).join("g").classed("wgt_unit", true)
        .attr("id", "wgt_unit_" + p_id)
        .attr("transform", "translate(" + p_x + ", " + p_y + ")");

    // wgt hg
    d3_wgt_unit.each(function () { draw_wgt_hg(d3_wgt_unit, p_x, -p_hgt, p_large_dot, p_drag, p_mag, p_y); }); // because wgt hg is downward, -g_hg_hgt

    // wgt
    var wgt_sz = Math.sqrt(p_mag);
    var d3_wgt = d3_wgt_unit.selectAll(".wgt").data([[p_x]]).join("rect").classed("wgt", true)
        .attr("x", -wgt_sz).attr("y", -g_hg_hgt - wgt_sz * 2)
        .attr("width", wgt_sz * 2).attr("height", wgt_sz * 2)
        .attr("style", "fill:lightgrey; stroke:dimgrey")
        .on("mouseover", function () { mouse_enter("wgt", undefined, p_mag, p_x); })
        .on("mouseout", function () { mouse_out(); });
}

function draw_wgt_hg(p_d3, p_x, p_hg_hgt, p_large_dot, p_drag, p_mag, p_y) {
    var dot_radius = gv_ele_unit / 6;
    if (p_large_dot == true) dot_radius *= 2;
    p_d3.selectAll(".wgt_hg").data([p_hg_hgt]).join("line") // hg for wgt
        .classed("wgt_hg", true)
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", hgt => hgt)
        //.attr("x2", 0).attr("y2", hgt => hgt + Math.sqrt(p_mag) * 2)
        .attr("style", "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width: 1")
        //.transition().ease(d3.easeElastic).duration(1000).attr("y2", hgt => hgt);
    var d3_up_dot = p_d3.selectAll(".up_hg_dot").data([p_hg_hgt]).join("circle") // upper dot of hanger
        .classed("up_hg_dot", true)
        .attr("cx", 0).attr("cy", hgt => Math.max(hgt, 0)) // Math.max => -hgt is used for wgt hg, +hgt is used for hg
        .attr("r", dot_radius)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");

    if (p_large_dot == true) {
        d3_up_dot.on("mouseover", function () { mouse_enter("dot", undefined, undefined, p_x, p_y); })
            .on("mouseout", function () { mouse_out(); });
    }

    if (p_drag == true) {
        d3_up_dot.attr("style", "cursor: pointer; fill:white; stroke-width:1; stroke:dimgrey")
            .call(d3.drag()
            .on("start", drag_started)
            .on("drag", drag_wgt_hg_ing));
    }
    p_d3.selectAll(".dn_hg_dot").data([p_hg_hgt]).join("circle") // lower dot of hanger
        .classed("dn_hg_dot", true)
        .attr("cx", 0).attr("cy", hgt => hgt) // Math.min => -hgt is used for wgt hg, +hgt is used for hg
        //.attr("cx", 0).attr("cy", hgt => Math.min(hgt, 0) + Math.sqrt(p_mag) * 2) // Math.min => -hgt is used for wgt hg, +hgt is used for hg
        .attr("r", gv_ele_unit / 6)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey")
        //.transition().ease(d3.easeElastic).duration(1000).attr("cy", hgt => hgt);
}

function draw_single_member(p_svg_mom, p_org_x, p_org_y, p_ang, p_span) {
    var members = [{ s: 0, e: p_span, width: gv_ele_unit, color: "dimgrey" },
                   { s: 0.5, e: p_span - 0.5, width: gv_ele_unit - 1, color: "lightgrey" }];
    p_svg_mom.selectAll(".single_member").data(members).join("line").classed("single_member", true) // line not rectangle
        .attr("x1", d => d.s).attr("y1", 0)
        .attr("x2", d => d.e).attr("y2", 0)
        .attr("style", d => "stroke:" + d.color + "; stroke-linejoin:miter; stroke-linecap:butt; stroke-width:" + d.width)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
}

function draw_supports(p_d3, p_supports) {
    p_d3.selectAll("g.support").data(p_supports).join("g").classed("support", true)
        .attr("transform", d => "translate(" + d.x + "," + d.y + ") rotate(" + d.ang + ")") // translate and then rotate
        .each(function (d) {
            if (d.type == "hinge") draw_hinge(d3.select(this));
            else if (d.type == "roller") draw_roller(d3.select(this));
            else draw_fix(d3.select(this), 0);
        });
}

//function draw_roller(p_svg_mom, p_org_x, p_org_y, p_ang) {
//    // variables for loc, size
//    var rad = gv_ele_unit / 2;
//    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = rad * 2;

//    // draw roller
//    var roller = p_svg_mom.append("g") // set group for roller
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    roller.append("circle") // roller
//        .attr("cx", 0).attr("cy", rad).attr("r", rad)
//        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
//    draw_fix(roller, 0, hatch_y, 0); // draw fix
//}
function draw_roller(p_d3) {
    // variables for loc, size
    var rad = gv_ele_unit / 2;
    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = rad * 2;

    // draw roller
    p_d3.selectAll("circle").data([0]).join("circle") // roller
        .attr("cx", 0).attr("cy", rad).attr("r", rad)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    draw_fix(p_d3, gv_ele_unit); // draw fix
}

//function draw_hinge(p_svg_mom, p_org_x, p_org_y, p_ang) {
//    // variables for loc, size
//    var tri_w = tri_h = gv_ele_unit;
//    var tri_str = -tri_w / 2 + "," + tri_h + " " + tri_w / 2 + "," + tri_h + " 0,0";

//    // draw hinge
//    var hinge = p_svg_mom.append("g") // set group for hinge
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    hinge.append("polygon") // triangle
//        .attr("points", tri_str)
//        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
//    draw_fix(hinge, 0, gv_ele_unit, 0); // draw fix
//}
function draw_hinge(p_d3) {
    // variables for trianlge for arrow
    var m_tri_w = m_tri_h = gv_ele_unit;
    var m_tri_str = -m_tri_w / 2 + "," + m_tri_h + " " + m_tri_w / 2 + "," + m_tri_h + " 0,0";

    // draw hinge
    p_d3.selectAll("polygon").data([0]).join("polygon") // triangle
        .attr("points", m_tri_str)
        .attr("style", "fill:white; stroke-width:1; stroke:dimgrey");
    draw_fix(p_d3, gv_ele_unit); // draw fix
}

//function draw_fix(p_svg_mom, p_org_x, p_org_y, p_ang) {
//    // variables for loc, size
//    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = 0;

//    // draw fix
//    var fix = p_svg_mom.append("g") // set group for roller
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    fix.append("line") // line
//        .attr("x1", hatch_x).attr("y1", hatch_y)
//        .attr("x2", hatch_x + hatch_w).attr("y2", hatch_y)
//        .attr("style", "stroke:dimgrey; stroke-width:1");
//    fix.append("rect") // support
//        .attr("x", hatch_x).attr("y", hatch_y)
//        .attr("width", hatch_w).attr("height", hatch_h)
//        .attr("fill", "url(#hatch)");
//}
function draw_fix(p_d3, p_y) {
    // variables for loc, size
    var hatch_w = 40, hatch_h = gv_ele_unit, hatch_x = -hatch_w / 2, hatch_y = p_y;

    // draw fix
    p_d3.selectAll("line").data([0]).join("line") // line
        .attr("x1", hatch_x).attr("y1", hatch_y)
        .attr("x2", hatch_x + hatch_w).attr("y2", hatch_y)
        .attr("style", "stroke:dimgrey; stroke-width:1");
    p_d3.selectAll("rect").data([0]).join("rect") // support
        .attr("x", hatch_x).attr("y", hatch_y)
        .attr("width", hatch_w).attr("height", hatch_h)
        .attr("fill", "url(#hatch)");
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

//function draw_roller_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_v_up_dn) {
//    // draw concentrated load with label
//    var v_load = 0;
//    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//}
function draw_roller_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label, p_v_up_dn) {
    var v_label = "V<tspan style = 'baseline-shift: sub; font-size: 0.8em;' >" + p_node_label + "</tspan >";
    var loads = [{ x: p_org_x, y: p_org_y, ang: 180, mg: gv_load, label: v_label, drag: false, id: undefined }];
    draw_point_load(p_svg_mom, "roller_reaction", loads);
}

//function draw_hinge_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
//    // draw concentrated load with label
//    var v_load = 0;
//    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//}
function draw_hinge_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
    var v_label = "V<tspan style = 'baseline-shift: sub; font-size: 0.8em;' >" + p_node_label + "</tspan >";
    var loads = [{ x: p_org_x, y: p_org_y, ang: 180, mg: gv_load, label: v_label, drag: false, id: undefined }];
    loads.push({ x: p_org_x, y: p_org_y - gv_ele_unit / 2, ang: -90, mg: gv_load, label: "H" + v_label.substr(1), drag: false, id: undefined });
    draw_point_load(p_svg_mom, "hinge_reaction", loads);
}

//function draw_fix_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
//    // draw concentrated load with label
//    var v_load = 0;
//    draw_reaction_force(p_svg_mom, p_org_x, p_org_y, 180, v_load, "V", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//    draw_reaction_force(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, -90, v_load, "H", p_node_label); // p_node_label = A, B, .., i.e, subscript of reaction label
//    draw_reaction_moment(p_svg_mom, p_org_x, p_org_y - gv_ele_unit / 2, p_ang, v_load, "ccw", p_node_label);
//}
function draw_fix_reactions(p_svg_mom, p_org_x, p_org_y, p_ang, p_node_label) {
    var v_label = "V<tspan style = 'baseline-shift: sub; font-size: 0.8em;' >" + p_node_label + "</tspan >";
    var loads = [{ x: p_org_x, y: p_org_y, ang: 180, mg: gv_load, label: v_label, drag: false, id: undefined }];
    loads.push({ x: p_org_x, y: p_org_y - gv_ele_unit / 2, ang: -90, mg: gv_load, label: "H" + v_label.substr(1), drag: false, id: undefined });
    draw_point_load(p_svg_mom, "fix_reaction", loads);
    var mnts = [{ x: p_org_x, y: p_org_y - gv_ele_unit / 2, ang: p_ang, mg: gv_load, label: "M" + v_label.substr(1), drag: false, id: undefined, rad: 20, dir: "ccw" }];
    draw_point_moment(p_svg_mom, "fix_mnt_reaction", mnts);
}

//function draw_point_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_unit, p_up_dn, p_drag, p_id) {
//    //// variables for loc, size
//    //var v_load = p_load * gv_ratio_load;
//    //var v_label = (Math.round(p_load * 10) / 10).toFixed(g_digit) + p_unit;
//    //if (Math.abs(p_load) < 0.01) { v_load = gv_load; } // in case of no load
//    var v_load = (Math.abs(p_load) < 0.01) ? gv_load : p_load * gv_ratio_load;
//    var v_label = (Math.round(p_load * 10) / 10).toFixed(g_digit) + p_unit;

//    // set location along the p_up_dn
//    var up_dn_offset = 0, text_y = -v_load - 10;
//    if (p_up_dn == "up") { // if upward load
//        alert("### p_up_dn is used!! A close investigation is needed!! ###");
//        up_dn_offset = v_load;
//        text_y = up_dn_offset + 10;
//    }

//    // draw force
//    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    pnt_frc.append("line") // line
//        //.attr("transform", "translate(0," + up_dn_offset + ")")
//        .attr("x1", 0).attr("y1", 0)
//        .attr("x2", 0).attr("y2", -v_load)
//        .attr("style", "stroke-width:1; stroke:dimgrey");
//    pnt_frc.append("polygon") // triangle
//        //.attr("transform", "translate(0," + up_dn_offset + ")")
//        .attr("points", tri_str)
//        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");

//    // write magnitude of load
//    if (p_unit != undefined) { // do not write magnitude for distributed load
//        var m_svg_mom = pnt_frc.append("text") // magnitude
//            .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
//            .attr("x", 0).attr("y", 0)
//            .text(v_label)
//            .attr("style", "cursor:default; fill:grey; text-anchor:middle")
//            .attr("id", "load_magnitude");
//    }

//    // set drag callback function
//    if (p_drag == true) {
//        if (p_id != "pnt_load") {
//            p_svg_mom = d3.select(p_svg_mom.node().parentNode);
//        }
//        pnt_frc.select("polygon").attr("style", "cursor:pointer; fill:#ff6f6f; stroke-width:3; stroke:#ff6f6f").call(d3.drag()
//            .container(p_svg_mom.node()) // make beam the coordinate system of dragging point
//            .on("start", drag_load_started)
//            .on("drag", drag_load_ing)
//            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
//            .on("end", drag_load_ended))
//            .attr("id", p_id);
//        pnt_frc.select("line").attr("style", "stroke-width:1; stroke:#ff6f6f");
//        //pnt_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
//    }
//}
function draw_point_load(p_d3, p_class, p_loads) {
    // draw force
    var pnt_frc = p_d3.selectAll("g." + p_class).data(p_loads).join("g").classed(p_class, true) // set group for arrow
        .attr("transform", load => "translate(" + [load.x, load.y] + ") rotate(" + load.ang + ")"); // translate and then rotate
    pnt_frc.selectAll("line").data(load => [load]).join("line") // line
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", d => -d.mg)
        .attr("style", d => (d.drag == true) ? "stroke-width:1; stroke:#ff6f6f" : "stroke-width:1; stroke:dimgrey");
    pnt_frc.selectAll("polygon").data(load => [load]).join("polygon") // triangle
        .attr("points", tri_str)
        .attr("style", d => (d.drag == true) ? "cursor:pointer; fill:#ff6f6f; stroke-width:3; stroke:#ff6f6f" : "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    pnt_frc.selectAll("text").data(load => [load]).join("text") // magnitude
        .attr("transform", d => "translate(0, " + -(d.mg + 10) + ") rotate(" + -d.ang + ")") // translate and then rotate the object and axes
        .attr("dominant-baseline", "central")
        .attr("x", 0).attr("y", 0)
        .html(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
        .attr("id", "load_magnitude");

    // set drag callback function
    //console.log("point setting dragging", p_d3.node().parentNode, g_structure.node().parentNode, g_structure.parent);
    pnt_frc.selectAll("polygon").attr("id", load => load.id).call(d3.drag()
        .container(p_d3.node().parentNode) // make beam the coordinate system of dragging point
        //.container(d3.select("#prob_svg").node()) // make beam the coordinate system of dragging point
        .on("start", drag_load_started)
        .on("drag", drag_load_ing)
        .on("end", drag_load_ended)
    );
}

//function draw_point_moment(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_dir, p_unit_label, p_sub) {
//    // variables for loc, size
//    var mnt_rad = 20;
//    var v_label = Math.round(p_load * 10) / 10 + p_unit_label;
//    if (Math.abs(p_load) < 0.01) {
//        v_label = p_unit_label;
//    }

//    // draw force
//    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    pnt_frc.append("path") // arc
//        //.attr("d", "M0,-20 A20,20 0 0,1 0,20")
//        .attr("d", "M0," + -mnt_rad + " A" + mnt_rad + "," + mnt_rad + " 0 0,1 0," + mnt_rad)
//        .attr("style", "fill:none; stroke-width:1; stroke:dimgrey");
//    var arrow = pnt_frc.append("polygon") // arrow
//        .attr("points", tri_str)
//        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
//    if (p_dir == "ccw") {
//        arrow.attr("transform", "translate(" + -tri_h + "," + -mnt_rad + ") rotate(90)") // translate and then rotate
//    }
//    else {
//        arrow.attr("transform", "translate(" + -tri_h + "," + mnt_rad + ") rotate(90)") // translate and then rotate
//    }

//    // write magnitude
//    if (p_unit_label != undefined) {
//        var m_svg_mom = pnt_frc.append("text") // magnitude
//            .attr("x", 0).attr("y", -mnt_rad - 4)
//            .text(v_label)
//            .attr("style", "cursor:default; fill:grey; text-anchor:middle");
//        if (p_sub != undefined) {
//            draw_sup_sub(m_svg_mom, undefined, p_sub);
//        }
//    }
//}
function draw_point_moment(p_d3, p_class, p_mnts) {
    // draw force
    var mnt_frc = p_d3.selectAll("g." + p_class).data(p_mnts).join("g").classed(p_class, true) // set group for arrow
        .attr("transform", mnt => "translate(" + [mnt.x, mnt.y] + ") rotate(" + mnt.ang + ")"); // translate and then rotate
    mnt_frc.selectAll("path").data(mnt => [mnt]).join("path") // arc
        //.attr("d", "M0,-20 A20,20 0 0,1 0,20")
        .attr("d", d => "M0," + -d.rad + " A" + d.rad + "," + d.rad + " 0 0,1 0," + d.rad)
        .attr("style", "fill:none; stroke-width:1; stroke:dimgrey");
    mnt_frc.selectAll("polygon").data(mnt => [mnt]).join("polygon") // arrow
        .attr("points", tri_str)
        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey")
        .attr("transform", d => {
            if (d.dir == "ccw") return "translate(" + -tri_h + "," + -d.rad + ") rotate(90)";
            else return "translate(" + -tri_h + "," + d.rad + ") rotate(90)";
        });
    mnt_frc.selectAll("text").data(mnt => [mnt]).join("text") // magnitude
        .attr("transform", d => "translate(0, " + (d.rad + 16) + ") rotate(" + -d.ang + ")") // translate and then rotate the object and axes
        .attr("dominant-baseline", "central")
        .attr("x", 0).attr("y", 0)
        .html(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
        .attr("id", "load_magnitude");
}

//function draw_uniform_load(p_svg_mom, p_org_x, p_org_y, p_ang, p_width, p_load, p_unit, p_drag, p_id) {
//    // variables for loc, size
//    var v_load = p_load * gv_ratio_load;
//    var v_label = (Math.round(p_load * 10) / 10).toFixed(g_digit) + p_unit;
//    if (Math.abs(p_load) < 0.01) { v_load = gv_load; } // in case of no load

//    // draw bounding rect
//    var ufm_frc = p_svg_mom.append("g")
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate
//    ufm_frc.append("rect")
//        .attr("x", 0).attr("y", -v_load)
//        .attr("width", p_width).attr("height", v_load)
//        .attr("style", "fill:lightgrey; fill-opacity:0.2; stroke:darkgrey");

//    // draw each force
//    var frc_nx = Math.ceil(p_width / 20);
//    var frc_dx = p_width / frc_nx;
//    for (i = 0; i <= frc_nx; i++) {
//        if (i == 0) draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, p_drag, "s_u_load"); // the 1st; s_u = start of uniform load
//        else if (i == frc_nx) draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, p_drag, "e_u_load"); // the last; e_u = end of uniform load
//        else draw_point_load(ufm_frc, i * frc_dx, 0, 0, p_load, undefined, undefined, false);
//    }

//    // write magnitude
//    if (p_unit != undefined) {
//        var m_svg_mom = ufm_frc.append("text") // magnitude
//            .attr("x", p_width / 2).attr("y", -v_load - 4) // 6 (of triangle height) + 4 (margin)
//            .text(v_label)
//            .attr("style", "cursor:default; fill:grey; text-anchor:middle")
//            .attr("id", "load_magnitude");
//    }

//    // set drag callback function
//    if (p_drag == true) {
//        ufm_frc.select("rect").attr("style", "cursor:pointer; fill:#ff6f6f; fill-opacity:0.2; stroke-width:1; stroke:#ffafaf").call(d3.drag() //pnt_frc.on("click", toggleColor);
//            .container(p_svg_mom.node()) // make beam the coordinate system of dragging point
//            .on("start", drag_load_started)
//            .on("drag", drag_load_ing)
//            //.on("drag", function () { drag_arrow_ing(pnt_frc, p_org_y); }) // different type of function call for passing parameters
//            .on("end", drag_load_ended))
//            .attr("id", p_id);
//        //ufm_frc.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
//    }
//}
function draw_uniform_load(p_d3, p_class, p_org_x, p_org_y, p_ang, p_width, p_load, p_label, p_drag, p_id, p_loads) {
    // draw bounding rect
    var ufm_frc = p_d3.selectAll("g.uniform_load").data([0]).join("g").classed("uniform_load", true)
        .attr("transform", "translate(" + [p_org_x, p_org_y] + ") rotate(" + p_ang + ")") // translate and then rotate
    ufm_frc.selectAll("rect").data([{ drag: p_drag }]).join("rect")
        .attr("x", 0).attr("y", -p_load)
        .attr("width", p_width).attr("height", p_load)
        .attr("style", d => (d.drag == true) ?
            "cursor:pointer; fill:#ff6f6f; fill-opacity:0.2; stroke-width:1; stroke:#ffafaf" :
            "fill:lightgrey; fill-opacity:0.2; stroke:darkgrey");

    // draw each force
    draw_point_load(ufm_frc, "point_load", p_loads);

    // write magnitude
    ufm_frc.selectAll("text").data([p_load]).join("text") // magnitude
        .attr("transform", "translate(" + [p_width / 2, -(p_load + 10)] + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
        .attr("x", 0).attr("y", 0)
        .html(p_label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
        //.attr("id", "load_magnitude");

    // set drag callback function
    //console.log("uniform setting dragging", p_d3.node(), g_structure.node().parentNode, g_structure.parent);
    ufm_frc.selectAll("rect").attr("id", p_id).call(d3.drag()
        //.container(p_d3.node()) // make beam the coordinate system of dragging point
        .container(g_structure.node().parentNode) // make beam the coordinate system of dragging point
        .on("start", drag_load_started)
        .on("drag", drag_load_ing)
        .on("end", drag_load_ended)
    );
}

//function draw_beam_loads(p_svg_mom, p_idx, p_draw_dim, p_drag) {
//    // get input values
//    var v_loc_fr = g_loc_fr * gv_ratio_len, v_loc_to = g_loc_to * gv_ratio_len;

//    // draw load and dimensions
//    if (g_load_type == "point") {
//        draw_point_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, g_load, "N", "dn", p_drag, "pnt_load"); // dn = downward load
//        if (p_draw_dim == false) return;
//        draw_dimensions(p_svg_mom, 0, 0, 0, "load_dim", [g_loc_fr, (g_span - g_loc_fr)], gv_margin_unit * 5, "mm", "dn");
//    }
//    else if (g_load_type == "uniform") {
//        draw_unifrom_load(p_svg_mom, v_loc_fr, 0 - gv_ele_unit / 2, 0, v_loc_to - v_loc_fr, g_load, "N/mm", p_drag, "ufm_load");
//        if (p_draw_dim == false) return;
//        var dims = [g_loc_to - g_loc_fr];
//        if (Math.abs(g_loc_fr) > 1.0e-3) dims.splice(0, 0, g_loc_fr);
//        if (Math.abs(g_loc_to - g_span) > 1.0e-3) dims.push(g_span - g_loc_to);
//        draw_dimensions(p_svg_mom, 0, 0, 0, "load_dim", dims, gv_margin_unit * 5, "mm", "dn");
//    }
//}
function draw_beam_loads(p_svg_mom, p_idx, p_draw_dim, p_drag) {
    // get input values
    var v_loc_fr = g_loc_fr * gv_ratio_len, v_loc_to = g_loc_to * gv_ratio_len;

    // magnitude of load
    var v_load = (Math.abs(g_load) < 0.01) ? gv_load : g_load * gv_ratio_load;
    var v_label = (Math.round(g_load * 10) / 10).toFixed(g_digit) + "N";

    // draw load and dimensions
    if (g_load_type == "point") {
        // prepare data
        var loads = [{ x: v_loc_fr, y: -gv_ele_unit / 2, ang: 0, mg: v_load, label: v_label, drag: p_drag, id: "pnt_load" }];

        // draw
        p_svg_mom.selectAll("g.uniform_load").remove(); // remove previous load
        draw_point_load(p_svg_mom, "point_load", loads);
        if (p_draw_dim == false) return;
        var dims = [];
        if (Math.abs(g_loc_fr) > 1.0e-3) dims.push(g_loc_fr);
        if (Math.abs(g_span - g_loc_to) > 1.0e-3) dims.push(g_span - g_loc_to);
        draw_dimensions(p_svg_mom, 0, 0, 0, "load_dim", dims, gv_margin_unit * 5, "mm", "dn");
    }
    else if (g_load_type == "uniform") {
        // magnitude of load
        v_label = (Math.round(g_load * 10) / 10).toFixed(g_digit) + "N/mm";

        // prepare data for each force
        var frc_nx = Math.ceil((v_loc_to - v_loc_fr) / 20);
        var frc_dx = (v_loc_to - v_loc_fr) / frc_nx;
        var point_loads = [{ x: 0, y: 0, ang: 0, mg: v_load, label: undefined, drag: p_drag, id: "s_u_load" }]; // the 1st; s_u = start of uniform load
        for (i = 1; i < frc_nx; i++)
            point_loads.push({ x: i * frc_dx, y: 0, ang: 0, mg: v_load, label: undefined, drag: false, id: undefined });
        point_loads.push({ x: frc_nx * frc_dx, y: 0, ang: 0, mg: v_load, label: undefined, drag: p_drag, id: "e_u_load" }); // the last; e_u = end of uniform loa

        // draw
        p_svg_mom.selectAll("g.point_load").remove(); // remove previous load
        draw_uniform_load(p_svg_mom, "uniform_load", v_loc_fr, -gv_ele_unit / 2, 0, v_loc_to - v_loc_fr, v_load, v_label, p_drag, "ufm_load", point_loads);
        if (p_draw_dim == false) return;
        var dims = [g_loc_to - g_loc_fr];
        if (Math.abs(g_loc_fr) > 1.0e-3) dims.splice(0, 0, g_loc_fr);
        if (Math.abs(g_loc_to - g_span) > 1.0e-3) dims.push(g_span - g_loc_to);
        draw_dimensions(p_svg_mom, 0, 0, 0, "load_dim", dims, gv_margin_unit * 5, "mm", "dn");
    }
}

//function draw_reaction_force(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_label, p_sub, p_up_dn) {
//    // variables for loc, size
//    var v_load = p_load * gv_ratio_load;
//    var v_label = p_label;
//    if (Math.abs(p_load) < 0.01) { v_load = gv_load; }

//    // set location along the p_up_dn
//    var up_dn_offset = 0, text_y = -v_load - gv_ele_unit;
//    if (p_up_dn == "up") { // if upward load
//        up_dn_offset = v_load;
//        text_y = up_dn_offset + gv_ele_unit;
//    }

//    // draw force
//    var pnt_frc = p_svg_mom.append("g") // set group for arrow
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//    pnt_frc.append("polygon") // triangle
//        //.attr("transform", "translate(0," + up_dn_offset + ")")
//        .attr("points", tri_str)
//        .attr("style", "fill:dimgrey; stroke-width:1; stroke:dimgrey");
//    pnt_frc.append("line") // line
//        //.attr("transform", "translate(0," + up_dn_offset + ")")
//        .attr("x1", 0).attr("y1", 0)
//        .attr("x2", 0).attr("y2", -v_load)
//        .attr("style", "stroke-width:1; stroke:dimgrey");

//    // write reaction label
//    var m_svg_mom = pnt_frc.append("text") // magnitude
//        .attr("transform", "translate(0, " + text_y + ") rotate(" + -p_ang + ")") // translate and then rotate the object and axes
//        .attr("x", 0).attr("y", 0)
//        .text(v_label)
//        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
//    if (p_sub != undefined) {
//        draw_sup_sub(m_svg_mom, undefined, p_sub);
//    }
//}

function draw_reaction_moment(p_svg_mom, p_org_x, p_org_y, p_ang, p_load, p_dir, p_sub) {
    // draw force
    var pnt_frc = p_d3.selectAll("g." + p_class).data(p_loads).join("g").classed(p_class, true) // set group for arrow
        .attr("transform", load => "translate(" + [load.x, load.y] + ") rotate(" + load.ang + ")"); // translate and then rotate
    pnt_frc.selectAll("line").data(load => [load]).join("line") // line
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", d => -d.mg)
        .attr("style", d => (d.drag == true) ? "stroke-width:1; stroke:#ff6f6f" : "stroke-width:1; stroke:dimgrey");
    pnt_frc.selectAll("polygon").data(load => [load]).join("polygon") // triangle
        .attr("points", tri_str)
        .attr("style", d => (d.drag == true) ? "cursor:pointer; fill:#ff6f6f; stroke-width:3; stroke:#ff6f6f" : "fill:dimgrey; stroke-width:1; stroke:dimgrey");
    pnt_frc.selectAll("text").data(load => [load]).join("text") // magnitude
        .attr("transform", d => "translate(0, " + -(d.mg + 10) + ") rotate(" + -d.ang + ")") // translate and then rotate the object and axes
        .attr("dominant-baseline", "central")
        .attr("x", 0).attr("y", 0)
        .html(d => d.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
    //.attr("id", "load_magnitude");

    // set drag callback function
    pnt_frc.selectAll("polygon").attr("id", load => load.id).call(d3.drag()
        .container(p_d3.node().parentNode) // make beam the coordinate system of dragging point
        .on("start", drag_load_started)
        .on("drag", drag_load_ing)
        .on("end", drag_load_ended)
    );
}

function draw_reaction_moment(p_d3, p_org_x, p_org_y, p_ang, p_load, p_dir, p_sub) {
    // variables for loc, size
    var mnt_rad = 20;
    var v_label = "M";
    if (Math.abs(p_load) < 0.01) {
        v_load = gv_load;
    }

    // draw moment
    var pnt_mnt = p_d3.append("g") // set group for arrow
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
        .attr("style", "cursor:default; fill:grey; text-anchor:middle");
    if (p_sub != undefined) {
        draw_sup_sub(m_svg_mom, undefined, p_sub);
    }
}

function draw_dimensions(p_svg_mom, p_org_x, p_org_y, p_ang, p_id, p_dims, p_margin, p_unit, p_up_dn, p_click) {
    // prepare data
    var dots = [0], lbls = [];
    p_dims.forEach(function (d, i) {
        dots.push(dots[i] + p_dims[i] * gv_ratio_len);
        lbls.push({ loc: (dots[i] + p_dims[i] * gv_ratio_len / 2), label: p_dims[i].toFixed(g_digit) + p_unit });
    });
    var lns = [{ s: 0, e: dots[dots.length - 1] }];

    // text location in y
    var text_y = p_margin + 14; // font-size=10, spacing = 4
    if (p_up_dn == "up") text_y = p_margin - 4;

    // dimensions
    var d3_dim = p_svg_mom.selectAll("#" + p_id).data([1]).join("g") // set group
        .attr("id", p_id)
        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
    d3_dim.selectAll("circle").data(dots).join("circle")
        .attr("cx", dot => dot).attr("cy", p_margin).attr("r", 3)
        .attr("style", "fill:grey; stroke-width:1; stroke:none");
    d3_dim.selectAll("line").data(lns).join("line") // dimension line
        .attr("x1", ln => ln.s).attr("y1", p_margin)
        .attr("x2", ln => ln.e).attr("y2", p_margin)
        .attr("style", "stroke:grey; stroke-width:1");
    d3_dim.selectAll("text").data(lbls).join("text") // label
        .attr("x", lbl => lbl.loc).attr("y", text_y)
        .text(lbl => lbl.label)
        .attr("style", "cursor:default; fill:grey; text-anchor:middle")
        .attr("id", "span_length");

    // click for change of size
    if (p_click == true) {
        //d3_dim.select("text").on("click", click_span)
        //    .attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
        //d3_dim.select("text").attr("style", "cursor: pointer; fill:#ff6f6f; text-anchor:middle; text-shadow:0px 0px 5px grey");
    }

    return d3_dim;
}

//function draw_arrow(p_svg_mom, p_org_x, p_org_y, p_ang, p_magnitude, p_drag) {
//    // downward arrowhead(triangle) at (0,0)
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

//function draw_label(p_svg_mom, p_org_x, p_org_y, p_ang, p_offset, p_offset_ang, p_label, p_anchor) {
//    // text location
//    var ang_rad = p_offset_ang * (Math.PI / 180);
//    var offset_x = Math.cos(ang_rad) * p_offset, offset_y = Math.sin(ang_rad) * p_offset; // p_margin + 14; // font-size=10, spacing = 4

//    // label
//    var label = p_svg_mom.append("text")
//        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")") // translate and then rotate the object and axes
//        .attr("x", offset_x).attr("y", offset_y + 5) // the origin is (0, 0)
//        .text(p_label)
//        .attr("style", "cursor:default; fill:grey; text-anchor:" + p_anchor); // p_anchor = start/middle/end
//}
//function draw_labels(p_svg_mom, p_data, p_class) {
//    console.log("draw_labels was called!", p_svg_mom, p_svg_mom.selectAll("text"));
//    p_svg_mom.selectAll(p_class).data(p_data).join("text")
//        .attr("transform", d => "translate(" + d.x + "," + d.y + ") rotate(" + d.ang + ")") // translate and then rotate the object and axes
//        .attr("x", d => Math.cos(d.offset_ang * (Math.PI / 180)) * d.offset)
//        .attr("y", d => Math.sin(d.offset_ang * (Math.PI / 180)) * d.offset + 5) // the origin is (0, 0)
//        .text(d => d.label)
//        .attr("style", d => "cursor:default; fill:grey; text-anchor:" + d.anchor); // d.anchor = start/middle/end
//}
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
function draw_labels(p_d3, p_labels) { // undefined = subscript
    p_d3.selectAll("text.label").data(p_labels).join("text").classed("label", true)
        .attr("transform", d => "translate(" + d.x + "," + d.y + ") rotate(" + d.ang + ")") // translate and then rotate the object and axes
        .attr("x", d => Math.cos(d.offset_ang * (Math.PI / 180)) * d.offset)
        .attr("y", d => Math.sin(d.offset_ang * (Math.PI / 180)) * d.offset + 5) // the origin is (0, 0)
        .text(d => d.label)
        .attr("style", d => "cursor:default; fill:grey; text-anchor:" + d.anchor); // d.anchor = start/middle/end
}

function draw_sup_sub(p_svg_mom, p_sup, p_sub) {
    if (p_sup != undefined) { // superscript
        p_svg_mom.append("tspan")
            .text(p_sup)
            .style("baseline-shift", "super")
            .style("font-size", "0.8em");
    }
    if (p_sub != undefined) { // subscript
        p_svg_mom.append("tspan")
            .text(p_sub)
            .style("baseline-shift", "sub")
            .style("font-size", "0.8em");
    }
}

function set_cable_style(p_idx, p_ref_idx) {
    if (p_idx < p_ref_idx) return "stroke:dimgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + gv_ele_unit / 4;
    else return "stroke:lightgrey; stroke-linejoin:round; stroke-linecap:round; stroke-width:" + (gv_ele_unit / 4 - 1);
}

function draw_angle_arc_360(p_d3, p_org_x, p_org_y, p_ini_ng, p_cur_ng, p_radius, p_line_width, p_target, p_id) {
    if (Math.abs(p_cur_ng - p_ini_ng) < 2) return; // within 2 degree, do nothing

    ////////////////////////////////////////////////////////////////////////////////
    // 0 <= p_s_ng and p_e_ng <= 360
    // scaler; d3.arc = cw from +y; Mohr's circle = ccw from +x
    ////////////////////////////////////////////////////////////////////////////////
    var factor = Math.PI / 180;
    var scale = d3.scaleLinear().domain([360 * factor, 0 * factor]).range([90 * factor, -270 * factor]);

    // make arc
    var s_ng = Math.min(p_ini_ng, p_cur_ng) * factor, e_ng = Math.max(p_ini_ng, p_cur_ng) * factor;
    if (Math.abs(p_cur_ng - p_ini_ng) > 180) e_ng -= 2 * Math.PI; // if difference of angle > 180, draw the opposite angle
    var arc = d3.arc()
        .innerRadius(0).outerRadius(p_radius)
        .startAngle(scale(s_ng))
        .endAngle(scale(e_ng));

    // draw arc; angle from p_ini_ng to p_cur_ng
    //var ang = p_cur_ng - p_ini_ng; // in degree
    //if (ang >= 0)
    //    if (ang <= 180) ang = ang; // ccw
    //    else ang = ang - 360; // cw
    //else
    //    if (ang >= -180) ang = ang; // cw
    //    else ang = ang + 360; // ccw
    var ang = p_cur_ng - p_ini_ng; // in degree
    if (Math.abs(ang) > 180) ang = ang + ((ang > 0) ? -360 : 360); // in ccw => +, in cw => -
    p_d3.selectAll((p_id == undefined) ? ".arc" : "#" + p_id).data([0]).join("path").classed("arc", true).attr("id", (p_id == undefined) ? null : p_id)//.lower()
        .attr("transform", "translate(" + [p_org_x, p_org_y] + ")")
        .attr("d", arc)
        .attr("style", "opacity:0.5; stroke:grey; fill:#eee; stroke-width:" + p_line_width)
        .on("mouseover", function () { mouse_enter(p_target, ang); })
        .on("mouseout", mouse_out);
}

// default drag_ended
function drag_ended() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip = undefined;
}

// default mouse_out
function mouse_out() {
    // hide tooltip
    g_tooltip.transition().duration(500).style("opacity", 0);
    g_tooltip.undefined;
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

function last_of(p_arr) {
    return p_arr[p_arr.length - 1];
}

function poly_val(p_coeffs, p_xx) {
    var num_order = p_coeffs.length - 1;
    var val = 0;
    p_coeffs.forEach(function (coeff, j) {
        val += coeff * Math.pow(p_xx, num_order - j);
    });
    return val;
}

function poly_vals(p_coeffs, p_xxs) {
    var num_order = p_coeffs.length - 1;
    var vals = [];
    p_xxs.forEach(function (xx, i) {
        var val = 0;
        p_coeffs.forEach(function (coeff, j) {
            val += coeff * Math.pow(xx, num_order - j);
        });
        vals.push(val);
    });
    return vals;
}

function round_by_unit(p_number, p_round_unt) { // round to [0 1 2 3 ...]*p_round_unt; ex. (12, 5) => 10, (13, 5) => 15
    return Math.round(p_number / p_round_unt) * p_round_unt;
}

//function get_random(p_min, p_max) {
//    // for input error
//    m_min = Math.min(p_min, p_max);
//    m_max = Math.max(p_min, p_max);
//    if (m_min == m_max) return 0.0;

//    // return randomm number
//    if (m_min == undefined)
//        return Math.random(); // bewteen 0.0 ~ 1.0
//    else
//        return Math.random() * (m_max - m_min) + m_min; // between p_min ~ p_max
//}

function get_random(p_min, p_max, p_num) {
    // for input error
    m_min = Math.min(p_min, p_max);
    m_max = Math.max(p_min, p_max);
    if (m_min == m_max) return 0.0;
    if (p_num == undefined) p_num = 1;

    // return randomm number
    if (m_min == undefined)
        if (p_num == 1) return Math.random(); // bewteen 0.0 ~ 1.0
        else return Array.from({ length: p_num }, () => Math.random()); // p_num random numbers bewteen 0.0 ~ 1.0
    else
        if (p_num == 1) return Math.random() * (m_max - m_min) + m_min; // between p_min ~ p_max
        else return Array.from({ length: p_num }, () => Math.random() * (m_max - m_min) + m_min); // p_num random numbers bewteen p_min ~ p_max
        //var myarr = Array.from({ length: p_num }, () => Math.floor(Math.random() * p_num)); // p_num random integers bewteen 0 ~ p_num
}

function get_randomi(p_max) { // 0, 1, 2, ..., p_max
    if (p_max == undefined) p_max = 1; // 0, 1
    return Math.floor(Math.random() * (p_max + 1));
}

function acosd(p_cos_value) {
    return Math.acos(p_cos_value) * (180 / Math.PI); // radian => degree
}

function atand(p_tan_value) {
    return Math.atan(p_tan_value) * (180 / Math.PI); // radian => degree
}

function get_angle_360(p_pnt) {
    var v = create_vector(create_point(0, 0), p_pnt);
    var a = atand(v.uv.y / v.uv.x); // in degree; for the 1st quarter
    if (v.uv.x < 0) a += 180; // for the 2nd, 3rd quarter
    if (a < 0) a += 360; // for the 4th quarter
    return a;
}

function move_xy(p_pnt, p_x, p_y) {
    p_pnt.x += p_x;
    p_pnt.y += p_y;
    return p_pnt;
}

function move_point(p_pnt, p_delta) {
    return move_xy(p_pnt, p_delta.x, p_delta.y);
}

function scale_xy(p_x, p_y, p_scaler) {
    return create_point(p_scaler(p_x), p_scaler(p_y));
}

function scale_point(p_pnt, p_scaler) {
    return scale_xy(p_pnt.x, p_pnt.y, p_scaler);
}

function rotate_xy(p_x, p_y, p_ang) {
    // in radian
    // | c -s ||x|
    // | s  c ||y|
    var c = Math.cos(p_ang), s = Math.sin(p_ang);
    return create_point(c * p_x - s * p_y, s * p_x + c * p_y);
}

function rotate_point(p_pnt, p_ang) {
    return rotate_xy(p_pnt.x, p_pnt.y, p_ang);
}

function create_point(p_x, p_y) {
    return { x: p_x, y: p_y };
}

function create_vector(p_s, p_e) {
    var delta = create_point(p_e.x - p_s.x, p_e.y - p_s.y);
    var mag = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    var unit_vec = create_point(delta.x / mag, delta.y / mag);
    return {
        sp: p_s, ep: p_e,
        cp: create_point((p_s.x + p_e.x) / 2, (p_s.y + p_e.y) / 2),
        df: delta, mg: mag,
        uv: unit_vec,
        ng: atand(unit_vec.y / unit_vec.x) + (unit_vec.x >= 0 ? 0 : 180) // angle
    };

    //return {
    //    sp: p_s, ep: p_e,
    //    df: function () { create_point(this.ep.x - this.sp.x, this.ep.y - this.sp.y) },
    //    mg: function () { Math.sqrt(this.df().x * this.df().x + this.df().y * this.df().y) },
    //    uv: function () { create_point(this.df().x / this.mg(), this.df().y / this.mg()) },
    //    ng: function () { atand(this.uv().y / this.uv().x) } // angle
    //};
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
//////    var tri_str = -tri_w / 2 + "," + tri_h + " " + tri_w / 2 + "," + tri_h + " 0,0";

//////    // draw hinge
//////    var hinge = p_svg_mom.append("g") // set group for hinge
//////        .attr("transform", "translate(" + p_org_x + "," + p_org_y + ") rotate(" + p_ang + ")"); // translate and then rotate
//////    hinge.append("polygon") // triangle
//////        .attr("points", tri_str)
//////        .attr("style", "fill:white;stroke-width:1;stroke:dimgrey");
//////    draw_fix(hinge, 0, gv_ele_unit, 0); // draw fix
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
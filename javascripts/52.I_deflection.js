var g_num_section_layer = 5;

$(document).ready(function () {
    // update setting
    $(document).on("input", "#input_C", function () {
        g_setting.C = parseFloat($(this).val());
        $("#label_C").html(g_setting.C.toFixed(g_digit) + " %");
        draw_section();
        draw_measurement();
    });

    // initialize svg
    initialize_svg();

    // draw section and problem
    draw_section();
    draw_problem();
    draw_measurement();
});

function initialize_svg() {
    $("#setting_space").css("width", "350px").css("height", "400px");
    $("#section_space").css("height", "400px");

    var sx = g_bg_sz[0] / 2, sy = gv_ele_unit;
    $("#section_svg, #prob_svg, #deflection_svg").empty();
    g_section = d3.select("#section_svg").append("g") // set svg group
        .attr("transform", "translate(150, 200)");
    g_structure = d3.select("#prob_svg").append("g") // set svg group
        .attr("transform", "translate(" + sx + ", " + sy + ")");
    g_setting.E = 5000.0;
    g_setting.C = 50.0;
    g_setting.I = function () {
        var I_max = this.b * Math.pow(this.h, 3) / 12;
        var I_min = this.b * Math.pow(this.h / g_num_section_layer, 3) / 12 * g_num_section_layer;
        return I_min + (I_max - I_min) * (this.C / 100); // consider the degree of composite action
    }
}

function draw_section() {
    // set scaler
    g_section_scaler = d3.scaleLinear().domain([0, 60]).range([0, 200]); // scale domain to pixel

    // prepare data
    var b = g_section_scaler(g_setting.b);
    var h = g_section_scaler(g_setting.h);

    // draw section
    g_section.selectAll(".section").data([g_setting]).join("rect").classed("section", true)
        .attr("x", -b / 2).attr("y", -h / 2)
        .attr("width", b).attr("height", h)
        .attr("style", "fill:lightgrey; stroke:dimgrey");
    var divider = d3.range(1, g_num_section_layer);
    divider.forEach(function (d, i, arr) { arr[i] = d * (h / g_num_section_layer); });
    g_section.selectAll(".divider").data(divider).join("line").classed("divider", true)
        .attr("x1", -b / 2 + 1).attr("y1", d => d - h / 2)
        .attr("x2", b / 2 - 1).attr("y2", d => d - h / 2)
        .attr("style", "stroke:white; stroke-width:2; stroke-opacity:" + ((100 - g_setting.C) / 100));
    g_section.selectAll(".centroid").data([g_setting]).join("line").classed("centroid", true)
        .attr("x1", -b / 2 - gv_ele_unit).attr("y1", 0)
        .attr("x2", b / 2 + gv_ele_unit).attr("y2", 0)
        .attr("stroke-dasharray", "16 4 4 4") // line 16, space 4, line 4, space 4, repeat; line-dot-line
        .attr("style", "stroke:dimgrey");

    // dimensions
    gv_ratio_len = b / g_setting.b; // used in draw_dimensions
    draw_dimensions(g_section, -b / 2, 0, 0, "b_dim", [g_setting.b], h / 2 + gv_margin_unit, "mm", "dn", false);
    draw_dimensions(g_section, 0, h / 2, -90, "h_dim", [g_setting.h], b / 2 + 2 * gv_margin_unit, "mm", "dn", false);
}
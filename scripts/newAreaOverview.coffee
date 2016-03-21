ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

d3 = window.d3

class NewAreaOverviewTab extends ReportTab
  name: 'Overview'
  className: 'newAreaOverview'
  template: templates.newAreaOverview
  dependencies:[ 
    'NewReserveHabitatToolbox'
  ]
  render: () ->

    # create random data for visualization
    habs = @recordSet('NewReserveHabitatToolbox', 'Habitat').toArray()
    
    missing_habs = @recordSet('NewReserveHabitatToolbox', 'MissingHabitat').toArray()
    console.log("missing: ", missing_habs)
    hab_count = @recordSet('NewReserveHabitatToolbox', 'HabitatCounts').toArray()

    try
      total_habs = hab_count[0].TOT
      found_habs = hab_count[0].FOUND
      missing_hab_count = hab_count[0].MISSING
    catch err
      console.log("err getting count ", err)

    isCollection = @model.isCollection()
    if isCollection
      sketch_type = "Collection"
    else
      sketch_type = "Sketch"

    if window.d3
      d3IsPresent = true
    else
      d3IsPresent = false

    sketch_name = @model.attributes.name
    found_color = "#b3cfa7"
    missing_color = "#e5cace"
    pie_data = @build_values("Habitats Found", found_habs, found_color, "Missing Habitats", missing_hab_count,missing_color)
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      d3IsPresent: d3IsPresent
      habs: habs
      total_habs: total_habs
      found_habs: found_habs
      missing_habs: missing_habs
      sketch_name: sketch_name
      sketch_type: sketch_type
      missing_hab_count: missing_hab_count
    
    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @drawPie(pie_data, '#hab_pie')


  roundData: (items) =>  
    for item in items
      item.AREA = Number(item.AREA).toFixed(1)

    items = _.sortBy items, (row) -> row.NAME
    return items

  build_values: (yes_label, yes_count, yes_color, no_label, no_count, no_color) =>
    yes_val = {"label":yes_label+" ("+yes_count+")", "value":yes_count, "color":yes_color, "yval":50}
    no_val = {"label":no_label+" ("+no_count+")", "value":no_count, "color":no_color, "yval":75}

    return [yes_val, no_val]

  drawPie: (data, pie_name) =>


    if window.d3
      w = 160
      h = 110
      r = 50
     
      vis_el = @$(pie_name)[0]
      
      vis = d3.select(vis_el).append("svg:svg").data([data]).attr("width", w).attr("height", h).append("svg:g").attr("transform", "translate(" + (r*2) + "," + (r+5) + ")")
      
    
      pie = d3.layout.pie().value((d) -> return d.value)

      #declare an arc generator function
      arc = d3.svg.arc().outerRadius(r)

      #select paths, use arc generator to draw
      arcs = vis.selectAll("g.slice").data(pie).enter().append("svg:g").attr("class", "slice")
      arcs.append("svg:path")
        .attr("fill", (d) -> return d.data.color)
        .attr("stroke", (d) -> return if d.data.value == 0 then "none" else "#545454")
        .attr("stroke-width", 0.25)
        .attr("d", (d) ->  
          arc(d)
        )

      el = @$(pie_name+"_legend")[0]
      chart = d3.select(el)
      legends = chart.selectAll(pie_name+"_legend")
        .data(data)
      .enter().insert("div")
          .attr("class", "legend-row")

      legends.append("span")
        .attr("class", "pie-label-swatch")
        .style('background-color', (d,i) -> d.color)
      
      legends.append("span")
        .text((d,i) -> return data[i].label)
        .attr("class", "pie-label")

  addCommas: (num_str) =>
    num_str += ''
    x = num_str.split('.')
    x1 = x[0]
    x2 = if x.length > 1 then '.' + x[1] else ''
    rgx = /(\d+)(\d{3})/
    while rgx.test(x1)
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    return x1 + x2

module.exports = NewAreaOverviewTab
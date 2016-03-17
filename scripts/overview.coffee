ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

d3 = window.d3

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'HabitatToolbox'
    'SizeToolbox'
  ]
  render: () ->

    # create random data for visualization
    habs = @recordSet('HabitatToolbox', 'Habitat').toArray()
    habs = @roundData(habs)

    amphibians = @recordSet('HabitatToolbox', 'Amphibians').toArray()
    amphibians = @roundData(amphibians)

    reptiles = @recordSet('HabitatToolbox', 'Reptiles').toArray()
    reptiles = @roundData(reptiles)

    birds = @recordSet('HabitatToolbox', 'Birds').toArray()
    birds = @roundData(birds)

    mammals = @recordSet('HabitatToolbox', 'Mammals').toArray()
    mammals = @roundData(mammals)

    size = @recordSet('SizeToolbox', 'Size').float('Size')
    aoi_size = @addCommas size.toFixed(1)
    res_name = @recordSet('SizeToolbox', 'ReserveName').raw('ResName')
    aoi_res_name = res_name.toString()

    aoi_res_url = @getURL aoi_res_name
    
    aoi_name = @model.attributes.name
    aoi_name = aoi_name.charAt(0).toUpperCase() + aoi_name.slice(1)

    isCollection = @model.isCollection()

    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      habs: habs
      amphibians: amphibians
      reptiles: reptiles
      birds: birds
      mammals: mammals
      aoi_size: aoi_size
      aoi_res_name: aoi_res_name
      aoi_name: aoi_name
      aoi_res_url: aoi_res_url
    
    @$el.html @template.render(context, templates)
    @enableTablePaging()
    @drawCharts(habs, amphibians, reptiles, birds, mammals)

  roundData: (items) =>  
    for item in items
      item.AREA = Number(item.AREA).toFixed(1)

    items = _.sortBy items, (row) -> row.NAME
    return items

  getURL: (name) =>
    try
      prefix = "http://www.ucnrs.org/reserves/"
      lower = name.toLowerCase()
      dashes =  lower.replace(/\s+/g, "-")
      return prefix+dashes+".html"
    catch err
      console.log("err getting url: ", err)
      return "http://www.ucnrs.org/reserves"

  drawCharts: (habitats, amphibians, reptiles, birds, mammals) =>
    num_habitats = habitats?.length
    max_habitats = 56
    num_amphibians = amphibians?.length
    max_amphibians = 41
    num_reptiles = reptiles?.length
    max_reptiles = 76
    num_birds = birds?.length
    max_birds = 331
    num_mammals = mammals?.length
    max_mammals = 147
    
    num_group_gaps = 4
    group_gap = 8
    data = [
        {            
          name: 'Total'
          group: 'Habitats'
          value: max_habitats
          color: "#80CBC4"
          spacer: group_gap
          
        }
        {
          name: 'Sketch'
          group: ''
          value: num_habitats
          color: "#80CBC4"
          spacer: 0
        }
        {           
          name: "Total"
          group: 'Amphibians'
          value: max_amphibians
          color: "#FFCCBC"
          spacer: group_gap
        }
        {
          name: "Sketch"
          group: ''
          value: num_amphibians
          color: "#FFCCBC"
          spacer: 0
        }
        {           
          name: "Total"
          group: 'Reptiles'
          value: max_reptiles
          color: "#B3E5FC"
          spacer: group_gap
        }
        {
          name: "Sketch"
          group: ''
          value: num_reptiles
          color: "#B3E5FC"
          spacer: 0
        }
        {           
          name: "Total"
          group: 'Birds'
          value: max_birds
          color: "#FFCDD2"
          spacer: group_gap
        }
        {           
          name: "Sketch"
          group: ''
          value: num_birds
          color: "#FFCDD2"
          spacer: 0
        }
        {           
          name: "Total"
          group: 'Mammals'
          value: max_mammals
          color: "#F4FF81"
          spacer: group_gap
        }
        {           
          name: "Sketch"
          group: ''
          value: num_mammals
          color: "#F4FF81"
          spacer: 0
        }
    ]
    
    num_bars = 10
    margins = {top: 12, right: 10, bottom: 18, left: 15}
    if window.d3

      width =  440 - (margins.left + margins.right)
      height = 380 - (margins.top + margins.bottom)

      xaxis_offset = height-margins.bottom
      xaxis_labels = height-margins.top+2
      yoff = margins.bottom*-1
      y = d3.scale.linear().range([height, 0])

      x = d3.scale.linear().range([0, width])

      xAxis = d3.svg.axis()
        .scale(x)
        .ticks(0)
        .orient("bottom")

      yAxis = d3.svg.axis()
        .scale(y)
        .ticks(0)
        .orient("left")

      el = @$('.chart')[0]
      chart = d3.select(el)
        .attr("width", width+margins.left+margins.right)
        .attr("height", height+margins.top+margins.bottom)
      .append("g")
          .attr("transform", "translate(" + margins.left + "," + margins.top + ")")

      chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + xaxis_offset + ")")
        .call(xAxis)


      chart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,"+yoff+")")
        .call(yAxis)

      chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Habitats or Species")


      y.domain([0, height]);


      barWidth = ((width - num_group_gaps*group_gap) / num_bars) 

      el = @$('.bar')[0]
      bar = chart.selectAll(el)
          .data(data)
        .enter().append("g")
          .attr("transform", (d, i) ->  return "translate(" + i * barWidth + ",0)")


      bar.append("rect")
          .attr("x", (d) -> return d.spacer)
          .attr("y", (d) -> return y(d.value) - margins.bottom)
          .attr("height", (d) -> return (height ) - y(d.value))
          .attr("width", (d) -> return barWidth)
          .style("fill",  (d) -> return d.color)
          .style("stroke", "black")


      bar.append("text")
          .attr("x", (d) -> (barWidth / 2)+d.spacer)
          .attr("y", (d) -> return y(d.value) - margins.bottom - 10)
          .attr("dy", ".75em")
          .text((d) ->  return d.value)

      bar.append("text")
          .attr("x", (d) -> (barWidth / 2)+d.spacer)
          .attr("y", (d) -> return xaxis_labels)
          .attr("dy", ".75em")
          .style("font", "8px sans-serif")
          .text((d) ->  return d.name)

      bar.append("text")
        .attr("x", (d) -> return d.spacer+barWidth)
        .attr("y", (d) -> return xaxis_labels+14)
        .attr("dy", "0.75em")
        .style("font", "12px sans-serif")
        .style("font-weight", "bold")
        .text((d) ->  return d.group)

  addCommas: (num_str) =>
    num_str += ''
    x = num_str.split('.')
    x1 = x[0]
    x2 = if x.length > 1 then '.' + x[1] else ''
    rgx = /(\d+)(\d{3})/
    while rgx.test(x1)
      x1 = x1.replace(rgx, '$1' + ',' + '$2')
    return x1 + x2

module.exports = OverviewTab
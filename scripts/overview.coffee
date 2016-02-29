ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'HabitatToolbox'
  ]
  render: () ->

    # create random data for visualization
    habs = @recordSet('HabitatToolbox', 'Habitat').toArray()
    @roundData(habs)

    amphibians = @recordSet('HabitatToolbox', 'Amphibians').toArray()
    @roundData(amphibians)

    reptiles = @recordSet('HabitatToolbox', 'Reptiles').toArray()
    @roundData(reptiles)

    birds = @recordSet('HabitatToolbox', 'Birds').toArray()
    @roundData(birds)

    mammals = @recordSet('HabitatToolbox', 'Mammals').toArray()
    @roundData(mammals)

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
    
    @$el.html @template.render(context, templates)
    @enableTablePaging()

  roundData: (items) =>  
    for item in items
      item.AREA = Number(item.AREA).toFixed(1)

module.exports = OverviewTab
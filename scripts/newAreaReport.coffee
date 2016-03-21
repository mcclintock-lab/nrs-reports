NewAreaOverviewTab = require './newAreaOverview.coffee'


window.app.registerReport (report) ->
  report.tabs [NewAreaOverviewTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']

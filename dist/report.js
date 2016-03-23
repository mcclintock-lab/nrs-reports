require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
var OverviewTab, ReportTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

d3 = window.d3;

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    this.addCommas = __bind(this.addCommas, this);
    this.drawCharts = __bind(this.drawCharts, this);
    this.getURL = __bind(this.getURL, this);
    this.roundData = __bind(this.roundData, this);
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['HabitatToolbox', 'SizeToolbox'];

  OverviewTab.prototype.render = function() {
    var amphibians, aoi_name, aoi_res_name, aoi_res_url, aoi_size, birds, context, habs, isCollection, mammals, reptiles, res_name, size, size_acres;
    habs = this.recordSet('HabitatToolbox', 'Habitat').toArray();
    habs = this.roundData(habs);
    amphibians = this.recordSet('HabitatToolbox', 'Amphibians').toArray();
    amphibians = this.roundData(amphibians);
    reptiles = this.recordSet('HabitatToolbox', 'Reptiles').toArray();
    reptiles = this.roundData(reptiles);
    birds = this.recordSet('HabitatToolbox', 'Birds').toArray();
    birds = this.roundData(birds);
    mammals = this.recordSet('HabitatToolbox', 'Mammals').toArray();
    mammals = this.roundData(mammals);
    size = this.recordSet('SizeToolbox', 'Size').float('Size');
    size_acres = size * 0.000247105;
    if (size_acres < 0.1) {
      if (size_acres < 0.01) {
        aoi_size = "< 0.01";
      } else {
        aoi_size = this.addCommas(size_acres.toFixed(2));
      }
    } else {
      aoi_size = this.addCommas(size_acres.toFixed(1));
    }
    res_name = this.recordSet('SizeToolbox', 'ReserveName').raw('ResName');
    aoi_res_name = res_name.toString();
    aoi_res_url = this.getURL(aoi_res_name);
    aoi_name = this.model.attributes.name;
    aoi_name = aoi_name.charAt(0).toUpperCase() + aoi_name.slice(1);
    isCollection = this.model.isCollection();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      habs: habs,
      amphibians: amphibians,
      reptiles: reptiles,
      birds: birds,
      mammals: mammals,
      aoi_size: aoi_size,
      aoi_res_name: aoi_res_name,
      aoi_name: aoi_name,
      aoi_res_url: aoi_res_url
    };
    this.$el.html(this.template.render(context, templates));
    this.enableTablePaging();
    return this.drawCharts(habs, amphibians, reptiles, birds, mammals);
  };

  OverviewTab.prototype.roundData = function(items) {
    var item, _i, _len;
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      item.AREA = Number(item.AREA).toFixed(1);
    }
    items = _.sortBy(items, function(row) {
      return row.NAME;
    });
    return items;
  };

  OverviewTab.prototype.getURL = function(name) {
    var dashes, err, esc, lower, prefix, slashes;
    try {
      console.log(name);
      prefix = "http://www.ucnrs.org/reserves/";
      if (name === "Valentine Eastern Sierra Reserve -Valentine Camp") {
        return prefix + "valentine-eastern-sierra-reserve.html";
      }
      if (name === "Steele Burnand Anza-Borrego Desert Research Center") {
        return prefix + "steeleburnand-anza-borrego-desert-research-center.html";
      }
      if (name === "Burns Piñon Ridge Reserve") {
        return prefix + "burns-pinon-ridge-reserve.html";
      }
      lower = name.toLowerCase();
      if (name === "Ano Nuevo Island") {
        return prefix + "ano-nuevo-island-reserve.html";
      }
      dashes = lower.replace(/\s+/g, "-");
      slashes = dashes.replace(/\//g, "");
      esc = _.escape(slashes);
      return prefix + esc + ".html";
    } catch (_error) {
      err = _error;
      console.log("err getting url: ", err);
      return "http://www.ucnrs.org/reserves.html";
    }
  };

  OverviewTab.prototype.drawCharts = function(habitats, amphibians, reptiles, birds, mammals) {
    var bar, barWidth, chart, data, el, group_gap, height, margins, max_amphibians, max_birds, max_habitats, max_mammals, max_reptiles, num_amphibians, num_bars, num_birds, num_group_gaps, num_habitats, num_mammals, num_reptiles, width, x, xAxis, xaxis_labels, xaxis_offset, y, yAxis, yoff;
    num_habitats = habitats != null ? habitats.length : void 0;
    max_habitats = 57;
    num_amphibians = amphibians != null ? amphibians.length : void 0;
    max_amphibians = 41;
    num_reptiles = reptiles != null ? reptiles.length : void 0;
    max_reptiles = 76;
    num_birds = birds != null ? birds.length : void 0;
    max_birds = 331;
    num_mammals = mammals != null ? mammals.length : void 0;
    max_mammals = 147;
    num_group_gaps = 4;
    group_gap = 8;
    data = [
      {
        name: 'Total',
        group: 'Habitats',
        value: max_habitats,
        color: "#80CBC4",
        spacer: group_gap
      }, {
        name: 'Sketch',
        group: '',
        value: num_habitats,
        color: "#80CBC4",
        spacer: 0
      }, {
        name: "Total",
        group: 'Amphibians',
        value: max_amphibians,
        color: "#FFCCBC",
        spacer: group_gap
      }, {
        name: "Sketch",
        group: '',
        value: num_amphibians,
        color: "#FFCCBC",
        spacer: 0
      }, {
        name: "Total",
        group: 'Reptiles',
        value: max_reptiles,
        color: "#B3E5FC",
        spacer: group_gap
      }, {
        name: "Sketch",
        group: '',
        value: num_reptiles,
        color: "#B3E5FC",
        spacer: 0
      }, {
        name: "Total",
        group: 'Birds',
        value: max_birds,
        color: "#FFCDD2",
        spacer: group_gap
      }, {
        name: "Sketch",
        group: '',
        value: num_birds,
        color: "#FFCDD2",
        spacer: 0
      }, {
        name: "Total",
        group: 'Mammals',
        value: max_mammals,
        color: "#F4FF81",
        spacer: group_gap
      }, {
        name: "Sketch",
        group: '',
        value: num_mammals,
        color: "#F4FF81",
        spacer: 0
      }
    ];
    num_bars = 10;
    margins = {
      top: 12,
      right: 10,
      bottom: 18,
      left: 15
    };
    if (window.d3) {
      width = 440 - (margins.left + margins.right);
      height = 380 - (margins.top + margins.bottom);
      xaxis_offset = height - margins.bottom;
      xaxis_labels = height - margins.top + 2;
      yoff = margins.bottom * -1;
      y = d3.scale.linear().range([height, 0]);
      x = d3.scale.linear().range([0, width]);
      xAxis = d3.svg.axis().scale(x).ticks(0).orient("bottom");
      yAxis = d3.svg.axis().scale(y).ticks(0).orient("left");
      el = this.$('.chart')[0];
      chart = d3.select(el).attr("width", width + margins.left + margins.right).attr("height", height + margins.top + margins.bottom).append("g").attr("transform", "translate(" + margins.left + "," + margins.top + ")");
      chart.append("g").attr("class", "x axis").attr("transform", "translate(0," + xaxis_offset + ")").call(xAxis);
      chart.append("g").attr("class", "y axis").attr("transform", "translate(0," + yoff + ")").call(yAxis);
      chart.append("text").attr("transform", "rotate(-90)").attr("y", 0 - margins.left).attr("x", 0 - (height / 2)).attr("dy", "1em").style("text-anchor", "middle").text("Number of Habitats or Species");
      y.domain([0, height]);
      barWidth = (width - num_group_gaps * group_gap) / num_bars;
      el = this.$('.bar')[0];
      bar = chart.selectAll(el).data(data).enter().append("g").attr("transform", function(d, i) {
        return "translate(" + i * barWidth + ",0)";
      });
      bar.append("rect").attr("x", function(d) {
        return d.spacer;
      }).attr("y", function(d) {
        return y(d.value) - margins.bottom;
      }).attr("height", function(d) {
        return height - y(d.value);
      }).attr("width", function(d) {
        return barWidth;
      }).style("fill", function(d) {
        return d.color;
      }).style("stroke", "black");
      bar.append("text").attr("x", function(d) {
        return (barWidth / 2) + d.spacer;
      }).attr("y", function(d) {
        return y(d.value) - margins.bottom - 10;
      }).attr("dy", ".75em").text(function(d) {
        return d.value;
      });
      bar.append("text").attr("x", function(d) {
        return (barWidth / 2) + d.spacer;
      }).attr("y", function(d) {
        return xaxis_labels;
      }).attr("dy", ".75em").style("font", "8px sans-serif").text(function(d) {
        return d.name;
      });
      return bar.append("text").attr("x", function(d) {
        return d.spacer + barWidth;
      }).attr("y", function(d) {
        return xaxis_labels + 14;
      }).attr("dy", "0.75em").style("font", "12px sans-serif").style("font-weight", "bold").text(function(d) {
        return d.group;
      });
    }
  };

  OverviewTab.prototype.addCommas = function(num_str) {
    var rgx, x, x1, x2;
    num_str += '';
    x = num_str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":13,"reportTab":"a21iR2"}],12:[function(require,module,exports){
var OverviewTab;

OverviewTab = require('./overview.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab]);
  return report.stylesheets(['./report.css']);
});


},{"./overview.coffee":11}],13:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["newAreaOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);if(_.s(_.f("isWithinReserve",c,p,1),c,p,0,66,230,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p style=\"large\"><b>");_.b(_.v(_.f("aoi_name",c,p,0)));_.b("</b> is <b>");_.b(_.v(_.f("aoi_size",c,p,0)));_.b(" acres</b> and is within the <b><a href=");_.b(_.v(_.f("aoi_res_url",c,p,0)));_.b(" target=\"_blank\">");_.b(_.v(_.f("aoi_res_name",c,p,0)));_.b("</a></b>.</p>");_.b("\n");});c.pop();}if(!_.s(_.f("isWithinReserve",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("isCollection",c,p,1),c,p,0,295,381,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <p style=\"large\"><b>");_.b(_.v(_.f("aoi_name",c,p,0)));_.b("</b> is <b>");_.b(_.v(_.f("aoi_size",c,p,0)));_.b(" acres</b>.</p>");_.b("\n");});c.pop();}_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("    ");_.b("\n" + i);_.b("          <p style=\"large\"><b>");_.b(_.v(_.f("aoi_name",c,p,0)));_.b("</b> is <b>");_.b(_.v(_.f("aoi_size",c,p,0)));_.b(" acres</b>; it is not within an existing reserve.</p>");_.b("\n");};};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Number of Habitats in '");_.b(_.v(_.f("sketch_name",c,p,0)));_.b("'</h4>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,700,850,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div>");_.b("\n" + i);_.b("          <div class=\"hab_pie\" id=\"hab_pie\"></div>");_.b("\n" + i);_.b("          <div class=\"hab_pie_legend\" id=\"hab_pie_legend\"></div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("    <p>");_.b("\n" + i);_.b("      '");_.b(_.v(_.f("sketch_name",c,p,0)));_.b("' includes <b>");_.b(_.v(_.f("found_habs",c,p,0)));_.b("</b> of the <b>");_.b(_.v(_.f("total_habs",c,p,0)));_.b("</b> CWHR habitats within California.");_.b("\n" + i);_.b("    </p>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Missing Habitats (");_.b(_.v(_.f("missing_hab_count",c,p,0)));_.b(" of ");_.b(_.v(_.f("total_habs",c,p,0)));_.b(")</h4>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th>Habitat Name</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("       </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("missing_habs",c,p,1),c,p,0,1338,1416,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Habitats Found (");_.b(_.v(_.f("found_habs",c,p,0)));_.b(" of ");_.b(_.v(_.f("total_habs",c,p,0)));_.b(")</h4>");_.b("\n" + i);_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Habitat Name</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("habs",c,p,1),c,p,0,1727,1797,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Area of Interest</h4>");_.b("\n" + i);_.b("  <p style=\"large\"><b>");_.b(_.v(_.f("aoi_name",c,p,0)));_.b("</b> is <b>");_.b(_.v(_.f("aoi_size",c,p,0)));_.b(" acres</b> and is within the <b><a href=");_.b(_.v(_.f("aoi_res_url",c,p,0)));_.b(" target=\"_blank\">");_.b(_.v(_.f("aoi_res_name",c,p,0)));_.b("</a></b>.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Number of CWHR Habitats and Species in Sketch</h4>");_.b("\n" + i);_.b("\n" + i);_.b("  <svg class=\"chart\"></svg>");_.b("\n" + i);_.b("  <p style=\"margin-left:20px;\"><i>Habitat and species data is from <a href=\"https://www.dfg.ca.gov/biogeodata/cwhr/\" target=\"_blank\" >California Wildlife Habitat Relationships (CWHR)</a>. The reports below detail the habitat and species within the sketch.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Habitats in Sketch</h4>");_.b("\n" + i);_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("habs",c,p,1),c,p,0,746,816,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("   <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Bird Species in Sketch</h4>");_.b("\n" + i);_.b("    <table data-paging=\"25\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Common Name (Scientific Name)</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("birds",c,p,1),c,p,0,1111,1181,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Amphbian Species in Sketch</h4>");_.b("\n" + i);_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Common Name (Scientific Name)</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("amphibians",c,p,1),c,p,0,1484,1554,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Reptile Species in Sketch</h4>");_.b("\n" + i);_.b("    <table  data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Common Name (Scientific Name)</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("reptiles",c,p,1),c,p,0,1860,1930,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("<div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Mammal Species in Sketch</h4>");_.b("\n" + i);_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th>Common Name (Scientific Name)</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("mammals",c,p,1),c,p,0,2229,2299,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n" + i);_.b(" </div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[12])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL25ycy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9ucnMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRSZXN1bHRzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9ucnMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvc2NyaXB0cy9vdmVydmlldy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL25ycy1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvbnJzLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNTLENBQVQsRUFBQSxFQUFpQixLQUFSO0NBQ1Q7Q0FDRSxFQUFPLENBQVAsRUFBQSxVQUFPO0NBQVAsRUFDTyxDQUFQLENBREEsQ0FDQTtBQUMrQixDQUYvQixDQUU4QixDQUFFLENBQWhDLEVBQUEsRUFBUSxDQUF3QixLQUFoQztDQUZBLENBR3lCLEVBQXpCLEVBQUEsRUFBUSxDQUFSO01BSkY7Q0FNRSxLQURJO0NBQ0osQ0FBZ0MsRUFBaEMsRUFBQSxFQUFRLFFBQVI7TUFUSjtDQUFBLEVBUkE7Q0FtQlMsQ0FBVCxDQUFxQixJQUFyQixDQUFRLENBQVI7Q0FDRSxHQUFBLFVBQUE7Q0FBQSxFQUNBLENBQUEsRUFBTTtDQUROLEVBRU8sQ0FBUCxLQUFPO0NBQ1AsR0FBQTtDQUNFLEdBQUksRUFBSixVQUFBO0FBQzBCLENBQXRCLENBQXFCLENBQXRC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Q0FBTSxXQUFBLEdBQU87Q0FGN0IsQ0FHZ0IsQ0FFTixDQUxWLENBQUEsQ0FBQSxDQUVlLEVBR0osT0FMWDtDQUtrQixHQUFBLFdBQU87Q0FMekIsTUFLVTtDQUVOLENBQ1MsQ0FEVixDQUFILEVBQUEsR0FDYyxJQURkO0NBQ29CLEVBQWdCLEdBQVQsRUFBUCxPQUFPO0NBRDNCLENBRWEsQ0FGYixDQUFBLEdBQ2EsRUFDQztDQUFNLENBQUEsQ0FBb0IsU0FBYixHQUFBO0NBRjNCLENBR2MsQ0FHTixDQU5SLENBQUEsQ0FBQSxDQUVhLENBRmIsQ0FNUyxJQU5ULElBQUE7Q0FNZ0IsSUFBQSxVQUFPO0NBTnZCLE1BTVE7TUFuTEE7Q0EvRlosRUErRlk7O0NBL0ZaLEVBb1JXLElBQUEsRUFBWDtDQUNFLE9BQUEsTUFBQTtDQUFBLENBQUEsRUFBQSxHQUFBO0NBQUEsRUFDSSxDQUFKLENBQUksRUFBTztDQURYLENBRUEsQ0FBSyxDQUFMO0NBRkEsQ0FHQSxDQUFRLENBQVIsRUFBUTtDQUhSLEVBSUEsQ0FBQSxVQUpBO0NBS0EsQ0FBTSxDQUFHLENBQUgsT0FBQTtDQUNKLENBQUEsQ0FBSyxDQUFnQixFQUFyQixDQUFLO0NBTlAsSUFLQTtDQUVBLENBQU8sQ0FBSyxRQUFMO0NBNVJULEVBb1JXOztDQXBSWDs7Q0FEd0I7O0FBK1IxQixDQXpTQSxFQXlTaUIsR0FBWCxDQUFOLElBelNBOzs7O0FDQUEsSUFBQSxPQUFBOztBQUFBLENBQUEsRUFBYyxJQUFBLElBQWQsUUFBYzs7QUFHZCxDQUhBLEVBR1UsR0FBSixHQUFxQixLQUEzQjtDQUNFLENBQUEsRUFBQSxFQUFNLEtBQU07Q0FFTCxLQUFELEdBQU4sRUFBQSxHQUFtQjtDQUhLOzs7O0FDSDFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuZDMgPSB3aW5kb3cuZDNcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnSGFiaXRhdFRvb2xib3gnXG4gICAgJ1NpemVUb29sYm94J1xuICBdXG4gIHJlbmRlcjogKCkgLT5cblxuICAgICMgY3JlYXRlIHJhbmRvbSBkYXRhIGZvciB2aXN1YWxpemF0aW9uXG4gICAgaGFicyA9IEByZWNvcmRTZXQoJ0hhYml0YXRUb29sYm94JywgJ0hhYml0YXQnKS50b0FycmF5KClcbiAgICBoYWJzID0gQHJvdW5kRGF0YShoYWJzKVxuXG4gICAgYW1waGliaWFucyA9IEByZWNvcmRTZXQoJ0hhYml0YXRUb29sYm94JywgJ0FtcGhpYmlhbnMnKS50b0FycmF5KClcbiAgICBhbXBoaWJpYW5zID0gQHJvdW5kRGF0YShhbXBoaWJpYW5zKVxuXG4gICAgcmVwdGlsZXMgPSBAcmVjb3JkU2V0KCdIYWJpdGF0VG9vbGJveCcsICdSZXB0aWxlcycpLnRvQXJyYXkoKVxuICAgIHJlcHRpbGVzID0gQHJvdW5kRGF0YShyZXB0aWxlcylcblxuICAgIGJpcmRzID0gQHJlY29yZFNldCgnSGFiaXRhdFRvb2xib3gnLCAnQmlyZHMnKS50b0FycmF5KClcbiAgICBiaXJkcyA9IEByb3VuZERhdGEoYmlyZHMpXG5cbiAgICBtYW1tYWxzID0gQHJlY29yZFNldCgnSGFiaXRhdFRvb2xib3gnLCAnTWFtbWFscycpLnRvQXJyYXkoKVxuICAgIG1hbW1hbHMgPSBAcm91bmREYXRhKG1hbW1hbHMpXG5cbiAgICBzaXplID0gQHJlY29yZFNldCgnU2l6ZVRvb2xib3gnLCAnU2l6ZScpLmZsb2F0KCdTaXplJylcbiAgICBzaXplX2FjcmVzID0gc2l6ZSowLjAwMDI0NzEwNVxuICAgIFxuICAgIGlmIHNpemVfYWNyZXMgPCAwLjFcbiAgICAgIGlmIHNpemVfYWNyZXMgPCAwLjAxXG4gICAgICAgIGFvaV9zaXplID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBhb2lfc2l6ZSA9IEBhZGRDb21tYXMgc2l6ZV9hY3Jlcy50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgYW9pX3NpemUgPSBAYWRkQ29tbWFzIHNpemVfYWNyZXMudG9GaXhlZCgxKVxuICAgIHJlc19uYW1lID0gQHJlY29yZFNldCgnU2l6ZVRvb2xib3gnLCAnUmVzZXJ2ZU5hbWUnKS5yYXcoJ1Jlc05hbWUnKVxuICAgIGFvaV9yZXNfbmFtZSA9IHJlc19uYW1lLnRvU3RyaW5nKClcblxuICAgIGFvaV9yZXNfdXJsID0gQGdldFVSTCBhb2lfcmVzX25hbWVcbiAgICBcbiAgICBhb2lfbmFtZSA9IEBtb2RlbC5hdHRyaWJ1dGVzLm5hbWVcbiAgICBhb2lfbmFtZSA9IGFvaV9uYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgYW9pX25hbWUuc2xpY2UoMSlcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIGhhYnM6IGhhYnNcbiAgICAgIGFtcGhpYmlhbnM6IGFtcGhpYmlhbnNcbiAgICAgIHJlcHRpbGVzOiByZXB0aWxlc1xuICAgICAgYmlyZHM6IGJpcmRzXG4gICAgICBtYW1tYWxzOiBtYW1tYWxzXG4gICAgICBhb2lfc2l6ZTogYW9pX3NpemVcbiAgICAgIGFvaV9yZXNfbmFtZTogYW9pX3Jlc19uYW1lXG4gICAgICBhb2lfbmFtZTogYW9pX25hbWVcbiAgICAgIGFvaV9yZXNfdXJsOiBhb2lfcmVzX3VybFxuICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlVGFibGVQYWdpbmcoKVxuICAgIEBkcmF3Q2hhcnRzKGhhYnMsIGFtcGhpYmlhbnMsIHJlcHRpbGVzLCBiaXJkcywgbWFtbWFscylcblxuICByb3VuZERhdGE6IChpdGVtcykgPT4gIFxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpdGVtLkFSRUEgPSBOdW1iZXIoaXRlbS5BUkVBKS50b0ZpeGVkKDEpXG5cbiAgICBpdGVtcyA9IF8uc29ydEJ5IGl0ZW1zLCAocm93KSAtPiByb3cuTkFNRVxuICAgIHJldHVybiBpdGVtc1xuXG4gIGdldFVSTDogKG5hbWUpID0+XG4gICAgdHJ5XG4gICAgICBjb25zb2xlLmxvZyhuYW1lKVxuICAgICAgcHJlZml4ID0gXCJodHRwOi8vd3d3LnVjbnJzLm9yZy9yZXNlcnZlcy9cIlxuICAgICAgaWYgbmFtZSA9PSBcIlZhbGVudGluZSBFYXN0ZXJuIFNpZXJyYSBSZXNlcnZlIC1WYWxlbnRpbmUgQ2FtcFwiXG4gICAgICAgIHJldHVybiBwcmVmaXgrXCJ2YWxlbnRpbmUtZWFzdGVybi1zaWVycmEtcmVzZXJ2ZS5odG1sXCJcbiAgICAgIGlmIG5hbWUgPT0gXCJTdGVlbGUgQnVybmFuZCBBbnphLUJvcnJlZ28gRGVzZXJ0IFJlc2VhcmNoIENlbnRlclwiXG4gICAgICAgIHJldHVybiBwcmVmaXgrXCJzdGVlbGVidXJuYW5kLWFuemEtYm9ycmVnby1kZXNlcnQtcmVzZWFyY2gtY2VudGVyLmh0bWxcIlxuICAgICAgaWYgbmFtZSA9PSBcIkJ1cm5zIFBpw7FvbiBSaWRnZSBSZXNlcnZlXCJcbiAgICAgICAgcmV0dXJuIHByZWZpeCtcImJ1cm5zLXBpbm9uLXJpZGdlLXJlc2VydmUuaHRtbFwiXG4gICAgICBsb3dlciA9IG5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgaWYgbmFtZSA9PSBcIkFubyBOdWV2byBJc2xhbmRcIlxuICAgICAgICByZXR1cm4gcHJlZml4K1wiYW5vLW51ZXZvLWlzbGFuZC1yZXNlcnZlLmh0bWxcIlxuICAgICAgZGFzaGVzID0gIGxvd2VyLnJlcGxhY2UoL1xccysvZywgXCItXCIpXG4gICAgICBzbGFzaGVzID0gIGRhc2hlcy5yZXBsYWNlKC9cXC8vZywgXCJcIilcbiAgICAgIGVzYyA9IF8uZXNjYXBlKHNsYXNoZXMpXG4gICAgICBcbiAgICAgIHJldHVybiBwcmVmaXgrZXNjK1wiLmh0bWxcIlxuICAgIGNhdGNoIGVyclxuICAgICAgY29uc29sZS5sb2coXCJlcnIgZ2V0dGluZyB1cmw6IFwiLCBlcnIpXG4gICAgICByZXR1cm4gXCJodHRwOi8vd3d3LnVjbnJzLm9yZy9yZXNlcnZlcy5odG1sXCJcblxuICBkcmF3Q2hhcnRzOiAoaGFiaXRhdHMsIGFtcGhpYmlhbnMsIHJlcHRpbGVzLCBiaXJkcywgbWFtbWFscykgPT5cbiAgICBudW1faGFiaXRhdHMgPSBoYWJpdGF0cz8ubGVuZ3RoXG4gICAgbWF4X2hhYml0YXRzID0gNTdcbiAgICBudW1fYW1waGliaWFucyA9IGFtcGhpYmlhbnM/Lmxlbmd0aFxuICAgIG1heF9hbXBoaWJpYW5zID0gNDFcbiAgICBudW1fcmVwdGlsZXMgPSByZXB0aWxlcz8ubGVuZ3RoXG4gICAgbWF4X3JlcHRpbGVzID0gNzZcbiAgICBudW1fYmlyZHMgPSBiaXJkcz8ubGVuZ3RoXG4gICAgbWF4X2JpcmRzID0gMzMxXG4gICAgbnVtX21hbW1hbHMgPSBtYW1tYWxzPy5sZW5ndGhcbiAgICBtYXhfbWFtbWFscyA9IDE0N1xuICAgIFxuICAgIG51bV9ncm91cF9nYXBzID0gNFxuICAgIGdyb3VwX2dhcCA9IDhcbiAgICBkYXRhID0gW1xuICAgICAgICB7ICAgICAgICAgICAgXG4gICAgICAgICAgbmFtZTogJ1RvdGFsJ1xuICAgICAgICAgIGdyb3VwOiAnSGFiaXRhdHMnXG4gICAgICAgICAgdmFsdWU6IG1heF9oYWJpdGF0c1xuICAgICAgICAgIGNvbG9yOiBcIiM4MENCQzRcIlxuICAgICAgICAgIHNwYWNlcjogZ3JvdXBfZ2FwXG4gICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdTa2V0Y2gnXG4gICAgICAgICAgZ3JvdXA6ICcnXG4gICAgICAgICAgdmFsdWU6IG51bV9oYWJpdGF0c1xuICAgICAgICAgIGNvbG9yOiBcIiM4MENCQzRcIlxuICAgICAgICAgIHNwYWNlcjogMFxuICAgICAgICB9XG4gICAgICAgIHsgICAgICAgICAgIFxuICAgICAgICAgIG5hbWU6IFwiVG90YWxcIlxuICAgICAgICAgIGdyb3VwOiAnQW1waGliaWFucydcbiAgICAgICAgICB2YWx1ZTogbWF4X2FtcGhpYmlhbnNcbiAgICAgICAgICBjb2xvcjogXCIjRkZDQ0JDXCJcbiAgICAgICAgICBzcGFjZXI6IGdyb3VwX2dhcFxuICAgICAgICB9XG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIlNrZXRjaFwiXG4gICAgICAgICAgZ3JvdXA6ICcnXG4gICAgICAgICAgdmFsdWU6IG51bV9hbXBoaWJpYW5zXG4gICAgICAgICAgY29sb3I6IFwiI0ZGQ0NCQ1wiXG4gICAgICAgICAgc3BhY2VyOiAwXG4gICAgICAgIH1cbiAgICAgICAgeyAgICAgICAgICAgXG4gICAgICAgICAgbmFtZTogXCJUb3RhbFwiXG4gICAgICAgICAgZ3JvdXA6ICdSZXB0aWxlcydcbiAgICAgICAgICB2YWx1ZTogbWF4X3JlcHRpbGVzXG4gICAgICAgICAgY29sb3I6IFwiI0IzRTVGQ1wiXG4gICAgICAgICAgc3BhY2VyOiBncm91cF9nYXBcbiAgICAgICAgfVxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogXCJTa2V0Y2hcIlxuICAgICAgICAgIGdyb3VwOiAnJ1xuICAgICAgICAgIHZhbHVlOiBudW1fcmVwdGlsZXNcbiAgICAgICAgICBjb2xvcjogXCIjQjNFNUZDXCJcbiAgICAgICAgICBzcGFjZXI6IDBcbiAgICAgICAgfVxuICAgICAgICB7ICAgICAgICAgICBcbiAgICAgICAgICBuYW1lOiBcIlRvdGFsXCJcbiAgICAgICAgICBncm91cDogJ0JpcmRzJ1xuICAgICAgICAgIHZhbHVlOiBtYXhfYmlyZHNcbiAgICAgICAgICBjb2xvcjogXCIjRkZDREQyXCJcbiAgICAgICAgICBzcGFjZXI6IGdyb3VwX2dhcFxuICAgICAgICB9XG4gICAgICAgIHsgICAgICAgICAgIFxuICAgICAgICAgIG5hbWU6IFwiU2tldGNoXCJcbiAgICAgICAgICBncm91cDogJydcbiAgICAgICAgICB2YWx1ZTogbnVtX2JpcmRzXG4gICAgICAgICAgY29sb3I6IFwiI0ZGQ0REMlwiXG4gICAgICAgICAgc3BhY2VyOiAwXG4gICAgICAgIH1cbiAgICAgICAgeyAgICAgICAgICAgXG4gICAgICAgICAgbmFtZTogXCJUb3RhbFwiXG4gICAgICAgICAgZ3JvdXA6ICdNYW1tYWxzJ1xuICAgICAgICAgIHZhbHVlOiBtYXhfbWFtbWFsc1xuICAgICAgICAgIGNvbG9yOiBcIiNGNEZGODFcIlxuICAgICAgICAgIHNwYWNlcjogZ3JvdXBfZ2FwXG4gICAgICAgIH1cbiAgICAgICAgeyAgICAgICAgICAgXG4gICAgICAgICAgbmFtZTogXCJTa2V0Y2hcIlxuICAgICAgICAgIGdyb3VwOiAnJ1xuICAgICAgICAgIHZhbHVlOiBudW1fbWFtbWFsc1xuICAgICAgICAgIGNvbG9yOiBcIiNGNEZGODFcIlxuICAgICAgICAgIHNwYWNlcjogMFxuICAgICAgICB9XG4gICAgXVxuICAgIFxuICAgIG51bV9iYXJzID0gMTBcbiAgICBtYXJnaW5zID0ge3RvcDogMTIsIHJpZ2h0OiAxMCwgYm90dG9tOiAxOCwgbGVmdDogMTV9XG4gICAgaWYgd2luZG93LmQzXG5cbiAgICAgIHdpZHRoID0gIDQ0MCAtIChtYXJnaW5zLmxlZnQgKyBtYXJnaW5zLnJpZ2h0KVxuICAgICAgaGVpZ2h0ID0gMzgwIC0gKG1hcmdpbnMudG9wICsgbWFyZ2lucy5ib3R0b20pXG5cbiAgICAgIHhheGlzX29mZnNldCA9IGhlaWdodC1tYXJnaW5zLmJvdHRvbVxuICAgICAgeGF4aXNfbGFiZWxzID0gaGVpZ2h0LW1hcmdpbnMudG9wKzJcbiAgICAgIHlvZmYgPSBtYXJnaW5zLmJvdHRvbSotMVxuICAgICAgeSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFtoZWlnaHQsIDBdKVxuXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKCkucmFuZ2UoWzAsIHdpZHRoXSlcblxuICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh4KVxuICAgICAgICAudGlja3MoMClcbiAgICAgICAgLm9yaWVudChcImJvdHRvbVwiKVxuXG4gICAgICB5QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHkpXG4gICAgICAgIC50aWNrcygwKVxuICAgICAgICAub3JpZW50KFwibGVmdFwiKVxuXG4gICAgICBlbCA9IEAkKCcuY2hhcnQnKVswXVxuICAgICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgrbWFyZ2lucy5sZWZ0K21hcmdpbnMucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCttYXJnaW5zLnRvcCttYXJnaW5zLmJvdHRvbSlcbiAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW5zLmxlZnQgKyBcIixcIiArIG1hcmdpbnMudG9wICsgXCIpXCIpXG5cbiAgICAgIGNoYXJ0LmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgeGF4aXNfb2Zmc2V0ICsgXCIpXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuXG5cbiAgICAgIGNoYXJ0LmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiK3lvZmYrXCIpXCIpXG4gICAgICAgIC5jYWxsKHlBeGlzKVxuXG4gICAgICBjaGFydC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDAgLSBtYXJnaW5zLmxlZnQpXG4gICAgICAgIC5hdHRyKFwieFwiLCAwIC0gKGhlaWdodCAvIDIpKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiMWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KFwiTnVtYmVyIG9mIEhhYml0YXRzIG9yIFNwZWNpZXNcIilcblxuXG4gICAgICB5LmRvbWFpbihbMCwgaGVpZ2h0XSk7XG5cblxuICAgICAgYmFyV2lkdGggPSAoKHdpZHRoIC0gbnVtX2dyb3VwX2dhcHMqZ3JvdXBfZ2FwKSAvIG51bV9iYXJzKSBcblxuICAgICAgZWwgPSBAJCgnLmJhcicpWzBdXG4gICAgICBiYXIgPSBjaGFydC5zZWxlY3RBbGwoZWwpXG4gICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIChkLCBpKSAtPiAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgaSAqIGJhcldpZHRoICsgXCIsMClcIilcblxuXG4gICAgICBiYXIuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gcmV0dXJuIGQuc3BhY2VyKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gcmV0dXJuIHkoZC52YWx1ZSkgLSBtYXJnaW5zLmJvdHRvbSlcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoZCkgLT4gcmV0dXJuIChoZWlnaHQgKSAtIHkoZC52YWx1ZSkpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAoZCkgLT4gcmV0dXJuIGJhcldpZHRoKVxuICAgICAgICAgIC5zdHlsZShcImZpbGxcIiwgIChkKSAtPiByZXR1cm4gZC5jb2xvcilcbiAgICAgICAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXG5cbiAgICAgIGJhci5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoYmFyV2lkdGggLyAyKStkLnNwYWNlcilcbiAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHJldHVybiB5KGQudmFsdWUpIC0gbWFyZ2lucy5ib3R0b20gLSAxMClcbiAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjc1ZW1cIilcbiAgICAgICAgICAudGV4dCgoZCkgLT4gIHJldHVybiBkLnZhbHVlKVxuXG4gICAgICBiYXIuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKGJhcldpZHRoIC8gMikrZC5zcGFjZXIpXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiByZXR1cm4geGF4aXNfbGFiZWxzKVxuICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuNzVlbVwiKVxuICAgICAgICAgIC5zdHlsZShcImZvbnRcIiwgXCI4cHggc2Fucy1zZXJpZlwiKVxuICAgICAgICAgIC50ZXh0KChkKSAtPiAgcmV0dXJuIGQubmFtZSlcblxuICAgICAgYmFyLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiByZXR1cm4gZC5zcGFjZXIrYmFyV2lkdGgpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gcmV0dXJuIHhheGlzX2xhYmVscysxNClcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuNzVlbVwiKVxuICAgICAgICAuc3R5bGUoXCJmb250XCIsIFwiMTJweCBzYW5zLXNlcmlmXCIpXG4gICAgICAgIC5zdHlsZShcImZvbnQtd2VpZ2h0XCIsIFwiYm9sZFwiKVxuICAgICAgICAudGV4dCgoZCkgLT4gIHJldHVybiBkLmdyb3VwKVxuXG4gIGFkZENvbW1hczogKG51bV9zdHIpID0+XG4gICAgbnVtX3N0ciArPSAnJ1xuICAgIHggPSBudW1fc3RyLnNwbGl0KCcuJylcbiAgICB4MSA9IHhbMF1cbiAgICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICAgIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgICB3aGlsZSByZ3gudGVzdCh4MSlcbiAgICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICAgIHJldHVybiB4MSArIHgyXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXcuY29mZmVlJ1xuXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL3JlcG9ydC5jc3MnXVxuIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibmV3QXJlYU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc1dpdGhpblJlc2VydmVcIixjLHAsMSksYyxwLDAsNjYsMjMwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgc3R5bGU9XFxcImxhcmdlXFxcIj48Yj5cIik7Xy5iKF8udihfLmYoXCJhb2lfbmFtZVwiLGMscCwwKSkpO18uYihcIjwvYj4gaXMgPGI+XCIpO18uYihfLnYoXy5mKFwiYW9pX3NpemVcIixjLHAsMCkpKTtfLmIoXCIgYWNyZXM8L2I+IGFuZCBpcyB3aXRoaW4gdGhlIDxiPjxhIGhyZWY9XCIpO18uYihfLnYoXy5mKFwiYW9pX3Jlc191cmxcIixjLHAsMCkpKTtfLmIoXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlwiKTtfLmIoXy52KF8uZihcImFvaV9yZXNfbmFtZVwiLGMscCwwKSkpO18uYihcIjwvYT48L2I+LjwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNXaXRoaW5SZXNlcnZlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwyOTUsMzgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHAgc3R5bGU9XFxcImxhcmdlXFxcIj48Yj5cIik7Xy5iKF8udihfLmYoXCJhb2lfbmFtZVwiLGMscCwwKSkpO18uYihcIjwvYj4gaXMgPGI+XCIpO18uYihfLnYoXy5mKFwiYW9pX3NpemVcIixjLHAsMCkpKTtfLmIoXCIgYWNyZXM8L2I+LjwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxwIHN0eWxlPVxcXCJsYXJnZVxcXCI+PGI+XCIpO18uYihfLnYoXy5mKFwiYW9pX25hbWVcIixjLHAsMCkpKTtfLmIoXCI8L2I+IGlzIDxiPlwiKTtfLmIoXy52KF8uZihcImFvaV9zaXplXCIsYyxwLDApKSk7Xy5iKFwiIGFjcmVzPC9iPjsgaXQgaXMgbm90IHdpdGhpbiBhbiBleGlzdGluZyByZXNlcnZlLjwvcD5cIik7Xy5iKFwiXFxuXCIpO307fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+TnVtYmVyIG9mIEhhYml0YXRzIGluICdcIik7Xy5iKF8udihfLmYoXCJza2V0Y2hfbmFtZVwiLGMscCwwKSkpO18uYihcIic8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMCw3MDAsODUwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxkaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImhhYl9waWVcXFwiIGlkPVxcXCJoYWJfcGllXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiaGFiX3BpZV9sZWdlbmRcXFwiIGlkPVxcXCJoYWJfcGllX2xlZ2VuZFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgJ1wiKTtfLmIoXy52KF8uZihcInNrZXRjaF9uYW1lXCIsYyxwLDApKSk7Xy5iKFwiJyBpbmNsdWRlcyA8Yj5cIik7Xy5iKF8udihfLmYoXCJmb3VuZF9oYWJzXCIsYyxwLDApKSk7Xy5iKFwiPC9iPiBvZiB0aGUgPGI+XCIpO18uYihfLnYoXy5mKFwidG90YWxfaGFic1wiLGMscCwwKSkpO18uYihcIjwvYj4gQ1dIUiBoYWJpdGF0cyB3aXRoaW4gQ2FsaWZvcm5pYS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0Pk1pc3NpbmcgSGFiaXRhdHMgKFwiKTtfLmIoXy52KF8uZihcIm1pc3NpbmdfaGFiX2NvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcInRvdGFsX2hhYnNcIixjLHAsMCkpKTtfLmIoXCIpPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5IYWJpdGF0IE5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtaXNzaW5nX2hhYnNcIixjLHAsMSksYyxwLDAsMTMzOCwxNDE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0PkhhYml0YXRzIEZvdW5kIChcIik7Xy5iKF8udihfLmYoXCJmb3VuZF9oYWJzXCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcInRvdGFsX2hhYnNcIixjLHAsMCkpKTtfLmIoXCIpPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+SGFiaXRhdCBOYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYnNcIixjLHAsMSksYyxwLDAsMTcyNywxNzk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkFyZWEgb2YgSW50ZXJlc3Q8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHAgc3R5bGU9XFxcImxhcmdlXFxcIj48Yj5cIik7Xy5iKF8udihfLmYoXCJhb2lfbmFtZVwiLGMscCwwKSkpO18uYihcIjwvYj4gaXMgPGI+XCIpO18uYihfLnYoXy5mKFwiYW9pX3NpemVcIixjLHAsMCkpKTtfLmIoXCIgYWNyZXM8L2I+IGFuZCBpcyB3aXRoaW4gdGhlIDxiPjxhIGhyZWY9XCIpO18uYihfLnYoXy5mKFwiYW9pX3Jlc191cmxcIixjLHAsMCkpKTtfLmIoXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlwiKTtfLmIoXy52KF8uZihcImFvaV9yZXNfbmFtZVwiLGMscCwwKSkpO18uYihcIjwvYT48L2I+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk51bWJlciBvZiBDV0hSIEhhYml0YXRzIGFuZCBTcGVjaWVzIGluIFNrZXRjaDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxzdmcgY2xhc3M9XFxcImNoYXJ0XFxcIj48L3N2Zz5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwIHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoyMHB4O1xcXCI+PGk+SGFiaXRhdCBhbmQgc3BlY2llcyBkYXRhIGlzIGZyb20gPGEgaHJlZj1cXFwiaHR0cHM6Ly93d3cuZGZnLmNhLmdvdi9iaW9nZW9kYXRhL2N3aHIvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgPkNhbGlmb3JuaWEgV2lsZGxpZmUgSGFiaXRhdCBSZWxhdGlvbnNoaXBzIChDV0hSKTwvYT4uIFRoZSByZXBvcnRzIGJlbG93IGRldGFpbCB0aGUgaGFiaXRhdCBhbmQgc3BlY2llcyB3aXRoaW4gdGhlIHNrZXRjaC48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5IYWJpdGF0cyBpbiBTa2V0Y2g8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFic1wiLGMscCwxKSxjLHAsMCw3NDYsODE2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CaXJkIFNwZWNpZXMgaW4gU2tldGNoPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIyNVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+Q29tbW9uIE5hbWUgKFNjaWVudGlmaWMgTmFtZSk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYmlyZHNcIixjLHAsMSksYyxwLDAsMTExMSwxMTgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+QW1waGJpYW4gU3BlY2llcyBpbiBTa2V0Y2g8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5Db21tb24gTmFtZSAoU2NpZW50aWZpYyBOYW1lKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhbXBoaWJpYW5zXCIsYyxwLDEpLGMscCwwLDE0ODQsMTU1NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+UmVwdGlsZSBTcGVjaWVzIGluIFNrZXRjaDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDx0YWJsZSAgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5Db21tb24gTmFtZSAoU2NpZW50aWZpYyBOYW1lKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJyZXB0aWxlc1wiLGMscCwxKSxjLHAsMCwxODYwLDE5MzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5NYW1tYWwgU3BlY2llcyBpbiBTa2V0Y2g8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5Db21tb24gTmFtZSAoU2NpZW50aWZpYyBOYW1lKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtYW1tYWxzXCIsYyxwLDEpLGMscCwwLDIyMjksMjI5OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==

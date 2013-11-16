$(document).ready( function() {
	db = new Db();
	list = new List();
	add = new Add();
	chart = new Chart();
	db.checkLogin();
	list.init();
	add.init();
	chart.init();









	Handlebars.registerHelper('list', function(context, options) {
		var ret = '';
		for(var i=0; i<context.length; i++) {
			ret += options.fn(context[i]);
		}
		return ret;
	});

	Handlebars.registerHelper('everyNth', function(context, every, options) {
		var fn = options.fn, inverse = options.inverse;
		var ret = "";
		if(context && context.length > 0) {
			for(var i=0, j=context.length; i<j; i++) {
				var modZero = i % every === 0;
				ret = ret + fn($.extend({}, context[i], {
					isModZero: modZero,
					isModZeroNotFirst: modZero && i > 0,
					isLast: i === context.length - 1
				}));
			}
		} else {
			ret = inverse(this);
		}
		return ret;
	});
});
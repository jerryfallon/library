$(document).ready( function() {
	db = new Db();
	list = new List();
	add = new Add();
	db.checkLogin();
	list.init();
	add.init();









	Handlebars.registerHelper('list', function(context, options) {
		var ret = '';
		for(var i=0; i<context.length; i++) {
			ret += options.fn(context[i]);
		}
		return ret;
	});
});
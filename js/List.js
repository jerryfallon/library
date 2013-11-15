function List() {
	this.type = 'movies';
	this.sort = [];
	this.groupsLoaded = 1;

	this.initHandlers();
}

List.prototype.init = function() {
	this.populateDropDowns();

	this.updateList();
};

List.prototype.initHandlers = function() {
	var that = this;

	$('.list-form').on('change keyup', function() {
		that.updateList();
	});

	$('#results-table').on('mouseover mouseout', 'tr', function() {
		$(this).toggleClass('hover');
	});

	$('.nav-button').click( function() {
		$('.nav-button').removeClass('selected');
		$(this).addClass('selected');
		var id = $(this).data('section');
		that.showSection(id);
		if(id === 'movies' || id === 'games') {
			$('#results').show();
			that.type = id;
			that.updateList();
		} else {
			$('#results').hide();
			if(id === 'add') {
				add.resetForm();
				$('#form-success').html('');
			}
		}
	});

	$('#username, #password').keypress( function(e) {
		if(e.which === 13) {
			var user = $('#username').val();
			var pass = $('#password').val();
			db.login(user, pass);
		}
	});

	$('#login-button').click( function() {
		var user = $('#username').val();
		var pass = $('#password').val();
		db.login(user, pass);
	});

	$('.sort').click( function() {
		var col = $(this).data('column');
		if(col === 'rating') {
			var sort = 'DESC';
		} else {
			var sort = 'ASC';
		}
		var data = [{
			column: col,
			order: sort
		}];
		that.sort = data;
		that.updateList();
	});

	// $('#results').scroll( function() {
	// 	var scrollTop = $(this).scrollTop();
	// 	var height = $(this).height();
	// 	if(scrollTop >= height) {
	// 		that.loadNextGroup();
	// 	}
	// });
};

List.prototype.displayMatches = function(results, reset) {
	//console.log(results);
	if(reset) {
		$('.result-row').remove();
	}
	$('#loading-note').hide();
	$('#no-results').hide();
	var count = 0;
	if(results.length) {
		var source = $('#template-result-row').html();
		var template = Handlebars.compile(source);
		var context;
		var html = '';

		var idCol = this.getIdType();

		var result;
		var lastId = 0;
		var genIds;

		for(var i in results) {
			result = results[i];
			context = {
				id: result[idCol],
				rating: result.rating * 5,
				title: result.title,
				location: result.location,
				system: result.sysId,
				seen: result.seen,
				beaten: result.beaten,
				genIds: []
			}
			if(result.genIds) {
				genIds = result.genIds.split(',');
				for(var j in genIds) {
					context.genIds.push({ id: genIds[j] });
				}
			}
			//console.log(context);
			html += template(context);
		}
		$('#results-table').append(html);

		if($.cookie('usrId')) {
			$('.result-row').css('cursor', 'pointer');
		}
	} else {
		$('#no-results').show();
	}
	$('#results-count').text(results.length + ' results');
	this.toggleFields();
};

List.prototype.getFilters = function() {
	var filters = [];
	if(this.type === 'movies') {
		if($('#movies-checked-out').is(':checked')) {
			filters.push({ column: 'location', condition: 'not', value: 'In Stock' });
		}
		if($('#movies-unseen').is(':checked')) {
			filters.push({ column: 'seen', value: '0' });
		}
		if($('#movies-rating').val()) {
			filters.push({ column: 'rating', value: $('#movies-rating').val() });
		}
		if($('#movies-title').val()) {
			filters.push({ column: 'title', value: $('#movies-title').val() });
		}
		if($('#movies-genre').val()) {
			filters.push({ column: 'g.genId', condition: 'equals', value: $('#movies-genre').val() });
		}
	} else if(this.type === 'games') {
		if($('#games-checked-out').is(':checked')) {
			filters.push({ column: 'location', condition: 'not', value: 'In Stock' });
			filters.push({ column: 'location', condition: 'not', value: 'In Stock - HD' });
		}
		if($('#games-beaten').val()) {
			filters.push({ column: 'beaten', value: $('#games-beaten').val() });
		}
		if($('#games-rating').val()) {
			filters.push({ column: 'rating', value: $('#games-rating').val() });
		}
		if($('#games-title').val()) {
			filters.push({ column: 'title', value: $('#games-title').val() });
		}
		if($('#games-system').val()) {
			filters.push({ column: 's.sysId', condition: 'equals', value: $('#games-system').val() });
		}
		if($('#games-genre').val()) {
			filters.push({ column: 'g.genId', condition: 'equals', value: $('#games-genre').val() });
		}
	}

	return filters;
}

List.prototype.getIdType = function() {
	if(this.type === 'movies') {
		return 'movId';
	} else if(this.type === 'games') {
		return 'gamId';
	}
};

List.prototype.loadNextGroup = function() {
	var that = this;
	var filters = this.getFilters();
	var sort = sort || [];
	sort.push({ column: 'alphabeticaltitle', order: 'ASC' });

	var limit = { start: this.groupsLoaded * 100 };

	db.select(this.type, JSON.stringify(filters), JSON.stringify(sort), JSON.stringify(limit), function(results) {
		that.displayMatches(results);
		that.groupsLoaded++;
	});
};

List.prototype.populateDropDown = function(node, data) {
	var source = $('#template-options').html();
	var template = Handlebars.compile(source);
	var context;
	var html = '';
	for(var i in data) {
		context = data[i];
		html += template(context);
	}
	node.html(html);
};

List.prototype.populateDropDowns = function() {
	var that = this;

	// Ratings
	var data = [{ value: "", text: "All" }]
	for(var i = 10; i > 0; i--) {
		data.push({ value: i, text: i });
	}
	var node = $('#movies-rating');
	this.populateDropDown(node, data);
	node = $('#games-rating');
	this.populateDropDown(node, data);

	// Genres
	this.populateGenreDropDowns('movies');
	this.populateGenreDropDowns('games');

	// Status
	node = $('#games-beaten');
	data = [{ value: "", text: "" }, { value: "1", text: "Beaten" }, { value: "0", text: "Nope"}];
	this.populateDropDown(node, data);


	// Systems
	node = $('#games-system');
	db.getSystems( function(systems) {
		var data = [{ value: "", text: "" }];
		var system;
		for(var i in systems) {
			system = systems[i];
			data.push({ value: system.sysId, text: system.systemname });
		}
		that.populateDropDown(node, data);
	});
};

List.prototype.populateGenreDropDowns = function(type) {
	var node = $('#'+type+'-genre');
	var that = this;
	db.getGenres(type, function(genres) {
		var data = [{ value: "", text: "" }];
		var genre;
		for(var i in genres) {
			genre = genres[i];
			data.push({ value: genre.genId, text: genre.genrename });
		}
		that.populateDropDown(node, data);
	});
};

List.prototype.setupEditFunctionality = function() {
	var that = this;
	$('#results-table').on('click', '.result-row', function() {
		var id = $(this).data('id');
		$('.nav-button[data-section=add]').click();
		add.editEntry(that.type, id);
	});

	$('.result-row').css('cursor','pointer');

	$('.nav-button[data-section=add]').show();
};

List.prototype.showSection = function(id) {
	$('.section').hide();
	$('#'+id).show();
};

List.prototype.toggleFields = function() {
	if(this.type === 'games') {
		$('.games-field').show();
		$('.movies-field').hide();
	} else {
		$('.games-field').hide();
		$('.movies-field').show();
	}
};

List.prototype.updateList = function() {
	var that = this;
	var filters = this.getFilters();
	var sort = this.sort || [];
	sort.push({ column: 'alphabeticaltitle', order: 'ASC' });

	var limit = { start: 0 };

	db.select(this.type, JSON.stringify(filters), JSON.stringify(sort), JSON.stringify(limit), function(results) {
		that.displayMatches(results, true);
		that.groupsLoaded = 1;
	});
};
function Add() {
	this.type;
	this.initHandlers();

	this.schema = {
		'movies': [
			{ title: 'Title', type: 'text', field: 'title', rules: ['notnull'] },
			{ title: 'Alphabetical Title', type: 'text', field: 'alphabeticaltitle', rules: ['notnull'] },
			{ title: 'Genre', type: 'multiple', field: 'genre', data: [] },
			{ title: 'Location', type: 'text', field: 'location', value: 'In Stock' },
			{ title: 'Seen', type: 'checkbox', field: 'seen' },
			{ title: 'Rating', type: 'text', field: 'rating', value: 0, rules: ['number'] },
			{ title: 'Discs', type: 'text', field: 'discs', value: 1, rules: ['number'] },
			{ type: 'submit' }
		],
		'games': [
			{ title: 'Title', type: 'text', field: 'title', rules: ['notnull'] },
			{ title: 'Alphabetical Title', type: 'text', field: 'alphabeticaltitle', rules: ['notnull'] },
			{ title: 'Genre', type: 'multiple', field: 'genre', data: [] },
			{ title: 'Location', type: 'text', field: 'location', value: 'In Stock' },
			{ title: 'System', type: 'select', field: 'sysId', data: [], rules: ['notnull'] },
			{ title: 'Beaten', type: 'checkbox', field: 'beaten' },
			{ title: 'Rating', type: 'text', field: 'rating', value: 0, rules: ['number'] },
			{ title: 'Discs', type: 'text', field: 'discs', value: 1, rules: ['number'] },
			{ type: 'submit' }
		]
	};

	this.stripCharacters = [' ', '_', '-', '.', ',', ';', ':', '\'', '\\'];
	this.badStartWords = ['A', 'An', 'The'];
	this.autoBuildAlphabeticalTitle = true;

	this.gamesGenres = [];
	this.moviesGenres = [];
	this.systems = [];

	this.searchResults = [];
}

Add.prototype.init = function() {
	var that = this;
	this.getGenres('games', function() {
		that.getGenres('movies', function() {
			that.getSystems( function() {
				that.buildForms();
			});
		});
	});
};

Add.prototype.initHandlers = function() {
	var that = this;

	$('.form-type-button').click( function() {
		that.type = $(this).data('type');
		$('.form-type-button').removeClass('toggled');
		$(this).addClass('toggled');
		that.toggleForm();
		that.resetForm();
	});

	$(document).on('click', '.form-submit', function() {
		that.submitForm();
	});

	$('.add-form').on('keyup', '#movies-title-field, #games-title-field', function() {
		var val = $(this).val();
		if(val) {
			that.search(val);
		} else {
			$('#search-results').html('');
		}

		if(that.autoBuildAlphabeticalTitle) {
			that.buildAlphabeticalTitle($(this).val());
		}
	});

	$('#search-results').on('click', '.search-result', function(){
		var id = $(this).data('id');
		that.populateForm(id);
	});
};

Add.prototype.addCheckboxField = function(title, type, field) {
	var source = $('#template-checkbox-field').html();
	var template = Handlebars.compile(source);
	var context = {
		title: title,
		type: type,
		field: field
	};
	$('#'+type+'-form').append(template(context));
};

Add.prototype.addMultipleField = function(title, type, field, results) {
	var source = $('#template-multiple-field').html();
	var template = Handlebars.compile(source);
	var context = {
		title: title,
		type: type,
		field: field,
		options: results
	};
	$('#'+type+'-form').append(template(context));
};

Add.prototype.addSelectField = function(title, type, field, results) {
	var source = $('#template-select-field').html();
	var template = Handlebars.compile(source);
	var context = {
		title: title,
		type: type,
		field: field,
		options: results
	};
	$('#'+type+'-form').append(template(context));
};

Add.prototype.addSubmitField = function(type) {
	var source = $('#template-submit-field').html();
	var template = Handlebars.compile(source);
	var context = {
		type: type
	};
	$('#'+type+'-form').append(template(context));
};

Add.prototype.addTextField = function(title, type, field, value) {
	var source = $('#template-text-field').html();
	var template = Handlebars.compile(source);
	var context = {
		title: title,
		type: type,
		field: field,
		value: value
	};
	$('#'+type+'-form').append(template(context));
};

Add.prototype.buildAlphabeticalTitle = function(val) {
	//console.log('converting "' + val + '"');
	
	var word, cha;
	for(var i in this.badStartWords) {
		word = this.badStartWords[i];
		val = this.replaceStart(word + ' ', '', val);
	}
	//console.log('after removing starting articles: ' + val);

	for(i in this.stripCharacters) {
		cha = this.stripCharacters[i];
		val = this.replaceAll(cha, '', val);
	}
	//console.log('after stripping characters: ' + val);

	$('#' + this.type + '-alphabeticaltitle-field').val(val);
};

Add.prototype.buildForms = function() {
	var that = this;
	
	var type, field;
	for(var i in this.schema) {
		type = i;
		for(var j in this.schema[i]) {
			field = this.schema[i][j];
			//console.log(field);
			switch(field.type) {
				case 'text':
					this.addTextField(field.title, type, field.field, field.value);
					break;

				case 'select':
					switch(field.field) {
						case 'genre':
							this.addSelectField(field.title, type, field.field, this[type + 'Genres']);
							break;

						case 'sysId':
							this.addSelectField(field.title, type, field.field, this.systems);
							break;
					}
					break;

				case 'checkbox':
					this.addCheckboxField(field.title, type, field.field);
					break;

				case 'submit':
					this.addSubmitField(type);
					break;

				case 'multiple':
					this.addMultipleField(field.title, type, field.field, this[type + 'Genres']);
					break;
			}
		}
	}
};

Add.prototype.editEntry = function(type, id) {
	this.type = type;
	$('#entry-id').val(id);
	var that = this;
	this.search(id, 'x.'+this.getIdType(), function() {
		that.populateForm(id);
		$('.search-result').remove();
	});

	$('.add-form').hide();
	$('#'+this.type+'-form').show();
	$('.form-type-button').removeClass('toggled');
	$('.form-type-button[data-type='+this.type+']').addClass('toggled');
};

Add.prototype.gatherData = function() {
	var data = [];
	var field, num;
	for(var i in this.schema[this.type]) {
		field = this.schema[this.type][i];
		if(field.type !== 'submit') {
			col = field.field;
			if(field.type === 'text' || field.type === 'select') {
				val = $('#'+this.type+'-'+col+'-field').val();
			} else if(field.type === 'checkbox') {
				if($('#'+this.type+'-'+col+'-field').prop('checked') === true) {
					val = 1;
				} else {
					val = 0;
				}
			} else if(field.type === 'multiple') {
				val = [];
				if(col === 'genre') {
					for(var j in this[this.type+'Genres']) {
						genre = this[this.type+'Genres'][j];
						if($('#'+this.type+'-'+col+'-'+genre.genId).prop('checked') === true) {
							val.push(genre.genId);
						}
					}
				}
			}
			data.push({column: col, value: val});
		}
	}
	//console.log(JSON.stringify(data));
	return data;
};

Add.prototype.getGenres = function(type, cb) {
	var that = this;
	db.getGenres(type, function(results) {
		//results.unshift({});
		that[type + 'Genres'] = results;
		if(typeof cb === 'function') {
			cb();
		}
	});
};

Add.prototype.getIdType = function() {
	if(this.type === 'movies') {
		return 'movId';
	} else if(this.type === 'games') {
		return 'gamId';
	}
};

Add.prototype.getSystems = function(cb) {
	var that = this;
	db.getSystems(function(results) {
		that.systems = results;
		if(typeof cb === 'function') {
			cb();
		}
	});
};

Add.prototype.populateForm = function(id) {
	var row, field, selector, val;
	var idCol = this.getIdType();
	for(var i in this.searchResults) {
		row = this.searchResults[i];
		if(id == row[idCol]) {
			//console.log(row);
			for(var j in this.schema[this.type]) {
				field = this.schema[this.type][j];
				selector = '#'+this.type+'-'+field.field+'-field';
				if(field.type === 'text' || field.type === 'select') {
					if(field.field === 'system') {
						col = 'sysId';
					} else {
						col = field.field;
					}
					val = row[col];
					$(selector).val(val);
				} else if(field.type === 'checkbox') {
					if(row[field.field] > 0) {
						$(selector).prop('checked', true);
					} else {
						$(selector).prop('checked', false);
					}
				} else if(field.type === 'multiple') {
					if(field.field === 'genre') {
						for(var k in row.genIds) {
							selector = '#'+this.type+'-'+field.field+'-'+row.genIds[k];
							$(selector).prop('checked', true);
						}
					}
				}
			}
			break;
		}
	}
};

Add.prototype.replaceAll = function(find, replace, str) {
  return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

Add.prototype.replaceStart = function(find, replace, str) {
  return str.replace(new RegExp('^' + find), replace);
};

Add.prototype.resetForm = function() {
	$('#entry-id').val('');
	var field, selector;
	for(var i in this.schema) {
		for(var j in this.schema[i]) {
			field = this.schema[i][j];

			selector = '#'+i+'-'+field.field+'-field';
			if(field.type === 'text' || field.type === 'select') {
				$(selector).val((field.value !== undefined ? field.value : ''));
			} else if(field.type === 'checkbox') {
				$(selector).prop('checked', false);
			} else if(field.type === 'multiple') {
				if(field.field === 'genre') {
					for(var k in this[i+'Genres']) {
						genre = this[i+'Genres'][k];
						selector = '#'+i+'-'+field.field+'-'+genre.genId;
						$(selector).prop('checked', false);
					}
				}
			}
		}
	}
	$('#search-results').html('');
	this.searchResults = [];
};

Add.prototype.search = function(val, col, cb) {
	var table = this.type;
	var filters = JSON.stringify([{column:(col?col:'title'), value: val}]);
	var sort = JSON.stringify([{column:'alphabeticaltitle', order: 'ASC'}]);
	var colId = this.getIdType();
	var that = this;
	var source = $('#template-search-result').html();
	var template = Handlebars.compile(source);
	db.select(table, filters, sort, function(results) {
		that.searchResults = results;
		var html = '';
		var row, context;
		for(var i in results) {
			row = results[i];
			//console.log(row);
			context = {
				id: row[colId],
				title: row.title
			}
			html += template(context);
		}
		$('#search-results').html(html);

		if(typeof cb === 'function') {
			cb();
		}
	});
};

Add.prototype.submitForm = function() {
	var that = this;
	if(this.validateForm()) {
		if($('#entry-id').val()) {
			var where = { column: this.getIdType(), value: $('#entry-id').val() };
			db.updateData(this.type, this.gatherData(), where, function(results) {
				$('.nav-button[data-section='+that.type+']').click();
			});
		} else {
			db.addData(this.type, this.gatherData(), function(results) {
				console.log(results);
				$('#form-success').text('#' + results + ' added to ' + that.type + ' successfully').show();
				that.resetForm();
			});
		}
	}
};

Add.prototype.toggleForm = function() {
	$('.add-form').hide();
	$('#'+this.type+'-form').show();
};

Add.prototype.validateForm = function() {
	var field, val, rule;
	var pass = true;
	var err = '';
	for(var i in this.schema[this.type]) {
		field = this.schema[this.type][i];
		if(field.rules) {
			val = $('#' + this.type + '-' + field.field + '-field').val();
			for(var j in field.rules) {
				rule = field.rules[j];

				switch(rule) {
					case 'notnull':
						if(val === "") {
							pass = false;
							err += field.field + ' cannot be blank.<br/>';
						}
						break;

					case 'number':
						if(isNaN(val)) {
							pass = false;
							err += field.field + ' must be a number.<br/>';
						}
						break;
				}
			}
		}
	}
	if(err) {
		$('#form-errors').html(err).show();
	} else {
		$('#form-errors').hide();
	}
	return pass;
};
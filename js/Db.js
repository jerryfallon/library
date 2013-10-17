function Db() {
	this.apiUrl = 'php/api.php';
}

Db.prototype.addData = function(table, vals, cb) {
	console.log('add to table ' + table + 's');
	console.log(JSON.stringify(vals));
	var data = {
		command: 'addData',
		table: table,
		data: JSON.stringify(vals)
	};
	console.log(data);
	$.post(this.apiUrl, data, function(results) {
		if(typeof cb === 'function') {
			cb(results);
		}
	});
};

Db.prototype.checkLogin = function() {
	if($.cookie('usrId')) {
		this.loginSuccess($.cookie('usrId'));
	}
};

Db.prototype.getGenres = function(type, cb) {
	var data = {
		command: 'getGenres',
		type: type
	};
	$.post(this.apiUrl, data, function(results) {
		if(typeof cb === 'function') {
			cb(results);
		}
	}, 'json');
};

Db.prototype.getSystems = function(cb) {
	var data = {
		command: 'getSystems'
	};
	$.post(this.apiUrl, data, function(results) {
		if(typeof cb === 'function') {
			cb(results);
		}
	}, 'json');
};

Db.prototype.login = function(user, pass) {
	var that = this;
	var data = {
		command: 'login',
		user: user,
		pass: CryptoJS.SHA3(pass).toString()
	};
	$.post(this.apiUrl, data, function(results) {
		if(results.length) {
			that.loginSuccess(results[0].usrId);
		}
	}, 'json');
};

Db.prototype.loginSuccess = function(usrId) {
	$.cookie('usrId', usrId, { expires: 31 });
	$('.nav-button[data-section="movies"]').click();
	$('.nav-button[data-section="login"]').hide();
	list.setupEditFunctionality();
};

Db.prototype.select = function(table, filters, sort, cb) {
	// Fake overloading
	if(typeof filters === 'function') {
		cb = filters;
		filters = '';
		sort = '';
	} else if(typeof sort === 'function') {
		cb = sort;
		sort = '';
	}

	var data = {
		command: 'getData',
		table: table,
		filters: filters,
		sort: sort
	};
	//console.log(data);
	$.post(this.apiUrl, data, function(results) {
		if(typeof cb === 'function') {
			cb(results);
		}
	}, 'json');
};

Db.prototype.updateData = function(table, vals, where, cb) {
	//console.log('update table ' + table + 's');
	//console.log(where);
	var data = {
		command: 'updateData',
		table: table,
		where: JSON.stringify(where),
		data: JSON.stringify(vals)
	};
	$.post(this.apiUrl, data, function(results) {
		if(typeof cb === 'function') {
			cb(results);
		}
	});
};